'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Lock, Loader2, AlertTriangle } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { fetchLatestTenant } from '@/lib/tenant'
import { AVAILABILITY_VERTICALS } from '@/lib/industry-modules'
import type { Availability, BlockedTime } from '@/types/database'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7) // 7am to 9pm

export default function AvailabilityPage() {
  const supabase = createSupabaseBrowserClient()
  const [availability, setAvailability] = useState<Availability[]>([])
  const [blocked, setBlocked] = useState<BlockedTime[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [availabilityAllowed, setAvailabilityAllowed] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null) // key = `${day}-${hour}`
  const [newBlock, setNewBlock] = useState({ date: '', startTime: '12:00', endTime: '13:00', reason: '' })
  const [addingBlock, setAddingBlock] = useState(false)
  const [savingBlock, setSavingBlock] = useState(false)
  const [removingBlock, setRemovingBlock] = useState<string | null>(null)

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const tenant = await fetchLatestTenant(supabase, 'vertical')
        const allowed = tenant?.vertical ? AVAILABILITY_VERTICALS.has(tenant.vertical as string) : true
        setAvailabilityAllowed(allowed)
        if (!allowed) {
          setLoading(false)
          return
        }
        const res = await fetch('/api/availability')
        const data = await res.json()
        if (data.error) { setLoadError(data.error); return }
        setAvailability(data.availability || [])
        setBlocked(data.blocked || [])
      } catch (e: any) {
        setLoadError(e?.message || 'Failed to load availability')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Helpers ───────────────────────────────────────────────────────────────
  const isAvailable = (day: number, hour: number) =>
    availability.some(a =>
      a.day_of_week === day &&
      a.is_active &&
      !a.staff_id &&
      a.start_time <= `${String(hour).padStart(2, '0')}:00` &&
      a.end_time   >  `${String(hour).padStart(2, '0')}:00`
    )

  // ── Toggle a slot ─────────────────────────────────────────────────────────
  const toggleSlot = async (day: number, hour: number) => {
    const key = `${day}-${hour}`
    if (toggling === key) return // prevent double-tap

    const startTime = `${String(hour).padStart(2, '0')}:00`
    const endTime   = `${String(hour + 1).padStart(2, '0')}:00`

    // Optimistic update so the UI feels instant
    const existingIdx = availability.findIndex(
      a => a.day_of_week === day && a.start_time === startTime && !a.staff_id
    )
    if (existingIdx >= 0) {
      setAvailability(prev => prev.map((a, i) =>
        i === existingIdx ? { ...a, is_active: !a.is_active } : a
      ))
    } else {
      // Temporary row so the cell lights up immediately
      setAvailability(prev => [...prev, {
        id: `__tmp__${key}`,
        tenant_id: '',
        staff_id: null,
        day_of_week: day,
        start_time: startTime,
        end_time: endTime,
        is_active: true,
        created_at: '',
      } as any])
    }

    setToggling(key)
    try {
      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day_of_week: day, start_time: startTime, end_time: endTime }),
      })
      const data = await res.json()
      if (!res.ok) {
        // Revert optimistic update on error
        if (existingIdx >= 0) {
          setAvailability(prev => prev.map((a, i) =>
            i === existingIdx ? { ...a, is_active: !a.is_active } : a
          ))
        } else {
          setAvailability(prev => prev.filter(a => a.id !== `__tmp__${key}`))
        }
        console.error('Availability toggle failed:', data.error)
        return
      }
      // Replace optimistic row with real DB row
      if (data.action === 'inserted') {
        setAvailability(prev => [
          ...prev.filter(a => a.id !== `__tmp__${key}`),
          data.row,
        ])
      } else {
        setAvailability(prev => prev.map(a =>
          a.id === data.row.id ? data.row : a
        ))
      }
    } finally {
      setToggling(null)
    }
  }

  // ── Add blocked time ──────────────────────────────────────────────────────
  const addBlockedTime = async () => {
    setSavingBlock(true)
    try {
      const res = await fetch('/api/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: newBlock.date,
          startTime: newBlock.startTime,
          endTime: newBlock.endTime,
          reason: newBlock.reason,
        }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Could not add blocked time'); return }
      setBlocked(prev => [...prev, data])
      setAddingBlock(false)
      setNewBlock({ date: '', startTime: '12:00', endTime: '13:00', reason: '' })
    } finally {
      setSavingBlock(false)
    }
  }

  // ── Remove blocked time ───────────────────────────────────────────────────
  const removeBlock = async (id: string) => {
    setRemovingBlock(id)
    try {
      const res = await fetch(`/api/availability?block_id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setBlocked(prev => prev.filter(b => b.id !== id))
      } else {
        const data = await res.json()
        alert(data.error || 'Could not remove blocked time')
      }
    } finally {
      setRemovingBlock(null)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-teal" style={{ color: '#0d6e6e' }} />
      </div>
    )
  }

  if (!availabilityAllowed) {
    return (
      <div className="max-w-3xl space-y-3">
        <h1 className="font-serif text-2xl font-bold text-dark">Availability</h1>
        <p className="text-sm text-dark/60">
          Availability scheduling isn’t required for this industry. Manage your booking windows from your services or booking page settings instead.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-serif text-2xl font-bold text-dark">Availability</h1>
        <p className="text-sm text-dark/50">Click any slot to toggle it on or off. Green = open for bookings.</p>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {loadError}
        </div>
      )}

      {/* ── Weekly Grid ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-border p-6 overflow-x-auto">
        <h3 className="font-semibold text-dark mb-4">Weekly Schedule</h3>
        <div className="min-w-[640px]">
          {/* Day headers */}
          <div className="grid grid-cols-8 gap-1 mb-2">
            <div />
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-dark/50">{d.slice(0, 3)}</div>
            ))}
          </div>

          {/* Hour rows */}
          {HOURS.map(hour => (
            <div key={hour} className="grid grid-cols-8 gap-1 mb-1">
              <div className="text-xs text-dark/40 text-right pr-2 pt-1">
                {String(hour).padStart(2, '0')}:00
              </div>
              {[0, 1, 2, 3, 4, 5, 6].map(day => {
                const avail = isAvailable(day, hour)
                const key = `${day}-${hour}`
                const isToggling = toggling === key
                return (
                  <button
                    key={day}
                    onClick={() => toggleSlot(day, hour)}
                    disabled={isToggling}
                    title={`${DAYS[day]} ${String(hour).padStart(2, '0')}:00 — ${avail ? 'click to close' : 'click to open'}`}
                    className={`h-7 rounded-md transition-all text-xs font-medium relative ${
                      avail
                        ? 'bg-teal/80 hover:bg-teal text-white'
                        : 'bg-border/40 hover:bg-border text-dark/30'
                    } ${isToggling ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
                    style={avail ? { backgroundColor: 'rgba(13,110,110,0.75)' } : undefined}
                  />
                )
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs text-dark/50">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded inline-block" style={{ background: 'rgba(13,110,110,0.75)' }} /> Open
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 bg-border/40 rounded inline-block" /> Closed
          </span>
        </div>
      </div>

      {/* ── Blocked Times ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-dark">Blocked Times</h3>
            <p className="text-xs text-dark/50">Holidays, closures, lunch breaks</p>
          </div>
          <button
            onClick={() => setAddingBlock(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark text-white text-sm font-medium hover:bg-dark/80 transition-colors"
          >
            <Plus className="w-4 h-4" /> Block Time
          </button>
        </div>

        {addingBlock && (
          <div className="border border-border rounded-xl p-4 mb-4 grid sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-dark/40 block mb-1">Date (blank = recurring weekly)</label>
              <input
                type="date"
                value={newBlock.date}
                onChange={e => setNewBlock(p => ({ ...p, date: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-border text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-dark/40 block mb-1">Start</label>
              <input
                type="time"
                value={newBlock.startTime}
                onChange={e => setNewBlock(p => ({ ...p, startTime: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-border text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-dark/40 block mb-1">End</label>
              <input
                type="time"
                value={newBlock.endTime}
                onChange={e => setNewBlock(p => ({ ...p, endTime: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-border text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-dark/40 block mb-1">Reason</label>
              <input
                value={newBlock.reason}
                onChange={e => setNewBlock(p => ({ ...p, reason: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-border text-sm"
                placeholder="e.g. Lunch break"
              />
            </div>
            <div className="sm:col-span-4 flex gap-2">
              <button
                onClick={addBlockedTime}
                disabled={savingBlock}
                className="btn-primary py-2 px-5 text-sm flex items-center gap-2"
              >
                {savingBlock && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
              </button>
              <button onClick={() => setAddingBlock(false)} className="btn-secondary py-2 px-4 text-sm">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {blocked.length === 0 ? (
            <p className="text-sm text-dark/40 text-center py-6">No blocked times set</p>
          ) : blocked.map(b => (
            <div key={b.id} className="flex items-center gap-3 p-3 bg-[#f8f6f1] rounded-xl">
              <Lock className="w-4 h-4 text-dark/40 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark">
                  {b.blocked_date
                    ? new Date(b.blocked_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'Recurring'}
                  {' · '}
                  {b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)}
                </p>
                {b.reason && <p className="text-xs text-dark/50">{b.reason}</p>}
              </div>
              <button
                onClick={() => removeBlock(b.id)}
                disabled={removingBlock === b.id}
                className="p-1.5 rounded-lg hover:bg-red-50 text-dark/30 hover:text-red-500 transition-colors disabled:opacity-50"
              >
                {removingBlock === b.id
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Trash2 className="w-4 h-4" />
                }
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
