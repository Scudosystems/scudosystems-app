import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { absoluteUrl } from '@/lib/utils'
import { createBillingPortalSession } from '@/lib/stripe'
import type { Database } from '@/types/database'

type TenantPortalRow = Pick<Database['public']['Tables']['tenants']['Row'], 'stripe_customer_id'>

export async function POST() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = createSupabaseAdminClient()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()
  const typedTenant = tenant as TenantPortalRow | null

  if (!typedTenant?.stripe_customer_id) {
    return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 })
  }

  const session = await createBillingPortalSession(
    typedTenant.stripe_customer_id,
    absoluteUrl('/dashboard/settings')
  )

  return NextResponse.json({ url: session.url })
}
