'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { fetchLatestTenant } from '@/lib/tenant'
import {
  Plus, Edit2, Trash2, GripVertical, Check, X,
  Car, Shield, Truck, Camera, Users, Star, Zap, Package,
  ChevronDown, ChevronUp, AlertCircle, Loader2
} from 'lucide-react'
import { VERTICALS } from '@/lib/verticals'
import type { Service } from '@/types/database'

type ServiceWithMeta = Service & { metadata?: any }

// ─── Supercar extras icons ────────────────────────────────────────────────────
const EXTRA_ICONS: Record<string, typeof Shield> = {
  damage:    Shield,
  delivery:  Truck,
  photo:     Camera,
  chauffeur: Users,
  other:     Package,
}

const BADGES = [
  { value: '',              label: 'No badge' },
  { value: 'most_popular',  label: '★ Most Popular' },
  { value: 'fan_favourite', label: '★ Fan Favourite' },
  { value: 'available',     label: '✓ Available' },
]

const CAR_COLOURS = [
  '#dc2626', '#ea580c', '#d97706', '#eab308',
  '#16a34a', '#0891b2', '#2563eb', '#7c3aed',
  '#db2777', '#111827', '#374151', '#9ca3af',
  '#ffffff', '#c9a44a',
]

// ─── Supercar fleet component ─────────────────────────────────────────────────
function SupercarFleetPage({
  services,
  tenantId,
  loading,
  onRefresh,
}: {
  services: ServiceWithMeta[]
  tenantId: string
  loading: boolean
  onRefresh: () => void
}) {
  const supabase = createSupabaseBrowserClient()

  const [showAddCar, setShowAddCar]     = useState(false)
  const [showAddExtra, setShowAddExtra] = useState(false)
  const [editingId, setEditingId]       = useState<string | null>(null)
  const [saving, setSaving]             = useState(false)

  const blankCar = {
    name: '', spec: '', colour: '#dc2626',
    pricePerDay: '', depositHold: '', badge: '',
  }
  const blankExtra = {
    name: '', description: '', priceType: 'per_day' as 'per_day' | 'flat',
    price: '', iconKey: 'other',
  }

  const [carForm, setCarForm]     = useState(blankCar)
  const [extraForm, setExtraForm] = useState(blankExtra)
  const [editData, setEditData]   = useState<any>({})

  const cars   = services.filter(s => s.metadata?.category === 'car'   || !s.metadata?.category)
  const extras = services.filter(s => s.metadata?.category === 'extra')

  // ── Save car ────────────────────────────────────────────────────────────────
  const saveCar = async () => {
    if (!tenantId) { alert('Tenant not loaded. Please refresh.'); return }
    if (!carForm.name.trim()) return
    setSaving(true)
    const payload = {
      tenant_id: tenantId,
      name: carForm.name.trim(),
      description: carForm.spec.trim(),
      price_pence: Math.round(parseFloat(carForm.pricePerDay || '0') * 100),
      deposit_pence: Math.round(parseFloat(carForm.depositHold || '0') * 100),
      requires_deposit: parseFloat(carForm.depositHold || '0') > 0,
      duration_minutes: 1440, // 1 day default
      is_active: true,
      sort_order: services.length,
      metadata: { category: 'car', colour: carForm.colour, badge: carForm.badge || null },
    }
    const { error } = await (supabase.from('services') as any).insert(payload)
    if (error) {
      alert(error.message || 'Could not add car. Please try again.')
      setSaving(false)
      return
    }
    setCarForm(blankCar)
    setShowAddCar(false)
    setSaving(false)
    onRefresh()
  }

  // ── Save extra ──────────────────────────────────────────────────────────────
  const saveExtra = async () => {
    if (!tenantId) { alert('Tenant not loaded. Please refresh.'); return }
    if (!extraForm.name.trim()) return
    setSaving(true)
    const price = Math.round(parseFloat(extraForm.price || '0') * 100)
    const payload = {
      tenant_id: tenantId,
      name: extraForm.name.trim(),
      description: extraForm.description.trim(),
      price_pence: price,
      deposit_pence: 0,
      requires_deposit: false,
      duration_minutes: 0,
      is_active: true,
      sort_order: services.length,
      metadata: {
        category: 'extra',
        price_type: extraForm.priceType,
        icon_key: extraForm.iconKey,
      },
    }
    const { error } = await (supabase.from('services') as any).insert(payload)
    if (error) {
      alert(error.message || 'Could not add extra. Please try again.')
      setSaving(false)
      return
    }
    setExtraForm(blankExtra)
    setShowAddExtra(false)
    setSaving(false)
    onRefresh()
  }

  const toggleActive = async (s: ServiceWithMeta) => {
    if (!tenantId) { alert('Tenant not loaded. Please refresh.'); return }
    const { error } = await (supabase
      .from('services') as any)
      .update({ is_active: !s.is_active })
      .eq('id', s.id)
      .eq('tenant_id', tenantId)
    if (error) {
      alert(error.message || 'Could not update status.')
      return
    }
    onRefresh()
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this item? This cannot be undone.')) return
    if (!tenantId) { alert('Tenant not loaded. Please refresh.'); return }
    const { error } = await (supabase
      .from('services') as any)
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
    if (error) {
      alert(error.message || 'Could not delete item.')
      return
    }
    onRefresh()
  }

  const saveEdit = async (id: string) => {
    if (!tenantId) { alert('Tenant not loaded. Please refresh.'); return }
    const { error } = await (supabase
      .from('services') as any)
      .update(editData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
    if (error) {
      alert(error.message || 'Could not save changes.')
      return
    }
    setEditingId(null)
    onRefresh()
  }

  const priceLabel = (s: ServiceWithMeta) => {
    const meta = s.metadata as any
    if (meta?.category === 'extra') {
      return meta.price_type === 'flat'
        ? `${formatCurrency(s.price_pence)} flat`
        : `${formatCurrency(s.price_pence)}/day`
    }
    return `${formatCurrency(s.price_pence)}/day`
  }

  const ExtraIcon = (key: string) => {
    const Icon = EXTRA_ICONS[key] || Package
    return <Icon className="w-4 h-4" />
  }

  return (
    <div className="space-y-8 max-w-5xl">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-slate-900">
          Fleet & Extras
        </h1>
        <p className="text-sm mt-0.5 text-slate-500">
          {cars.filter(c => c.is_active).length} vehicles available ·{' '}
          {extras.filter(e => e.is_active).length} optional extras
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading fleet…
        </div>
      )}

      {/* ── Fleet ─────────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: '#ffffff', border: '1px solid rgba(201,164,74,0.25)', boxShadow: '0 14px 30px rgba(15,23,42,0.08)' }}
      >
        {/* Section header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(37,99,235,0.12)' }}>
              <Car className="w-4 h-4" style={{ color: '#1d4ed8' }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Your Fleet</p>
              <p className="text-xs text-slate-500">
                Cars available for rental
              </p>
            </div>
          </div>
          <button
            onClick={() => { setShowAddCar(true); setShowAddExtra(false) }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: '#c9a44a', color: '#0f172a' }}
          >
            <Plus className="w-3.5 h-3.5" /> Add Car
          </button>
        </div>

        {/* Add car form */}
        {showAddCar && (
          <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(15,23,42,0.06)', background: '#f8fafc' }}>
            <p className="text-sm font-semibold mb-4 text-slate-900">New Vehicle</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>
                  Vehicle Name *
                </label>
                <input
                  value={carForm.name}
                  onChange={e => setCarForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Lamborghini Huracán"
                  className="w-full h-10 px-3 rounded-xl text-sm"
                  style={{ background: '#ffffff', border: '1px solid rgba(37,99,235,0.15)', color: '#0f172a', outline: 'none' }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>
                  Spec Line
                </label>
                <input
                  value={carForm.spec}
                  onChange={e => setCarForm(p => ({ ...p, spec: e.target.value }))}
                  placeholder="e.g. V10 · 630bhp · 201mph"
                  className="w-full h-10 px-3 rounded-xl text-sm"
                  style={{ background: '#ffffff', border: '1px solid rgba(37,99,235,0.15)', color: '#0f172a', outline: 'none' }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>
                  Price Per Day (£)
                </label>
                <input
                  type="number"
                  value={carForm.pricePerDay}
                  onChange={e => setCarForm(p => ({ ...p, pricePerDay: e.target.value }))}
                  placeholder="e.g. 895"
                  className="w-full h-10 px-3 rounded-xl text-sm"
                  style={{ background: '#ffffff', border: '1px solid rgba(37,99,235,0.15)', color: '#0f172a', outline: 'none' }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>
                  Security Deposit Hold (£)
                </label>
                <input
                  type="number"
                  value={carForm.depositHold}
                  onChange={e => setCarForm(p => ({ ...p, depositHold: e.target.value }))}
                  placeholder="e.g. 5000"
                  className="w-full h-10 px-3 rounded-xl text-sm"
                  style={{ background: '#ffffff', border: '1px solid rgba(37,99,235,0.15)', color: '#0f172a', outline: 'none' }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>
                  Car Colour
                </label>
                <div className="flex flex-wrap gap-2">
                  {CAR_COLOURS.map(c => (
                    <button
                      key={c}
                      onClick={() => setCarForm(p => ({ ...p, colour: c }))}
                      className="w-7 h-7 rounded-full transition-all"
                      style={{
                        background: c,
                        border: carForm.colour === c ? '2px solid #c9a44a' : '2px solid transparent',
                        outline: carForm.colour === c ? '2px solid rgba(201,164,74,0.5)' : 'none',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>
                  Badge
                </label>
                <select
                  value={carForm.badge}
                  onChange={e => setCarForm(p => ({ ...p, badge: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl text-sm"
                  style={{ background: '#ffffff', border: '1px solid rgba(37,99,235,0.15)', color: '#0f172a', outline: 'none' }}
                >
                  {BADGES.map(b => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={saveCar}
                disabled={saving || !carForm.name.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all hover:opacity-90"
                style={{ background: '#c9a44a', color: '#0f172a' }}
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <Check className="w-3.5 h-3.5" /> Add to Fleet
              </button>
              <button
                onClick={() => setShowAddCar(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{ color: '#64748b', border: '1px solid rgba(37,99,235,0.2)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Car cards grid */}
        {!loading && cars.length === 0 ? (
          <div className="py-14 text-center">
            <Car className="w-10 h-10 mx-auto mb-3" style={{ color: '#c9a44a' }} />
            <p className="text-sm text-slate-500">No vehicles in your fleet yet</p>
            <button
              onClick={() => setShowAddCar(true)}
              className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: '#c9a44a', color: '#0f172a' }}
            >
              Add your first car
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {cars.map(car => {
              const meta = car.metadata as any || {}
              const colour = meta.colour || '#dc2626'
              const badge  = meta.badge  || ''
              const isEditing = editingId === car.id
              return (
                <div
                  key={car.id}
                  className="rounded-xl p-4 transition-all"
                  style={{
                    background: '#ffffff',
                    border: '1px solid rgba(37,99,235,0.12)',
                    boxShadow: '0 10px 24px rgba(15,23,42,0.06)',
                    opacity: car.is_active ? 1 : 0.45,
                  }}
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        value={editData.name || ''}
                        onChange={e => setEditData((p: any) => ({ ...p, name: e.target.value }))}
                        className="w-full h-9 px-3 rounded-lg text-sm"
                        style={{ background: '#ffffff', border: '1px solid rgba(37,99,235,0.15)', color: '#0f172a', outline: 'none' }}
                        placeholder="Car name"
                      />
                      <input
                        value={editData.description || ''}
                        onChange={e => setEditData((p: any) => ({ ...p, description: e.target.value }))}
                        className="w-full h-9 px-3 rounded-lg text-xs"
                        style={{ background: '#ffffff', border: '1px solid rgba(37,99,235,0.15)', color: '#0f172a', outline: 'none' }}
                        placeholder="Spec line"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          value={(editData.price_pence || 0) / 100}
                          onChange={e => setEditData((p: any) => ({ ...p, price_pence: Math.round(parseFloat(e.target.value || '0') * 100) }))}
                          className="h-9 px-3 rounded-lg text-sm"
                          style={{ background: '#ffffff', border: '1px solid rgba(37,99,235,0.15)', color: '#0f172a', outline: 'none' }}
                          placeholder="£/day"
                        />
                        <input
                          type="number"
                          value={(editData.deposit_pence || 0) / 100}
                          onChange={e => setEditData((p: any) => ({ ...p, deposit_pence: Math.round(parseFloat(e.target.value || '0') * 100) }))}
                          className="h-9 px-3 rounded-lg text-sm"
                          style={{ background: '#ffffff', border: '1px solid rgba(37,99,235,0.15)', color: '#0f172a', outline: 'none' }}
                          placeholder="Deposit £"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(car.id)}
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold"
                          style={{ background: '#c9a44a', color: '#0f172a' }}>
                          Save
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="flex-1 py-1.5 rounded-lg text-xs"
                          style={{ color: '#64748b', border: '1px solid rgba(37,99,235,0.2)' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Colour circle + badge */}
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className="w-10 h-10 rounded-full shadow-lg"
                          style={{ background: colour, boxShadow: `0 4px 12px ${colour}60` }}
                        />
                        {badge && (
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{
                              background: badge === 'most_popular' || badge === 'fan_favourite'
                                ? 'rgba(201,164,74,0.15)'
                                : 'rgba(34,197,94,0.15)',
                              color: badge === 'most_popular' || badge === 'fan_favourite'
                                ? '#c9a44a'
                                : '#22c55e',
                            }}
                          >
                            {badge === 'most_popular' && '★ Most Popular'}
                            {badge === 'fan_favourite' && '★ Fan Favourite'}
                            {badge === 'available' && '✓ Available'}
                          </span>
                        )}
                      </div>

                      {/* Car name + spec */}
                      <p className="font-bold text-sm leading-tight mb-0.5 text-slate-900">{car.name}</p>
                      {car.description && (
                        <p className="text-xs mb-3 text-slate-500">{car.description}</p>
                      )}

                      {/* Price + deposit */}
                      <p className="font-bold text-base mb-1" style={{ color: '#c9a44a' }}>
                        {formatCurrency(car.price_pence)}/day
                      </p>
                      {car.deposit_pence > 0 && (
                        <p className="text-xs mb-3 text-slate-400">
                          {formatCurrency(car.deposit_pence)} security hold
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2"
                        style={{ borderTop: '1px solid rgba(15,23,42,0.08)' }}>
                        <button
                          onClick={() => toggleActive(car)}
                          className="text-xs font-medium transition-colors"
                          style={{ color: car.is_active ? '#16a34a' : '#94a3b8' }}
                        >
                          {car.is_active ? 'Active' : 'Hidden'}
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingId(car.id)
                              setEditData({ name: car.name, description: car.description, price_pence: car.price_pence, deposit_pence: car.deposit_pence })
                            }}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: '#64748b' }}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteItem(car.id)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: '#64748b' }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Optional Extras ──────────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: '#ffffff', border: '1px solid rgba(201,164,74,0.25)', boxShadow: '0 14px 30px rgba(15,23,42,0.08)' }}
      >
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(201,164,74,0.12)' }}>
              <Shield className="w-4 h-4" style={{ color: '#c9a44a' }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Optional Extras</p>
              <p className="text-xs text-slate-500">
                Damage waiver, delivery, add-ons customers can select at booking
              </p>
            </div>
          </div>
          <button
            onClick={() => { setShowAddExtra(true); setShowAddCar(false) }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: 'rgba(201,164,74,0.12)', color: '#c9a44a', border: '1px solid rgba(201,164,74,0.35)' }}
          >
            <Plus className="w-3.5 h-3.5" /> Add Extra
          </button>
        </div>

        {/* Add extra form */}
        {showAddExtra && (
          <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(15,23,42,0.06)', background: '#f8fafc' }}>
            <p className="text-sm font-semibold mb-4 text-slate-900">New Optional Extra</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>
                  Extra Name *
                </label>
                <input
                  value={extraForm.name}
                  onChange={e => setExtraForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Damage Waiver"
                  className="w-full h-10 px-3 rounded-xl text-sm"
                  style={{ background: '#ffffff', border: '1px solid rgba(37,99,235,0.15)', color: '#0f172a', outline: 'none' }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>
                  Description
                </label>
                <input
                  value={extraForm.description}
                  onChange={e => setExtraForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. Reduce excess from £5,000 to £500"
                  className="w-full h-10 px-3 rounded-xl text-sm"
                  style={{ background: '#ffffff', border: '1px solid rgba(37,99,235,0.15)', color: '#0f172a', outline: 'none' }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>
                  Price (£)
                </label>
                <input
                  type="number"
                  value={extraForm.price}
                  onChange={e => setExtraForm(p => ({ ...p, price: e.target.value }))}
                  placeholder="e.g. 89"
                  className="w-full h-10 px-3 rounded-xl text-sm"
                  style={{ background: '#ffffff', border: '1px solid rgba(37,99,235,0.15)', color: '#0f172a', outline: 'none' }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>
                  Pricing Type
                </label>
                <select
                  value={extraForm.priceType}
                  onChange={e => setExtraForm(p => ({ ...p, priceType: e.target.value as 'per_day' | 'flat' }))}
                  className="w-full h-10 px-3 rounded-xl text-sm"
                  style={{ background: '#ffffff', border: '1px solid rgba(37,99,235,0.15)', color: '#0f172a', outline: 'none' }}
                >
                  <option value="per_day">Per day</option>
                  <option value="flat">Flat fee</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>
                  Icon
                </label>
                <select
                  value={extraForm.iconKey}
                  onChange={e => setExtraForm(p => ({ ...p, iconKey: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl text-sm"
                  style={{ background: '#ffffff', border: '1px solid rgba(37,99,235,0.15)', color: '#0f172a', outline: 'none' }}
                >
                  <option value="damage">🛡 Damage Waiver</option>
                  <option value="delivery">🚚 Delivery & Collection</option>
                  <option value="photo">📸 Photoshoot</option>
                  <option value="chauffeur">👤 Chauffeur</option>
                  <option value="other">📦 Other</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={saveExtra}
                disabled={saving || !extraForm.name.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ background: '#c9a44a', color: '#0f172a' }}
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <Check className="w-3.5 h-3.5" /> Add Extra
              </button>
              <button
                onClick={() => setShowAddExtra(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{ color: '#64748b', border: '1px solid rgba(37,99,235,0.2)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Extras list */}
        {!loading && extras.length === 0 ? (
          <div className="py-10 text-center">
            <Shield className="w-8 h-8 mx-auto mb-2" style={{ color: '#c9a44a' }} />
            <p className="text-sm text-slate-500">
              No extras yet — add damage waiver, delivery, etc.
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(15,23,42,0.06)' }}>
            {extras.map(extra => {
              const meta = extra.metadata as any || {}
              const IconComp = EXTRA_ICONS[meta.icon_key || 'other'] || Package
              return (
                <div key={extra.id} className="flex items-center gap-4 px-6 py-4"
                  style={{ opacity: extra.is_active ? 1 : 0.4 }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(201,164,74,0.12)' }}>
                    <IconComp className="w-4 h-4" style={{ color: '#c9a44a' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{extra.name}</p>
                    {extra.description && (
                      <p className="text-xs truncate text-slate-500">{extra.description}</p>
                    )}
                  </div>
                  <p className="text-sm font-bold flex-shrink-0" style={{ color: '#c9a44a' }}>
                    {formatCurrency(extra.price_pence)}{meta.price_type === 'flat' ? ' flat' : '/day'}
                  </p>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleActive(extra)}
                      className="w-8 h-4 rounded-full transition-all relative"
                      style={{ background: extra.is_active ? '#c9a44a' : 'rgba(148,163,184,0.35)' }}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${extra.is_active ? 'left-4' : 'left-0.5'}`} />
                    </button>
                    <button onClick={() => deleteItem(extra.id)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: '#64748b' }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Default extras hint if empty */}
        {!loading && extras.length === 0 && (
          <div className="px-6 pb-5">
            <p className="text-xs mb-2 text-slate-500">Suggested extras to add:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'Damage Waiver', desc: 'Reduce excess from £5,000 to £500', price: '89', type: 'per_day', icon: 'damage' },
                { name: 'Delivery & Collection', desc: 'We deliver to your address', price: '150', type: 'flat', icon: 'delivery' },
                { name: 'Professional Photoshoot', desc: '30 min shoot with the car', price: '200', type: 'flat', icon: 'photo' },
                { name: 'Chauffeur Option', desc: 'Professional driver included', price: '250', type: 'per_day', icon: 'chauffeur' },
              ].map(s => (
                <button
                  key={s.name}
                  onClick={async () => {
                    if (!tenantId) { alert('Tenant not loaded. Please refresh.'); return }
                    const { error } = await (supabase.from('services') as any).insert({
                      tenant_id: tenantId,
                      name: s.name,
                      description: s.desc,
                      price_pence: parseInt(s.price) * 100,
                      deposit_pence: 0,
                      requires_deposit: false,
                      duration_minutes: 0,
                      is_active: true,
                      sort_order: services.length,
                      metadata: { category: 'extra', price_type: s.type, icon_key: s.icon },
                    })
                    if (error) {
                      alert(error.message || 'Could not add extra.')
                      return
                    }
                    onRefresh()
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                  style={{ background: '#ffffff', color: '#1d4ed8', border: '1px solid rgba(201,164,74,0.35)' }}
                >
                  + {s.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Info notice ──────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 p-4 rounded-xl"
        style={{ background: 'rgba(201,164,74,0.08)', border: '1px solid rgba(201,164,74,0.25)' }}>
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#c9a44a' }} />
        <p className="text-xs leading-relaxed text-slate-600">
          Cars appear on your booking page for customers to select. Optional extras are shown during checkout.
          The security deposit hold is collected via Stripe and released after the rental ends.
        </p>
      </div>

    </div>
  )
}

// ─── Generic services page (all other verticals) ──────────────────────────────
function GenericServicesPage({
  services,
  tenantId,
  verticalId,
  loading,
  onRefresh,
}: {
  services: Service[]
  tenantId: string
  verticalId: string | null
  loading: boolean
  onRefresh: () => void
}) {
  const supabase = createSupabaseBrowserClient()
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [editData, setEditData]     = useState<Partial<Service>>({})
  const [adding, setAdding]         = useState(false)
  const [newService, setNewService] = useState({
    name: '', description: '', price_pence: 0, duration_minutes: 60, deposit_pence: 0, requires_deposit: false,
  })

  const vertical = verticalId ? VERTICALS[verticalId as keyof typeof VERTICALS] : null
  const servicePlaceholder = (() => {
    if (!vertical) return 'e.g. Service name'
    const top = vertical.defaultServices?.[0]?.name
    return top ? `e.g. ${top}` : 'e.g. Service name'
  })()

  const toggleActive = async (s: Service) => {
    await (supabase.from('services') as any).update({ is_active: !s.is_active }).eq('id', s.id).eq('tenant_id', s.tenant_id)
    onRefresh()
  }

  const startEdit = (s: Service) => {
    setEditingId(s.id)
    setEditData({ name: s.name, description: s.description, price_pence: s.price_pence, duration_minutes: s.duration_minutes, deposit_pence: s.deposit_pence, requires_deposit: s.requires_deposit })
  }

  const saveEdit = async () => {
    if (!editingId) return
    await (supabase.from('services') as any).update(editData).eq('id', editingId).eq('tenant_id', tenantId)
    setEditingId(null)
    onRefresh()
  }

  const deleteService = async (id: string) => {
    if (!confirm('Delete this service? This cannot be undone.')) return
    await (supabase.from('services') as any).delete().eq('id', id).eq('tenant_id', tenantId)
    onRefresh()
  }

  const addService = async () => {
    if (!newService.name) return
    if (!tenantId) return
    const { data } = await (supabase.from('services') as any).insert({
      ...newService,
      tenant_id: tenantId,
      is_active: true,
      sort_order: services.length,
    }).select().single()
    if (data) {
      setNewService({ name: '', description: '', price_pence: 0, duration_minutes: 60, deposit_pence: 0, requires_deposit: false })
      setAdding(false)
      onRefresh()
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-dark">Services</h1>
          <p className="text-sm text-dark/50">{services.filter(s => s.is_active).length} active services</p>
        </div>
        <button onClick={() => setAdding(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      {adding && (
        <div className="bg-white rounded-2xl border-2 border-teal p-6 space-y-4">
          <h3 className="font-semibold text-dark">New Service</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-dark/50 block mb-1">Service Name *</label>
              <input value={newService.name} onChange={e => setNewService(p => ({ ...p, name: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-border text-sm focus:outline-none focus:border-teal" placeholder={servicePlaceholder} />
            </div>
            <div>
              <label className="text-xs text-dark/50 block mb-1">Description</label>
              <input value={newService.description} onChange={e => setNewService(p => ({ ...p, description: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-border text-sm focus:outline-none focus:border-teal" placeholder="Short description" />
            </div>
            <div>
              <label className="text-xs text-dark/50 block mb-1">Price (£)</label>
              <input type="number" value={newService.price_pence / 100} step="0.01" min="0"
                onChange={e => setNewService(p => ({ ...p, price_pence: Math.round(parseFloat(e.target.value || '0') * 100) }))}
                className="w-full h-10 px-3 rounded-xl border border-border text-sm focus:outline-none focus:border-teal" />
            </div>
            <div>
              <label className="text-xs text-dark/50 block mb-1">Duration (minutes)</label>
              <input type="number" value={newService.duration_minutes} step="5" min="5"
                onChange={e => setNewService(p => ({ ...p, duration_minutes: parseInt(e.target.value || '30') }))}
                className="w-full h-10 px-3 rounded-xl border border-border text-sm focus:outline-none focus:border-teal" />
            </div>
            <div>
              <label className="text-xs text-dark/50 block mb-1">Deposit (£)</label>
              <input type="number" value={newService.deposit_pence / 100} step="0.01" min="0"
                onChange={e => setNewService(p => ({ ...p, deposit_pence: Math.round(parseFloat(e.target.value || '0') * 100) }))}
                className="w-full h-10 px-3 rounded-xl border border-border text-sm focus:outline-none focus:border-teal" />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={newService.requires_deposit}
                  onChange={e => setNewService(p => ({ ...p, requires_deposit: e.target.checked }))} className="rounded" />
                <span className="text-sm text-dark/70">Require deposit to book</span>
              </label>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={addService} className="btn-primary py-2 px-6 flex items-center gap-2">
              <Check className="w-4 h-4" /> Save Service
            </button>
            <button onClick={() => setAdding(false)} className="btn-secondary py-2 px-4 flex items-center gap-2">
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-dark/40">Loading services…</div>
        ) : services.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-dark/40 mb-4">No services yet</p>
            <button onClick={() => setAdding(true)} className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add your first service
            </button>
          </div>
        ) : services.map((s, idx) => (
          <div key={s.id} className={`p-5 flex items-center gap-4 ${idx > 0 ? 'border-t border-border' : ''} ${!s.is_active ? 'opacity-50' : ''}`}>
            <GripVertical className="w-4 h-4 text-dark/20 flex-shrink-0 cursor-grab" />
            {editingId === s.id ? (
              <div className="flex-1 grid sm:grid-cols-5 gap-3 items-center">
                <input value={editData.name || ''} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))}
                  className="sm:col-span-2 h-9 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-teal" />
                <input type="number" value={(editData.price_pence || 0) / 100} step="0.01"
                  onChange={e => setEditData(p => ({ ...p, price_pence: Math.round(parseFloat(e.target.value || '0') * 100) }))}
                  className="h-9 px-3 rounded-lg border border-border text-sm" placeholder="Price £" />
                <input type="number" value={editData.duration_minutes || 60}
                  onChange={e => setEditData(p => ({ ...p, duration_minutes: parseInt(e.target.value || '30') }))}
                  className="h-9 px-3 rounded-lg border border-border text-sm" placeholder="Mins" />
                <div className="flex items-center gap-2">
                  <button onClick={saveEdit} className="flex items-center gap-1 text-teal text-sm font-medium hover:underline">
                    <Check className="w-4 h-4" /> Save
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-dark/40 text-sm hover:underline">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-dark text-sm">{s.name}</p>
                  {s.description && <p className="text-xs text-dark/50 mt-0.5 truncate">{s.description}</p>}
                </div>
                <div className="hidden sm:flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-dark/40 text-xs">Price</p>
                    <p className="font-semibold text-dark">{formatCurrency(s.price_pence)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-dark/40 text-xs">Duration</p>
                    <p className="font-semibold text-dark">{s.duration_minutes}min</p>
                  </div>
                  {s.requires_deposit && (
                    <div className="text-center">
                      <p className="text-dark/40 text-xs">Deposit</p>
                      <p className="font-semibold text-teal">{formatCurrency(s.deposit_pence)}</p>
                    </div>
                  )}
                </div>
              </>
            )}
            {editingId !== s.id && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <button type="button" onClick={() => toggleActive(s)}
                  className={`w-10 h-5 rounded-full transition-all relative ${s.is_active ? 'bg-teal' : 'bg-border'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${s.is_active ? 'left-5' : 'left-0.5'}`} />
                </button>
                <button onClick={() => startEdit(s)} className="p-1.5 rounded-lg hover:bg-gray-100 text-dark/40 hover:text-dark transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => deleteService(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-dark/40 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function ServicesPage() {
  const supabase = createSupabaseBrowserClient()
  const [services,   setServices]   = useState<Service[]>([])
  const [loading,    setLoading]    = useState(true)
  const [verticalId, setVerticalId] = useState<string | null>(null)
  const [tenantId,   setTenantId]   = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const tenant = await fetchLatestTenant(supabase, 'id, vertical')
      setVerticalId(tenant?.vertical || null)
      setTenantId(tenant?.id || null)
      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', tenant?.id || '')
        .order('sort_order')
        .order('created_at')
      setServices(data || [])
    } catch {
      setServices([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (verticalId === 'supercar') {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-[#f8fafc] px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <SupercarFleetPage
            services={services}
            tenantId={tenantId || ''}
            loading={loading}
            onRefresh={load}
          />
        </div>
      </div>
    )
  }

  return (
    <GenericServicesPage
      services={services}
      tenantId={tenantId || ''}
      verticalId={verticalId}
      loading={loading}
      onRefresh={load}
    />
  )
}
