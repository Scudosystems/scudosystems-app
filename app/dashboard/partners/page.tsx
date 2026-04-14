'use client'

import { useState, useEffect, useCallback } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { fetchLatestTenant } from '@/lib/tenant'
import {
  Users, Link2, Copy, Check, Plus, TrendingUp, Shield,
  AlertTriangle, ChevronRight, Loader2, X, Edit2, Trash2,
  Eye, EyeOff, BarChart2, Clock, Banknote,
  Share2, CheckCircle2, XCircle, ToggleLeft, ToggleRight,
  ExternalLink, Search, Filter, Info, Tag, Mail
} from 'lucide-react'
import {
  generateAffiliateCode,
  buildAffiliateUrl,
  calculateCommission,
  formatCommissionRate,
  isEligibleForPayout,
  AFFILIATE_CONFIG,
} from '@/lib/affiliate'
import { getVerticalPricing } from '@/lib/pricing'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Affiliate {
  id: string
  name: string
  email: string
  phone?: string
  code: string
  commission_rate: number
  commission_type: 'percentage' | 'fixed'
  fixed_amount_pence: number
  status: 'active' | 'paused' | 'suspended' | 'pending'
  total_earned_pence: number
  total_pending_pence: number
  total_paid_pence: number
  clicks: number
  conversions: number
  notes?: string
  created_at: string
}

interface AffiliateCommission {
  id: string
  affiliate_id: string
  booking_id: string
  commission_pence: number
  booking_amount_pence: number
  commission_rate: number
  status: 'pending' | 'approved' | 'paid' | 'reversed' | 'flagged'
  hold_until: string | null
  fraud_score: number
  created_at: string
  affiliates?: { name: string; code: string }
  bookings?: { customer_name: string; booking_date: string; total_amount_pence: number }
}


// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  active:    { label: 'Active',    bg: '#f0fdf4', color: '#059669', border: '#bbf7d0' },
  paused:    { label: 'Paused',    bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  suspended: { label: 'Suspended', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  pending:   { label: 'Pending',   bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
}

const COMMISSION_STATUS = {
  pending:  { label: 'Pending',  color: '#d97706', bg: '#fffbeb' },
  approved: { label: 'Approved', color: '#059669', bg: '#f0fdf4' },
  paid:     { label: 'Paid',     color: '#6b7280', bg: '#f9fafb' },
  reversed: { label: 'Reversed', color: '#dc2626', bg: '#fef2f2' },
  flagged:  { label: 'Flagged',  color: '#dc2626', bg: '#fef2f2' },
}


// ─── Helpers ──────────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800) }}
      className="p-1.5 rounded-lg transition-all hover:bg-gray-100"
      title="Copy"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
    </button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PartnersPage() {
  const supabase = createSupabaseBrowserClient()

  const [tab, setTab]                 = useState<'overview' | 'partners' | 'payouts' | 'fraud'>('overview')
  const [affiliates, setAffiliates]   = useState<Affiliate[]>([])
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([])
  const [tenant, setTenant]           = useState<any>(null)
  const [loading, setLoading]         = useState(true)
  const [schemaMissing, setSchemaMissing] = useState(false)
  const [schemaMessage, setSchemaMessage] = useState('')
  const [search, setSearch]           = useState('')

  // Modals
  const [showAddAffiliate, setShowAddAffiliate]   = useState(false)
  const [editAffiliate, setEditAffiliate]         = useState<Affiliate | null>(null)

  // Forms
  const [form, setForm] = useState({
    name: '', email: '', phone: '', commission_rate: 15,
    commission_type: 'percentage' as 'percentage' | 'fixed',
    fixed_amount_pence: 0, notes: '', code: '',
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const APP_URL = (() => {
    const env = process.env.NEXT_PUBLIC_APP_URL
    if (env && !env.includes('localhost')) return env
    if (typeof window !== 'undefined') return window.location.origin
    return 'https://scudosystems.com'
  })()
  const bookingBase = tenant?.slug ? `${APP_URL}/book/${tenant.slug}` : ''
  const vertical = tenant?.vertical || ''
  const config = AFFILIATE_CONFIG[vertical]
  const pricing = vertical ? getVerticalPricing(vertical as any) : null
  const platformFeeLabel = pricing?.perPence ? formatCurrency(pricing.perPence) : null
  const showAffiliateFeeNote = !!platformFeeLabel

  // ── Load data ──────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch tenant FIRST so all subsequent queries are scoped to this tenant
      let t: any = null
      try {
        t = await fetchLatestTenant(supabase, '*')
      } catch {
        t = null
      }
      if (!t?.id) {
        setLoading(false)
        return
      }
      const [{ data: aff, error: affErr }, { data: com, error: comErr }] = await Promise.all([
        supabase.from('affiliates').select('*').eq('tenant_id', t.id).order('created_at', { ascending: false }),
        supabase.from('affiliate_commissions')
          .select('*, affiliates(name,code), bookings(customer_name,booking_date,total_amount_pence)')
          .eq('tenant_id', t.id)
          .order('created_at', { ascending: false }).limit(100),
      ])
      const schemaError = affErr || comErr
      if (schemaError) {
        const message = (schemaError as any).message || 'Affiliate tables missing.'
        setSchemaMissing(true)
        setSchemaMessage(message)
      } else {
        setSchemaMissing(false)
        setSchemaMessage('')
      }
      if (t) setTenant(t)
      const normalizedAffiliates = ((aff as any[]) || []).map(a => ({
        ...a,
        clicks: Number(a.clicks ?? a.total_clicks ?? 0),
        conversions: Number(a.conversions ?? a.total_bookings ?? 0),
        total_pending_pence: Number(a.total_pending_pence ?? 0),
        total_paid_pence: Number(a.total_paid_pence ?? 0),
        total_earned_pence: Number(a.total_earned_pence ?? 0),
      })) as Affiliate[]
      setAffiliates(normalizedAffiliates)
      setCommissions((com as AffiliateCommission[]) || [])
    } catch {
      // Tables may not exist yet — show empty state
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── Derived stats ──────────────────────────────────────────────────────────
  const activeAffiliates   = affiliates.filter(a => a.status === 'active')
  const totalPending       = commissions.filter(c => c.status === 'pending' || c.status === 'approved').reduce((s, c) => s + c.commission_pence, 0)
  const totalEarned        = affiliates.reduce((s, a) => s + a.total_earned_pence, 0)
  const totalClicks        = affiliates.reduce((s, a) => s + a.clicks, 0)
  const totalConversions   = affiliates.reduce((s, a) => s + a.conversions, 0)
  const avgConversionRate  = totalClicks > 0 ? Math.round((totalConversions / totalClicks) * 100) : 0
  const flaggedCommissions = commissions.filter(c => c.status === 'flagged' || c.fraud_score >= 40)
  const approvedReadyPay   = commissions.filter(c => c.status === 'approved' && isEligibleForPayout(c.hold_until ? new Date(c.hold_until) : null))

  // ── Add/Edit affiliate ────────────────────────────────────────────────────
  async function saveAffiliate() {
    if (!form.name || !form.email) { setFormError('Name and email are required'); return }
    if (!form.code) { setFormError('Tracking code is required — click Generate'); return }
    setFormError(''); setSaving(true)
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        code: form.code,
        commission_rate: Number(form.commission_rate) || 0,
        commission_type: form.commission_type,
        fixed_amount_pence: Number(form.fixed_amount_pence) || 0,
        notes: form.notes || null,
        status: editAffiliate ? editAffiliate.status : 'active',
      }
      const res = await fetch('/api/affiliates', {
        method: editAffiliate ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editAffiliate ? { id: editAffiliate.id, ...payload } : payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to save affiliate.')
      setShowAddAffiliate(false); setEditAffiliate(null)
      setForm({ name: '', email: '', phone: '', commission_rate: config?.defaultRate || 15, commission_type: 'percentage', fixed_amount_pence: 0, notes: '', code: '' })
      load()
    } catch (e: any) {
      const msg = e.message || 'Failed to save. Ensure the affiliate schema has been applied in Supabase.'
      setFormError(msg)
      if (msg.includes('relation') || msg.includes('does not exist')) {
        setSchemaMissing(true)
        setSchemaMessage(msg)
      }
    }
    setSaving(false)
  }

  async function toggleAffiliateStatus(id: string, current: string) {
    const next = current === 'active' ? 'paused' : 'active'
    await fetch(`/api/affiliates?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: next }),
    })
    load()
  }

  async function deleteAffiliate(id: string) {
    if (!confirm('Delete this affiliate? This cannot be undone.')) return
    await fetch(`/api/affiliates?id=${id}`, { method: 'DELETE' })
    load()
  }

  // ── Commission actions ────────────────────────────────────────────────────
  async function approveCommission(id: string) {
    await (supabase.from('affiliate_commissions') as any).update({ status: 'approved' }).eq('id', id)
    load()
  }

  async function reverseCommission(id: string) {
    await (supabase.from('affiliate_commissions') as any).update({ status: 'reversed' }).eq('id', id)
    load()
  }

  async function markPaid(id: string) {
    await (supabase.from('affiliate_commissions') as any).update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', id)
    // Update affiliate totals
    const c = commissions.find(c => c.id === id)
    if (c) {
      const aff = affiliates.find(a => a.id === c.affiliate_id)
      if (aff) {
        await (supabase.from('affiliates') as any).update({
          total_paid_pence: (aff.total_paid_pence || 0) + c.commission_pence,
          total_pending_pence: Math.max(0, (aff.total_pending_pence || 0) - c.commission_pence),
        }).eq('id', aff.id)
      }
    }
    load()
  }

  const filteredAffiliates = affiliates.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.email || '').toLowerCase().includes(search.toLowerCase()) ||
    a.code.toLowerCase().includes(search.toLowerCase())
  )

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'partners', label: `Partners (${affiliates.length})` },
    { id: 'payouts',  label: approvedReadyPay.length > 0 ? `Payouts (${approvedReadyPay.length})` : 'Payouts' },
    { id: 'fraud',    label: flaggedCommissions.length > 0 ? `Fraud Monitor 🚨` : 'Fraud Monitor' },
  ]

  return (
    <div className="space-y-6 max-w-7xl">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Partners & Affiliates</h1>
            {config && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: config.score >= 8 ? '#f0fdf4' : config.score >= 5 ? '#fffbeb' : '#fef2f2',
                         color: config.score >= 8 ? '#059669' : config.score >= 5 ? '#d97706' : '#dc2626',
                         border: `1px solid ${config.score >= 8 ? '#bbf7d0' : config.score >= 5 ? '#fde68a' : '#fecaca'}` }}>
                {config.score >= 8 ? '★ ' : ''}{config.label} for {vertical}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">
            {config
              ? `${config.reason}`
              : 'Grow bookings via a trusted network of promoters, influencers and affiliates.'}
          </p>
        </div>
        <button
          onClick={() => {
            setForm({ name: '', email: '', phone: '', commission_rate: config?.defaultRate || 15, commission_type: 'percentage', fixed_amount_pence: 0, notes: '', code: '' })
            setEditAffiliate(null); setShowAddAffiliate(true)
          }}
          className="flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl text-white transition-all hover:opacity-90 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #0d9488, #2563eb)', boxShadow: '0 4px 12px rgba(13,148,136,0.25)' }}>
          <Plus className="w-4 h-4" />
          Add {config?.partnerTitle || 'Partner'}
        </button>
      </div>

      {schemaMissing && (
        <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-200 bg-amber-50">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Affiliate tables not installed</p>
            <p className="text-xs text-amber-700 mt-1">
              Run `supabase-schema-affiliates.sql` in your Supabase SQL editor, then refresh this page.
            </p>
            {schemaMessage && <p className="text-[11px] text-amber-700/80 mt-1">{schemaMessage}</p>}
          </div>
        </div>
      )}

      {/* ── Fraud alert banner ── */}
      {flaggedCommissions.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-red-200 bg-red-50">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-700">{flaggedCommissions.length} suspicious commission{flaggedCommissions.length > 1 ? 's' : ''} need review</p>
            <p className="text-xs text-red-500 mt-0.5">Payouts are blocked for flagged commissions until manually approved.</p>
          </div>
          <button onClick={() => setTab('fraud')} className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1">
            Review <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Industry use case card ── */}
      {config && affiliates.length === 0 && (
        <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Share2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-sm mb-0.5">How your {config.partnerTitle}s earn</p>
              <p className="text-xs text-gray-500 mb-3">{config.useCase}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5 text-indigo-500" /> Default: {config.defaultRate}% commission</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-500" /> 7-day hold after completion</span>
                <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-emerald-500" /> Fraud detection built-in</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Users,     label: 'Active Partners',    value: activeAffiliates.length, sub: `${affiliates.length} total`,                              accent: '#8b5cf6' },
          { icon: Banknote,  label: 'Pending Commissions',value: formatCurrency(totalPending), sub: 'Awaiting payout',                                   accent: '#f59e0b' },
          { icon: TrendingUp,label: 'Total Paid Out',     value: formatCurrency(totalEarned), sub: 'All time to affiliates',                             accent: '#10b981' },
          { icon: BarChart2, label: 'Avg Conv. Rate',     value: `${avgConversionRate}%`, sub: `${totalConversions} bookings from ${totalClicks} clicks`, accent: '#3b82f6' },
        ].map(({ icon: Icon, label, value, sub, accent }) => (
          <div key={label} className="rounded-2xl p-5" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: accent + '12' }}>
              <Icon className="w-4 h-4" style={{ color: accent }} />
            </div>
            <p className="text-2xl font-black text-gray-900 tabular-nums">{loading ? '—' : value}</p>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="border-b border-gray-100">
        <div className="flex gap-1 -mb-px overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className="px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap"
              style={{ borderColor: tab === t.id ? '#0d9488' : 'transparent', color: tab === t.id ? '#0d9488' : '#6b7280' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
        </div>
      )}

      {!loading && (
        <>
          {/* ── OVERVIEW TAB ── */}
          {tab === 'overview' && (
            <div className="space-y-5">
              {affiliates.length === 0 ? (
                <div className="rounded-2xl p-12 text-center" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-7 h-7 text-indigo-400" />
                  </div>
                  <p className="font-bold text-gray-900 mb-1">No partners yet</p>
                  <p className="text-sm text-gray-400 mb-5 max-w-xs mx-auto">Add your first {config?.partnerTitle || 'affiliate'} and give them a tracking link. Every booking they drive earns them a commission automatically.</p>
                  <button onClick={() => setShowAddAffiliate(true)}
                    className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl text-white"
                    style={{ background: 'linear-gradient(135deg, #0d9488, #2563eb)' }}>
                    <Plus className="w-4 h-4" /> Add First {config?.partnerTitle || 'Partner'}
                  </button>
                </div>
              ) : (
                <>
                  {/* Top performers */}
                  <div className="rounded-2xl" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div className="px-6 py-4 border-b border-gray-100">
                      <p className="font-bold text-gray-900 text-sm">Top {config?.partnerTitle || 'Partner'}s</p>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {affiliates
                        .filter(a => a.status === 'active')
                        .sort((a, b) => b.total_earned_pence - a.total_earned_pence)
                        .slice(0, 8)
                        .map((a, i) => (
                          <div key={a.id} className="flex items-center gap-4 px-6 py-3.5">
                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-500 flex-shrink-0">{i + 1}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{a.name}</p>
                              <p className="text-xs text-gray-400">{a.conversions} bookings · {a.clicks} clicks</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-emerald-600">{formatCurrency(a.total_earned_pence)}</p>
                              <p className="text-xs text-gray-400">{formatCommissionRate(a.commission_rate, a.commission_type, a.fixed_amount_pence)}</p>
                            </div>
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATUS_CONFIG[a.status].color }} />
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Recent commissions */}
                  <div className="rounded-2xl" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div className="px-6 py-4 border-b border-gray-100">
                      <p className="font-bold text-gray-900 text-sm">Recent Commissions</p>
                    </div>
                    {commissions.length === 0 ? (
                      <p className="text-center text-sm text-gray-400 py-8">Commissions will appear here when affiliates drive bookings.</p>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {commissions.slice(0, 10).map(c => {
                          const cs = COMMISSION_STATUS[c.status] || COMMISSION_STATUS.pending
                          return (
                            <div key={c.id} className="flex items-center gap-3 px-6 py-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800">{c.affiliates?.name || 'Unknown'}</p>
                                <p className="text-xs text-gray-400">Booking {c.bookings?.booking_date} · {c.affiliates?.code}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">{formatCurrency(c.commission_pence)}</p>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: cs.bg, color: cs.color }}>{cs.label}</span>
                              </div>
                              {c.fraud_score >= 40 && (
                                <span title={`Fraud score: ${c.fraud_score}`}>
                                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── PARTNERS TAB ── */}
          {tab === 'partners' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder={`Search ${config?.partnerTitle || 'partner'}s...`}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                  />
                </div>
              </div>

              {filteredAffiliates.length === 0 ? (
                <div className="rounded-2xl p-10 text-center" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                  <Users className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">
                    {affiliates.length === 0 ? `Add your first ${config?.partnerTitle || 'partner'} to get started.` : 'No results match your search.'}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {['Name', 'Tracking Link', 'Clicks', 'Bookings', 'Conv.%', 'Pending', 'Total Earned', 'Status', ''].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredAffiliates.map(a => {
                          const link = buildAffiliateUrl(bookingBase, a.code)
                          const convRate = a.clicks > 0 ? Math.round((a.conversions / a.clicks) * 100) : 0
                          const sc = STATUS_CONFIG[a.status]
                          return (
                            <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3">
                                <p className="font-semibold text-gray-800">{a.name}</p>
                                <p className="text-xs text-gray-400">{a.email}</p>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5 max-w-[200px]">
                                  <code className="text-xs bg-gray-100 rounded px-1.5 py-0.5 font-mono truncate text-gray-600">{a.code}</code>
                                  <CopyButton text={link} />
                                  <a href={link} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-gray-100 transition-all">
                                    <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                                  </a>
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">{formatCommissionRate(a.commission_rate, a.commission_type, a.fixed_amount_pence)}</p>
                                {/* Partner's own portal link */}
                                <div className="flex items-center gap-1 mt-1.5">
                                  <span className="text-xs font-semibold text-purple-500">Portal:</span>
                                  <code className="text-xs bg-purple-50 text-purple-600 rounded px-1.5 py-0.5 font-mono">{a.code}</code>
                                  <CopyButton text={`${APP_URL}/partner-portal/${a.code}`} />
                                  <a href={`${APP_URL}/partner-portal/${a.code}`} target="_blank" rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg hover:bg-purple-50 transition-all" title="Open partner portal">
                                    <ExternalLink className="w-3 h-3 text-purple-300 hover:text-purple-500" />
                                  </a>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-700 font-medium">{Number(a.clicks || 0).toLocaleString()}</td>
                              <td className="px-4 py-3 text-gray-700 font-medium">{Number(a.conversions || 0)}</td>
                              <td className="px-4 py-3">
                                <span className="font-semibold" style={{ color: convRate >= 5 ? '#059669' : convRate >= 2 ? '#d97706' : '#6b7280' }}>{convRate}%</span>
                              </td>
                              <td className="px-4 py-3 font-semibold text-amber-600">{formatCurrency(a.total_pending_pence)}</td>
                              <td className="px-4 py-3 font-semibold text-emerald-600">{formatCurrency(a.total_earned_pence)}</td>
                              <td className="px-4 py-3">
                                <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{sc.label}</span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <button onClick={() => toggleAffiliateStatus(a.id, a.status)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-all" title={a.status === 'active' ? 'Pause' : 'Activate'}>
                                    {a.status === 'active' ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                                  </button>
                                  <button onClick={() => { setEditAffiliate(a); setForm({ name: a.name, email: a.email, phone: a.phone || '', commission_rate: a.commission_rate, commission_type: a.commission_type, fixed_amount_pence: a.fixed_amount_pence, notes: a.notes || '', code: a.code }); setShowAddAffiliate(true) }}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-all" title="Edit">
                                    <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                                  </button>
                                  <a
                                    href={`mailto:${a.email}?subject=Your ${tenant?.business_name || 'Partner'} Affiliate Portal&body=Hi ${a.name},%0A%0AHere's your affiliate portal link where you can track your clicks, bookings, and commissions:%0A%0A${APP_URL}/partner-portal/${a.code}%0A%0AYou'll need to enter your email address (${a.email}) to log in.%0A%0AThanks!`}
                                    className="p-1.5 rounded-lg hover:bg-purple-50 transition-all" title="Email portal link to partner">
                                    <Mail className="w-3.5 h-3.5 text-gray-300 hover:text-purple-400" />
                                  </a>
                                  <button onClick={() => deleteAffiliate(a.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-all" title="Delete">
                                    <Trash2 className="w-3.5 h-3.5 text-gray-300 hover:text-red-400" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Commission rate note */}
              {showAffiliateFeeNote && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-600">
                    Affiliate commissions are calculated from successful converted bookings. Approved commissions are held for 7 days after booking completion before becoming eligible for payout. All commissions are subject to fraud review.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── PAYOUTS TAB ── */}
          {tab === 'payouts' && (
            <div className="space-y-5">
              <p className="text-sm text-gray-500">Commissions approved and past the 7-day hold period are ready to pay. Mark as paid after transferring via bank, PayPal, or your preferred method.</p>

              {approvedReadyPay.length === 0 ? (
                <div className="rounded-2xl p-10 text-center" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                  <CheckCircle2 className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No payouts ready right now. Approved commissions will appear here after the 7-day hold period.</p>
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {['Partner', 'Customer Booking', 'Booking Value', 'Commission', 'Hold Until', ''].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {approvedReadyPay.map(c => (
                        <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-800">{c.affiliates?.name}</p>
                            <p className="text-xs text-gray-400 font-mono">{c.affiliates?.code}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{c.bookings?.customer_name || '—'} · {c.bookings?.booking_date}</td>
                          <td className="px-4 py-3 text-gray-700">{formatCurrency(c.booking_amount_pence)}</td>
                          <td className="px-4 py-3 font-bold text-emerald-600">{formatCurrency(c.commission_pence)}</td>
                          <td className="px-4 py-3 text-xs text-emerald-600 font-medium">Ready to pay</td>
                          <td className="px-4 py-3">
                            <button onClick={() => markPaid(c.id)}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90"
                              style={{ background: '#059669' }}>
                              Mark Paid
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Paid history */}
              {commissions.filter(c => c.status === 'paid').length > 0 && (
                <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                  <div className="px-5 py-3 border-b border-gray-100">
                    <p className="text-sm font-bold text-gray-700">Paid History</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {commissions.filter(c => c.status === 'paid').slice(0, 20).map(c => (
                      <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-700">{c.affiliates?.name}</p>
                          <p className="text-xs text-gray-400">{c.bookings?.booking_date}</p>
                        </div>
                        <p className="text-sm font-bold text-gray-500">{formatCurrency(c.commission_pence)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── FRAUD MONITOR TAB ── */}
          {tab === 'fraud' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="text-sm font-semibold text-slate-700 mb-1">How fraud protection works</p>
                <p className="text-xs text-slate-500">Every conversion is scored 0–100. Scores 40+ are flagged for review and payouts are blocked. Scores 60+ are auto-blocked. Signals include: IP velocity, self-referral detection, disposable emails, time-to-convert analysis, booking cancellation patterns.</p>
              </div>

              {flaggedCommissions.length === 0 ? (
                <div className="rounded-2xl p-10 text-center" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                  <Shield className="w-8 h-8 text-emerald-200 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-emerald-600">All clear — no suspicious activity detected</p>
                  <p className="text-xs text-gray-400 mt-1">Our fraud engine is monitoring every conversion in real-time.</p>
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <p className="text-sm font-bold text-red-700">{flaggedCommissions.length} flagged commission{flaggedCommissions.length > 1 ? 's' : ''}</p>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {['Partner', 'Booking', 'Amount', 'Fraud Score', 'Status', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {flaggedCommissions.map(c => {
                        const scoreColor = c.fraud_score >= 60 ? '#dc2626' : c.fraud_score >= 40 ? '#d97706' : '#f59e0b'
                        return (
                          <tr key={c.id} className="hover:bg-red-50/30 transition-colors">
                            <td className="px-4 py-3 font-semibold text-gray-800">{c.affiliates?.name}</td>
                            <td className="px-4 py-3 text-gray-600 text-xs">{c.bookings?.customer_name} · {c.bookings?.booking_date}</td>
                            <td className="px-4 py-3 font-semibold text-gray-700">{formatCurrency(c.commission_pence)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${c.fraud_score}%`, background: scoreColor }} />
                                </div>
                                <span className="text-xs font-bold" style={{ color: scoreColor }}>{c.fraud_score}/100</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-semibold px-2 py-1 rounded-full"
                                style={{ background: COMMISSION_STATUS[c.status]?.bg, color: COMMISSION_STATUS[c.status]?.color }}>
                                {COMMISSION_STATUS[c.status]?.label}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                {c.status === 'flagged' && (
                                  <button onClick={() => approveCommission(c.id)}
                                    className="text-xs font-bold px-2.5 py-1.5 rounded-lg text-white bg-emerald-500 hover:bg-emerald-600 transition-all">
                                    Approve
                                  </button>
                                )}
                                <button onClick={() => reverseCommission(c.id)}
                                  className="text-xs font-bold px-2.5 py-1.5 rounded-lg text-white bg-red-500 hover:bg-red-600 transition-all">
                                  Reverse
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Add/Edit Affiliate Modal ── */}
      {showAddAffiliate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <p className="font-bold text-gray-900">{editAffiliate ? 'Edit' : 'Add New'} {config?.partnerTitle || 'Partner'}</p>
                <p className="text-xs text-gray-400 mt-0.5">They will earn {config?.defaultRate || 15}% on every booking they refer by default</p>
              </div>
              <button onClick={() => { setShowAddAffiliate(false); setEditAffiliate(null) }} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {formError && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Alex Johnson"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email *</label>
                  <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="alex@email.com" type="email"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone (optional)</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+44 7700 900000"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" />
              </div>

              {/* Tracking code */}
              {!editAffiliate && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tracking Code</label>
                  <div className="flex gap-2">
                    <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase().slice(0, 12) }))}
                      placeholder="ALEX-7K2M"
                      className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" />
                    <button onClick={() => setForm(f => ({ ...f, code: generateAffiliateCode(form.name || 'PART') }))}
                      className="text-xs font-bold px-3 py-2.5 rounded-xl border border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100 transition-all whitespace-nowrap">
                      Generate
                    </button>
                  </div>
                  {form.code && (
                    <p className="text-xs text-gray-400 mt-1">Link: {buildAffiliateUrl(bookingBase, form.code)}</p>
                  )}
                </div>
              )}

              {/* Commission */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Commission Type</label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {(['percentage', 'fixed'] as const).map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, commission_type: t }))}
                      className="py-2 rounded-xl text-xs font-semibold transition-all border"
                      style={{ background: form.commission_type === t ? '#f0fdfa' : '#f8fafc', borderColor: form.commission_type === t ? '#99f6e4' : '#e2e8f0', color: form.commission_type === t ? '#0d9488' : '#6b7280' }}>
                      {t === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                    </button>
                  ))}
                </div>
                {form.commission_type === 'percentage' ? (
                  <div className="relative">
                    <input type="number" min={1} max={50} value={form.commission_rate}
                      onChange={e => setForm(f => ({ ...f, commission_rate: Number(e.target.value) }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">% commission</span>
                  </div>
                ) : (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">£</span>
                    <input type="number" min={0} step={0.01}
                      value={(form.fixed_amount_pence / 100).toFixed(2)}
                      onChange={e => setForm(f => ({ ...f, fixed_amount_pence: Math.round(Number(e.target.value) * 100) }))}
                      className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notes (optional)</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. Social media, local PR, corporate partner..."
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" />
              </div>

              <button onClick={saveAffiliate} disabled={saving}
                className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #0d9488, #2563eb)' }}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editAffiliate ? 'Save Changes' : `Add ${config?.partnerTitle || 'Partner'}`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
