import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'
import type { Database } from '@/types/database'

type TenantDeleteRow = Pick<
  Database['public']['Tables']['tenants']['Row'],
  'id' | 'stripe_subscription_id' | 'stripe_customer_id'
>

export async function POST(_req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const admin = createSupabaseAdminClient()

    const { data: authData, error: authErr } = await supabase.auth.getUser()
    if (authErr || !authData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = authData.user

    const { data: tenant } = await admin
      .from('tenants')
      .select('id, stripe_subscription_id, stripe_customer_id')
      .eq('user_id', user.id)
      .single()
    const typedTenant = tenant as TenantDeleteRow | null

    // Cancel Stripe subscription if present
    if (stripe && typedTenant?.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(typedTenant.stripe_subscription_id)
      } catch (err) {
        console.warn('Stripe subscription cancel failed', err)
      }
    }

    // Optionally delete Stripe customer (safe to ignore errors)
    if (stripe && typedTenant?.stripe_customer_id) {
      try {
        await stripe.customers.del(typedTenant.stripe_customer_id)
      } catch (err) {
        console.warn('Stripe customer delete failed', err)
      }
    }

    // Delete auth user (cascades to tenant + data via FK)
    const { error: delErr } = await admin.auth.admin.deleteUser(user.id)
    if (delErr) throw delErr

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Delete account error:', err)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
