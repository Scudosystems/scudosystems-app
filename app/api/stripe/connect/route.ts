import { NextRequest, NextResponse } from 'next/server'

/**
 * Stripe Connect is not enabled on this platform.
 * ScudoSystems charges businesses a monthly subscription only.
 * Businesses collect payments from their own customers via their own
 * payment links (PayPal, SumUp, Square, etc.) configured in Settings → Integrations.
 *
 * These routes are intentionally disabled and will always return 501.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  return NextResponse.json(
    { connected: false, onboarded: false, disabled: true },
    { status: 200 }
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    {
      error: 'Stripe Connect is not enabled on this platform. Add your own payment link in Settings → Integrations instead.',
    },
    { status: 501 }
  )
}
