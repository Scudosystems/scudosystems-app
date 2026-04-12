import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server'
import type { Database } from '@/types/database'

type TenantIdRow = Pick<Database['public']['Tables']['tenants']['Row'], 'id'>

/**
 * Server-side API for job offer management.
 * Using server client (with user auth) for GET/POST/PATCH,
 * and admin client for DELETE to bypass any RLS edge cases.
 */

async function getTenantId(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('tenants')
    .select('id')
    .eq('user_id', user.id)
    .order('onboarding_completed', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
  if (error) return null
  const tenantRows = (data || []) as TenantIdRow[]
  return tenantRows.length > 0 ? tenantRows[0].id : null
}

export async function GET(_req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const tenantId = await getTenantId(supabase)
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('staff_job_offers')
    .select('*, staff(id, name, role)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ offers: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const tenantId = await getTenantId(supabase)
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { staff_id, role_title, start_at, end_at, hourly_rate_pence, notes } = body

  if (!staff_id || !start_at || !end_at) {
    return NextResponse.json({ error: 'staff_id, start_at and end_at are required' }, { status: 400 })
  }

  // Verify the staff member belongs to this tenant
  const { data: staffMember } = await supabase
    .from('staff')
    .select('id')
    .eq('id', staff_id)
    .eq('tenant_id', tenantId)
    .single()

  if (!staffMember) {
    return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
  }

  const admin = createSupabaseAdminClient()
  const { data, error } = await (admin.from('staff_job_offers') as any).insert({
    tenant_id: tenantId,
    staff_id,
    role_title: role_title || 'Shift offer',
    start_at,
    end_at,
    hourly_rate_pence: Number(hourly_rate_pence) || 0,
    notes: notes || null,
    status: 'pending',
  }).select('*, staff(id, name, role)').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ offer: data })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const tenantId = await getTenantId(supabase)
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { id, status } = body

  if (!id || !status) {
    return NextResponse.json({ error: 'id and status are required' }, { status: 400 })
  }

  const admin = createSupabaseAdminClient()
  const { error } = await (admin.from('staff_job_offers') as any)
    .update({ status } as any)
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const tenantId = await getTenantId(supabase)
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const admin = createSupabaseAdminClient()
  const { error } = await admin
    .from('staff_job_offers')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
