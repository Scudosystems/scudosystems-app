import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

/**
 * Staff portal: accept or decline a job offer.
 * Uses sessionStorage-based auth (access code), same pattern as /api/staff-portal/data.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { accessId, email, code, offerId, response } = body || {}

    if (!accessId || !email || !code || !offerId || !response) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['accept', 'decline'].includes(response)) {
      return NextResponse.json({ error: 'response must be accept or decline' }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()

    // Authenticate staff portal access
    const { data: accessRaw } = await (supabase.from('staff_portal_access') as any)
      .select('id, tenant_id, staff_id, is_active')
      .eq('id', accessId)
      .eq('email', String(email).trim().toLowerCase())
      .eq('access_code', String(code).trim().toUpperCase())
      .eq('is_active', true)
      .single()

    const access = accessRaw as { id: string; tenant_id: string; staff_id: string | null; is_active: boolean } | null

    if (!access) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!access.staff_id) {
      return NextResponse.json({ error: 'No staff profile linked to this access account' }, { status: 403 })
    }

    // Verify the offer belongs to this staff member and tenant
    const { data: offerRaw } = await (supabase.from('staff_job_offers') as any)
      .select('id, status, tenant_id, staff_id')
      .eq('id', offerId)
      .eq('tenant_id', access.tenant_id)
      .eq('staff_id', access.staff_id)
      .single()

    const offer = offerRaw as { id: string; status: string; tenant_id: string; staff_id: string } | null

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    if (offer.status !== 'pending') {
      return NextResponse.json({ error: 'This offer has already been responded to' }, { status: 409 })
    }

    const newStatus = response === 'accept' ? 'accepted' : 'declined'

    const { error: updateError } = await (supabase.from('staff_job_offers') as any)
      .update({ status: newStatus, responded_at: new Date().toISOString() } as any)
      .eq('id', offerId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, status: newStatus })
  } catch (err) {
    console.error('Staff portal respond error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
