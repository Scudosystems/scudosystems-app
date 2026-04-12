'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, UserCircle, X, Check, Loader2 } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { fetchLatestTenant } from '@/lib/tenant'
import { VERTICALS } from '@/lib/verticals'
import type { Staff } from '@/types/database'

export default function StaffPage() {
  const supabase = createSupabaseBrowserClient()
  const [staff, setStaff] = useState<Staff[]>([])
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', role: '', bio: '' })
  const [editData, setEditData] = useState<Partial<Staff>>({})
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [savingNew, setSavingNew] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [verticalId, setVerticalId] = useState<string | null>(null)

  const vertical = verticalId ? VERTICALS[verticalId as keyof typeof VERTICALS] : null
  const emptyMessage =
    verticalId === 'supercar'
      ? 'Staff profiles are optional for rentals. Add agents only if you want customers to pick a concierge or driver.'
      : `No ${vertical?.staffLabel?.toLowerCase() || 'staff members'} yet. Add your team so customers can choose who they book with.`

  useEffect(() => {
    fetch('/api/staff')
      .then(r => r.json())
      .then(data => setStaff(Array.isArray(data) ? data : []))
      .catch(console.error)

    fetchLatestTenant(supabase, 'vertical')
      .then(t => setVerticalId(t?.vertical || null))
      .catch(() => setVerticalId(null))
  }, [])

  const addMember = async () => {
    if (!form.name) return
    setSavingNew(true)
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        setStaff(p => [...p, data])
        setForm({ name: '', role: '', bio: '' })
        setAdding(false)
      } else {
        alert(data.error || 'Failed to add staff member')
      }
    } finally {
      setSavingNew(false)
    }
  }

  const saveEdit = async () => {
    if (!editId) return
    setSavingEdit(true)
    try {
      const res = await fetch('/api/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, ...editData }),
      })
      const data = await res.json()
      if (res.ok) {
        setStaff(p => p.map(s => s.id === editId ? { ...s, ...editData } as Staff : s))
        setEditId(null)
      } else {
        alert(data.error || 'Failed to save changes')
      }
    } finally {
      setSavingEdit(false)
    }
  }

  const toggleActive = async (s: Staff) => {
    const res = await fetch('/api/staff', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, is_active: !s.is_active }),
    })
    if (res.ok) {
      setStaff(p => p.map(m => m.id === s.id ? { ...m, is_active: !s.is_active } : m))
    }
  }

  const deleteMember = async (id: string) => {
    if (!confirm('Remove this staff member? This will also delete their job offers and availability slots. Booking history is kept.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/staff?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        setStaff(p => p.filter(s => s.id !== id))
      } else {
        alert(data.error || 'Could not remove staff member')
      }
    } finally {
      setDeletingId(null)
    }
  }

  const staffNamePlaceholder = vertical?.id === 'dental'
    ? 'e.g. Dr Amelia Hart'
    : vertical?.id === 'barber'
      ? 'e.g. Jordan Blake'
      : vertical?.id === 'nightclub'
        ? 'e.g. Jade Collins'
        : 'e.g. Emma Johnson'
  const rolePlaceholder = vertical
    ? `e.g. Senior ${vertical.staffLabel}`
    : 'e.g. Senior Stylist'

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-dark">Staff</h1>
          <p className="text-sm text-dark/50">{staff.filter(s => s.is_active).length} active members</p>
        </div>
        <button onClick={() => setAdding(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      {adding && (
        <div className="bg-white rounded-2xl border-2 border-teal p-6 space-y-4">
          <h3 className="font-semibold text-dark">New Team Member</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-dark/50 block mb-1">Full Name *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-border text-sm focus:outline-none focus:border-teal" placeholder={staffNamePlaceholder} />
            </div>
            <div>
              <label className="text-xs text-dark/50 block mb-1">Role / Title</label>
              <input value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-border text-sm focus:outline-none focus:border-teal" placeholder={rolePlaceholder} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-dark/50 block mb-1">Bio (optional)</label>
              <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={2}
                className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-teal resize-none" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={addMember} disabled={savingNew} className="btn-primary py-2 px-5 flex items-center gap-2">
              {savingNew ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
            </button>
            <button onClick={() => setAdding(false)} className="btn-secondary py-2 px-4 flex items-center gap-2"><X className="w-4 h-4" /> Cancel</button>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {staff.map(s => (
          <div key={s.id} className={`bg-white rounded-2xl border border-border p-5 ${!s.is_active ? 'opacity-60' : ''}`}>
            {editId === s.id ? (
              <div className="space-y-3">
                <input value={editData.name || ''} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-border text-sm" placeholder="Name" />
                <input value={editData.role || ''} onChange={e => setEditData(p => ({ ...p, role: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-border text-sm" placeholder="Role" />
                <textarea value={editData.bio || ''} onChange={e => setEditData(p => ({ ...p, bio: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm resize-none" placeholder="Bio" />
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={savingEdit} className="text-teal text-sm font-medium hover:underline flex items-center gap-1">
                    {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}Save
                  </button>
                  <button onClick={() => setEditId(null)} className="text-dark/40 text-sm hover:underline">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-teal/10 flex items-center justify-center">
                    {s.avatar_url ? (
                      <img src={s.avatar_url} alt={s.name} className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <UserCircle className="w-7 h-7 text-teal" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-dark text-sm">{s.name}</p>
                    {s.role && <p className="text-xs text-dark/50">{s.role}</p>}
                  </div>
                </div>
                {s.bio && <p className="text-xs text-dark/60 mb-4 leading-relaxed">{s.bio}</p>}
                <div className="flex items-center justify-between">
                  <button onClick={() => toggleActive(s)}
                    className={`w-9 h-5 rounded-full transition-all relative ${s.is_active ? 'bg-teal' : 'bg-border'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${s.is_active ? 'left-4' : 'left-0.5'}`} />
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditId(s.id); setEditData({ name: s.name, role: s.role || '', bio: s.bio || '' }) }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-dark/40 hover:text-dark transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteMember(s.id)}
                      disabled={deletingId === s.id}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-dark/40 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      {deletingId === s.id
                        ? <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                        : <Trash2 className="w-4 h-4" />
                      }
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
        {staff.length === 0 && (
          <div className="sm:col-span-2 text-center py-12 text-dark/40">
            <UserCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  )
}
