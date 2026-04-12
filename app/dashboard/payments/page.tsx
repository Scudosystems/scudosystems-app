'use client'

import Link from 'next/link'
import { useState, useEffect, Suspense } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import {
  TrendingUp, Calendar, Download, CreditCard,
  Loader2
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { Booking } from '@/types/database'

const PERIODS = [
  { label: 'This month', value: 'this_month' },
  { label: 'Last month', value: 'last_month' },
  { label: 'Last 3 months', value: '3_months' },
  { label: 'All time', value: 'all_time' },
]

// ── Inner component ───────────────────────────────────────────────────────────
function PaymentsInner() {
  const supabase = createSupabaseBrowserClient()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [period, setPeriod] = useState('this_month')

  useEffect(() => {
    supabase.from('bookings').select('*, services(name)').eq('status', 'completed')
      .order('booking_date', { ascending: false })
      .then(({ data }) => setBookings((data as any[]) || []))
  }, [])

  const filterByPeriod = (b: Booking) => {
    const d = new Date(b.booking_date); const now = new Date()
    if (period === 'this_month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    if (period === 'last_month') {
      const last = new Date(now.getFullYear(), now.getMonth() - 1)
      return d.getMonth() === last.getMonth() && d.getFullYear() === last.getFullYear()
    }
    if (period === '3_months') { const c = new Date(); c.setMonth(c.getMonth() - 3); return d >= c }
    return true
  }

  const filtered = bookings.filter(filterByPeriod)
  const total = filtered.reduce((s, b) => s + b.total_amount_pence, 0)
  const deposits = filtered.filter(b => b.deposit_paid).reduce((s, b) => s + b.deposit_amount_pence, 0)
  const count = filtered.length

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i))
    const mbs = bookings.filter(b => {
      const bd = new Date(b.booking_date)
      return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear()
    })
    return {
      month: d.toLocaleDateString('en-GB', { month: 'short' }),
      revenue: mbs.reduce((s, b) => s + b.total_amount_pence / 100, 0),
    }
  })

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark tracking-tight">Payments</h1>
          <p className="text-sm text-dark/50 mt-0.5">Revenue from completed bookings</p>
        </div>
        <Link href="/dashboard/settings"
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-white text-sm font-medium hover:bg-gray-50 transition-colors">
          <CreditCard className="w-3.5 h-3.5" /> Manage plan
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-border px-5 py-4">
        <p className="font-semibold text-dark text-sm">Monthly subscription only</p>
        <p className="text-xs text-dark/50 mt-1 leading-relaxed">
          Your ScudoSystems account is billed monthly, and you can manage billing at any time from dashboard settings.
        </p>
      </div>

      {/* Period filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {PERIODS.map(p => (
          <button key={p.value} onClick={() => setPeriod(p.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${period === p.value ? 'bg-dark text-white shadow-sm' : 'bg-white border border-border text-dark/60 hover:border-teal/30 hover:text-dark'}`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(total), icon: TrendingUp, bg: 'bg-teal/10 text-teal' },
          { label: 'Bookings Paid', value: count, icon: Calendar, bg: 'bg-amber-500/10 text-amber-600' },
          { label: 'Deposits Collected', value: formatCurrency(deposits), icon: Download, bg: 'bg-violet-500/10 text-violet-600' },
          { label: 'Avg Revenue per Booking', value: count ? formatCurrency(total / count) : '£0.00', icon: TrendingUp, bg: 'bg-emerald-500/10 text-emerald-600' },
        ].map(({ label, value, icon: Icon, bg }, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-dark tracking-tight">{value}</p>
            <p className="text-xs text-dark/40 mt-0.5 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h3 className="font-semibold text-dark tracking-tight mb-5">Revenue — Last 6 Months</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9a9490' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9a9490' }} axisLine={false} tickLine={false} tickFormatter={v => `£${v}`} />
            <Tooltip formatter={(v: number) => [`£${v.toFixed(2)}`, 'Revenue']}
              contentStyle={{ borderRadius: '12px', border: '1px solid #e8e5e0', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }} />
            <Bar dataKey="revenue" fill="#0d6e6e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-dark tracking-tight">Transactions</h3>
          <p className="text-sm text-dark/40">{filtered.length} payments</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f8f6f1]">
                {['Date', 'Customer', 'Service', 'Deposit', 'Total'].map(h => (
                  <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold text-dark/40 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-sm text-dark/30">No payments in this period</td></tr>
              ) : filtered.map(b => (
                <tr key={b.id} className="hover:bg-[#f8f6f1] transition-colors">
                  <td className="px-5 py-3.5 text-sm text-dark whitespace-nowrap tabular-nums">
                    {new Date(b.booking_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-medium text-dark">{b.customer_name}</td>
                  <td className="px-5 py-3.5 text-sm text-dark/60">{(b as any).services?.name || '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-dark/60">{b.deposit_paid ? formatCurrency(b.deposit_amount_pence) : '—'}</td>
                  <td className="px-5 py-3.5 text-sm font-bold text-dark tabular-nums">{formatCurrency(b.total_amount_pence)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Suspense wrapper (required for useSearchParams in App Router) ─────────────
export default function PaymentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#0d6e6e' }} />
        </div>
      }
    >
      <PaymentsInner />
    </Suspense>
  )
}
