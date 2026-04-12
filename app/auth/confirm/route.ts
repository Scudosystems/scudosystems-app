import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { type EmailOtpType } from '@supabase/supabase-js'

/**
 * Handles Supabase's OTP/token_hash email-confirmation flow.
 *
 * Same cookie fix as /auth/callback: use { get, set, remove } not
 * { getAll, setAll } so that @supabase/ssr v0.3.0's storage adapter can
 * actually read cookies (it only calls cookies.get(name), not getAll).
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next')
  const safeNext = next && next.startsWith('/') ? next : '/dashboard'

  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/sign-in?error=missing_token`)
  }

  const response = NextResponse.redirect(`${origin}${safeNext}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options, maxAge: 0 })
        },
      },
    }
  )

  const { error } = await supabase.auth.verifyOtp({ type, token_hash })

  if (error) {
    console.error('[auth/confirm] verifyOtp error:', error.message)
    return NextResponse.redirect(`${origin}/sign-in?error=email_verification`)
  }

  return response
}
