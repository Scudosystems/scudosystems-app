'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import {
  TrendingUp, Link2, Copy, Check, Loader2, AlertCircle,
  Clock, Star, Banknote, MousePointerClick, LogOut, Eye,
  ShieldCheck, ChevronRight, ExternalLink, Mail, Lock, EyeOff
} from 'lucide-react'

interface Affiliate {
  id: string
  name: string
  email: string
  code: string
  commission_rate: number
  commission_type: 'percentage' | 'fixed'
  status: string
  total_earned_pence: number
  total_clicks: number
  total_bookings: number
  created_at: string
  tenant_id: string
}

interface Commission {
  id: string
  booking_amount_pence: number
  commission_pence: number
  status: 'pending' | 'approved' | 'paid' | 'reversed' | 'flagged'
  hold_until: string | null
  created_at: string
  paid_at: string | null
  bookings?: { customer_name: string; booking_date: string }
}

interface PortalSession {
  affiliate_id: string
  code: string
  name: string
  tenant_name: string
  tenant_brand: string
  tenant_slug: string
  booking_url: string
}

const SESSION_KEY = 'scudo_partner_session'

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg: '#fffbeb', color: '#d97706', label: 'Pending' },
  approved: { bg: '#f0fdf4', color: '#059669', label: 'Approved' },
  paid:     { bg: '#f9fafb', color: '#6b7280', label: 'Paid' },
  reversed: { bg: '#fef2f2', color: '#dc2626', label: 'Reversed' },
  flagged:  { bg: '#fef2f2', color: '#dc2626', label: 'Under review' },
}

function formatGBP(pence: number) {
  return `£${(pence / 100).toFixed(2)}`
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800) }}
      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
    >
      {copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!</> : <><Copy className="w-3.5 h-3.5 text-slate-400" /> Copy link</>}
    </button>
  )
}

export default function PartnerPortalPage() {
  const { code } = useParams<{ code: string }>()
  const supabase = createSupabaseBrowserClient()

  const [session, setSession] = useState<PortalSession | null>(null)
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null)
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loginEmail, setLoginEmail] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [dataLoading, setDataLoading] = useState(false)
  const [tab, setTab] = useState<'overview' | 'earnings'>('overview')
  const [tenantBrand, setTenantBrand] = useState('#0d9488')
  const [tenantName, setTenantName] = useState('')

  // Check for existing session
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.sessionStorage.getItem(SESSION_KEY + '_' + code) : null
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as PortalSession
        setSession(parsed)
        setTenantBrand(parsed.tenant_brand)
        setTenantName(parsed.tenant_name)
      } catch { /* invalid */ }
    }
  }, [code])

  useEffect(() => {
    if (!session) return
    loadData()
  }, [session])

  const loadData = async () => {
    if (!session) return
    setDataLoading(true)
    try {
      const [{ data: aff }, { data: comms }] = await Promise.all([
        supabase.from('affiliates').select('*').eq('id', session.affiliate_id).single(),
        supabase.from('affiliate_commissions')
          .select('*, bookings(customer_name, booking_date)')
          .eq('affiliate_id', session.affiliate_id)
          .order('created_at', { ascending: false })
          .limit(50),
      ])
      if (aff) setAffiliate(aff as Affiliate)
      setCommissions((comms as Commission[]) || [])
    } catch { /* graceful */ }
    setDataLoading(false)
  }

  const handleLogin = async () => {
    if (!loginEmail.trim()) { setLoginError('Please enter your email address.'); return }
    setLoginLoading(true)
    setLoginError('')
    try {
      const { data, error } = await (supabase
        .from('affiliates') as any)
        .select('*, tenants(id, business_name, brand_colour, slug)')
        .eq('code', code.toUpperCase())
        .eq('email', loginEmail.trim().toLowerCase())
        .eq('status', 'active')
        .single()

      if (error || !data) {
        setLoginError('No active partner account found with that email for this referral code.')
        setLoginLoading(false)
        return
      }

      const affiliate = data as any
      const tenant = affiliate?.tenants
      const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://scudosystems.com'}/book/${tenant?.slug || ''}?ref=${affiliate.code}`

      const sess: PortalSession = {
        affiliate_id: affiliate.id,
        code: affiliate.code,
        name: affiliate.name,
        tenant_name: tenant?.business_name || '',
        tenant_brand: tenant?.brand_colour || '#0d9488',
        tenant_slug: tenant?.slug || '',
        booking_url: bookingUrl,
      }
      setSession(sess)
      setTenantBrand(sess.tenant_brand)
      setTenantName(sess.tenant_name)
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(SESSION_KEY + '_' + code, JSON.stringify(sess))
      }
    } catch {
      setLoginError('Something went wrong. Please try again.')
    }
    setLoginLoading(false)
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(SESSION_KEY + '_' + code)
    }
    setSession(null)
    setAffiliate(null)
    setCommissions([])
    setLoginEmail('')
  }

  const brandColor = session?.tenant_brand || tenantBrand

  // Derived stats
  const pendingPence   = commissions.filter(c => c.status === 'pending' || c.status === 'approved').reduce((s, c) => s + c.commission_pence, 0)
  const paidPence      = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.commission_pence, 0)
  const convRate       = affiliate?.total_clicks
    ? Math.round((affiliate.total_bookings / affiliate.total_clicks) * 100)
    : 0

  // ─── Login Screen ────────────────────────────────────────────────────────
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div
              className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: tenantBrand }}
            >
              <TrendingUp className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Partner Portal</h1>
            <p className="text-sm text-gray-500 mt-1">
              Code: <span className="font-mono font-bold text-gray-700">{code?.toUpperCase()}</span>
            </p>
            {tenantName && <p className="text-xs text-gray-400 mt-0.5">{tenantName}</p>}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1">Sign in to your earnings</h2>
              <p className="text-xs text-gray-400">Enter the email address you registered as a partner.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="you@email.com"
                className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 text-gray-900"
              />
            </div>

            {loginError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{loginError}</p>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loginLoading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: tenantBrand }}
            >
              {loginLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : 'View my earnings'}
            </button>
          </div>

          <div className="mt-6 p-4 rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-500">
                <strong className="text-gray-700">Secure & private.</strong> Your earnings data is linked only to your referral code and email — visible to no one else.
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Powered by <span className="font-semibold">ScudoSystems</span>
          </p>
        </div>
      </div>
    )
  }

  // ─── Partner Dashboard ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">{session.tenant_name}</p>
            <h1 className="font-bold text-gray-900 text-base">{session.name}</h1>
            <p className="text-xs font-mono text-gray-400">Code: {session.code}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-700 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 pb-20 space-y-4">

        {/* Tracking link card */}
        <div className="rounded-2xl border p-4 space-y-2" style={{ background: brandColor + '08', borderColor: brandColor + '30' }}>
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4" style={{ color: brandColor }} />
            <p className="text-sm font-bold text-gray-900">Your referral link</p>
          </div>
          <p className="text-xs font-mono text-gray-500 break-all leading-relaxed">{session.booking_url}</p>
          <div className="flex items-center gap-2 pt-1">
            <CopyBtn text={session.booking_url} />
            <a
              href={session.booking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-colors"
              style={{ backgroundColor: brandColor }}
            >
              <ExternalLink className="w-3.5 h-3.5" /> Preview
            </a>
          </div>
          <p className="text-xs text-gray-400">
            Share this link. Every booking made through it earns you a commission automatically.
          </p>
        </div>

        {/* Stats */}
        {dataLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <p className="text-xs text-gray-500 mb-1">Pending payout</p>
                <p className="text-2xl font-black" style={{ color: pendingPence > 0 ? brandColor : '#9ca3af' }}>
                  {formatGBP(pendingPence)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Awaiting release</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <p className="text-xs text-gray-500 mb-1">Total paid out</p>
                <p className="text-2xl font-black text-gray-900">{formatGBP(paidPence)}</p>
                <p className="text-xs text-gray-400 mt-0.5">All time earnings</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <p className="text-xs text-gray-500 mb-1">Bookings driven</p>
                <p className="text-2xl font-black text-gray-900">{affiliate?.total_bookings || 0}</p>
                <p className="text-xs text-gray-400 mt-0.5">From your link</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <p className="text-xs text-gray-500 mb-1">Link clicks</p>
                <p className="text-2xl font-black text-gray-900">{affiliate?.total_clicks || 0}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {convRate > 0 ? `${convRate}% conversion` : 'No conversions yet'}
                </p>
              </div>
            </div>

            {/* Commission info */}
            <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-100 bg-blue-50">
              <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-700">
                <strong>7-day hold period:</strong> Commissions are held for 7 days after the booking is completed, then released for payment. This protects against cancellations.
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-200">
              {[{ id: 'overview', label: 'Recent Activity' }, { id: 'earnings', label: 'All Earnings' }].map(t => (
                <button key={t.id} onClick={() => setTab(t.id as any)}
                  className="px-4 py-2.5 text-sm font-semibold border-b-2 transition-all"
                  style={{ borderColor: tab === t.id ? brandColor : 'transparent', color: tab === t.id ? brandColor : '#6b7280' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Commission list */}
            <div className="space-y-2">
              {commissions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
                  <TrendingUp className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="font-bold text-gray-900">No earnings yet</p>
                  <p className="text-sm text-gray-400 mt-1">Share your referral link to start earning commissions.</p>
                </div>
              ) : (
                (tab === 'overview' ? commissions.slice(0, 10) : commissions).map(c => {
                  const s = STATUS_COLORS[c.status] || STATUS_COLORS.pending
                  const holdDate = c.hold_until ? new Date(c.hold_until) : null
                  const isHeld = holdDate && new Date() < holdDate
                  return (
                    <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-gray-900">
                              {c.bookings?.customer_name || 'Customer'}
                            </p>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: s.bg, color: s.color }}>
                              {s.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {c.bookings?.booking_date
                              ? new Date(c.bookings.booking_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                              : new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            {' · '}Booking: {formatGBP(c.booking_amount_pence)}
                          </p>
                          {isHeld && holdDate && (
                            <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Releases {holdDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </p>
                          )}
                          {c.paid_at && (
                            <p className="text-xs text-emerald-600 mt-0.5">
                              Paid {new Date(c.paid_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-gray-900">
                            +{formatGBP(c.commission_pence)}
                          </p>
                          <p className="text-xs text-gray-400">commission</p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
