import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import type { Database } from '@/types/database'

type TrackEvent = 'view' | 'booking'
type TenantIdRow = Pick<Database['public']['Tables']['tenants']['Row'], 'id'>

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug, variant, event } = body as { slug?: string; variant?: string; event?: TrackEvent }

    if (!slug || !variant || !event) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!['A', 'B'].includes(variant)) {
      return NextResponse.json({ error: 'Invalid variant' }, { status: 400 })
    }
    if (!['view', 'booking'].includes(event)) {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()
    const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', slug).single()
    const typedTenant = tenant as TenantIdRow | null
    if (!typedTenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    const views = event === 'view' ? 1 : 0
    const bookings = event === 'booking' ? 1 : 0

    const { error } = await (supabase.rpc as any)('increment_booking_page_ab_stat', {
      p_tenant: typedTenant.id,
      p_variant: variant,
      p_views: views,
      p_bookings: bookings,
    })
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Booking page track error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
