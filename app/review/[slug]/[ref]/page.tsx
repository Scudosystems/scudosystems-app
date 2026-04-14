'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { AlertCircle, CheckCircle2, Loader2, Star } from 'lucide-react'
import type { Tenant } from '@/types/database'

const RatingInput = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <div>
    <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">{label}</p>
    <div className="flex items-center gap-1 mt-2">
      {[1,2,3,4,5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className="p-1 rounded-lg hover:bg-slate-100"
        >
          <Star
            className={`w-5 h-5 ${i <= value ? 'text-amber-500' : 'text-slate-300'}`}
            fill={i <= value ? '#f59e0b' : 'none'}
          />
        </button>
      ))}
    </div>
  </div>
)

export default function ReviewPage() {
  const params = useParams() as { slug?: string; ref?: string }
  const slug = params?.slug || ''
  const bookingRef = params?.ref || ''
  const supabase = createSupabaseBrowserClient()

  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [contact, setContact] = useState('')
  const [rating, setRating] = useState(5)
  const [timingRating, setTimingRating] = useState(5)
  const [serviceRating, setServiceRating] = useState(5)
  const [cleanlinessRating, setCleanlinessRating] = useState(5)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTenant = async () => {
      const { data } = await (supabase
        .from('tenants') as any)
        .select('id, business_name, brand_colour')
        .eq('slug', slug)
        .single()
      setTenant((data as any) || null)
      setLoading(false)
    }
    if (slug) loadTenant()
  }, [slug])

  const brandColour = tenant?.brand_colour || '#0d6e6e'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/reviews/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          bookingRef,
          contact: contact.trim(),
          rating,
          timingRating,
          serviceRating,
          cleanlinessRating,
          comment: comment.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Unable to save review')
      setSaved(true)
    } catch (err: any) {
      setError(err?.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-center px-6">
        <div className="max-w-md">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
          <h1 className="mt-4 text-xl font-semibold text-slate-800">Review link not found</h1>
          <p className="mt-2 text-sm text-slate-500">Please ask reception for a new review link.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-3xl p-8 bg-white border border-slate-200 shadow-sm space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{tenant.business_name}</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Leave a review</h1>
            <p className="mt-2 text-sm text-slate-500">Tell us about your timing, service, and cleanliness experience.</p>
          </div>

          {saved ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Thanks for the feedback!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">Email or phone used for booking</label>
                <input
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  className="mt-2 w-full h-11 rounded-xl border border-slate-200 px-3 text-sm"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <RatingInput label="Overall rating" value={rating} onChange={setRating} />
              <div className="grid sm:grid-cols-3 gap-4">
                <RatingInput label="Timing" value={timingRating} onChange={setTimingRating} />
                <RatingInput label="Service" value={serviceRating} onChange={setServiceRating} />
                <RatingInput label="Cleanliness" value={cleanlinessRating} onChange={setCleanlinessRating} />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">Comments (optional)</label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Anything we could have done better?"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5" /> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full h-12 rounded-xl font-semibold text-white"
                style={{ background: brandColour }}
              >
                {saving ? 'Submitting…' : 'Submit review'}
              </button>
            </form>
          )}
        </div>
        <div className="text-xs text-slate-400 text-center mt-6">Powered by ScudoSystems.com</div>
      </div>
    </div>
  )
}
