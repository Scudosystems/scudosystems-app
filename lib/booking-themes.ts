/**
 * Per-industry booking page theme tokens.
 * These extend (not replace) the brand_colour — the owner's chosen brand
 * colour is still used for buttons, progress bars, and highlights.
 * The theme tokens control the atmospheric layer: backgrounds, typography
 * weights, card treatments, and hero styling.
 */

export interface BookingIndustryTheme {
  /** Full-page background (CSS value — may be a gradient or solid colour) */
  pageBg: string
  /** Page wrapper extra class string (e.g. for texture overlays) */
  pageClass: string
  /** Whether cards should use glass-morphism (dark themes) */
  glassCards: boolean
  /** Card background colour / CSS value */
  cardBg: string
  /** Card border colour */
  cardBorder: string
  /** Card hover state background */
  cardHoverBg: string
  /** Selected card background */
  cardSelectedBg: string
  /** Selected card border colour (defaults to brandColour if empty) */
  cardSelectedBorder: string
  /** Hero gradient — replaces the default tinted brand gradient */
  heroGradient: string
  /** Hero section border */
  heroBorder: string
  /** Hero heading colour */
  heroHeadingColor: string
  /** Hero subtext colour */
  heroSubColor: string
  /** Hero badge background */
  heroBadgeBg: string
  /** Hero badge text colour */
  heroBadgeColor: string
  /** Page header background */
  headerBg: string
  /** Heading font-weight / extra class */
  headingClass: string
  /** Primary text colour on this background */
  textPrimary: string
  /** Muted / secondary text */
  textMuted: string
  /** Opacity of brand tint in hero (0–1) */
  heroTint: number
  /** Badge label shown next to vertical label in hero (e.g. "✦ OPEN NOW") */
  heroBadgeLabel?: string
  /** Show a subtle grid/dot texture behind the page */
  showTexture: boolean
  /** Divider line colour */
  dividerColor: string
  /** Step number pill style: "brand" | "outline" | "filled" */
  stepStyle: 'brand' | 'outline' | 'filled'
  /** Confirmation card background */
  confirmBg: string
  /** Amount shown next to service (right-aligned price chip) */
  priceChipBg: string
  /** Extra shadow on service cards */
  cardShadow: string
  /** Border-radius override for cards (Tailwind class) */
  cardRadius: string
}

/** A simpler legacy token set kept for the theme-selector controls in the dashboard */
export const BOOKING_THEMES: Record<string, { pageBg: string; heroTint: number }> = {
  soft:  {
    pageBg: 'radial-gradient(1200px 600px at 15% -10%, rgba(13,148,136,0.12), transparent 60%), linear-gradient(180deg, #f8fafc 0%, #ffffff 55%)',
    heroTint: 0.18,
  },
  mist:  {
    pageBg: 'radial-gradient(1200px 600px at 15% -10%, rgba(59,130,246,0.14), transparent 60%), linear-gradient(180deg, #eef2ff 0%, #ffffff 55%)',
    heroTint: 0.22,
  },
  sand:  {
    pageBg: 'radial-gradient(1200px 600px at 15% -10%, rgba(245,158,11,0.15), transparent 60%), linear-gradient(180deg, #fff7ed 0%, #ffffff 55%)',
    heroTint: 0.22,
  },
  slate: {
    pageBg: 'radial-gradient(1200px 600px at 15% -10%, rgba(15,23,42,0.08), transparent 60%), linear-gradient(180deg, #f1f5f9 0%, #ffffff 55%)',
    heroTint: 0.2,
  },
  blush: {
    pageBg: 'radial-gradient(1200px 600px at 15% -10%, rgba(236,72,153,0.14), transparent 60%), linear-gradient(180deg, #fff1f2 0%, #ffffff 55%)',
    heroTint: 0.22,
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Default fallback (used when no vertical match)
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_THEME: BookingIndustryTheme = {
  pageBg:             'linear-gradient(180deg, #f8faff 0%, #ffffff 50%)',
  pageClass:          '',
  glassCards:         false,
  cardBg:             '#ffffff',
  cardBorder:         'rgba(0,0,0,0.07)',
  cardHoverBg:        '#f8faff',
  cardSelectedBg:     '#f0f9ff',
  cardSelectedBorder: '',
  heroGradient:       '',
  heroBorder:         'rgba(0,0,0,0.06)',
  heroHeadingColor:   '#0f172a',
  heroSubColor:       'rgba(15,23,42,0.55)',
  heroBadgeBg:        'rgba(255,255,255,0.7)',
  heroBadgeColor:     '#374151',
  headerBg:           '#ffffff',
  headingClass:       'font-extrabold',
  textPrimary:        '#0f172a',
  textMuted:          'rgba(15,23,42,0.5)',
  heroTint:           0.12,
  showTexture:        false,
  dividerColor:       '#f1f5f9',
  stepStyle:          'brand',
  confirmBg:          '#f0fdf4',
  priceChipBg:        '#f0fdf4',
  cardShadow:         '0 1px 3px rgba(0,0,0,0.06)',
  cardRadius:         'rounded-2xl',
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-industry themes
// ─────────────────────────────────────────────────────────────────────────────
export const INDUSTRY_THEMES: Partial<Record<string, BookingIndustryTheme>> = {

  // ── DENTAL — Clinical / Futuristic ───────────────────────────────────────
  dental: {
    pageBg:             'linear-gradient(160deg, #f0fdfc 0%, #f8faff 40%, #ffffff 100%)',
    pageClass:          '',
    glassCards:         false,
    cardBg:             '#ffffff',
    cardBorder:         'rgba(13,148,136,0.12)',
    cardHoverBg:        '#f0fdfc',
    cardSelectedBg:     'linear-gradient(135deg, #f0fdfc, #e0f2fe)',
    cardSelectedBorder: '#0d9488',
    heroGradient:       'linear-gradient(135deg, #e6fffe 0%, #eff6ff 50%, #f0fdfc 100%)',
    heroBorder:         'rgba(13,148,136,0.15)',
    heroHeadingColor:   '#0f172a',
    heroSubColor:       'rgba(15,23,42,0.55)',
    heroBadgeBg:        'rgba(13,148,136,0.08)',
    heroBadgeColor:     '#0d9488',
    headerBg:           'rgba(255,255,255,0.92)',
    headingClass:       'font-extrabold tracking-tight',
    textPrimary:        '#0f172a',
    textMuted:          'rgba(15,23,42,0.5)',
    heroTint:           0.10,
    heroBadgeLabel:     '✦ NHS & Private',
    showTexture:        false,
    dividerColor:       'rgba(13,148,136,0.08)',
    stepStyle:          'brand',
    confirmBg:          '#f0fdfc',
    priceChipBg:        '#f0fdfc',
    cardShadow:         '0 2px 12px rgba(13,148,136,0.08)',
    cardRadius:         'rounded-2xl',
  },

  // ── NIGHTCLUB — Neon / Dark / Energetic ──────────────────────────────────
  nightclub: {
    pageBg:             'linear-gradient(160deg, #0c0a1e 0%, #130f2e 40%, #0c0a1e 100%)',
    pageClass:          'booking-dark',
    glassCards:         true,
    cardBg:             'rgba(255,255,255,0.05)',
    cardBorder:         'rgba(255,255,255,0.1)',
    cardHoverBg:        'rgba(255,255,255,0.1)',
    cardSelectedBg:     'rgba(139,92,246,0.2)',
    cardSelectedBorder: '#a78bfa',
    heroGradient:       'linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(236,72,153,0.15) 50%, rgba(16,185,129,0.1) 100%)',
    heroBorder:         'rgba(139,92,246,0.3)',
    heroHeadingColor:   '#ffffff',
    heroSubColor:       'rgba(255,255,255,0.65)',
    heroBadgeBg:        'rgba(139,92,246,0.2)',
    heroBadgeColor:     '#c4b5fd',
    headerBg:           'rgba(12,10,30,0.95)',
    headingClass:       'font-black tracking-tight',
    textPrimary:        '#ffffff',
    textMuted:          'rgba(255,255,255,0.55)',
    heroTint:           0.25,
    heroBadgeLabel:     '★ TONIGHT',
    showTexture:        true,
    dividerColor:       'rgba(255,255,255,0.08)',
    stepStyle:          'filled',
    confirmBg:          'rgba(139,92,246,0.15)',
    priceChipBg:        'rgba(139,92,246,0.2)',
    cardShadow:         '0 4px 24px rgba(139,92,246,0.15)',
    cardRadius:         'rounded-2xl',
  },

  // ── EVENTS — Bold / Vivid ─────────────────────────────────────────────────
  events: {
    pageBg:             'linear-gradient(160deg, #0f0a1e 0%, #1a0f30 50%, #0f0a1e 100%)',
    pageClass:          'booking-dark',
    glassCards:         true,
    cardBg:             'rgba(255,255,255,0.06)',
    cardBorder:         'rgba(255,255,255,0.1)',
    cardHoverBg:        'rgba(255,255,255,0.1)',
    cardSelectedBg:     'rgba(168,85,247,0.22)',
    cardSelectedBorder: '#c084fc',
    heroGradient:       'linear-gradient(135deg, rgba(168,85,247,0.3) 0%, rgba(251,113,133,0.2) 100%)',
    heroBorder:         'rgba(168,85,247,0.3)',
    heroHeadingColor:   '#ffffff',
    heroSubColor:       'rgba(255,255,255,0.65)',
    heroBadgeBg:        'rgba(168,85,247,0.2)',
    heroBadgeColor:     '#d8b4fe',
    headerBg:           'rgba(15,10,30,0.95)',
    headingClass:       'font-black tracking-tight',
    textPrimary:        '#ffffff',
    textMuted:          'rgba(255,255,255,0.55)',
    heroTint:           0.3,
    heroBadgeLabel:     '★ EVENTS',
    showTexture:        true,
    dividerColor:       'rgba(255,255,255,0.08)',
    stepStyle:          'filled',
    confirmBg:          'rgba(168,85,247,0.15)',
    priceChipBg:        'rgba(168,85,247,0.2)',
    cardShadow:         '0 4px 24px rgba(168,85,247,0.15)',
    cardRadius:         'rounded-2xl',
  },

  // ── SPA — Serene / Organic ────────────────────────────────────────────────
  spa: {
    pageBg:             'linear-gradient(160deg, #f5f7f0 0%, #fdf8f3 50%, #f5f7f0 100%)',
    pageClass:          '',
    glassCards:         false,
    cardBg:             '#fefefe',
    cardBorder:         'rgba(5,150,105,0.12)',
    cardHoverBg:        '#f0fdf4',
    cardSelectedBg:     'linear-gradient(135deg, #f0fdf4, #fdf8f3)',
    cardSelectedBorder: '#059669',
    heroGradient:       'linear-gradient(135deg, #d1fae5 0%, #fef3c7 60%, #f0fdf4 100%)',
    heroBorder:         'rgba(5,150,105,0.15)',
    heroHeadingColor:   '#064e3b',
    heroSubColor:       'rgba(6,78,59,0.6)',
    heroBadgeBg:        'rgba(5,150,105,0.08)',
    heroBadgeColor:     '#059669',
    headerBg:           'rgba(245,247,240,0.95)',
    headingClass:       'font-bold tracking-wide',
    textPrimary:        '#064e3b',
    textMuted:          'rgba(6,78,59,0.55)',
    heroTint:           0.14,
    heroBadgeLabel:     '✿ WELLNESS',
    showTexture:        false,
    dividerColor:       'rgba(5,150,105,0.08)',
    stepStyle:          'brand',
    confirmBg:          '#f0fdf4',
    priceChipBg:        '#f0fdf4',
    cardShadow:         '0 2px 16px rgba(5,150,105,0.08)',
    cardRadius:         'rounded-3xl',
  },

  // ── BEAUTY / HAIRSALON / LASH / NAILS — Feminine / Chic ─────────────────
  beauty: {
    pageBg:             'linear-gradient(160deg, #fff1f5 0%, #fdf4ff 50%, #ffffff 100%)',
    pageClass:          '',
    glassCards:         false,
    cardBg:             '#ffffff',
    cardBorder:         'rgba(236,72,153,0.12)',
    cardHoverBg:        '#fff1f5',
    cardSelectedBg:     'linear-gradient(135deg, #fff1f5, #fdf4ff)',
    cardSelectedBorder: '#ec4899',
    heroGradient:       'linear-gradient(135deg, #fce7f3 0%, #fdf4ff 60%, #fff1f5 100%)',
    heroBorder:         'rgba(236,72,153,0.15)',
    heroHeadingColor:   '#831843',
    heroSubColor:       'rgba(131,24,67,0.6)',
    heroBadgeBg:        'rgba(236,72,153,0.08)',
    heroBadgeColor:     '#ec4899',
    headerBg:           'rgba(255,255,255,0.95)',
    headingClass:       'font-bold',
    textPrimary:        '#1f0a12',
    textMuted:          'rgba(31,10,18,0.5)',
    heroTint:           0.15,
    heroBadgeLabel:     '✦ BEAUTY',
    showTexture:        false,
    dividerColor:       'rgba(236,72,153,0.08)',
    stepStyle:          'brand',
    confirmBg:          '#fce7f3',
    priceChipBg:        '#fce7f3',
    cardShadow:         '0 2px 12px rgba(236,72,153,0.08)',
    cardRadius:         'rounded-2xl',
  },

  // ── GYM / FITNESS — Bold / High Energy ───────────────────────────────────
  gym: {
    pageBg:             'linear-gradient(160deg, #0f1117 0%, #1a1f2e 50%, #0f1117 100%)',
    pageClass:          'booking-dark',
    glassCards:         true,
    cardBg:             'rgba(255,255,255,0.06)',
    cardBorder:         'rgba(255,255,255,0.1)',
    cardHoverBg:        'rgba(255,255,255,0.1)',
    cardSelectedBg:     'rgba(220,38,38,0.2)',
    cardSelectedBorder: '#f87171',
    heroGradient:       'linear-gradient(135deg, rgba(220,38,38,0.3) 0%, rgba(234,88,12,0.2) 100%)',
    heroBorder:         'rgba(220,38,38,0.3)',
    heroHeadingColor:   '#ffffff',
    heroSubColor:       'rgba(255,255,255,0.65)',
    heroBadgeBg:        'rgba(220,38,38,0.2)',
    heroBadgeColor:     '#fca5a5',
    headerBg:           'rgba(15,17,23,0.95)',
    headingClass:       'font-black tracking-tighter uppercase',
    textPrimary:        '#ffffff',
    textMuted:          'rgba(255,255,255,0.55)',
    heroTint:           0.3,
    heroBadgeLabel:     '⚡ FITNESS',
    showTexture:        true,
    dividerColor:       'rgba(255,255,255,0.07)',
    stepStyle:          'filled',
    confirmBg:          'rgba(220,38,38,0.15)',
    priceChipBg:        'rgba(220,38,38,0.2)',
    cardShadow:         '0 4px 24px rgba(220,38,38,0.12)',
    cardRadius:         'rounded-xl',
  },

  // ── YOGA — Soft / Mindful ─────────────────────────────────────────────────
  yoga: {
    pageBg:             'linear-gradient(160deg, #fdf6f0 0%, #fff8f0 50%, #fdf6f0 100%)',
    pageClass:          '',
    glassCards:         false,
    cardBg:             '#fefcf9',
    cardBorder:         'rgba(180,83,9,0.12)',
    cardHoverBg:        '#fef9f5',
    cardSelectedBg:     'linear-gradient(135deg, #fef3c7, #fdf6f0)',
    cardSelectedBorder: '#d97706',
    heroGradient:       'linear-gradient(135deg, #fef3c7 0%, #fde68a 30%, #fdf6f0 100%)',
    heroBorder:         'rgba(180,83,9,0.15)',
    heroHeadingColor:   '#451a03',
    heroSubColor:       'rgba(69,26,3,0.55)',
    heroBadgeBg:        'rgba(180,83,9,0.08)',
    heroBadgeColor:     '#b45309',
    headerBg:           'rgba(253,246,240,0.95)',
    headingClass:       'font-bold tracking-wide',
    textPrimary:        '#1c0a00',
    textMuted:          'rgba(28,10,0,0.5)',
    heroTint:           0.15,
    heroBadgeLabel:     '☽ MINDFUL',
    showTexture:        false,
    dividerColor:       'rgba(180,83,9,0.07)',
    stepStyle:          'brand',
    confirmBg:          '#fef3c7',
    priceChipBg:        '#fef3c7',
    cardShadow:         '0 2px 12px rgba(180,83,9,0.07)',
    cardRadius:         'rounded-3xl',
  },

  // ── ESCAPE ROOM — Moody / Mysterious ─────────────────────────────────────
  escape: {
    pageBg:             'linear-gradient(160deg, #0a0e18 0%, #111827 50%, #0a0e18 100%)',
    pageClass:          'booking-dark',
    glassCards:         true,
    cardBg:             'rgba(255,255,255,0.05)',
    cardBorder:         'rgba(255,255,255,0.09)',
    cardHoverBg:        'rgba(255,255,255,0.09)',
    cardSelectedBg:     'rgba(29,78,216,0.22)',
    cardSelectedBorder: '#60a5fa',
    heroGradient:       'linear-gradient(135deg, rgba(29,78,216,0.3) 0%, rgba(55,48,163,0.25) 50%, rgba(0,0,0,0.1) 100%)',
    heroBorder:         'rgba(29,78,216,0.3)',
    heroHeadingColor:   '#ffffff',
    heroSubColor:       'rgba(255,255,255,0.6)',
    heroBadgeBg:        'rgba(29,78,216,0.2)',
    heroBadgeColor:     '#93c5fd',
    headerBg:           'rgba(10,14,24,0.95)',
    headingClass:       'font-black tracking-tight',
    textPrimary:        '#ffffff',
    textMuted:          'rgba(255,255,255,0.5)',
    heroTint:           0.3,
    heroBadgeLabel:     '🔐 ESCAPE',
    showTexture:        true,
    dividerColor:       'rgba(255,255,255,0.07)',
    stepStyle:          'filled',
    confirmBg:          'rgba(29,78,216,0.15)',
    priceChipBg:        'rgba(29,78,216,0.2)',
    cardShadow:         '0 4px 24px rgba(29,78,216,0.15)',
    cardRadius:         'rounded-xl',
  },

  // ── BARBERSHOP — Urban / Sharp ────────────────────────────────────────────
  barber: {
    pageBg:             'linear-gradient(160deg, #fafaf9 0%, #f5f5f4 50%, #fafaf9 100%)',
    pageClass:          '',
    glassCards:         false,
    cardBg:             '#ffffff',
    cardBorder:         'rgba(0,0,0,0.08)',
    cardHoverBg:        '#f5f5f4',
    cardSelectedBg:     '#f5f5f4',
    cardSelectedBorder: '#1c1917',
    heroGradient:       'linear-gradient(135deg, #e7e5e4 0%, #f5f5f4 60%, #fafaf9 100%)',
    heroBorder:         'rgba(0,0,0,0.1)',
    heroHeadingColor:   '#1c1917',
    heroSubColor:       'rgba(28,25,23,0.55)',
    heroBadgeBg:        'rgba(0,0,0,0.06)',
    heroBadgeColor:     '#44403c',
    headerBg:           '#ffffff',
    headingClass:       'font-black tracking-tight uppercase',
    textPrimary:        '#1c1917',
    textMuted:          'rgba(28,25,23,0.5)',
    heroTint:           0.08,
    heroBadgeLabel:     '✂ BARBERSHOP',
    showTexture:        false,
    dividerColor:       'rgba(0,0,0,0.06)',
    stepStyle:          'outline',
    confirmBg:          '#f5f5f4',
    priceChipBg:        '#f5f5f4',
    cardShadow:         '0 1px 4px rgba(0,0,0,0.08)',
    cardRadius:         'rounded-xl',
  },

  // ── BARBERSHOP alias ──────────────────────────────────────────────────────
  barbershop: {
    pageBg:             'linear-gradient(160deg, #fafaf9 0%, #f5f5f4 50%, #fafaf9 100%)',
    pageClass:          '',
    glassCards:         false,
    cardBg:             '#ffffff',
    cardBorder:         'rgba(0,0,0,0.08)',
    cardHoverBg:        '#f5f5f4',
    cardSelectedBg:     '#f5f5f4',
    cardSelectedBorder: '#1c1917',
    heroGradient:       'linear-gradient(135deg, #e7e5e4 0%, #f5f5f4 60%, #fafaf9 100%)',
    heroBorder:         'rgba(0,0,0,0.1)',
    heroHeadingColor:   '#1c1917',
    heroSubColor:       'rgba(28,25,23,0.55)',
    heroBadgeBg:        'rgba(0,0,0,0.06)',
    heroBadgeColor:     '#44403c',
    headerBg:           '#ffffff',
    headingClass:       'font-black tracking-tight uppercase',
    textPrimary:        '#1c1917',
    textMuted:          'rgba(28,25,23,0.5)',
    heroTint:           0.08,
    heroBadgeLabel:     '✂ BARBERSHOP',
    showTexture:        false,
    dividerColor:       'rgba(0,0,0,0.06)',
    stepStyle:          'outline',
    confirmBg:          '#f5f5f4',
    priceChipBg:        '#f5f5f4',
    cardShadow:         '0 1px 4px rgba(0,0,0,0.08)',
    cardRadius:         'rounded-xl',
  },

  // ── RESTAURANT — Warm / Inviting ──────────────────────────────────────────
  restaurant: {
    pageBg:             'linear-gradient(160deg, #fdf8f3 0%, #fff7ed 50%, #fdf8f3 100%)',
    pageClass:          '',
    glassCards:         false,
    cardBg:             '#fffefb',
    cardBorder:         'rgba(180,83,9,0.12)',
    cardHoverBg:        '#fff7ed',
    cardSelectedBg:     'linear-gradient(135deg, #fff7ed, #fef3c7)',
    cardSelectedBorder: '#ea580c',
    heroGradient:       'linear-gradient(135deg, #fed7aa 0%, #fef3c7 60%, #fff7ed 100%)',
    heroBorder:         'rgba(234,88,12,0.18)',
    heroHeadingColor:   '#431407',
    heroSubColor:       'rgba(67,20,7,0.6)',
    heroBadgeBg:        'rgba(234,88,12,0.08)',
    heroBadgeColor:     '#ea580c',
    headerBg:           'rgba(253,248,243,0.95)',
    headingClass:       'font-bold',
    textPrimary:        '#1c0a00',
    textMuted:          'rgba(28,10,0,0.5)',
    heroTint:           0.18,
    heroBadgeLabel:     '🍽 DINING',
    showTexture:        false,
    dividerColor:       'rgba(234,88,12,0.08)',
    stepStyle:          'brand',
    confirmBg:          '#fff7ed',
    priceChipBg:        '#fff7ed',
    cardShadow:         '0 2px 12px rgba(234,88,12,0.07)',
    cardRadius:         'rounded-2xl',
  },

  // ── SUPERCAR / AUTO — Prestige / Luxury ───────────────────────────────────
  supercar: {
    pageBg:             'linear-gradient(160deg, #09090b 0%, #18181b 50%, #09090b 100%)',
    pageClass:          'booking-dark',
    glassCards:         true,
    cardBg:             'rgba(255,255,255,0.04)',
    cardBorder:         'rgba(255,255,255,0.08)',
    cardHoverBg:        'rgba(255,255,255,0.08)',
    cardSelectedBg:     'rgba(161,161,170,0.15)',
    cardSelectedBorder: '#d4d4d8',
    heroGradient:       'linear-gradient(135deg, rgba(39,39,42,0.8) 0%, rgba(24,24,27,0.9) 100%)',
    heroBorder:         'rgba(255,255,255,0.12)',
    heroHeadingColor:   '#ffffff',
    heroSubColor:       'rgba(255,255,255,0.55)',
    heroBadgeBg:        'rgba(255,255,255,0.07)',
    heroBadgeColor:     '#a1a1aa',
    headerBg:           'rgba(9,9,11,0.95)',
    headingClass:       'font-black tracking-widest uppercase',
    textPrimary:        '#ffffff',
    textMuted:          'rgba(255,255,255,0.5)',
    heroTint:           0.12,
    heroBadgeLabel:     '◈ EXCLUSIVE',
    showTexture:        false,
    dividerColor:       'rgba(255,255,255,0.07)',
    stepStyle:          'outline',
    confirmBg:          'rgba(255,255,255,0.05)',
    priceChipBg:        'rgba(255,255,255,0.07)',
    cardShadow:         '0 4px 32px rgba(0,0,0,0.4)',
    cardRadius:         'rounded-2xl',
  },

  // ── PHOTOGRAPHY — Creative / Artistic ─────────────────────────────────────
  photography: {
    pageBg:             'linear-gradient(160deg, #fafafa 0%, #f4f4f5 50%, #fafafa 100%)',
    pageClass:          '',
    glassCards:         false,
    cardBg:             '#ffffff',
    cardBorder:         'rgba(0,0,0,0.07)',
    cardHoverBg:        '#f4f4f5',
    cardSelectedBg:     '#f4f4f5',
    cardSelectedBorder: '#3f3f46',
    heroGradient:       'linear-gradient(135deg, #f4f4f5 0%, #e4e4e7 100%)',
    heroBorder:         'rgba(0,0,0,0.1)',
    heroHeadingColor:   '#18181b',
    heroSubColor:       'rgba(24,24,27,0.55)',
    heroBadgeBg:        'rgba(0,0,0,0.06)',
    heroBadgeColor:     '#3f3f46',
    headerBg:           '#ffffff',
    headingClass:       'font-black tracking-tighter',
    textPrimary:        '#18181b',
    textMuted:          'rgba(24,24,27,0.5)',
    heroTint:           0.08,
    heroBadgeLabel:     '◉ STUDIO',
    showTexture:        false,
    dividerColor:       'rgba(0,0,0,0.06)',
    stepStyle:          'outline',
    confirmBg:          '#f4f4f5',
    priceChipBg:        '#f4f4f5',
    cardShadow:         '0 1px 4px rgba(0,0,0,0.08)',
    cardRadius:         'rounded-2xl',
  },

  // ── PHYSIO / AESTHETICS / HEALTH — Professional / Clean ──────────────────
  physio: {
    pageBg:             'linear-gradient(160deg, #f0f7ff 0%, #f8faff 50%, #f0f7ff 100%)',
    pageClass:          '',
    glassCards:         false,
    cardBg:             '#ffffff',
    cardBorder:         'rgba(37,99,235,0.1)',
    cardHoverBg:        '#eff6ff',
    cardSelectedBg:     'linear-gradient(135deg, #eff6ff, #f0f7ff)',
    cardSelectedBorder: '#2563eb',
    heroGradient:       'linear-gradient(135deg, #dbeafe 0%, #eff6ff 60%, #f0f7ff 100%)',
    heroBorder:         'rgba(37,99,235,0.14)',
    heroHeadingColor:   '#1e3a8a',
    heroSubColor:       'rgba(30,58,138,0.6)',
    heroBadgeBg:        'rgba(37,99,235,0.07)',
    heroBadgeColor:     '#2563eb',
    headerBg:           'rgba(255,255,255,0.95)',
    headingClass:       'font-extrabold tracking-tight',
    textPrimary:        '#0f172a',
    textMuted:          'rgba(15,23,42,0.5)',
    heroTint:           0.1,
    heroBadgeLabel:     '✦ CLINIC',
    showTexture:        false,
    dividerColor:       'rgba(37,99,235,0.07)',
    stepStyle:          'brand',
    confirmBg:          '#eff6ff',
    priceChipBg:        '#eff6ff',
    cardShadow:         '0 2px 12px rgba(37,99,235,0.08)',
    cardRadius:         'rounded-2xl',
  },

  // ── TATTOO — Dark / Edgy ──────────────────────────────────────────────────
  tattoo: {
    pageBg:             'linear-gradient(160deg, #09090b 0%, #18181b 50%, #09090b 100%)',
    pageClass:          'booking-dark',
    glassCards:         true,
    cardBg:             'rgba(255,255,255,0.05)',
    cardBorder:         'rgba(255,255,255,0.09)',
    cardHoverBg:        'rgba(255,255,255,0.09)',
    cardSelectedBg:     'rgba(220,38,38,0.15)',
    cardSelectedBorder: '#f87171',
    heroGradient:       'linear-gradient(135deg, rgba(39,39,42,0.8) 0%, rgba(127,29,29,0.3) 100%)',
    heroBorder:         'rgba(248,113,113,0.2)',
    heroHeadingColor:   '#ffffff',
    heroSubColor:       'rgba(255,255,255,0.55)',
    heroBadgeBg:        'rgba(220,38,38,0.15)',
    heroBadgeColor:     '#fca5a5',
    headerBg:           'rgba(9,9,11,0.95)',
    headingClass:       'font-black tracking-tight',
    textPrimary:        '#ffffff',
    textMuted:          'rgba(255,255,255,0.5)',
    heroTint:           0.25,
    heroBadgeLabel:     '◈ STUDIO',
    showTexture:        false,
    dividerColor:       'rgba(255,255,255,0.07)',
    stepStyle:          'outline',
    confirmBg:          'rgba(220,38,38,0.12)',
    priceChipBg:        'rgba(220,38,38,0.15)',
    cardShadow:         '0 4px 24px rgba(0,0,0,0.35)',
    cardRadius:         'rounded-xl',
  },

  // ── KARTING / BOWLING / LASER / TRAMPOLINE — Fun / Vivid ─────────────────
  karting: {
    pageBg:             'linear-gradient(160deg, #fefce8 0%, #fff9c4 50%, #fefce8 100%)',
    pageClass:          '',
    glassCards:         false,
    cardBg:             '#ffffff',
    cardBorder:         'rgba(202,138,4,0.15)',
    cardHoverBg:        '#fefce8',
    cardSelectedBg:     'linear-gradient(135deg, #fef9c3, #fefce8)',
    cardSelectedBorder: '#ca8a04',
    heroGradient:       'linear-gradient(135deg, #fef08a 0%, #fde047 30%, #fefce8 100%)',
    heroBorder:         'rgba(202,138,4,0.2)',
    heroHeadingColor:   '#1c1917',
    heroSubColor:       'rgba(28,25,23,0.55)',
    heroBadgeBg:        'rgba(202,138,4,0.1)',
    heroBadgeColor:     '#92400e',
    headerBg:           'rgba(254,252,232,0.95)',
    headingClass:       'font-black tracking-tight',
    textPrimary:        '#1c1917',
    textMuted:          'rgba(28,25,23,0.5)',
    heroTint:           0.2,
    heroBadgeLabel:     '🏎 RACE',
    showTexture:        false,
    dividerColor:       'rgba(202,138,4,0.08)',
    stepStyle:          'brand',
    confirmBg:          '#fef9c3',
    priceChipBg:        '#fef9c3',
    cardShadow:         '0 2px 12px rgba(202,138,4,0.1)',
    cardRadius:         'rounded-2xl',
  },
}

// Copy aliases for shared styles
INDUSTRY_THEMES.hairsalon    = INDUSTRY_THEMES.beauty
INDUSTRY_THEMES.lash         = INDUSTRY_THEMES.beauty
INDUSTRY_THEMES.nails        = INDUSTRY_THEMES.beauty
INDUSTRY_THEMES.aesthetics   = { ...INDUSTRY_THEMES.physio!, heroBadgeLabel: '✦ AESTHETICS' }
INDUSTRY_THEMES.optician     = { ...INDUSTRY_THEMES.physio!, heroBadgeLabel: '👁 OPTICIANS' }
INDUSTRY_THEMES.vet          = { ...INDUSTRY_THEMES.physio!, heroBadgeLabel: '🐾 VET' }
INDUSTRY_THEMES.grooming     = { ...INDUSTRY_THEMES.spa!,    heroBadgeLabel: '🐾 GROOMING' }
INDUSTRY_THEMES.bowling      = INDUSTRY_THEMES.karting
INDUSTRY_THEMES.laser        = { ...INDUSTRY_THEMES.karting!, heroBadgeLabel: '⚡ LASER TAG' }
INDUSTRY_THEMES.trampoline   = { ...INDUSTRY_THEMES.karting!, heroBadgeLabel: '🎯 JUMP' }
INDUSTRY_THEMES.auto         = INDUSTRY_THEMES.supercar
INDUSTRY_THEMES.carwash      = { ...INDUSTRY_THEMES.barber!, heroBadgeLabel: '🚿 CAR WASH' }
INDUSTRY_THEMES.driving      = { ...INDUSTRY_THEMES.physio!, heroBadgeLabel: '🚗 DRIVING' }
INDUSTRY_THEMES.solicitor    = { ...INDUSTRY_THEMES.physio!, heroBadgeLabel: '⚖ LEGAL' }
INDUSTRY_THEMES.accountant   = { ...INDUSTRY_THEMES.physio!, heroBadgeLabel: '📊 ACCOUNTING' }
INDUSTRY_THEMES.tutoring     = { ...INDUSTRY_THEMES.physio!, heroBadgeLabel: '📚 TUTORING' }
INDUSTRY_THEMES.takeaway     = INDUSTRY_THEMES.restaurant

/**
 * Returns the industry theme for a given vertical ID.
 * Falls back to DEFAULT_THEME if no match.
 */
export function getIndustryTheme(verticalId: string | null | undefined): BookingIndustryTheme {
  if (!verticalId) return DEFAULT_THEME
  return INDUSTRY_THEMES[verticalId] ?? DEFAULT_THEME
}
