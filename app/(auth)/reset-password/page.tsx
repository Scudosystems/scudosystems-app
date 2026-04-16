'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Lock, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

export default function ResetPasswordPage() {
  const supabase = createSupabaseBrowserClient()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState<boolean | null>(null) // null = still checking
  const [error, setError] = useState('')

  useEffect(() => {
    const checkSession = async () => {
      // Wait briefly for Supabase to restore session from URL hash or cookie
      await new Promise(r => setTimeout(r, 500))
      const { data } = await supabase.auth.getSession()
      setReady(!!data.session)
    }
    checkSession()
    // Also listen for the PASSWORD_RECOVERY event Supabase fires on the reset page
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!ready) {
      setError('Reset link expired. Please request a new one.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      router.push('/sign-in?reset=1')
    } catch (err: any) {
      setError(err?.message || 'Could not update password.')
    } finally {
      setLoading(false)
    }
  }

  // Still checking — show spinner to avoid flashing "expired" prematurely
  if (ready === null) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal" />
      </div>
    )
  }

  if (ready === false) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl border border-border p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
          <h1 className="font-serif text-2xl font-bold text-dark mb-2">Reset link expired</h1>
          <p className="text-sm text-dark/50 mb-5">Please request a new password reset email.</p>
          <Link href="/forgot-password" className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-teal text-white text-sm font-semibold">
            Request new link
          </Link>
        </div>
      </div>
    )
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
        <h1 className="font-serif text-2xl font-bold text-dark mb-2">Set a new password</h1>
        <p className="text-sm text-dark/50 mb-6">Choose a strong password to secure your account.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">New password</label>
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
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">Confirm password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark/30" />
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
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

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-teal text-white text-sm font-semibold hover:bg-teal/90 transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}
