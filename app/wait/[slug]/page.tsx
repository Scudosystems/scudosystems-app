'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { AlertCircle, CheckCircle2, Clock, Loader2, ShieldCheck, Timer } from 'lucide-react'
import type { Tenant } from '@/types/database'

const statusLabels: Record<string, { label: string; tone: string }> = {
  scheduled: { label: 'Scheduled', tone: 'bg-slate-50 text-slate-700' },
  checked_in: { label: 'Checked in', tone: 'bg-blue-50 text-blue-700' },
  in_service: { label: 'In service', tone: 'bg-amber-50 text-amber-700' },
  completed: { label: 'Completed', tone: 'bg-emerald-50 text-emerald-700' },
  cancelled: { label: 'Cancelled', tone: 'bg-red-50 text-red-700' },
}

export default function WaitPage() {
  const params = useParams() as { slug?: string }
  const search = useSearchParams()
  const slug = params?.slug || ''

  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tenantError, setTenantError] = useState<string | null>(null)
  const [bookingRef, setBookingRef] = useState(search.get('ref') || '')
  const [contact, setContact] = useState('')
  const [checking, setChecking] = useState(false)
  const [status, setStatus] = useState<any>(null)
  const [now, setNow] = useState(Date.now())
  const [concern, setConcern] = useState('')
  const [concernSaving, setConcernSaving] = useState(false)
  const [concernSaved, setConcernSaved] = useState(false)

  useEffect(() => {
    const loadTenant = async () => {
      try {
        const res = await fetch(`/api/wait/tenant?slug=${encodeURIComponent(slug)}`)
        const data = await res.json()
        if (!res.ok) {
          setTenant(null)
          setTenantError(data?.error || 'Unable to load business details')
        } else {
          setTenant((data?.tenant as Tenant) || null)
          setTenantError(null)
        }
      } catch {
        setTenant(null)
        setTenantError('Unable to load business details')
      } finally {
        setLoading(false)
      }
    }
    if (slug) loadTenant()
  }, [slug])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!status || !bookingRef.trim() || !contact.trim()) return
    const interval = setInterval(() => {
      fetch('/api/wait/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, bookingRef: bookingRef.trim(), contact: contact.trim() }),
      })
        .then(res => res.json().then(data => ({ ok: res.ok, data })))
        .then(({ ok, data }) => {
          if (ok) setStatus({ ...data, bookingRef: bookingRef.trim() })
        })
        .catch(() => null)
    }, 60000)
    return () => clearInterval(interval)
  }, [status, bookingRef, contact, slug])

  const brandColour = tenant?.brand_colour || '#0d6e6e'
  const headline = tenant?.wait_qr_headline || 'Check Your Wait Time'
  const subtext = tenant?.wait_qr_subtext || 'Enter your booking reference and mobile/email to see live updates.'
  const ctaText = tenant?.wait_qr_cta || 'Get live queue status'

  const estimatedStart = status?.estimatedStart ? new Date(status.estimatedStart).getTime() : null
  const remainingMs = estimatedStart ? Math.max(estimatedStart - now, 0) : null
  const remainingMinutes = remainingMs !== null ? Math.max(1, Math.ceil(remainingMs / 60000)) : null

  const statusLabel = status?.status ? statusLabels[status.status] : null
  const reviewUrl = slug && status?.bookingRef ? `/review/${slug}/${status.bookingRef}` : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setChecking(true)
    setError(null)
    setStatus(null)
    try {
      const res = await fetch('/api/wait/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, bookingRef: bookingRef.trim(), contact: contact.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Unable to load status')
      setStatus({ ...data, bookingRef: bookingRef.trim() })
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  const submitConcern = async () => {
    if (!concern.trim() || !status) return
    setConcernSaving(true)
    setConcernSaved(false)
    try {
      const res = await fetch('/api/wait/concern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, bookingRef: bookingRef.trim(), contact: contact.trim(), concern: concern.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Could not save concern')
      setConcernSaved(true)
      setConcern('')
    } catch (err) {
      console.error(err)
    } finally {
      setConcernSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
      </div>
    )
  }

  if (!tenant || tenant.wait_page_enabled === false) {
    const message = tenant
      ? 'This business has disabled the wait‑time page.'
      : (tenantError || 'Please ask reception for help or use your booking confirmation.')
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-center px-6">
        <div className="max-w-md">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
          <h1 className="mt-4 text-xl font-semibold text-slate-800">Wait‑time page is not available</h1>
          <p className="mt-2 text-sm text-slate-500">{message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
        <div className="rounded-3xl p-8 bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{tenant.business_name}</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">{headline}</h1>
              <p className="mt-2 text-sm text-slate-500">{subtext}</p>
            </div>
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: brandColour + '20' }}>
              <Timer className="w-6 h-6" style={{ color: brandColour }} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">Booking reference</label>
              <input
                value={bookingRef}
                onChange={e => setBookingRef(e.target.value)}
                className="mt-2 w-full h-11 rounded-xl border border-slate-200 px-3 text-sm"
                placeholder="e.g. SCU-48291"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">Email or phone</label>
              <input
                value={contact}
                onChange={e => setContact(e.target.value)}
                className="mt-2 w-full h-11 rounded-xl border border-slate-200 px-3 text-sm"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={checking}
              className="sm:col-span-2 mt-2 w-full h-12 rounded-xl font-semibold text-white transition-all"
              style={{ background: brandColour }}
            >
              {checking ? 'Checking…' : ctaText}
            </button>
          </form>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {status && (
          <div className="rounded-3xl p-8 bg-white border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">Now serving</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  {status.displayName || 'Customer'}
                </h2>
              </div>
              {statusLabel && (
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusLabel.tone}`}>{statusLabel.label}</span>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">Queue position</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {status.status === 'in_service' ? 'In service' : (status.position || '—')}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {status.totalAhead ? `${status.totalAhead} ahead of you` : 'You are next when ready.'}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">Estimated wait</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {status.status === 'completed' ? 'Completed' : (remainingMinutes ? `${remainingMinutes} min` : '—')}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {status.status === 'in_service' ? 'You are being seen now.' : 'We will update live as the queue changes.'}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">Scheduled time</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {status.bookingTime ? status.bookingTime.slice(0, 5) : '—'}
                </p>
                <p className="text-xs text-slate-500 mt-2">{status.bookingDate || 'Today'}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
              <div className="text-sm text-slate-600">
                <p className="font-semibold text-slate-800">Live updates every minute</p>
                <p>If your booking finishes early, your wait time updates automatically.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                <p className="text-sm font-semibold text-slate-900">Add concerns for the team</p>
                <textarea
                  value={concern}
                  onChange={e => setConcern(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Any requests, sensitivities, or notes for the team…"
                />
                <button
                  type="button"
                  onClick={submitConcern}
                  disabled={!concern.trim() || concernSaving}
                  className="w-full h-10 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-60"
                  style={{ background: brandColour }}
                >
                  {concernSaving ? 'Saving…' : 'Send concerns'}
                </button>
                {concernSaved && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Saved for the team.</p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                <p className="text-sm font-semibold text-slate-900">Leave a review after your visit</p>
                <p className="text-xs text-slate-500">Share feedback on timing, service, and cleanliness.</p>
                {reviewUrl ? (
                  <Link
                    href={reviewUrl}
                    className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold text-white"
                    style={{ background: brandColour }}
                  >
                    <ShieldCheck className="w-4 h-4" /> Leave a review
                  </Link>
                ) : (
                  <button
                    className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold text-white"
                    style={{ background: brandColour }}
                  >
                    <ShieldCheck className="w-4 h-4" /> Leave a review
                  </button>
                )}
                <p className="text-[11px] text-slate-400">Reviews are private to the business team.</p>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-slate-400 text-center">Powered by ScudoSystems.com</div>
      </div>
    </div>
  )
}
