import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { generateTimeSlots } from '@/lib/utils'
import type { Database } from '@/types/database'

type ServiceDurationRow = Pick<Database['public']['Tables']['services']['Row'], 'duration_minutes'>
type BookingTimeRow = Pick<Database['public']['Tables']['bookings']['Row'], 'booking_time' | 'service_id'>
type BlockedTimeRow = Pick<Database['public']['Tables']['blocked_times']['Row'], 'start_time' | 'end_time'>
type AvailabilityRow = Database['public']['Tables']['availability']['Row']

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tenantId = searchParams.get('tenantId')
  const date = searchParams.get('date')
  const serviceId = searchParams.get('serviceId')
  const staffId = searchParams.get('staffId')

  if (!tenantId || !date || !serviceId) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  }

  const supabase = createSupabaseAdminClient()

  // Get service duration
  const { data: service } = await supabase
    .from('services')
    .select('duration_minutes')
    .eq('id', serviceId)
    .single()
  const typedService = service as ServiceDurationRow | null

  if (!typedService) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  }

  const dayOfWeek = new Date(date + 'T12:00:00').getDay()

  // Get availability for this day
  let availQuery = supabase
    .from('availability')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)

  if (staffId) {
    availQuery = availQuery.eq('staff_id', staffId)
  } else {
    availQuery = availQuery.is('staff_id', null)
  }

  const { data: availability } = await availQuery

  const typedAvailability = (availability || []) as AvailabilityRow[]

  if (typedAvailability.length === 0) {
    return NextResponse.json({ slots: [] })
  }

  // Get existing bookings for this date
  let bookingQuery = supabase
    .from('bookings')
    .select('booking_time, service_id')
    .eq('tenant_id', tenantId)
    .eq('booking_date', date)
    .in('status', ['pending', 'confirmed'])

  if (staffId) {
    bookingQuery = bookingQuery.eq('staff_id', staffId)
  }

  const { data: existingBookings } = await bookingQuery
  const typedExistingBookings = (existingBookings || []) as BookingTimeRow[]
  const takenTimes = new Set(typedExistingBookings.map(b => b.booking_time.slice(0, 5)))

  // Get blocked times for this date
  const { data: blockedTimes } = await supabase
    .from('blocked_times')
    .select('start_time, end_time')
    .eq('tenant_id', tenantId)
    .eq('blocked_date', date)
  const typedBlockedTimes = (blockedTimes || []) as BlockedTimeRow[]

  // Generate available slots
  const slots: string[] = []
  for (const avail of typedAvailability) {
    const daySlots = generateTimeSlots(avail.start_time, avail.end_time, typedService.duration_minutes)
    slots.push(...daySlots)
  }

  // Filter out taken and blocked times
  const isBlocked = (time: string) => {
    if (takenTimes.has(time)) return true
    if (typedBlockedTimes.length === 0) return false
    return typedBlockedTimes.some(b => time >= b.start_time.slice(0, 5) && time < b.end_time.slice(0, 5))
  }

  const uniqueSlots = Array.from(new Set(slots))
    .filter(s => !isBlocked(s))
    .sort()

  return NextResponse.json({ slots: uniqueSlots })
}
