import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase-server'
import { fetchLatestTenant } from '@/lib/tenant'
import { getTenantOperatorConfig, normalizeOperatorConfig, operatorConfigToTenantPatch } from '@/lib/self-serve/storage'
import type { OperatorConfig } from '@/lib/self-serve/types'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const tenant = await fetchLatestTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const config = getTenantOperatorConfig(tenant)
  return NextResponse.json({ tenant, config })
}

export async function PUT(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const tenant = await fetchLatestTenant(supabase, 'id,user_id,business_name,vertical,email,owner_email,phone,website,operator_config')
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const body = (await req.json().catch(() => null)) as OperatorConfig | null
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })

  const normalized = normalizeOperatorConfig(body)
  const admin = createSupabaseAdminClient()
  const { error } = await (admin.from('tenants') as any)
    .update(operatorConfigToTenantPatch(normalized))
    .eq('id', tenant.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, config: normalized })
}
