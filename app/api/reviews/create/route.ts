import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import type { Database } from '@/types/database'

type TenantIdRow = Pick<Database['public']['Tables']['tenants']['Row'], 'id'>
type BookingContactRow = Pick<Database['public']['Tables']['bookings']['Row'], 'id' | 'customer_email' | 'customer_phone' | 'customer_name' | 'staff_id'>

const normalizePhone = (value: string) => value.replace(/\D/g, '')
const maskName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'Customer'
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[1][0]}.`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug, bookingRef, contact, rating, timingRating, serviceRating, cleanlinessRating, comment } = body || {}

    if (!slug || !bookingRef || !contact || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()

    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single()
    const typedTenant = tenant as TenantIdRow | null

    if (!typedTenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const { data: booking } = await supabase
      .from('bookings')
      .select('id, customer_email, customer_phone, customer_name, staff_id')
      .eq('tenant_id', typedTenant.id)
      .eq('booking_ref', bookingRef)
      .single()
    const typedBooking = booking as BookingContactRow | null

    if (!typedBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const contactLower = String(contact).trim().toLowerCase()
    const emailMatch = typedBooking.customer_email?.toLowerCase() === contactLower
    const contactDigits = normalizePhone(contactLower)
    const bookingDigits = normalizePhone(typedBooking.customer_phone || '')
    const phoneMatch = contactDigits && bookingDigits && (bookingDigits.endsWith(contactDigits) || contactDigits.endsWith(bookingDigits))

    if (!emailMatch && !phoneMatch) {
      return NextResponse.json({ error: 'Details did not match' }, { status: 403 })
    }

    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('tenant_id', typedTenant.id)
      .eq('booking_ref', bookingRef)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Review already exists' }, { status: 409 })
    }

    const clamp = (value?: number | null) => {
      const num = Number(value || 0)
      if (!num) return null
      return Math.min(Math.max(num, 1), 5)
    }

    const { error } = await (supabase
      .from('reviews') as any)
      .insert({
        tenant_id: typedTenant.id,
        booking_id: typedBooking.id,
        staff_id: typedBooking.staff_id || null,
        booking_ref: bookingRef,
        display_name: maskName(typedBooking.customer_name),
        rating: clamp(rating) || 5,
        timing_rating: clamp(timingRating),
        service_rating: clamp(serviceRating),
        cleanliness_rating: clamp(cleanlinessRating),
        comment: comment ? String(comment).slice(0, 1000) : null,
      })

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Review create error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
