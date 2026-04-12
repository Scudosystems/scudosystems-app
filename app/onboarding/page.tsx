'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { VERTICAL_LIST, VERTICALS } from '@/lib/verticals'
import { generateSlug } from '@/lib/utils'
import { fetchLatestTenant } from '@/lib/tenant'
import { ChevronRight, ChevronLeft, Check, Upload, Plus, Trash2, Eye, Sparkles } from 'lucide-react'
import type { VerticalId } from '@/lib/verticals'
import type { OpeningHours, ServiceInput, TenantPreferences } from '@/types'
import ReactConfetti from 'react-confetti'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const STEPS = ['Profile', 'Hours', 'Services', 'Branding', 'Preferences']
const BRAND_COLOURS = ['#0d6e6e', '#c4893a', '#6d28d9', '#dc2626', '#059669', '#0369a1', '#b45309']
const ADVANCE_OPTIONS = [
  { value: 0, label: 'No minimum' },
  { value: 1, label: '1 hour notice' },
  { value: 2, label: '2 hours notice' },
  { value: 24, label: '24 hours notice' },
  { value: 48, label: '48 hours notice' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabaseClient = useMemo(() => createSupabaseBrowserClient(), [])

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [complete, setComplete] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [authMissing, setAuthMissing] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importUploading, setImportUploading] = useState(false)
  const [importStatus, setImportStatus] = useState<string | null>(null)

  // Step 1 — Profile
  const [businessName, setBusinessName] = useState('')
  const [vertical, setVertical] = useState<VerticalId | ''>('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [description, setDescription] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)

  // Step 2 — Hours
  const [hours, setHours] = useState<OpeningHours[]>(
    DAYS.map((_, i) => ({
      dayOfWeek: i,
      isOpen: i >= 1 && i <= 6,
      startTime: '09:00',
      endTime: '18:00',
      lunchBreak: false,
      lunchStart: '12:00',
      lunchEnd: '13:00',
    }))
  )
  const [allowSameDay, setAllowSameDay] = useState(true)
  const [minimumAdvanceHours, setMinimumAdvanceHours] = useState(0)

  // Step 3 — Services
  const [services, setServices] = useState<ServiceInput[]>([])

  const loadDefaultServices = useCallback(() => {
    if (!vertical) return
    const v = VERTICALS[vertical as VerticalId]
    setServices(v.defaultServices.map(s => ({ ...s })))
  }, [vertical])

  const suggestedServices = useMemo(() => {
    if (!vertical) return []
    const v = VERTICALS[vertical as VerticalId]
    const used = new Set(
      services
        .map(s => (s.name || '').trim().toLowerCase())
        .filter(Boolean)
    )
    return v.defaultServices.filter(s => !used.has(s.name.trim().toLowerCase()))
  }, [vertical, services])

  const addSuggestedService = useCallback((service: ServiceInput) => {
    setServices(prev => {
      const emptyIndex = prev.findIndex(s => !(s.name || '').trim())
      if (emptyIndex >= 0) {
        const next = [...prev]
        next[emptyIndex] = { ...next[emptyIndex], ...service }
        return next
      }
      return [...prev, { ...service }]
    })
  }, [])

  // Step 4 — Branding
  const [brandColour, setBrandColour] = useState('#0d6e6e')
  const [customHex, setCustomHex] = useState('')

  // Step 5 — Preferences
  const [prefs, setPrefs] = useState<TenantPreferences>({
    smsReminders: false,
    emailReminders: true,
    requireDeposit: false,
    autoConfirm: true,
    dailySummaryEmail: true,
    newBookingSms: false,
    cancellationPolicy: 'Cancellations must be made at least 24 hours in advance. Deposits are non-refundable for late cancellations.',
    allowSameDay: true,
    minimumAdvanceHours: 0,
  })

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = () => setLogoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const uploadImportFile = async () => {
    if (!importFile) return
    setImportUploading(true)
    setImportStatus(null)
    try {
      const { data: { user } } = await supabaseClient.auth.getUser()
      const safeName = importFile.name.replace(/\s+/g, '-')
      const path = `imports/${user?.id || 'unknown'}/${Date.now()}-${safeName}`
      const { error } = await supabaseClient.storage.from('imports').upload(path, importFile, { upsert: true })
      if (error) throw error
      setImportStatus('File uploaded. We will import your data shortly.')
      setImportFile(null)
    } catch (err: any) {
      setImportStatus(err?.message || 'Upload failed. Please try again.')
    } finally {
      setImportUploading(false)
    }
  }

  const updateService = (idx: number, field: keyof ServiceInput, value: string | number | boolean) => {
    setServices(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  const addService = () => {
    setServices(prev => [...prev, {
      name: '', description: '', price_pence: 0, duration_minutes: 60, deposit_pence: 0, requires_deposit: false
    }])
  }

  const removeService = (idx: number) => {
    setServices(prev => prev.filter((_, i) => i !== idx))
  }

  const handleNext = async () => {
    setSaveError(null)
    if (step === 3 && services.length === 0) loadDefaultServices()

    if (step < 5) {
      setStep(s => s + 1)
      return
    }

    // Final save
    if (!authChecked) {
      setSaveError('Checking your session — please try again in a moment.')
      return
    }
    if (authMissing) {
      setSaveError('You are not signed in. Please verify your email and sign in again.')
      return
    }
    setSaving(true)
    try {
      let logoUrl: string | null = null
      if (logoFile) {
        const ext = logoFile.name.split('.').pop() || 'png'
        const safeName = generateSlug(businessName || 'logo')
        const filePath = `logos/${safeName}-${Date.now()}.${ext}`
        const { error: uploadError } = await supabaseClient.storage.from('logos').upload(filePath, logoFile, { upsert: true })
        if (uploadError) throw uploadError
        const { data: publicData } = supabaseClient.storage.from('logos').getPublicUrl(filePath)
        logoUrl = publicData?.publicUrl || null
      }

      const payload = {
        businessName,
        vertical,
        slug: generateSlug(businessName),
        address,
        phone,
        website,
        description,
        brandColour,
        logoUrl,
        hours,
        services,
        preferences: { ...prefs, allowSameDay, minimumAdvanceHours },
      }

      const { data: { session } } = await supabaseClient.auth.getSession()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`
      }

      const res = await fetch('/api/onboarding/save', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (res.status === 401) {
        throw new Error('You are not signed in. Please verify your email and sign in again.')
      }
      if (!res.ok) throw new Error('Save failed')

      setComplete(true)
      setTimeout(() => router.push('/dashboard?welcome=1'), 3500)
    } catch (err) {
      console.error(err)
      setSaveError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    const checkAuth = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser()
      if (cancelled) return
      setAuthChecked(true)
      setAuthMissing(!user)
    }
    checkAuth()
    return () => {
      cancelled = true
    }
  }, [supabaseClient])

  // Prefill with existing tenant data if onboarding was started before
  useEffect(() => {
    let cancelled = false
    const loadExisting = async () => {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser()
        if (!user || cancelled) return
        const tenant = await fetchLatestTenant(supabaseClient, '*')
        if (!tenant || cancelled) return

        setBusinessName(tenant.business_name || '')
        setVertical((tenant.vertical as VerticalId) || '')
        setAddress(tenant.address || '')
        setPhone(tenant.phone || '')
        setWebsite(tenant.website || '')
        setDescription(tenant.description || '')
        setBrandColour(tenant.brand_colour || '#0d6e6e')
        if (tenant.logo_url) setLogoPreview(tenant.logo_url)

        setAllowSameDay(tenant.allow_same_day ?? true)
        setMinimumAdvanceHours(tenant.minimum_advance_hours ?? 0)
        setPrefs(prev => ({
          ...prev,
          smsReminders: tenant.sms_reminders_enabled ?? prev.smsReminders,
          emailReminders: tenant.email_reminders_enabled ?? prev.emailReminders,
          requireDeposit: tenant.require_deposit ?? prev.requireDeposit,
          autoConfirm: tenant.auto_confirm ?? prev.autoConfirm,
          dailySummaryEmail: tenant.daily_summary_email ?? prev.dailySummaryEmail,
          newBookingSms: tenant.new_booking_sms ?? prev.newBookingSms,
          cancellationPolicy: tenant.cancellation_policy || prev.cancellationPolicy,
        }))

        const [{ data: avail }, { data: svc }] = await Promise.all([
          (supabaseClient.from('availability') as any).select('*').eq('tenant_id', tenant.id).is('staff_id', null),
          (supabaseClient.from('services') as any).select('*').eq('tenant_id', tenant.id).order('sort_order'),
        ])

        if (avail && avail.length > 0) {
          const availabilityRows = avail as Array<{ day_of_week: number; start_time: string; end_time: string }>
          setHours(DAYS.map((_, i) => {
            const daySlots = availabilityRows.filter((a) => a.day_of_week === i)
            if (!daySlots.length) {
              return {
                dayOfWeek: i,
                isOpen: false,
                startTime: '09:00',
                endTime: '18:00',
                lunchBreak: false,
                lunchStart: '12:00',
                lunchEnd: '13:00',
              }
            }
            const start = daySlots.reduce((min, a) => (a.start_time < min ? a.start_time : min), daySlots[0].start_time)
            const end = daySlots.reduce((max, a) => (a.end_time > max ? a.end_time : max), daySlots[0].end_time)
            return {
              dayOfWeek: i,
              isOpen: true,
              startTime: start,
              endTime: end,
              lunchBreak: false,
              lunchStart: '12:00',
              lunchEnd: '13:00',
            }
          }))
        }

        if (svc && svc.length > 0) {
          const serviceRows = svc as Array<{ name: string; description: string | null; price_pence: number; duration_minutes: number; deposit_pence: number; requires_deposit: boolean }>
          setServices(serviceRows.map((s) => ({
            name: s.name,
            description: s.description || '',
            price_pence: s.price_pence,
            duration_minutes: s.duration_minutes,
            deposit_pence: s.deposit_pence,
            requires_deposit: s.requires_deposit,
          })))
        }
      } catch {
        // silent
      }
    }
    loadExisting()
    return () => { cancelled = true }
  }, [supabaseClient])

  if (complete) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <ReactConfetti recycle={false} numberOfPieces={300} colors={['#0d6e6e', '#c4893a', '#ffffff']} />
        <div className="text-center">
          <div className="w-20 h-20 bg-teal rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-white" strokeWidth={3} />
          </div>
          <h1 className="font-serif text-4xl font-bold text-dark mb-3">You're Live! 🎉</h1>
          <p className="text-dark/60 text-lg mb-2">Your booking page is ready. Redirecting to your dashboard…</p>
          <p className="text-sm text-dark/40">Share your booking link and start taking bookings right now.</p>
          <div className="mt-6 bg-white rounded-2xl border border-border p-4 text-left max-w-md mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-dark">Your 7-day free trial is live</p>
                <p className="text-xs text-dark/50">Monthly billing is managed from the Billing tab in your dashboard settings whenever you’re ready.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-7 h-7 bg-teal rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="font-serif text-lg font-bold text-dark">ScudoSystems Setup</span>
          </div>
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center gap-2 ${i + 1 <= step ? 'text-teal' : 'text-dark/30'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    i + 1 < step ? 'bg-teal border-teal text-white' :
                    i + 1 === step ? 'border-teal text-teal bg-white' :
                    'border-current text-current bg-white'
                  }`}>
                    {i + 1 < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-1 ${i + 1 < step ? 'bg-teal' : 'bg-border'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {saveError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {saveError}{' '}
            {authMissing && (
              <Link href="/sign-in" className="underline font-semibold">Sign in</Link>
            )}
          </div>
        )}
        {/* ─── Step 1: Profile ─────────────────────────────────── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-8 border border-border">
            <h2 className="font-serif text-2xl font-bold text-dark mb-1">Your Business Profile</h2>
            <p className="text-dark/50 text-sm mb-8">This appears on your booking page and in customer emails.</p>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-dark mb-2">Business Name *</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-border focus:outline-none focus:border-teal text-sm"
                  placeholder="e.g. Glow Beauty Studio"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-2">Industry *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {VERTICAL_LIST.map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVertical(v.id)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left text-sm transition-all ${
                        vertical === v.id ? 'border-teal bg-teal/5 text-dark' : 'border-border hover:border-teal/30'
                      }`}
                    >
                      <span className="text-lg">{v.icon}</span>
                      <span className="font-medium text-xs leading-tight">{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-2">Full UK Address</label>
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:border-teal text-sm resize-none"
                  placeholder="123 High Street, Birmingham, B1 1AA"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-border focus:outline-none focus:border-teal text-sm"
                    placeholder="07700 900000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">Website (optional)</label>
                  <input
                    type="url"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-border focus:outline-none focus:border-teal text-sm"
                    placeholder="https://yourbusiness.co.uk"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-2">Short Description <span className="text-dark/40 font-normal">(max 160 chars)</span></label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value.slice(0, 160))}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:border-teal text-sm resize-none"
                  placeholder="Award-winning beauty studio in the heart of Birmingham…"
                />
                <p className="text-xs text-dark/30 mt-1">{description.length}/160</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-2">Business Logo</label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-teal/40 hover:bg-teal/5 transition-all">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="h-24 w-auto object-contain rounded" />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-6 h-6 text-dark/30 mx-auto mb-2" />
                      <p className="text-sm text-dark/40">Click to upload your logo</p>
                      <p className="text-xs text-dark/30 mt-1">PNG, JPG or SVG · max 5MB</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ─── Step 2: Hours ──────────────────────────────────── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-8 border border-border">
            <h2 className="font-serif text-2xl font-bold text-dark mb-1">Opening Hours</h2>
            <p className="text-dark/50 text-sm mb-8">Set when customers can book appointments.</p>
            <div className="space-y-3 mb-8">
              {hours.map((h, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-28 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setHours(prev => prev.map((hh, ii) => ii === i ? { ...hh, isOpen: !hh.isOpen } : hh))}
                      className={`w-10 h-5 rounded-full transition-all relative ${h.isOpen ? 'bg-teal' : 'bg-border'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${h.isOpen ? 'left-5' : 'left-0.5'}`} />
                    </button>
                    <span className="text-sm font-medium text-dark w-12">{DAYS[i].slice(0, 3)}</span>
                  </div>
                  {h.isOpen ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input type="time" value={h.startTime} onChange={e => setHours(prev => prev.map((hh, ii) => ii === i ? { ...hh, startTime: e.target.value } : hh))}
                        className="border border-border rounded-lg px-2 py-1.5 text-sm" />
                      <span className="text-dark/40 text-sm">to</span>
                      <input type="time" value={h.endTime} onChange={e => setHours(prev => prev.map((hh, ii) => ii === i ? { ...hh, endTime: e.target.value } : hh))}
                        className="border border-border rounded-lg px-2 py-1.5 text-sm" />
                    </div>
                  ) : (
                    <span className="text-sm text-dark/30 italic">Closed</span>
                  )}
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-dark">Allow same-day bookings</p>
                  <p className="text-xs text-dark/40">Customers can book for today</p>
                </div>
                <button type="button" onClick={() => setAllowSameDay(v => !v)}
                  className={`w-10 h-5 rounded-full transition-all relative ${allowSameDay ? 'bg-teal' : 'bg-border'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${allowSameDay ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-2">Minimum advance notice</label>
                <select value={minimumAdvanceHours} onChange={e => setMinimumAdvanceHours(Number(e.target.value))}
                  className="border border-border rounded-xl px-4 py-2.5 text-sm w-full max-w-xs">
                  {ADVANCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ─── Step 3: Services ───────────────────────────────── */}
        {step === 3 && (
          <div className="bg-white rounded-2xl p-8 border border-border">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-serif text-2xl font-bold text-dark">Services & Pricing</h2>
              {services.length === 0 && vertical && (
                <button type="button" onClick={loadDefaultServices}
                  className="text-teal text-sm font-medium hover:underline">Load defaults</button>
              )}
            </div>
            <p className="text-dark/50 text-sm mb-6">Add the services you offer, with pricing and duration.</p>
            {vertical && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-dark/60">Suggested services for {VERTICALS[vertical as VerticalId].label}</p>
                  <span className="text-xs text-dark/40">Click to add</span>
                </div>
                {suggestedServices.length === 0 ? (
                  <div className="text-xs text-dark/40 border border-dashed border-border rounded-lg px-3 py-2">
                    All suggestions added. You can still add custom services below.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {suggestedServices.map((s, idx) => (
                      <button
                        key={`${s.name}-${idx}`}
                        type="button"
                        onClick={() => addSuggestedService(s)}
                        className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:border-teal/40 hover:bg-teal/5 transition-colors text-left"
                      >
                        <div className="text-sm font-semibold text-dark">{s.name}</div>
                        <div className="text-xs text-dark/50">{s.duration_minutes} min · £{(s.price_pence / 100).toFixed(2)}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="space-y-4">
              {services.map((s, i) => (
                <div key={i} className="border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <input type="text" value={s.name} onChange={e => updateService(i, 'name', e.target.value)}
                      placeholder="Service name"
                      className="flex-1 text-sm font-semibold text-dark border border-slate-300 rounded-lg px-3 py-2 bg-white shadow-sm placeholder:text-slate-400 focus:outline-none focus:border-teal" />
                    <button type="button" onClick={() => removeService(i)} className="p-1 text-dark/30 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input type="text" value={s.description} onChange={e => updateService(i, 'description', e.target.value)}
                    placeholder="Short description"
                    className="w-full text-sm text-dark border border-slate-300 rounded-lg px-3 py-2 bg-white shadow-sm placeholder:text-slate-400 focus:outline-none focus:border-teal" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs text-dark/40 block mb-1">Price (£)</label>
                      <input type="number" value={s.price_pence / 100} onChange={e => updateService(i, 'price_pence', Math.round(parseFloat(e.target.value || '0') * 100))}
                        className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white shadow-sm" min="0" step="0.01" />
                    </div>
                    <div>
                      <label className="text-xs text-dark/40 block mb-1">Duration (min)</label>
                      <input type="number" value={s.duration_minutes} onChange={e => updateService(i, 'duration_minutes', parseInt(e.target.value || '30'))}
                        className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white shadow-sm" min="5" step="5" />
                    </div>
                    <div>
                      <label className="text-xs text-dark/40 block mb-1">Deposit (£)</label>
                      <input type="number" value={s.deposit_pence / 100} onChange={e => updateService(i, 'deposit_pence', Math.round(parseFloat(e.target.value || '0') * 100))}
                        className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white shadow-sm" min="0" step="0.01" />
                    </div>
                    <div className="flex items-end pb-1.5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={s.requires_deposit} onChange={e => updateService(i, 'requires_deposit', e.target.checked)} className="rounded" />
                        <span className="text-xs text-dark/60">Require deposit</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addService}
              className="mt-4 flex items-center gap-2 text-teal text-sm font-medium hover:bg-teal/5 px-4 py-2 rounded-xl border border-dashed border-teal/40 w-full justify-center transition-colors">
              <Plus className="w-4 h-4" /> Add Service
            </button>
          </div>
        )}

        {/* ─── Step 4: Branding ───────────────────────────────── */}
        {step === 4 && (
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-8 border border-border">
              <h2 className="font-serif text-2xl font-bold text-dark mb-1">Brand Colour</h2>
              <p className="text-dark/50 text-sm mb-6">Applied to your booking page buttons and accents.</p>
              <div className="flex flex-wrap gap-3 mb-4">
                {BRAND_COLOURS.map(c => (
                  <button key={c} type="button" onClick={() => setBrandColour(c)}
                    className={`w-9 h-9 rounded-full border-2 transition-all ${brandColour === c ? 'border-dark scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input type="text" value={customHex} onChange={e => setCustomHex(e.target.value)}
                  onBlur={() => { if (/^#[0-9A-F]{6}$/i.test(customHex)) setBrandColour(customHex) }}
                  placeholder="#0d6e6e" maxLength={7}
                  className="flex-1 h-10 px-3 rounded-xl border border-border text-sm font-mono" />
                <div className="w-10 h-10 rounded-xl border border-border" style={{ backgroundColor: brandColour }} />
              </div>
              {logoPreview && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-dark mb-2">Your Logo</p>
                  <img src={logoPreview} alt="Logo" className="h-12 object-contain rounded" />
                </div>
              )}
            </div>

            {/* Live Preview */}
            <div className="bg-white rounded-2xl p-6 border border-border">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-4 h-4 text-dark/40" />
                <p className="text-sm font-medium text-dark/60">Booking page preview</p>
              </div>
              <div className="bg-[#f8f6f1] rounded-xl overflow-hidden border border-border">
                <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: brandColour + '20' }}>
                  {logoPreview
                    ? <img src={logoPreview} alt="Logo" className="h-7 object-contain" />
                    : <div className="w-7 h-7 rounded-full" style={{ backgroundColor: brandColour }} />
                  }
                  <span className="font-semibold text-sm text-dark">{businessName || 'Your Business'}</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="bg-white rounded-lg p-3 border border-border">
                    <p className="text-xs font-medium text-dark mb-0.5">{services[0]?.name || 'Example Service'}</p>
                    <p className="text-xs text-dark/40">{services[0]?.duration_minutes || 60} min · £{((services[0]?.price_pence || 5000) / 100).toFixed(2)}</p>
                  </div>
                  <button type="button" className="w-full py-2 rounded-lg text-white text-xs font-semibold transition-all"
                    style={{ backgroundColor: brandColour }}>
                    {vertical ? VERTICALS[vertical].bookingPageLabel : 'Book Now'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Step 5: Preferences ────────────────────────────── */}
        {step === 5 && (
          <div className="bg-white rounded-2xl p-8 border border-border">
            <h2 className="font-serif text-2xl font-bold text-dark mb-1">Preferences & Automation</h2>
            <p className="text-dark/50 text-sm mb-8">Configure how ScudoSystems runs your booking system.</p>
            <div className="space-y-5">
              {[
                { key: 'emailReminders', label: 'Email reminders to customers', desc: '48hrs before their appointment' },
                { key: 'smsReminders', label: 'SMS reminders to customers', desc: '24hrs before (Professional+ plan)' },
                { key: 'requireDeposit', label: 'Require deposit to confirm', desc: 'Customers must pay to secure their slot' },
                { key: 'autoConfirm', label: 'Auto-confirm bookings', desc: 'No manual approval needed' },
                { key: 'dailySummaryEmail', label: 'Daily revenue summary', desc: 'Sent to you each morning' },
                { key: 'newBookingSms', label: 'New booking SMS alert', desc: 'Text you when someone books' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-dark">{label}</p>
                    <p className="text-xs text-dark/40">{desc}</p>
                  </div>
                  <button type="button"
                    onClick={() => setPrefs(p => ({ ...p, [key]: !p[key as keyof TenantPreferences] }))}
                    className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${prefs[key as keyof TenantPreferences] ? 'bg-teal' : 'bg-border'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${prefs[key as keyof TenantPreferences] ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-dark mb-2">Cancellation Policy</label>
                <textarea value={prefs.cancellationPolicy}
                  onChange={e => setPrefs(p => ({ ...p, cancellationPolicy: e.target.value }))}
                  rows={3} className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:border-teal text-sm resize-none" />
              </div>
            </div>

            <div className="mt-8 border border-border rounded-2xl p-5 bg-[#f8f6f1]">
              <h3 className="font-semibold text-dark mb-1">Move your existing data (optional)</h3>
              <p className="text-xs text-dark/50 mb-4">
                Upload a file from your current system and we’ll import it for you.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  onChange={e => setImportFile(e.target.files?.[0] || null)}
                  className="text-sm"
                />
                <button
                  type="button"
                  onClick={uploadImportFile}
                  disabled={!importFile || importUploading}
                  className="btn-secondary text-sm py-2 px-4 disabled:opacity-50"
                >
                  {importUploading ? 'Uploading…' : 'Upload file'}
                </button>
                {importStatus && (
                  <span className="text-xs text-dark/50">{importStatus}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button type="button" onClick={() => setStep(s => s - 1)} disabled={step === 1}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-dark hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <button type="button" onClick={handleNext} disabled={saving || (step === 1 && (!businessName || !vertical))}
            className="flex items-center gap-2 btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? 'Saving…' : step === 5 ? 'Save & Go Live 🚀' : 'Continue'}
            {!saving && step < 5 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
