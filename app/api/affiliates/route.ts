import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server'
import type { Database } from '@/types/database'

type TenantIdRow = Pick<Database['public']['Tables']['tenants']['Row'], 'id'>

async function getTenantId() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, tenantId: null }
  const { data, error } = await supabase
    .from('tenants')
    .select('id')
    .eq('user_id', user.id)
    .order('onboarding_completed', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
  if (error || !data || data.length === 0) return { supabase, tenantId: null }
  const tenantRows = data as TenantIdRow[]
  return { supabase, tenantId: tenantRows[0]?.id || null }
}

export async function POST(req: NextRequest) {
  const { tenantId } = await getTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { name, email, phone, code, commission_rate, commission_type, fixed_amount_pence, notes, status } = body

  if (!name || !email || !code) {
    return NextResponse.json({ error: 'Name, email and code are required.' }, { status: 400 })
  }

  const admin = createSupabaseAdminClient()
  const { data, error } = await (admin.from('affiliates') as any)
    .insert({
      tenant_id: tenantId,
      name,
      email,
      phone: phone || null,
      code,
      commission_rate: Number(commission_rate) || 0,
      commission_type: commission_type || 'percentage',
      fixed_amount_pence: Number(fixed_amount_pence) || 0,
      notes: notes || null,
      status: status || 'active',
      total_clicks: 0,
      total_bookings: 0,
      total_earned_pence: 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ affiliate: data })
}

export async function PATCH(req: NextRequest) {
  const { tenantId } = await getTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { id, ...rest } = body
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const payload: any = {
    updated_at: new Date().toISOString(),
  }
  const allowed = [
    'name',
    'email',
    'phone',
    'code',
    'commission_rate',
    'commission_type',
    'fixed_amount_pence',
    'notes',
    'status',
  ]
  for (const key of allowed) {
    if (rest[key] !== undefined) payload[key] = rest[key]
  }

  const admin = createSupabaseAdminClient()
  const { data, error } = await (admin.from('affiliates') as any)
    .update(payload)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ affiliate: data })
}

export async function DELETE(req: NextRequest) {
  const { tenantId } = await getTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const admin = createSupabaseAdminClient()
  const { error } = await admin
    .from('affiliates')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
