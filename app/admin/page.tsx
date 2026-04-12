'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { VERTICAL_PRICING } from '@/lib/pricing'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Users, TrendingUp, UserPlus, UserMinus, Building2, ExternalLink, Search } from 'lucide-react'
import type { Tenant } from '@/types/database'

const VERTICAL_COLOURS: Record<string, string> = {
  dental: '#0d6e6e', beauty: '#c4893a', nightclub: '#6d28d9', spa: '#059669',
  gym: '#dc2626', optician: '#0369a1', vet: '#7c3aed', auto: '#b45309', tutoring: '#0891b2',
  restaurant: '#ea580c', barber: '#1d4ed8', tattoo: '#1e1e1e', carwash: '#0284c7',
  driving: '#16a34a', takeaway: '#d97706', supercar: '#7c3aed', photography: '#db2777',
  grooming: '#a16207', physio: '#0891b2', nails: '#be185d', aesthetics: '#9333ea',
  lash: '#831843', escape: '#1e3a8a', solicitor: '#374151', accountant: '#065f46',
}

export default function AdminPage() {
  const supabase = createSupabaseBrowserClient()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data } = await supabase.from('tenants').select('*').order('created_at', { ascending: false })
    setTenants(data || [])
    setLoading(false)
  }

  const activeTenants = tenants.filter(t => t.plan_status === 'active' || t.plan_status === 'trialing')
  const mrr = tenants
    .filter(t => t.plan_status === 'active')
    .reduce((sum, t) => sum + (VERTICAL_PRICING[t.vertical]?.basePence || 0), 0)
  const arr = mrr * 12

  const signupsThisWeek = tenants.filter(t => {
    const d = new Date(t.created_at)
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7)
    return d >= cutoff
  }).length

  const churnThisMonth = tenants.filter(t => {
    if (t.plan_status !== 'cancelled') return false
    const d = new Date(t.created_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  // MRR by vertical (donut chart data)
  const mrrByVertical = Object.entries(VERTICAL_COLOURS).map(([v, colour]) => ({
    name: v.charAt(0).toUpperCase() + v.slice(1),
    value: tenants.filter(t => t.vertical === v && t.plan_status === 'active').length,
    colour,
  })).filter(d => d.value > 0)

  // Signups per month (last 6)
  const signupChart = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    return {
      month: d.toLocaleDateString('en-GB', { month: 'short' }),
      signups: tenants.filter(t => {
        const td = new Date(t.created_at)
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear()
      }).length,
    }
  })

  const filteredTenants = tenants.filter(t =>
    !search ||
    t.business_name.toLowerCase().includes(search.toLowerCase()) ||
    t.email?.toLowerCase().includes(search.toLowerCase()) ||
    t.vertical.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="min-h-screen bg-dark flex items-center justify-center">
      <div className="text-white/50">Loading…</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f0d0a] text-white">
      {/* Header */}
      <div className="bg-dark border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <span className="font-serif text-lg font-bold text-white">ScudoSystems</span>
              <span className="ml-2 text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full font-semibold">Admin</span>
            </div>
          </div>
          <a href="/dashboard" className="text-white/50 text-sm hover:text-white transition-colors flex items-center gap-1">
            <ExternalLink className="w-4 h-4" /> My Dashboard
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'Active Tenants', value: activeTenants.length, sub: `${tenants.length} total signups`, colour: 'text-teal' },
            { icon: TrendingUp, label: 'Monthly MRR', value: formatCurrency(mrr), sub: `£${(arr/100).toFixed(0)} ARR`, colour: 'text-gold' },
            { icon: UserPlus, label: 'New This Week', value: signupsThisWeek, sub: 'Signups last 7 days', colour: 'text-teal' },
            { icon: UserMinus, label: 'Churn This Month', value: churnThisMonth, sub: 'Cancellations', colour: churnThisMonth > 0 ? 'text-red-400' : 'text-emerald-400' },
          ].map(({ icon: Icon, label, value, sub, colour }, i) => (
            <div key={i} className="bg-dark rounded-2xl border border-white/10 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white/50 text-sm">{label}</p>
                <Icon className={`w-5 h-5 ${colour}`} />
              </div>
              <p className="font-serif text-3xl font-bold text-white">{value}</p>
              <p className="text-white/30 text-xs mt-1">{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Signup chart */}
          <div className="lg:col-span-2 bg-dark rounded-2xl border border-white/10 p-6">
            <h3 className="font-semibold text-white mb-6">New Signups — Last 6 Months</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={signupChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1a1814', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="signups" fill="#0d6e6e" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tenants by vertical */}
          <div className="bg-dark rounded-2xl border border-white/10 p-6">
            <h3 className="font-semibold text-white mb-4">Active by Vertical</h3>
            {mrrByVertical.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-8">No active tenants yet</p>
            ) : (
              <div className="space-y-2">
                {mrrByVertical.map(({ name, value, colour }) => (
                  <div key={name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: colour }} />
                    <div className="flex-1 bg-white/5 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${(value / activeTenants.length) * 100}%`, backgroundColor: colour }} />
                    </div>
                    <span className="text-white/60 text-xs w-6 text-right">{value}</span>
                    <span className="text-white/40 text-xs w-16 truncate">{name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tenants Table */}
        <div className="bg-dark rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">All Tenants</h3>
              <p className="text-white/40 text-sm">{tenants.length} total businesses</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search businesses…"
                className="pl-9 pr-4 h-9 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-teal/50 w-56" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Business', 'Vertical', 'Billing', 'Status', 'MRR', 'Signed Up', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-12 text-white/30">Loading…</td></tr>
                ) : filteredTenants.map(t => (
                  <tr key={t.id} className="hover:bg-white/3 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: VERTICAL_COLOURS[t.vertical] || '#0d6e6e' }}>
                          {t.business_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{t.business_name}</p>
                          <p className="text-white/30 text-xs">{t.email || t.owner_email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium capitalize px-2 py-1 rounded-full text-white"
                        style={{ backgroundColor: VERTICAL_COLOURS[t.vertical] + '30' }}>
                        {t.vertical}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/70 text-sm">
                      {VERTICAL_PRICING[t.vertical]?.billingModel || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        t.plan_status === 'active' ? 'bg-emerald-900/50 text-emerald-400' :
                        t.plan_status === 'trialing' ? 'bg-amber-900/50 text-amber-400' :
                        t.plan_status === 'past_due' ? 'bg-red-900/50 text-red-400' :
                        'bg-white/5 text-white/30'
                      }`}>{t.plan_status}</span>
                    </td>
                    <td className="px-4 py-3 text-white font-semibold text-sm">
                      {t.plan_status === 'active' ? formatCurrency(VERTICAL_PRICING[t.vertical]?.basePence || 0) : '—'}
                    </td>
                    <td className="px-4 py-3 text-white/50 text-sm whitespace-nowrap">
                      {new Date(t.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={`/book/${t.slug}`} target="_blank" rel="noopener"
                          className="text-xs text-teal hover:underline">View Page</a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
