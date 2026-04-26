'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { Loader2, CheckCircle2, CreditCard, ShieldCheck, Clock } from 'lucide-react'

function SubscribeInner() {
  const searchParams = useSearchParams()
  const cancelled = searchParams.get('cancelled') === '1'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function startTrial() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout?from=setup', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Could not start checkout. Please try again.')
      }
      window.location.href = data.url
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const perks = [
    { icon: Clock,        text: '14 days completely free — no charge until day 15' },
    { icon: ShieldCheck,  text: 'Cancel any time before your trial ends, nothing owed' },
    { icon: CreditCard,   text: 'Stripe-secured — your card details are never stored by us' },
    { icon: CheckCircle2, text: 'Full platform access from the moment you activate' },
  ]

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-10">
          <div className="w-9 h-9 bg-teal rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-serif text-xl font-bold text-dark">ScudoSystems</span>
        </div>

        <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
          <h1 className="font-serif text-2xl font-bold text-dark mb-1 text-center">
            Activate your free trial
          </h1>
          <p className="text-dark/50 text-sm text-center mb-6">
            {cancelled
              ? 'No problem — you can activate your trial whenever you\'re ready.'
              : 'One last step before your dashboard is ready.'}
          </p>

          <div className="space-y-3 mb-8">
            {perks.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <Icon className="w-4 h-4 text-teal mt-0.5 flex-shrink-0" />
                <p className="text-sm text-dark/70">{text}</p>
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-4">
              {error}
            </div>
          )}

          <button
            onClick={startTrial}
            disabled={loading}
            className="btn-primary w-full h-12 flex items-center justify-center gap-2 text-base"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparing checkout…</>
              : 'Start my 14-day free trial'}
          </button>

          <p className="text-center text-xs text-dark/40 mt-4">
            You'll be taken to Stripe's secure checkout to save your payment details.
            Your trial starts immediately — you won't be charged for 14 days.
          </p>
        </div>

        <p className="text-center text-xs text-dark/40 mt-6">
          Need help?{' '}
          <a href="mailto:hello@scudosystems.com" className="underline hover:text-dark/60">
            hello@scudosystems.com
          </a>
          {' · '}
          <Link href="/sign-in" className="underline hover:text-dark/60">Sign in to a different account</Link>
        </p>
      </div>
    </div>
  )
}

export default function SubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-teal" />
      </div>
    }>
      <SubscribeInner />
    </Suspense>
  )
}
