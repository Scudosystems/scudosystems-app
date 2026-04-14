'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { fetchLatestTenant } from '@/lib/tenant'
import { formatCurrency } from '@/lib/utils'
import { Search, Download, Mail, Phone } from 'lucide-react'

interface Customer {
  email: string
  name: string
  phone: string
  totalBookings: number
  totalSpent: number
  lastVisit: string
}

export default function CustomersPage() {
  const supabase = createSupabaseBrowserClient()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const tenant = await fetchLatestTenant(supabase, 'id').catch(() => null)
      if (!tenant?.id) { setLoading(false); return }

      const { data } = await (supabase.from('bookings') as any)
        .select('customer_name, customer_email, customer_phone, total_amount_pence, booking_date, status')
        .eq('tenant_id', tenant.id)
        .order('booking_date', { ascending: false })

      if (!data) return setLoading(false)

      const map = new Map<string, Customer>()
      for (const b of data) {
        const key = b.customer_email
        const existing = map.get(key)
        if (existing) {
          existing.totalBookings++
          if (b.status === 'completed') existing.totalSpent += b.total_amount_pence
          if (b.booking_date > existing.lastVisit) existing.lastVisit = b.booking_date
        } else {
          map.set(key, {
            email: b.customer_email,
            name: b.customer_name,
            phone: b.customer_phone,
            totalBookings: 1,
            totalSpent: b.status === 'completed' ? b.total_amount_pence : 0,
            lastVisit: b.booking_date,
          })
        }
      }
      setCustomers(Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent))
      setLoading(false)
    }
    load()
  }, [])

  const filtered = customers.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  const exportCSV = () => {
    const rows = [
      ['Name', 'Email', 'Phone', 'Total Bookings', 'Total Spent', 'Last Visit'],
      ...filtered.map(c => [c.name, c.email, c.phone, c.totalBookings, (c.totalSpent/100).toFixed(2), c.lastVisit])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'customers.csv'; a.click()
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-dark">Customers</h1>
          <p className="text-sm text-dark/60">{customers.length} total customers</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-white text-sm font-medium hover:bg-gray-50">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Customers', value: customers.length },
          { label: 'Total Revenue', value: formatCurrency(customers.reduce((s, c) => s + c.totalSpent, 0)) },
          { label: 'Avg Spend / Customer', value: formatCurrency(customers.length ? customers.reduce((s, c) => s + c.totalSpent, 0) / customers.length : 0) },
        ].map(({ label, value }, i) => (
          <div key={i} className="stat-card">
            <p className="text-sm text-dark/60">{label}</p>
            <p className="font-sans text-3xl font-bold text-dark mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark/30" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search name, email or phone…"
          className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-white text-base focus:outline-none focus:border-teal" />
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#f8f6f1]">
              {['Customer', 'Contact', 'Total Bookings', 'Total Spent', 'Last Visit'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-sm font-semibold text-dark/60 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-12 text-dark/40">Loading…</td></tr>
            ) : filtered.map(c => (
              <tr key={c.email} className="hover:bg-[#f8f6f1] transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-teal text-xs font-bold">{c.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="font-semibold text-dark text-base">{c.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-0.5">
                    <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-sm text-dark/70 hover:text-teal transition-colors">
                      <Mail className="w-3 h-3" />{c.email}
                    </a>
                    <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-sm text-dark/70 hover:text-teal transition-colors">
                      <Phone className="w-3 h-3" />{c.phone}
                    </a>
                  </div>
                </td>
                <td className="px-5 py-4 text-center font-semibold text-dark text-base">{c.totalBookings}</td>
                <td className="px-5 py-4 font-semibold text-dark text-base">{formatCurrency(c.totalSpent)}</td>
                <td className="px-5 py-4 text-sm text-dark/70">
                  {new Date(c.lastVisit).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
