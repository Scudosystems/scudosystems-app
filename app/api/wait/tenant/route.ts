import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')

  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  }

  const adminReady = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabase = adminReady ? createSupabaseAdminClient() : await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('tenants')
    .select('id, business_name, brand_colour, logo_url, wait_page_enabled, wait_qr_headline, wait_qr_subtext, wait_qr_cta')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    // Fallback for older schemas missing wait columns
    const { data: fallback, error: fallbackError } = await supabase
      .from('tenants')
      .select('id, business_name, brand_colour, logo_url')
      .eq('slug', slug)
      .maybeSingle()
    const fallbackTenant = fallback as {
      id: string
      business_name: string
      brand_colour: string | null
      logo_url: string | null
    } | null
    if (fallbackError || !fallbackTenant) {
      return NextResponse.json({ error: fallbackError?.message || 'Not found' }, { status: 404 })
    }
    return NextResponse.json({
      tenant: {
        id: fallbackTenant.id,
        business_name: fallbackTenant.business_name,
        brand_colour: fallbackTenant.brand_colour,
        logo_url: fallbackTenant.logo_url,
        wait_page_enabled: true,
        wait_qr_headline: null,
        wait_qr_subtext: null,
        wait_qr_cta: null,
      },
    })
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ tenant: data })
}
