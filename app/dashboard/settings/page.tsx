'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { VERTICALS } from '@/lib/verticals'
import { getVerticalPricing } from '@/lib/pricing'
import { formatCurrency } from '@/lib/utils'
import { fetchLatestTenant, bustTenantCache } from '@/lib/tenant'
import { Save, AlertTriangle, ExternalLink, Check, Sparkles, CheckCircle2, Loader2 } from 'lucide-react'
import type { Tenant } from '@/types/database'

const TABS = ['Profile', 'Notifications', 'Billing', 'Team', 'Integrations', 'Danger Zone']

const BOOKING_THEMES = [
  { id: 'soft', label: 'Soft Ivory', preview: ['#f8f6f1', '#ffffff'] },
  { id: 'mist', label: 'Cool Mist', preview: ['#eef2ff', '#ffffff'] },
  { id: 'sand', label: 'Warm Sand', preview: ['#fff7ed', '#ffffff'] },
]

const CORE_FEATURES = [
  '24/7 online booking page',
  'Unlimited services',
  'Unlimited bookings',
  'SMS + Email reminders',
  'Multi-staff scheduling',
  'Stripe-backed monthly billing',
  'Website embed widget',
  'Instant booking notifications',
  'Custom brand & booking link',
  'Revenue dashboard',
]

export default function SettingsPage() {
  const supabase = createSupabaseBrowserClient()
  const [tab, setTab] = useState('Profile')
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState<Partial<Tenant>>({})
  const [billingLoading, setBillingLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    fetchLatestTenant(supabase, '*')
      .then(data => {
        setTenant(data)
        setForm(data || {})
      })
      .catch(() => {
        setTenant(null)
      })
  }, [])

  const save = async () => {
    if (!tenant) return
    setSaving(true)
    setSaveError(null)
    // Whitelist every column the tenants table actually has so unknown keys
    // never cause PostgREST to reject the entire update silently.
    const ALLOWED_KEYS: (keyof Tenant)[] = [
      'business_name', 'slug', 'vertical', 'brand_colour', 'logo_url',
      'booking_page_headline', 'booking_page_subtext', 'booking_page_theme',
      'booking_page_cta_label', 'booking_page_font', 'booking_page_button_style',
      'booking_page_enabled',
      'booking_page_ab_enabled', 'booking_page_ab_split', 'booking_page_ab_auto_apply',
      'booking_page_variant_b_headline', 'booking_page_variant_b_subtext',
      'booking_page_variant_b_cta_label', 'booking_page_variant_b_theme',
      'booking_page_variant_b_font', 'booking_page_variant_b_button_style',
      'booking_page_variant_b_brand_colour',
      'booking_poster_offer',
      'email_reminders_enabled', 'sms_reminders_enabled',
      'daily_summary_email', 'new_booking_sms',
      'cancellation_policy', 'staff_guidelines',
      'payment_link', 'payment_link_label', 'payment_link_note',
      'plan_status',
    ]
    const payload = Object.fromEntries(
      ALLOWED_KEYS.filter(k => k in form).map(k => [k, (form as any)[k]])
    )
    const { error } = await (supabase.from('tenants') as any).update(payload).eq('id', tenant.id)
    if (error) {
      setSaveError(error.message)
      setSaving(false)
      return
    }
    bustTenantCache()
    setTenant(t => t ? { ...t, ...form } as Tenant : t)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const vertical = tenant?.vertical ? VERTICALS[tenant.vertical] : null
  const businessName = form.business_name || tenant?.business_name || 'your business'
  const recommendedHeadline = vertical
    ? `${vertical.bookingPageLabel} at ${businessName}`
    : `Book an Appointment at ${businessName}`
  const recommendedSubtext = (() => {
    if (!vertical) return `Choose a service, pick a time, and you’re confirmed instantly.`
    const top = vertical.defaultServices?.slice(0, 3).map(s => s.name) || []
    if (top.length >= 2) {
      const list = top.length === 3 ? `${top[0]}, ${top[1]} or ${top[2]}` : `${top[0]} or ${top[1]}`
      return `Book ${list} in minutes — choose a time and you’re all set.`
    }
    return `Choose a service, pick a time, and you’re confirmed instantly.`
  })()
  const recommendedOffer = 'Scan this QR code and use code WELCOME10 for 10% off your first booking.'
  const pricing = vertical ? getVerticalPricing(vertical.id) : null

  const startSubscription = async () => {
    setBillingLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Could not start billing')
      if (data?.url) window.location.href = data.url
    } catch (err: any) {
      alert(err.message || 'Could not start billing')
    } finally {
      setBillingLoading(false)
    }
  }

  const openBillingPortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Could not open billing portal')
      if (data?.url) window.location.href = data.url
    } catch (err: any) {
      alert(err.message || 'Could not open billing portal')
    } finally {
      setPortalLoading(false)
    }
  }

  const confirmDeleteAccount = async () => {
    setDeleteLoading(true)
    try {
      setDeleteError('')
      const res = await fetch('/api/account/delete', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Account deletion failed')
      await supabase.auth.signOut()
      window.location.href = '/'
      setShowDeleteConfirm(false)
      return
    } catch (err: any) {
      setDeleteError(err?.message || 'Account deletion failed')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="font-serif text-2xl font-bold text-dark">Settings</h1>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-border rounded-xl p-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${tab === t ? 'bg-dark text-white' : 'text-dark/60 hover:text-dark'} ${t === 'Danger Zone' ? 'text-red-500 hover:text-red-600' : ''}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Profile' && (
        <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
          <h3 className="font-semibold text-dark">Business Profile</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-dark/50 block mb-1">Business Name</label>
              <input value={form.business_name || ''} onChange={e => setForm(p => ({ ...p, business_name: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-border text-sm focus:outline-none focus:border-teal" />
            </div>
            <div>
              <label className="text-xs text-dark/50 block mb-1">Phone</label>
              <input value={form.phone || ''} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-border text-sm focus:outline-none focus:border-teal" />
            </div>
            <div>
              <label className="text-xs text-dark/50 block mb-1">Email</label>
              <input value={form.email || ''} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-border text-sm focus:outline-none focus:border-teal" />
            </div>
            <div>
              <label className="text-xs text-dark/50 block mb-1">Website</label>
              <input value={form.website || ''} onChange={e => setForm(p => ({ ...p, website: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-border text-sm focus:outline-none focus:border-teal" placeholder="https://" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-dark/50 block mb-1">Address</label>
              <textarea value={form.address || ''} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} rows={2}
                className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-teal resize-none" />
            </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-dark/50 block mb-1">Description (max 160 chars)</label>
            <textarea value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value.slice(0, 160) }))} rows={2}
              className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-teal resize-none" />
            <p className="text-xs text-dark/30 mt-1">{(form.description || '').length}/160</p>
          </div>
          <div className="sm:col-span-2 border-t border-border/60 pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-dark">Booking Page</p>
                <p className="text-xs text-dark/50">Customize your public booking page copy and colours.</p>
              </div>
              <button
                type="button"
                onClick={() => setForm(p => ({
                  ...p,
                  booking_page_headline: recommendedHeadline,
                  booking_page_subtext: recommendedSubtext,
                }))}
                className="text-xs font-semibold text-teal hover:underline"
              >
                Use recommended text
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-dark/50 block mb-1">Brand colour</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.brand_colour || '#0d6e6e'}
                    onChange={e => setForm(p => ({ ...p, brand_colour: e.target.value }))}
                    className="h-10 w-12 rounded-lg border border-border bg-white"
                    aria-label="Brand colour"
                  />
                  <input
                    value={form.brand_colour || ''}
                    onChange={e => setForm(p => ({ ...p, brand_colour: e.target.value }))}
                    className="flex-1 h-10 px-3 rounded-xl border border-border text-sm focus:outline-none focus:border-teal"
                    placeholder="#0d6e6e"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-dark/50 block mb-1">Background style</label>
                <div className="grid grid-cols-3 gap-2">
                  {BOOKING_THEMES.map(theme => {
                    const active = (form.booking_page_theme || 'soft') === theme.id
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, booking_page_theme: theme.id }))}
                        className={`rounded-xl border p-2 text-left text-[10px] font-semibold transition-all ${
                          active ? 'border-teal bg-teal/5' : 'border-border hover:border-teal/30'
                        }`}
                      >
                        <div className="h-8 rounded-lg mb-1" style={{
                          background: `linear-gradient(135deg, ${theme.preview[0]}, ${theme.preview[1]})`,
                        }} />
                        <span className={active ? 'text-teal' : 'text-dark/60'}>{theme.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-dark/50 block mb-1">Booking page headline</label>
                <input
                  value={form.booking_page_headline || ''}
                  onChange={e => setForm(p => ({ ...p, booking_page_headline: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-border text-sm focus:outline-none focus:border-teal"
                  placeholder={recommendedHeadline}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-dark/50 block mb-1">Booking page subtext</label>
                <textarea
                  value={form.booking_page_subtext || ''}
                  onChange={e => setForm(p => ({ ...p, booking_page_subtext: e.target.value.slice(0, 180) }))}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-teal resize-none"
                  placeholder={recommendedSubtext}
                />
                <p className="text-xs text-dark/30 mt-1">{(form.booking_page_subtext || '').length}/180</p>
              </div>
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-dark/50 block">Poster offer text (optional)</label>
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, booking_poster_offer: recommendedOffer }))}
                    className="text-xs font-semibold text-teal hover:underline"
                  >
                    Use example offer
                  </button>
                </div>
                <input
                  value={form.booking_poster_offer || ''}
                  onChange={e => setForm(p => ({ ...p, booking_poster_offer: e.target.value.slice(0, 140) }))}
                  className="w-full h-10 px-3 rounded-xl border border-border text-sm focus:outline-none focus:border-teal"
                  placeholder={recommendedOffer}
                />
                <p className="text-xs text-dark/30 mt-1">Leave blank to hide the offer on posters.</p>
              </div>
            </div>
          </div>
        </div>
          <div className="flex flex-col items-start gap-2">
            <button onClick={save} disabled={saving}
              className="btn-primary flex items-center gap-2 py-2.5 px-6">
              {saved ? <><Check className="w-4 h-4" /> Saved!</> : saving ? 'Saving…' : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
            {saveError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {saveError}
              </p>
            )}
          </div>
        </div>
      )}

      {tab === 'Notifications' && (
        <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
          <h3 className="font-semibold text-dark">Notification Preferences</h3>
          {[
            { key: 'email_reminders_enabled', label: 'Customer email reminders', desc: '48 hours before appointment' },
            { key: 'sms_reminders_enabled', label: 'Customer SMS reminders', desc: '24 hours before appointment (Professional+)' },
            { key: 'daily_summary_email', label: 'Daily revenue summary', desc: 'Sent to you each morning at 8am' },
            { key: 'new_booking_sms', label: 'New booking SMS to you', desc: 'Instant notification when someone books' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium text-dark">{label}</p>
                <p className="text-xs text-dark/40">{desc}</p>
              </div>
              <button onClick={() => setForm(p => ({ ...p, [key]: !(p as any)[key] }))}
                className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${(form as any)[key] ? 'bg-teal' : 'bg-border'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${(form as any)[key] ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
          <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2 py-2.5 px-6 mt-4">
            {saved ? <><Check className="w-4 h-4" /> Saved!</> : saving ? 'Saving…' : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      )}

      {tab === 'Billing' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-border p-6">
            <h3 className="font-semibold text-dark mb-4">Current Plan</h3>
            <div className="flex items-center justify-between p-4 bg-teal/5 rounded-xl border border-teal/20">
              <div>
                <p className="font-bold text-dark text-lg">ScudoSystems Plan</p>
                <p className="text-dark/50 text-sm">{vertical?.label || 'Your industry'}</p>
                <div className="mt-2">
                  {pricing?.basePence ? (
                    <p className="text-dark font-semibold">{formatCurrency(pricing.basePence)}/month</p>
                  ) : (
                    <p className="text-dark font-semibold">Pricing varies by industry</p>
                  )}
                </div>
                <p className="text-xs text-dark/50 mt-1">One monthly subscription with everything included.</p>
                <span className={`inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  tenant?.plan_status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                  tenant?.plan_status === 'trialing' ? 'bg-amber-50 text-amber-700' :
                  tenant?.plan_status === 'past_due' ? 'bg-red-50 text-red-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {tenant?.plan_status === 'trialing' ? (
                    <span className="inline-flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Trial
                    </span>
                  ) : tenant?.plan_status === 'active' ? (
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  ) : tenant?.plan_status === 'past_due' ? (
                    <span className="inline-flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Past Due
                    </span>
                  ) : tenant?.plan_status}
                </span>
                <div className="mt-3 text-[11px] text-dark/50">
                  {tenant?.stripe_last_event_at ? (
                    <>Last Stripe webhook: {new Date(tenant.stripe_last_event_at).toLocaleString('en-GB')} ({tenant.stripe_last_event_type})</>
                  ) : (
                    <>No Stripe webhook events received yet.</>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {!tenant?.stripe_subscription_id ? (
                  <button
                    onClick={startSubscription}
                    disabled={billingLoading}
                    className="btn-primary text-sm py-2 px-4 flex items-center gap-2 disabled:opacity-70"
                  >
                    {billingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Start subscription
                  </button>
                ) : (
                  <button
                    onClick={openBillingPortal}
                    disabled={portalLoading}
                    className="btn-secondary text-sm py-2 px-4 flex items-center gap-2 disabled:opacity-70"
                  >
                    {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
                    Manage billing
                  </button>
                )}
                {!tenant?.stripe_subscription_id && (
                  <p className="text-xs text-dark/40">Start your 14‑day free trial.</p>
                )}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-border p-6">
            <h3 className="font-semibold text-dark mb-4">Included for your industry</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em] mb-3">Industry features</p>
                <div className="space-y-2">
                  {(vertical?.features || []).map(feature => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-dark/70">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal" />
                      {feature}
                    </div>
                  ))}
                  {(!vertical || vertical.features.length === 0) && (
                    <p className="text-sm text-dark/40">Industry features will appear here after setup.</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em] mb-3">Core platform</p>
                <div className="space-y-2">
                  {CORE_FEATURES.map(feature => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-dark/70">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'Team' && (
        <div className="bg-white rounded-2xl border border-border p-6">
          <h3 className="font-semibold text-dark mb-2">Team Members</h3>
          <p className="text-sm text-dark/50 mb-6">Invite team members to access your dashboard. They'll receive a Clerk invitation email.</p>
          <div className="flex gap-3">
            <input type="email" placeholder="colleague@yourbusiness.co.uk"
              className="flex-1 h-10 px-4 rounded-xl border border-border text-sm focus:outline-none focus:border-teal" />
            <button className="btn-primary py-2 px-5 text-sm">Send Invite</button>
          </div>
          <p className="text-xs text-dark/40 mt-3">Team invites are powered by Clerk Organisations. Configure roles in your Clerk dashboard.</p>
        </div>
      )}

      {tab === 'Integrations' && (
        <div className="space-y-4">

          {/* ── Payment Link ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
            <div>
              <p className="font-semibold text-dark">Customer Payment Link</p>
              <p className="text-sm text-dark/50 mt-1">
                Add a link to your own payment page (PayPal, SumUp, Square, etc.). It will appear on the booking confirmation screen and in the confirmation email your customers receive.
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-dark/50 uppercase tracking-wider block mb-1">Payment URL</label>
                <input
                  type="url"
                  placeholder="https://paypal.me/yourbusiness or https://pay.sumup.com/…"
                  value={form.payment_link || ''}
                  onChange={e => setForm(f => ({ ...f, payment_link: e.target.value || null }))}
                  className="w-full h-10 px-4 rounded-xl border border-border text-sm focus:outline-none focus:border-teal"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-dark/50 uppercase tracking-wider block mb-1">Button Label</label>
                <input
                  type="text"
                  placeholder="e.g. Pay deposit via PayPal"
                  value={form.payment_link_label || ''}
                  onChange={e => setForm(f => ({ ...f, payment_link_label: e.target.value || null }))}
                  className="w-full h-10 px-4 rounded-xl border border-border text-sm focus:outline-none focus:border-teal"
                />
                <p className="text-xs text-dark/40 mt-1">Leave blank to use "Pay now →" as default</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-dark/50 uppercase tracking-wider block mb-1">Note to customer <span className="font-normal">(optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. Please use your booking ref as the payment reference"
                  value={form.payment_link_note || ''}
                  onChange={e => setForm(f => ({ ...f, payment_link_note: e.target.value || null }))}
                  className="w-full h-10 px-4 rounded-xl border border-border text-sm focus:outline-none focus:border-teal"
                />
              </div>
            </div>
            <div className="flex flex-col items-start gap-2">
              <button onClick={save} disabled={saving} className="btn-primary text-sm py-2 px-5">
                {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Payment Link'}
              </button>
              {saveError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {saveError}
                </p>
              )}
            </div>
          </div>

          {[
            { name: 'Google Calendar', desc: 'Sync bookings to Google Calendar automatically', status: 'coming_soon' },
            { name: 'Zapier', desc: 'Connect to 5,000+ apps via Zapier webhooks', status: 'available' },
            { name: 'Slack', desc: 'Post new bookings to your Slack channel', status: 'coming_soon' },
          ].map(({ name, desc, status }) => (
            <div key={name} className="bg-white rounded-2xl border border-border p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-dark">{name}</p>
                <p className="text-sm text-dark/50">{desc}</p>
              </div>
              {status === 'coming_soon' ? (
                <span className="text-xs bg-amber-50 text-amber-600 font-semibold px-3 py-1 rounded-full">Coming Soon</span>
              ) : (
                <button className="btn-primary text-sm py-2 px-4">Connect</button>
              )}
            </div>
          ))}
          <div className="bg-white rounded-2xl border border-border p-5">
            <p className="font-semibold text-dark mb-2">Webhook URL (Zapier)</p>
            <input type="url" placeholder="https://hooks.zapier.com/hooks/catch/…"
              className="w-full h-10 px-4 rounded-xl border border-border text-sm focus:outline-none focus:border-teal" />
            <button onClick={save} className="mt-3 btn-primary text-sm py-2 px-5">Save Webhook</button>
          </div>
        </div>
      )}

      {tab === 'Danger Zone' && (
        <div className="bg-white rounded-2xl border-2 border-red-200 p-6 space-y-4">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-semibold">Danger Zone</h3>
          </div>
          <div className="p-4 bg-red-50 rounded-xl border border-red-100">
            <p className="font-medium text-dark text-sm">Delete Account</p>
            <p className="text-xs text-dark/50 mt-1 mb-3">Permanently delete your ScudoSystems account, all data, and cancel your subscription. This action is irreversible.</p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(15,23,42,0.55)' }}>
          <div className="w-full max-w-md rounded-3xl border-2 border-red-300 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Delete account?</h3>
            </div>
            <p className="text-sm text-dark/60 mt-3">
              This will permanently delete your ScudoSystems account, all data, and cancel your subscription. This action cannot be undone.
            </p>
            {deleteError && (
              <div className="mt-4 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                {deleteError}
              </div>
            )}
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-border hover:bg-gray-50"
              >
                No, keep my account
              </button>
              <button
                onClick={confirmDeleteAccount}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
              >
                {deleteLoading ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
