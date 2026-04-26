import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'

const PUBLIC_PATHS = [
  '/',
  '/sign-in',
  '/sign-up',
  '/subscribe',
  '/locked',
  '/forgot-password',
  '/reset-password',
  '/privacy',
  '/terms',
  '/auth/callback',
  '/auth/confirm',
  '/book/',
  '/api/webhooks/',
  '/api/bookings/available-slots',
  '/api/bookings/create',
  '/api/demo/',
  '/api/wait/',
  '/api/staff-portal/',
  '/api/reviews/',
]

// Emails that bypass the subscription gate (admin + demo accounts)
const BYPASS_EMAILS = [
  process.env.ADMIN_EMAIL,
  process.env.DEMO_EMAIL,
]

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p))

  if (!isPublic && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    return NextResponse.redirect(url)
  }

  // Admin route protection
  if (pathname.startsWith('/admin') && user?.email !== process.env.ADMIN_EMAIL) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // ── Subscription gate — dashboard routes only ──────────────────────────
  if (user && pathname.startsWith('/dashboard')) {
    const isBypass = BYPASS_EMAILS.includes(user.email)

    if (!isBypass) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('plan_status')
        .eq('user_id', user.id)
        .maybeSingle()

      const status = (tenant as any)?.plan_status as string | null | undefined

      // No subscription started yet → must activate trial
      if (!status) {
        const url = request.nextUrl.clone()
        url.pathname = '/subscribe'
        return NextResponse.redirect(url)
      }

      // Trial expired / payment failed / cancelled → locked page
      if (status === 'past_due' || status === 'cancelled') {
        const url = request.nextUrl.clone()
        url.pathname = '/locked'
        return NextResponse.redirect(url)
      }

      // 'trialing' | 'active' → allowed through
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
