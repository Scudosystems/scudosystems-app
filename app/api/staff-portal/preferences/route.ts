import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { accessId, email, code, reviewsOptOut } = body || {}

    if (!accessId || !email || !code) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()

    const { data: access } = await supabase
      .from('staff_portal_access')
      .select('id, tenant_id')
      .eq('id', accessId)
      .eq('email', String(email).trim().toLowerCase())
      .eq('access_code', String(code).trim().toUpperCase())
      .eq('is_active', true)
      .single()
    const typedAccess = access as { id: string } | null

    if (!typedAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await (supabase
      .from('staff_portal_access') as any)
      .update({ reviews_opt_out: !!reviewsOptOut })
      .eq('id', typedAccess.id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Staff preferences error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
