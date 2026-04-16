'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2, ShieldCheck, AlertTriangle, PlugZap, QrCode, RadioTower, Save } from 'lucide-react'
import type { OperatorConfig } from '@/lib/self-serve/types'
import { INDUSTRY_BLUEPRINTS } from '@/lib/self-serve/blueprints'

export default function AdminSetupPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<OperatorConfig | null>(null)
  const [businessName, setBusinessName] = useState('')

  useEffect(() => {
    fetch('/api/operator-config')
      .then(async res => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load operator config')
        setConfig(data.config)
        setBusinessName(data.tenant?.business_name || '')
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const blueprint = useMemo(() => (config ? INDUSTRY_BLUEPRINTS[config.industry] : null), [config])

  const updateServicePoint = (index: number, patch: Partial<OperatorConfig['servicePoints'][number]>) => {
    setConfig(current => current ? {
      ...current,
      servicePoints: current.servicePoints.map((point, i) => i === index ? { ...point, ...patch } : point),
    } : current)
  }

  const save = async () => {
    if (!config) return
    setSaving(true)
    setError(null)
    const res = await fetch('/api/operator-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed to save operator config')
      setSaving(false)
      return
    }
    setConfig(data.config)
    setSaving(false)
  }

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-slate-600"><Loader2 className="w-6 h-6 animate-spin" /></div>
  }

  if (!config || !blueprint) {
    return <div className="min-h-screen grid place-items-center text-slate-600">Could not load operator setup.</div>
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Operator setup foundation</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Self-serve onboarding admin</h1>
            <p className="mt-3 max-w-3xl text-lg text-slate-600">
              Built from the LuxWash reference flow, but hardened for self-serve onboarding, provider validation,
              launch readiness checks and white-label rollout across unattended infrastructure businesses.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/go-live" className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-5 py-3 text-slate-700 font-medium">
              Go-live checklist
            </Link>
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-white font-medium disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save foundation
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>
        )}

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <h2 className="text-xl font-semibold">Launch readiness</h2>
                <p className="text-sm text-slate-500">Validation-first onboarding to prevent the LuxWash-era setup failures.</p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {config.validationChecks.map(check => (
                <div key={check.key} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{check.label}</span>
                    <span className={`text-xs font-semibold uppercase tracking-[0.15em] ${check.status === 'pass' ? 'text-emerald-600' : check.status === 'warn' ? 'text-amber-600' : 'text-red-600'}`}>{check.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{check.message}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-slate-950 text-white p-6 shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">Current rollout</p>
            <h2 className="mt-3 text-2xl font-semibold">{businessName || config.businessProfile.tradingName}</h2>
            <p className="mt-2 text-slate-300">Industry: {blueprint.label}</p>
            <div className="mt-6 space-y-4 text-sm text-slate-200">
              <div className="flex items-start gap-3"><PlugZap className="w-4 h-4 mt-0.5 text-emerald-400" /><span>Payment provider: {config.providerConfig.paymentProvider}</span></div>
              <div className="flex items-start gap-3"><RadioTower className="w-4 h-4 mt-0.5 text-sky-400" /><span>Machine provider: {config.providerConfig.machineProvider}</span></div>
              <div className="flex items-start gap-3"><QrCode className="w-4 h-4 mt-0.5 text-violet-400" /><span>{config.servicePoints.length} {blueprint.servicePointPlural.toLowerCase()} prepared for QR launch</span></div>
              <div className="flex items-start gap-3"><AlertTriangle className="w-4 h-4 mt-0.5 text-amber-400" /><span>Go live only after all validation checks pass cleanly.</span></div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold">{blueprint.servicePointPlural}</h2>
              <p className="text-sm text-slate-500">Map each live service point clearly so QR links, provider IDs and reporting stay aligned.</p>
            </div>
          </div>
          <div className="space-y-4">
            {config.servicePoints.map((point, index) => (
              <div key={`${point.externalId}-${index}`} className="grid gap-4 rounded-2xl border border-slate-200 p-4 lg:grid-cols-6">
                <input className="rounded-xl border border-slate-300 px-4 py-3" value={point.name} onChange={e => updateServicePoint(index, { name: e.target.value })} placeholder={`${blueprint.servicePointLabel} name`} />
                <input className="rounded-xl border border-slate-300 px-4 py-3" value={point.publicLabel} onChange={e => updateServicePoint(index, { publicLabel: e.target.value })} placeholder="Public label" />
                <input className="rounded-xl border border-slate-300 px-4 py-3" value={point.externalId} onChange={e => updateServicePoint(index, { externalId: e.target.value })} placeholder="External ID" />
                <input className="rounded-xl border border-slate-300 px-4 py-3" value={point.providerSiteId || ''} onChange={e => updateServicePoint(index, { providerSiteId: e.target.value })} placeholder="Provider site ID" />
                <input className="rounded-xl border border-slate-300 px-4 py-3" value={point.providerBoxId || ''} onChange={e => updateServicePoint(index, { providerBoxId: e.target.value })} placeholder="Provider box / device ID" />
                <label className="flex items-center gap-3 rounded-xl border border-slate-300 px-4 py-3 text-sm"><input type="checkbox" checked={point.liveModeEnabled} onChange={e => updateServicePoint(index, { liveModeEnabled: e.target.checked })} /> Live enabled</label>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
