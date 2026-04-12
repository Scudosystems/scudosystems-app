import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

type TenantInfo = {
  id: string
  business_name: string
  brand_colour: string | null
  logo_url: string | null
}

type AccessInfo = {
  id: string
  display_name: string | null
  email: string
  role: string | null
  staff_id: string | null
  permissions?: any
  reviews_opt_out?: boolean | null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug, email, code } = body || {}

    if (!slug || !email || !code) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()

    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, business_name, brand_colour, logo_url')
      .eq('slug', slug)
      .single()
    const typedTenant = tenant as TenantInfo | null

    if (!typedTenant) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const { data: access } = await supabase
      .from('staff_portal_access')
      .select('*')
      .eq('tenant_id', typedTenant.id)
      .eq('email', String(email).trim().toLowerCase())
      .eq('access_code', String(code).trim().toUpperCase())
      .eq('is_active', true)
      .single()
    const typedAccess = access as AccessInfo | null

    if (!typedAccess) {
      return NextResponse.json({ error: 'Incorrect email or access code' }, { status: 401 })
    }

    await (supabase
      .from('staff_portal_access') as any)
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', typedAccess.id)

    return NextResponse.json({
      session: {
        access_id: typedAccess.id,
        display_name: typedAccess.display_name,
        email: typedAccess.email,
        role: typedAccess.role,
        staff_id: typedAccess.staff_id,
        permissions: typedAccess.permissions,
        reviews_opt_out: typedAccess.reviews_opt_out ?? false,
        tenant_id: typedTenant.id,
        tenant_name: typedTenant.business_name,
        tenant_brand: typedTenant.brand_colour,
        tenant_logo: typedTenant.logo_url,
        access_code: String(code).trim().toUpperCase(),
      },
    })
  } catch (err) {
    console.error('Staff portal login error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
