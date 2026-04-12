export type VerticalId =
  | 'dental'
  | 'beauty'
  | 'hairsalon'
  | 'nightclub'
  | 'spa'
  | 'gym'
  | 'optician'
  | 'vet'
  | 'auto'
  | 'tutoring'
  | 'restaurant'
  | 'barber'
  | 'tattoo'
  | 'carwash'
  | 'driving'
  | 'takeaway'
  | 'supercar'
  | 'photography'
  | 'grooming'
  | 'physio'
  | 'nails'
  | 'aesthetics'
  | 'lash'
  | 'escape'
  | 'solicitor'
  | 'accountant'

export interface DefaultService {
  name: string
  description: string
  price_pence: number
  duration_minutes: number
  deposit_pence: number
  requires_deposit: boolean
}

export interface BookingField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number'
  required?: boolean
  placeholder?: string
  options?: string[]
}

export interface Vertical {
  id: VerticalId
  label: string
  icon: string
  colour: string
  tagline: string
  bookingPageLabel: string
  customerLabel: string
  staffLabel: string
  billingModel: string           // e.g. "£79/mo"
  defaultServices: DefaultService[]
  features: string[]
}

export const VERTICALS: Record<VerticalId, Vertical> = {

  // ─── Original 9 ──────────────────────────────────────────────────────────

  dental: {
    id: 'dental',
    label: 'Dental Practice',
    icon: '🦷',
    colour: '#0d6e6e',
    tagline: 'Keep chairs filled with a booking flow built for modern dental practices.',
    bookingPageLabel: 'Book an Appointment',
    customerLabel: 'Patient',
    staffLabel: 'Dentist',
    billingModel: '£199/mo',
    defaultServices: [
      { name: 'NHS Check-up', description: 'Routine dental examination', price_pence: 2740, duration_minutes: 30, deposit_pence: 0, requires_deposit: false },
      { name: 'Private Consultation', description: 'Comprehensive private dental consultation', price_pence: 7500, duration_minutes: 45, deposit_pence: 2500, requires_deposit: true },
      { name: 'Emergency Appointment', description: 'Same-day emergency dental care', price_pence: 5500, duration_minutes: 20, deposit_pence: 2000, requires_deposit: true },
      { name: 'Scale & Polish', description: 'Professional teeth cleaning', price_pence: 6500, duration_minutes: 30, deposit_pence: 0, requires_deposit: false },
      { name: 'Teeth Whitening', description: 'Professional whitening treatment', price_pence: 35000, duration_minutes: 60, deposit_pence: 10000, requires_deposit: true },
    ],
    features: ['Patient reminders', 'GDPR compliance', 'NHS & private billing', 'Recall automation'],
  },

  beauty: {
    id: 'beauty',
    label: 'Beauty Salon',
    icon: '💄',
    colour: '#c4893a',
    tagline: 'Turn enquiries into paid appointments with a cleaner salon booking journey.',
    bookingPageLabel: 'Book a Treatment',
    customerLabel: 'Client',
    staffLabel: 'Stylist',
    billingModel: '£79/mo',
    defaultServices: [
      { name: 'Haircut & Style', description: 'Cut, style and blow dry', price_pence: 3500, duration_minutes: 45, deposit_pence: 0, requires_deposit: false },
      { name: 'Colour Treatment', description: 'Full colour or highlights', price_pence: 8500, duration_minutes: 90, deposit_pence: 2000, requires_deposit: true },
      { name: 'Blow Dry', description: 'Wash, blow dry and style', price_pence: 2500, duration_minutes: 30, deposit_pence: 0, requires_deposit: false },
      { name: 'Manicure & Nails', description: 'Gel or acrylic nails', price_pence: 3000, duration_minutes: 45, deposit_pence: 1000, requires_deposit: true },
      { name: 'Facial Treatment', description: 'Deep cleanse facial', price_pence: 5500, duration_minutes: 60, deposit_pence: 0, requires_deposit: false },
    ],
    features: ['Stylist selector', 'Deposit protection', 'Instagram booking link', 'SMS reminders'],
  },

  hairsalon: {
    id: 'hairsalon',
    label: 'Hair Salon',
    icon: '💇',
    colour: '#9333ea',
    tagline: 'Keep chairs full and colour diaries organised from one polished system.',
    bookingPageLabel: 'Book a Hair Appointment',
    customerLabel: 'Client',
    staffLabel: 'Stylist',
    billingModel: '£79/mo',
    defaultServices: [
      { name: "Women's Cut & Style", description: 'Wash, cut and blow dry', price_pence: 4500, duration_minutes: 60, deposit_pence: 0, requires_deposit: false },
      { name: "Men's Cut", description: 'Gents cut and style', price_pence: 2200, duration_minutes: 30, deposit_pence: 0, requires_deposit: false },
      { name: 'Full Colour', description: 'Full head colour or highlights', price_pence: 9500, duration_minutes: 120, deposit_pence: 2500, requires_deposit: true },
      { name: 'Blow Dry & Style', description: 'Wash, blow dry and finish', price_pence: 2500, duration_minutes: 30, deposit_pence: 0, requires_deposit: false },
      { name: 'Keratin Treatment', description: 'Smoothing keratin treatment', price_pence: 18000, duration_minutes: 180, deposit_pence: 5000, requires_deposit: true },
    ],
    features: ['Stylist selector', 'Colour consultation notes', 'Loyalty tracking', 'SMS reminders'],
  },

  nightclub: {
    id: 'nightclub',
    label: 'Nightclub & Venue',
    icon: '🎵',
    colour: '#6d28d9',
    tagline: 'Drive table revenue before doors open with a nightlife-first booking flow.',
    bookingPageLabel: 'Reserve a Table',
    customerLabel: 'Guest',
    staffLabel: 'Host',
    billingModel: '£99/mo',
    defaultServices: [
      { name: 'Table Reservation', description: 'Standard table for the evening', price_pence: 0, duration_minutes: 240, deposit_pence: 0, requires_deposit: false },
      { name: 'VIP Booth', description: 'Premium VIP booth with bottle service', price_pence: 0, duration_minutes: 300, deposit_pence: 15000, requires_deposit: true },
      { name: 'Guestlist Entry', description: 'Priority queue entry', price_pence: 1500, duration_minutes: 30, deposit_pence: 0, requires_deposit: false },
      { name: 'Birthday Package', description: 'Birthday booth with decorations & prosecco', price_pence: 0, duration_minutes: 300, deposit_pence: 25000, requires_deposit: true },
    ],
    features: ['VIP table map', 'Guestlist management', 'Deposit collection', 'Event nights'],
  },

  spa: {
    id: 'spa',
    label: 'Spa & Wellness Centre',
    icon: '🧖',
    colour: '#059669',
    tagline: 'Fill treatment rooms with a calmer, premium guest journey from first click.',
    bookingPageLabel: 'Book a Treatment',
    customerLabel: 'Guest',
    staffLabel: 'Therapist',
    billingModel: '£99/mo',
    defaultServices: [
      { name: 'Swedish Massage', description: '60-minute full body Swedish massage', price_pence: 6500, duration_minutes: 60, deposit_pence: 0, requires_deposit: false },
      { name: 'Hot Stone Massage', description: 'Relaxing hot stone therapy', price_pence: 8500, duration_minutes: 90, deposit_pence: 2000, requires_deposit: false },
      { name: 'Luxury Facial', description: 'Deep cleanse and rejuvenating facial', price_pence: 5500, duration_minutes: 60, deposit_pence: 0, requires_deposit: false },
      { name: 'Couples Package', description: 'Side-by-side massage for two', price_pence: 16000, duration_minutes: 90, deposit_pence: 5000, requires_deposit: true },
      { name: 'Spa Day Package', description: 'Full day access with lunch and treatments', price_pence: 12500, duration_minutes: 480, deposit_pence: 5000, requires_deposit: true },
    ],
    features: ['Therapist allocation', 'Room management', 'Add-on upsells', 'Couples booking'],
  },

  gym: {
    id: 'gym',
    label: 'Gym & Fitness Studio',
    icon: '💪',
    colour: '#dc2626',
    tagline: 'Keep classes, PT sessions and memberships moving without admin drag.',
    bookingPageLabel: 'Book a Session',
    customerLabel: 'Member',
    staffLabel: 'Trainer',
    billingModel: '£99/mo',
    defaultServices: [
      { name: '1-to-1 PT Session', description: 'Personal training with your trainer', price_pence: 5000, duration_minutes: 60, deposit_pence: 0, requires_deposit: false },
      { name: 'Group Class', description: 'Group fitness class (max 12)', price_pence: 1200, duration_minutes: 45, deposit_pence: 0, requires_deposit: false },
      { name: 'Gym Induction', description: 'First-timer gym orientation', price_pence: 3000, duration_minutes: 60, deposit_pence: 0, requires_deposit: false },
      { name: 'Nutrition Consultation', description: '1-hour nutrition and diet planning', price_pence: 4500, duration_minutes: 60, deposit_pence: 0, requires_deposit: false },
      { name: 'Body Composition Scan', description: 'InBody scan with report', price_pence: 2500, duration_minutes: 30, deposit_pence: 0, requires_deposit: false },
    ],
    features: ['Live class capacity', 'Waitlist management', 'Package memberships', 'Progress tracking'],
  },

  optician: {
    id: 'optician',
    label: 'Optician & Eye Care',
    icon: '👁️',
    colour: '#0369a1',
    tagline: 'Let patients book eye care properly, with the right details captured first time.',
    bookingPageLabel: 'Book an Eye Test',
    customerLabel: 'Patient',
    staffLabel: 'Optometrist',
    billingModel: '£149/mo',
    defaultServices: [
      { name: 'Eye Test', description: 'Full sight test with digital retinal scan', price_pence: 2500, duration_minutes: 30, deposit_pence: 0, requires_deposit: false },
      { name: 'Contact Lens Fitting', description: 'Contact lens assessment and fitting', price_pence: 4000, duration_minutes: 45, deposit_pence: 0, requires_deposit: false },
      { name: 'Frame Styling Consultation', description: 'Free expert frame selection', price_pence: 0, duration_minutes: 30, deposit_pence: 0, requires_deposit: false },
      { name: "Children's Eye Test", description: 'Specialist paediatric eye examination', price_pence: 0, duration_minutes: 45, deposit_pence: 0, requires_deposit: false },
    ],
    features: ['Recall reminders', 'NHS & private', 'Frame catalogue', 'Prescription records'],
  },

  vet: {
    id: 'vet',
    label: 'Vet & Pet Groomer',
    icon: '🐾',
    colour: '#7c3aed',
    tagline: 'Give pet owners a smoother way to book care, grooming and repeat visits.',
    bookingPageLabel: 'Book an Appointment',
    customerLabel: 'Pet Owner',
    staffLabel: 'Vet',
    billingModel: '£49/mo',
    defaultServices: [
      { name: 'General Consultation', description: 'Standard vet examination', price_pence: 4500, duration_minutes: 20, deposit_pence: 0, requires_deposit: false },
      { name: 'Vaccination', description: 'Annual vaccination appointment', price_pence: 3500, duration_minutes: 15, deposit_pence: 0, requires_deposit: false },
      { name: 'Pet Grooming', description: 'Full groom: bath, cut and dry', price_pence: 4000, duration_minutes: 60, deposit_pence: 1000, requires_deposit: false },
      { name: 'Dental Clean', description: 'Professional dental scaling', price_pence: 22000, duration_minutes: 120, deposit_pence: 5000, requires_deposit: true },
      { name: 'Microchipping', description: 'Pet microchip implant and registration', price_pence: 2000, duration_minutes: 15, deposit_pence: 0, requires_deposit: false },
    ],
    features: ['Pet profiles', 'Breed/size notes', 'Vaccine reminders', 'Repeat booking'],
  },

  auto: {
    id: 'auto',
    label: 'Mechanic & MOT Centre',
    icon: '🔧',
    colour: '#b45309',
    tagline: 'Keep ramps productive with vehicle-ready bookings and smarter reminder flow.',
    bookingPageLabel: 'Book Your Vehicle',
    customerLabel: 'Customer',
    staffLabel: 'Mechanic',
    billingModel: '£79/mo',
    defaultServices: [
      { name: 'MOT Test', description: 'Official DVSA MOT inspection', price_pence: 5485, duration_minutes: 60, deposit_pence: 0, requires_deposit: false },
      { name: 'Full Service', description: 'Comprehensive vehicle service', price_pence: 12000, duration_minutes: 180, deposit_pence: 0, requires_deposit: false },
      { name: 'Diagnostic Check', description: 'Electronic fault diagnosis', price_pence: 4500, duration_minutes: 30, deposit_pence: 0, requires_deposit: false },
      { name: 'MOT + Service', description: 'MOT and full service combined', price_pence: 16500, duration_minutes: 240, deposit_pence: 0, requires_deposit: false },
      { name: 'Tyre Fitting', description: 'Supply and fit new tyres', price_pence: 0, duration_minutes: 60, deposit_pence: 0, requires_deposit: false },
    ],
    features: ['Reg plate capture', 'MOT reminder automation', 'Vehicle history', 'Courtesy car booking'],
  },

  tutoring: {
    id: 'tutoring',
    label: 'Personal Trainer',
    icon: '🏋️',
    colour: '#0891b2',
    tagline: 'Keep your calendar full with session bookings, packages and client tracking.',
    bookingPageLabel: 'Book a Session',
    customerLabel: 'Client',
    staffLabel: 'Trainer',
    billingModel: '£49/mo',
    defaultServices: [
      { name: '1-to-1 Session', description: 'Private one-hour tutoring session', price_pence: 4000, duration_minutes: 60, deposit_pence: 0, requires_deposit: false },
      { name: 'Group Session', description: 'Small group learning (max 6)', price_pence: 1500, duration_minutes: 60, deposit_pence: 0, requires_deposit: false },
      { name: 'Initial Assessment', description: 'Learning assessment and tailored plan', price_pence: 2500, duration_minutes: 45, deposit_pence: 0, requires_deposit: false },
      { name: 'Exam Intensive', description: 'Exam preparation intensive session', price_pence: 6000, duration_minutes: 120, deposit_pence: 0, requires_deposit: false },
    ],
    features: ['Session notes', 'Progress tracking', 'Parent portal', 'Block booking discounts'],
  },

  // ─── The 15 additional niches from your pitch system ─────────────────────

  restaurant: {
    id: 'restaurant',
    label: 'Restaurant',
    icon: '🍽️',
    colour: '#e11d48',
    tagline: 'Protect prime tables with deposits, smoother service flow and fewer no-shows.',
    bookingPageLabel: 'Reserve a Table',
    customerLabel: 'Diner',
    staffLabel: 'Host',
    billingModel: '£49/mo',
    defaultServices: [
      { name: 'Table for 2', description: 'Dinner reservation for two', price_pence: 0, duration_minutes: 90, deposit_pence: 1000, requires_deposit: true },
      { name: 'Table for 4', description: 'Dinner reservation for four', price_pence: 0, duration_minutes: 90, deposit_pence: 2000, requires_deposit: true },
      { name: 'Table for 6+', description: 'Group dinner reservation', price_pence: 0, duration_minutes: 120, deposit_pence: 3000, requires_deposit: true },
      { name: 'Private Dining', description: 'Exclusive private dining room', price_pence: 0, duration_minutes: 180, deposit_pence: 10000, requires_deposit: true },
      { name: 'Sunday Lunch', description: 'Sunday roast for the family', price_pence: 0, duration_minutes: 120, deposit_pence: 1500, requires_deposit: true },
    ],
    features: ['No-show deposits', 'Live admin dashboard', 'Special occasion notes', 'Group bookings'],
  },

  barber: {
    id: 'barber',
    label: 'Barber Shop',
    icon: '✂️',
    colour: '#0f766e',
    tagline: 'Keep every chair earning with walk-ins, bookings and live seat availability.',
    bookingPageLabel: 'Book a Cut',
    customerLabel: 'Client',
    staffLabel: 'Barber',
    billingModel: '£79/mo',
    defaultServices: [
      { name: 'Haircut', description: 'Classic haircut and style', price_pence: 1500, duration_minutes: 30, deposit_pence: 0, requires_deposit: false },
      { name: 'Haircut & Beard', description: 'Haircut with beard trim and shape', price_pence: 2200, duration_minutes: 45, deposit_pence: 0, requires_deposit: false },
      { name: 'Beard Trim', description: 'Beard shaping and trim only', price_pence: 1000, duration_minutes: 20, deposit_pence: 0, requires_deposit: false },
      { name: 'Hot Towel Shave', description: 'Traditional straight-razor shave', price_pence: 2000, duration_minutes: 40, deposit_pence: 0, requires_deposit: false },
      { name: 'Kids Cut', description: 'Children\'s haircut (under 12)', price_pence: 1000, duration_minutes: 20, deposit_pence: 0, requires_deposit: false },
    ],
    features: ['Live chair availability map', 'Walk-in toggle', 'Barber selector', 'Quick booking flow'],
  },

  tattoo: {
    id: 'tattoo',
    label: 'Tattoo Studio',
    icon: '🖋️',
    colour: '#1e1b4b',
    tagline: 'Filter for serious clients with deposits, portfolios and better pre-visit info.',
    bookingPageLabel: 'Book a Session',
    customerLabel: 'Client',
    staffLabel: 'Artist',
    billingModel: '£49/mo',
    defaultServices: [
      { name: 'Consultation', description: 'Free design consultation with artist', price_pence: 0, duration_minutes: 30, deposit_pence: 0, requires_deposit: false },
      { name: 'Small Tattoo', description: 'Small piece up to 2 hours', price_pence: 15000, duration_minutes: 120, deposit_pence: 5000, requires_deposit: true },
      { name: 'Half Day Session', description: '4-hour tattoo session', price_pence: 30000, duration_minutes: 240, deposit_pence: 8000, requires_deposit: true },
      { name: 'Full Day Session', description: '8-hour full day session', price_pence: 60000, duration_minutes: 480, deposit_pence: 15000, requires_deposit: true },
      { name: 'Touch Up', description: 'Touch up on existing work', price_pence: 5000, duration_minutes: 60, deposit_pence: 2000, requires_deposit: true },
    ],
    features: ['Artist portfolio', 'Reference image upload', 'Deposit protection', 'Session notes'],
  },

  carwash: {
    id: 'carwash',
    label: 'Car Wash & Valet',
    icon: '🚿',
    colour: '#0284c7',
    tagline: 'Run more washes per day with pre-booked bays, packages and better flow.',
    bookingPageLabel: 'Book a Wash',
    customerLabel: 'Customer',
    staffLabel: 'Valet',
    billingModel: '£49/mo',
    defaultServices: [
      { name: 'Exterior Wash', description: 'Hand wash exterior only', price_pence: 1500, duration_minutes: 30, deposit_pence: 0, requires_deposit: false },
      { name: 'Full Valet', description: 'Interior and exterior full valet', price_pence: 7500, duration_minutes: 180, deposit_pence: 0, requires_deposit: false },
      { name: 'Mini Valet', description: 'Quick interior and exterior clean', price_pence: 3500, duration_minutes: 60, deposit_pence: 0, requires_deposit: false },
      { name: 'Engine Clean', description: 'Professional engine bay clean', price_pence: 5000, duration_minutes: 60, deposit_pence: 0, requires_deposit: false },
      { name: 'Ceramic Coating', description: 'Professional ceramic coating application', price_pence: 40000, duration_minutes: 480, deposit_pence: 10000, requires_deposit: true },
    ],
    features: ['Pre-booking calendar', 'Package selector', 'Vehicle size picker', 'Mobile valet support'],
  },

  driving: {
    id: 'driving',
    label: 'Driving Instructor',
    icon: '🚗',
    colour: '#ca8a04',
    tagline: 'Keep lessons, test prep and student progress organised in one driving diary.',
    bookingPageLabel: 'Book a Lesson',
    customerLabel: 'Student',
    staffLabel: 'Instructor',
    billingModel: '£49/mo',
    defaultServices: [
      { name: '1-Hour Lesson', description: 'Standard 1-hour driving lesson', price_pence: 3500, duration_minutes: 60, deposit_pence: 0, requires_deposit: false },
      { name: '2-Hour Lesson', description: 'Extended 2-hour lesson', price_pence: 6500, duration_minutes: 120, deposit_pence: 0, requires_deposit: false },
      { name: 'Mock Test', description: 'Full DVSA mock driving test', price_pence: 5500, duration_minutes: 90, deposit_pence: 0, requires_deposit: false },
      { name: 'Motorway Lesson', description: 'Post-test motorway driving', price_pence: 4000, duration_minutes: 60, deposit_pence: 0, requires_deposit: false },
      { name: 'Block of 10 Lessons', description: '10 lessons booked in advance (discount)', price_pence: 32000, duration_minutes: 60, deposit_pence: 10000, requires_deposit: true },
    ],
    features: ['Weekly calendar', 'Student management', 'Test date tracking', 'Lesson history'],
  },

  takeaway: {
    id: 'takeaway',
    label: 'Takeaway & Pre-Order',
    icon: '🍕',
    colour: '#ea580c',
    tagline: 'Control kitchen flow with timed pre-orders, prep visibility and fewer surprises.',
    bookingPageLabel: 'Pre-Order Now',
    customerLabel: 'Customer',
    staffLabel: 'Chef',
    billingModel: '£29/mo',
    defaultServices: [
      { name: 'Collection Slot', description: 'Reserve a 15-min collection window', price_pence: 0, duration_minutes: 15, deposit_pence: 0, requires_deposit: false },
      { name: 'Party Order', description: 'Large group order (10+ items)', price_pence: 0, duration_minutes: 30, deposit_pence: 2000, requires_deposit: true },
      { name: 'Catering Order', description: 'Event catering pre-order', price_pence: 0, duration_minutes: 60, deposit_pence: 5000, requires_deposit: true },
    ],
    features: ['Collection time slots', 'Menu category ordering', 'Kitchen load management', 'Order reminders'],
  },

  supercar: {
    id: 'supercar',
    label: 'Supercar & Luxury Rental',
    icon: '🏎️',
    colour: '#991b1b',
    tagline: 'Run luxury rentals with cleaner reservations, deposits and return visibility.',
    bookingPageLabel: 'Reserve Your Car',
    customerLabel: 'Guest',
    staffLabel: 'Agent',
    billingModel: '£399/mo',
    defaultServices: [
      { name: 'Half Day Hire', description: '4-hour supercar experience', price_pence: 50000, duration_minutes: 240, deposit_pence: 20000, requires_deposit: true },
      { name: 'Full Day Hire', description: '8-hour full day rental', price_pence: 90000, duration_minutes: 480, deposit_pence: 30000, requires_deposit: true },
      { name: 'Weekend Hire', description: 'Friday to Monday rental', price_pence: 200000, duration_minutes: 4320, deposit_pence: 50000, requires_deposit: true },
      { name: 'Gift Experience Voucher', description: 'Supercar driving gift voucher', price_pence: 39900, duration_minutes: 120, deposit_pence: 10000, requires_deposit: true },
      { name: 'Chauffeur Service', description: 'Chauffeur-driven luxury transfer', price_pence: 30000, duration_minutes: 240, deposit_pence: 10000, requires_deposit: true },
    ],
    features: ['Stripe deposits £1k–£5k', 'Damage waiver', 'Gift vouchers', 'Dynamic weekend pricing'],
  },

  photography: {
    id: 'photography',
    label: 'Photography Studio',
    icon: '📸',
    colour: '#475569',
    tagline: 'Win back enquiries with a studio booking flow that looks as premium as your work.',
    bookingPageLabel: 'Book a Shoot',
    customerLabel: 'Client',
    staffLabel: 'Photographer',
    billingModel: '£99/mo',
    defaultServices: [
      { name: 'Portrait Session', description: '1-hour portrait shoot', price_pence: 15000, duration_minutes: 60, deposit_pence: 5000, requires_deposit: true },
      { name: 'Family Shoot', description: '2-hour family portrait session', price_pence: 25000, duration_minutes: 120, deposit_pence: 8000, requires_deposit: true },
      { name: 'Headshots', description: 'Professional business headshots', price_pence: 12000, duration_minutes: 45, deposit_pence: 4000, requires_deposit: true },
      { name: 'Product Photography', description: 'E-commerce product shoot (20 items)', price_pence: 35000, duration_minutes: 180, deposit_pence: 10000, requires_deposit: true },
      { name: 'Newborn Session', description: 'Newborn lifestyle photography', price_pence: 30000, duration_minutes: 180, deposit_pence: 10000, requires_deposit: true },
    ],
    features: ['Shoot type selector', 'Deposit required', 'Package picker', 'Delivery timeline notes'],
  },

  grooming: {
    id: 'grooming',
    label: 'Dog Grooming & Pet Services',
    icon: '🐕',
    colour: '#92400e',
    tagline: 'Keep pet owners returning with a smoother grooming flow and cleaner repeat bookings.',
    bookingPageLabel: 'Book a Groom',
    customerLabel: 'Pet Owner',
    staffLabel: 'Groomer',
    billingModel: '£49/mo',
    defaultServices: [
      { name: 'Full Groom (Small)', description: 'Bath, cut, dry, nail trim — small breed', price_pence: 4000, duration_minutes: 60, deposit_pence: 1000, requires_deposit: false },
      { name: 'Full Groom (Medium)', description: 'Bath, cut, dry, nail trim — medium breed', price_pence: 5500, duration_minutes: 90, deposit_pence: 1000, requires_deposit: false },
      { name: 'Full Groom (Large)', description: 'Bath, cut, dry, nail trim — large breed', price_pence: 7000, duration_minutes: 120, deposit_pence: 2000, requires_deposit: true },
      { name: 'Bath & Dry', description: 'Shampoo and blow dry only', price_pence: 3000, duration_minutes: 45, deposit_pence: 0, requires_deposit: false },
      { name: 'Nail Trim', description: 'Nail clipping and filing', price_pence: 1000, duration_minutes: 15, deposit_pence: 0, requires_deposit: false },
    ],
    features: ['Breed/size selector', 'Pet profile notes', 'Repeat booking automation', 'Vaccine date reminders'],
  },

  physio: {
    id: 'physio',
    label: 'Physiotherapy & Sports Therapy',
    icon: '🩺',
    colour: '#0e7490',
    tagline: 'Deliver a more professional clinical journey from first booking to follow-up.',
    bookingPageLabel: 'Book an Appointment',
    customerLabel: 'Patient',
    staffLabel: 'Physiotherapist',
    billingModel: '£149/mo',
    defaultServices: [
      { name: 'Initial Assessment', description: 'First appointment — full assessment', price_pence: 7000, duration_minutes: 60, deposit_pence: 0, requires_deposit: false },
      { name: 'Follow-Up Session', description: 'Treatment follow-up session', price_pence: 5500, duration_minutes: 45, deposit_pence: 0, requires_deposit: false },
      { name: 'Sports Massage', description: 'Deep tissue sports massage', price_pence: 6000, duration_minutes: 60, deposit_pence: 0, requires_deposit: false },
      { name: 'Acupuncture', description: 'Dry needling / acupuncture session', price_pence: 5500, duration_minutes: 45, deposit_pence: 0, requires_deposit: false },
      { name: 'Block of 6 Sessions', description: 'Pre-paid block of 6 treatments', price_pence: 30000, duration_minutes: 45, deposit_pence: 15000, requires_deposit: true },
    ],
    features: ['GDPR compliance', 'Intake forms', 'Therapist selector', 'Treatment notes'],
  },

  nails: {
    id: 'nails',
    label: 'Nail Technician',
    icon: '💅',
    colour: '#db2777',
    tagline: 'Turn DMs into confirmed nail bookings with a cleaner, higher-converting flow.',
    bookingPageLabel: 'Book a Nail Appointment',
    customerLabel: 'Client',
    staffLabel: 'Nail Tech',
    billingModel: '£49/mo',
    defaultServices: [
      { name: 'Gel Manicure', description: 'Gel polish application — hands', price_pence: 3500, duration_minutes: 60, deposit_pence: 1000, requires_deposit: true },
      { name: 'Acrylic Full Set', description: 'Full acrylic nail set', price_pence: 5000, duration_minutes: 90, deposit_pence: 1500, requires_deposit: true },
      { name: 'Infill / Maintenance', description: 'Acrylic or gel infill', price_pence: 3000, duration_minutes: 60, deposit_pence: 1000, requires_deposit: true },
      { name: 'Gel Pedicure', description: 'Gel polish application — feet', price_pence: 4000, duration_minutes: 75, deposit_pence: 1000, requires_deposit: true },
      { name: 'Nail Art (per nail)', description: 'Custom nail art design', price_pence: 500, duration_minutes: 15, deposit_pence: 0, requires_deposit: false },
    ],
    features: ['Instagram booking link', 'Deposit protection', 'Nail style notes', 'Repeat client automation'],
  },

  aesthetics: {
    id: 'aesthetics',
    label: 'Aesthetics Clinic',
    icon: '✨',
    colour: '#7c3aed',
    tagline: 'Run consultations and treatments with a polished, compliance-aware booking journey.',
    bookingPageLabel: 'Book a Consultation',
    customerLabel: 'Client',
    staffLabel: 'Practitioner',
    billingModel: '£149/mo',
    defaultServices: [
      { name: 'Botox Consultation', description: 'Free consultation prior to treatment', price_pence: 0, duration_minutes: 30, deposit_pence: 0, requires_deposit: false },
      { name: 'Botox Treatment', description: 'Anti-wrinkle injection treatment', price_pence: 25000, duration_minutes: 30, deposit_pence: 5000, requires_deposit: true },
      { name: 'Lip Filler', description: 'Hyaluronic acid lip enhancement', price_pence: 30000, duration_minutes: 45, deposit_pence: 5000, requires_deposit: true },
      { name: 'Dermal Filler', description: 'Cheek or jaw filler treatment', price_pence: 35000, duration_minutes: 45, deposit_pence: 8000, requires_deposit: true },
      { name: 'Skin Booster', description: 'Profhilo or Juvederm Volite treatment', price_pence: 40000, duration_minutes: 60, deposit_pence: 10000, requires_deposit: true },
    ],
    features: ['CQC compliance note', 'Consultation flow', 'Medical history capture', 'Deposit protection'],
  },

  lash: {
    id: 'lash',
    label: 'Lash & Brow Studio',
    icon: '👁️',
    colour: '#be185d',
    tagline: 'Turn lash enquiries into confirmed appointments with a fast, premium flow.',
    bookingPageLabel: 'Book a Lash Appointment',
    customerLabel: 'Client',
    staffLabel: 'Lash Artist',
    billingModel: '£49/mo',
    defaultServices: [
      { name: 'Classic Lash Full Set', description: 'Classic individual lash extensions', price_pence: 6000, duration_minutes: 90, deposit_pence: 1500, requires_deposit: true },
      { name: 'Hybrid Lash Full Set', description: 'Mix of classic and volume', price_pence: 7500, duration_minutes: 120, deposit_pence: 2000, requires_deposit: true },
      { name: 'Volume Lash Full Set', description: 'Russian volume lashes', price_pence: 9000, duration_minutes: 150, deposit_pence: 2500, requires_deposit: true },
      { name: 'Lash Infill', description: '2–3 week maintenance infill', price_pence: 4500, duration_minutes: 60, deposit_pence: 1000, requires_deposit: true },
      { name: 'Brow Lamination & Tint', description: 'Brow lamination with tint and shape', price_pence: 4500, duration_minutes: 60, deposit_pence: 1000, requires_deposit: true },
    ],
    features: ['Style selector (classic/hybrid/volume)', 'Deposit protection', 'Infill reminders', 'Instagram link'],
  },

  escape: {
    id: 'escape',
    label: 'Escape Room & Entertainment',
    icon: '🔐',
    colour: '#1d4ed8',
    tagline: 'Sell sessions cleanly with timed entry, group booking flow and upfront payment.',
    bookingPageLabel: 'Book Your Adventure',
    customerLabel: 'Guest',
    staffLabel: 'Game Master',
    billingModel: '£99/mo',
    defaultServices: [
      { name: 'Escape Room (2 players)', description: '60-minute escape room experience for 2', price_pence: 4000, duration_minutes: 75, deposit_pence: 4000, requires_deposit: true },
      { name: 'Escape Room (4 players)', description: '60-minute escape room experience for 4', price_pence: 7600, duration_minutes: 75, deposit_pence: 7600, requires_deposit: true },
      { name: 'Escape Room (6 players)', description: '60-minute escape room experience for 6', price_pence: 10800, duration_minutes: 75, deposit_pence: 10800, requires_deposit: true },
      { name: 'Private Birthday Party', description: 'Private room hire + birthday extras', price_pence: 15000, duration_minutes: 120, deposit_pence: 7500, requires_deposit: true },
      { name: 'Team Building Package', description: 'Corporate team building package', price_pence: 30000, duration_minutes: 180, deposit_pence: 15000, requires_deposit: true },
    ],
    features: ['Room selector', 'Group size picker', 'Full upfront payment', 'Corporate packages'],
  },

  solicitor: {
    id: 'solicitor',
    label: 'Solicitor & Legal Practice',
    icon: '⚖️',
    colour: '#374151',
    tagline: 'Give legal clients a more professional first step with cleaner intake and scheduling.',
    bookingPageLabel: 'Book a Consultation',
    customerLabel: 'Client',
    staffLabel: 'Solicitor',
    billingModel: '£199/mo',
    defaultServices: [
      { name: 'Initial Consultation (30 min)', description: 'Free initial legal consultation', price_pence: 0, duration_minutes: 30, deposit_pence: 0, requires_deposit: false },
      { name: 'Conveyancing Consultation', description: 'Property purchase/sale legal advice', price_pence: 25000, duration_minutes: 60, deposit_pence: 0, requires_deposit: false },
      { name: 'Employment Advice', description: 'Employment law consultation', price_pence: 20000, duration_minutes: 60, deposit_pence: 0, requires_deposit: false },
      { name: 'Will & Probate', description: 'Will writing consultation', price_pence: 15000, duration_minutes: 60, deposit_pence: 0, requires_deposit: false },
      { name: 'Family Law Consultation', description: 'Divorce/family matters consultation', price_pence: 25000, duration_minutes: 60, deposit_pence: 0, requires_deposit: false },
    ],
    features: ['Matter type selector', 'GDPR compliance', 'Document checklist', 'Recurring meeting support'],
  },

  accountant: {
    id: 'accountant',
    label: 'Accountant & Financial Advisor',
    icon: '📊',
    colour: '#064e3b',
    tagline: 'Handle meetings, reviews and seasonal demand with a calmer client booking system.',
    bookingPageLabel: 'Book an Appointment',
    customerLabel: 'Client',
    staffLabel: 'Accountant',
    billingModel: '£199/mo',
    defaultServices: [
      { name: 'Free Initial Meeting', description: 'No-obligation introduction meeting', price_pence: 0, duration_minutes: 30, deposit_pence: 0, requires_deposit: false },
      { name: 'Self-Assessment Consultation', description: 'Self-assessment tax return advice', price_pence: 15000, duration_minutes: 60, deposit_pence: 0, requires_deposit: false },
      { name: 'Business Accounts Review', description: 'Annual accounts and tax planning', price_pence: 40000, duration_minutes: 90, deposit_pence: 0, requires_deposit: false },
      { name: 'VAT Registration Advice', description: 'VAT threshold and registration guidance', price_pence: 20000, duration_minutes: 60, deposit_pence: 0, requires_deposit: false },
      { name: 'Business Start-Up Package', description: 'Company formation and setup advice', price_pence: 50000, duration_minutes: 90, deposit_pence: 0, requires_deposit: false },
    ],
    features: ['Recurring meetings', 'Document checklist', 'Self-assessment season pitch', 'Client portal'],
  },
}

export const VERTICAL_LIST = Object.values(VERTICALS)

export const VERTICAL_BOOKING_FIELDS: Record<VerticalId, BookingField[]> = {
  dental: [
    {
      id: 'patient_type',
      label: 'Have you been to us before?',
      type: 'select',
      required: true,
      placeholder: 'Select...',
      options: ['Yes - I am an existing patient', "No - I'm a new patient"],
    },
    {
      id: 'visit_reason',
      label: 'What can we help you with?',
      type: 'select',
      required: true,
      placeholder: 'Select reason...',
      options: [
        'Emergency / toothache (price varies £20-£195)',
        'Examination / full check-up (x-ray if needed)',
        'Smile makeover assessment',
        'Invisalign assessment',
        'Implant assessment (x-ray £32 if needed)',
        'Other (we will advise after assessment)',
      ],
    },
    { id: 'medical_conditions', label: 'Medical conditions', type: 'textarea', placeholder: 'Please list any conditions (optional)' },
    { id: 'current_medication', label: 'Current medication', type: 'text', placeholder: 'Optional' },
    { id: 'allergies', label: 'Allergies / sensitivities', type: 'textarea', placeholder: 'e.g. latex, antibiotics (optional)' },
    { id: 'emergency_contact', label: 'Emergency contact number', type: 'text', placeholder: 'Optional' },
  ],
  beauty: [
    { id: 'treatment_goal', label: 'Treatment goal', type: 'select', options: ['Glow up', 'Relaxation', 'Maintenance', 'Other'] },
    { id: 'skin_sensitivity', label: 'Skin sensitivity', type: 'select', options: ['None', 'Mild', 'Sensitive'] },
    { id: 'allergies', label: 'Allergies / sensitivities', type: 'text', placeholder: 'Optional' },
    { id: 'contraindications', label: 'Medical contraindications', type: 'text', placeholder: 'Optional' },
  ],
  hairsalon: [
    { id: 'hair_length', label: 'Hair length', type: 'select', options: ['Short', 'Medium', 'Long'] },
    { id: 'style_notes', label: 'Style notes', type: 'text', placeholder: 'e.g. trim, layers, fringe' },
    { id: 'product_allergies', label: 'Product allergies', type: 'text', placeholder: 'Optional' },
  ],
  nightclub: [
    { id: 'party_size', label: 'Party size', type: 'number', required: true, placeholder: '4' },
    { id: 'occasion', label: 'Occasion', type: 'select', options: ['Birthday', 'Anniversary', 'Corporate', 'Night out', 'Other'] },
  ],
  spa: [
    { id: 'treatment_focus', label: 'Treatment focus', type: 'select', options: ['Relaxation', 'Recovery', 'Beauty', 'Other'] },
    { id: 'health_notes', label: 'Health notes', type: 'textarea', placeholder: 'Allergies, injuries, or medical notes (optional)' },
    { id: 'allergies', label: 'Allergies / sensitivities', type: 'text', placeholder: 'Optional' },
  ],
  gym: [
    { id: 'fitness_goal', label: 'Fitness goal', type: 'select', options: ['Weight loss', 'Strength', 'Conditioning', 'Rehab'] },
    { id: 'experience_level', label: 'Experience level', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'] },
    { id: 'medical_notes', label: 'Medical notes', type: 'textarea', placeholder: 'Injuries or conditions (optional)' },
    { id: 'emergency_contact', label: 'Emergency contact number', type: 'text', placeholder: 'Optional' },
  ],
  optician: [
    { id: 'wears_glasses', label: 'Do you wear glasses?', type: 'select', options: ['Yes', 'No'] },
    { id: 'symptoms', label: 'Symptoms', type: 'textarea', placeholder: 'Blurry vision, headaches, eye strain...' },
    { id: 'eye_conditions', label: 'Existing eye conditions', type: 'text', placeholder: 'Optional' },
  ],
  vet: [
    { id: 'pet_name', label: 'Pet name', type: 'text', required: true },
    { id: 'pet_type', label: 'Pet type', type: 'select', options: ['Dog', 'Cat', 'Other'] },
    { id: 'breed_or_size', label: 'Breed / size', type: 'text', placeholder: 'e.g. Labrador, Small' },
    { id: 'pet_allergies', label: 'Allergies', type: 'text', placeholder: 'Optional' },
    { id: 'emergency_contact', label: 'Emergency contact number', type: 'text', placeholder: 'Optional' },
  ],
  auto: [
    { id: 'vehicle_reg', label: 'Vehicle registration', type: 'text', required: true, placeholder: 'AB12 CDE' },
    { id: 'vehicle_make_model', label: 'Make & model', type: 'text', placeholder: 'e.g. Ford Fiesta' },
  ],
  tutoring: [
    { id: 'goal', label: 'Training goal', type: 'select', options: ['Fat loss', 'Muscle gain', 'Strength', 'General fitness'] },
    { id: 'experience_level', label: 'Experience level', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'] },
  ],
  restaurant: [
    { id: 'party_size', label: 'Party size', type: 'number', required: true, placeholder: '2' },
    { id: 'occasion', label: 'Occasion', type: 'select', options: ['Birthday', 'Anniversary', 'Business', 'Other'] },
    { id: 'allergies', label: 'Allergies', type: 'text', placeholder: 'Optional' },
  ],
  barber: [
    { id: 'style_request', label: 'Style request', type: 'text', placeholder: 'e.g. fade, taper' },
    { id: 'beard_service', label: 'Beard service', type: 'select', options: ['Yes', 'No'] },
    { id: 'skin_sensitivity', label: 'Skin sensitivity', type: 'text', placeholder: 'Optional' },
  ],
  tattoo: [
    { id: 'placement', label: 'Placement', type: 'text', required: true, placeholder: 'e.g. forearm, shoulder' },
    { id: 'size', label: 'Size', type: 'select', options: ['Small', 'Medium', 'Large'] },
    { id: 'reference_link', label: 'Reference link', type: 'text', placeholder: 'Optional URL' },
    { id: 'medical_conditions', label: 'Medical conditions', type: 'text', placeholder: 'Optional' },
    { id: 'allergies', label: 'Allergies / sensitivities', type: 'text', placeholder: 'Optional' },
    { id: 'emergency_contact', label: 'Emergency contact number', type: 'text', placeholder: 'Optional' },
  ],
  carwash: [
    { id: 'vehicle_type', label: 'Vehicle type', type: 'select', options: ['Car', 'SUV', 'Van', 'Truck'] },
    { id: 'vehicle_reg', label: 'Vehicle registration', type: 'text', placeholder: 'Optional' },
  ],
  driving: [
    { id: 'lesson_goal', label: 'Lesson goal', type: 'select', options: ['Beginner', 'Test prep', 'Motorway', 'Confidence boost'] },
    { id: 'test_date', label: 'Test date', type: 'text', placeholder: 'Optional' },
    { id: 'emergency_contact', label: 'Emergency contact number', type: 'text', placeholder: 'Optional' },
  ],
  takeaway: [
    { id: 'order_notes', label: 'Order notes', type: 'textarea', placeholder: 'Allergies, spice level, delivery notes...' },
  ],
  supercar: [
    { id: 'driver_age', label: 'Driver age', type: 'number', placeholder: 'e.g. 28' },
    { id: 'preferred_vehicle', label: 'Preferred vehicle', type: 'text', placeholder: 'Optional' },
    { id: 'experience_level', label: 'Driving experience', type: 'select', options: ['None', 'Some', 'Experienced'] },
    { id: 'licence_number', label: 'Driving licence number', type: 'text', placeholder: 'Optional' },
    { id: 'emergency_contact', label: 'Emergency contact number', type: 'text', placeholder: 'Optional' },
  ],
  photography: [
    { id: 'shoot_type', label: 'Shoot type', type: 'select', options: ['Portrait', 'Family', 'Product', 'Event', 'Other'] },
    { id: 'location', label: 'Location', type: 'text', placeholder: 'Studio or on-site' },
    { id: 'people_count', label: 'Number of people', type: 'number', placeholder: '2' },
    { id: 'special_requests', label: 'Special requests', type: 'textarea', placeholder: 'Optional' },
  ],
  grooming: [
    { id: 'pet_name', label: 'Pet name', type: 'text', required: true },
    { id: 'breed_size', label: 'Breed / size', type: 'text', placeholder: 'e.g. Cockapoo, Small' },
    { id: 'temperament', label: 'Temperament', type: 'select', options: ['Calm', 'Nervous', 'Energetic'] },
    { id: 'pet_allergies', label: 'Allergies', type: 'text', placeholder: 'Optional' },
  ],
  physio: [
    { id: 'injury_area', label: 'Injury area', type: 'text', required: true, placeholder: 'e.g. knee, back' },
    { id: 'sport', label: 'Sport / activity', type: 'text', placeholder: 'Optional' },
    { id: 'allergies', label: 'Allergies / sensitivities', type: 'text', placeholder: 'Optional' },
    { id: 'emergency_contact', label: 'Emergency contact number', type: 'text', placeholder: 'Optional' },
  ],
  nails: [
    { id: 'nail_style', label: 'Nail style', type: 'text', placeholder: 'e.g. French, ombre' },
    { id: 'finish', label: 'Finish', type: 'select', options: ['Gel', 'Acrylic', 'BIAB', 'Other'] },
    { id: 'allergies', label: 'Allergies / sensitivities', type: 'text', placeholder: 'Optional' },
  ],
  aesthetics: [
    { id: 'treatment_interest', label: 'Treatment interest', type: 'select', options: ['Botox', 'Filler', 'Skin', 'Other'] },
    { id: 'medical_notes', label: 'Medical notes', type: 'textarea', placeholder: 'Optional' },
    { id: 'allergies', label: 'Allergies / sensitivities', type: 'text', placeholder: 'Optional' },
    { id: 'emergency_contact', label: 'Emergency contact number', type: 'text', placeholder: 'Optional' },
  ],
  lash: [
    { id: 'lash_style', label: 'Lash style', type: 'select', options: ['Classic', 'Hybrid', 'Volume'] },
    { id: 'allergies', label: 'Allergies', type: 'text', placeholder: 'Optional' },
  ],
  escape: [
    { id: 'group_size', label: 'Group size', type: 'number', required: true, placeholder: '4' },
    { id: 'occasion', label: 'Occasion', type: 'select', options: ['Birthday', 'Team building', 'Family', 'Other'] },
    { id: 'accessibility', label: 'Accessibility needs', type: 'text', placeholder: 'Optional' },
  ],
  solicitor: [
    { id: 'matter_type', label: 'Matter type', type: 'select', options: ['Family', 'Property', 'Employment', 'Business', 'Other'] },
    { id: 'urgency', label: 'Urgency', type: 'select', options: ['Routine', 'Soon', 'Urgent'] },
    { id: 'preferred_contact', label: 'Preferred contact method', type: 'select', options: ['Email', 'Phone'] },
  ],
  accountant: [
    { id: 'service_needed', label: 'Service needed', type: 'select', options: ['Self-assessment', 'VAT', 'Accounts', 'Payroll', 'Other'] },
    { id: 'company_stage', label: 'Company stage', type: 'select', options: ['New', 'Existing'] },
    { id: 'preferred_contact', label: 'Preferred contact method', type: 'select', options: ['Email', 'Phone'] },
  ],
}

export function getVertical(id: VerticalId): Vertical {
  return VERTICALS[id]
}
