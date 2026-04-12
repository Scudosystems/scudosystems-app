import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { getRecommendedGuidelines } from '@/lib/industry-defaults'

type AccessRow = {
  tenant_id: string
  staff_id?: string | null
  permissions?: { view_team_bookings?: boolean; view_own_reviews?: boolean } | null
  reviews_opt_out?: boolean | null
}
type TenantGuidelinesRow = {
  id: string
  staff_guidelines?: string[] | null
  job_offers_enabled?: boolean | null
  vertical?: string | null
}
type BookingPortalRow = {
  status?: string | null
}

const toDateString = (date: Date) => date.toISOString().split('T')[0]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { accessId, email, code } = body || {}

    if (!accessId || !email || !code) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()

    const { data: access } = await supabase
      .from('staff_portal_access')
      .select('*')
      .eq('id', accessId)
      .eq('email', String(email).trim().toLowerCase())
      .eq('access_code', String(code).trim().toUpperCase())
      .eq('is_active', true)
      .single()
    const typedAccess = access as AccessRow | null

    if (!typedAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: tenant } = await supabase
      .from('tenants')
      .select('staff_guidelines, job_offers_enabled, vertical')
      .eq('id', typedAccess.tenant_id)
      .single()
    const typedTenant = tenant as TenantGuidelinesRow | null

    const today = new Date()
    const todayStr = toDateString(today)
    const weekEnd = new Date(Date.now() + 7 * 86400000)
    const weekEndStr = toDateString(weekEnd)

    const todayQuery = supabase
      .from('bookings')
      .select('id, booking_date, booking_time, status, customer_name, notes, services(name, duration_minutes)')
      .eq('tenant_id', typedAccess.tenant_id)
      .eq('booking_date', todayStr)
      .in('status', ['confirmed', 'pending'])
      .order('booking_time')

    const upcomingQuery = supabase
      .from('bookings')
      .select('id, booking_date, booking_time, status, customer_name, notes, services(name, duration_minutes)')
      .eq('tenant_id', typedAccess.tenant_id)
      .gt('booking_date', todayStr)
      .lte('booking_date', weekEndStr)
      .in('status', ['confirmed', 'pending'])
      .order('booking_date')
      .order('booking_time')

    if (!typedAccess.permissions?.view_team_bookings && typedAccess.staff_id) {
      todayQuery.eq('staff_id', typedAccess.staff_id)
      upcomingQuery.eq('staff_id', typedAccess.staff_id)
    }

    const [{ data: todayBookings }, { data: upcomingBookings }] = await Promise.all([
      todayQuery,
      upcomingQuery,
    ])

    const typedTodayBookings = (todayBookings || []) as BookingPortalRow[]
    const typedUpcomingBookings = (upcomingBookings || []) as BookingPortalRow[]
    const weekBookings = [...typedTodayBookings, ...typedUpcomingBookings]
    const completedWeek = weekBookings.filter(b => b.status === 'completed').length

    const stats = {
      todayCount: typedTodayBookings.length,
      weekCount: weekBookings.length,
      completedWeek,
    }

    let reviews: any[] = []
    if (typedAccess.permissions?.view_own_reviews && !typedAccess.reviews_opt_out) {
      let reviewQuery = supabase
        .from('reviews')
        .select('id, rating, timing_rating, service_rating, cleanliness_rating, comment, created_at, booking_ref, display_name')
        .eq('tenant_id', typedAccess.tenant_id)
        .order('created_at', { ascending: false })
        .limit(25)

      if (typedAccess.staff_id) {
        reviewQuery = reviewQuery.eq('staff_id', typedAccess.staff_id)
      }

      const { data: reviewData } = await reviewQuery
      reviews = reviewData || []
    }

    let offers: any[] = []
    let offersError = null as any
    let offersBlocked: string | null = null
    if (!typedAccess.staff_id) {
      offersBlocked = 'no_staff_link'
    } else if (typedTenant?.job_offers_enabled) {
      const offersQuery = supabase
        .from('staff_job_offers')
        .select('id, role_title, start_at, end_at, hourly_rate_pence, notes, status, responded_at')
        .eq('tenant_id', typedAccess.tenant_id)
        .eq('staff_id', typedAccess.staff_id)
        .order('start_at', { ascending: true })
      const resp = await offersQuery
      offers = resp.data || []
      offersError = resp.error
    }

    return NextResponse.json({
      todayBookings: typedTodayBookings,
      upcomingBookings: typedUpcomingBookings,
      reviews,
      stats,
      offers: offersError ? [] : (offers || []),
      reviews_opt_out: typedAccess.reviews_opt_out ?? false,
      guidelines: (Array.isArray(typedTenant?.staff_guidelines) && typedTenant.staff_guidelines.length > 0)
        ? typedTenant.staff_guidelines
        : getRecommendedGuidelines(typedTenant?.vertical),
      job_offers_enabled: typedTenant?.job_offers_enabled ?? false,
      offers_blocked: offersBlocked,
    })
  } catch (err) {
    console.error('Staff portal data error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
