import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import type { Database } from '@/types/database'

type TenantIdRow = Pick<Database['public']['Tables']['tenants']['Row'], 'id'>
type BookingPageAbStatRow = Database['public']['Tables']['booking_page_ab_stats']['Row']

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = createSupabaseAdminClient()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('user_id', user.id)
    .single()
  const typedTenant = tenant as TenantIdRow | null

  if (!typedTenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const { data: stats } = await supabase
    .from('booking_page_ab_stats')
    .select('variant, views, bookings')
    .eq('tenant_id', typedTenant.id)
  const typedStats = (stats || []) as BookingPageAbStatRow[]

  const response = {
    stats: {
      A: { views: 0, bookings: 0 },
      B: { views: 0, bookings: 0 },
    },
  }

  for (const row of typedStats) {
    if (row.variant === 'A') response.stats.A = { views: row.views, bookings: row.bookings }
    if (row.variant === 'B') response.stats.B = { views: row.views, bookings: row.bookings }
  }

  return NextResponse.json(response)
}
