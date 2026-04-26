'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, AlertTriangle, RotateCcw, MessageCircle } from 'lucide-react'

export default function LockedPage() {
  const [loading, setLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState('')

  // Reactivate — new checkout session
  async function reactivate() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout?from=setup', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'Could not open checkout.')
      window.location.href = data.url
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  // Billing portal — update payment method
  async function openPortal() {
    setPortalLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'Could not open billing portal.')
      window.location.href = data.url
    } catch (err: any) {
      setError(err.message)
      setPortalLoading(false)
    }
  }

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

        <div className="bg-white rounded-2xl border border-border p-8 shadow-sm text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>

          <h1 className="font-serif text-2xl font-bold text-dark mb-2">
            Your account is paused
          </h1>
          <p className="text-dark/60 text-sm mb-6 leading-relaxed">
            Your trial has ended or your last payment didn't go through. Reactivate below
            to get straight back into your dashboard — all your data is still there.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-4 text-left">
              {error}
            </div>
          )}

          <button
            onClick={reactivate}
            disabled={loading || portalLoading}
            className="btn-primary w-full h-12 flex items-center justify-center gap-2 text-base mb-3"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Opening checkout…</>
              : <><RotateCcw className="w-4 h-4" /> Reactivate my account</>}
          </button>

          <button
            onClick={openPortal}
            disabled={loading || portalLoading}
            className="w-full h-11 rounded-xl border border-border text-sm text-dark/70 hover:bg-cream transition-colors flex items-center justify-center gap-2"
          >
            {portalLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Opening portal…</>
              : 'Update payment method instead'}
          </button>
        </div>

        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-dark/40">
            Questions?{' '}
            <a href="mailto:hello@scudosystems.com" className="underline hover:text-dark/60 inline-flex items-center gap-1">
              <MessageCircle className="w-3 h-3" /> hello@scudosystems.com
            </a>
          </p>
          <p className="text-xs text-dark/40">
            <Link href="/sign-in" className="underline hover:text-dark/60">
              Sign in to a different account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
