'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Mail, Loader2, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const supabase = createSupabaseBrowserClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cooldown > 0 || loading) return
    setError('')
    setSent(false)
    setLoading(true)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${appUrl}/auth/callback?next=/reset-password`,
      })
      if (resetError) throw resetError
      setSent(true)
      setCooldown(30)
    } catch (err: any) {
      const message = String(err?.message || '').toLowerCase()
      if (message.includes('rate limit')) {
        setError('Too many reset requests. Please wait a minute and try again.')
        setCooldown(60)
      } else {
        setError(err?.message || 'Could not send reset email. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl border border-border p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-teal rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-serif text-xl font-bold text-dark">ScudoSystems</span>
        </div>
        <h1 className="font-serif text-2xl font-bold text-dark mb-2">Reset your password</h1>
        <p className="text-sm text-dark/50 mb-6">Enter your email and we’ll send you a reset link.</p>

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

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {sent && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Reset link sent. Please check your inbox.
            </div>
          )}

          <button
            type="submit"
            disabled={loading || cooldown > 0}
            className="w-full h-11 rounded-xl bg-teal text-white text-sm font-semibold hover:bg-teal/90 transition-colors disabled:opacity-60"
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              : cooldown > 0
                ? `Try again in ${cooldown}s`
                : 'Send reset link'}
          </button>
        </form>

        <p className="text-xs text-dark/40 mt-6 text-center">
          Remembered your password?{' '}
          <Link href="/sign-in" className="text-teal hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
