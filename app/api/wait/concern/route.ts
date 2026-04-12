import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import type { Database } from '@/types/database'

type TenantWaitRow = Pick<Database['public']['Tables']['tenants']['Row'], 'id' | 'wait_page_enabled'>
type BookingConcernRow = Pick<Database['public']['Tables']['bookings']['Row'], 'id' | 'customer_email' | 'customer_phone' | 'customer_concerns'>

const normalizePhone = (value: string) => value.replace(/\D/g, '')

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug, bookingRef, contact, concern } = body || {}

    if (!slug || !bookingRef || !contact || !concern) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()

    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, wait_page_enabled')
      .eq('slug', slug)
      .single()
    const typedTenant = tenant as TenantWaitRow | null

    if (!typedTenant || !typedTenant.wait_page_enabled) {
      return NextResponse.json({ error: 'Wait page is not available' }, { status: 404 })
    }

    const { data: booking } = await supabase
      .from('bookings')
      .select('id, customer_email, customer_phone, customer_concerns')
      .eq('tenant_id', typedTenant.id)
      .eq('booking_ref', bookingRef)
      .single()
    const typedBooking = booking as BookingConcernRow | null

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

    const timestamp = new Date().toISOString()
    const existing = typedBooking.customer_concerns ? typedBooking.customer_concerns.trim() : ''
    const next = existing ? `${existing}\n${timestamp} — ${concern}` : `${timestamp} — ${concern}`

    const { error } = await (supabase
      .from('bookings') as any)
      .update({ customer_concerns: next })
      .eq('id', typedBooking.id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Wait concern error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
