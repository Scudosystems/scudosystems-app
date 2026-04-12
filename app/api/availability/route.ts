import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import type { Database } from '@/types/database'

type TenantIdRow = Pick<Database['public']['Tables']['tenants']['Row'], 'id'>
type AvailabilityRow = Database['public']['Tables']['availability']['Row']

async function getTenantId(supabase: ReturnType<typeof createSupabaseAdminClient>, userId: string) {
  const { data, error } = await supabase
    .from('tenants')
    .select('id')
    .eq('user_id', userId)
    .order('onboarding_completed', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
  if (error) return null
  const tenantRows = (data || []) as TenantIdRow[]
  return tenantRows.length > 0 ? tenantRows[0].id : null
}

/**
 * GET /api/availability
 * Returns all availability rows + blocked_times for the authenticated tenant.
 */
export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = createSupabaseAdminClient()
  const tenantId = await getTenantId(supabase, user.id)
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const [{ data: availability }, { data: blocked }] = await Promise.all([
    supabase.from('availability').select('*').eq('tenant_id', tenantId),
    supabase.from('blocked_times').select('*').eq('tenant_id', tenantId).order('blocked_date'),
  ])

  return NextResponse.json({ availability: availability || [], blocked: blocked || [], tenantId })
}

/**
 * POST /api/availability
 * Toggle a slot: if a row already exists for (day, startTime, no staff_id) → flip is_active.
 * Otherwise insert a new active row.
 * Body: { day_of_week, start_time, end_time }
 */
export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = createSupabaseAdminClient()
  const tenantId = await getTenantId(supabase, user.id)
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const { day_of_week, start_time, end_time } = await req.json()

  // Check if a row already exists for this slot
  const { data: existingRows } = await supabase
    .from('availability')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('day_of_week', day_of_week)
    .eq('start_time', start_time)
    .is('staff_id', null)
    .limit(1)

  const availabilityRows = (existingRows || []) as AvailabilityRow[]
  const existing = availabilityRows.length > 0 ? availabilityRows[0] : null

  if (existing) {
    // Toggle is_active
    const { data: updated, error } = await (supabase
      .from('availability') as any)
      .update({ is_active: !existing.is_active })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ action: 'updated', row: updated })
  } else {
    // Insert new active slot
    const { data: inserted, error } = await (supabase
      .from('availability') as any)
      .insert({ tenant_id: tenantId, day_of_week, start_time, end_time, is_active: true })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ action: 'inserted', row: inserted })
  }
}

/**
 * PUT /api/availability/block
 * Add a blocked time.
 * Body: { date?, startTime, endTime, reason }
 */
export async function PUT(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = createSupabaseAdminClient()
  const tenantId = await getTenantId(supabase, user.id)
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const { date, startTime, endTime, reason } = await req.json()

  const { data, error } = await (supabase
    .from('blocked_times') as any)
    .insert({
      tenant_id: tenantId,
      blocked_date: date || null,
      start_time: startTime,
      end_time: endTime,
      reason: reason || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/**
 * DELETE /api/availability?block_id=<id>
 * Remove a blocked time by id.
 */
export async function DELETE(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = createSupabaseAdminClient()
  const tenantId = await getTenantId(supabase, user.id)
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const blockId = new URL(req.url).searchParams.get('block_id')
  if (!blockId) return NextResponse.json({ error: 'block_id required' }, { status: 400 })

  // Verify ownership before deleting
  const { error } = await supabase
    .from('blocked_times')
    .delete()
    .eq('id', blockId)
    .eq('tenant_id', tenantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
