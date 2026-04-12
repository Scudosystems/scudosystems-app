import { VERTICALS, type VerticalId } from './verticals'

export type BillingUnit = 'booking' | 'order'

export interface VerticalPricing {
  basePence: number | null
  perPence: number | null
  unit: BillingUnit
  label: string
  billingModel: string
}

function parseBillingModel(model: string) {
  const baseMatch = model.match(/£\s*([0-9]+(?:\.[0-9]+)?)\s*\/mo/i)

  const basePence = baseMatch ? Math.round(parseFloat(baseMatch[1]) * 100) : null
  const perPence = null
  const unit = 'booking' as BillingUnit

  return { basePence, perPence, unit }
}

export const VERTICAL_PRICING: Record<VerticalId, VerticalPricing> = Object.keys(VERTICALS).reduce((acc, id) => {
  const vertical = VERTICALS[id as VerticalId]
  const parsed = parseBillingModel(vertical.billingModel)
  acc[id as VerticalId] = {
    ...parsed,
    label: vertical.label,
    billingModel: vertical.billingModel,
  }
  return acc
}, {} as Record<VerticalId, VerticalPricing>)

export function getVerticalPricing(vertical: VerticalId): VerticalPricing {
  return VERTICAL_PRICING[vertical]
}
