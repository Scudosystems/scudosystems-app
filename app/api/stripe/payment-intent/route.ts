import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { createConnectedPaymentIntent, getPlatformFeePence } from '@/lib/stripe'
import type { Database } from '@/types/database'

type TenantPaymentRow = Pick<Database['public']['Tables']['tenants']['Row'], 'id' | 'vertical' | 'stripe_connect_account_id' | 'stripe_connect_onboarded'>
type ServicePaymentRow = Pick<Database['public']['Tables']['services']['Row'], 'id' | 'name' | 'price_pence' | 'deposit_pence' | 'requires_deposit'>

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tenantId, serviceId, bookingRef, customerEmail } = body || {}

    if (!tenantId || !serviceId) {
      return NextResponse.json({ error: 'Missing tenant or service' }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, vertical, stripe_connect_account_id, stripe_connect_onboarded')
      .eq('id', tenantId)
      .single()
    const typedTenant = tenant as TenantPaymentRow | null

    const { data: service } = await supabase
      .from('services')
      .select('id, name, price_pence, deposit_pence, requires_deposit')
      .eq('id', serviceId)
      .single()
    const typedService = service as ServicePaymentRow | null

    if (!typedTenant || !typedService) {
      return NextResponse.json({ error: 'Tenant or service not found' }, { status: 404 })
    }

    const amount = typedService.requires_deposit ? typedService.deposit_pence : typedService.price_pence
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'No payment required' }, { status: 400 })
    }

    if (!typedTenant.stripe_connect_account_id || !typedTenant.stripe_connect_onboarded) {
      return NextResponse.json({ error: 'connect_required' }, { status: 409 })
    }

    const platformFee = getPlatformFeePence(typedTenant.vertical as any)
    const metadata: Record<string, string> = {
      tenant_id: typedTenant.id,
      service_id: typedService.id,
      service_name: typedService.name,
      booking_ref: bookingRef || '',
      customer_email: customerEmail || '',
    }

    const intent = await createConnectedPaymentIntent(
      amount,
      typedTenant.stripe_connect_account_id,
      metadata,
      platformFee
    )

    return NextResponse.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amountPence: amount,
      platformFeePence: platformFee,
    })
  } catch (err) {
    console.error('Payment intent error:', err)
    return NextResponse.json({ error: 'Payment intent failed' }, { status: 500 })
  }
}
