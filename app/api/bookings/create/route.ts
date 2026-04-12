import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { sendBookingConfirmation, sendNewBookingAlert } from '@/lib/resend'
import type { Database } from '@/types/database'

type TenantRow = Database['public']['Tables']['tenants']['Row']

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tenantId, bookingRef, customerEmail, customerName, serviceName, bookingDate, bookingTime, totalAmount, depositAmount } = body

    if (!tenantId || !bookingRef) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()

    // Get tenant details for email
    const { data: tenant } = await supabase.from('tenants').select('*').eq('id', tenantId).single()
    const typedTenant = tenant as TenantRow | null
    if (!typedTenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const emailData = {
      customerName,
      customerEmail,
      businessName: typedTenant.business_name,
      serviceName,
      bookingDate,
      bookingTime,
      totalAmount,
      depositAmount: depositAmount || undefined,
      bookingRef,
      cancellationPolicy: typedTenant.cancellation_policy || undefined,
    }

    // Send confirmation to customer
    if (typedTenant.email_reminders_enabled) {
      await sendBookingConfirmation(emailData)
    }

    // Send alert to business owner
    const ownerEmail = typedTenant.owner_email || typedTenant.email
    if (ownerEmail) {
      await sendNewBookingAlert(ownerEmail, typedTenant.business_name, emailData)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Booking create error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
