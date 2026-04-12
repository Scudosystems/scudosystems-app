'use client'

/**
 * /auth/callback — client-side PKCE code exchange.
 *
 * WHY CLIENT-SIDE:
 *   @supabase/ssr v0.3 stores the PKCE code_verifier in document.cookie via
 *   the browser client. Server Route Handlers read cookies from req.cookies,
 *   but in some browsers / Supabase redirect scenarios the verifier cookie is
 *   not present server-side, so exchangeCodeForSession always throws
 *   AuthPKCECodeVerifierMissingError on the server.
 *
 *   Running the exchange in the browser (useEffect) gives the Supabase client
 *   direct access to document.cookie — the verifier is ALWAYS present here.
 */

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

// ─── Inner component (uses useSearchParams — must be inside Suspense) ────────
function CallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const code  = searchParams.get('code')
    const error = searchParams.get('error')
    const next  = searchParams.get('next')
    const safeNext = next && next.startsWith('/') ? next : '/dashboard'

    // Supabase itself returned an error in the redirect URL
    if (error) {
      const desc = searchParams.get('error_description') || error
      setStatus('error')
      setErrorMsg(decodeURIComponent(desc.replace(/\+/g, ' ')))
      return
    }

    if (!code) {
      setStatus('error')
      setErrorMsg('No confirmation code found in the link. Please request a new one below.')
      return
    }

    const supabase = createSupabaseBrowserClient()

    supabase.auth.exchangeCodeForSession(code).then(({ error: exchError }) => {
      if (exchError) {
        console.error('[auth/callback] exchangeCodeForSession:', exchError.message)
        setStatus('error')
        const msg = exchError.message?.toLowerCase() ?? ''
        if (msg.includes('verifier') || msg.includes('pkce')) {
          setErrorMsg(
            'The confirmation link was opened in a different browser or tab. ' +
            'Please go back to the original browser and request a new verification email below.'
          )
        } else if (msg.includes('expired') || msg.includes('invalid')) {
          setErrorMsg('That link has expired or has already been used. Please request a new one below.')
        } else {
          setErrorMsg(exchError.message || 'Could not verify your email. Please request a new link below.')
        }
        return
      }

      setStatus('success')
      // Brief delay so the tick is visible, then redirect
      setTimeout(() => router.replace(safeNext), 900)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-[#f8f6f1] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-[#e8e5e0] shadow-sm p-10 max-w-sm w-full text-center space-y-4">

        {status === 'loading' && (
          <>
            <Loader2 className="w-10 h-10 mx-auto animate-spin" style={{ color: '#0d6e6e' }} />
            <h2 className="text-lg font-semibold text-[#1a1a1a]">Verifying your email…</h2>
            <p className="text-sm text-[#1a1a1a]/50">Just a moment — setting things up.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-10 h-10 mx-auto" style={{ color: '#0d6e6e' }} />
            <h2 className="text-lg font-semibold text-[#1a1a1a]">Email verified!</h2>
            <p className="text-sm text-[#1a1a1a]/50">Taking you to your dashboard…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertTriangle className="w-10 h-10 mx-auto text-amber-500" />
            <h2 className="text-lg font-semibold text-[#1a1a1a]">Couldn't verify your email</h2>
            <p className="text-sm text-[#1a1a1a]/60 leading-relaxed">{errorMsg}</p>
            <div className="pt-2 space-y-3">
              <a
                href="/sign-in?resend=1"
                className="block w-full py-2.5 rounded-xl text-sm font-semibold text-white text-center transition-opacity hover:opacity-90"
                style={{ background: '#0d6e6e' }}
              >
                Request a new verification email
              </a>
              <a
                href="/sign-in"
                className="block w-full py-2.5 rounded-xl text-sm font-medium text-[#1a1a1a]/60 border border-[#e8e5e0] text-center hover:bg-[#f8f6f1] transition-colors"
              >
                Back to sign in
              </a>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

// ─── Suspense wrapper (required for useSearchParams in App Router) ────────────
export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f6f1] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#0d6e6e' }} />
        </div>
      }
    >
      <CallbackInner />
    </Suspense>
  )
}
