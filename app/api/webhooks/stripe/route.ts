import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { sendPaymentFailedEmail, sendTrialEndingEmail } from '@/lib/resend'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = await constructWebhookEvent(body, signature)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createSupabaseAdminClient()

  try {
    const customerId = (event.data.object as any)?.customer
    if (customerId) {
      await (supabase.from('tenants') as any).update({
        stripe_last_event_at: new Date().toISOString(),
        stripe_last_event_type: event.type,
      }).eq('stripe_customer_id', customerId)
    }

    switch (event.type) {
      case 'customer.subscription.created': {
        const sub = event.data.object as Stripe.Subscription
        const { data: tenant } = await supabase
          .from('tenants')
          .select('*')
          .eq('stripe_customer_id', sub.customer as string)
          .single()
        const typedTenant = tenant as { id: string } | null

        if (typedTenant) {
          await (supabase.from('tenants') as any).update({
            stripe_subscription_id: sub.id,
            plan_status: sub.status === 'trialing' ? 'trialing' : 'active',
            trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          }).eq('id', typedTenant.id)
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const planStatus = sub.status === 'trialing' ? 'trialing' :
                           sub.status === 'active' ? 'active' :
                           sub.status === 'past_due' ? 'past_due' : 'cancelled'

        await (supabase.from('tenants') as any).update({ plan: 'starter', plan_status: planStatus as any })
          .eq('stripe_customer_id', sub.customer as string)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await (supabase.from('tenants') as any).update({ plan_status: 'cancelled' })
          .eq('stripe_customer_id', sub.customer as string)
        break
      }

      case 'customer.subscription.trial_will_end': {
        // Fires 3 days before trial ends — send reminder email
        const sub = event.data.object as Stripe.Subscription
        const { data: tenant } = await supabase
          .from('tenants')
          .select('owner_email, business_name, trial_ends_at')
          .eq('stripe_customer_id', sub.customer as string)
          .single()
        const typedTenant = tenant as { owner_email?: string | null; business_name?: string | null; trial_ends_at?: string | null } | null

        if (typedTenant?.owner_email) {
          await sendTrialEndingEmail(typedTenant.owner_email, typedTenant.business_name || '')
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        // Ensure plan_status is active after successful payment
        await (supabase.from('tenants') as any).update({ plan_status: 'active' })
          .eq('stripe_customer_id', invoice.customer as string)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await (supabase.from('tenants') as any).update({ plan_status: 'past_due' })
          .eq('stripe_customer_id', invoice.customer as string)

        // Email the owner
        const { data: tenant } = await supabase.from('tenants').select('owner_email, business_name')
          .eq('stripe_customer_id', invoice.customer as string).single()
        const typedTenant = tenant as { owner_email?: string | null; business_name?: string | null } | null

        if (typedTenant?.owner_email) {
          await sendPaymentFailedEmail(typedTenant.owner_email, typedTenant.business_name || '')
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
