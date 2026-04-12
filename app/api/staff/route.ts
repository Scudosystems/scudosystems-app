import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase-server'
import type { Database } from '@/types/database'

type TenantIdRow = Pick<Database['public']['Tables']['tenants']['Row'], 'id'>

async function getTenantId(userId: string) {
  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from('tenants')
    .select('id')
    .eq('user_id', userId)
    .order('onboarding_completed', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
  const adminRows = (data || []) as TenantIdRow[]
  if (!error && adminRows.length > 0) return { id: adminRows[0].id, error: null as string | null }

  let lastError = error?.message || null
  try {
    const server = await createSupabaseServerClient()
    const { data: serverData, error: serverError } = await server
      .from('tenants')
      .select('id')
      .order('onboarding_completed', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
    const serverRows = (serverData || []) as TenantIdRow[]
    if (!serverError && serverRows.length > 0) {
      return { id: serverRows[0].id, error: null as string | null }
    }
    if (serverError?.message) lastError = serverError.message
  } catch (err) {
    lastError = err instanceof Error ? err.message : 'Tenant lookup failed'
  }

  return { id: null as string | null, error: lastError || 'Tenant not found' }
}

/**
 * GET /api/staff
 * List all staff for the authenticated tenant.
 */
export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = createSupabaseAdminClient()

  const tenant = await getTenantId(user.id)
  if (!tenant.id) return NextResponse.json({ error: tenant.error || 'Tenant not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/**
 * POST /api/staff
 * Create a new staff member for the authenticated tenant.
 */
export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = createSupabaseAdminClient()

  const tenant = await getTenantId(user.id)
  if (!tenant.id) return NextResponse.json({ error: tenant.error || 'Tenant not found' }, { status: 404 })

  const body = await req.json()
  const { name, role, bio } = body

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const { data, error } = await (supabase
    .from('staff') as any)
    .insert({ tenant_id: tenant.id, name, role: role || null, bio: bio || null, is_active: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/**
 * PATCH /api/staff
 * Update a staff member's details.
 * Body: { id, ...fields }
 */
export async function PATCH(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = createSupabaseAdminClient()

  const tenant = await getTenantId(user.id)
  if (!tenant.id) return NextResponse.json({ error: tenant.error || 'Tenant not found' }, { status: 404 })

  const body = await req.json()
  const { id, ...fields } = body

  if (!id) return NextResponse.json({ error: 'Staff id required' }, { status: 400 })

  // Verify the staff member belongs to this tenant
  const { data: existing } = await supabase
    .from('staff')
    .select('id')
    .eq('id', id)
    .eq('tenant_id', tenant.id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Staff not found' }, { status: 404 })

  const { data, error } = await (supabase
    .from('staff') as any)
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/**
 * DELETE /api/staff?id=<staff_id>
 * Permanently remove a staff member and all related records:
 *   - staff_job_offers (cascade delete)
 *   - availability rows linked to this staff member
 * Then deletes the staff row itself.
 */
export async function DELETE(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = createSupabaseAdminClient()

  const tenant = await getTenantId(user.id)
  if (!tenant.id) return NextResponse.json({ error: tenant.error || 'Tenant not found' }, { status: 404 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Staff id required' }, { status: 400 })

  // Verify ownership
  const { data: existing } = await supabase
    .from('staff')
    .select('id')
    .eq('id', id)
    .eq('tenant_id', tenant.id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Staff not found' }, { status: 404 })

  // 1. Delete related job offers
  await supabase.from('staff_job_offers').delete().eq('staff_id', id)

  // 2. Delete availability rows tied to this specific staff member
  await supabase.from('availability').delete().eq('staff_id', id)

  // 3. Null-out staff_id on bookings so they don't orphan (keep booking history)
  await (supabase.from('bookings') as any).update({ staff_id: null }).eq('staff_id', id)

  // 4. Finally delete the staff member
  const { error } = await (supabase.from('staff') as any).delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
