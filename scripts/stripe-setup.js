#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')
const Stripe = require('stripe')

const SECRET_KEY = process.env.STRIPE_SECRET_KEY
const DRY_RUN = process.argv.includes('--dry-run')

if (!SECRET_KEY) {
  console.error('Missing STRIPE_SECRET_KEY. Set it in your environment before running this script.')
  process.exit(1)
}

const stripe = new Stripe(SECRET_KEY, { apiVersion: '2024-04-10' })

function parseBillingModel(model) {
  const baseMatch = model.match(/£\s*([0-9]+(?:\.[0-9]+)?)\s*\/mo/i)
  const perMatch = model.match(/£\s*([0-9]+(?:\.[0-9]+)?)\s*\/(booking|order)/i)

  const basePence = baseMatch ? Math.round(parseFloat(baseMatch[1]) * 100) : null
  const perPence = perMatch ? Math.round(parseFloat(perMatch[1]) * 100) : null
  const unit = perMatch ? perMatch[2].toLowerCase() : 'booking'

  return { basePence, perPence, unit }
}

function loadVerticals() {
  const filePath = path.join(__dirname, '../lib/verticals.ts')
  const raw = fs.readFileSync(filePath, 'utf8')
  const start = raw.indexOf('export const VERTICALS')
  const end = raw.indexOf('export const VERTICAL_LIST')

  if (start === -1 || end === -1) {
    throw new Error('Could not locate VERTICALS block in lib/verticals.ts')
  }

  const slice = raw.slice(start, end)
  const lines = slice.split(/\r?\n/)
  const map = {}
  let currentId = null

  for (const line of lines) {
    const idMatch = line.match(/id:\s*'([a-z]+)'/)
    if (idMatch) {
      currentId = idMatch[1]
      map[currentId] = map[currentId] || { id: currentId }
      continue
    }
    if (!currentId) continue

    const labelMatch = line.match(/label:\s*'([^']+)'/)
    if (labelMatch) {
      map[currentId].label = labelMatch[1]
    }

    const billingMatch = line.match(/billingModel:\s*'([^']+)'/)
    if (billingMatch) {
      map[currentId].billingModel = billingMatch[1]
    }
  }

  return Object.values(map).filter(v => v.billingModel)
}

async function findProduct(verticalId) {
  try {
    const search = await stripe.products.search({
      query: `metadata['scudosystems_vertical']:'${verticalId}'`,
      limit: 1,
    })
    if (search.data.length > 0) return search.data[0]
  } catch (err) {
    console.warn(`Stripe product search failed for ${verticalId}, falling back to list.`)
  }

  const list = await stripe.products.list({ limit: 100 })
  return list.data.find(p => p.metadata?.scudosystems_vertical === verticalId) || null
}

async function ensureProduct(vertical) {
  const metadata = {
    scudosystems_vertical: vertical.id,
    billing_model: vertical.billingModel,
    platform_fee_pence: String(vertical.perPence || 0),
    platform_fee_unit: vertical.unit || 'booking',
  }
  const name = `ScudoSystems — ${vertical.label}`
  const description = `Subscription for ${vertical.label} (${vertical.billingModel})`

  let product = await findProduct(vertical.id)
  if (!product) {
    if (DRY_RUN) {
      console.log(`[dry-run] create product: ${name}`)
      return { id: `dry_${vertical.id}`, name }
    }
    product = await stripe.products.create({
      name,
      description,
      metadata,
    })
  } else {
    if (!DRY_RUN) {
      await stripe.products.update(product.id, { name, description, metadata })
    }
  }
  return product
}

async function ensurePrice(productId, vertical) {
  if (vertical.basePence === null) return null
  const prices = await stripe.prices.list({ product: productId, active: true, limit: 100 })
  const existing = prices.data.find(
    p =>
      p.unit_amount === vertical.basePence &&
      p.currency === 'gbp' &&
      p.recurring?.interval === 'month'
  )
  if (existing) return existing

  if (DRY_RUN) {
    console.log(`[dry-run] create price: ${vertical.basePence}p / month for ${vertical.id}`)
    return { id: `dry_price_${vertical.id}` }
  }

  return stripe.prices.create({
    product: productId,
    unit_amount: vertical.basePence,
    currency: 'gbp',
    recurring: { interval: 'month' },
    metadata: { scudosystems_vertical: vertical.id },
  })
}

async function main() {
  const verticals = loadVerticals().map(v => {
    const parsed = parseBillingModel(v.billingModel)
    return { ...v, ...parsed }
  })

  const priceIds = {}
  for (const vertical of verticals) {
    if (vertical.basePence === null) {
      console.warn(`Skipping ${vertical.id}: no monthly price found in "${vertical.billingModel}"`)
      continue
    }
    const product = await ensureProduct(vertical)
    const price = await ensurePrice(product.id, vertical)
    if (price?.id) priceIds[vertical.id] = price.id
  }

  console.log('\nSTRIPE_PRICE_IDS_JSON=' + JSON.stringify(priceIds))
  console.log('Paste the line above into your .env.local (or your hosting env vars).')
  if (DRY_RUN) {
    console.log('Dry run complete — no products or prices were created.')
  }
}

main().catch(err => {
  console.error('Stripe setup failed:', err)
  process.exit(1)
})
