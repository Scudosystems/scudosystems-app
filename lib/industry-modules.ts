/**
 * Central per-industry module map.
 * Controls which dashboard features/tabs/pages each vertical can access.
 * Import this wherever you need conditional UI — avoids scattered boolean checks.
 */

export type IndustryModule =
  | 'events'           // Event posters, guestlist, nightclub-specific
  | 'dynamic_pricing'  // Time/capacity-based price tiers + countdown
  | 'social_share'     // Share buttons on booking page (Instagram, TikTok etc.)
  | 'staff_access'     // Staff portal: individual worker accounts
  | 'partners'         // Affiliate / referrer system (universal)
  | 'guestlist'        // Guestlist management (nightclub)
  | 'reviews'          // Patient/client reviews visible to staff
  | 'deposits'         // Online deposit collection
  | 'recall'           // Automated recall / re-booking nudges (dental, physio)
  | 'age_verification' // Minimum age enforcement (nightclub, bar)
  | 'dress_code'       // Dress code display on booking page
  | 'table_booking'    // Table selection / cover count (restaurant)
  | 'group_booking'    // Party / group size picker
  | 'fleet_display'    // Show vehicle fleet on booking page (supercar, auto)
  | 'wait_time'        // Live wait-time / queue QR page

/** Modules enabled for every vertical */
const UNIVERSAL: IndustryModule[] = [
  'partners', 'staff_access', 'reviews', 'deposits',
]

const MODULE_MAP: Record<string, IndustryModule[]> = {
  // ─── Nightlife ────────────────────────────────────────────────────────────
  nightclub: [
    ...UNIVERSAL,
    'events', 'dynamic_pricing', 'social_share', 'guestlist',
    'age_verification', 'dress_code', 'group_booking',
  ],
  events: [
    ...UNIVERSAL,
    'events', 'dynamic_pricing', 'social_share', 'guestlist',
    'age_verification', 'dress_code', 'group_booking',
  ],

  // ─── Health & Wellness ────────────────────────────────────────────────────
  dental: [
    ...UNIVERSAL, 'recall', 'wait_time',
  ],
  physio: [
    ...UNIVERSAL, 'recall', 'wait_time',
  ],
  optician: [
    ...UNIVERSAL, 'recall', 'wait_time',
  ],
  vet: [
    ...UNIVERSAL, 'recall', 'wait_time',
  ],
  aesthetics: [
    ...UNIVERSAL, 'recall', 'wait_time',
  ],

  // ─── Fitness ─────────────────────────────────────────────────────────────
  gym: [
    ...UNIVERSAL, 'dynamic_pricing', 'social_share', 'group_booking',
  ],
  yoga: [
    ...UNIVERSAL, 'dynamic_pricing', 'social_share',
  ],

  // ─── Beauty / Personal Care ───────────────────────────────────────────────
  beauty: [
    ...UNIVERSAL, 'social_share', 'wait_time',
  ],
  hairsalon: [
    ...UNIVERSAL, 'social_share', 'wait_time',
  ],
  barbershop: [
    ...UNIVERSAL, 'wait_time',
  ],
  barber: [
    ...UNIVERSAL, 'wait_time',
  ],
  lash: [
    ...UNIVERSAL, 'social_share', 'wait_time',
  ],
  nails: [
    ...UNIVERSAL, 'social_share', 'wait_time',
  ],
  spa: [
    ...UNIVERSAL, 'dynamic_pricing', 'social_share', 'recall', 'wait_time',
  ],
  grooming: [
    ...UNIVERSAL, 'wait_time',
  ],

  // ─── Entertainment ────────────────────────────────────────────────────────
  escape: [
    ...UNIVERSAL, 'dynamic_pricing', 'social_share', 'group_booking',
  ],
  karting: [
    ...UNIVERSAL, 'dynamic_pricing', 'social_share', 'group_booking',
  ],
  bowling: [
    ...UNIVERSAL, 'dynamic_pricing', 'social_share', 'group_booking',
  ],
  laser: [
    ...UNIVERSAL, 'dynamic_pricing', 'social_share', 'group_booking',
  ],
  trampoline: [
    ...UNIVERSAL, 'dynamic_pricing', 'social_share', 'group_booking',
  ],

  // ─── Transport / Experiences ──────────────────────────────────────────────
  supercar: [
    ...UNIVERSAL, 'dynamic_pricing', 'social_share', 'fleet_display', 'age_verification',
  ],
  auto: [
    ...UNIVERSAL, 'fleet_display',
  ],
  driving: [
    ...UNIVERSAL, 'recall',
  ],
  carwash: [
    ...UNIVERSAL, 'wait_time',
  ],

  // ─── Food & Hospitality ───────────────────────────────────────────────────
  restaurant: [
    ...UNIVERSAL, 'dynamic_pricing', 'social_share', 'table_booking', 'group_booking',
  ],
  takeaway: [
    ...UNIVERSAL,
  ],

  // ─── Creative / Professional ──────────────────────────────────────────────
  photography: [
    ...UNIVERSAL, 'dynamic_pricing', 'social_share',
  ],
  tattoo: [
    ...UNIVERSAL, 'social_share',
  ],
  solicitor: [
    ...UNIVERSAL, 'recall',
  ],
  accountant: [
    ...UNIVERSAL, 'recall',
  ],
  tutoring: [
    ...UNIVERSAL, 'recall',
  ],
}

/**
 * Returns the set of modules enabled for a given vertical.
 * Gracefully falls back to UNIVERSAL modules for unknown verticals.
 */
export function getModules(vertical: string | null | undefined): Set<IndustryModule> {
  if (!vertical) return new Set(UNIVERSAL)
  const modules = MODULE_MAP[vertical] ?? UNIVERSAL
  return new Set(modules)
}

/**
 * Quick helper — returns true if the vertical has access to a module.
 * Use this in components: `hasModule(tenant.vertical, 'events')`
 */
export function hasModule(vertical: string | null | undefined, module: IndustryModule): boolean {
  return getModules(vertical).has(module)
}

// Pre-built sets for the dashboard layout nav filter
export const EVENT_VERTICALS       = new Set(Object.keys(MODULE_MAP).filter(v => MODULE_MAP[v].includes('events')))
export const STAFF_ACCESS_VERTICALS = new Set(Object.keys(MODULE_MAP))   // all verticals
export const DYNAMIC_PRICING_VERTICALS = new Set(Object.keys(MODULE_MAP).filter(v => MODULE_MAP[v].includes('dynamic_pricing')))
export const SOCIAL_SHARE_VERTICALS    = new Set(Object.keys(MODULE_MAP).filter(v => MODULE_MAP[v].includes('social_share')))
export const AVAILABILITY_VERTICALS = new Set([
  'dental',
  'beauty',
  'spa',
  'gym',
  'optician',
  'vet',
  'auto',
  'tutoring',
  'restaurant',
  'barber',
  'barbershop',
  'hairsalon',
  'tattoo',
  'carwash',
  'driving',
  'takeaway',
  'photography',
  'grooming',
  'physio',
  'nails',
  'aesthetics',
  'lash',
  'escape',
  'solicitor',
  'accountant',
])
export const LIVE_AVAILABILITY_VERTICALS = new Set([
  'barber',
  'barbershop',
  'hairsalon',
  'beauty',
  'nails',
  'aesthetics',
  'lash',
  'tattoo',
  'physio',
  'dental',
  'optician',
  'vet',
  'grooming',
  'spa',
  'gym',
  'yoga',
  'tutoring',
  'driving',
  'photography',
  'auto',
  'carwash',
  'escape',
  'supercar',
  'karting',
  'bowling',
  'laser',
  'trampoline',
  'solicitor',
  'accountant',
])

export const WAIT_TIME_VERTICALS = new Set(Object.keys(MODULE_MAP).filter(v => MODULE_MAP[v].includes('wait_time')))
