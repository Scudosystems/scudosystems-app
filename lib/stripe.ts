import Stripe from 'stripe'
import type { VerticalId } from './verticals'

// Stripe is optional locally — app runs without it, payments just won't work
const stripeClient = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16', typescript: true })
  : null

export const stripe = stripeClient

const STRIPE_PRICE_IDS: Record<string, string> = (() => {
  const raw = process.env.STRIPE_PRICE_IDS_JSON
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch (err) {
    console.warn('Invalid STRIPE_PRICE_IDS_JSON')
    return {}
  }
})()

export function getStripePriceId(vertical: VerticalId) {
  return STRIPE_PRICE_IDS[vertical]
}

// ─── Monthly-only pricing helpers ─────────────────────────────────────────────
export function getPlatformFeePence(_vertical?: VerticalId | null): number {
  return 0
}

// ─── Subscriptions ────────────────────────────────────────────────────────────
export async function createStripeCustomer(email: string, name: string) {
  if (!stripe) throw new Error('Stripe not configured')
  return stripe.customers.create({ email, name })
}

export async function createSubscription(customerId: string, priceId: string, trialDays = 14) {
  if (!stripe) throw new Error('Stripe not configured')
  return stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    trial_period_days: trialDays,
    payment_settings: {
      payment_method_types: ['card'],
      save_default_payment_method: 'on_subscription',
    },
    expand: ['latest_invoice.payment_intent'],
  })
}

export async function createCheckoutSession(options: {
  customerId: string
  priceId: string
  successUrl: string
  cancelUrl: string
  trialDays?: number
}) {
  if (!stripe) throw new Error('Stripe not configured')
  return stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: options.customerId,
    line_items: [{ price: options.priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: options.trialDays ?? 14,
    },
    allow_promotion_codes: true,
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
  })
}

export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  if (!stripe) throw new Error('Stripe not configured')
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

// Job offers are free by default.

// ─── Optional payout onboarding helpers ───────────────────────────────────────
/**
 * Create an Express payout account for a tenant when direct payout onboarding is enabled.
 */
export async function createConnectAccount(email: string, businessName: string) {
  if (!stripe) throw new Error('Stripe not configured')
  return stripe.accounts.create({
    type: 'express',
    country: 'GB',
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_profile: { name: businessName },
    settings: {
      payouts: { schedule: { interval: 'daily' } },
    },
  })
}

/**
 * Generate an onboarding link for a tenant to complete payout setup.
 */
export async function createConnectOnboardingLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string
) {
  if (!stripe) throw new Error('Stripe not configured')
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  })
}

/**
 * Create a PaymentIntent that routes money to the tenant's account.
 * Application fees default to 0 while ScudoSystems is subscription-only.
 */
export async function createConnectedPaymentIntent(
  amountPence: number,
  connectedAccountId: string,
  metadata?: Record<string, string>,
  platformFeePence: number = 0
) {
  if (!stripe) throw new Error('Stripe not configured')
  return stripe.paymentIntents.create({
    amount: amountPence,
    currency: 'gbp',
    application_fee_amount: platformFeePence,
    transfer_data: { destination: connectedAccountId },
    automatic_payment_methods: { enabled: true },
    metadata: metadata || {},
  })
}

/**
 * Simple PaymentIntent (no Connect — for when tenant hasn't connected Stripe yet).
 */
export async function createPaymentIntent(amountPence: number, metadata?: Record<string, string>) {
  if (!stripe) throw new Error('Stripe not configured')
  return stripe.paymentIntents.create({
    amount: amountPence,
    currency: 'gbp',
    automatic_payment_methods: { enabled: true },
    metadata: metadata || {},
  })
}

export async function constructWebhookEvent(body: string, signature: string): Promise<Stripe.Event> {
  if (!stripe) throw new Error('Stripe not configured')
  return stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
}

/**
 * Retrieve a Connect account to check onboarding status.
 */
export async function getConnectAccount(accountId: string) {
  if (!stripe) return null
  return stripe.accounts.retrieve(accountId)
}
