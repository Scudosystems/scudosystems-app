import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { VERTICALS } from '@/lib/verticals'
import { generateBookingRef, generateSlug, sanitizeInput } from '@/lib/utils'
import { getRecommendedGuidelines } from '@/lib/industry-defaults'
import type { Database } from '@/types/database'

type TenantSeedRow = Pick<Database['public']['Tables']['tenants']['Row'], 'id' | 'slug' | 'vertical'>
type ServiceSeedRow = Pick<Database['public']['Tables']['services']['Row'], 'id' | 'price_pence' | 'deposit_pence' | 'requires_deposit'>

// Demo is always enabled — no env-var gate needed
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'DemoPass123!'
const DEFAULT_DEMO_VERTICAL = 'dental' as const

// Each vertical gets its own isolated demo user so all booking page URLs
// stay permanently valid regardless of which vertical was seeded last.
function getDemoEmail(vertical: string) {
  return `demo+${vertical}@scudosystem.local`
}

const DEMO_NAMES: Record<string, { businessName: string; staff: { name: string; role: string }[] }> = {
  dental: {
    businessName: 'City Smile Dental',
    staff: [
      { name: 'Dr. Amelia Hart', role: 'Principal Dentist' },
      { name: 'Dr. Liam Carter', role: 'Associate Dentist' },
    ],
  },
  beauty: {
    businessName: 'Luxe Beauty Studio',
    staff: [
      { name: 'Sophie Lane', role: 'Senior Stylist' },
      { name: 'Maya Patel', role: 'Colour Specialist' },
    ],
  },
  nightclub: {
    businessName: 'Neon Room Nightclub',
    staff: [
      { name: 'Ava Brooks', role: 'Floor Host' },
      { name: 'Kai Bennett', role: 'VIP Host' },
    ],
  },
  spa: {
    businessName: 'Elysian Spa',
    staff: [
      { name: 'Hannah Cole', role: 'Senior Therapist' },
      { name: 'Layla Ahmed', role: 'Wellness Specialist' },
    ],
  },
  gym: {
    businessName: 'Pulse Fitness Studio',
    staff: [
      { name: 'Marcus Reed', role: 'Head Trainer' },
      { name: 'Leah Carter', role: 'Strength Coach' },
    ],
  },
  restaurant: {
    businessName: 'Harbour Table',
    staff: [
      { name: 'Oliver Shaw', role: 'Host' },
      { name: 'Priya Singh', role: 'Reservations Lead' },
    ],
  },
  tattoo: {
    businessName: 'Ink & Orbit Studio',
    staff: [
      { name: 'Rosa Blake', role: 'Lead Artist' },
      { name: 'Jayden Cole', role: 'Resident Artist' },
    ],
  },
  carwash: {
    businessName: 'Glide Car Wash',
    staff: [
      { name: 'Noah Price', role: 'Shift Lead' },
      { name: 'Elena Ford', role: 'Detailing Specialist' },
    ],
  },
  auto: {
    businessName: 'Summit Auto Service',
    staff: [
      { name: 'Aaron Blake', role: 'Service Advisor' },
      { name: 'Mia Lewis', role: 'Lead Mechanic' },
    ],
  },
  supercar: {
    businessName: 'Vanguard Supercar Hire',
    staff: [
      { name: 'Leo Hart',  role: 'Experience Manager' },
      { name: 'Ivy Stone', role: 'Fleet Concierge'    },
    ],
  },
  photography: {
    businessName: 'Studio Nova',
    staff: [
      { name: 'Grace Chen', role: 'Lead Photographer' },
      { name: 'Ethan Clark', role: 'Studio Assistant' },
    ],
  },
}

function getDemoDefaults(vertical: keyof typeof VERTICALS) {
  const override = DEMO_NAMES[vertical]
  if (override) return override
  const info = VERTICALS[vertical]
  const label = info?.label || 'Business'
  const staffLabel = info?.staffLabel || 'Staff'
  return {
    businessName: `${label} Demo`,
    staff: [
      { name: `${staffLabel} 1`, role: staffLabel },
      { name: `${staffLabel} 2`, role: staffLabel },
    ],
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const requestedVertical = typeof body?.vertical === 'string' ? body.vertical : DEFAULT_DEMO_VERTICAL
  const vertical = (requestedVertical in VERTICALS ? requestedVertical : DEFAULT_DEMO_VERTICAL) as keyof typeof VERTICALS
  const demoDefaults = getDemoDefaults(vertical)
  const DEMO_EMAIL = getDemoEmail(vertical)

  const supabase = createSupabaseAdminClient()

  // Ensure a demo user exists for this specific vertical
  const { data: userList, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 })
  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 })
  }

  let user = userList.users.find(u => u.email === DEMO_EMAIL)
  if (!user) {
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: 'Demo Owner' },
    })
    if (createError || !created.user) {
      return NextResponse.json({ error: createError?.message || 'Failed to create demo user' }, { status: 500 })
    }
    user = created.user
  }

  // Ensure demo tenant exists for this vertical (scoped to this vertical's user)
  const { data: existingTenant } = await supabase
    .from('tenants')
    .select('id, slug, vertical')
    .eq('user_id', user.id)
    .eq('vertical', vertical)
    .maybeSingle()
  const typedExistingTenant = existingTenant as TenantSeedRow | null

  const businessName = typeof body?.businessName === 'string' && body.businessName.trim()
    ? body.businessName.trim()
    : demoDefaults.businessName
  const demoSlug = generateSlug(businessName)
  const brandingColour = VERTICALS[vertical].colour || '#0d6e6e'

  let tenantId = typedExistingTenant?.id
  if (!tenantId) {
    const { data: tenant, error: tenantError } = await (supabase.from('tenants') as any).insert({
      user_id: user.id,
      business_name: businessName,
      vertical,
      slug: demoSlug,
      owner_email: user.email,
      brand_colour: brandingColour,
      plan: 'professional',
      plan_status: 'active',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      onboarding_completed: true,
      booking_page_enabled: true,
      auto_confirm: true,
      allow_same_day: true,
      email_reminders_enabled: true,
      sms_reminders_enabled: true,
      daily_summary_email: true,
      new_booking_sms: true,
      cancellation_policy: 'Cancellations must be made at least 24 hours in advance. Deposits are non-refundable for late cancellations.',
      booking_page_show_live_availability: true,
      booking_page_live_window_minutes: 60,
      booking_page_live_buffer_minutes: 20,
      staff_guidelines: getRecommendedGuidelines(vertical),
    }).select('id').single()
    if (tenantError || !tenant) {
      return NextResponse.json({ error: tenantError?.message || 'Failed to create demo tenant' }, { status: 500 })
    }
    tenantId = tenant.id
  } else {
    // Refresh tenant settings (vertical never changes — it's scoped to this user+vertical pair)
    await (supabase.from('tenants') as any).update({
      business_name: businessName,
      slug: demoSlug,
      brand_colour: brandingColour,
      plan: 'professional',
      plan_status: 'active',
      onboarding_completed: true,
      booking_page_enabled: true,
      allow_same_day: true,
      booking_page_show_live_availability: true,
    }).eq('id', tenantId)
  }

  if (!tenantId) {
    return NextResponse.json({ error: 'Failed to resolve demo tenant' }, { status: 500 })
  }

  // Seed staff
  const { data: staffExisting } = await supabase
    .from('staff')
    .select('id')
    .eq('tenant_id', tenantId)
    .limit(1)
  let staffRows: { id: string }[] = staffExisting || []
  if (!staffRows.length) {
    const staffSeed = demoDefaults.staff
    const { data: staffInserted, error: staffError } = await (supabase.from('staff') as any).insert(
      staffSeed.map(s => ({ tenant_id: tenantId, name: s.name, role: s.role, is_active: true }))
    ).select('id')
    if (staffError || !staffInserted) {
      return NextResponse.json({ error: staffError?.message || 'Failed to seed staff' }, { status: 500 })
    }
    staffRows = staffInserted
  }

  // Seed services
  const { data: servicesExisting } = await supabase
    .from('services')
    .select('id, price_pence, deposit_pence, requires_deposit')
    .eq('tenant_id', tenantId)
    .limit(1)
  let serviceRows: { id: string; price_pence: number; deposit_pence: number; requires_deposit: boolean }[] = servicesExisting || []
  if (!serviceRows.length) {
    // Supercar gets a rich fleet + extras seed
    if (vertical === 'supercar') {
      const fleet = [
        { name: 'Lamborghini Huracán',    description: 'V10 · 630bhp · 201mph',  price_pence: 89500,  deposit_pence: 500000, colour: '#dc2626', badge: 'most_popular'  },
        { name: 'Ferrari F8 Tributo',      description: 'V8 Twin Turbo · 720bhp', price_pence: 95000,  deposit_pence: 500000, colour: '#dc2626', badge: 'available'     },
        { name: 'McLaren 720S',            description: 'V8 · 720bhp · 212mph',   price_pence: 110000, deposit_pence: 500000, colour: '#d97706', badge: 'available'     },
        { name: 'Rolls-Royce Wraith',      description: 'V12 · Ultimate Luxury',  price_pence: 120000, deposit_pence: 500000, colour: '#111827', badge: 'available'     },
        { name: 'Porsche 911 GT3',         description: 'Naturally Aspirated · 510bhp', price_pence: 69500, deposit_pence: 300000, colour: '#eab308', badge: 'fan_favourite' },
        { name: 'Bentley Continental GT',  description: 'W12 · Luxury Grand Tourer', price_pence: 85000, deposit_pence: 500000, colour: '#2563eb', badge: 'available'    },
      ]
      const extras = [
        { name: 'Damage Waiver',          description: 'Reduce excess from £5,000 to £500', price_pence: 8900,  price_type: 'per_day', icon_key: 'damage'    },
        { name: 'Delivery & Collection',  description: 'We deliver to your address',         price_pence: 15000, price_type: 'flat',    icon_key: 'delivery'  },
        { name: 'Professional Photoshoot',description: '30 min shoot with the car',           price_pence: 20000, price_type: 'flat',    icon_key: 'photo'     },
        { name: 'Chauffeur Option',        description: 'Professional driver included',        price_pence: 25000, price_type: 'per_day', icon_key: 'chauffeur' },
      ]
      const fleetPayload = fleet.map((c, idx) => ({
        tenant_id: tenantId, name: c.name, description: c.description,
        price_pence: c.price_pence, deposit_pence: c.deposit_pence,
        requires_deposit: true, duration_minutes: 1440, is_active: true, sort_order: idx,
        metadata: { category: 'car', colour: c.colour, badge: c.badge },
      }))
      const extrasPayload = extras.map((e, idx) => ({
        tenant_id: tenantId, name: e.name, description: e.description,
        price_pence: e.price_pence, deposit_pence: 0,
        requires_deposit: false, duration_minutes: 0, is_active: true, sort_order: fleet.length + idx,
        metadata: { category: 'extra', price_type: e.price_type, icon_key: e.icon_key },
      }))
      const { data: servicesInserted, error: servicesError } = await (supabase.from('services') as any)
        .insert([...fleetPayload, ...extrasPayload])
        .select('id, price_pence, deposit_pence, requires_deposit')
      if (servicesError || !servicesInserted) {
        return NextResponse.json({ error: servicesError?.message || 'Failed to seed fleet' }, { status: 500 })
      }
      const typedServicesInserted = (servicesInserted || []) as ServiceSeedRow[]
      serviceRows = typedServicesInserted.filter(s => s.deposit_pence > 0)
    } else {
      const defaults = VERTICALS[vertical].defaultServices
      const { data: servicesInserted, error: servicesError } = await (supabase.from('services') as any).insert(
        defaults.map((s, idx) => ({
          tenant_id: tenantId,
          name: sanitizeInput(s.name),
          description: s.description ? sanitizeInput(s.description) : null,
          duration_minutes: s.duration_minutes,
          price_pence: s.price_pence,
          deposit_pence: s.deposit_pence,
          requires_deposit: s.requires_deposit,
          is_active: true,
          sort_order: idx,
        }))
      ).select('id, price_pence, deposit_pence, requires_deposit')
      if (servicesError || !servicesInserted) {
        return NextResponse.json({ error: servicesError?.message || 'Failed to seed services' }, { status: 500 })
      }
      serviceRows = (servicesInserted || []) as ServiceSeedRow[]
    }
  }

  // Seed availability
  const { data: availabilityExisting } = await supabase.from('availability').select('id').eq('tenant_id', tenantId).limit(1)
  if (!availabilityExisting?.length) {
    const availabilityRows = [0, 1, 2, 3, 4, 5, 6].map(day => ({
      tenant_id: tenantId,
      staff_id: null,
      day_of_week: day,
      start_time: '09:00',
      end_time: '18:00',
      is_active: true,
    }))
    await (supabase.from('availability') as any).insert(availabilityRows)
  }

  // Seed bookings
  const { data: bookingsExisting } = await supabase.from('bookings').select('id').eq('tenant_id', tenantId).limit(1)
  if (!bookingsExisting?.length) {
    const today = new Date()
    const dateStr = (offset: number) => {
      const d = new Date(today)
      d.setDate(d.getDate() + offset)
      return d.toISOString().split('T')[0]
    }

    const demoBookings = [
      { offset: -12, time: '10:00', status: 'completed', name: 'Emma Turner', email: 'emma@example.com' },
      { offset: -9, time: '14:00', status: 'completed', name: 'Chloe Reed', email: 'chloe@example.com' },
      { offset: -6, time: '11:30', status: 'completed', name: 'Isla Moore', email: 'isla@example.com' },
      { offset: -3, time: '16:00', status: 'completed', name: 'Ruby Allen', email: 'ruby@example.com' },
      { offset: -1, time: '09:30', status: 'confirmed', name: 'Holly Lane', email: 'holly@example.com' },
      { offset: 0, time: '13:00', status: 'confirmed', name: 'Olivia King', email: 'olivia@example.com' },
      { offset: 0, time: '15:30', status: 'pending', name: 'Mia Carter', email: 'mia@example.com' },
      { offset: 2, time: '10:30', status: 'confirmed', name: 'Grace Scott', email: 'grace@example.com' },
      { offset: 3, time: '12:00', status: 'pending', name: 'Ava White', email: 'ava@example.com' },
      { offset: 5, time: '17:00', status: 'confirmed', name: 'Sofia Green', email: 'sofia@example.com' },
    ]

    const bookingRows = demoBookings.map((b, i) => {
      const service = serviceRows[i % serviceRows.length]
      const staff = staffRows[i % staffRows.length]
      const total = service.price_pence || 0
      const deposit = service.requires_deposit ? service.deposit_pence || 0 : 0
      return {
        tenant_id: tenantId,
        service_id: service.id,
        staff_id: staff?.id || null,
        customer_name: b.name,
        customer_email: b.email,
        customer_phone: '07123 456 789',
        booking_date: dateStr(b.offset),
        booking_time: b.time,
        status: b.status,
        deposit_paid: deposit > 0 && b.status !== 'cancelled',
        deposit_amount_pence: deposit,
        total_amount_pence: total,
        booking_ref: generateBookingRef(),
      }
    })

    await (supabase.from('bookings') as any).insert(bookingRows)
  }

  return NextResponse.json({
    success: true,
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    tenantId,
  })
}
