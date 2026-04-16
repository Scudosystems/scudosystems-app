import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { generateSlug } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const { businessName, vertical } = await req.json()

    if (!businessName || !vertical) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()

    // Check if tenant already exists for this user
    const { data: existing } = await supabase
      .from('tenants')
      .select('id, slug')
      .eq('user_id', user.id)
      .single()
    const typedExisting = existing as { id: string; slug: string } | null

    if (typedExisting) {
      return NextResponse.json({ tenantId: typedExisting.id, slug: typedExisting.slug })
    }

    // Generate unique slug
    let slug = generateSlug(businessName)
    const { data: existingSlug } = await supabase.from('tenants').select('id').eq('slug', slug).single()
    if (existingSlug) slug = `${slug}-${Date.now().toString(36)}`

    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 14)

    const { data: tenant, error } = await (supabase.from('tenants') as any).insert({
      user_id: user.id,
      owner_email: user.email,
      business_name: businessName,
      vertical,
      slug,
      plan: 'starter',
      plan_status: 'trialing',
      trial_ends_at: trialEndsAt.toISOString(),
      onboarding_completed: false,
    }).select().single()

    if (error) throw error

    const typedTenant = tenant as { id: string; slug: string } | null
    return NextResponse.json({ tenantId: typedTenant?.id, slug: typedTenant?.slug })
  } catch (err) {
    console.error('Create tenant error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
