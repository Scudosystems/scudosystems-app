import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { sendCancellationEmail } from '@/lib/resend'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'
import type { Database } from '@/types/database'

type BookingRow = Database['public']['Tables']['bookings']['Row']
type BookingWithRelations = BookingRow & {
  tenants?: { business_name?: string; cancellation_policy?: string }
  services?: { name?: string }
}

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const { bookingId } = await req.json()
    const supabase = createSupabaseAdminClient()

    const { data: booking } = await supabase
      .from('bookings')
      .select('*, tenants(business_name, cancellation_policy), services(name)')
      .eq('id', bookingId)
      .single()

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    const typedBooking = booking as BookingWithRelations

    await (supabase.from('bookings') as any)
      .update({ status: 'cancelled' })
      .eq('id', bookingId)

    // Send cancellation email (optional)
    if (process.env.RESEND_API_KEY) {
      await sendCancellationEmail({
        customerName: typedBooking.customer_name,
        customerEmail: typedBooking.customer_email,
        businessName: typedBooking.tenants?.business_name || '',
        serviceName: typedBooking.services?.name || '',
        bookingDate: formatDate(typedBooking.booking_date),
        bookingTime: formatTime(typedBooking.booking_time),
        totalAmount: formatCurrency(typedBooking.total_amount_pence),
        bookingRef: typedBooking.booking_ref,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Cancel booking error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
