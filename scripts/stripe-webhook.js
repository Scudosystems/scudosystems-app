#!/usr/bin/env node
/* eslint-disable no-console */
const Stripe = require('stripe')

const SECRET_KEY = process.env.STRIPE_SECRET_KEY
if (!SECRET_KEY) {
  console.error('Missing STRIPE_SECRET_KEY. Set it in .env.local or your shell before running.')
  process.exit(1)
}

const args = process.argv.slice(2)
const urlIndex = args.indexOf('--url')
const url = urlIndex >= 0 ? args[urlIndex + 1] : null

if (!url) {
  console.error('Usage: node scripts/stripe-webhook.js --url https://www.scudosystems.com/api/webhooks/stripe')
  process.exit(1)
}

const stripe = new Stripe(SECRET_KEY, { apiVersion: '2024-04-10' })

const events = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
]

async function main() {
  const existing = await stripe.webhookEndpoints.list({ limit: 100 })
  const matches = existing.data.filter(e => e.url === url)
  if (matches.length) {
    console.warn(`Found ${matches.length} existing webhook(s) for ${url}. Creating a new one for ScudoSystems.`)
  }

  const webhook = await stripe.webhookEndpoints.create({
    url,
    enabled_events: events,
  })

  console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`)
}

main().catch(err => {
  console.error('Webhook creation failed:', err?.message || err)
  process.exit(1)
})
