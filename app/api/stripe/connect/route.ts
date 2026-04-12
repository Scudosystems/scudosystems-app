import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import {
  createConnectAccount,
  createConnectOnboardingLink,
  getConnectAccount,
} from '@/lib/stripe'
import { absoluteUrl } from '@/lib/utils'
import type { Database } from '@/types/database'

type TenantConnectRow = Pick<Database['public']['Tables']['tenants']['Row'], 'id' | 'business_name' | 'owner_email' | 'stripe_connect_account_id' | 'stripe_connect_onboarded'>

/**
 * GET /api/stripe/connect
 * Returns the current Connect account status for the tenant.
 */
export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = createSupabaseAdminClient()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('stripe_connect_account_id, stripe_connect_onboarded')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  const typedTenant = tenant as TenantConnectRow | null

  if (!typedTenant?.stripe_connect_account_id) {
    return NextResponse.json({ connected: false, onboarded: false })
  }

  // Check live status from Stripe
  const account = await getConnectAccount(typedTenant.stripe_connect_account_id)
  const onboarded = account?.details_submitted ?? false

  // Keep DB in sync if status changed
  if (onboarded !== typedTenant.stripe_connect_onboarded) {
    await (supabase
      .from('tenants') as any)
      .update({ stripe_connect_onboarded: onboarded })
      .eq('user_id', user.id)
  }

  return NextResponse.json({
    connected: true,
    onboarded,
    accountId: typedTenant.stripe_connect_account_id,
  })
}

/**
 * POST /api/stripe/connect
 * Creates (or retrieves) a Connect account and returns an onboarding URL.
 */
export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const supabase = createSupabaseAdminClient()
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, business_name, owner_email, stripe_connect_account_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    const typedTenant = tenant as TenantConnectRow | null

    if (!typedTenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    let accountId = typedTenant.stripe_connect_account_id

    // Create account if one doesn't exist yet
    if (!accountId) {
      const account = await createConnectAccount(
        typedTenant.owner_email || user.email || '',
        typedTenant.business_name
      )
      accountId = account.id

      await (supabase
        .from('tenants') as any)
        .update({ stripe_connect_account_id: accountId })
        .eq('id', typedTenant.id)
    }

    // Generate fresh onboarding link
    const returnUrl = absoluteUrl('/dashboard/payments?connect=success')
    const refreshUrl = absoluteUrl('/dashboard/payments?connect=refresh')

    const link = await createConnectOnboardingLink(accountId, returnUrl, refreshUrl)

    return NextResponse.json({ url: link.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create Connect account'
    console.error('Stripe Connect error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
