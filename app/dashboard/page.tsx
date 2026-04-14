'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { fetchLatestTenant } from '@/lib/tenant'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts'
import {
  Calendar, CalendarClock, Users, TrendingUp, TrendingDown, Zap, Star,
  ArrowRight, Loader2, Banknote, QrCode, Printer,
  AlertCircle, AlertTriangle, BarChart2, Target, Repeat2, Timer,
  X, Activity, Trophy, Clock, CreditCard, Upload, Bell,
} from 'lucide-react'
import type { Booking, Tenant } from '@/types/database'
import { VERTICALS } from '@/lib/verticals'
import QRCode from 'qrcode'

// ─── Industry meta ────────────────────────────────────────────────────────────
const INDUSTRY_META: Record<string, {
  primaryUnit: string; resourceLabel: string;
  staffLabel: string; sessionLabel: string; clientLabel: string; colour: string
}> = {
  barber:      { primaryUnit: 'Cuts',          resourceLabel: 'Chairs',    staffLabel: 'Barber',       sessionLabel: 'Cut',          clientLabel: 'Client',    colour: '#0f766e' },
  hairsalon:   { primaryUnit: 'Appointments',  resourceLabel: 'Chairs',    staffLabel: 'Stylist',      sessionLabel: 'Appointment',  clientLabel: 'Client',    colour: '#9333ea' },
  beauty:      { primaryUnit: 'Treatments',    resourceLabel: 'Beds',      staffLabel: 'Therapist',    sessionLabel: 'Treatment',    clientLabel: 'Client',    colour: '#c4893a' },
  nails:       { primaryUnit: 'Appointments',  resourceLabel: 'Stations',  staffLabel: 'Technician',   sessionLabel: 'Appointment',  clientLabel: 'Client',    colour: '#f472b6' },
  aesthetics:  { primaryUnit: 'Sessions',      resourceLabel: 'Rooms',     staffLabel: 'Practitioner', sessionLabel: 'Session',      clientLabel: 'Client',    colour: '#a855f7' },
  lash:        { primaryUnit: 'Appointments',  resourceLabel: 'Stations',  staffLabel: 'Technician',   sessionLabel: 'Appointment',  clientLabel: 'Client',    colour: '#ec4899' },
  tattoo:      { primaryUnit: 'Sessions',      resourceLabel: 'Stations',  staffLabel: 'Artist',       sessionLabel: 'Session',      clientLabel: 'Client',    colour: '#1e1b4b' },
  restaurant:  { primaryUnit: 'Covers',        resourceLabel: 'Tables',    staffLabel: 'Host',         sessionLabel: 'Reservation',  clientLabel: 'Diner',     colour: '#e11d48' },
  nightclub:   { primaryUnit: 'Bookings',      resourceLabel: 'Tables',    staffLabel: 'Host',         sessionLabel: 'Reservation',  clientLabel: 'Guest',     colour: '#6d28d9' },
  spa:         { primaryUnit: 'Treatments',    resourceLabel: 'Rooms',     staffLabel: 'Therapist',    sessionLabel: 'Treatment',    clientLabel: 'Guest',     colour: '#0d9488' },
  gym:         { primaryUnit: 'Sessions',      resourceLabel: 'Stations',  staffLabel: 'Trainer',      sessionLabel: 'Session',      clientLabel: 'Member',    colour: '#dc2626' },
  physio:      { primaryUnit: 'Sessions',      resourceLabel: 'Rooms',     staffLabel: 'Physio',       sessionLabel: 'Session',      clientLabel: 'Patient',   colour: '#0369a1' },
  dental:      { primaryUnit: 'Appointments',  resourceLabel: 'Chairs',    staffLabel: 'Dentist',      sessionLabel: 'Appointment',  clientLabel: 'Patient',   colour: '#0284c7' },
  optician:    { primaryUnit: 'Appointments',  resourceLabel: 'Rooms',     staffLabel: 'Optometrist',  sessionLabel: 'Eye Test',     clientLabel: 'Patient',   colour: '#0369a1' },
  vet:         { primaryUnit: 'Appointments',  resourceLabel: 'Rooms',     staffLabel: 'Vet',          sessionLabel: 'Appointment',  clientLabel: 'Pet Owner', colour: '#7c3aed' },
  driving:     { primaryUnit: 'Lessons',       resourceLabel: 'Vehicles',  staffLabel: 'Instructor',   sessionLabel: 'Lesson',       clientLabel: 'Student',   colour: '#ca8a04' },
  grooming:    { primaryUnit: 'Appointments',  resourceLabel: 'Bays',      staffLabel: 'Groomer',      sessionLabel: 'Groom',        clientLabel: 'Pet Owner', colour: '#059669' },
  supercar:    { primaryUnit: 'Rentals',       resourceLabel: 'Vehicles',  staffLabel: 'Agent',        sessionLabel: 'Rental',       clientLabel: 'Client',    colour: '#dc2626' },
  auto:        { primaryUnit: 'Jobs',          resourceLabel: 'Bays',      staffLabel: 'Mechanic',     sessionLabel: 'Job',          clientLabel: 'Customer',  colour: '#b45309' },
  carwash:     { primaryUnit: 'Washes',        resourceLabel: 'Bays',      staffLabel: 'Valet',        sessionLabel: 'Wash',         clientLabel: 'Customer',  colour: '#0284c7' },
  takeaway:    { primaryUnit: 'Orders',        resourceLabel: 'Slots',     staffLabel: 'Staff',        sessionLabel: 'Order',        clientLabel: 'Customer',  colour: '#f59e0b' },
  photography: { primaryUnit: 'Sessions',      resourceLabel: 'Studios',   staffLabel: 'Photographer', sessionLabel: 'Shoot',        clientLabel: 'Client',    colour: '#6366f1' },
  escape:      { primaryUnit: 'Games',         resourceLabel: 'Rooms',     staffLabel: 'Host',         sessionLabel: 'Game',         clientLabel: 'Player',    colour: '#b45309' },
  solicitor:   { primaryUnit: 'Consultations', resourceLabel: 'Offices',   staffLabel: 'Solicitor',    sessionLabel: 'Consultation', clientLabel: 'Client',    colour: '#1e3a5f' },
  accountant:  { primaryUnit: 'Appointments',  resourceLabel: 'Offices',   staffLabel: 'Advisor',      sessionLabel: 'Appointment',  clientLabel: 'Client',    colour: '#1e3a5f' },
  tutoring:    { primaryUnit: 'Sessions',      resourceLabel: 'Rooms',     staffLabel: 'Trainer',      sessionLabel: 'Session',      clientLabel: 'Client',    colour: '#0891b2' },
}

const DEFAULT_META = { primaryUnit: 'Bookings', resourceLabel: 'Slots', staffLabel: 'Staff', sessionLabel: 'Booking', clientLabel: 'Customer', colour: '#2563EB' }

// ─── Poster themes ────────────────────────────────────────────────────────────
const POSTER_THEMES = [
  { id: 'midnight', label: 'Midnight', bg: '#0f172a', text: '#ffffff', accent: '#3b82f6' },
  { id: 'teal',     label: 'Teal',     bg: '#0d6e6e', text: '#ffffff', accent: '#a7f3d0' },
  { id: 'violet',   label: 'Violet',   bg: '#4c1d95', text: '#ffffff', accent: '#c4b5fd' },
  { id: 'slate',    label: 'Slate',    bg: '#1e293b', text: '#ffffff', accent: '#94a3b8' },
  { id: 'rose',     label: 'Rose',     bg: '#881337', text: '#ffffff', accent: '#fda4af' },
  { id: 'light',    label: 'White',    bg: '#ffffff', text: '#0f172a', accent: '#2563eb' },
]

// ─── Status ───────────────────────────────────────────────────────────────────
const STATUS_DOT: Record<string, string> = {
  pending: '#f59e0b', confirmed: '#3b82f6', completed: '#10b981',
  cancelled: '#6b7280', no_show: '#ef4444',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending', confirmed: 'Confirmed', completed: 'Done',
  cancelled: 'Cancelled', no_show: 'No-show',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pct(a: number, b: number) { return b === 0 ? 0 : Math.round((a / b) * 100) }
function avg(arr: number[]) { return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length }
function dayName(d: Date) { return d.toLocaleDateString('en-GB', { weekday: 'short' }) }

// ─── Per-industry poster copy ─────────────────────────────────────────────────
const POSTER_COPY: Record<string, { headline: string; subtext: string; cta: string }> = {
  dental:      { headline: 'Book Your Dental Appointment Online', subtext: 'Check-ups, hygiene, whitening & more. Pick a time in seconds — no phone queues.', cta: "Scan to Book — It's Free" },
  beauty:      { headline: 'Book Your Treatment Online', subtext: 'Facials, waxing, lashes & more. Choose your therapist, pick a time, and you\'re confirmed instantly.', cta: 'Scan & Book Your Treatment' },
  hairsalon:   { headline: 'Book Your Appointment Online', subtext: 'Cuts, colour, blow-dry & more. Choose your stylist and book in seconds — no need to ring ahead.', cta: 'Scan to Book Your Appointment' },
  barber:      { headline: 'Book Your Cut Online', subtext: 'Fades, trims, beard work & hot towel shaves. Pick your barber and your slot. Dead easy.', cta: 'Scan & Get Booked In' },
  nails:       { headline: 'Book Your Nail Appointment', subtext: 'Gels, acrylics, nail art & more. Pick your look, choose a time, and you\'re confirmed instantly.', cta: 'Scan to Book Now' },
  lash:        { headline: 'Book Your Lash Appointment', subtext: 'Classic, volume, mega-volume & brow tints. Book online in seconds — no waiting.', cta: 'Scan & Book Your Lashes' },
  aesthetics:  { headline: 'Book Your Aesthetic Treatment', subtext: 'Botox, fillers, skin treatments & more. Consultations available online — book your slot now.', cta: 'Scan to Book a Consultation' },
  spa:         { headline: 'Book Your Spa Treatment', subtext: 'Massages, facials, body wraps & more. Escape the everyday — book your session online.', cta: 'Scan to Book Your Escape' },
  physio:      { headline: 'Book Your Physio Session', subtext: 'Injury assessment, rehab & sports therapy. Book your session online — no referral needed.', cta: 'Scan to Book Your Session' },
  optician:    { headline: 'Book Your Eye Test Online', subtext: 'Eye tests, contact lens fittings & more. Pick a time that suits you — book in seconds.', cta: 'Scan to Book Your Eye Test' },
  vet:         { headline: 'Book a Vet Appointment', subtext: 'Consultations, vaccinations, check-ups & more. Book online any time — no hold music.', cta: 'Scan to Book Your Vet Visit' },
  gym:         { headline: 'Book Your Training Session', subtext: 'Personal training, classes & coaching. Book your next session online in seconds.', cta: 'Scan to Book Your Session' },
  restaurant:  { headline: 'Reserve Your Table Online', subtext: 'Book for any occasion — from date night to group dinners. Reserve your table instantly.', cta: 'Scan to Reserve Your Table' },
  nightclub:   { headline: 'Book Your Table or Guestlist', subtext: 'VIP tables, guestlist spots & bottle service. Secure your place before doors open.', cta: 'Scan to Book Now' },
  takeaway:    { headline: 'Order Online — Skip the Queue', subtext: 'Pre-order your food online. Ready when you are — no waiting around.', cta: 'Scan to Order Now' },
  carwash:     { headline: 'Book Your Car Wash Online', subtext: 'Valeting, detailing & machine washes. Pick your slot and drop it off — sorted.', cta: 'Scan to Book Your Wash' },
  auto:        { headline: 'Book Your Service Online', subtext: 'MOTs, servicing, repairs & diagnostics. Book your appointment in seconds — no phone needed.', cta: 'Scan to Book Your Service' },
  supercar:    { headline: 'Reserve Your Supercar Online', subtext: 'Lamborghinis, Ferraris, McLarens & more. Reserve your drive — it takes 60 seconds.', cta: 'Scan to Reserve Now' },
  driving:     { headline: 'Book Your Driving Lesson', subtext: 'Pick your instructor, choose your slot. Get on the road faster — book online today.', cta: 'Scan to Book Your Lesson' },
  photography: { headline: 'Book Your Photo Session', subtext: 'Portraits, events, products & more. Choose your package, pick a date — book online now.', cta: 'Scan to Book Your Shoot' },
  solicitor:   { headline: 'Book a Legal Consultation', subtext: 'Speak to a solicitor at a time that suits you. Book your confidential consultation online.', cta: 'Scan to Book Your Consultation' },
  accountant:  { headline: 'Book an Accountant Appointment', subtext: 'Tax returns, financial advice, business support. Book your appointment online in seconds.', cta: 'Scan to Book Now' },
  tutoring:    { headline: 'Book Your Tutoring Session', subtext: 'One-to-one lessons tailored to your goals. Choose your tutor and your time — book online.', cta: 'Scan to Book Your Lesson' },
}

const DEFAULT_POSTER_COPY = {
  headline: 'Book Online — No Phone Calls',
  subtext: 'Scan the QR code to book your appointment instantly — no calls, no waiting.',
  cta: "Scan to Book Now — It's Free",
}

// ─── QR Poster Modal ──────────────────────────────────────────────────────────
function QRPosterModal({ bookingUrl, businessName, offerText, vertical, onClose }: {
  bookingUrl: string; businessName: string; offerText?: string; vertical: string | null; onClose: () => void
}) {
  const copy = (vertical ? POSTER_COPY[vertical] : null) || DEFAULT_POSTER_COPY
  const name = businessName && businessName !== 'your business' ? businessName : ''

  const [theme, setTheme]       = useState(POSTER_THEMES[0])
  const [headline, setHeadline] = useState(name ? `${copy.headline.replace('Online', '').trim()} at ${name}` : copy.headline)
  const [subtext, setSubtext]   = useState(copy.subtext)
  const [cta, setCta]           = useState(copy.cta)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  // ── Generate QR code locally (no external API) ────────────────────────────
  useEffect(() => {
    if (!bookingUrl) return
    QRCode.toDataURL(bookingUrl, {
      width: 220,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    }).then(setQrDataUrl).catch(() => setQrDataUrl(''))
  }, [bookingUrl])

  const printPoster = () => {
    if (!qrDataUrl) return
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Booking Poster — ${businessName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Inter', sans-serif; background: ${theme.bg}; color: ${theme.text}; }
  @page { size: A4 portrait; margin: 0; }
  .poster { width:210mm; min-height:297mm; padding:20mm; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:32px; background: ${theme.bg}; }
  .badge { background: ${theme.accent}20; border: 1.5px solid ${theme.accent}50; color: ${theme.accent}; font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; padding:6px 14px; border-radius:100px; }
  .headline { font-size:42px; font-weight:900; text-align:center; line-height:1.1; color: ${theme.text}; }
  .subtext { font-size:17px; text-align:center; line-height:1.6; color: ${theme.text}; opacity:0.7; max-width:420px; }
  .qr-wrap { background:white; border-radius:24px; padding:20px; box-shadow: 0 12px 40px rgba(0,0,0,0.25); }
  .qr-wrap img { display:block; width:200px; height:200px; }
  .divider { width:60px; height:3px; background:${theme.accent}; border-radius:2px; }
  .cta { font-size:20px; font-weight:800; color:${theme.accent}; text-align:center; }
  .offer { font-size:14px; font-weight:600; text-align:center; color:${theme.text}; background:${theme.accent}20; border:1px dashed ${theme.accent}60; padding:8px 12px; border-radius:14px; }
  .url { font-size:13px; opacity:0.4; text-align:center; word-break:break-all; margin-top:8px; }
</style></head><body>
<div class="poster">
  <div class="badge">Online Booking</div>
  <h1 class="headline">${headline}</h1>
  <div class="divider"></div>
  <p class="subtext">${subtext}</p>
  <div class="qr-wrap"><img src="${qrDataUrl}" width="200" height="200" /></div>
  <p class="cta">${cta}</p>
  ${offerText ? `<div class="offer">${offerText}</div>` : ''}
  <p class="url">${bookingUrl}</p>
</div>
<script>
  // QR code is already a data URL — no external load needed. Print immediately.
  window.onload = function() { setTimeout(function(){ window.print(); }, 120); }
</script>
</body></html>`
    const w = window.open('', '_blank', 'width=900,height=700')
    if (w) { w.document.write(html); w.document.close() }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(6px)' }}>
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: '#e2e8f0' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#2563eb20' }}>
              <QrCode className="w-4 h-4" style={{ color: '#3b82f6' }} />
            </div>
            <div>
              <p className="font-bold text-dark text-sm">Booking Poster</p>
              <p className="text-xs" style={{ color: '#64748b' }}>
                Print & display in your {vertical ? (VERTICALS[vertical as keyof typeof VERTICALS]?.label || 'business') : 'business'} to get more bookings
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-6 grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-slate-400">Preview</p>
            <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: theme.bg, padding: '28px 20px', minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider" style={{ background: theme.accent + '20', border: `1px solid ${theme.accent}50`, color: theme.accent }}>Online Booking</div>
              <h3 className="text-2xl font-black text-center leading-tight" style={{ color: theme.text }}>{headline}</h3>
              <div className="w-10 h-0.5 rounded" style={{ background: theme.accent }} />
              <p className="text-xs text-center leading-relaxed" style={{ color: theme.text, opacity: 0.65, maxWidth: 220 }}>{subtext}</p>
              <div className="rounded-2xl p-3 shadow-lg" style={{ background: '#ffffff' }}>
                {qrDataUrl
                  ? <img src={qrDataUrl} alt="QR Code" width={140} height={140} />
                  : <div className="w-[140px] h-[140px] flex items-center justify-center" style={{ color: '#94a3b8' }}>
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                }
              </div>
              <p className="text-sm font-bold text-center" style={{ color: theme.accent }}>{cta}</p>
              <p className="text-xs text-center" style={{ color: theme.text, opacity: 0.3 }}>{bookingUrl}</p>
            </div>
          </div>
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Customise</p>
            <div>
              <p className="text-xs font-medium mb-2 text-slate-500">Colour scheme</p>
              <div className="grid grid-cols-3 gap-2">
                {POSTER_THEMES.map(t => (
                  <button key={t.id} onClick={() => setTheme(t)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                    style={{ background: theme.id === t.id ? t.bg : '#ffffff', border: `1.5px solid ${theme.id === t.id ? t.accent : '#e2e8f0'}`, color: theme.id === t.id ? t.text : '#475569' }}>
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: t.bg, border: '1px solid #e2e8f0' }} />{t.label}
                  </button>
                ))}
              </div>
            </div>
            {[
              { key: 'headline', label: 'Headline', value: headline, set: setHeadline },
              { key: 'subtext',  label: 'Description', value: subtext, set: setSubtext },
              { key: 'cta',      label: 'Call to Action', value: cta, set: setCta },
            ].map(({ key, label, value, set }) => (
              <div key={key}>
                <p className="text-xs font-medium mb-1.5 text-slate-500">{label}</p>
                <textarea value={value} onChange={e => set(e.target.value)} rows={2}
                  className="w-full rounded-xl px-3 py-2.5 text-xs text-slate-700 resize-none focus:outline-none"
                  style={{ background: '#ffffff', border: '1px solid #e2e8f0', lineHeight: 1.5 }} />
              </div>
            ))}
            <button onClick={printPoster}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #2563eb, #0d9488)', boxShadow: '0 8px 24px rgba(37,99,235,0.3)' }}>
              <Printer className="w-4 h-4" />Print / Download Poster
            </button>
            <p className="text-xs text-slate-400 text-center">Opens print dialog · Save as PDF or print directly<br />A4 portrait · Perfect for window, menu, or reception</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent, delta, deltaUp }: {
  icon: React.ElementType; label: string; value: string | number
  sub: string; accent: string; delta?: string | null; deltaUp?: boolean
}) {
  return (
    <div className="relative rounded-2xl p-5 overflow-hidden transition-all hover:scale-[1.01]"
      style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at top left, ${accent}06 0%, transparent 65%)` }} />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: accent + '12' }}>
            <Icon className="w-4 h-4" style={{ color: accent }} />
          </div>
          {delta && (
            <div className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: deltaUp ? '#10b98115' : '#ef444415', color: deltaUp ? '#059669' : '#dc2626' }}>
              {deltaUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {delta}
            </div>
          )}
        </div>
        <p className="text-2xl font-black tracking-tight text-gray-900 tabular-nums">{value}</p>
        <p className="text-xs font-semibold mt-0.5 text-gray-500">{label}</p>
        <p className="text-xs mt-0.5 text-gray-400">{sub}</p>
      </div>
    </div>
  )
}

// ─── Availability Grid ────────────────────────────────────────────────────────
function AvailabilityGrid({ staff, todayBookings, resourceLabel }: {
  staff: { id: string; name: string }[]; todayBookings: Booking[]
  resourceLabel: string
}) {
  const now = new Date()
  const nowStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  return (
    <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center">
          <Users className="w-4 h-4 text-teal-600" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">{resourceLabel} — Live Availability</p>
          <p className="text-xs text-gray-400">Updated now · {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-600 font-medium">Live</span>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {staff.length === 0
          ? [1, 2, 3, 4].map(n => (
            <div key={n} className="rounded-xl p-3 text-center" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center bg-emerald-100">
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs font-bold text-emerald-700">{resourceLabel} {n}</p>
              <p className="text-xs mt-0.5 text-emerald-600">Available</p>
            </div>
          ))
          : staff.map(s => {
            const active = todayBookings.find(b =>
              b.status === 'confirmed' &&
              b.booking_time <= nowStr &&
              b.booking_time >= String(parseInt(nowStr) - 100).padStart(5, '0')
            )
            const next = todayBookings
              .filter(b => b.booking_time > nowStr && b.status === 'confirmed')
              .sort((a, b) => a.booking_time.localeCompare(b.booking_time))[0]
            const isBusy = !!active
            return (
              <div key={s.id} className="rounded-xl p-3"
                style={{ background: isBusy ? '#fef2f2' : '#f0fdf4', border: `1px solid ${isBusy ? '#fecaca' : '#bbf7d0'}` }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isBusy ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'}`} />
                  <p className="text-xs font-bold text-gray-800 truncate">{s.name}</p>
                </div>
                <p className="text-xs font-medium" style={{ color: isBusy ? '#dc2626' : '#059669' }}>{isBusy ? 'Busy' : 'Available'}</p>
                {next && !isBusy && <p className="text-xs mt-0.5 text-gray-400">Next: {next.booking_time.slice(0, 5)}</p>}
              </div>
            )
          })}
      </div>
    </div>
  )
}

// ─── Chart Tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 shadow-lg bg-white" style={{ border: '1px solid #e2e8f0', fontSize: 11 }}>
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-bold">
          {p.dataKey === 'revenue' ? `£${Number(p.value).toFixed(2)}` : p.value}
        </p>
      ))}
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardOverview() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [staffList, setStaffList] = useState<{ id: string; name: string }[]>([])
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showQR, setShowQR] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importUploading, setImportUploading] = useState(false)
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const [newBookingAlert, setNewBookingAlert] = useState<{ name: string; time?: string } | null>(null)
  const supabase = createSupabaseBrowserClient()

  // Use local date (not UTC) so UK/BST tenants see today's bookings correctly
  const _now = new Date()
  const today = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`

  useEffect(() => {
    let cancelled = false
    async function load() {
      // ── 1. Fetch the tenant first so every subsequent query is scoped to
      //       this tenant's ID.  Without this, bookings / staff / reviews would
      //       return rows from every tenant in the database (cross-contamination).
      let t: Tenant | null = null
      try {
        t = await fetchLatestTenant(supabase, '*') as Tenant | null
      } catch {
        t = null
      }
      if (cancelled) return
      setTenant(t)

      if (!t?.id) {
        setLoading(false)
        return
      }

      // ── 2. All queries now scoped to this tenant only ──────────────────────
      const since90 = (() => { const d = new Date(); d.setDate(d.getDate() - 90); return d.toISOString().split('T')[0] })()
      const [{ data: b }, { data: s }, { data: r }] = await Promise.all([
        supabase.from('bookings')
          .select('*, services(name), staff(name)')
          .eq('tenant_id', t.id)
          .gte('booking_date', since90)
          .order('booking_date', { ascending: false })
          .limit(500),
        supabase.from('staff')
          .select('id, name')
          .eq('tenant_id', t.id)
          .eq('is_active', true),
        supabase.from('reviews')
          .select('id, rating, timing_rating, service_rating, cleanliness_rating, comment, created_at, display_name, booking_ref')
          .eq('tenant_id', t.id)
          .order('created_at', { ascending: false })
          .limit(6),
      ])

      if (cancelled) return
      setBookings((b as Booking[]) || [])
      setStaffList(s || [])
      setReviews(r || [])
      setLoading(false)

    }
    load()
    return () => { cancelled = true }
  }, [])

  // ── Realtime: show toast when a new booking arrives ──────────────────────────
  useEffect(() => {
    if (!tenant?.id) return
    const channel = supabase
      .channel(`new-bookings-${tenant.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings', filter: `tenant_id=eq.${tenant.id}` },
        (payload) => {
          const b = payload.new as any
          setNewBookingAlert({ name: b.customer_name || 'A customer', time: b.booking_time?.slice(0, 5) })
          setBookings(prev => [b, ...prev])
          const timer = setTimeout(() => setNewBookingAlert(null), 7000)
          return () => clearTimeout(timer)
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [tenant?.id])

  const vertical    = tenant?.vertical || null
  const meta        = vertical ? (INDUSTRY_META[vertical] || DEFAULT_META) : DEFAULT_META
  const verticalInfo = vertical ? VERTICALS[vertical as keyof typeof VERTICALS] : null
  // Use configured URL; fall back to current origin at runtime so embed codes
  // never show localhost in development or show empty strings before tenant loads.
  const appOrigin = (() => {
    const env = process.env.NEXT_PUBLIC_APP_URL
    if (env && !env.includes('localhost')) return env
    if (typeof window !== 'undefined') return window.location.origin
    return 'https://www.scudosystems.com'
  })()
  const bookingUrl  = tenant?.slug ? `${appOrigin}/book/${tenant.slug}` : ''

  const uploadImportFile = async () => {
    if (!importFile) return
    setImportUploading(true)
    setImportStatus(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const safeName = importFile.name.replace(/\s+/g, '-')
      const path = `imports/${user?.id || 'unknown'}/${Date.now()}-${safeName}`
      const { error } = await supabase.storage.from('imports').upload(path, importFile, { upsert: true })
      if (error) throw error
      setImportStatus('File uploaded. We will import your data shortly.')
      setImportFile(null)
    } catch (err: any) {
      setImportStatus(err?.message || 'Upload failed. Please try again.')
    } finally {
      setImportUploading(false)
    }
  }

  const now            = new Date()
  const monthStart     = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
  const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7)

  const todayBookings  = bookings.filter(b => b.booking_date === today && b.status !== 'cancelled')
  const completedAll   = bookings.filter(b => b.status === 'completed')
  const thisMonthAll   = bookings.filter(b => b.booking_date >= monthStart)
  const thisMonthDone  = thisMonthAll.filter(b => b.status === 'completed')
  const lastMonthDone  = bookings.filter(b => b.booking_date >= lastMonthStart && b.booking_date <= lastMonthEnd && b.status === 'completed')
  const _in7 = new Date(_now); _in7.setDate(_now.getDate() + 7)
  const in7Str = `${_in7.getFullYear()}-${String(_in7.getMonth() + 1).padStart(2, '0')}-${String(_in7.getDate()).padStart(2, '0')}`
  const upcoming7      = bookings.filter(b => b.booking_date >= today && b.booking_date <= in7Str && b.status !== 'cancelled')
  const noShowsThis    = thisMonthAll.filter(b => b.status === 'no_show')
  const cancelledThis  = thisMonthAll.filter(b => b.status === 'cancelled')
  const confirmedAll   = bookings.filter(b => b.status === 'confirmed')

  const revThisMonth = thisMonthDone.reduce((s, b) => s + b.total_amount_pence, 0)
  const revLastMonth = lastMonthDone.reduce((s, b) => s + b.total_amount_pence, 0)
  const revDelta     = revLastMonth > 0 ? Math.round(((revThisMonth - revLastMonth) / revLastMonth) * 100) : 0
  const projectedRev = confirmedAll.filter(b => b.booking_date >= today).reduce((s, b) => s + b.total_amount_pence, 0)

  const avgBookingValue  = completedAll.length ? completedAll.reduce((s, b) => s + b.total_amount_pence, 0) / completedAll.length : 0
  const noShowRate       = thisMonthAll.length ? pct(noShowsThis.length, thisMonthAll.length) : 0
  const cancellationRate = thisMonthAll.length ? pct(cancelledThis.length, thisMonthAll.length) : 0
  const completionRate   = thisMonthAll.length ? pct(thisMonthDone.length, thisMonthAll.length) : 0

  // Count unique clients from ALL non-cancelled bookings so new tenants see real numbers
  const activeBookings  = bookings.filter(b => b.status !== 'cancelled')
  const uniqueCustomers = new Set(activeBookings.map(b => b.customer_email)).size
  const repeatEmails    = completedAll.reduce((acc, b) => { acc[b.customer_email] = (acc[b.customer_email] || 0) + 1; return acc }, {} as Record<string, number>)
  const returningCount  = Object.values(repeatEmails).filter(c => c > 1).length
  const returnRate      = uniqueCustomers > 0 ? pct(returningCount, uniqueCustomers) : 0
  const avgPerCustomer  = uniqueCustomers > 0 ? completedAll.reduce((s, b) => s + b.total_amount_pence, 0) / uniqueCustomers : 0

  const dayCounts  = completedAll.reduce((acc, b) => { const d = dayName(new Date(b.booking_date)); acc[d] = (acc[d] || 0) + 1; return acc }, {} as Record<string, number>)
  const busiestDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]
  const hourCounts  = completedAll.reduce((acc, b) => { const h = parseInt(b.booking_time.split(':')[0]); acc[h] = (acc[h] || 0) + 1; return acc }, {} as Record<number, number>)
  const busiestHour = Object.entries(hourCounts).sort((a, b) => Number(b[1]) - Number(a[1]))[0]
  const peakHourLabel = busiestHour ? `${busiestHour[0]}:00–${Number(busiestHour[0]) + 1}:00` : '—'

  const serviceCounts = completedAll.reduce((acc, b: any) => { const sn = b.services?.name || 'Unknown'; acc[sn] = (acc[sn] || 0) + 1; return acc }, {} as Record<string, number>)
  const topService    = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]
  const topServicePct = topService && completedAll.length ? pct(topService[1], completedAll.length) : 0
  const staffCounts   = completedAll.reduce((acc, b: any) => { const sn = b.staff?.name || 'Unassigned'; acc[sn] = (acc[sn] || 0) + 1; return acc }, {} as Record<string, number>)
  const topStaff      = Object.entries(staffCounts).sort((a, b) => b[1] - a[1])[0]

  const leadTimes   = bookings.filter(b => b.created_at && b.booking_date).map(b => Math.round((new Date(b.booking_date).getTime() - new Date(b.created_at!).getTime()) / 86400000)).filter(d => d >= 0 && d < 60)
  const avgLeadDays = leadTimes.length ? Math.round(avg(leadTimes)) : 0

  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i))
    const ds = d.toISOString().split('T')[0]
    const dayB = bookings.filter(b => b.booking_date === ds && b.status === 'completed')
    return { date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), revenue: dayB.reduce((s, b) => s + b.total_amount_pence / 100, 0), count: dayB.length }
  })

  const DAYS_ORDER   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const weekdayChart = DAYS_ORDER.map(d => ({ day: d, bookings: completedAll.filter(b => dayName(new Date(b.booking_date)) === d).length }))

  const daysIntoMonth = now.getDate()
  const daysInMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const forecastRev   = daysIntoMonth > 0 ? Math.round((revThisMonth / daysIntoMonth) * daysInMonth) : revThisMonth
  const forecastCount = daysIntoMonth > 0 ? Math.round((thisMonthDone.length / daysIntoMonth) * daysInMonth) : thisMonthDone.length

  const showAvailability = vertical
    ? ['barber','hairsalon','beauty','nails','aesthetics','lash','tattoo','physio','dental','grooming','spa','escape','auto','carwash','driving','photography'].includes(vertical)
    : false

  const STATS_GRID = [
    { icon: Calendar,      label: `${meta.primaryUnit} Today`,   value: loading ? '—' : todayBookings.length,               sub: `${todayBookings.filter(b=>b.status==='confirmed').length} confirmed`,   accent: '#3b82f6', delta: null },
    { icon: Banknote,      label: 'Revenue This Month',          value: loading ? '—' : formatCurrency(revThisMonth),       sub: 'Completed sessions',                                                    accent: '#10b981', delta: revDelta !== 0 ? `${Math.abs(revDelta)}%` : null, deltaUp: revDelta >= 0 },
    { icon: Users,         label: `Unique ${meta.clientLabel}s`, value: loading ? '—' : uniqueCustomers,                    sub: 'All non-cancelled bookings',                                            accent: '#8b5cf6', delta: null },
    { icon: CalendarClock, label: 'Upcoming 7 Days',             value: loading ? '—' : upcoming7.length,                   sub: `${upcoming7.filter(b=>b.status==='confirmed').length} confirmed`,       accent: '#06b6d4', delta: null },
    { icon: TrendingUp,    label: 'Avg Booking Value',           value: loading ? '—' : formatCurrency(avgBookingValue),    sub: 'Per completed session',                                                 accent: '#f59e0b', delta: null },
    { icon: Repeat2,       label: 'Return Rate',                 value: loading ? '—' : `${returnRate}%`,                  sub: 'Clients who re-booked',                                                 accent: '#10b981', delta: null },
    { icon: Activity,      label: 'Completion Rate',             value: loading ? '—' : `${completionRate}%`,               sub: 'Bookings that showed up',                                               accent: '#22d3ee', delta: null },
    { icon: AlertCircle,   label: 'No-Show Rate',                value: loading ? '—' : `${noShowRate}%`,                  sub: 'This month',                                                            accent: noShowRate > 10 ? '#ef4444' : '#10b981', delta: null },
    { icon: Star,          label: 'Top Service',                 value: loading ? '—' : (topService?.[0]?.split(' ')[0] || '—'), sub: topService ? `${topServicePct}% of bookings` : 'No data yet',    accent: '#f59e0b', delta: null },
    { icon: Target,        label: 'Peak Hour',                   value: loading ? '—' : peakHourLabel,                     sub: 'Most bookings happen here',                                             accent: '#a78bfa', delta: null },
    { icon: Timer,         label: 'Avg Lead Time',               value: loading ? '—' : `${avgLeadDays}d`,                 sub: 'How far ahead clients book',                                            accent: '#fb923c', delta: null },
    { icon: BarChart2,     label: `Rev per ${meta.clientLabel}`, value: loading ? '—' : formatCurrency(avgPerCustomer),    sub: 'Lifetime avg per customer',                                             accent: '#34d399', delta: null },
  ]

  const FORECAST_ITEMS = [
    { icon: CalendarClock, label: `${meta.primaryUnit} Forecast`, value: loading ? '—' : `~${forecastCount}`, sub: 'predicted this month', color: '#3b82f6' },
    { icon: Banknote,      label: 'Revenue Forecast',             value: loading ? '—' : `~${formatCurrency(forecastRev)}`, sub: 'projected this month', color: '#10b981' },
    { icon: Calendar,      label: 'Busiest Day',                  value: loading ? '—' : (busiestDay?.[0] || '—'), sub: 'maximise availability', color: '#a78bfa' },
    { icon: Clock,         label: 'Peak Hour',                    value: loading ? '—' : peakHourLabel, sub: 'highest demand slot', color: '#f59e0b' },
    { icon: Star,          label: `Top ${meta.sessionLabel}`,     value: loading ? '—' : (topService?.[0]?.split(' ')[0] || '—'), sub: `${topServicePct}% of sessions`, color: '#f97316' },
    { icon: Trophy,        label: `Top ${meta.staffLabel}`,       value: loading ? '—' : (topStaff?.[0] || '—'), sub: `${topStaff?.[1] || 0} sessions`, color: '#34d399' },
  ]

  return (
    <div className="space-y-6 max-w-7xl">

      {/* ── New-booking notification toast ── */}
      {newBookingAlert && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-4 shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
          style={{ background: '#0f172a', border: '1px solid #1e293b', color: '#fff', minWidth: 280, maxWidth: 360 }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#10b98118', border: '1px solid #10b98130' }}>
            <Bell className="w-4 h-4" style={{ color: '#10b981' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">New booking received!</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: '#94a3b8' }}>
              {newBookingAlert.name}{newBookingAlert.time ? ` · ${newBookingAlert.time}` : ''}
            </p>
          </div>
          <button onClick={() => setNewBookingAlert(null)}
            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      )}

      {showQR && tenant && (
        <QRPosterModal bookingUrl={bookingUrl} businessName={tenant.business_name} offerText={tenant.booking_poster_offer || ''} vertical={vertical} onClose={() => setShowQR(false)} />
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {tenant?.business_name || 'Your Dashboard'}
            </h1>
            {verticalInfo && (
              <span className="hidden sm:inline text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: (meta.colour || '#2563eb') + '12', color: meta.colour || '#2563eb', border: `1px solid ${meta.colour || '#2563eb'}20` }}>
                {verticalInfo.label}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={() => setShowQR(true)}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:opacity-80"
            style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.18)', color: '#2563eb' }}>
            <QrCode className="w-4 h-4" />
            <span className="hidden sm:inline">Get Booking Poster</span>
            <span className="sm:hidden">Poster</span>
          </button>
          <Link href="/dashboard/bookings"
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:opacity-80"
            style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569' }}>
            All Bookings <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {tenant?.plan_status === 'trialing' && (
        <div className="bg-white rounded-2xl border border-border px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5 text-violet-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-dark text-sm">Your free trial is active</p>
            <p className="text-xs text-dark/50 mt-0.5">You’re on monthly subscription billing only. Add a payment method before your trial ends to keep the dashboard unlocked.</p>
          </div>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2 bg-dark text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-dark/90 transition-colors flex-shrink-0"
          >
            <Zap className="w-4 h-4" />
            Manage billing
          </Link>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
          <Upload className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-dark text-sm">Move your existing data</p>
          <p className="text-xs text-dark/50 mt-0.5">
            Upload a CSV or export from your current system — we’ll import services, customers, and availability for you.
          </p>
          {importStatus && (
            <p className="text-xs mt-2" style={{ color: importStatus.includes('uploaded') ? '#059669' : '#dc2626' }}>
              {importStatus}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="btn-secondary text-sm py-2 px-4 cursor-pointer">
            {importFile ? 'Change file' : 'Choose file'}
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.json,.txt"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) setImportFile(file)
                e.currentTarget.value = ''
              }}
            />
          </label>
          <button
            onClick={uploadImportFile}
            disabled={!importFile || importUploading}
            className="btn-primary text-sm py-2 px-4 disabled:opacity-60"
          >
            {importUploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {STATS_GRID.map(s => (
          <StatCard key={s.label} icon={s.icon ?? Calendar} label={s.label} value={s.value} sub={s.sub} accent={s.accent} delta={s.delta} deltaUp={s.deltaUp} />
        ))}
      </div>

      {/* ── Live Availability ── */}
      {showAvailability && (
        <AvailabilityGrid staff={staffList} todayBookings={todayBookings} resourceLabel={meta.resourceLabel} />
      )}

      {/* ── Charts ── */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="font-bold text-gray-900 text-sm">Revenue — Last 14 Days</p>
              <p className="text-xs text-gray-400">Completed {meta.primaryUnit.toLowerCase()} only</p>
            </div>
            <div className="text-right rounded-xl px-3 py-1.5" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <p className="text-xs font-medium text-emerald-600">Projected ahead</p>
              <p className="font-bold text-sm text-emerald-700">{formatCurrency(projectedRev)}</p>
            </div>
          </div>
          {loading ? (
            <div className="h-52 flex items-center justify-center"><Loader2 className="w-5 h-5 text-gray-300 animate-spin" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={last14Days}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.35)' }} axisLine={false} tickLine={false} interval={2} />
                <YAxis tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.35)' }} axisLine={false} tickLine={false} tickFormatter={v => `£${v}`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: '#3b82f6' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <p className="font-bold text-gray-900 text-sm mb-1">Busiest Days</p>
          <p className="text-xs text-gray-400 mb-5">All-time completed {meta.primaryUnit.toLowerCase()}</p>
          {loading ? (
            <div className="h-40 flex items-center justify-center"><Loader2 className="w-4 h-4 text-gray-300 animate-spin" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weekdayChart} barSize={20}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.4)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="bookings" radius={[6, 6, 0, 0]}>
                  {weekdayChart.map((entry, i) => (
                    <Cell key={i} fill={entry.bookings === Math.max(...weekdayChart.map(d => d.bookings)) ? '#3b82f6' : '#e2e8f0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Forecast + Today's Schedule ── */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <p className="font-bold text-gray-900 text-sm">Business Forecast</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full font-medium bg-amber-50 text-amber-600 border border-amber-100">Estimate</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {FORECAST_ITEMS.map(({ icon: Icon, label, value, sub, color }) => (
              <div key={label} className="rounded-xl p-3.5" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2.5" style={{ background: color + '12' }}>
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>
                <p className="text-xl font-black tabular-nums" style={{ color }}>{value}</p>
                <p className="text-xs mt-0.5 text-gray-400">{sub}</p>
                <p className="text-xs mt-0.5 text-gray-600 font-medium">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs mt-4 text-gray-400 border-t border-gray-100 pt-3">
            Forecasts are estimates based on booking trends and are not guaranteed.
          </p>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
            <div>
              <p className="font-bold text-gray-900 text-sm">Today's Schedule</p>
              <p className="text-xs text-gray-400">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
            <Link href="/dashboard/bookings" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-gray-300 animate-spin" /></div>
            ) : todayBookings.length === 0 ? (
              <div className="text-center py-14 px-6">
                <Calendar className="w-8 h-8 mx-auto mb-3 text-gray-200" />
                <p className="text-sm text-gray-400">No {meta.primaryUnit.toLowerCase()} today</p>
                <p className="text-xs mt-1 text-gray-300">Share your booking link to fill your diary</p>
              </div>
            ) : (
              todayBookings.slice(0, 7).map(b => (
                <div key={b.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-gray-50">
                  <div className="flex-shrink-0">
                    <p className="text-sm font-black text-gray-900 tabular-nums">{b.booking_time.slice(0, 5)}</p>
                  </div>
                  <div className="w-0.5 h-8 rounded-full flex-shrink-0" style={{ background: STATUS_DOT[b.status] || '#6b7280' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{b.customer_name}</p>
                    <p className="text-xs truncate text-gray-400">
                      {(b as any).services?.name || meta.sessionLabel}
                      {(b as any).staff?.name ? ` · ${(b as any).staff.name}` : ''}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0"
                    style={{ background: (STATUS_DOT[b.status] || '#6b7280') + '15', color: STATUS_DOT[b.status] || '#6b7280' }}>
                    {STATUS_LABEL[b.status]}
                  </span>
                </div>
              ))
            )}
          </div>
          {todayBookings.length > 7 && (
            <div className="px-5 py-3 text-center border-t border-gray-50">
              <Link href="/dashboard/bookings" className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors">
                +{todayBookings.length - 7} more today →
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            <p className="font-bold text-gray-900 text-sm">Recent reviews</p>
          </div>
          <span className="text-xs font-medium text-gray-400">{reviews.length} latest</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 text-gray-300 animate-spin" /></div>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-gray-400">No reviews yet. Share your wait‑time QR to start collecting feedback.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {reviews.map(review => (
              <div key={review.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">{review.display_name || 'Customer'}</p>
                  <span className="text-[11px] text-gray-400">
                    {new Date(review.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  {[1,2,3,4,5].map(i => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i <= review.rating ? 'text-amber-500' : 'text-slate-300'}`}
                      fill={i <= review.rating ? '#f59e0b' : 'none'}
                    />
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-500 space-y-1">
                  {review.timing_rating && <p>Timing: {review.timing_rating}/5</p>}
                  {review.service_rating && <p>Service: {review.service_rating}/5</p>}
                  {review.cleanliness_rating && <p>Cleanliness: {review.cleanliness_rating}/5</p>}
                </div>
                {review.comment && (
                  <p className="mt-2 text-xs text-gray-600 leading-relaxed">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Insights & Recommendations ── */}
      {(() => {
        const daysWithBookings   = new Set(completedAll.map(b => b.booking_date)).size
        const avgDailyRev        = daysWithBookings > 0 ? revThisMonth / Math.max(daysIntoMonth, 1) : 0
        const weekdayRevs        = DAYS_ORDER.map(d => completedAll.filter(b => dayName(new Date(b.booking_date)) === d).reduce((s, b) => s + b.total_amount_pence, 0))
        const quietestDay        = DAYS_ORDER[weekdayRevs.indexOf(Math.min(...weekdayRevs.filter(v => v > 0)))] || null
        const morningBookings    = completedAll.filter(b => parseInt(b.booking_time) < 12).length
        const afternoonBookings  = completedAll.filter(b => parseInt(b.booking_time) >= 12 && parseInt(b.booking_time) < 17).length
        const eveningBookings    = completedAll.filter(b => parseInt(b.booking_time) >= 17).length
        const weekendBookings    = completedAll.filter(b => { const d = new Date(b.booking_date).getDay(); return d === 0 || d === 6 }).length
        const weekdayBookings2   = completedAll.length - weekendBookings
        const lastWeekStart      = new Date(); lastWeekStart.setDate(now.getDate() - 14)
        const lastWeekEnd        = new Date(); lastWeekEnd.setDate(now.getDate() - 7)
        const thisWeekBookings   = completedAll.filter(b => new Date(b.booking_date) >= weekAgo).length
        const lastWeekBookings   = completedAll.filter(b => new Date(b.booking_date) >= lastWeekStart && new Date(b.booking_date) < lastWeekEnd).length
        const weekGrowth         = lastWeekBookings > 0 ? Math.round(((thisWeekBookings - lastWeekBookings) / lastWeekBookings) * 100) : 0
        const avgMonthlyBookings = daysIntoMonth > 0 ? Math.round((thisMonthAll.length / daysIntoMonth) * daysInMonth) : 0
        const lostToNoShows      = noShowsThis.reduce((s, b) => s + b.total_amount_pence, 0)
        const topCustomer        = Object.entries(repeatEmails).sort((a, b) => b[1] - a[1])[0]
        const newThisMonth       = thisMonthAll.filter(b => { const prev = completedAll.filter(bb => bb.customer_email === b.customer_email && new Date(bb.booking_date) < new Date(b.booking_date)); return prev.length === 0 }).length
        const serviceList        = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])
        const bottomService      = serviceList[serviceList.length - 1]
        const staffList2         = Object.entries(staffCounts).sort((a, b) => b[1] - a[1])
        const bottomStaff        = staffList2.length > 1 ? staffList2[staffList2.length - 1] : null
        const depositBookings    = bookings.filter(b => (b as any).deposit_amount_pence > 0).length
        const depositRate        = bookings.length > 0 ? pct(depositBookings, bookings.length) : 0
        const confirmedRate      = thisMonthAll.length > 0 ? pct(thisMonthAll.filter(b => b.status === 'confirmed').length, thisMonthAll.length) : 0
        const lastMinuteBookings = bookings.filter(b => { const created = new Date(b.created_at!); const booked = new Date(b.booking_date); return (booked.getTime() - created.getTime()) < 86400000 }).length
        const lastMinutePct      = bookings.length > 0 ? pct(lastMinuteBookings, bookings.length) : 0
        const peakTimeSlot       = Object.entries(hourCounts).sort((a,b) => Number(b[1])-Number(a[1]))[0]
        const offPeakHour        = Object.entries(hourCounts).sort((a,b) => Number(a[1])-Number(b[1])).find(([h]) => Number(h) >= 9)?.[0]

        type Insight = { text: string; tag: 'urgent'|'growth'|'tip'|'win' }
        const allInsights: Insight[] = []
        const add = (text: string, tag: Insight['tag'] = 'tip') => allInsights.push({ text, tag })

        if (revDelta > 20)  add(`Revenue is up ${revDelta}% vs last month — strong growth streak. Stay consistent!`, 'growth')
        if (revDelta > 5 && revDelta <= 20) add(`Revenue grew ${revDelta}% from last month. Steady progress — keep pushing.`, 'growth')
        if (revDelta < -20) add(`Revenue dropped ${Math.abs(revDelta)}% from last month. Promote your booking link on Instagram or WhatsApp this week.`, 'urgent')
        if (revDelta < -5 && revDelta >= -20) add(`Revenue is down ${Math.abs(revDelta)}% vs last month. Consider a limited-time offer to drive bookings.`, 'urgent')
        if (avgDailyRev > 0) add(`Averaging ${formatCurrency(avgDailyRev)} per day this month — on track for ~${formatCurrency(forecastRev)} by month end.`, 'tip')
        if (projectedRev > 0) add(`${formatCurrency(projectedRev)} in confirmed upcoming revenue is locked in. Send reminders to protect every booking.`, 'win')
        if (lostToNoShows > 0) add(`~${formatCurrency(lostToNoShows)} lost to no-shows this month. Require deposits to protect your revenue.`, 'urgent')
        if (weekGrowth > 15) add(`Bookings this week are up ${weekGrowth}% vs last week — strong momentum!`, 'growth')
        if (weekGrowth < -15 && lastWeekBookings > 0) add(`Bookings dropped ${Math.abs(weekGrowth)}% week-on-week. Post your booking link on social media today.`, 'urgent')
        if (upcoming7.length > 10) add(`${upcoming7.length} confirmed ${meta.primaryUnit.toLowerCase()} in the next 7 days — great forward pipeline!`, 'win')
        if (upcoming7.length === 0 && completedAll.length > 0) add(`No ${meta.primaryUnit.toLowerCase()} in the next 7 days. Share your booking link now to fill your diary.`, 'urgent')
        if (upcoming7.length > 0 && upcoming7.length <= 3) add(`Only ${upcoming7.length} upcoming booking(s) this week. Post your link on WhatsApp or Instagram to drive more.`, 'tip')
        if (avgMonthlyBookings > 0) add(`On pace for ~${avgMonthlyBookings} ${meta.primaryUnit.toLowerCase()} this month based on your current rate.`, 'tip')
        if (busiestDay) add(`${busiestDay[0]} is your busiest day (${busiestDay[1]} sessions). Keep all ${meta.resourceLabel.toLowerCase()} available — don't leave gaps.`, 'tip')
        if (quietestDay && quietestDay !== busiestDay?.[0]) add(`${quietestDay} is your quietest day. A small promotion on ${quietestDay}s can even out your week.`, 'tip')
        if (peakTimeSlot) add(`${peakTimeSlot[0]}:00–${Number(peakTimeSlot[0])+1}:00 is your peak slot (${peakTimeSlot[1]} sessions). Keep it fully protected and open.`, 'tip')
        if (offPeakHour) add(`Bookings drop off around ${offPeakHour}:00. Use that time for admin or offer a flash discount to fill it.`, 'tip')
        if (eveningBookings > morningBookings + afternoonBookings) add(`Most of your bookings are in the evening. Make your booking link easy to find after 6pm.`, 'tip')
        if (morningBookings > afternoonBookings + eveningBookings) add(`Most bookings are in the morning. Promote afternoon and evening slots to balance your capacity.`, 'tip')
        if (weekendBookings > weekdayBookings2 && completedAll.length > 5) add(`More than half your bookings are on weekends. Maximise your Saturday/Sunday availability.`, 'tip')
        if (avgLeadDays === 0 && completedAll.length > 5) add(`Most clients book same-day. Pin your booking link in your Instagram bio and WhatsApp status.`, 'tip')
        if (avgLeadDays >= 1 && avgLeadDays <= 2) add(`Clients book ${avgLeadDays} day(s) ahead on average. Send a reminder 48hrs before to reduce no-shows.`, 'tip')
        if (avgLeadDays > 7) add(`Clients book ${avgLeadDays} days in advance — your diary fills early. Keep your availability calendar up to date.`, 'win')
        if (lastMinutePct > 40) add(`${lastMinutePct}% of bookings are same-day. An "urgent slot" option can capture even more of this demand.`, 'tip')
        if (returnRate >= 60) add(`${returnRate}% of clients return — exceptional loyalty. Ask your best clients to leave a Google review.`, 'win')
        if (returnRate >= 40 && returnRate < 60) add(`${returnRate}% return rate is solid. Add a "Book again" link in confirmation emails to nudge repeat visits.`, 'win')
        if (returnRate < 30 && uniqueCustomers > 5) add(`Only ${returnRate}% of clients re-book. Follow up 4 weeks after each visit with an offer to return.`, 'urgent')
        if (newThisMonth > 0) add(`${newThisMonth} new ${meta.clientLabel.toLowerCase()}s this month. Give them a great first experience to turn them into regulars.`, 'tip')
        if (topCustomer && topCustomer[1] >= 3) add(`${topCustomer[0].split('@')[0]} is your most loyal client with ${topCustomer[1]} visits. A loyalty reward keeps them coming back.`, 'win')
        if (topService) add(`"${topService[0]}" is your #1 service (${topServicePct}% of sessions). Put it at the top of your booking page.`, 'tip')
        if (bottomService && bottomService[1] <= 2 && serviceList.length > 2) add(`"${bottomService[0]}" has had only ${bottomService[1]} booking(s). Consider removing it to keep your page focused.`, 'tip')
        if (topStaff) add(`${topStaff[0]} is your busiest team member (${topStaff[1]} sessions). Make sure clients can request them specifically.`, 'tip')
        if (bottomStaff && bottomStaff[1] <= 2) add(`${bottomStaff[0]} has only ${bottomStaff[1]} booking(s). Check their availability is configured correctly.`, 'tip')
        if (noShowRate > 15) add(`No-show rate is ${noShowRate}% — critical. Enable deposit requirements immediately to drop this below 2%.`, 'urgent')
        if (noShowRate > 5 && noShowRate <= 15) add(`No-show rate is ${noShowRate}%. SMS reminders 24hrs before each session can cut this by 60–70%.`, 'urgent')
        if (noShowRate <= 2 && thisMonthAll.length > 5) add(`No-show rate is only ${noShowRate}% — excellent. Your reminder system is working perfectly.`, 'win')
        if (cancellationRate > 20) add(`${cancellationRate}% cancellation rate. Tighten your policy — require 24hrs notice or retain a partial deposit.`, 'urgent')
        if (depositRate < 30 && completedAll.length > 10) add(`Only ${depositRate}% of bookings take a deposit. Enabling this protects revenue and reduces no-shows.`, 'tip')
        if (completionRate >= 85) add(`${completionRate}% of booked sessions completed — excellent execution. Keep it up!`, 'win')
        if (confirmedRate > 70) add(`${confirmedRate}% of this month's bookings are confirmed — a strong forward order book.`, 'win')

        const tagConfig: Record<string, { bg: string; border: string; dot: string; textColor: string; label: string }> = {
          urgent: { bg: '#fef2f2', border: '#fecaca', dot: '#ef4444', textColor: '#7f1d1d', label: 'Action needed' },
          growth: { bg: '#f0fdf4', border: '#bbf7d0', dot: '#10b981', textColor: '#064e3b', label: 'Growth'        },
          win:    { bg: '#eff6ff', border: '#bfdbfe', dot: '#3b82f6', textColor: '#1e3a8a', label: 'Win'           },
          tip:    { bg: '#f8fafc', border: '#e2e8f0', dot: '#94a3b8', textColor: '#475569', label: 'Tip'           },
        }

        const visible = allInsights.slice(0, 40)

        return (
          <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-500" />
                <p className="font-bold text-gray-900 text-sm">Insights & Recommendations</p>
                <span className="text-xs px-2 py-0.5 rounded-full ml-1 font-medium bg-indigo-50 text-indigo-600 border border-indigo-100">
                  Based on your numbers
                </span>
              </div>
              <span className="text-xs font-medium text-gray-400">{visible.length} recommendations</span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 text-gray-300 animate-spin" /></div>
            ) : visible.length === 0 ? (
              <p className="text-sm text-center py-8 text-gray-400">Add more bookings to unlock personalised recommendations.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {visible.map((insight, i) => {
                  const c = tagConfig[insight.tag]
                  return (
                    <div key={i} className="flex gap-3 rounded-xl p-4 transition-all hover:scale-[1.01]"
                      style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: c.dot }} />
                      <p className="text-xs leading-relaxed flex-1" style={{ color: c.textColor }}>{insight.text}</p>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="flex items-center gap-4 mt-5 pt-4 border-t border-gray-100">
              {(['urgent','growth','win','tip'] as const).map(tag => {
                const c = tagConfig[tag]
                const count = visible.filter(i => i.tag === tag).length
                if (!count) return null
                return (
                  <div key={tag} className="flex items-center gap-1.5 text-xs text-gray-400">
                    <div className="w-2 h-2 rounded-full" style={{ background: c.dot }} />
                    {count} {c.label}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

    </div>
  )
}
