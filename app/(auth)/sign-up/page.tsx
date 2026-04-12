'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Loader2, Mail, Lock, User, CheckCircle2 } from 'lucide-react'

export default function SignUpPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${appUrl}/auth/callback?next=/onboarding`,
        },
      })
      if (authError) throw authError
      if (!data.session) {
        setInfo('Check your email to verify your account, then sign in to continue.')
        router.push('/sign-in?check_email=1')
        return
      }
      router.push('/onboarding')
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const perks = [
    'Live in under 10 minutes',
    '7-day free trial — no card needed',
    'Automated reminders included',
    'Stripe-secured payments',
  ]

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
          <h2 className="font-serif text-4xl text-white leading-snug mb-8">
            Your customers book.<br />
            <span className="text-teal italic">You just show up.</span>
          </h2>
          <div className="space-y-3">
            {perks.map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-teal flex-shrink-0" />
                <p className="text-white/70 text-sm">{item}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 bg-white/5 rounded-xl p-5 border border-white/10">
          <p className="text-white/80 italic text-sm mb-3">
            "Setup took 12 minutes. We were fully booked the same week."
          </p>
          <p className="text-white/50 text-xs">Sarah Mitchell · Glow Beauty Studio, Birmingham</p>
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

          <h1 className="font-serif text-3xl font-bold text-dark mb-1">Create your account</h1>
          <p className="text-dark/50 text-sm mb-8">Start your 7-day free trial. No credit card required.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">Full name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark/30" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="James Smith"
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-border focus:border-teal focus:ring-2 focus:ring-teal/10 outline-none text-sm transition-all"
                />
              </div>
            </div>

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
              <label className="block text-sm font-medium text-dark mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark/30" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min 8 characters"
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-border focus:border-teal focus:ring-2 focus:ring-teal/10 outline-none text-sm transition-all"
                />
              </div>
            </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {info && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
              {info}
            </div>
          )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-11 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Start free trial'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-dark/40">
            By signing up you agree to our{' '}
            <Link href="/terms" className="underline">Terms</Link> and{' '}
            <Link href="/privacy" className="underline">Privacy Policy</Link>.
          </p>

          <p className="mt-4 text-center text-sm text-dark/50">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-teal font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
