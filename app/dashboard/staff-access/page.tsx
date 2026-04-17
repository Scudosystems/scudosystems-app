'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { fetchLatestTenant } from '@/lib/tenant'
import { getRecommendedGuidelines, detectGuidelineVertical } from '@/lib/industry-defaults'
import { VERTICALS } from '@/lib/verticals'
import {
  KeyRound, Plus, Trash2, Edit2, X, Check, Copy,
  Eye, EyeOff, ShieldCheck, User, RefreshCw, ExternalLink,
  Lock, Unlock, Info, AlertTriangle, CircleCheck, CirclePause,
  CircleOff, CalendarCheck, CalendarX, Briefcase
} from 'lucide-react'

interface StaffMember {
  id: string
  name: string
  role: string | null
}

interface PortalAccess {
  id: string
  tenant_id: string
  staff_id: string | null
  display_name: string
  email: string
  access_code: string
  role: 'staff' | 'manager'
  permissions: {
    view_own_bookings: boolean
    view_own_schedule: boolean
    view_own_reviews: boolean
    view_team_bookings: boolean
    view_financials: boolean
  }
  is_active: boolean
  accepts_bookings: boolean
  availability_status: 'available' | 'busy' | 'off'
  availability_updated_at: string | null
  last_login_at: string | null
  created_at: string
  staff?: StaffMember | null
}

interface JobOffer {
  id: string
  staff_id: string
  role_title: string
  start_at: string
  end_at: string
  hourly_rate_pence: number
  notes: string | null
  status: string
  responded_at: string | null
  staff?: StaffMember | null
}

const PERM_LABELS: Record<string, { label: string; description: string; managerOnly?: boolean }> = {
  view_own_bookings:  { label: 'View own bookings',   description: 'See their own upcoming and past appointments' },
  view_own_schedule:  { label: 'View own schedule',   description: 'See their assigned shifts and availability' },
  view_own_reviews:   { label: 'View own reviews',    description: 'See customer feedback left for them specifically' },
  view_team_bookings: { label: 'View team bookings',  description: 'See bookings for the entire team', managerOnly: true },
  view_financials:    { label: 'View revenue stats',  description: 'See revenue and payment summaries', managerOnly: true },
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800) }}
      className="p-1 rounded transition-colors hover:bg-gray-100" title="Copy"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
    </button>
  )
}

const defaultPerms = {
  view_own_bookings: true,
  view_own_schedule: true,
  view_own_reviews: true,
  view_team_bookings: false,
  view_financials: false,
}

export default function StaffAccessPage() {
  const supabase = createSupabaseBrowserClient()
  const router = useRouter()

  const [tenantId, setTenantId] = useState<string | null>(null)
  const [tenantSlug, setTenantSlug] = useState<string>('')
  const [tenantVertical, setTenantVertical] = useState<string>('')
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [accounts, setAccounts] = useState<PortalAccess[]>([])
  const [offers, setOffers] = useState<JobOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showCode, setShowCode] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [offerSaving, setOfferSaving] = useState(false)
  const [offerError, setOfferError] = useState('')
  const [jobOffersEnabled, setJobOffersEnabled] = useState(false)
  const [jobOffersError, setJobOffersError] = useState('')
  const [guidelines, setGuidelines] = useState<string[]>([])
  const [guidelineInput, setGuidelineInput] = useState('')
  const [guidelineSaving, setGuidelineSaving] = useState(false)
  const [guidelineError, setGuidelineError] = useState('')
  const [guidelineSaved, setGuidelineSaved] = useState(false)

  const [form, setForm] = useState({
    display_name: '',
    email: '',
    access_code: generateCode(),
    staff_id: '',
    role: 'staff' as 'staff' | 'manager',
    permissions: { ...defaultPerms },
  })

  const [offerForm, setOfferForm] = useState({
    staff_id: '',
    role_title: '',
    start_at: '',
    end_at: '',
    hourly_rate: '',
    notes: '',
  })

  useEffect(() => {
    const load = async () => {
      let t: any = null
      try {
        t = await fetchLatestTenant(supabase, 'id, slug, vertical, staff_guidelines, job_offers_enabled')
      } catch (err: any) {
        setLoadError(err?.message || 'Could not load your business data. Please try refreshing the page.')
        setLoading(false)
        return
      }
      if (!t) {
        // No tenant yet — send them to complete onboarding
        router.push('/onboarding')
        return
      }
      setTenantId(t.id)
      setTenantSlug(t.slug || '')
      setTenantVertical(t.vertical || '')

      // ── Guidelines cross-vertical contamination guard ─────────────────────
      // If the stored guidelines exactly match a DIFFERENT vertical's recommended
      // set (e.g. dental guidelines showing in a car-wash dashboard), auto-reset
      // them to the correct vertical and silently persist the fix to the DB.
      const storedGuidelines = Array.isArray(t.staff_guidelines) ? t.staff_guidelines : []
      const detectedVertical = detectGuidelineVertical(storedGuidelines)
      const correctGuidelines =
        detectedVertical && detectedVertical !== t.vertical
          ? getRecommendedGuidelines(t.vertical)  // contaminated — use correct vertical
          : storedGuidelines                        // custom or correct vertical — keep as-is

      setGuidelines(correctGuidelines)

      // Silently persist the fix so it doesn't happen on next load
      if (detectedVertical && detectedVertical !== t.vertical) {
        ;(supabase.from('tenants') as any).update({ staff_guidelines: correctGuidelines }).eq('id', t.id)
      }
      // ─────────────────────────────────────────────────────────────────────

      setJobOffersEnabled(!!t.job_offers_enabled)

      const [{ data: stf }, { data: acc }] = await Promise.all([
        (supabase.from('staff') as any).select('id, name, role').eq('tenant_id', t.id).eq('is_active', true),
        (supabase.from('staff_portal_access') as any)
          .select('*, staff(id, name, role)')
          .eq('tenant_id', t.id)
          .order('created_at', { ascending: false }),
      ])
      const offRes = await fetch('/api/job-offers')
      const offData = offRes.ok ? await offRes.json() : { offers: [] }
      setStaff((stf as StaffMember[]) || [])
      setAccounts((acc as PortalAccess[]) || [])
      setOffers((offData.offers as JobOffer[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  const reload = async () => {
    if (!tenantId) return
    const { data: acc } = await (supabase.from('staff_portal_access') as any)
      .select('*, staff(id, name, role)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    setAccounts((acc as PortalAccess[]) || [])
    const offRes = await fetch('/api/job-offers')
    const offData = offRes.ok ? await offRes.json() : { offers: [] }
    setOffers((offData.offers as JobOffer[]) || [])
  }

  const openAdd = () => {
    setForm({ display_name: '', email: '', access_code: generateCode(), staff_id: '', role: 'staff', permissions: { ...defaultPerms } })
    setEditingId(null)
    setError('')
    setShowModal(true)
  }

  const openEdit = (a: PortalAccess) => {
    setForm({
      display_name: a.display_name,
      email: a.email,
      access_code: a.access_code,
      staff_id: a.staff_id || '',
      role: a.role,
      permissions: { ...defaultPerms, ...a.permissions },
    })
    setEditingId(a.id)
    setError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.display_name.trim() || !form.email.trim()) { setError('Name and email are required'); return }
    if (!form.access_code.trim()) { setError('Access code is required'); return }
    if (form.role === 'staff' && !form.staff_id) { setError('Select a staff member to link this account.'); return }
    if (!tenantId) { setError('Tenant not loaded'); return }
    setError('')
    setSaving(true)

    const payload = {
      tenant_id: tenantId,
      staff_id: form.staff_id || null,
      display_name: form.display_name.trim(),
      email: form.email.trim().toLowerCase(),
      access_code: form.access_code.trim().toUpperCase(),
      role: form.role,
      permissions: form.permissions,
    }

    try {
      if (editingId) {
        const { error: e } = await (supabase.from('staff_portal_access') as any).update(payload).eq('id', editingId)
        if (e) throw new Error(e.message)
      } else {
        const { error: e } = await (supabase.from('staff_portal_access') as any).insert(payload)
        if (e) throw new Error(e.message)
      }
      setShowModal(false)
      await reload()
    } catch (e: any) {
      setError(e.message?.includes('unique') ? 'An account with this email already exists.' : (e.message || 'Failed to save'))
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await (supabase.from('staff_portal_access') as any).delete().eq('id', deleteId)
    setDeleteId(null)
    await reload()
  }

  const openOffer = () => {
    const staffLabel = tenantVertical && VERTICALS[tenantVertical as keyof typeof VERTICALS]
      ? VERTICALS[tenantVertical as keyof typeof VERTICALS].staffLabel
      : 'Staff'
    setOfferForm({ staff_id: '', role_title: `${staffLabel} shift`, start_at: '', end_at: '', hourly_rate: '', notes: '' })
    setOfferError('')
    setShowOfferModal(true)
  }

  const saveGuidelines = async (next: string[], previous: string[] = guidelines) => {
    if (!tenantId) return
    setGuidelineError('')
    setGuidelineSaved(false)
    setGuidelines(next)
    setGuidelineInput('')
    setGuidelineSaving(true)
    const { error: e } = await (supabase.from('tenants') as any).update({ staff_guidelines: next }).eq('id', tenantId)
    if (e) {
      setGuidelines(previous)
      setGuidelineError(e.message || 'Failed to save guidelines')
    } else {
      setGuidelineSaved(true)
      setTimeout(() => setGuidelineSaved(false), 2000)
    }
    setGuidelineSaving(false)
  }

  const RECOMMENDED_GUIDELINES = getRecommendedGuidelines(tenantVertical)
  const verticalLabel = tenantVertical && VERTICALS[tenantVertical as keyof typeof VERTICALS]
    ? VERTICALS[tenantVertical as keyof typeof VERTICALS].label
    : 'Your industry'
  const guidelinePlaceholder = RECOMMENDED_GUIDELINES[0]
    ? `Add a new guideline (e.g., ${RECOMMENDED_GUIDELINES[0].replace(/\.$/, '')})`
    : 'Add a new guideline'

  const saveOffer = async () => {
    if (!jobOffersEnabled) {
      setOfferError('Enable Job Offers to send shifts.')
      return
    }
    if (!tenantId) return
    if (!offerForm.staff_id || !offerForm.start_at || !offerForm.end_at) {
      setOfferError('Staff member, start time, and end time are required.')
      return
    }
    setOfferSaving(true)
    setOfferError('')
    try {
      const hourly = Number(offerForm.hourly_rate || 0)
      const res = await fetch('/api/job-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: offerForm.staff_id,
          role_title: offerForm.role_title || 'Shift offer',
          start_at: offerForm.start_at,
          end_at: offerForm.end_at,
          hourly_rate_pence: Math.round(hourly * 100),
          notes: offerForm.notes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create offer')
      setShowOfferModal(false)
      await reload()
    } catch (e: any) {
      setOfferError(e.message || 'Failed to create offer')
    }
    setOfferSaving(false)
  }

  const withdrawOffer = async (id: string) => {
    await fetch('/api/job-offers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'withdrawn' }),
    })
    await reload()
  }

  const deleteOffer = async (id: string) => {
    if (!tenantId) return
    setOfferError('')
    const confirmed = window.confirm('Delete this job offer? This cannot be undone.')
    if (!confirmed) return
    const res = await fetch(`/api/job-offers?id=${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setOfferError(data.error || 'Failed to delete offer')
      return
    }
    await reload()
  }

  const updateJobOffersEnabled = async (next: boolean) => {
    if (!tenantId) return
    setJobOffersError('')
    const { error: e } = await (supabase.from('tenants') as any).update({ job_offers_enabled: next }).eq('id', tenantId)
    if (e) {
      setJobOffersError(e.message || 'Failed to update job offers setting')
      return
    }
    setJobOffersEnabled(next)
  }

  const toggleActive = async (a: PortalAccess) => {
    await (supabase.from('staff_portal_access') as any).update({ is_active: !a.is_active }).eq('id', a.id)
    await reload()
  }

  const toggleAcceptsBookings = async (a: PortalAccess) => {
    await (supabase.from('staff_portal_access') as any)
      .update({ accepts_bookings: !a.accepts_bookings })
      .eq('id', a.id)
    await reload()
  }

  const regenerateCode = () => setForm(f => ({ ...f, access_code: generateCode() }))

  const appOrigin = (() => {
    const env = process.env.NEXT_PUBLIC_APP_URL
    if (env && !env.includes('localhost') && !env.includes('vercel.app')) return env
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') return window.location.origin
    return 'https://www.scudosystems.com'
  })()
  const portalUrl = tenantSlug ? `${appOrigin}/staff-portal/${tenantSlug}` : ''

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Access</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Give your team members private access to their own schedule, bookings, and reviews — without exposing your full dashboard.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl flex-shrink-0"
          style={{ backgroundColor: '#0d9488' }}
        >
          <Plus className="w-4 h-4" />
          Create Access
        </button>
      </div>

      {/* Portal link banner */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl border border-teal/20 bg-teal/5">
        <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center flex-shrink-0">
          <ExternalLink className="w-5 h-5 text-teal" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">Staff portal URL</p>
          <p className="text-xs text-gray-500 truncate mt-0.5 font-mono">{portalUrl}</p>
        </div>
        <div className="flex items-center gap-2">
          <CopyBtn text={portalUrl} />
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-teal hover:text-teal/80 flex items-center gap-1"
          >
            Preview <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Info card */}
      <div className="flex gap-3 p-4 rounded-xl border border-blue-100 bg-blue-50">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-blue-700 leading-relaxed">
          <strong>How it works:</strong> Create an access account for each team member. Share the staff portal URL along with their email and 6-character access code. They sign in privately and only see their own schedule, bookings and reviews — never billing, other staff data or business settings.
        </div>
      </div>

      {/* Guidelines */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Customer experience guidelines</p>
              <p className="text-xs text-gray-400">Visible in the staff portal for every worker. Recommended for {verticalLabel}.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => saveGuidelines(RECOMMENDED_GUIDELINES, guidelines)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
              disabled={guidelineSaving}
            >
              Use recommended
            </button>
            <button
              onClick={() => saveGuidelines([], guidelines)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
              disabled={guidelineSaving}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            value={guidelineInput}
            onChange={e => setGuidelineInput(e.target.value)}
            placeholder={guidelinePlaceholder}
            className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm"
          />
          <button
            onClick={() => {
              const next = guidelineInput.trim()
              if (!next) return
              saveGuidelines([...guidelines, next], guidelines)
            }}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: '#0d9488' }}
            disabled={guidelineSaving}
          >
            Add guideline
          </button>
        </div>

        {guidelineSaved && (
          <div className="mt-3 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
            Guidelines saved.
          </div>
        )}
        {guidelineError && (
          <div className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
            {guidelineError}
          </div>
        )}

        {guidelines.length === 0 ? (
          <p className="mt-4 text-xs text-slate-400">No guidelines yet.</p>
        ) : (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {guidelines.map((g, i) => (
              <div key={`${g}-${i}`} className="flex items-start justify-between gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <span>{g}</span>
                <button
                  onClick={() => saveGuidelines(guidelines.filter((_, idx) => idx !== i))}
                  className="text-slate-400 hover:text-slate-600"
                  title="Remove guideline"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Empty state */}
      {accounts.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-14 h-14 bg-teal/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-7 h-7 text-teal" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No staff accounts yet</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Create portal access for your team. They get a private view of their schedule, bookings and customer feedback — nothing more.
          </p>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl"
            style={{ backgroundColor: '#0d9488' }}
          >
            <Plus className="w-4 h-4" />
            Create First Account
          </button>
        </div>
      )}

      {/* Accounts list — colorful cards */}
      {accounts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account, idx) => {
            const CARD_PALETTES = [
              { grad: 'from-teal-500 to-teal-700',    bg: '#0d9488', light: '#ccfbf1', text: '#0f766e' },
              { grad: 'from-violet-500 to-violet-700', bg: '#7c3aed', light: '#ede9fe', text: '#5b21b6' },
              { grad: 'from-rose-500 to-rose-700',     bg: '#e11d48', light: '#ffe4e6', text: '#be123c' },
              { grad: 'from-amber-500 to-orange-600',  bg: '#d97706', light: '#fef3c7', text: '#92400e' },
              { grad: 'from-sky-500 to-sky-700',       bg: '#0284c7', light: '#e0f2fe', text: '#0369a1' },
              { grad: 'from-emerald-500 to-green-700', bg: '#059669', light: '#d1fae5', text: '#065f46' },
            ]
            const palette = CARD_PALETTES[idx % CARD_PALETTES.length]
            const avail = account.availability_status || 'available'
            const availConfig = {
              available: { label: 'Available', color: '#10b981', bg: '#d1fae5', icon: CircleCheck },
              busy:      { label: 'Busy',      color: '#f59e0b', bg: '#fef3c7', icon: CirclePause },
              off:       { label: 'Off',       color: '#94a3b8', bg: '#f1f5f9', icon: CircleOff },
            }[avail] || { label: 'Available', color: '#10b981', bg: '#d1fae5', icon: CircleCheck }
            const AvailIcon = availConfig.icon

            return (
              <div key={account.id} className={`rounded-2xl overflow-hidden shadow-sm border ${account.is_active ? 'border-transparent' : 'border-red-200 opacity-70'}`}>
                {/* Colour header */}
                <div className={`bg-gradient-to-br ${palette.grad} p-4 flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm leading-tight">{account.display_name}</p>
                      <p className="text-[11px] text-white/70">{account.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/25 text-white">
                      {account.role === 'manager' ? 'Manager' : 'Staff'}
                    </span>
                    {!account.is_active && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">Suspended</span>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="bg-white p-4 space-y-3">
                  {/* Availability status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <AvailIcon className="w-3.5 h-3.5" style={{ color: availConfig.color }} />
                      <span className="text-xs font-semibold" style={{ color: availConfig.color }}>{availConfig.label}</span>
                    </div>
                    {account.availability_updated_at && (
                      <p className="text-[10px] text-slate-400">
                        Updated {new Date(account.availability_updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>

                  {/* Access code */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
                    <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className={`font-mono text-sm font-bold tracking-widest flex-1 ${showCode[account.id] ? 'text-gray-900' : 'text-slate-300 select-none'}`}>
                      {showCode[account.id] ? account.access_code : '••••••'}
                    </span>
                    <button
                      onClick={() => setShowCode(s => ({ ...s, [account.id]: !s[account.id] }))}
                      className="p-0.5 hover:bg-slate-200 rounded transition-colors"
                    >
                      {showCode[account.id] ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                    <CopyBtn text={account.access_code} />
                  </div>

                  {/* Linked staff member */}
                  {account.staff ? (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: palette.light }}>
                        <User className="w-2.5 h-2.5" style={{ color: palette.text }} />
                      </span>
                      Linked to <span className="font-semibold text-slate-700">{account.staff.name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1.5 rounded-lg">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      Not linked to a staff member — job offers won't show
                    </div>
                  )}

                  {/* Toggles row */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    {/* Accepts bookings toggle */}
                    <button
                      onClick={() => toggleAcceptsBookings(account)}
                      className="flex items-center gap-1.5 text-xs font-semibold"
                    >
                      {account.accepts_bookings !== false ? (
                        <><CalendarCheck className="w-3.5 h-3.5 text-emerald-500" /><span className="text-emerald-600">Taking bookings</span></>
                      ) : (
                        <><CalendarX className="w-3.5 h-3.5 text-slate-400" /><span className="text-slate-500">Not taking bookings</span></>
                      )}
                    </button>
                    {account.last_login_at ? (
                      <p className="text-[10px] text-slate-400">
                        Login: {new Date(account.last_login_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    ) : (
                      <p className="text-[10px] text-amber-500 font-medium">Never logged in</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      onClick={() => toggleActive(account)}
                      className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600 flex-1 justify-center"
                    >
                      {account.is_active ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      {account.is_active ? 'Suspend' : 'Restore'}
                    </button>
                    <button
                      onClick={() => openEdit(account)}
                      className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600 flex-1 justify-center"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => setDeleteId(account.id)}
                      className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Job offers */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pt-6 border-t border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-violet-500" />
            <h3 className="text-lg font-bold text-gray-900">Job offers / Shift posting</h3>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Send upcoming shifts to staff — they accept or decline from their portal.</p>
          <p className="text-xs text-amber-600 mt-1 font-medium">
            ⚠ Staff portal accounts must be linked to a staff member to receive offers.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-gray-500">{jobOffersEnabled ? 'Enabled' : 'Disabled'}</span>
            <button
              onClick={() => updateJobOffersEnabled(!jobOffersEnabled)}
              className={`w-10 h-5 rounded-full transition-all relative ${jobOffersEnabled ? 'bg-teal' : 'bg-border'}`}
              title="Toggle job offers"
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${jobOffersEnabled ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
          <button
            onClick={jobOffersEnabled ? openOffer : () => updateJobOffersEnabled(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: '#0d9488' }}
          >
            <Plus className="w-4 h-4" /> New shift offer
          </button>
        </div>
      </div>
      {jobOffersError && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
          {jobOffersError}
        </div>
      )}

      {!jobOffersEnabled ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400">
          Job offers are disabled. Toggle them on to send shifts to staff.
        </div>
      ) : offers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400">
          No job offers yet.
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map(offer => (
            <div key={offer.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{offer.role_title}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {offer.staff?.name || 'Staff'} · {new Date(offer.start_at).toLocaleString()} → {new Date(offer.end_at).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Rate: £{(offer.hourly_rate_pence / 100).toFixed(2)}/hr</p>
                {offer.notes && <p className="text-xs text-gray-400 mt-1">{offer.notes}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  offer.status === 'accepted' ? 'bg-emerald-50 text-emerald-600' :
                  offer.status === 'declined' ? 'bg-red-50 text-red-600' :
                  offer.status === 'withdrawn' ? 'bg-slate-100 text-slate-500' :
                  'bg-amber-50 text-amber-600'
                }`}>
                  {offer.status}
                </span>
                {offer.status === 'pending' && (
                  <button
                    onClick={() => withdrawOffer(offer.id)}
                    className="text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"
                  >
                    Withdraw
                  </button>
                )}
                <button
                  onClick={() => deleteOffer(offer.id)}
                  className="text-xs font-semibold px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                  title="Delete job offer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Offer modal */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(15,23,42,0.55)' }}>
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-gray-900">Create job offer</h4>
              <button onClick={() => setShowOfferModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">Staff member</label>
                <select
                  value={offerForm.staff_id}
                  onChange={e => setOfferForm(f => ({ ...f, staff_id: e.target.value }))}
                  className="mt-2 w-full h-10 px-3 rounded-xl border border-slate-200 text-sm"
                >
                  <option value="">Select staff…</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">Role title</label>
                <input
                  value={offerForm.role_title}
                  onChange={e => setOfferForm(f => ({ ...f, role_title: e.target.value }))}
                  className="mt-2 w-full h-10 px-3 rounded-xl border border-slate-200 text-sm"
                  placeholder={tenantVertical && VERTICALS[tenantVertical as keyof typeof VERTICALS] ? `${VERTICALS[tenantVertical as keyof typeof VERTICALS].staffLabel} shift` : 'e.g. Evening shift'}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">Start</label>
                  <input
                    type="datetime-local"
                    value={offerForm.start_at}
                    onChange={e => setOfferForm(f => ({ ...f, start_at: e.target.value }))}
                    className="mt-2 w-full h-10 px-3 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">End</label>
                  <input
                    type="datetime-local"
                    value={offerForm.end_at}
                    onChange={e => setOfferForm(f => ({ ...f, end_at: e.target.value }))}
                    className="mt-2 w-full h-10 px-3 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">Hourly rate (£)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={offerForm.hourly_rate}
                  onChange={e => setOfferForm(f => ({ ...f, hourly_rate: e.target.value }))}
                  className="mt-2 w-full h-10 px-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">Notes (optional)</label>
                <textarea
                  value={offerForm.notes}
                  onChange={e => setOfferForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="mt-2 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm resize-none"
                />
              </div>
              {offerError && <div className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{offerError}</div>}
              <button
                onClick={saveOffer}
                disabled={offerSaving}
                className="w-full h-11 rounded-xl text-white font-semibold"
                style={{ backgroundColor: '#0d9488' }}
              >
                {offerSaving ? 'Sending…' : 'Send offer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add/Edit Modal ────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="font-bold text-gray-900 text-lg">
                {editingId ? 'Edit Access Account' : 'Create Access Account'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Display Name *</label>
                <input
                  value={form.display_name}
                  onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                  placeholder="e.g. Dr Sarah Johnson"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 text-gray-900"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="sarah@yourpractice.com"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 text-gray-900"
                />
              </div>

              {/* Access Code */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Access Code *</label>
                <div className="flex gap-2">
                  <input
                    value={form.access_code}
                    onChange={e => setForm(f => ({ ...f, access_code: e.target.value.toUpperCase().slice(0, 6) }))}
                    className="flex-1 h-11 px-4 rounded-xl border border-slate-200 text-sm font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-teal/30 text-gray-900"
                    maxLength={6}
                  />
                  <button
                    type="button"
                    onClick={regenerateCode}
                    className="h-11 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                    title="Generate new code"
                  >
                    <RefreshCw className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Share this 6-character code with the staff member. They need it to log in.
                </p>
              </div>

              {/* Link to staff member */}
              {staff.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Link to Staff Profile</label>
                  <select
                    value={form.staff_id}
                    onChange={e => {
                      const s = staff.find(s => s.id === e.target.value)
                      setForm(f => ({
                        ...f,
                        staff_id: e.target.value,
                        display_name: f.display_name || (s?.name || ''),
                      }))
                    }}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 text-gray-900"
                  >
                    <option value="">Not linked to a staff profile</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.name}{s.role ? ` — ${s.role}` : ''}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    Linking allows the portal to show only bookings assigned to this person.
                  </p>
                </div>
              )}

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['staff', 'manager'] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setForm(f => ({
                          ...f,
                          role: r,
                          permissions: r === 'manager'
                            ? { ...defaultPerms, view_team_bookings: true, view_financials: false }
                            : { ...defaultPerms, view_team_bookings: false, view_financials: false },
                        }))
                      }}
                      className="py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
                      style={{
                        borderColor: form.role === r ? '#0d9488' : '#e2e8f0',
                        color: form.role === r ? '#0d9488' : '#6b7280',
                        backgroundColor: form.role === r ? '#f0fdfa' : '#ffffff',
                      }}
                    >
                      {r === 'manager' ? '👔 Manager' : '👤 Staff'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Permissions</label>
                <div className="space-y-2">
                  {Object.entries(PERM_LABELS).map(([key, { label, description, managerOnly }]) => (
                    <label key={key} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      managerOnly && form.role !== 'manager' ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50'
                    } ${form.permissions[key as keyof typeof form.permissions] ? 'border-teal/30 bg-teal/5' : 'border-slate-200'}`}>
                      <input
                        type="checkbox"
                        checked={form.permissions[key as keyof typeof form.permissions]}
                        disabled={managerOnly && form.role !== 'manager'}
                        onChange={e => setForm(f => ({
                          ...f,
                          permissions: { ...f.permissions, [key]: e.target.checked }
                        }))}
                        className="mt-0.5 accent-teal"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                          {label}
                          {managerOnly && <span className="text-[10px] bg-purple-100 text-purple-600 font-bold px-1.5 py-0.5 rounded">Manager</span>}
                        </p>
                        <p className="text-xs text-gray-400">{description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#0d9488' }}
              >
                {saving ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> Saving…</>
                ) : (
                  <><Check className="w-4 h-4" /> {editingId ? 'Save Changes' : 'Create Account'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirm Modal ────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-1">Remove access?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              This staff member will no longer be able to log into the portal. Their data is not deleted.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-gray-600 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-bold text-white">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
