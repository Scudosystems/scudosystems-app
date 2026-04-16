import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

const VALID_STATUSES = ['available', 'busy', 'off'] as const
type AvailabilityStatus = typeof VALID_STATUSES[number]

/**
 * POST /api/staff-portal/availability
 * Allows a logged-in staff portal member to update their own availability status.
 * Uses the same email/code auth as other staff-portal routes.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { accessId, email, code, status } = body

    if (!accessId || !email || !code || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!VALID_STATUSES.includes(status as AvailabilityStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = createSupabaseAdminClient()

    // Verify credentials
    const { data: access } = await supabase
      .from('staff_portal_access')
      .select('id')
      .eq('id', accessId)
      .eq('email', String(email).trim().toLowerCase())
      .eq('access_code', String(code).trim().toUpperCase())
      .eq('is_active', true)
      .single()

    if (!access) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { error } = await (supabase.from('staff_portal_access') as any)
      .update({
        availability_status: status,
        availability_updated_at: new Date().toISOString(),
      })
      .eq('id', accessId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, status })
  } catch (err) {
    console.error('Staff availability update error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
