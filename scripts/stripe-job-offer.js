#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')
const Stripe = require('stripe')

const ENV_PATH = path.join(__dirname, '..', '.env.local')

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const raw = fs.readFileSync(filePath, 'utf8')
  const lines = raw.split(/\r?\n/)
  const env = {}
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    let value = trimmed.slice(idx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  return env
}

function upsertEnvVar(filePath, key, value) {
  let raw = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : ''
  const lines = raw.split(/\r?\n/)
  let found = false
  const updated = lines.map(line => {
    if (line.startsWith(key + '=')) {
      found = true
      return `${key}=${value}`
    }
    return line
  })
  if (!found) {
    if (updated.length && updated[updated.length - 1].trim() !== '') updated.push('')
    updated.push(`${key}=${value}`)
  }
  fs.writeFileSync(filePath, updated.join('\n'))
}

async function findProduct(stripe) {
  try {
    const search = await stripe.products.search({
      query: "metadata['scudosystems_product']:'job_offer'",
      limit: 1,
    })
    if (search.data.length > 0) return search.data[0]
  } catch {
    // ignore search issues, fall back to list
  }
  const list = await stripe.products.list({ limit: 100 })
  return list.data.find(p => p.metadata?.scudosystems_product === 'job_offer') || null
}

async function ensureProduct(stripe) {
  const name = 'ScudoSystems — Job Offers'
  const description = 'Usage-based fee: £0.50 per accepted shift'
  const metadata = { scudosystems_product: 'job_offer', fee_pence: '50' }
  let product = await findProduct(stripe)
  if (!product) {
    product = await stripe.products.create({ name, description, metadata })
  } else {
    await stripe.products.update(product.id, { name, description, metadata })
  }
  return product
}

async function ensurePrice(stripe, productId) {
  const prices = await stripe.prices.list({ product: productId, active: true, limit: 100 })
  const existing = prices.data.find(
    p =>
      p.unit_amount === 50 &&
      p.currency === 'gbp' &&
      p.recurring?.interval === 'month' &&
      p.recurring?.usage_type === 'metered' &&
      p.recurring?.aggregate_usage === 'sum'
  )
  if (existing) return existing
  return stripe.prices.create({
    product: productId,
    unit_amount: 50,
    currency: 'gbp',
    recurring: {
      interval: 'month',
      usage_type: 'metered',
      aggregate_usage: 'sum',
    },
    metadata: { scudosystems_product: 'job_offer' },
  })
}

async function main() {
  const env = parseEnvFile(ENV_PATH)
  const secret = env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY
  if (!secret) {
    console.error('Missing STRIPE_SECRET_KEY in .env.local (or environment).')
    process.exit(1)
  }

  const stripe = new Stripe(secret, { apiVersion: '2024-04-10' })
  const product = await ensureProduct(stripe)
  const price = await ensurePrice(stripe, product.id)

  upsertEnvVar(ENV_PATH, 'STRIPE_JOB_OFFER_PRICE_ID', price.id)
  console.log(`STRIPE_JOB_OFFER_PRICE_ID=${price.id}`)
  console.log('Updated .env.local with the Job Offer price.')
}

main().catch(err => {
  console.error('Stripe job offer setup failed:', err.message || err)
  process.exit(1)
})
