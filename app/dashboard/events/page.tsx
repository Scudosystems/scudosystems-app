'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { fetchLatestTenant } from '@/lib/tenant'
import {
  CalendarDays, Plus, Trash2, Edit2, Upload, X, Check,
  Clock, MapPin, Info, Image, Users, ShieldAlert, Eye, EyeOff
} from 'lucide-react'
import { hasModule } from '@/lib/industry-modules'

interface EventPoster {
  id: string
  tenant_id: string
  service_id: string | null
  title: string
  description: string | null
  poster_url: string | null
  event_date: string | null
  event_time: string | null
  venue_name: string | null
  venue_address: string | null
  min_age: number | null
  dress_code: string | null
  is_active: boolean
  created_at: string
}

interface Service {
  id: string
  name: string
}

const EVENT_VERTICALS = new Set(['nightclub', 'events'])

const emptyForm = {
  title: '',
  description: '',
  poster_url: '',
  event_date: '',
  event_time: '',
  venue_name: '',
  venue_address: '',
  min_age: '',
  dress_code: '',
  service_id: '',
  is_active: true,
}

export default function EventsPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const [tenantId, setTenantId] = useState<string | null>(null)
  const [vertical, setVertical] = useState<string | null>(null)
  const [events, setEvents] = useState<EventPoster[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Load tenant + events ─────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      let tenant = null
      try {
        tenant = await fetchLatestTenant(supabase, 'id, vertical')
      } catch {
        tenant = null
      }
      if (!tenant) { setLoading(false); return }
      setTenantId(tenant.id)
      setVertical(tenant.vertical || null)

      const [{ data: evts }, { data: svcs }] = await Promise.all([
        supabase.from('event_posters').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false }),
        supabase.from('services').select('id, name').eq('tenant_id', tenant.id).eq('is_active', true).order('sort_order'),
      ])
      setEvents((evts as EventPoster[]) || [])
      setServices((svcs as Service[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  // ─── Poster image upload ──────────────────────────────────────────
  const handleImageUpload = async (file: File) => {
    if (!tenantId) return
    setUploading(true)
    setUploadError(null)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${tenantId}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('event-posters')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadErr) throw new Error(uploadErr.message)
      const { data: { publicUrl } } = supabase.storage.from('event-posters').getPublicUrl(path)
      setForm(f => ({ ...f, poster_url: publicUrl }))
    } catch (err: any) {
      setUploadError(err?.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  // ─── Save event ───────────────────────────────────────────────────
  const handleSave = async () => {
    if (!tenantId || !form.title.trim()) return
    setSaving(true)
    try {
      const payload = {
        tenant_id: tenantId,
        service_id: form.service_id || null,
        title: form.title.trim(),
        description: form.description.trim() || null,
        poster_url: form.poster_url || null,
        event_date: form.event_date || null,
        event_time: form.event_time || null,
        venue_name: form.venue_name.trim() || null,
        venue_address: form.venue_address.trim() || null,
        min_age: form.min_age ? parseInt(form.min_age, 10) : null,
        dress_code: form.dress_code.trim() || null,
        is_active: form.is_active,
      }

      if (editingId) {
        const { error } = await (supabase.from('event_posters') as any).update(payload).eq('id', editingId)
        if (error) throw error
        setEvents(prev => prev.map(e => e.id === editingId ? { ...e, ...payload, id: editingId, created_at: e.created_at } : e))
      } else {
        const { data, error } = await (supabase.from('event_posters') as any).insert(payload).select().single()
        if (error) throw error
        setEvents(prev => [data as EventPoster, ...prev])
      }

      closeModal()
    } catch (err: any) {
      alert(err?.message || 'Failed to save event.')
    } finally {
      setSaving(false)
    }
  }

  // ─── Toggle active ────────────────────────────────────────────────
  const toggleActive = async (event: EventPoster) => {
    const newVal = !event.is_active
    await (supabase.from('event_posters') as any).update({ is_active: newVal }).eq('id', event.id)
    setEvents(prev => prev.map(e => e.id === event.id ? { ...e, is_active: newVal } : e))
  }

  // ─── Delete ───────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return
    await (supabase.from('event_posters') as any).delete().eq('id', deleteId)
    setEvents(prev => prev.filter(e => e.id !== deleteId))
    setDeleteId(null)
  }

  // ─── Open modal ───────────────────────────────────────────────────
  const openAdd = () => {
    setForm({ ...emptyForm })
    setEditingId(null)
    setUploadError(null)
    setShowModal(true)
  }

  const openEdit = (event: EventPoster) => {
    setForm({
      title: event.title,
      description: event.description || '',
      poster_url: event.poster_url || '',
      event_date: event.event_date || '',
      event_time: event.event_time || '',
      venue_name: event.venue_name || '',
      venue_address: event.venue_address || '',
      min_age: event.min_age !== null ? String(event.min_age) : '',
      dress_code: event.dress_code || '',
      service_id: event.service_id || '',
      is_active: event.is_active,
    })
    setEditingId(event.id)
    setUploadError(null)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setForm({ ...emptyForm })
    setUploadError(null)
  }

  // ─── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal border-t-transparent" />
      </div>
    )
  }

  // ─── Non-events vertical ──────────────────────────────────────────
  useEffect(() => {
    if (vertical && !hasModule(vertical, 'events')) {
      router.replace('/dashboard')
    }
  }, [vertical, router])

  if (vertical && !hasModule(vertical, 'events')) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage event posters and descriptions shown on your public booking page.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors"
          style={{ backgroundColor: '#0d9488' }}
        >
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>

      {/* Empty state */}
      {events.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-14 h-14 bg-teal/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-7 h-7 text-teal" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No events yet</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Add your first event poster so guests can see what&apos;s happening before they book their tickets.
          </p>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl"
            style={{ backgroundColor: '#0d9488' }}
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>
      )}

      {/* Events grid */}
      {events.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {events.map(event => (
            <div
              key={event.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Poster image */}
              {event.poster_url ? (
                <div className="relative">
                  <img
                    src={event.poster_url}
                    alt={event.title}
                    className="w-full h-48 object-cover"
                  />
                  {!event.is_active && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-sm font-semibold bg-black/40 px-3 py-1 rounded-lg">Hidden</span>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="w-full h-32 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #f0fdf4, #d1fae5)' }}
                >
                  <Image className="w-8 h-8 text-emerald-400" />
                </div>
              )}

              {/* Event info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-gray-900 leading-tight">{event.title}</h3>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    event.is_active
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {event.is_active ? 'Live' : 'Hidden'}
                  </span>
                </div>

                {event.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{event.description}</p>
                )}

                <div className="space-y-1 mb-4">
                  {event.event_date && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(event.event_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {event.event_time && ` · ${event.event_time.slice(0, 5)}`}
                    </div>
                  )}
                  {event.venue_name && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <MapPin className="w-3.5 h-3.5" />
                      {event.venue_name}
                    </div>
                  )}
                  {(event.min_age || event.dress_code) && (
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {event.min_age && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {event.min_age}+ only
                        </span>
                      )}
                      {event.dress_code && (
                        <span className="flex items-center gap-1">
                          <Info className="w-3.5 h-3.5" />
                          {event.dress_code}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => toggleActive(event)}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors px-2 py-1 rounded-lg hover:bg-slate-50"
                  >
                    {event.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {event.is_active ? 'Hide' : 'Show'}
                  </button>
                  <button
                    onClick={() => openEdit(event)}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors px-2 py-1 rounded-lg hover:bg-slate-50"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteId(event.id)}
                    className="flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Add / Edit Modal ─────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="font-bold text-gray-900 text-lg">
                {editingId ? 'Edit Event' : 'Add Event'}
              </h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Poster image — upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Event Poster</label>

                {/* Current image preview */}
                {form.poster_url ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 mb-3">
                    <img src={form.poster_url} alt="Event poster" className="w-full h-48 object-cover" />
                    <button
                      onClick={() => setForm(f => ({ ...f, poster_url: '' }))}
                      className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-lg hover:bg-black/70 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-teal/50 hover:bg-teal/5 transition-colors mb-3"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-teal border-t-transparent" />
                        <p className="text-xs text-gray-500">Uploading…</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-700">Click to upload your own poster</p>
                        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP · max 5MB</p>
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        setUploadError('Image must be under 5MB.')
                        return
                      }
                      handleImageUpload(file)
                    }
                  }}
                />
                {uploadError && <p className="text-xs text-red-500 mt-1 mb-2">{uploadError}</p>}

              </div>

              {/* Event title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Event Title *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Saturday Night Party"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 text-gray-900"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the event, lineup, atmosphere…"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 text-gray-900 resize-none"
                />
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Event Date</label>
                  <input
                    type="date"
                    value={form.event_date}
                    onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Time</label>
                  <input
                    type="time"
                    value={form.event_time}
                    onChange={e => setForm(f => ({ ...f, event_time: e.target.value }))}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 text-gray-900"
                  />
                </div>
              </div>

              {/* Venue */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Venue Name</label>
                <input
                  value={form.venue_name}
                  onChange={e => setForm(f => ({ ...f, venue_name: e.target.value }))}
                  placeholder="e.g. Fabric London"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Venue Address</label>
                <input
                  value={form.venue_address}
                  onChange={e => setForm(f => ({ ...f, venue_address: e.target.value }))}
                  placeholder="e.g. 77a Charterhouse St, London EC1M 3HN"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 text-gray-900"
                />
              </div>

              {/* Min age + dress code */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Min Age
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={form.min_age}
                    onChange={e => setForm(f => ({ ...f, min_age: e.target.value }))}
                    placeholder="e.g. 18"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dress Code</label>
                  <input
                    value={form.dress_code}
                    onChange={e => setForm(f => ({ ...f, dress_code: e.target.value }))}
                    placeholder="e.g. Smart casual"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 text-gray-900"
                  />
                </div>
              </div>

              {/* Link to service */}
              {services.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Link to Service (optional)</label>
                  <select
                    value={form.service_id}
                    onChange={e => setForm(f => ({ ...f, service_id: e.target.value }))}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 text-gray-900"
                  >
                    <option value="">All services / not linked</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    Link this poster to a specific ticket type / service.
                  </p>
                </div>
              )}

              {/* Visibility toggle */}
              <div className="flex items-center justify-between py-3 border-t border-slate-100">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Visible on booking page</p>
                  <p className="text-xs text-gray-400">Guests will see this event when browsing your booking page.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  className={`relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0 ${form.is_active ? 'bg-teal' : 'bg-slate-200'}`}
                  style={{ width: '42px', height: '22px' }}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={saving || !form.title.trim() || uploading}
                className="w-full py-3 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#0d9488' }}
              >
                {saving ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> Saving…</>
                ) : (
                  <><Check className="w-4 h-4" /> {editingId ? 'Save Changes' : 'Add Event'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirm Modal ────────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-1">Delete event?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              This will permanently remove the event and its poster. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-gray-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-bold text-white transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
