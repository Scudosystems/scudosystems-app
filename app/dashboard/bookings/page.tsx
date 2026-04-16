'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { fetchLatestTenant } from '@/lib/tenant'
import { VERTICALS, VERTICAL_BOOKING_FIELDS } from '@/lib/verticals'
import { formatCurrency } from '@/lib/utils'
import { Calendar, Filter, Download, Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Booking, Tenant } from '@/types/database'

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'completed', 'cancelled', 'no_show']
const QUEUE_STATUS_OPTIONS = ['scheduled', 'checked_in', 'in_service', 'completed'] as const
const QUEUE_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  checked_in: 'Checked in',
  in_service: 'In service',
  completed: 'Done',
}
const QUEUE_BADGES: Record<string, string> = {
  scheduled: 'badge-grey',
  checked_in: 'badge-blue',
  in_service: 'badge-yellow',
  completed: 'badge-green',
}
// Each entry: pastDays = how far back, futureDays = how far forward (null = unlimited)
const DATE_RANGES = [
  { value: 'today',       label: 'Today',          pastDays: 0,   futureDays: 0   },
  { value: 'past_7',      label: 'Last 7 days',    pastDays: 7,   futureDays: 0   },
  { value: 'past_30',     label: 'Last 30 days',   pastDays: 30,  futureDays: 0   },
  { value: 'upcoming_7',  label: 'Next 7 days',    pastDays: 0,   futureDays: 7   },
  { value: 'upcoming_30', label: 'Next 30 days',   pastDays: 0,   futureDays: 30  },
  { value: 'all_time',    label: 'All time',        pastDays: null, futureDays: null },
]
const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  pending:   { label: 'Pending',   class: 'badge-yellow' },
  confirmed: { label: 'Confirmed', class: 'badge-green' },
  completed: { label: 'Completed', class: 'badge-blue' },
  cancelled: { label: 'Cancelled', class: 'badge-red' },
  no_show:   { label: 'No Show',   class: 'badge-grey' },
}

export default function BookingsPage() {
  const supabase = createSupabaseBrowserClient()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRange, setDateRange] = useState('all_time')
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  useEffect(() => {
    async function load() {
      let t: Tenant | null = null
      try {
        t = await fetchLatestTenant(supabase, 'id, vertical')
        setTenant(t as Tenant | null)
      } catch {
        setTenant(null)
      }

      if (!t?.id) {
        setLoading(false)
        return
      }

      // Scope to this tenant only — without .eq('tenant_id', t.id) every
      // booking from every tenant in the database would load here.
      const { data } = await supabase
        .from('bookings')
        .select('*, services(name,duration_minutes), staff(name)')
        .eq('tenant_id', t.id)
        .order('booking_date', { ascending: false })
        .order('booking_time')
        .limit(500)
      setBookings((data as any[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  const vertical = tenant?.vertical ? VERTICALS[tenant.vertical] : null
  const bookingFields = vertical ? VERTICAL_BOOKING_FIELDS[vertical.id] : []
  const detailText = (b: any) => {
    if (!bookingFields.length || !b?.metadata) return ''
    const parts = bookingFields
      .map(field => {
        const value = b.metadata?.[field.id]
        if (!value) return null
        return `${field.label}: ${value}`
      })
      .filter(Boolean)
    return parts.join(' · ')
  }

  const matchesDateRange = (b: Booking) => {
    const range = DATE_RANGES.find(r => r.value === dateRange)
    if (!range || (range.pastDays === null && range.futureDays === null)) return true

    const bookingDate = new Date(`${b.booking_date}T00:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const start = new Date(today)
    if (range.pastDays !== null) start.setDate(start.getDate() - range.pastDays)
    else start.setFullYear(2000) // effectively "no lower bound"

    const end = new Date(today)
    if (range.futureDays !== null) {
      end.setDate(end.getDate() + range.futureDays)
      end.setHours(23, 59, 59, 999)
    } else {
      end.setFullYear(2100) // effectively "no upper bound"
    }

    return bookingDate >= start && bookingDate <= end
  }

  const filtered = bookings.filter(b => {
    const matchSearch = !search || b.customer_name.toLowerCase().includes(search.toLowerCase()) || b.customer_email.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || b.status === statusFilter
    const matchDate = matchesDateRange(b)
    return matchSearch && matchStatus && matchDate
  })

  const handleStatus = async (id: string, status: string) => {
    const payload: any = { status }
    if (status === 'completed') {
      payload.queue_status = 'completed'
      payload.queue_updated_at = new Date().toISOString()
    }
    await (supabase.from('bookings') as any).update(payload).eq('id', id)
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: status as Booking['status'], ...(payload.queue_status ? { queue_status: payload.queue_status } : {}) } : b))
  }

  const handleQueueStatus = async (id: string, queue_status: typeof QUEUE_STATUS_OPTIONS[number]) => {
    await (supabase.from('bookings') as any).update({
      queue_status,
      queue_updated_at: new Date().toISOString(),
    }).eq('id', id)
    setBookings(prev => prev.map(b => b.id === id ? { ...b, queue_status } : b))
  }

  const exportCSV = () => {
    const rows = [
      ['Date', 'Time', 'Customer', 'Email', 'Phone', 'Service', 'Staff', 'Amount', 'Status', 'Ref', 'Details'],
      ...filtered.map(b => [
        b.booking_date, b.booking_time, b.customer_name, b.customer_email, b.customer_phone,
        (b as any).services?.name || '', (b as any).staff?.name || '',
        (b.total_amount_pence / 100).toFixed(2), b.status, b.booking_ref,
        detailText(b),
      ])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bookings.csv'
    a.click()
  }

  // Calendar view
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()

  const calendarBookings = bookings.filter(b => {
    const d = new Date(`${b.booking_date}T00:00:00`)
    return d.getMonth() === selectedMonth.getMonth() && d.getFullYear() === selectedMonth.getFullYear()
  })

  const getBookingsForDay = (day: number) => {
    const dateStr = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return calendarBookings.filter(b => b.booking_date === dateStr)
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-dark">Bookings</h1>
          <p className="text-sm text-dark/50">{filtered.length} total bookings</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-border rounded-xl p-1 gap-1">
            <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'list' ? 'bg-dark text-white' : 'text-dark/50 hover:text-dark'}`}>List</button>
            <button onClick={() => setView('calendar')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'calendar' ? 'bg-dark text-white' : 'text-dark/50 hover:text-dark'}`}>Calendar</button>
          </div>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-white text-sm font-medium hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark/30" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search customer name or email…"
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-teal" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_OPTIONS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all capitalize ${statusFilter === s ? 'bg-teal text-white' : 'bg-white border border-border text-dark/60 hover:border-teal/30'}`}>
              {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {DATE_RANGES.map(r => (
            <button key={r.value} onClick={() => setDateRange(r.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${dateRange === r.value ? 'bg-dark text-white' : 'bg-white border border-border text-dark/60 hover:border-teal/30'}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {view === 'calendar' ? (
        <div className="bg-white rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-dark text-lg">
              {selectedMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setSelectedMonth(new Date())}
                className="px-3 py-1.5 text-sm rounded-xl hover:bg-gray-100 transition-colors font-medium">Today</button>
              <button onClick={() => setSelectedMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 mb-2">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-dark/40 py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-border">
            {Array.from({ length: getFirstDayOfMonth(selectedMonth) }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-[#f8f6f1] h-24" />
            ))}
            {Array.from({ length: getDaysInMonth(selectedMonth) }, (_, i) => i + 1).map(day => {
              const dayBookings = getBookingsForDay(day)
              const isToday = new Date().toDateString() === new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day).toDateString()
              return (
                <div key={day} className={`bg-white p-2 h-24 overflow-hidden ${isToday ? 'ring-2 ring-teal ring-inset' : ''}`}>
                  <p className={`text-xs font-bold mb-1 ${isToday ? 'text-teal' : 'text-dark'}`}>{day}</p>
                  <div className="space-y-0.5">
                    {dayBookings.slice(0, 3).map(b => (
                      <div key={b.id} className="text-xs bg-teal/10 text-teal rounded px-1 truncate">
                        {b.booking_time.slice(0,5)} {b.customer_name.split(' ')[0]}
                      </div>
                    ))}
                    {dayBookings.length > 3 && <div className="text-xs text-dark/40">+{dayBookings.length - 3} more</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f8f6f1]">
                  {['Ref', 'Date & Time', 'Customer', 'Service', 'Staff', 'Amount', 'Status', 'Queue', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-dark/50 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-12 text-dark/40">Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-dark/40">No bookings found</td></tr>
                ) : filtered.map(b => (
                  <tr key={b.id} className="hover:bg-[#f8f6f1] transition-colors group">
                    <td className="px-4 py-3 text-xs font-mono text-dark/50 whitespace-nowrap">{b.booking_ref || '—'}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <p className="font-medium text-dark">{new Date(b.booking_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      <p className="text-dark/40">{b.booking_time.slice(0,5)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-dark">{b.customer_name}</p>
                      <p className="text-xs text-dark/40">{b.customer_phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-dark/70">{(b as any).services?.name || '—'}</p>
                      {detailText(b) && <p className="text-xs text-dark/40 mt-0.5">{detailText(b)}</p>}
                      {b.customer_concerns && (
                        <p className="text-xs text-amber-700 mt-0.5 truncate" title={b.customer_concerns}>
                          Concerns: {b.customer_concerns}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-dark/70">{(b as any).staff?.name || 'Any'}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-dark">{formatCurrency(b.total_amount_pence)}</td>
                    <td className="px-4 py-3"><span className={STATUS_CONFIG[b.status]?.class}>{STATUS_CONFIG[b.status]?.label}</span></td>
                    <td className="px-4 py-3">
                      <span className={QUEUE_BADGES[b.queue_status || 'scheduled'] || 'badge-grey'}>
                        {QUEUE_LABELS[b.queue_status || 'scheduled'] || 'Scheduled'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {b.queue_status !== 'checked_in' && b.queue_status !== 'in_service' && b.queue_status !== 'completed' && (
                          <button onClick={() => handleQueueStatus(b.id, 'checked_in')} className="text-xs text-emerald-600 font-medium hover:underline">
                            Check‑in
                          </button>
                        )}
                        {b.queue_status === 'checked_in' && (
                          <button onClick={() => handleQueueStatus(b.id, 'in_service')} className="text-xs text-amber-600 font-medium hover:underline">
                            In‑service
                          </button>
                        )}
                        {b.queue_status === 'in_service' && (
                          <button onClick={() => handleQueueStatus(b.id, 'completed')} className="text-xs text-blue-600 font-medium hover:underline">
                            Done
                          </button>
                        )}
                        {b.status === 'pending' && (
                          <button onClick={() => handleStatus(b.id, 'confirmed')} className="text-xs text-teal font-medium hover:underline">Confirm</button>
                        )}
                        {b.status === 'confirmed' && (
                          <button onClick={() => handleStatus(b.id, 'completed')} className="text-xs text-blue-600 font-medium hover:underline">Complete</button>
                        )}
                        {['pending','confirmed'].includes(b.status) && (
                          <button onClick={() => handleStatus(b.id, 'cancelled')} className="text-xs text-red-500 font-medium hover:underline">Cancel</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
