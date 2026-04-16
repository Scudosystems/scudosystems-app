import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { absoluteUrl } from '@/lib/utils'
import {
  createStripeCustomer,
  createCheckoutSession,
  getStripePriceId,
} from '@/lib/stripe'
import type { Database } from '@/types/database'

type TenantStripeRow = Pick<Database['public']['Tables']['tenants']['Row'], 'id' | 'business_name' | 'owner_email' | 'stripe_customer_id' | 'vertical'>

export async function POST() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = createSupabaseAdminClient()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, business_name, owner_email, stripe_customer_id, vertical')
    .eq('user_id', user.id)
    .single()
  const typedTenant = tenant as TenantStripeRow | null

  if (!typedTenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  if (!typedTenant.vertical) return NextResponse.json({ error: 'Industry not set' }, { status: 400 })

  const priceId = getStripePriceId(typedTenant.vertical as any)
  if (!priceId) {
    return NextResponse.json({ error: 'Stripe price not configured for this industry' }, { status: 500 })
  }

  let customerId = typedTenant.stripe_customer_id
  if (!customerId) {
    const email = typedTenant.owner_email || user.email || ''
    const customer = await createStripeCustomer(email, typedTenant.business_name)
    customerId = customer.id
    await (supabase.from('tenants') as any).update({ stripe_customer_id: customerId }).eq('id', typedTenant.id)
  }

  const session = await createCheckoutSession({
    customerId,
    priceId,
    successUrl: absoluteUrl('/dashboard/settings?billing=success'),
    cancelUrl: absoluteUrl('/dashboard/settings?billing=cancel'),
    trialDays: 14,
  })

  return NextResponse.json({ url: session.url })
}
