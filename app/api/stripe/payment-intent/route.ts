import { NextRequest, NextResponse } from 'next/server'

/**
 * Stripe Connect payment intents are disabled.
 * ScudoSystems is subscription-only — businesses collect payments via their
 * own payment links configured in Settings → Integrations.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: 'connect_required' },
    { status: 409 }
  )
}
