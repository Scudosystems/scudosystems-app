'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  Calendar, Clock, User, Star, ChevronRight, LogOut,
  CheckCircle, AlertCircle, Loader2, BookOpen, TrendingUp,
  MessageSquare, ShieldCheck, Eye, EyeOff, KeyRound, Timer, Briefcase, RefreshCw,
  CircleCheck, CirclePause, CircleOff
} from 'lucide-react'

interface PortalSession {
  access_id: string
  display_name: string
  email: string
  role: string
  staff_id: string | null
  permissions: Record<string, boolean>
  reviews_opt_out?: boolean
  access_code?: string
  tenant_id: string
  tenant_name: string
  tenant_brand: string
  tenant_logo?: string | null
}

interface Booking {
  id: string
  booking_date: string
  booking_time: string
  status: string
  customer_name: string
  services?: { name: string; duration_minutes: number }
  notes: string | null
}

interface Review {
  id: string
  rating: number
  comment: string | null
  display_name: string | null
  created_at: string
}

interface JobOffer {
  id: string
  role_title: string
  start_at: string
  end_at: string
  hourly_rate_pence: number
  notes: string | null
  status: string
  responded_at: string | null
}

interface PortalStats {
  todayCount: number
  weekCount: number
  completedWeek: number
  avgRating: number
  reviewCount: number
  pendingOffers: number
}

const SESSION_KEY = 'scudo_staff_session'

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
      ))}
    </div>
  )
}

export default function StaffPortalPage() {
  const { slug } = useParams<{ slug: string }>()

  const [session, setSession] = useState<PortalSession | null>(null)
  const [tab, setTab] = useState<'today' | 'upcoming' | 'offers' | 'reviews'>('today')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginCode, setLoginCode] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [showCode, setShowCode] = useState(false)

  const [todayBookings, setTodayBookings] = useState<Booking[]>([])
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [offers, setOffers] = useState<JobOffer[]>([])
  const [guidelines, setGuidelines] = useState<string[]>([])
  const [stats, setStats] = useState<PortalStats>({
    todayCount: 0,
    weekCount: 0,
    completedWeek: 0,
    avgRating: 0,
    reviewCount: 0,
    pendingOffers: 0,
  })
  const [reviewsOptOut, setReviewsOptOut] = useState(false)
  const [availabilityStatus, setAvailabilityStatus] = useState<'available' | 'busy' | 'off'>('available')
  const [availabilityUpdating, setAvailabilityUpdating] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  const [jobOffersEnabled, setJobOffersEnabled] = useState(false)
  const [offersBlocked, setOffersBlocked] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>('')
  const [tenantName, setTenantName] = useState('')
  const [tenantBrand, setTenantBrand] = useState('#0d9488')
  const [tenantLogo, setTenantLogo] = useState<string | null>(null)

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.sessionStorage.getItem(SESSION_KEY) : null
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as PortalSession
        setSession(parsed)
        setTenantName(parsed.tenant_name)
        setTenantBrand(parsed.tenant_brand)
        setTenantLogo(parsed.tenant_logo || null)
        setReviewsOptOut(!!parsed.reviews_opt_out)
      } catch { /* ignore */ }
    }
  }, [])

  useEffect(() => {
    if (!slug) return
    fetch(`/api/wait/tenant?slug=${encodeURIComponent(slug)}`)
      .then(res => res.json())
      .then(data => {
        if (data?.tenant) {
          setTenantName(data.tenant.business_name || '')
          setTenantBrand(data.tenant.brand_colour || '#0d9488')
          setTenantLogo(data.tenant.logo_url || null)
        }
      })
  }, [slug])

  useEffect(() => {
    if (!session) return
    loadData()
  }, [session])

  useEffect(() => {
    if (!session) return
    const interval = setInterval(() => {
      loadData()
    }, 120000)
    return () => clearInterval(interval)
  }, [session])

  const showOffersTab = jobOffersEnabled || offers.length > 0 || offersBlocked === 'no_staff_link'

  useEffect(() => {
    if (!showOffersTab && tab === 'offers') {
      setTab('today')
    }
  }, [showOffersTab, tab])

  const formatGBP = (pence: number) => `£${(pence / 100).toFixed(2)}`

  const loadData = async () => {
    if (!session) return
    setDataLoading(true)
    try {
      const res = await fetch('/api/staff-portal/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessId: session.access_id,
          email: session.email,
          code: session.access_code,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setTodayBookings(data.todayBookings || [])
        setUpcomingBookings(data.upcomingBookings || [])
        setReviews(data.reviews || [])
        setOffers(data.offers || [])
        setGuidelines(data.guidelines || [])
        setReviewsOptOut(!!data.reviews_opt_out)
        if (data.availability_status) {
          setAvailabilityStatus(data.availability_status as 'available' | 'busy' | 'off')
        }
        const offersEnabled = !!data.job_offers_enabled
        setJobOffersEnabled(offersEnabled)
        setOffersBlocked(data.offers_blocked || null)
        const reviewCount = (data.reviews || []).length
        const avgRating = reviewCount > 0
          ? (data.reviews.reduce((s: number, r: any) => s + (r.rating || 0), 0) / reviewCount)
          : 0
        setStats({
          todayCount: data.stats?.todayCount || 0,
          weekCount: data.stats?.weekCount || 0,
          completedWeek: data.stats?.completedWeek || 0,
          avgRating,
          reviewCount,
          pendingOffers: offersEnabled ? (data.offers || []).filter((o: any) => o.status === 'pending').length : 0,
        })
        setLastUpdatedAt(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
      }
    } catch { /* ignore */ }
    setDataLoading(false)
  }

  const handleOfferResponse = async (offerId: string, response: 'accept' | 'decline') => {
    if (!session) return
    await fetch('/api/staff-portal/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessId: session.access_id,
        email: session.email,
        code: session.access_code,
        offerId,
        response,
      }),
    })
    loadData()
  }

  const toggleReviews = async () => {
    if (!session) return
    const next = !reviewsOptOut
    setReviewsOptOut(next)
    await fetch('/api/staff-portal/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessId: session.access_id,
        email: session.email,
        code: session.access_code,
        reviewsOptOut: next,
      }),
    })
  }

  const updateAvailability = async (status: 'available' | 'busy' | 'off') => {
    if (!session || availabilityUpdating) return
    setAvailabilityUpdating(true)
    setAvailabilityStatus(status)
    try {
      await fetch('/api/staff-portal/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessId: session.access_id,
          email: session.email,
          code: session.access_code,
          status,
        }),
      })
    } catch { /* ignore — optimistic UI already updated */ }
    setAvailabilityUpdating(false)
  }

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginCode.trim()) {
      setLoginError('Please enter your email and access code.')
      return
    }
    setLoginLoading(true)
    setLoginError('')
    try {
      const res = await fetch('/api/staff-portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, email: loginEmail.trim(), code: loginCode.trim() }),
      })
      const data = await res.json()
      if (!res.ok || !data?.session) {
        setLoginError(data?.error || 'Incorrect email or access code.')
        setLoginLoading(false)
        return
      }
      const sess = data.session as PortalSession
      setSession(sess)
      setTenantName(sess.tenant_name)
      setTenantBrand(sess.tenant_brand)
      setTenantLogo(sess.tenant_logo || null)
      setReviewsOptOut(!!sess.reviews_opt_out)
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(sess))
      }
      setLoginEmail('')
      setLoginCode('')
      loadData()
    } catch {
      setLoginError('Something went wrong. Please try again.')
    }
    setLoginLoading(false)
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(SESSION_KEY)
    }
    setSession(null)
    setTodayBookings([])
    setUpcomingBookings([])
    setReviews([])
    setOffers([])
    setLoginEmail('')
    setLoginCode('')
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div
              className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: tenantBrand }}
            >
              <KeyRound className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Staff Portal</h1>
            <p className="text-sm text-gray-500 mt-1">{tenantName || 'ScudoSystems'}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">Email</label>
                <input
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="mt-2 w-full h-11 rounded-xl border border-slate-200 px-3 text-sm"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">Access code</label>
                <div className="mt-2 relative">
                  <input
                    type={showCode ? 'text' : 'password'}
                    value={loginCode}
                    onChange={e => setLoginCode(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm pr-10"
                    placeholder="ABC123"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCode(!showCode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {loginError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                  {loginError}
                </div>
              )}
              <button
                onClick={handleLogin}
                disabled={loginLoading}
                className="w-full h-11 rounded-xl text-white font-semibold"
                style={{ backgroundColor: tenantBrand }}
              >
                {loginLoading ? 'Signing in…' : 'Sign in'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden" style={{ backgroundColor: tenantBrand + '20' }}>
              {tenantLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tenantLogo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6" style={{ color: tenantBrand }} />
              )}
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">{tenantName}</p>
              <h1 className="text-xl font-bold text-slate-900">{session.display_name}</h1>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                {session.role === 'manager' ? 'Manager' : 'Staff'}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            {/* Availability status toggle */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {([
                { status: 'available' as const, label: 'Available', icon: CircleCheck, activeColor: '#10b981', activeBg: '#d1fae5' },
                { status: 'busy' as const,      label: 'Busy',      icon: CirclePause, activeColor: '#f59e0b', activeBg: '#fef3c7' },
                { status: 'off' as const,        label: 'Off',       icon: CircleOff,   activeColor: '#94a3b8', activeBg: '#f1f5f9' },
              ] as const).map(({ status, label, icon: Icon, activeColor, activeBg }) => (
                <button
                  key={status}
                  onClick={() => updateAvailability(status)}
                  disabled={availabilityUpdating}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={
                    availabilityStatus === status
                      ? { background: activeBg, color: activeColor }
                      : { color: '#94a3b8' }
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadData}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
                title="Refresh data"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
              <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900">
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Today', value: stats.todayCount, icon: Calendar },
            { label: 'Next 7 days', value: stats.weekCount, icon: Clock },
            { label: 'Completed', value: stats.completedWeek, icon: CheckCircle },
            { label: 'Avg rating', value: stats.reviewCount ? stats.avgRating.toFixed(1) : '—', icon: Star },
            { label: 'Offers', value: stats.pendingOffers, icon: Briefcase },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: tenantBrand + '15' }}>
                <stat.icon className="w-4 h-4" style={{ color: tenantBrand }} />
              </div>
              <div>
                <p className="text-xs text-slate-400">{stat.label}</p>
                <p className="text-lg font-semibold text-slate-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {lastUpdatedAt && (
          <p className="text-[11px] text-slate-400">Last updated: {lastUpdatedAt}</p>
        )}

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-semibold text-slate-900">Customer experience guidelines</h2>
            </div>
            <span className="text-xs text-slate-400">Owner notes</span>
          </div>
          {guidelines.length === 0 ? (
            <p className="mt-3 text-xs text-slate-400">No guidelines yet. Check back soon.</p>
          ) : (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {guidelines.map((g, i) => (
                <li key={`${g}-${i}`} className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  {g}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
          {(['today','upcoming', ...(showOffersTab ? ['offers'] : []), 'reviews'] as const).map(key => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              className={`px-4 py-2 rounded-xl border ${tab === key ? 'bg-white border-slate-300 text-slate-900' : 'border-transparent hover:bg-white'}`}
            >
              {key === 'today' ? 'Today' : key === 'upcoming' ? 'Upcoming' : key === 'offers' ? 'Job offers' : 'Reviews'}
            </button>
          ))}
        </div>

        {dataLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
          </div>
        )}

        {!dataLoading && tab === 'today' && (
          <div className="space-y-4">
            {todayBookings.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400">
                No bookings for today.
              </div>
            ) : (
              todayBookings.map(b => (
                <div key={b.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{b.customer_name}</p>
                      <p className="text-xs text-slate-500">{b.services?.name || 'Service'} · {b.services?.duration_minutes || 30} min</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{b.booking_time.slice(0,5)}</p>
                    <p className="text-xs text-emerald-600">{b.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!dataLoading && tab === 'upcoming' && (
          <div className="space-y-4">
            {upcomingBookings.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400">
                No upcoming bookings.
              </div>
            ) : (
              upcomingBookings.map(b => (
                <div key={b.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{b.customer_name}</p>
                    <p className="text-xs text-slate-500">{b.services?.name || 'Service'} · {b.services?.duration_minutes || 30} min</p>
                    <p className="text-xs text-slate-400 mt-1">{b.booking_date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{b.booking_time.slice(0,5)}</p>
                    <p className="text-xs text-slate-500">{b.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!dataLoading && tab === 'offers' && (
          <div className="space-y-4">
            {offersBlocked === 'no_staff_link' ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-700">
                Your account isn’t linked to a staff profile yet. Ask your manager to link your staff profile in the Staff Access page so you can receive job offers.
              </div>
            ) : offers.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400">
                No job offers right now.
              </div>
            ) : (
              offers.map(o => (
                <div key={o.id} className="bg-white border border-slate-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{o.role_title}</p>
                      <p className="text-xs text-slate-500">{new Date(o.start_at).toLocaleString()} → {new Date(o.end_at).toLocaleString()}</p>
                      <p className="text-xs text-slate-500">Rate: {formatGBP(o.hourly_rate_pence)}/hr</p>
                      {o.notes && <p className="text-xs text-slate-400 mt-1">{o.notes}</p>}
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${o.status === 'accepted' ? 'bg-emerald-50 text-emerald-600' : o.status === 'declined' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                      {o.status}
                    </span>
                  </div>
                  {o.status === 'pending' && (
                    <div className="mt-4 flex items-center gap-2">
                      <button onClick={() => handleOfferResponse(o.id, 'accept')} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: tenantBrand }}>
                        Accept
                      </button>
                      <button onClick={() => handleOfferResponse(o.id, 'decline')} className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200">
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {!dataLoading && tab === 'reviews' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Reviews visibility</p>
                <p className="text-xs text-slate-500">You can hide your reviews from this portal if you prefer.</p>
              </div>
              <button onClick={toggleReviews} className={`w-10 h-5 rounded-full transition-all relative ${reviewsOptOut ? 'bg-slate-300' : 'bg-emerald-500'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${reviewsOptOut ? 'left-0.5' : 'left-5'}`} />
              </button>
            </div>

            {reviewsOptOut ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400">
                Reviews are hidden. Toggle on to see your feedback.
              </div>
            ) : reviews.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400">
                No reviews yet.
              </div>
            ) : (
              reviews.map(r => (
                <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">{r.display_name || 'Customer'}</p>
                    <StarRating rating={r.rating} />
                  </div>
                  {r.comment && <p className="text-xs text-slate-500 mt-2">{r.comment}</p>}
                  <p className="text-[11px] text-slate-400 mt-2">{new Date(r.created_at).toLocaleDateString('en-GB')}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
