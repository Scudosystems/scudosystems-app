'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Lock, Loader2, AlertTriangle } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { fetchLatestTenant } from '@/lib/tenant'
import { AVAILABILITY_VERTICALS } from '@/lib/industry-modules'
import type { Availability, BlockedTime } from '@/types/database'

const DAYS  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7) // 07:00 → 21:00

export default function AvailabilityPage() {
  const supabase = createSupabaseBrowserClient()
  const [availability, setAvailability] = useState<Availability[]>([])
  const [blocked, setBlocked] = useState<BlockedTime[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [availabilityAllowed, setAvailabilityAllowed] = useState(true)
  const [newBlock, setNewBlock]       = useState({ date: '', startTime: '12:00', endTime: '13:00', reason: '' })
  const [addingBlock, setAddingBlock] = useState(false)
  const [savingBlock, setSavingBlock] = useState(false)
  const [removingBlock, setRemovingBlock] = useState<string | null>(null)

  // ── Drag-to-paint refs ────────────────────────────────────────────────────────
  // Using refs (not state) so drag state never triggers re-renders mid-paint.
  const isDraggingRef   = useRef(false)
  const paintModeRef    = useRef<boolean>(true)   // true = opening, false = closing
  const visitedRef      = useRef<Set<string>>(new Set())  // cells processed this drag
  const changedRef      = useRef<Set<string>>(new Set())  // cells actually modified
  const snapshotRef     = useRef<Availability[]>([])      // availability at drag start
  const avRef           = useRef<Availability[]>([])      // always-current availability

  // Keep avRef in sync so event handlers always read fresh state
  useEffect(() => { avRef.current = availability }, [availability])

  // ── Load ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const tenant = await fetchLatestTenant(supabase, 'vertical')
        const allowed = tenant?.vertical ? AVAILABILITY_VERTICALS.has(tenant.vertical as string) : true
        setAvailabilityAllowed(allowed)
        if (!allowed) { setLoading(false); return }
        const res  = await fetch('/api/availability')
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

  // ── Core helpers ──────────────────────────────────────────────────────────────
  function hStr(hour: number) { return `${String(hour).padStart(2, '0')}:00` }

  function slotAvailableIn(source: Availability[], day: number, hour: number) {
    const h = hStr(hour)
    return source.some(a =>
      a.day_of_week === day && a.is_active && !a.staff_id &&
      a.start_time <= h && a.end_time > h
    )
  }

  // Read from the live state (for isAvailable in JSX render)
  const isAvailable = (day: number, hour: number) =>
    slotAvailableIn(availability, day, hour)

  // Read from the always-current ref (for use inside event handlers / async functions)
  const currentIsAvailable = (day: number, hour: number) =>
    slotAvailableIn(avRef.current, day, hour)

  // Read from the snapshot taken at drag-start
  const snapIsAvailable = (day: number, hour: number) =>
    slotAvailableIn(snapshotRef.current, day, hour)

  // ── Optimistic state updater ──────────────────────────────────────────────────
  function setSlotOptimistic(day: number, hour: number, open: boolean) {
    const start = hStr(hour)
    const end   = hStr(hour + 1)
    const key   = `${day}-${hour}`
    setAvailability(prev => {
      const idx = prev.findIndex(a => a.day_of_week === day && a.start_time === start && !a.staff_id)
      if (idx >= 0) {
        if (prev[idx].is_active === open) return prev  // already correct, skip re-render
        return prev.map((a, i) => i === idx ? { ...a, is_active: open } : a)
      }
      if (!open) return prev  // nothing to remove
      return [...prev, {
        id: `__tmp__${key}`, tenant_id: '', staff_id: null,
        day_of_week: day, start_time: start, end_time: end,
        is_active: true, created_at: '',
      } as any]
    })
  }

  // ── Persist a single slot (fires after optimistic update) ─────────────────────
  async function persistSlot(day: number, hour: number) {
    const start = hStr(hour)
    const end   = hStr(hour + 1)
    const key   = `${day}-${hour}`
    try {
      const res  = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day_of_week: day, start_time: start, end_time: end }),
      })
      const data = await res.json()
      if (res.ok && data.row) {
        setAvailability(prev => {
          const clean   = prev.filter(a => a.id !== `__tmp__${key}`)
          const existIdx = clean.findIndex(a => a.id === data.row.id)
          if (existIdx >= 0) return clean.map(a => a.id === data.row.id ? data.row : a)
          return [...clean, data.row]
        })
      }
    } catch (e) { console.error('Availability persist failed:', e) }
  }

  // ── Drag-to-paint event handlers ──────────────────────────────────────────────
  function handleCellPointerDown(e: React.PointerEvent, day: number, hour: number) {
    e.preventDefault()
    // Release capture so pointerenter fires on other cells (crucial for touch)
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)

    snapshotRef.current  = [...avRef.current]   // snapshot state at drag start
    paintModeRef.current = !snapIsAvailable(day, hour)  // flip from current state
    isDraggingRef.current = true
    visitedRef.current   = new Set([`${day}-${hour}`])
    changedRef.current   = new Set([`${day}-${hour}`])
    setSlotOptimistic(day, hour, paintModeRef.current)
  }

  function handleCellPointerEnter(day: number, hour: number) {
    if (!isDraggingRef.current) return
    const key = `${day}-${hour}`
    if (visitedRef.current.has(key)) return
    visitedRef.current.add(key)
    // Only change cells that aren't already in the target state (using snapshot)
    if (snapIsAvailable(day, hour) !== paintModeRef.current) {
      changedRef.current.add(key)
      setSlotOptimistic(day, hour, paintModeRef.current)
    }
  }

  async function handleDragEnd() {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    const cells = [...changedRef.current]
    visitedRef.current = new Set()
    changedRef.current = new Set()
    // Batch-persist all changed cells in parallel
    await Promise.all(cells.map(key => {
      const [d, h] = key.split('-').map(Number)
      return persistSlot(d, h)
    }))
  }

  // ── Toggle whole day (click day header) ──────────────────────────────────────
  async function toggleDay(day: number) {
    const allOpen  = HOURS.every(h  => currentIsAvailable(day, h))
    const target   = !allOpen
    const toChange = HOURS.filter(h => currentIsAvailable(day, h) !== target)
    toChange.forEach(h => setSlotOptimistic(day, h, target))
    await Promise.all(toChange.map(h => persistSlot(day, h)))
  }

  // ── Toggle whole hour row (click hour label) ─────────────────────────────────
  async function toggleHour(hour: number) {
    const allOpen  = [0,1,2,3,4,5,6].every(d  => currentIsAvailable(d, hour))
    const target   = !allOpen
    const toChange = [0,1,2,3,4,5,6].filter(d => currentIsAvailable(d, hour) !== target)
    toChange.forEach(d => setSlotOptimistic(d, hour, target))
    await Promise.all(toChange.map(d => persistSlot(d, hour)))
  }

  // ── Add blocked time ──────────────────────────────────────────────────────────
  const addBlockedTime = async () => {
    setSavingBlock(true)
    try {
      const res  = await fetch('/api/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newBlock.date, startTime: newBlock.startTime, endTime: newBlock.endTime, reason: newBlock.reason }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Could not add blocked time'); return }
      setBlocked(prev => [...prev, data])
      setAddingBlock(false)
      setNewBlock({ date: '', startTime: '12:00', endTime: '13:00', reason: '' })
    } finally { setSavingBlock(false) }
  }

  // ── Remove blocked time ───────────────────────────────────────────────────────
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
    } finally { setRemovingBlock(null) }
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#0d6e6e' }} />
      </div>
    )
  }

  if (!availabilityAllowed) {
    return (
      <div className="max-w-3xl space-y-3">
        <h1 className="font-serif text-2xl font-bold text-dark">Availability</h1>
        <p className="text-sm text-dark/60">
          Availability scheduling isn't required for this industry. Manage your booking windows from your services or booking page settings instead.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-serif text-2xl font-bold text-dark">Availability</h1>
        <p className="text-sm text-dark/50">
          <strong>Click</strong> a slot to toggle it · <strong>Drag</strong> across slots to paint many at once · Click a <strong>day name</strong> or <strong>time</strong> to toggle the whole column / row.
        </p>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {loadError}
        </div>
      )}

      {/* ── Weekly Grid ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-border p-6 overflow-x-auto">
        <h3 className="font-semibold text-dark mb-4">Weekly Schedule</h3>

        {/* touch-action:none prevents scroll during a paint gesture */}
        <div
          className="min-w-[640px] select-none"
          style={{ touchAction: 'none' }}
          onPointerUp={handleDragEnd}
          onPointerLeave={handleDragEnd}
        >
          {/* ── Day headers (clickable to toggle whole day) ── */}
          <div className="grid grid-cols-8 gap-1 mb-2">
            <div />
            {DAYS.map((d, day) => (
              <button
                key={d}
                onClick={() => toggleDay(day)}
                title={`Toggle all ${d} slots`}
                className="text-center text-xs font-semibold text-dark/50 hover:text-dark transition-colors py-1 rounded-lg hover:bg-slate-50"
              >
                {d.slice(0, 3)}
              </button>
            ))}
          </div>

          {/* ── Hour rows ── */}
          {HOURS.map(hour => (
            <div key={hour} className="grid grid-cols-8 gap-1 mb-1 items-center">

              {/* Hour label — clickable to toggle that row across all days */}
              <button
                onClick={() => toggleHour(hour)}
                title={`Toggle ${hStr(hour)} across all days`}
                className="text-xs text-dark/40 text-right pr-2 hover:text-dark/70 transition-colors tabular-nums cursor-pointer"
              >
                {hStr(hour)}
              </button>

              {/* Cells for each day */}
              {[0, 1, 2, 3, 4, 5, 6].map(day => {
                const open = isAvailable(day, hour)
                return (
                  <button
                    key={day}
                    data-day={day}
                    data-hour={hour}
                    onPointerDown={e => handleCellPointerDown(e, day, hour)}
                    onPointerEnter={() => handleCellPointerEnter(day, hour)}
                    title={`${DAYS[day]} ${hStr(hour)} — ${open ? 'open (click/drag to close)' : 'closed (click/drag to open)'}`}
                    className={`h-8 rounded-lg transition-colors text-xs font-medium cursor-pointer ${
                      open
                        ? 'hover:opacity-80 active:opacity-60'
                        : 'hover:opacity-70 active:opacity-50'
                    }`}
                    style={open
                      ? { backgroundColor: 'rgba(13,110,110,0.78)' }
                      : { backgroundColor: 'rgba(0,0,0,0.06)' }
                    }
                  />
                )
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-5 mt-4 text-xs text-dark/50">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded inline-block" style={{ background: 'rgba(13,110,110,0.78)' }} />
            Open
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded inline-block" style={{ background: 'rgba(0,0,0,0.06)' }} />
            Closed
          </span>
          <span className="text-dark/30">Tip: drag across multiple slots to paint them all at once</span>
        </div>
      </div>

      {/* ── Blocked Times ─────────────────────────────────────────────────────── */}
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
