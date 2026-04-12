/**
 * ScudoSystem Affiliate Engine
 * 20-year affiliate industry grade: fraud detection, attribution, commission management
 */

import { createHash, randomBytes } from 'crypto'

// ─── Code generation ──────────────────────────────────────────────────────────

/** Generate a human-readable, URL-safe affiliate tracking code */
export function generateAffiliateCode(name: string): string {
  const prefix = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4)
    .padEnd(4, 'X')
  const suffix = randomBytes(3).toString('hex').toUpperCase()
  return `${prefix}-${suffix}`
}

/** Build the full affiliate tracking URL */
export function buildAffiliateUrl(bookingUrl: string, code: string): string {
  try {
    const url = new URL(bookingUrl)
    url.searchParams.set('ref', code)
    return url.toString()
  } catch {
    return `${bookingUrl}?ref=${code}`
  }
}

// ─── Commission calculation ───────────────────────────────────────────────────

/** Calculate commission earned on a booking */
export function calculateCommission(
  totalAmountPence: number,
  commissionRate: number,          // e.g. 15 = 15%
  commissionType: 'percentage' | 'fixed',
  fixedAmountPence = 0
): number {
  if (totalAmountPence <= 0) return 0
  if (commissionType === 'fixed') return Math.max(0, fixedAmountPence)
  return Math.floor(totalAmountPence * (commissionRate / 100))
}

/** Format commission rate for display */
export function formatCommissionRate(rate: number, type: 'percentage' | 'fixed', fixedPence = 0): string {
  if (type === 'fixed') return `£${(fixedPence / 100).toFixed(2)} flat`
  return `${rate}%`
}

// ─── Fraud detection ──────────────────────────────────────────────────────────

export interface FraudSignals {
  sameIpConversions24h: number       // how many bookings from same IP via same affiliate today
  sameIpClicks1h: number             // rapid fire clicks from one IP
  timeSinceClickSeconds: number      // how long between click and booking
  isSelfReferral: boolean            // is the booker the same as the affiliate owner?
  bookingEmailMatchesAffiliate: boolean
  isDisposableEmail: boolean         // temp/throwaway email domains
  isFirstConversion: boolean         // first ever conversion = higher scrutiny
  bookingAmountPence: number         // suspiciously low amounts
  refundOrCancelHistory: number      // how many times this affiliate had cancelled bookings
}

/** Score 0–100: 0 = clean, 100 = definite fraud. Flag anything >= 40 */
export function calculateFraudScore(signals: FraudSignals): {
  score: number
  reasons: string[]
  verdict: 'clean' | 'review' | 'flag' | 'block'
} {
  let score = 0
  const reasons: string[] = []

  // Self-referral — strongest signal
  if (signals.isSelfReferral) {
    score += 80
    reasons.push('Self-referral: booker appears to be the affiliate themselves')
  }

  // Email matches affiliate
  if (signals.bookingEmailMatchesAffiliate) {
    score += 60
    reasons.push('Booking email matches affiliate account email')
  }

  // Disposable email
  if (signals.isDisposableEmail) {
    score += 25
    reasons.push('Booking made with a disposable/temporary email address')
  }

  // IP velocity — same IP, multiple conversions today via this affiliate
  if (signals.sameIpConversions24h >= 5) {
    score += 50
    reasons.push(`IP generated ${signals.sameIpConversions24h} conversions in 24h via this affiliate`)
  } else if (signals.sameIpConversions24h >= 3) {
    score += 35
    reasons.push(`IP generated ${signals.sameIpConversions24h} conversions in 24h via this affiliate`)
  } else if (signals.sameIpConversions24h >= 2) {
    score += 15
    reasons.push(`IP generated ${signals.sameIpConversions24h} conversions via this affiliate`)
  }

  // Rapid click-to-book (bot-like)
  if (signals.timeSinceClickSeconds < 8) {
    score += 30
    reasons.push(`Booking completed ${signals.timeSinceClickSeconds}s after click — unusually fast`)
  } else if (signals.timeSinceClickSeconds < 20) {
    score += 15
    reasons.push('Booking completed very quickly after affiliate link click')
  }

  // Rapid IP clicking (bot traffic)
  if (signals.sameIpClicks1h > 15) {
    score += 30
    reasons.push(`${signals.sameIpClicks1h} clicks from this IP in the last hour`)
  }

  // First conversion gets extra scrutiny (no payout history to compare)
  if (signals.isFirstConversion) {
    score += 10
    reasons.push('First-ever conversion — pending manual review before payout')
  }

  // History of cancelled bookings via this affiliate
  if (signals.refundOrCancelHistory >= 3) {
    score += 20
    reasons.push(`${signals.refundOrCancelHistory} previous bookings via this affiliate were cancelled/refunded`)
  }

  score = Math.min(score, 100)

  const verdict =
    score >= 60 ? 'block' :
    score >= 40 ? 'flag' :
    score >= 20 ? 'review' : 'clean'

  return { score, reasons, verdict }
}

// Disposable email domain blocklist (top offenders)
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'tempmail.com', 'guerrillamail.com', 'throwaway.email',
  'sharklasers.com', 'guerrillamailblock.com', 'grr.la', 'guerrillamail.info',
  'yopmail.com', 'trashmail.com', 'maildrop.cc', 'dispostable.com',
  '10minutemail.com', 'fakeinbox.com', 'spamgourmet.com', 'mytrashmail.com',
  'mailnull.com', 'spaml.de', 'tempr.email', 'throwam.com',
])

export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  return domain ? DISPOSABLE_DOMAINS.has(domain) : false
}

/** Hash an IP address for privacy-safe storage */
export function hashIp(ip: string, salt = 'scudo-v1'): string {
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32)
}

// ─── Hold period ──────────────────────────────────────────────────────────────

/** Commission hold: 7 days after booking completion before it can be paid */
export function getHoldUntil(completionDate: Date, holdDays = 7): Date {
  const d = new Date(completionDate)
  d.setDate(d.getDate() + holdDays)
  return d
}

/** Check if a commission is past the hold period and eligible for payout */
export function isEligibleForPayout(holdUntil: Date | null): boolean {
  if (!holdUntil) return false
  return new Date() >= new Date(holdUntil)
}

// ─── Dynamic pricing ──────────────────────────────────────────────────────────

export interface PricingTier {
  id: string
  tier_name: string        // 'Early Bird' | 'Standard' | 'Peak' | 'Last Chance' | custom
  price_pence: number
  capacity: number | null  // null = unlimited
  bookings_used: number
  starts_at: string | null // ISO timestamp
  ends_at: string | null   // ISO timestamp
  is_active: boolean
  display_countdown: boolean
}

/** Get the currently active pricing tier for a service */
export function getActiveTier(tiers: PricingTier[]): PricingTier | null {
  const now = new Date()
  const active = tiers.filter(t => {
    if (!t.is_active) return false
    if (t.starts_at && new Date(t.starts_at) > now) return false
    if (t.ends_at && new Date(t.ends_at) < now) return false
    if (t.capacity !== null && t.bookings_used >= t.capacity) return false
    return true
  })
  // Return cheapest active tier (show best price to customers)
  return active.sort((a, b) => a.price_pence - b.price_pence)[0] || null
}

/** Get the next upcoming tier (to show "price increases in X" message) */
export function getNextTier(tiers: PricingTier[]): PricingTier | null {
  const now = new Date()
  const current = getActiveTier(tiers)
  const upcoming = tiers.filter(t => {
    if (!t.is_active) return false
    if (t.starts_at && new Date(t.starts_at) <= now) return false
    if (current && t.price_pence <= current.price_pence) return false
    return true
  })
  return upcoming.sort((a, b) =>
    new Date(a.starts_at!).getTime() - new Date(b.starts_at!).getTime()
  )[0] || null
}

/** Format countdown from now to a future date */
export function formatCountdown(targetDate: string | Date): string {
  const diff = new Date(targetDate).getTime() - Date.now()
  if (diff <= 0) return 'Expired'

  const days    = Math.floor(diff / 86400000)
  const hours   = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)

  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  return `${minutes}m ${seconds}s`
}

// ─── Industry suitability ─────────────────────────────────────────────────────

export const AFFILIATE_CONFIG: Record<string, {
  score: number              // 1–10 suitability
  label: string              // suitability label
  defaultRate: number        // default commission %
  partnerTitle: string       // what to call affiliates in this industry
  reason: string             // why it works
  dynamicPricing: boolean    // does dynamic pricing make sense?
  useCase: string            // example use case
}> = {
  nightclub:   { score: 10, label: 'Perfect fit',   defaultRate: 15, partnerTitle: 'Promoter',    dynamicPricing: true,  reason: 'PRs already earn table commissions — this formalises it digitally with full tracking.',        useCase: 'PR books 20 tables on a Saturday night, earns £300 in commissions' },
  escape:      { score: 9,  label: 'Excellent fit', defaultRate: 12, partnerTitle: 'Partner',     dynamicPricing: true,  reason: 'Group bookings spread via social sharing. Influencers drive whole teams.',                    useCase: 'Content creator shares escape room link, earns per group booked' },
  supercar:    { score: 9,  label: 'Excellent fit', defaultRate: 15, partnerTitle: 'Ambassador',  dynamicPricing: false, reason: 'Luxury lifestyle influencers have direct, affluent audiences for high-value rentals.',       useCase: 'Car blogger earns £75 every time a follower rents a Lambo' },
  photography: { score: 9,  label: 'Excellent fit', defaultRate: 12, partnerTitle: 'Referrer',    dynamicPricing: true,  reason: 'Wedding/events community is tightly referral-driven — couple recommends photographer.',       useCase: 'Wedding planner refers 10 shoots per month at 12% each' },
  gym:         { score: 8,  label: 'Great fit',     defaultRate: 15, partnerTitle: 'Ambassador',  dynamicPricing: false, reason: 'Fitness influencers drive memberships and PT sessions with strong social trust.',            useCase: 'Fitness influencer earns monthly income from PT session referrals' },
  spa:         { score: 8,  label: 'Great fit',     defaultRate: 12, partnerTitle: 'Influencer',  dynamicPricing: true,  reason: 'Wellness and beauty bloggers command loyal audiences who trust their treatments.',           useCase: 'Beauty influencer earns 12% on every facial and massage booked via link' },
  aesthetics:  { score: 8,  label: 'Great fit',     defaultRate: 12, partnerTitle: 'Influencer',  dynamicPricing: false, reason: 'Aesthetics is heavily influencer-driven on Instagram and TikTok.',                         useCase: 'Micro-influencer earns £50/week sharing their own treatment results' },
  beauty:      { score: 8,  label: 'Great fit',     defaultRate: 12, partnerTitle: 'Influencer',  dynamicPricing: false, reason: 'Before/after content converts instantly. Beauty communities share and book together.',       useCase: 'Beauty blogger earns passive income recommending treatment salon' },
  lash:        { score: 8,  label: 'Great fit',     defaultRate: 10, partnerTitle: 'Influencer',  dynamicPricing: false, reason: 'Lash results are highly shareable on Instagram — natural affiliate opportunity.',            useCase: 'Client posts lash result, earns 10% on every friend who books' },
  nails:       { score: 7,  label: 'Good fit',      defaultRate: 10, partnerTitle: 'Influencer',  dynamicPricing: false, reason: 'Nail art is TikTok/Instagram-native. Results drive instant click-throughs.',               useCase: 'Nail content creator earns ongoing commission from loyal followers' },
  tattoo:      { score: 7,  label: 'Good fit',      defaultRate: 10, partnerTitle: 'Referrer',    dynamicPricing: false, reason: 'Tattoo community is close-knit and referral-driven by nature.',                           useCase: 'Regular client earns £15 every time they refer a friend for a session' },
  barber:      { score: 7,  label: 'Good fit',      defaultRate: 10, partnerTitle: 'Partner',     dynamicPricing: false, reason: 'Barber chairs thrive on community loyalty and peer referrals.',                           useCase: 'Loyal customer earns credit or cash when their mates book' },
  hairsalon:   { score: 7,  label: 'Good fit',      defaultRate: 10, partnerTitle: 'Influencer',  dynamicPricing: false, reason: 'Hair results are naturally shareable — transformations go viral.',                        useCase: 'Hair influencer earns 10% on every booking from their transformation video' },
  restaurant:  { score: 7,  label: 'Good fit',      defaultRate: 10, partnerTitle: 'Food Blogger',dynamicPricing: true,  reason: 'Food bloggers and reviewers convert high-intent diners efficiently.',                      useCase: 'Food blogger earns 10% on every cover booked from their review post' },
  grooming:    { score: 6,  label: 'Good fit',      defaultRate: 10, partnerTitle: 'Partner',     dynamicPricing: false, reason: 'Pet owner communities share grooming recommendations enthusiastically.',                   useCase: 'Doggo Instagram account earns commission on every groom referral' },
  driving:     { score: 6,  label: 'Moderate fit',  defaultRate: 8,  partnerTitle: 'Referrer',    dynamicPricing: false, reason: 'School and college communities pass on driving school referrals regularly.',               useCase: 'Student earns £10 for every friend who signs up for lessons' },
  tutoring:    { score: 6,  label: 'Moderate fit',  defaultRate: 10, partnerTitle: 'Partner',     dynamicPricing: false, reason: 'Gym/sports community shares personal trainer recommendations naturally.',                  useCase: 'Gym member earns 10% referring friends to the PT' },
  physio:      { score: 5,  label: 'Possible',      defaultRate: 8,  partnerTitle: 'Referrer',    dynamicPricing: false, reason: 'GP and specialist referrals can be formalised with appropriate disclaimers.',             useCase: 'GP surgery refers rehab patients and earns a referral fee' },
  auto:        { score: 5,  label: 'Possible',      defaultRate: 8,  partnerTitle: 'Partner',     dynamicPricing: false, reason: 'Car communities and forums drive loyal workshop referrals.',                             useCase: 'Car club member earns 8% referring cars in for MOTs' },
  carwash:     { score: 5,  label: 'Possible',      defaultRate: 8,  partnerTitle: 'Partner',     dynamicPricing: false, reason: 'Local business networks and car groups can drive bookings consistently.',                 useCase: 'Fleet manager refers their drivers and earns commission per valet' },
  dental:      { score: 4,  label: 'Regulated industry', defaultRate: 8, partnerTitle: 'Referrer', dynamicPricing: false, reason: 'Dental patient referrals are effective for private practices. Always ensure full compliance with GDC advertising standards and disclose referral arrangements to patients.', useCase: 'Existing patient earns 8% fee when referring a new private patient for treatment' },
  solicitor:   { score: 3,  label: 'Regulated industry', defaultRate: 5,  partnerTitle: 'Referrer',dynamicPricing: false,reason: 'SRA regulations restrict referral fees. Must disclose to clients. Consult compliance.',    useCase: 'Accountant partner earns small referral on legal consultation' },
  accountant:  { score: 3,  label: 'Regulated industry', defaultRate: 5,  partnerTitle: 'Referrer',dynamicPricing: false,reason: 'ICAEW rules govern referral arrangements. Ensure FCA compliance for financial advice.',   useCase: 'IFA refers clients to accountant under a formal referral agreement' },
  vet:         { score: 4,  label: 'Possible',      defaultRate: 8,  partnerTitle: 'Referrer',    dynamicPricing: false, reason: 'Pet communities share vet recommendations — works best for routine/wellness visits.',      useCase: 'Pet boarding service refers its clients to the vet practice' },
  takeaway:    { score: 3,  label: 'Low margin caution', defaultRate: 5, partnerTitle: 'Partner', dynamicPricing: false, reason: 'Thin margins make affiliate costs risky — model carefully.',                             useCase: 'Local food blogger earns commission from each converted customer' },
  optician:    { score: 2,  label: 'Low fit',       defaultRate: 5,  partnerTitle: 'Referrer',    dynamicPricing: false, reason: 'Primarily NHS-driven. Works only for private/premium eye care services.',                 useCase: 'Corporate HR refers staff for private eye tests' },
}
