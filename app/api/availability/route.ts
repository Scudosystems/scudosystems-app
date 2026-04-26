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
 * Set a slot to a specific state. Accepts is_active explicitly — never toggles.
 * If a row already exists → update is_active to the requested value.
 * If no row and is_active: true → insert a new active row.
 * If no row and is_active: false → noop (nothing to close).
 * Body: { day_of_week, start_time, end_time, is_active: boolean }
 */
export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = createSupabaseAdminClient()
  const tenantId = await getTenantId(supabase, user.id)
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const { day_of_week, start_time, end_time, is_active } = await req.json()

  if (typeof is_active !== 'boolean') {
    return NextResponse.json({ error: 'is_active (boolean) is required' }, { status: 400 })
  }

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
    // SET is_active to the requested value (not toggle)
    const { data: updated, error } = await (supabase
      .from('availability') as any)
      .update({ is_active })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ action: 'updated', row: updated })
  } else {
    // No existing row
    if (!is_active) {
      // Nothing to close — return a no-op success
      return NextResponse.json({ action: 'noop' })
    }
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
