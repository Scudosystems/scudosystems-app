import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

const normalizePhone = (value: string) => value.replace(/\D/g, '')
const maskName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'Customer'
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[1][0]}.`
}
const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(v => parseInt(v, 10))
  return (h || 0) * 60 + (m || 0)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug, bookingRef, contact } = body || {}

    if (!slug || !bookingRef || !contact) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const supabase = createSupabaseAdminClient()

    let tenant = null as any
    const { data: tData, error: tErr } = await supabase
      .from('tenants')
      .select('id, business_name, queue_delay_minutes, wait_page_enabled')
      .eq('slug', slug)
      .maybeSingle()

    if (tErr) {
      const { data: fallback } = await supabase
        .from('tenants')
        .select('id, business_name')
        .eq('slug', slug)
        .maybeSingle()
      const fallbackTenant = fallback as { id: string; business_name: string } | null
      tenant = fallbackTenant
        ? { id: fallbackTenant.id, business_name: fallbackTenant.business_name, queue_delay_minutes: 0, wait_page_enabled: true }
        : null
    } else {
      tenant = tData
    }

    if (!tenant || tenant.wait_page_enabled === false) {
      return NextResponse.json({ error: 'Wait page is not available' }, { status: 404 })
    }

    let booking: any = null
    const { data: bData, error: bErr } = await supabase
      .from('bookings')
      .select('id, booking_date, booking_time, status, queue_status, queue_updated_at, customer_email, customer_phone, customer_name, services(duration_minutes)')
      .eq('tenant_id', tenant.id)
      .eq('booking_ref', bookingRef)
      .maybeSingle()
    if (bErr) {
      const { data: fallback } = await supabase
        .from('bookings')
        .select('id, booking_date, booking_time, status, customer_email, customer_phone, customer_name, services(duration_minutes)')
        .eq('tenant_id', tenant.id)
        .eq('booking_ref', bookingRef)
        .maybeSingle()
      const fallbackBooking = fallback as any
      booking = fallbackBooking
        ? { ...fallbackBooking, queue_status: 'scheduled', queue_updated_at: null }
        : null
    } else {
      booking = bData
    }

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const contactLower = String(contact).trim().toLowerCase()
    const emailMatch = booking.customer_email?.toLowerCase() === contactLower
    const contactDigits = normalizePhone(contactLower)
    const bookingDigits = normalizePhone(booking.customer_phone || '')
    const phoneMatch = contactDigits && bookingDigits && (bookingDigits.endsWith(contactDigits) || contactDigits.endsWith(bookingDigits))

    if (!emailMatch && !phoneMatch) {
      return NextResponse.json({ error: 'Details did not match' }, { status: 403 })
    }

    const bookingStatus = booking.status
    const queueStatus = booking.queue_status || 'scheduled'

    if (bookingStatus === 'cancelled' || bookingStatus === 'no_show') {
      return NextResponse.json({
        ok: true,
        status: 'cancelled',
        displayName: maskName(booking.customer_name),
        bookingDate: booking.booking_date,
        bookingTime: booking.booking_time,
      })
    }

    if (bookingStatus === 'completed' || queueStatus === 'completed') {
      return NextResponse.json({
        ok: true,
        status: 'completed',
        displayName: maskName(booking.customer_name),
        bookingDate: booking.booking_date,
        bookingTime: booking.booking_time,
      })
    }

    const today = new Date().toISOString().split('T')[0]
    const bookingDate = booking.booking_date
    const scheduledAt = new Date(`${bookingDate}T${booking.booking_time}`)
    const scheduledIso = scheduledAt.toISOString()

    if (bookingDate !== today) {
      return NextResponse.json({
        ok: true,
        status: queueStatus,
        displayName: maskName(booking.customer_name),
        bookingDate,
        bookingTime: booking.booking_time,
        scheduledAt: scheduledIso,
        position: null,
        totalAhead: null,
        etaMinutes: null,
        estimatedStart: scheduledIso,
      })
    }

    let queue: any[] = []
    const { data: qData, error: qErr } = await supabase
      .from('bookings')
      .select('id, booking_time, queue_status, queue_updated_at, status, services(duration_minutes)')
      .eq('tenant_id', tenant.id)
      .eq('booking_date', bookingDate)
      .in('status', ['pending', 'confirmed'])
    if (qErr) {
      const { data: fallback } = await supabase
        .from('bookings')
        .select('id, booking_time, status, services(duration_minutes)')
        .eq('tenant_id', tenant.id)
        .eq('booking_date', bookingDate)
        .in('status', ['pending', 'confirmed'])
      queue = (fallback || []).map((item: any) => ({
        ...item,
        queue_status: 'scheduled',
        queue_updated_at: null,
      }))
    } else {
      queue = qData || []
    }

    const activeQueue = (queue || []).filter(item => item.queue_status !== 'completed')

    const priority: Record<string, number> = { in_service: 0, checked_in: 1, scheduled: 2 }
    activeQueue.sort((a, b) => {
      const pa = priority[a.queue_status || 'scheduled'] ?? 2
      const pb = priority[b.queue_status || 'scheduled'] ?? 2
      if (pa !== pb) return pa - pb
      if (pa < 2) {
        const ua = a.queue_updated_at ? new Date(a.queue_updated_at).getTime() : 0
        const ub = b.queue_updated_at ? new Date(b.queue_updated_at).getTime() : 0
        if (ua !== ub) return ua - ub
      }
      return toMinutes(a.booking_time) - toMinutes(b.booking_time)
    })

    const index = activeQueue.findIndex(item => item.id === booking.id)
    const ahead = index > 0 ? activeQueue.slice(0, index) : []
    const delay = Math.max(0, tenant.queue_delay_minutes || 0)

    const minutesAhead = ahead.reduce((sum, item) => {
      const duration = item.services?.duration_minutes || 30
      return sum + duration + delay
    }, 0)

    const etaMinutes = queueStatus === 'in_service' ? 0 : minutesAhead
    const estimatedStart = new Date(Date.now() + etaMinutes * 60 * 1000).toISOString()

    return NextResponse.json({
      ok: true,
      status: queueStatus,
      displayName: maskName(booking.customer_name),
      bookingDate,
      bookingTime: booking.booking_time,
      scheduledAt: scheduledIso,
      position: index >= 0 ? index + 1 : null,
      totalAhead: ahead.length,
      etaMinutes,
      estimatedStart,
    })
  } catch (err) {
    console.error('Wait status error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
