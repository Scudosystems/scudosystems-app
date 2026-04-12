import type { VerticalId } from '@/lib/verticals'

const DEFAULT_GUIDELINES: string[] = [
  'Greet customers warmly and confirm service details.',
  'Keep the work area clean and reset between appointments.',
  'Communicate delays early and set expectations.',
  'Confirm aftercare or next steps before they leave.',
]

const GUIDELINES_BY_VERTICAL: Partial<Record<VerticalId, string[]>> = {
  dental: [
    'Wash or sanitize hands before every patient.',
    'Disinfect tools and surfaces between appointments.',
    'Confirm allergies or sensitivities before treatment.',
    'Explain each step and check comfort throughout.',
  ],
  physio: [
    'Sanitize hands and equipment before every session.',
    'Confirm injury area and pain level before starting.',
    'Explain exercises clearly and check form frequently.',
    'Provide aftercare guidance and next‑visit recommendations.',
  ],
  optician: [
    'Sanitize hands and equipment before every test.',
    'Confirm patient symptoms and history.',
    'Explain results clearly and confirm next steps.',
    'Keep the testing area tidy and professional.',
  ],
  vet: [
    'Sanitize hands and surfaces between appointments.',
    'Handle pets gently and keep owners informed.',
    'Confirm allergies and medications before treatment.',
    'Share aftercare steps clearly before discharge.',
  ],
  beauty: [
    'Sanitize tools and stations between clients.',
    'Confirm treatment goals and sensitivities.',
    'Explain each step and check comfort.',
    'Share aftercare tips before the client leaves.',
  ],
  hairsalon: [
    'Sanitize tools and stations between clients.',
    'Confirm style, length, and finish before starting.',
    'Check comfort throughout the service.',
    'Recommend aftercare and re‑booking.',
  ],
  barber: [
    'Disinfect tools and chair between clients.',
    'Confirm style and beard preferences before starting.',
    'Keep the station clean and tidy.',
    'Offer aftercare tips and re‑booking.',
  ],
  nails: [
    'Sanitize tools and surfaces between clients.',
    'Confirm nail shape, finish, and allergies.',
    'Keep the workstation clean and organized.',
    'Share aftercare tips for longer wear.',
  ],
  lash: [
    'Sanitize tools and surfaces before every client.',
    'Confirm sensitivities and desired style.',
    'Explain aftercare for best retention.',
  ],
  aesthetics: [
    'Confirm allergies and medical contraindications.',
    'Explain the treatment plan and expected results.',
    'Maintain a sterile, calm treatment area.',
    'Provide aftercare guidance clearly.',
  ],
  spa: [
    'Prepare a calm, clean room before each guest.',
    'Confirm treatment focus and sensitivities.',
    'Check comfort throughout the session.',
    'Share aftercare and re‑booking options.',
  ],
  nightclub: [
    'Check ID and age requirements before entry.',
    'Confirm guestlist / table booking details.',
    'Keep queues moving and communicate delays.',
    'Maintain a safe, professional atmosphere.',
  ],
  restaurant: [
    'Confirm party size and any allergies.',
    'Prepare the table before the reservation time.',
    'Keep service area clean and organized.',
    'Check in during the meal and confirm satisfaction.',
  ],
  takeaway: [
    'Confirm order notes and allergy information.',
    'Label orders clearly and keep them organized.',
    'Hand off orders quickly and politely.',
  ],
  carwash: [
    'Confirm vehicle type and any special requests.',
    'Protect interior items and handle with care.',
    'Check for missed spots before hand‑off.',
    'Keep the bay clean and safe.',
  ],
  auto: [
    'Confirm vehicle details and requested work.',
    'Protect interior surfaces during service.',
    'Communicate delays or additional findings early.',
    'Explain work completed before hand‑off.',
  ],
  driving: [
    'Confirm lesson goal and experience level.',
    'Prioritize safety and clear instructions.',
    'Review progress and next steps at the end.',
  ],
  gym: [
    'Sanitize equipment before and after sessions.',
    'Confirm goals and safety concerns.',
    'Maintain a motivating, supportive atmosphere.',
  ],
  supercar: [
    'Verify licence and eligibility before arrival.',
    'Provide a clear safety briefing.',
    'Inspect the vehicle before and after the session.',
  ],
  photography: [
    'Confirm the shot list and timing ahead of time.',
    'Keep the set tidy and organized.',
    'Communicate next steps for edits and delivery.',
  ],
  solicitor: [
    'Confirm scope, urgency, and key documents.',
    'Maintain confidentiality at all times.',
    'Summarize next steps clearly after meetings.',
  ],
  accountant: [
    'Confirm required documents in advance.',
    'Keep information confidential and secure.',
    'Summarize next steps and deadlines clearly.',
  ],
  tutoring: [
    'Confirm learning goals before the session.',
    'Keep the lesson structured and focused.',
    'Summarize progress and next steps at the end.',
  ],
}

const BOOKING_THEME_BY_VERTICAL: Partial<Record<VerticalId, string>> = {
  dental: 'mist',
  physio: 'mist',
  optician: 'mist',
  vet: 'soft',
  beauty: 'blush',
  hairsalon: 'slate',
  barber: 'slate',
  nails: 'blush',
  lash: 'blush',
  aesthetics: 'blush',
  spa: 'soft',
  nightclub: 'slate',
  restaurant: 'sand',
  takeaway: 'sand',
  carwash: 'mist',
  auto: 'slate',
  driving: 'mist',
  gym: 'slate',
  supercar: 'slate',
  photography: 'slate',
  escape: 'sand',
  solicitor: 'mist',
  accountant: 'mist',
  tutoring: 'mist',
}

export function getRecommendedGuidelines(vertical?: string | null): string[] {
  if (!vertical) return DEFAULT_GUIDELINES
  return GUIDELINES_BY_VERTICAL[vertical as VerticalId] || DEFAULT_GUIDELINES
}

/**
 * If `guidelines` exactly matches a known vertical's recommended set, returns
 * that vertical's id — otherwise returns null.
 * Used to detect cross-vertical contamination in DB-stored guidelines.
 */
export function detectGuidelineVertical(guidelines: string[]): VerticalId | null {
  if (!guidelines || guidelines.length === 0) return null
  for (const [verticalId, verticalGuidelines] of Object.entries(GUIDELINES_BY_VERTICAL) as [VerticalId, string[]][]) {
    if (
      verticalGuidelines.length === guidelines.length &&
      verticalGuidelines.every((g, i) => g === guidelines[i])
    ) {
      return verticalId
    }
  }
  return null
}

export function getRecommendedBookingTheme(vertical?: string | null): string {
  if (!vertical) return 'soft'
  return BOOKING_THEME_BY_VERTICAL[vertical as VerticalId] || 'soft'
}
