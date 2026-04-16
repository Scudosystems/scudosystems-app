import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { sendWelcomeEmail } from '@/lib/resend'
import { absoluteUrl, generateSlug, sanitizeInput } from '@/lib/utils'
import { VERTICALS } from '@/lib/verticals'
import { getRecommendedBookingTheme, getRecommendedGuidelines } from '@/lib/industry-defaults'
import { normalizeOperatorConfig } from '@/lib/self-serve/storage'
import type { Database } from '@/types/database'

type TenantRow = Database['public']['Tables']['tenants']['Row']

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const body = await req.json()
    const { businessName, vertical, address, phone, website, description, brandColour, hours, services, preferences, slug: proposedSlug, logoUrl, operatorConfig } = body

    const isOperatorFlow = ['carwash', 'auto', 'restaurant', 'takeaway', 'grooming'].includes(vertical)
    if (isOperatorFlow && !operatorConfig) {
      return NextResponse.json({ error: 'Operator setup is required for this industry.' }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()

    // Get or create tenant for this user
    let { data: tenant } = await supabase.from('tenants')
      .select('id, slug, vertical, staff_guidelines, booking_page_theme, booking_page_headline, booking_page_subtext, booking_page_cta_label, booking_page_font, booking_page_button_style')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    let typedTenant = tenant as TenantRow | null

    let slug = proposedSlug || generateSlug(businessName)
    let isNewTenant = false

    if (!tenant) {
      const { data: newTenant, error } = await (supabase.from('tenants') as any).insert({
        user_id: user.id,
        business_name: sanitizeInput(businessName),
        vertical,
        slug,
        owner_email: user.email,
        plan: 'starter',
        plan_status: 'trialing',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      }).select().single()
      if (error) throw error
      tenant = newTenant
      typedTenant = newTenant as TenantRow
      isNewTenant = true
    }

    const tenantId = typedTenant?.id
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Update tenant with all onboarding data
    const verticalInfo = vertical ? VERTICALS[vertical as keyof typeof VERTICALS] : null
    const recommendedTheme = getRecommendedBookingTheme(vertical)
    const recommendedGuidelines = getRecommendedGuidelines(vertical)
    const recommendedHeadline = verticalInfo
      ? `${verticalInfo.bookingPageLabel} at ${sanitizeInput(businessName)}`
      : `Book ${sanitizeInput(businessName)}`
    const recommendedSubtext = verticalInfo?.tagline || 'Choose a service, pick a time, and you are confirmed instantly.'
    const cleanBookingLabel = verticalInfo?.bookingPageLabel
      ? verticalInfo.bookingPageLabel.replace(/^Book\s+/i, '').trim()
      : ''
    const recommendedCta = cleanBookingLabel
      ? `Confirm ${cleanBookingLabel}`
      : 'Confirm Booking'

    const updatePayload: any = {
      business_name: sanitizeInput(businessName),
      vertical,
      slug: typedTenant?.slug || slug,
      address: address ? sanitizeInput(address) : null,
      phone: phone || null,
      website: website || null,
      description: description ? sanitizeInput(description).slice(0, 160) : null,
      brand_colour: brandColour || '#0d6e6e',
      logo_url: logoUrl || null,
      onboarding_completed: true,
      allow_same_day: preferences?.allowSameDay ?? true,
      minimum_advance_hours: preferences?.minimumAdvanceHours ?? 0,
      auto_confirm: preferences?.autoConfirm ?? true,
      require_deposit: preferences?.requireDeposit ?? false,
      sms_reminders_enabled: preferences?.smsReminders ?? false,
      email_reminders_enabled: preferences?.emailReminders ?? true,
      daily_summary_email: preferences?.dailySummaryEmail ?? true,
      new_booking_sms: preferences?.newBookingSms ?? false,
      cancellation_policy: preferences?.cancellationPolicy || null,
    }

    if (isOperatorFlow && operatorConfig) {
      updatePayload.operator_config = normalizeOperatorConfig(operatorConfig)
    }

    const verticalChanged = !!typedTenant?.vertical && typedTenant.vertical !== vertical

    if (isNewTenant || verticalChanged || !typedTenant?.booking_page_theme) {
      updatePayload.booking_page_theme = recommendedTheme
    }
    if (isNewTenant || verticalChanged || !typedTenant?.booking_page_headline) {
      updatePayload.booking_page_headline = recommendedHeadline
    }
    if (isNewTenant || verticalChanged || !typedTenant?.booking_page_subtext) {
      updatePayload.booking_page_subtext = recommendedSubtext
    }
    if (isNewTenant || verticalChanged || !typedTenant?.booking_page_cta_label) {
      updatePayload.booking_page_cta_label = recommendedCta
    }
    if (isNewTenant || verticalChanged || !typedTenant?.booking_page_font) {
      updatePayload.booking_page_font = 'sans'
    }
    if (isNewTenant || verticalChanged || !typedTenant?.booking_page_button_style) {
      updatePayload.booking_page_button_style = 'solid'
    }
    if (isNewTenant || verticalChanged || !typedTenant?.staff_guidelines || typedTenant.staff_guidelines.length === 0) {
      updatePayload.staff_guidelines = recommendedGuidelines
    }

    await (supabase.from('tenants') as any).update(updatePayload).eq('id', tenantId)

    // Save availability (opening hours)
    if (!isOperatorFlow && hours && Array.isArray(hours)) {
      await (supabase.from('availability') as any).delete().eq('tenant_id', tenantId).is('staff_id', null)
      const availabilityRows = hours
        .filter((h: any) => h.isOpen)
        .map((h: any) => ({
          tenant_id: tenantId,
          staff_id: null,
          day_of_week: h.dayOfWeek,
          start_time: h.startTime,
          end_time: h.endTime,
          is_active: true,
        }))
      if (availabilityRows.length > 0) {
        await (supabase.from('availability') as any).insert(availabilityRows)
      }
    }

    // Save services
    if (!isOperatorFlow && services && Array.isArray(services)) {
      await (supabase.from('services') as any).delete().eq('tenant_id', tenantId)
      const serviceRows = services.map((s: any, idx: number) => ({
        tenant_id: tenantId,
        name: sanitizeInput(s.name),
        description: s.description ? sanitizeInput(s.description) : null,
        duration_minutes: s.duration_minutes || 60,
        price_pence: s.price_pence || 0,
        deposit_pence: s.deposit_pence || 0,
        requires_deposit: s.requires_deposit || false,
        is_active: true,
        sort_order: idx,
      }))
      if (serviceRows.length > 0) {
        await (supabase.from('services') as any).insert(serviceRows)
      }
    }

    // Send welcome email (optional — only fires if RESEND_API_KEY is set)
    if (process.env.RESEND_API_KEY && user.email) {
      await sendWelcomeEmail(user.email, sanitizeInput(businessName), absoluteUrl('/dashboard'))
    }

    return NextResponse.json({ success: true, tenantId })
  } catch (err) {
    console.error('Onboarding save error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
