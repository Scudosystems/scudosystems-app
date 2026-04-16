'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { fetchLatestTenant } from '@/lib/tenant'
import { Loader2, Mail, Lock, ShieldCheck } from 'lucide-react'

function SignInPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseBrowserClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendStatus, setResendStatus] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const checkEmail = searchParams.get('check_email') === '1'
  const authError = searchParams.get('error') === 'auth'
  const callbackError = searchParams.get('error') === 'auth_callback'
  const missingCode = searchParams.get('error') === 'missing_code'
  const resendRequested = searchParams.get('resend') === '1'
  const demoMode = true // always allow demo access
  const demoRequest = searchParams.get('demo') === '1'
  const demoVertical = searchParams.get('vertical') || 'dental'
  const emailVerificationError = searchParams.get('error') === 'email_verification'
  const resetSuccess = searchParams.get('reset') === '1'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setResendStatus('')
    setLoading(true)
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError

      // Check if onboarding is complete
      let tenant = null
      try {
        tenant = await fetchLatestTenant(supabase, 'onboarding_completed')
      } catch {
        tenant = null
      }

      if (!tenant?.onboarding_completed) {
        router.push('/onboarding')
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  async function handleDemoLogin(verticalOverride?: string) {
    setError('')
    setResendStatus('')
    setDemoLoading(true)
    try {
      const seed = await fetch('/api/demo/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vertical: verticalOverride }),
      })
      if (!seed.ok) throw new Error('Demo setup failed')
      const data = await seed.json()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (authError) throw authError
      router.push('/dashboard?demo=1')
    } catch (err: any) {
      setError(err.message || 'Demo login failed')
    } finally {
      setDemoLoading(false)
    }
  }

  useEffect(() => {
    if (!demoMode || !demoRequest || demoLoading) return
    handleDemoLogin(demoVertical)
  }, [demoMode, demoRequest, demoVertical, demoLoading])

  async function handleResendVerification() {
    setError('')
    setResendStatus('')
    if (!email.trim()) {
      setResendStatus('Enter your email above, then click resend.')
      return
    }
    setResendLoading(true)
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: `${appUrl}/auth/callback?next=/onboarding`,
        },
      })
      if (resendError) throw resendError
      setResendStatus('Verification email resent. Please use the latest link.')
    } catch (err: any) {
      setResendStatus(err.message || 'Could not resend verification email.')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-dark flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal/20 to-transparent" />
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-serif text-xl font-bold text-white">ScudoSystems</span>
          </Link>
        </div>
        <div className="relative z-10">
          <h2 className="font-serif text-4xl text-white leading-snug mb-6">
            Welcome back.<br />
            <span className="text-teal italic">Your business awaits.</span>
          </h2>
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <ShieldCheck className="w-4 h-4 text-teal" />
            Secured with end-to-end encryption
          </div>
        </div>
        <div className="relative z-10 text-white/40 text-sm">
          Not a customer yet?{' '}
          <Link href="/sign-up" className="text-teal hover:underline">Start your free trial</Link>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2 justify-center mb-6">
              <div className="w-8 h-8 bg-teal rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-serif text-xl font-bold text-dark">ScudoSystems</span>
            </Link>
          </div>

          <h1 className="font-serif text-3xl font-bold text-dark mb-1">Sign in</h1>
          <p className="text-dark/50 text-sm mb-8">Enter your email and password to access your dashboard.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark/30" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@yourbusiness.co.uk"
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-border focus:border-teal focus:ring-2 focus:ring-teal/10 outline-none text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-dark">Password</label>
                <Link href="/forgot-password" className="text-xs font-medium text-teal hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark/30" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-border focus:border-teal focus:ring-2 focus:ring-teal/10 outline-none text-sm transition-all"
                />
              </div>
            </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {checkEmail && !error && !authError && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
              Please verify your email address, then sign in to continue.
            </div>
          )}
          {resetSuccess && !error && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
              Password updated. You can sign in now.
            </div>
          )}
          {authError && !error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              Verification link expired or already used. Please sign in again.
            </div>
          )}
          {(callbackError || missingCode || emailVerificationError) && !error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {missingCode
                ? 'Your verification link is missing or incomplete. Please request a new one below.'
                : 'We could not verify your email. The link may have expired — please request a new one below.'}
            </div>
          )}
          {(checkEmail || authError || callbackError || missingCode || emailVerificationError || resendRequested) && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-700 mb-1">Didn’t get the email?</p>
              <p className="mb-2">Enter your email above and resend the verification link.</p>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="text-teal font-semibold hover:underline"
              >
                {resendLoading ? 'Resending…' : 'Resend verification email'}
              </button>
              {resendStatus && (
                <p className="mt-2 text-xs text-slate-500">{resendStatus}</p>
              )}
            </div>
          )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-11 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign in to dashboard'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-dark/50">
            Don't have an account?{' '}
            <Link href="/sign-up" className="text-teal font-medium hover:underline">
              Start free trial
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}


export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <SignInPageContent />
    </Suspense>
  )
}
