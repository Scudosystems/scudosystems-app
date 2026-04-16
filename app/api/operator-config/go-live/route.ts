import { NextResponse } from 'next/server'
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase-server'
import { fetchLatestTenant } from '@/lib/tenant'
import { getTenantOperatorConfig, operatorConfigToTenantPatch } from '@/lib/self-serve/storage'
import { deriveLaunchReadiness, validateOperatorConfig } from '@/lib/self-serve/validation'

export async function POST() {
  const supabase = await createSupabaseServerClient()
  const tenant = await fetchLatestTenant(supabase, 'id,vertical,operator_config,business_name,email,owner_email,phone,website')
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const config = getTenantOperatorConfig(tenant)
  const checks = validateOperatorConfig(config)
  const readiness = deriveLaunchReadiness(checks)

  if (readiness !== 'ready_to_launch') {
    return NextResponse.json({ error: 'Launch gates not satisfied', checks, readiness }, { status: 400 })
  }

  const admin = createSupabaseAdminClient()
  const nextConfig = {
    ...config,
    launchReadiness: 'live' as const,
    providerConfig: {
      ...config.providerConfig,
      mode: 'live' as const,
    },
  }

  const { error } = await (admin.from('tenants') as any)
    .update(operatorConfigToTenantPatch(nextConfig))
    .eq('id', tenant.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, config: nextConfig })
}
