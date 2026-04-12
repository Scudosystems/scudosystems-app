'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { fetchLatestTenant } from '@/lib/tenant'
import {
  LayoutDashboard, Calendar, Users, Scissors, UserCircle,
  Clock, CreditCard, Globe, Settings, ChevronLeft, ChevronRight,
  Bell, Menu, LogOut, Zap, Moon, Sun, Share2, PartyPopper, KeyRound,
  AlertTriangle,
  Car, Wrench
} from 'lucide-react'
import { hasModule, AVAILABILITY_VERTICALS } from '@/lib/industry-modules'

// Vertical-specific overrides for the "Services" nav item
const SERVICES_NAV_OVERRIDES: Record<string, { icon: typeof Scissors; label: string }> = {
  supercar:    { icon: Car,     label: 'Fleet'     },
  auto:        { icon: Wrench,  label: 'Services'  },
  carwash:     { icon: Car,     label: 'Services'  },
  driving:     { icon: Car,     label: 'Packages'  },
}

const DEFAULT_SERVICES_NAV = { icon: Scissors, label: 'Services' }

const BASE_NAV_WITHOUT_SERVICES = [
  { href: '/dashboard',               icon: LayoutDashboard, label: 'Overview',     exact: true },
  { href: '/dashboard/bookings',       icon: Calendar,        label: 'Bookings' },
  { href: '/dashboard/customers',      icon: Users,           label: 'Customers' },
  // Services item is injected dynamically below based on vertical
  { href: '/dashboard/staff',          icon: UserCircle,      label: 'Staff' },
  { href: '/dashboard/payments',       icon: CreditCard,      label: 'Payments' },
  { href: '/dashboard/booking-page',   icon: Globe,           label: 'Booking Page' },
]

const CONDITIONAL_NAV = [
  { href: '/dashboard/events',         icon: PartyPopper,     label: 'Events',       module: 'events' },
  { href: '/dashboard/staff-access',   icon: KeyRound,        label: 'Staff Access', module: 'staff_access' },
  { href: '/dashboard/partners',       icon: Share2,          label: 'Partners',     module: 'partners' },
  { href: '/dashboard/settings',       icon: Settings,        label: 'Settings' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [notifLoading, setNotifLoading] = useState(false)
  const [hasNew, setHasNew] = useState(false)
  const notifRef = useRef<HTMLDivElement | null>(null)
  const [tenantVertical, setTenantVertical] = useState<string | null>(null)
  const [tenantSummary, setTenantSummary] = useState<{
    businessName: string | null
    planStatus: string | null
  } | null>(null)
  const [tenantLoaded, setTenantLoaded] = useState(false)

  // Fetch tenant vertical once for conditional nav
  useEffect(() => {
    fetchLatestTenant(supabase, 'vertical, business_name, plan_status, stripe_subscription_id')
      .then(t => {
        if (t?.vertical) setTenantVertical(t.vertical as string)
        setTenantSummary({
          businessName: t?.business_name || null,
          planStatus: t?.plan_status || null,
        })
      })
      .catch(() => {})
      .finally(() => setTenantLoaded(true))
  }, [])

  // Build nav items based on vertical — inject vertical-aware Services item
  const servicesOverride = tenantVertical ? (SERVICES_NAV_OVERRIDES[tenantVertical] || DEFAULT_SERVICES_NAV) : DEFAULT_SERVICES_NAV
  const servicesItem = { href: '/dashboard/services', ...servicesOverride }
  const availabilityAllowed = tenantVertical ? AVAILABILITY_VERTICALS.has(tenantVertical) : true

  const tail = BASE_NAV_WITHOUT_SERVICES.slice(3) // staff, payments, booking page
  const BASE_NAV = [
    BASE_NAV_WITHOUT_SERVICES[0],
    BASE_NAV_WITHOUT_SERVICES[1],
    BASE_NAV_WITHOUT_SERVICES[2],
    servicesItem,
    tail[0],
    ...(availabilityAllowed ? [{ href: '/dashboard/availability', icon: Clock, label: 'Availability' }] : []),
    ...tail.slice(1),
  ]

  const NAV = [
    ...BASE_NAV,
    ...CONDITIONAL_NAV.filter(item =>
      !item.module || hasModule(tenantVertical, item.module as any)
    ),
  ]
  const billingLocked = tenantSummary?.planStatus === 'past_due' || tenantSummary?.planStatus === 'cancelled'
  const billingOnlyRoute = pathname === '/dashboard/settings'
  const visibleNav = billingLocked ? NAV.filter(item => item.href === '/dashboard/settings') : NAV

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('scudosystems-dashboard-theme') : null
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored)
      return
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('scudosystems-dashboard-theme', theme)
    }
  }, [theme])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setNotifLoading(true)
      const { data } = await supabase
        .from('bookings')
        .select('id, created_at, booking_date, booking_time, status, customer_name, services(name)')
        .order('created_at', { ascending: false })
        .limit(6)
      if (cancelled) return
      const items = (data as any[]) || []
      setNotifications(items)
      const lastSeen = typeof window !== 'undefined'
        ? window.localStorage.getItem('scudosystems-notifications-lastseen')
        : null
      const lastSeenDate = lastSeen ? new Date(lastSeen) : null
      setHasNew(items.some(n => (n.created_at && (!lastSeenDate || new Date(n.created_at) > lastSeenDate))))
      setNotifLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!notifRef.current) return
      if (!notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false)
      }
    }
    if (notifOpen) {
      document.addEventListener('mousedown', handleClick)
    }
    return () => document.removeEventListener('mousedown', handleClick)
  }, [notifOpen])

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-200 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 bg-teal rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm shadow-teal/30">
          <Zap className="w-4 h-4 text-white" />
        </div>
        {!collapsed && <span className="font-serif text-lg font-bold text-dark tracking-tight">ScudoSystems</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto py-4">
        {visibleNav.map(({ href, icon: Icon, label, exact }: any) => (
          <Link key={href} href={href}
            onClick={() => setMobileOpen(false)}
            className={`sidebar-link ${isActive(href, exact) ? 'active' : ''} ${collapsed ? 'justify-center px-3' : ''}`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="text-sm">{label}</span>}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className={`p-3 border-t border-slate-200 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <button
          onClick={handleSignOut}
          className={`flex items-center gap-2.5 text-slate-500 hover:text-slate-900 text-sm transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-100 ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="hidden lg:flex w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 items-center justify-center text-slate-500 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="hidden lg:flex w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 items-center justify-center text-slate-500 transition-colors mt-2"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className={`dashboard-shell ${theme === 'dark' ? 'dashboard-dark' : ''} flex h-screen overflow-hidden bg-slate-50`}>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-[60px]' : 'w-56'}`}
        style={{ background: 'var(--dash-surface)', borderRight: '1px solid var(--dash-border)' }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-56 flex-shrink-0" style={{ background: 'var(--dash-surface)' }}>
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header
          className="h-14 flex items-center justify-between px-4 lg:px-6 flex-shrink-0"
          style={{ background: 'var(--dash-surface)', borderBottom: '1px solid var(--dash-border)' }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-lg transition-colors text-slate-500 hover:text-slate-900"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden lg:flex items-center gap-1.5 text-sm text-slate-400">
            <Link href="/dashboard" className="transition-colors hover:text-slate-900">Dashboard</Link>
            {pathname !== '/dashboard' && (
              <>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600 capitalize">
                  {pathname.split('/').pop()?.replace('-', ' ')}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
              className="p-2 rounded-xl transition-colors hover:bg-slate-100"
              aria-label="Toggle dark mode"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-slate-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-500" />
              )}
            </button>
            <div className="relative" ref={notifRef}>
              <button
                onClick={async () => {
                  const opening = !notifOpen
                  setNotifOpen(opening)
                  if (opening) {
                    setNotifLoading(true)
                    const { data } = await supabase
                      .from('bookings')
                      .select('id, created_at, booking_date, booking_time, status, customer_name, services(name)')
                      .order('created_at', { ascending: false })
                      .limit(6)
                    const items = (data as any[]) || []
                    setNotifications(items)
                    const now = new Date().toISOString()
                    if (typeof window !== 'undefined') {
                      window.localStorage.setItem('scudosystems-notifications-lastseen', now)
                    }
                    setHasNew(false)
                    setNotifLoading(false)
                  }
                }}
                className="relative p-2 rounded-xl transition-colors hover:bg-slate-100"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 text-slate-500" />
                {hasNew && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: '#0d9488' }} />
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-border rounded-2xl shadow-xl p-3 z-50">
                  <div className="flex items-center justify-between px-2 pb-2">
                    <p className="text-sm font-semibold text-dark">Notifications</p>
                    <Link href="/dashboard/bookings" className="text-xs font-semibold text-teal hover:underline">
                      View all
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {notifLoading ? (
                      <div className="px-2 py-6 text-center text-sm text-dark/40">Loading…</div>
                    ) : notifications.length === 0 ? (
                      <div className="px-2 py-6 text-center text-sm text-dark/40">No recent bookings yet.</div>
                    ) : notifications.map((n: any) => (
                      <div key={n.id} className="px-3 py-2 rounded-xl border border-border/60 bg-white hover:bg-slate-50 transition-colors">
                        <p className="text-sm font-semibold text-dark">{n.customer_name || 'New booking'}</p>
                        <p className="text-xs text-dark/50">
                          {(n.services?.name ? `${n.services.name} · ` : '')}
                          {n.booking_date} at {n.booking_time?.slice(0, 5)}
                        </p>
                        <p className="text-[11px] text-dark/40 capitalize mt-1">{n.status}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Link
              href={billingLocked ? '/dashboard/settings' : '/dashboard/booking-page'}
              className="hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
              style={{ color: '#2dd4bf', background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.2)' }}
            >
              {billingLocked ? <CreditCard className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
              {billingLocked ? 'Billing' : 'Booking Page'}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50">
          {!tenantLoaded ? (
            <div className="min-h-[50vh] flex items-center justify-center">
              <div className="text-sm text-slate-400">Loading your workspace…</div>
            </div>
          ) : billingLocked && !billingOnlyRoute ? (
            <div className="max-w-2xl mx-auto min-h-[60vh] flex items-center justify-center">
              <div className="w-full bg-white rounded-3xl border border-red-100 shadow-sm p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-5">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Your subscription needs attention</h2>
                <p className="text-sm text-slate-500 mt-3 leading-relaxed">
                  {tenantSummary?.businessName || 'This account'} is currently {tenantSummary?.planStatus === 'past_due' ? 'past due' : 'inactive'}.
                  To protect the platform, dashboard access is locked until billing is updated.
                </p>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <Link
                    href="/dashboard/settings"
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 text-white px-5 py-3 text-sm font-semibold hover:bg-slate-800 transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    Manage billing
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white text-slate-700 px-5 py-3 text-sm font-semibold hover:bg-slate-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  )
}
