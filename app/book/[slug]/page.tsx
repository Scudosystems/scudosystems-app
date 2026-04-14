'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { formatCurrency, generateTimeSlots, formatDate, formatTime, generateBookingRef } from '@/lib/utils'
import { VERTICALS, VERTICAL_BOOKING_FIELDS } from '@/lib/verticals'
import { ChevronLeft, ChevronRight, Clock, CheckCircle, Calendar, User, Phone, Mail, Loader2, AlertTriangle, ShieldCheck, Share2, Flame, TrendingUp } from 'lucide-react'
import type { Tenant, Service, Staff, Availability } from '@/types/database'
import type { VerticalId } from '@/lib/verticals'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { getActiveTier, getNextTier, formatCountdown } from '@/lib/affiliate'
import type { PricingTier } from '@/lib/affiliate'
import { getIndustryTheme, BOOKING_THEMES } from '@/lib/booking-themes'

import { hasModule, LIVE_AVAILABILITY_VERTICALS } from '@/lib/industry-modules'

// Simple SVG social share icons (Lucide doesn't include these)
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
)

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.27a8.16 8.16 0 0 0 4.77 1.52V7.35a4.85 4.85 0 0 1-1.01-.66z"/>
  </svg>
)

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
)

const SnapchatIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.317 4.814-.01.149-.01.298-.01.447.31.178.766.241 1.308.131.396.055.775.179 1.016.422.12.12.162.27.15.42-.003.02-.003.04-.003.054-.084.504-.793.797-1.543 1.013-.15.048-.382.09-.586.131.09.218.09.484.09.769-.011.099-.035.198-.061.296-.035.1-.074.199-.12.299-.088.198-.208.377-.36.51-.09.077-.197.143-.297.198l.05.01c.048.01.092.04.13.04.193.011.39.011.585.02.234.01.466.03.697.065.148.02.295.045.44.075.352.074.709.188 1.04.38.303.178.571.43.763.74.04.07.08.14.12.208.109.2.165.4.165.602 0 .26-.093.495-.265.68-.192.208-.466.338-.752.41-.12.033-.24.054-.357.068-.17.025-.327.04-.48.058-.166.02-.336.04-.498.075-.247.058-.51.154-.73.3-.15.098-.294.218-.402.35-.095.115-.178.243-.238.382-.054.129-.083.258-.093.398-.01.11-.01.217.002.325-.01.055-.01.11-.02.164a5.54 5.54 0 0 1-.33 1.365 3.32 3.32 0 0 1-.61 1.007c-.28.32-.64.548-1.018.706-.416.173-.857.253-1.291.26-.426.01-.85-.052-1.264-.163-.385-.107-.753-.264-1.099-.44-.34-.175-.66-.371-.976-.574-.302-.195-.61-.394-.924-.57a4.37 4.37 0 0 0-.952-.403 4.386 4.386 0 0 0-1.042-.12c-.356 0-.714.04-1.055.12a4.37 4.37 0 0 0-.944.396c-.317.177-.627.374-.934.57-.308.199-.623.39-.952.556-.347.173-.708.33-1.093.436-.404.11-.82.168-1.244.165-.434-.003-.873-.078-1.29-.25a2.975 2.975 0 0 1-1.043-.712 3.32 3.32 0 0 1-.6-1.01 5.48 5.48 0 0 1-.326-1.365c-.01-.056-.01-.111-.02-.166.012-.108.012-.216.003-.323a1.618 1.618 0 0 0-.092-.4 2.07 2.07 0 0 0-.24-.382c-.107-.133-.253-.253-.4-.35-.22-.147-.48-.243-.73-.3a7.28 7.28 0 0 0-.494-.077 6.17 6.17 0 0 0-.476-.057c-.12-.014-.24-.035-.358-.068-.285-.072-.56-.202-.752-.41a.96.96 0 0 1-.266-.682c0-.2.058-.4.167-.603.038-.067.08-.138.118-.207.194-.312.464-.563.768-.74.33-.19.685-.305 1.037-.379.146-.03.293-.055.44-.074.232-.035.464-.055.697-.066.195-.008.39-.008.586-.02.037 0 .082-.03.13-.04l.05-.01a2.02 2.02 0 0 1-.297-.199 2.127 2.127 0 0 1-.358-.508 2.247 2.247 0 0 1-.12-.3 1.532 1.532 0 0 1-.062-.296c0-.285.001-.552.09-.769a2.88 2.88 0 0 1-.586-.132c-.751-.215-1.46-.509-1.542-1.013a.663.663 0 0 1-.003-.054.621.621 0 0 1 .15-.42c.24-.243.62-.367 1.016-.422.54.11.997.047 1.308-.13 0-.15 0-.299-.01-.448-.086-1.596-.21-3.621.317-4.814C7.859 1.07 11.216.793 12.206.793z"/>
  </svg>
)

type Step = 1 | 2 | 3 | 4 | 5 | 'payment' | 'success'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '')
  const isShort = normalized.length === 3
  const r = parseInt(isShort ? normalized[0] + normalized[0] : normalized.slice(0, 2), 16)
  const g = parseInt(isShort ? normalized[1] + normalized[1] : normalized.slice(2, 4), 16)
  const b = parseInt(isShort ? normalized[2] + normalized[2] : normalized.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function PaymentForm({
  amountLabel,
  onSuccess,
  onBack,
  primaryButtonStyle,
}: {
  amountLabel: string
  onSuccess: (paymentIntentId: string) => Promise<void>
  onBack: () => void
  primaryButtonStyle: React.CSSProperties
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setProcessing(true)
    setError(null)
    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      })
      if (stripeError) {
        setError(stripeError.message || 'Payment failed. Please try again.')
        return
      }
      if (paymentIntent?.status === 'succeeded') {
        await onSuccess(paymentIntent.id)
        return
      }
      setError('Payment requires additional verification. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-dark">Deposit to confirm</p>
          <p className="text-sm font-bold text-dark">{amountLabel}</p>
        </div>
        <p className="text-xs text-dark/50 mt-1">Secure checkout powered by Stripe.</p>
      </div>
      <div className="bg-white rounded-2xl border border-border p-4">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-dark/60 hover:bg-[#f8f6f1] transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
          style={primaryButtonStyle}
        >
          {processing ? 'Processing…' : 'Pay Deposit'}
        </button>
      </div>
      <div className="flex items-center gap-2 text-xs text-dark/40">
        <ShieldCheck className="w-3.5 h-3.5" />
        Payments are encrypted and secured by Stripe.
      </div>
    </form>
  )
}

export default function PublicBookingPage() {
  const { slug } = useParams<{ slug: string }>()
  const searchParams = useSearchParams()
  const supabase = createSupabaseBrowserClient()
  const forcedVariant = searchParams?.get('ab')
  const previewVariant = forcedVariant === 'A' || forcedVariant === 'B' ? forcedVariant : null
  const isPreview = searchParams?.get('preview') === '1'

  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>(1)
  const [submitting, setSubmitting] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [connectRequired, setConnectRequired] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallHelp, setShowInstallHelp] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [abVariant, setAbVariant] = useState<'A' | 'B'>('A')
  // abAssigned becomes true only after the variant assignment effect has run.
  // This prevents the view-tracking effect from firing with the wrong 'A' default
  // before localStorage / random assignment has had a chance to set the real variant.
  const [abAssigned, setAbAssigned] = useState(false)
  const [abTracked, setAbTracked] = useState(false)

  // Affiliate / dynamic pricing / event poster
  const [refCode, setRefCode] = useState<string | null>(null)
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([])
  const [activeTier, setActiveTier] = useState<PricingTier | null>(null)
  const [nextTier, setNextTier] = useState<PricingTier | null>(null)
  const [countdown, setCountdown] = useState<string>('')
  const [eventPoster, setEventPoster] = useState<any | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Selections
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null | 'any'>('any')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [returnDate, setReturnDate] = useState<Date | null>(null)
  const [returnTime, setReturnTime] = useState<string>('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [bookingRef, setBookingRef] = useState<string>('')
  const [extraFields, setExtraFields] = useState<Record<string, string>>({})
  const [liveAvailability, setLiveAvailability] = useState<{ time: string | null; withinWindow: boolean; label?: string; subtitle?: string } | null>(null)

  // Customer details
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')

  // Calendar
  const [calendarMonth, setCalendarMonth] = useState(new Date())

  const showDynamicPricing = hasModule(tenant?.vertical, 'dynamic_pricing')
  const showEvents = hasModule(tenant?.vertical, 'events')
  const showSocialShare = hasModule(tenant?.vertical, 'social_share')
  const supportsLiveAvailability = tenant?.vertical
    ? LIVE_AVAILABILITY_VERTICALS.has(tenant.vertical as string)
    : false
  const isSupercar = tenant?.vertical === 'supercar'
  const liveEnabled = (tenant?.booking_page_show_live_availability ?? (isSupercar ? true : false)) && supportsLiveAvailability
  const minRentalDays = tenant?.rental_min_days ?? 1
  const rentalRequirements = (tenant?.rental_requirements || '').trim()
  const minReturnDate = selectedDate
    ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + minRentalDays)
    : null
  const minReturnDateStr = minReturnDate
    ? minReturnDate.toISOString().split('T')[0]
    : ''
  const rentalReturnInvalid = !!(isSupercar && (!returnDate || !returnTime || (minReturnDate ? returnDate < minReturnDate : false)))

  useEffect(() => {
    async function load() {
      const { data: t } = await supabase.from('tenants').select('*').eq('slug', slug).single()
      const typedTenant = t as any
      if (!typedTenant || (!typedTenant.booking_page_enabled && !isPreview)) { setLoading(false); return }
      setTenant(typedTenant)

      const [{ data: svcs }, { data: st }, { data: avail }] = await Promise.all([
        supabase.from('services').select('*').eq('tenant_id', typedTenant.id).eq('is_active', true).order('sort_order'),
        supabase.from('staff').select('*').eq('tenant_id', typedTenant.id).eq('is_active', true),
        supabase.from('availability').select('*').eq('tenant_id', typedTenant.id).eq('is_active', true),
      ])
      setServices(svcs || [])
      setStaff(st || [])
      setAvailability(avail || [])
      setLoading(false)
    }
    load()
  }, [slug, isPreview])

  useEffect(() => {
    if (!isSupercar) return
    if (!selectedDate) {
      setReturnDate(null)
      return
    }
    if (!returnDate || (minReturnDate && returnDate < minReturnDate)) {
      setReturnDate(minReturnDate || selectedDate)
    }
  }, [isSupercar, selectedDate, minRentalDays])

  useEffect(() => {
    if (!isSupercar) return
    if (selectedTime && !returnTime) {
      setReturnTime(selectedTime)
    }
  }, [isSupercar, selectedTime])

  // ─── Affiliate ref code tracking ───────────────────────────────────
  useEffect(() => {
    const ref = searchParams?.get('ref') || null
    if (!ref) {
      // Check sessionStorage for previously captured ref
      const stored = typeof window !== 'undefined' ? window.sessionStorage.getItem('scudo_ref') : null
      if (stored) setRefCode(stored)
      return
    }
    setRefCode(ref)
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('scudo_ref', ref)
    }
  }, [searchParams])

  // Fire a click event when tenant + refCode are known
  useEffect(() => {
    if (!tenant || !refCode) return
    const fireClick = async () => {
      try {
        // Look up affiliate by code
        const { data: affiliate } = await supabase
          .from('affiliates')
          .select('id')
          .eq('tenant_id', tenant.id)
          .eq('code', refCode)
          .eq('status', 'active')
          .single()
        const typedAffiliate = affiliate as { id: string } | null
        if (!typedAffiliate) return
        // Record the click (fire and forget)
        await (supabase.from('affiliate_clicks') as any).insert({
          affiliate_id: typedAffiliate.id,
          tenant_id: tenant.id,
          landing_url: typeof window !== 'undefined' ? window.location.href : null,
          referrer: typeof document !== 'undefined' ? document.referrer || null : null,
        })
        // Increment total_clicks on the affiliate (best-effort, ignore errors)
        supabase
          .from('affiliates' as any)
          .select('total_clicks')
          .eq('id', typedAffiliate.id)
          .single()
          .then(({ data: aff }) => {
            if (aff) {
              (supabase
                .from('affiliates') as any)
                .update({ total_clicks: ((aff as any).total_clicks || 0) + 1 })
                .eq('id', typedAffiliate.id)
                .then(() => null, () => null)
            }
          }, () => null)
      } catch { /* non-critical, silently ignore */ }
    }
    fireClick()
  }, [tenant?.id, refCode])

  // ─── Pricing tiers ──────────────────────────────────────────────────
  useEffect(() => {
    if (!tenant || !showDynamicPricing) {
      setPricingTiers([])
      setActiveTier(null)
      setNextTier(null)
      return
    }
    let cancelled = false
    const loadTiers = async () => {
      try {
        const { data } = await supabase
          .from('pricing_tiers')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('is_active', true)
          .order('sort_order')
        if (cancelled) return
        const tiers = (data || []) as PricingTier[]
        setPricingTiers(tiers)
        setActiveTier(getActiveTier(tiers))
        setNextTier(getNextTier(tiers))
      } catch { /* table may not exist yet */ }
    }
    loadTiers()
    return () => { cancelled = true }
  }, [tenant?.id, showDynamicPricing])

  // Live countdown ticker
  useEffect(() => {
    if (!showDynamicPricing) {
      setCountdown('')
      return
    }
    if (countdownRef.current) clearInterval(countdownRef.current)
    const target = nextTier?.ends_at || activeTier?.ends_at
    if (!target) { setCountdown(''); return }
    const tick = () => setCountdown(formatCountdown(target))
    tick()
    countdownRef.current = setInterval(tick, 1000)
    return () => { if (countdownRef.current) clearInterval(countdownRef.current) }
  }, [showDynamicPricing, activeTier?.id, nextTier?.id])

  // ─── Event poster (for nightclub / events verticals) ─────────────────
  useEffect(() => {
    if (!tenant || !showEvents) {
      setEventPoster(null)
      return
    }
    let cancelled = false
    const loadPoster = async () => {
      try {
        const { data } = await supabase
          .from('event_posters')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        if (!cancelled && data) setEventPoster(data)
      } catch { /* no poster or table not yet created */ }
    }
    loadPoster()
    return () => { cancelled = true }
  }, [tenant?.id, showEvents])

  useEffect(() => {
    if (!tenant) return
    const abEnabled = tenant.booking_page_ab_enabled
    if (!abEnabled) {
      setAbVariant('A')
      setAbAssigned(true)
      return
    }
    if (previewVariant) {
      setAbVariant(previewVariant)
      setAbAssigned(true)
      return
    }
    const key = `scudo_ab_${tenant.slug}`
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
    if (stored === 'A' || stored === 'B') {
      setAbVariant(stored)
      setAbAssigned(true)
      return
    }
    const splitRaw = tenant.booking_page_ab_split ?? 50
    const split = Math.min(Math.max(parseInt(String(splitRaw), 10) || 50, 0), 100)
    const pick = Math.random() * 100 < split ? 'B' : 'A'
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, pick)
    }
    setAbVariant(pick)
    setAbAssigned(true)
  }, [tenant, previewVariant])

  useEffect(() => {
    // Wait for variant assignment to complete before tracking — otherwise we'd
    // always record the 'A' default before the real variant is known, making
    // Variant B's view count permanently wrong.
    if (!tenant || !abAssigned || abTracked === true) return
    // Only track when A/B is actually running so we don't pollute stats with
    // regular (non-test) traffic hitting variant A.
    if (!tenant.booking_page_ab_enabled) return
    fetch('/api/booking-page/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: tenant.slug, variant: abVariant, event: 'view' }),
    }).catch(() => null)
    setAbTracked(true)
  }, [tenant, abVariant, abAssigned, abTracked])

  useEffect(() => {
    const ua = typeof window !== 'undefined' ? window.navigator.userAgent.toLowerCase() : ''
    setIsIos(/iphone|ipad|ipod/.test(ua))
    setIsStandalone(
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      (window.navigator as any).standalone === true
    )

    const handler = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    if (!selectedDate || !selectedService || !tenant) return
    loadSlots()
  }, [selectedDate, selectedService, selectedStaff])

  useEffect(() => {
    if (!tenant) return
    computeLiveAvailability()
    const interval = setInterval(() => {
      computeLiveAvailability()
    }, 60000)
    return () => clearInterval(interval)
  }, [
    tenant?.id,
    liveEnabled,
    tenant?.allow_same_day,
    availability.length,
    services.length,
    selectedService?.id,
    supportsLiveAvailability,
  ])

  useEffect(() => {
    setClientSecret(null)
    setPaymentIntentId(null)
    setPaymentError(null)
    setConnectRequired(false)
  }, [selectedService?.id, selectedDate, selectedTime])

  const loadSlots = async () => {
    if (!selectedDate || !selectedService || !tenant) return
    const dateStr = selectedDate.toISOString().split('T')[0]
    const dayOfWeek = selectedDate.getDay()

    // Get availability for this day
    const dayAvail = availability.filter(a =>
      a.day_of_week === dayOfWeek &&
      (!a.staff_id || (selectedStaff && selectedStaff !== 'any' && a.staff_id === (selectedStaff as Staff).id))
    )

    const slotInterval = isSupercar ? 60 : selectedService.duration_minutes
    if (dayAvail.length === 0) {
      if (isSupercar) {
        const fallbackSlots = generateTimeSlots('08:00', '20:00', slotInterval)
        setAvailableSlots(fallbackSlots)
        return
      }
      setAvailableSlots([])
      return
    }

    // Get existing bookings
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('booking_time, service_id')
      .eq('tenant_id', tenant.id)
      .eq('booking_date', dateStr)
      .in('status', ['pending', 'confirmed'])

    const typedExistingBookings = (existingBookings || []) as { booking_time: string }[]
    const takenTimes = new Set(typedExistingBookings.map(b => b.booking_time.slice(0, 5)))

    // Generate slots from availability
    const slots: string[] = []
    for (const avail of dayAvail) {
      const daySlots = generateTimeSlots(avail.start_time, avail.end_time, slotInterval)
      slots.push(...daySlots)
    }

    const uniqueSlots = Array.from(new Set(slots)).filter(s => !takenTimes.has(s)).sort()
    setAvailableSlots(uniqueSlots)
  }

  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
  }

  const toTimeString = (mins: number) => {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const computeLiveAvailability = async () => {
    if (!tenant || !supportsLiveAvailability) {
      setLiveAvailability(null)
      return
    }
    if (!isSupercar && !services.length) {
      setLiveAvailability(null)
      return
    }
    if (!isSupercar && !availability.length) {
      setLiveAvailability(null)
      return
    }
    if (!liveEnabled) {
      setLiveAvailability(null)
      return
    }
    if (!isSupercar && !tenant.allow_same_day) {
      setLiveAvailability(null)
      return
    }

    if (isSupercar) {
      const hasFleet = services.some(s => s.is_active)
      if (!hasFleet) {
        setLiveAvailability({ time: null, withinWindow: false, label: 'No vehicles available today', subtitle: 'Check another date' })
      } else {
        setLiveAvailability({ time: 'now', withinWindow: true, label: 'Vehicles available today', subtitle: 'Reserve now before prime slots go' })
      }
      return
    }

    const now = new Date()
    const dateStr = now.toLocaleDateString('en-CA')
    const dayOfWeek = now.getDay()
    const windowMinutes = tenant.booking_page_live_window_minutes ?? 60
    const bufferMinutes = tenant.booking_page_live_buffer_minutes ?? 20
    const baseDuration = selectedService?.duration_minutes || Math.min(...services.map(s => s.duration_minutes || 30))
    const minAdvanceMinutes = Math.max(0, (tenant.minimum_advance_hours || 0) * 60)

    const dayAvail = availability.filter(a => a.day_of_week === dayOfWeek)
    if (!dayAvail.length) {
      setLiveAvailability({ time: null, withinWindow: false })
      return
    }

    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('booking_time, service_id, staff_id, services(duration_minutes)')
      .eq('tenant_id', tenant.id)
      .eq('booking_date', dateStr)
      .in('status', ['pending', 'confirmed'])

    const durationByService = new Map(services.map(s => [s.id, s.duration_minutes || baseDuration]))

    const blocksByStaff = new Map<string, { start: number; end: number }[]>()
    ;(existingBookings || []).forEach((b: any) => {
      const duration = b.services?.duration_minutes || durationByService.get(b.service_id) || baseDuration
      const start = toMinutes(b.booking_time.slice(0, 5))
      const end = start + duration + bufferMinutes
      const key = b.staff_id || 'any'
      if (!blocksByStaff.has(key)) blocksByStaff.set(key, [])
      blocksByStaff.get(key)!.push({ start, end })
    })

    const earliest = toMinutes(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`) + minAdvanceMinutes
    const windowEnd = earliest + windowMinutes

    let nextSlot: number | null = null

    for (const avail of dayAvail) {
      const slots = generateTimeSlots(avail.start_time, avail.end_time, baseDuration)
      const blocks = blocksByStaff.get(avail.staff_id || 'any') || []
      for (const slot of slots) {
        const slotMin = toMinutes(slot)
        if (slotMin < earliest) continue
        const overlaps = blocks.some(block => slotMin < block.end && (slotMin + baseDuration) > block.start)
        if (overlaps) continue
        if (nextSlot === null || slotMin < nextSlot) nextSlot = slotMin
      }
    }

    if (nextSlot === null) {
      setLiveAvailability({ time: null, withinWindow: false })
      return
    }

    setLiveAvailability({
      time: toTimeString(nextSlot),
      withinWindow: nextSlot <= windowEnd,
    })
  }

  const createBooking = async (options?: { depositPaid?: boolean; paymentIntentId?: string }) => {
    if (!tenant || !selectedService || !selectedDate || !selectedTime) return
    if (isSupercar && rentalReturnInvalid) {
      alert('Please choose a valid return date and time before confirming.')
      return
    }
    setSubmitting(true)
    try {
      const ref = bookingRef || generateBookingRef()
      if (!bookingRef) setBookingRef(ref)
      const metadataPayload = { ...extraFields }
      if (isSupercar && returnDate && returnTime) {
        metadataPayload.rental_pickup_date = selectedDate.toISOString().split('T')[0]
        metadataPayload.rental_pickup_time = selectedTime
        metadataPayload.rental_return_date = returnDate.toISOString().split('T')[0]
        metadataPayload.rental_return_time = returnTime
        metadataPayload.rental_min_days = String(minRentalDays)
      }
      if (tenant.booking_page_ab_enabled) {
        metadataPayload.ab_variant = abVariant
      }
      if (refCode) {
        metadataPayload.affiliate_ref = refCode
      }
      const metadata = Object.keys(metadataPayload).length > 0 ? metadataPayload : null
      const depositPaid = options?.depositPaid ?? false
      const { error } = await (supabase.from('bookings') as any).insert({
        tenant_id: tenant.id,
        service_id: selectedService.id,
        staff_id: selectedStaff && selectedStaff !== 'any' ? (selectedStaff as Staff).id : null,
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        booking_date: selectedDate.toISOString().split('T')[0],
        booking_time: selectedTime,
        status: tenant.auto_confirm ? 'confirmed' : 'pending',
        queue_status: 'scheduled',
        deposit_paid: depositPaid,
        deposit_amount_pence: selectedService.requires_deposit ? selectedService.deposit_pence : 0,
        total_amount_pence: selectedService.price_pence,
        stripe_payment_intent_id: options?.paymentIntentId || null,
        metadata,
        notes: notes || null,
        booking_ref: ref,
      })
      if (error) throw error

      // Trigger email via API
      await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          bookingRef: ref,
          customerEmail: email,
          customerName: name,
          serviceName: selectedService.name,
          bookingDate: formatDate(selectedDate),
          bookingTime: formatTime(selectedTime),
          totalAmount: formatCurrency(selectedService.price_pence),
          depositAmount: depositPaid ? formatCurrency(selectedService.deposit_pence) : null,
        }),
      })

      if (tenant.booking_page_ab_enabled) {
        fetch('/api/booking-page/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: tenant.slug, variant: abVariant, event: 'booking' }),
        }).catch(() => null)
      }

      setStep('success')
    } catch (err) {
      console.error(err)
      alert('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const setupPayment = async () => {
    if (!tenant || !selectedService) return false
    setPaymentLoading(true)
    setPaymentError(null)
    setConnectRequired(false)
    try {
      const ref = bookingRef || generateBookingRef()
      if (!bookingRef) setBookingRef(ref)

      const res = await fetch('/api/stripe/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          serviceId: selectedService.id,
          bookingRef: ref,
          customerEmail: email,
        }),
      })

      if (res.status === 409) {
        setConnectRequired(true)
        setPaymentError('Payments are not configured for this business yet.')
        return false
      }

      const data = await res.json()
      if (!res.ok || !data?.clientSecret) {
        throw new Error(data?.error || 'Payment setup failed')
      }

      setClientSecret(data.clientSecret)
      setPaymentIntentId(data.paymentIntentId || null)
      return true
    } catch (err: any) {
      setPaymentError(err?.message || 'Payment setup failed')
      return false
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleDetailsSubmit = async () => {
    if (paymentRequired) {
      if (!paymentsConfigured) {
        await createBooking({ depositPaid: false })
        return
      }
      const ok = await setupPayment()
      if (ok) setStep('payment')
      return
    }
    await createBooking({ depositPaid: false })
  }

  const baseBrandColour = tenant?.brand_colour || '#0d6e6e'
  const vertical = tenant?.vertical ? VERTICALS[tenant.vertical as VerticalId] : null
  const isDental = vertical?.id === 'dental'
  const bookingFields = vertical ? VERTICAL_BOOKING_FIELDS[vertical.id] : []
  const defaultThemeKey = tenant?.booking_page_theme || 'soft'
  const defaultFontChoice = tenant?.booking_page_font || 'sans'
  const defaultButtonStyle = tenant?.booking_page_button_style || 'solid'
  const defaultHeadline = vertical
    ? `${vertical.bookingPageLabel} at ${tenant?.business_name || 'our studio'}`
    : `Book an Appointment at ${tenant?.business_name || 'our studio'}`
  // ─── Per-industry booking page subtext ───────────────────────────────────
  // Natural British English, not AI-sounding, hints at the kinds of services
  // available for each industry without duplicating the live service list.
  const VERTICAL_BOOKING_SUBTEXT: Partial<Record<VerticalId, string>> = {
    dental:      'From routine check-ups and scale & polish to teeth whitening and implant consultations — book your next dental appointment online, day or night. No phone queues, no hold music.',
    beauty:      'Whether it\'s a facial, waxing, lash tinting or a full pamper session — book your treatment online and you\'re confirmed straight away. Simple as that.',
    hairsalon:   'Book your cut, colour, blow dry or treatment online. Choose your stylist, pick a time that suits you, and you\'re all booked in. No need to ring ahead.',
    nightclub:   'Secure your table, VIP booth or guestlist spot before doors open. Pick your night, sort your group, and you\'re on the list.',
    spa:         'From Swedish massage and hot stone therapy to luxury facials and full spa days — book your treatment online and arrive ready to switch off.',
    gym:         'Book your PT session, group class, gym induction or nutrition consultation in seconds. Real-time availability, no back-and-forth.',
    optician:    'Book your eye test, contact lens fitting or frame consultation online. NHS and private appointments available — just pick a time that suits you.',
    vet:         'From routine jabs and check-ups to grooming and dental cleans — book your pet\'s appointment online any time. Quick, simple, no waiting on hold.',
    auto:        'Book your MOT, full service, diagnostic check or tyre fitting online. Instant confirmation, no phone calls needed. We\'ll see you at the garage.',
    tutoring:    'Book a 1-to-1 session, group class or initial assessment online. Choose your trainer, pick a time, and you\'re confirmed in seconds.',
    restaurant:  'Book your table online in seconds. Tell us your group size, pick a time, and we\'ll have everything ready for your arrival.',
    barber:      'Book your fade, trim, beard tidy or hot towel shave online. Pick your barber, choose a slot, and you\'re sorted. Dead easy.',
    tattoo:      'Book your tattoo consultation, sitting or touch-up online. Deposits taken securely — no back-and-forth DMs needed.',
    carwash:     'Book your full valet, machine wash or interior detail online. Pick your slot, drop it off, and we\'ll take care of the rest.',
    driving:     'Book your driving lesson, theory prep or mock test online. Choose your instructor and pick a time that fits round your week.',
    takeaway:    'Order ahead, book a collection slot or reserve a table — all online. No queuing, just good food ready when you want it.',
    supercar:    'Book your track day, supercar experience or road drive online. Choose your car, confirm your slot, and get ready for something special.',
    photography: 'Book your portrait session, event shoot or headshots online. Choose your photographer, pick your date, and we\'ll handle the rest.',
    grooming:    'Book your dog\'s full groom, bath, nail trim or tidy-up online. Drop-off times, breed notes and all — sorted in seconds.',
    physio:      'Book your physiotherapy assessment, sports massage or follow-up appointment online. Tell us what you need and we\'ll match you with the right therapist.',
    nails:       'Book your gel manicure, acrylic set, nail art or pedicure online. Choose your nail tech, pick your time, and you\'re confirmed straight away.',
    aesthetics:  'Book your consultation, Botox, filler or skin treatment online. Discreet, professional and fully confirmed — no phone calls needed.',
    lash:        'Book your lash extensions, lift & tint or infill online. Pick your lash artist, choose a time, and you\'re all booked in.',
    escape:      'Book your escape room adventure online. Choose your group size, pick a date, and we\'ll have the room set and ready for you.',
    solicitor:   'Book your legal consultation online. Whether it\'s conveyancing, family law, employment or a general query — speak to a solicitor at a time that suits you.',
    accountant:  'Book your accountancy consultation, tax review or self-assessment session online. Straightforward, professional advice at a time that works for you.',
  }
  const defaultSubtext = (vertical && VERTICAL_BOOKING_SUBTEXT[vertical.id])
    || `Browse our services, pick a time that suits you, and you\'re confirmed straight away.`
  const baseHeadline = (tenant?.booking_page_headline || '').trim() || defaultHeadline
  const baseSubtext = (tenant?.booking_page_subtext || '').trim() || defaultSubtext
  const baseCtaLabel = (tenant?.booking_page_cta_label || '').trim() || 'Confirm Booking'

  const useVariantB = tenant?.booking_page_ab_enabled && abVariant === 'B'
  const brandColour = useVariantB
    ? (tenant?.booking_page_variant_b_brand_colour || baseBrandColour)
    : baseBrandColour
  const themeKey = useVariantB
    ? (tenant?.booking_page_variant_b_theme || defaultThemeKey)
    : defaultThemeKey
  const fontChoice = useVariantB
    ? (tenant?.booking_page_variant_b_font || defaultFontChoice)
    : defaultFontChoice
  const buttonStyle = useVariantB
    ? (tenant?.booking_page_variant_b_button_style || defaultButtonStyle)
    : defaultButtonStyle

  const headline = useVariantB
    ? (((tenant?.booking_page_variant_b_headline || '').trim()) || baseHeadline)
    : baseHeadline
  const subtext = useVariantB
    ? (((tenant?.booking_page_variant_b_subtext || '').trim()) || baseSubtext)
    : baseSubtext
  const ctaLabel = useVariantB
    ? (((tenant?.booking_page_variant_b_cta_label || '').trim()) || baseCtaLabel)
    : baseCtaLabel

  const theme = BOOKING_THEMES[themeKey] || BOOKING_THEMES.soft
  // Per-industry premium theme tokens — drives atmospheric visual layer
  const iTheme = getIndustryTheme(tenant?.vertical)
  const liveBannerIsDark = iTheme.pageClass === 'booking-dark' || iTheme.glassCards
  const liveBannerBg = liveAvailability?.withinWindow
    ? (liveBannerIsDark ? 'rgba(16,185,129,0.18)' : '#ecfdf5')
    : liveAvailability?.time
      ? (liveBannerIsDark ? 'rgba(245,158,11,0.2)' : '#fffbeb')
      : (liveBannerIsDark ? 'rgba(148,163,184,0.18)' : '#f8fafc')
  const liveBannerBorder = liveAvailability?.withinWindow
    ? (liveBannerIsDark ? 'rgba(16,185,129,0.35)' : '#a7f3d0')
    : liveAvailability?.time
      ? (liveBannerIsDark ? 'rgba(245,158,11,0.4)' : '#fde68a')
      : (liveBannerIsDark ? 'rgba(148,163,184,0.35)' : '#e2e8f0')
  const liveTextPrimary = liveBannerIsDark ? '#f8fafc' : '#0f172a'
  const liveTextMuted = liveBannerIsDark ? 'rgba(248,250,252,0.7)' : 'rgba(15,23,42,0.6)'
  const fontClass = fontChoice === 'serif' ? 'font-serif' : 'font-sans'
  // Allow industry theme to enhance heading weight/tracking on top of font choice
  const headingClass = fontChoice === 'serif'
    ? `font-serif font-bold ${iTheme.headingClass.includes('tracking') ? iTheme.headingClass.split(' ').filter(c => c.startsWith('tracking')).join(' ') : ''}`
    : `font-sans ${iTheme.headingClass}`
  const missingRequired = bookingFields.some(field => field.required && !extraFields[field.id]?.trim())
  const paymentRequired = !!(selectedService?.requires_deposit && selectedService.deposit_pence > 0)
  const paymentsConfigured = !!(tenant?.stripe_connect_account_id && tenant?.stripe_connect_onboarded)

  const primaryButtonStyle: React.CSSProperties =
    buttonStyle === 'solid'
      ? { backgroundColor: brandColour, color: '#ffffff' }
      : buttonStyle === 'soft'
        ? { backgroundColor: hexToRgba(brandColour, 0.15), color: brandColour, border: `1px solid ${hexToRgba(brandColour, 0.35)}` }
        : { backgroundColor: 'transparent', color: brandColour, border: `2px solid ${brandColour}` }

  const isDateAvailable = (date: Date) => {
    const dayOfWeek = date.getDay()
    return availability.some(a => a.day_of_week === dayOfWeek && !a.staff_id)
  }

  const getDaysInMonth = () => new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate()
  const getFirstDay = () => new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay()

  if (loading) {
    return (
      <div className={`min-h-screen bg-[#f8f6f1] flex items-center justify-center ${fontClass}`}>
        <Loader2 className="w-8 h-8 animate-spin text-teal" />
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className={`min-h-screen bg-[#f8f6f1] flex items-center justify-center ${fontClass}`}>
        <div className="text-center">
          <Calendar className="w-12 h-12 text-dark/20 mx-auto mb-3" />
          <h1 className={`${headingClass} text-2xl text-dark mb-2`}>Booking page not found</h1>
          <p className="text-dark/50">This booking page doesn't exist or has been disabled.</p>
        </div>
      </div>
    )
  }

  if (step === 'success') {
    const successTheme = getIndustryTheme(tenant?.vertical)
    return (
      <div
        className={`booking-page min-h-screen flex items-center justify-center p-4 ${fontClass} ${successTheme.pageClass}`}
        style={{ '--brand-colour': brandColour, background: successTheme.pageBg } as React.CSSProperties}
      >
        <div
          className={`${successTheme.cardRadius} p-8 max-w-md w-full text-center ${successTheme.glassCards ? 'glass-card' : ''}`}
          style={{
            background: successTheme.glassCards ? 'rgba(255,255,255,0.07)' : '#ffffff',
            border: `1.5px solid ${successTheme.cardBorder}`,
            boxShadow: successTheme.glassCards
              ? '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)'
              : '0 20px 60px rgba(0,0,0,0.1)',
          }}
        >
          {/* Success icon with glow */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full blur-xl opacity-30" style={{ backgroundColor: brandColour }} />
            <div className="relative w-20 h-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: hexToRgba(brandColour, 0.15) }}>
              <CheckCircle className="w-10 h-10" style={{ color: brandColour }} />
            </div>
          </div>
          <h1 className={`${headingClass} text-3xl text-dark mb-2`}>Booking Confirmed!</h1>
          <p className="text-dark/60 mb-6">A confirmation has been sent to {email}</p>
          <div
            className="rounded-xl p-4 text-left space-y-2 mb-6"
            style={{ background: successTheme.confirmBg, border: `1px solid ${successTheme.cardBorder}` }}
          >
            <div className="flex justify-between text-sm">
              <span className="text-dark/50">Reference</span>
              <span className="font-bold font-mono text-dark">{bookingRef}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-dark/50">Service</span>
              <span className="font-medium text-dark">{selectedService?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-dark/50">Date</span>
              <span className="font-medium text-dark">{selectedDate ? formatDate(selectedDate) : ''}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-dark/50">Time</span>
              <span className="font-medium text-dark">{selectedTime ? formatTime(selectedTime) : ''}</span>
            </div>
            {isSupercar && returnDate && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-dark/50">Return Date</span>
                  <span className="font-medium text-dark">{formatDate(returnDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark/50">Return Time</span>
                  <span className="font-medium text-dark">{returnTime ? formatTime(returnTime) : ''}</span>
                </div>
              </>
            )}
            {selectedStaff && selectedStaff !== 'any' && (
              <div className="flex justify-between text-sm">
                <span className="text-dark/50">With</span>
                <span className="font-medium text-dark">{(selectedStaff as Staff).name}</span>
              </div>
            )}
          </div>
          {tenant?.payment_link && (
            <div className="mb-4 p-4 rounded-xl text-center"
              style={{ background: hexToRgba(brandColour, 0.07), border: `1px solid ${hexToRgba(brandColour, 0.2)}` }}>
              {tenant.payment_link_note && (
                <p className="text-xs text-dark/60 mb-3">{tenant.payment_link_note}</p>
              )}
              <a
                href={tenant.payment_link}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 rounded-xl font-semibold text-sm"
                style={{ background: brandColour, color: '#fff' }}
              >
                {tenant.payment_link_label || 'Pay now →'}
              </a>
            </div>
          )}
          <a href={`/book/${slug}`} className="block w-full py-3 rounded-xl font-semibold text-sm"
            style={primaryButtonStyle}>
            {vertical?.bookingPageLabel || 'Book Again'}
          </a>
        </div>
      </div>
    )
  }

  const stepKeys = [
    'service',
    ...(staff.length > 1 ? ['staff'] : []),
    'date',
    'time',
    'details',
    ...(paymentRequired ? ['payment'] : []),
  ] as const
  const stepTitles = [
    'Select Service',
    ...(staff.length > 1 ? ['Select Staff'] : []),
    'Choose Date',
    'Choose Time',
    'Your Details',
    ...(paymentRequired ? ['Pay Deposit'] : []),
  ]
  const currentStepKey =
    step === 'payment'
      ? 'payment'
      : step === 1
        ? 'service'
        : step === 2
          ? (staff.length > 1 ? 'staff' : 'date')
          : step === 3
            ? (staff.length > 1 ? 'date' : 'time')
            : step === 4
              ? (staff.length > 1 ? 'time' : 'details')
              : 'details'
  const currentStepIdx = Math.max(0, stepKeys.indexOf(currentStepKey))

  return (
    <div
      className={`booking-page min-h-screen ${fontClass} ${iTheme.pageClass}`}
      style={{ '--brand-colour': brandColour, background: iTheme.pageBg || theme.pageBg } as React.CSSProperties}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 border-b shadow-sm"
        style={{
          background: iTheme.headerBg,
          borderColor: iTheme.cardBorder,
          backdropFilter: iTheme.glassCards ? 'blur(16px)' : undefined,
        }}
      >
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-3">
          {tenant.logo_url ? (
            <img src={tenant.logo_url} alt={tenant.business_name} className="h-10 w-auto object-contain" />
          ) : (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: brandColour }}>
              {tenant.business_name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="font-semibold text-dark text-base leading-tight">{tenant.business_name}</h1>
            {tenant.description && <p className="text-xs text-dark/50 leading-tight line-clamp-1">{tenant.description}</p>}
          </div>
        </div>
        {/* Progress */}
        <div className="max-w-xl mx-auto px-4 pb-3">
          <div className="flex items-center gap-1">
            {stepTitles.map((s, i) => (
              <div key={s} className="flex items-center gap-1 flex-1">
                <div className={`h-1 flex-1 rounded-full transition-all ${i <= currentStepIdx ? 'opacity-100' : 'opacity-30'}`}
                  style={{ backgroundColor: i <= currentStepIdx ? brandColour : '#e8e5e0' }} />
              </div>
            ))}
          </div>
          <p className="text-xs text-dark/40 mt-1">{stepTitles[currentStepIdx]}</p>
        </div>
      </div>

      {/* Hero — industry-themed atmospheric card */}
      <div className="max-w-xl mx-auto px-4 pt-5">
        <div
          className={`${iTheme.cardRadius} p-6 border relative overflow-hidden`}
          style={{
            background: iTheme.heroGradient
              || `linear-gradient(135deg, ${hexToRgba(vertical?.colour || brandColour, iTheme.heroTint)}, ${hexToRgba(brandColour, 0.06)})`,
            borderColor: iTheme.heroBorder,
            boxShadow: iTheme.glassCards
              ? '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)'
              : '0 4px 20px rgba(0,0,0,0.06)',
          }}
        >
          {/* Glow accent orb for dark themes */}
          {iTheme.glassCards && (
            <div
              className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-40 pointer-events-none"
              style={{ background: `radial-gradient(circle, ${brandColour}, transparent)` }}
            />
          )}
          <div className="relative">
            {/* Industry badge */}
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] px-2.5 py-1 rounded-full mb-3"
              style={{ background: iTheme.heroBadgeBg, color: iTheme.heroBadgeColor }}
            >
              {iTheme.heroBadgeLabel || vertical?.label || 'Book Now'}
            </span>
            <h2
              className={`${headingClass} text-2xl leading-tight`}
              style={{ color: iTheme.heroHeadingColor }}
            >
              {headline}
            </h2>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: iTheme.heroSubColor }}>
              {subtext}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Dynamic Pricing Countdown ─────────────────────────────────── */}
      {showDynamicPricing && activeTier && (
        <div className="max-w-xl mx-auto px-4 pt-4">
          <div
            className="rounded-2xl border p-4"
            style={{
              background: `linear-gradient(135deg, ${hexToRgba(brandColour, 0.08)}, ${hexToRgba(brandColour, 0.03)})`,
              borderColor: hexToRgba(brandColour, 0.25),
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: hexToRgba(brandColour, 0.15) }}
                >
                  <Flame className="w-4 h-4" style={{ color: brandColour }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-dark">{activeTier.tier_name}</p>
                  <p className="text-xs text-dark/50">
                    {activeTier.capacity !== null
                      ? `${Math.max(0, activeTier.capacity - activeTier.bookings_used)} spots remaining at this price`
                      : 'Limited time pricing'}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold" style={{ color: brandColour }}>
                  {formatCurrency(activeTier.price_pence)}
                </p>
              </div>
            </div>
            {(activeTier.display_countdown && (activeTier.ends_at || nextTier)) && countdown && (
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold"
                style={{ color: brandColour }}>
                <Clock className="w-3.5 h-3.5" />
                {nextTier
                  ? <>Price rises to {formatCurrency(nextTier.price_pence)} in <span className="font-mono ml-1">{countdown}</span></>
                  : <>This price ends in <span className="font-mono ml-1">{countdown}</span></>
                }
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Event Poster (nightclub / events) ─────────────────────────── */}
      {showEvents && eventPoster && (
        <div className="max-w-xl mx-auto px-4 pt-4">
          <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
            {eventPoster.poster_url && (
              <img
                src={eventPoster.poster_url}
                alt={eventPoster.title}
                className="w-full object-cover max-h-72"
              />
            )}
            <div className="p-4">
              <p className="font-bold text-dark text-lg leading-tight">{eventPoster.title}</p>
              {eventPoster.description && (
                <p className="text-sm text-dark/60 mt-1.5 leading-relaxed">{eventPoster.description}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-dark/50">
                {eventPoster.event_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(eventPoster.event_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                    {eventPoster.event_time && ` · ${eventPoster.event_time.slice(0, 5)}`}
                  </span>
                )}
                {eventPoster.venue_name && (
                  <span className="flex items-center gap-1">
                    📍 {eventPoster.venue_name}
                  </span>
                )}
                {eventPoster.min_age && (
                  <span className="flex items-center gap-1 font-semibold text-amber-700">
                    {eventPoster.min_age}+ only
                  </span>
                )}
                {eventPoster.dress_code && (
                  <span className="flex items-center gap-1">
                    Dress code: {eventPoster.dress_code}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Social Share Buttons ──────────────────────────────────────── */}
      {tenant.vertical && showSocialShare && (
        <div className="max-w-xl mx-auto px-4 pt-4">
          <div className="bg-white/80 backdrop-blur rounded-2xl border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Share2 className="w-4 h-4 text-dark/40" />
              <p className="text-sm font-semibold text-dark">
                {tenant.vertical === 'nightclub' ? 'Share this event' : 'Tell a friend'}
              </p>
              <TrendingUp className="w-3.5 h-3.5 text-dark/30 ml-auto" />
              <p className="text-xs text-dark/40">Help spread the word</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {/* Instagram */}
              <a
                href={`https://www.instagram.com/`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all hover:opacity-80 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}
                title="Share on Instagram"
              >
                <span className="text-white"><InstagramIcon /></span>
                <span className="text-[10px] font-semibold text-white">Instagram</span>
              </a>
              {/* TikTok */}
              <a
                href={`https://www.tiktok.com/`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all hover:opacity-80 active:scale-95 bg-black"
                title="Share on TikTok"
              >
                <span className="text-white"><TikTokIcon /></span>
                <span className="text-[10px] font-semibold text-white">TikTok</span>
              </a>
              {/* WhatsApp */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Book your spot: ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all hover:opacity-80 active:scale-95"
                style={{ backgroundColor: '#25D366' }}
                title="Share on WhatsApp"
              >
                <span className="text-white"><WhatsAppIcon /></span>
                <span className="text-[10px] font-semibold text-white">WhatsApp</span>
              </a>
              {/* Snapchat */}
              <a
                href={`https://www.snapchat.com/`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all hover:opacity-80 active:scale-95"
                style={{ backgroundColor: '#FFFC00' }}
                title="Share on Snapchat"
              >
                <span style={{ color: '#000' }}><SnapchatIcon /></span>
                <span className="text-[10px] font-semibold" style={{ color: '#000' }}>Snapchat</span>
              </a>
            </div>
            {refCode && (
              <p className="text-xs text-center text-dark/40 mt-3">
                Your referral link includes your partner code <span className="font-mono font-semibold text-dark/60">{refCode}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Add to Home Screen */}
      {!isStandalone && (
        <div className="max-w-xl mx-auto px-4 pt-4">
          <div className="bg-white/90 backdrop-blur rounded-2xl border border-border p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-dark">Save this page to your Home Screen</p>
              <p className="text-xs text-dark/50">
                Pin it like an app so you can re‑book in one tap. It opens full‑screen and loads faster next time.
              </p>
              {isIos && (
                <p className="text-xs text-dark/40 mt-1">
                  On iPhone: tap <span className="font-semibold">Share</span> → <span className="font-semibold">Add to Home Screen</span>.
                </p>
              )}
              {!isIos && (
                <p className="text-xs text-dark/40 mt-1">
                  On Android: tap <span className="font-semibold">⋮</span> → <span className="font-semibold">Add to Home screen</span>.
                </p>
              )}
            </div>
            {installPrompt ? (
              <button
                onClick={async () => {
                  await installPrompt.prompt()
                  await installPrompt.userChoice
                  setInstallPrompt(null)
                }}
                className="text-sm py-2 px-4 rounded-xl font-semibold transition-all"
                style={primaryButtonStyle}
              >
                Add
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowInstallHelp(true)}
                className="text-xs text-dark/60 font-semibold px-3 py-2 rounded-lg border border-border hover:bg-[#f8f6f1] transition-colors"
              >
                How to add
              </button>
            )}
          </div>
        </div>
      )}

      {showInstallHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-dark">Add to Home Screen</p>
                <p className="text-xs text-dark/50 mt-1">
                  Save this booking page so you can open it like an app.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallHelp(false)}
                className="text-xs text-dark/40 hover:text-dark"
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-dark/80">
              <div className="rounded-xl border border-border p-3">
                <p className="font-semibold text-dark text-sm">iPhone (Safari)</p>
                <p className="text-xs text-dark/60 mt-1">
                  Tap <span className="font-semibold">Share</span> → <span className="font-semibold">Add to Home Screen</span> → <span className="font-semibold">Add</span>.
                </p>
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="font-semibold text-dark text-sm">Android (Chrome)</p>
                <p className="text-xs text-dark/60 mt-1">
                  Tap <span className="font-semibold">⋮</span> → <span className="font-semibold">Add to Home screen</span> (or <span className="font-semibold">Install app</span>).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-xl mx-auto px-4 py-6 space-y-4 pb-24">
        {/* ─── Live Availability Banner ────────────────────── */}
        {liveEnabled && liveAvailability !== null && (
          <div
            className="rounded-2xl border px-4 py-3 flex items-center gap-3"
            style={{ background: liveBannerBg, borderColor: liveBannerBorder }}
          >
            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                liveAvailability.withinWindow ? 'bg-emerald-500' : liveAvailability.time ? 'bg-amber-500' : 'bg-slate-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                liveAvailability.withinWindow ? 'bg-emerald-600' : liveAvailability.time ? 'bg-amber-600' : 'bg-slate-400'
              }`} />
            </span>
            {isSupercar ? (
              <div className="text-sm">
                <p className="font-semibold" style={{ color: liveTextPrimary }}>
                  {liveAvailability.label || 'Vehicles available today'}
                </p>
                {liveAvailability.subtitle && (
                  <p style={{ color: liveTextMuted }}>{liveAvailability.subtitle}</p>
                )}
              </div>
            ) : liveAvailability.time ? (
              <div className="text-sm">
                <p className="font-semibold" style={{ color: liveTextPrimary }}>
                  {liveAvailability.withinWindow
                    ? 'Available soon — book while it lasts'
                    : 'Opening available later today'}
                </p>
                <p style={{ color: liveTextMuted }}>Next opening at {formatTime(liveAvailability.time)}</p>
              </div>
            ) : (
              <p className="text-sm" style={{ color: liveTextMuted }}>
                No openings left today — please select another date.
              </p>
            )}
          </div>
        )}

        {/* ─── Step 1: Select Service ─────────────────────────── */}
        {step === 1 && (
          <>
            <h2 className={`${headingClass} text-2xl text-dark`}>
              {vertical?.bookingPageLabel || 'Book an Appointment'}
            </h2>
            {services.length === 0 ? (
              <p className="text-dark/40">No services available at the moment.</p>
            ) : (
              <div className="space-y-3">
                {services.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedService(s); setStep(staff.length > 1 ? 2 : 3) }}
                    className={`w-full flex items-center justify-between p-4 transition-all text-left group ${iTheme.cardRadius} ${iTheme.glassCards ? 'glass-card' : ''}`}
                    style={{
                      background: iTheme.cardBg,
                      border: `1.5px solid ${iTheme.cardBorder}`,
                      boxShadow: iTheme.cardShadow,
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = iTheme.cardHoverBg
                      ;(e.currentTarget as HTMLButtonElement).style.borderColor = hexToRgba(brandColour, 0.4)
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = iTheme.cardBg
                      ;(e.currentTarget as HTMLButtonElement).style.borderColor = iTheme.cardBorder
                    }}
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-dark">{s.name}</p>
                      {s.description && <p className="text-sm text-dark/50 mt-0.5">{s.description}</p>}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-xs text-dark/40">
                          <Clock className="w-3.5 h-3.5" />{s.duration_minutes} min
                        </span>
                        {s.requires_deposit && (
                          <span className="text-xs text-amber-600 font-medium">
                            {formatCurrency(s.deposit_pence)} deposit
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-4 text-right">
                      {/* Price chip */}
                      <span
                        className="inline-block px-3 py-1.5 rounded-xl text-sm font-bold mb-1"
                        style={{ background: iTheme.priceChipBg, color: brandColour }}
                      >
                        {formatCurrency(s.price_pence)}
                      </span>
                      <div>
                        <ChevronRight className="w-4 h-4 ml-auto text-dark/30 group-hover:text-dark transition-colors" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── Step 2: Select Staff ───────────────────────────── */}
        {step === 2 && staff.length > 1 && (
          <>
            <h2 className={`${headingClass} text-2xl text-dark`}>
              {isDental ? 'Who would you like to see?' : `Choose Your ${vertical?.staffLabel || 'Staff Member'}`}
            </h2>
            {staff.length > 1 && (
              <p className="text-sm text-dark/50 mb-3">
                Choose your preferred {vertical?.staffLabel?.toLowerCase() || 'team member'}, or pick "no preference" for the first available.
              </p>
            )}
            <div className="space-y-3">
              {/* No preference option */}
              <button
                onClick={() => { setSelectedStaff('any'); setStep(3) }}
                className={`w-full flex items-center gap-4 p-4 transition-all ${iTheme.cardRadius} ${iTheme.glassCards ? 'glass-card' : ''}`}
                style={{
                  background: selectedStaff === 'any' ? iTheme.cardSelectedBg : iTheme.cardBg,
                  border: `1.5px solid ${selectedStaff === 'any' ? (iTheme.cardSelectedBorder || brandColour) : iTheme.cardBorder}`,
                  boxShadow: iTheme.cardShadow,
                }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: hexToRgba(brandColour, 0.12) }}>
                  <User className="w-6 h-6" style={{ color: brandColour }} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-dark">No preference</p>
                  <p className="text-sm text-dark/50">First available {vertical?.staffLabel?.toLowerCase() || 'staff member'}</p>
                </div>
              </button>
              {staff.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedStaff(s); setStep(3) }}
                  className={`w-full flex items-center gap-4 p-4 transition-all text-left ${iTheme.cardRadius} ${iTheme.glassCards ? 'glass-card' : ''}`}
                  style={{
                    background: iTheme.cardBg,
                    border: `1.5px solid ${iTheme.cardBorder}`,
                    boxShadow: iTheme.cardShadow,
                  }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{ background: hexToRgba(brandColour, 0.1) }}>
                    {s.avatar_url ? (
                      <img src={s.avatar_url} alt={s.name} className="w-12 h-12 object-cover" />
                    ) : (
                      <User className="w-6 h-6" style={{ color: brandColour }} />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-dark">{s.name}</p>
                    {s.role && <p className="text-sm text-dark/50">{s.role}</p>}
                    {s.bio && <p className="text-xs text-dark/40 line-clamp-1 mt-0.5">{s.bio}</p>}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ─── Step 3: Select Date ────────────────────────────── */}
        {step === 3 && (
          <>
            <h2 className={`${headingClass} text-2xl text-dark`}>Choose a Date</h2>

            <div
              className={`${iTheme.cardRadius} p-5 ${iTheme.glassCards ? 'glass-card' : ''}`}
              style={{ background: iTheme.cardBg, border: `1.5px solid ${iTheme.cardBorder}`, boxShadow: iTheme.cardShadow }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-dark">
                  {calendarMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex gap-1">
                  <button onClick={() => setCalendarMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setCalendarMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 mb-2">
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                  <div key={d} className="text-center text-xs font-semibold text-dark/30 py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: getFirstDay() }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: getDaysInMonth() }, (_, i) => i + 1).map(day => {
                  const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day)
                  const isPast = date < new Date(new Date().setHours(0,0,0,0))
                  const isAvail = isDateAvailable(date)
                  const isSelected = selectedDate?.toDateString() === date.toDateString()
                  return (
                    <button key={day}
                      disabled={isPast || !isAvail}
                      onClick={() => { setSelectedDate(date); setSelectedTime(null); setStep(4) }}
                      className={`h-10 w-full rounded-xl text-sm font-medium transition-all ${
                        isSelected ? 'text-white font-bold' :
                        isPast || !isAvail ? 'text-dark/20 cursor-not-allowed' :
                        'text-dark hover:opacity-80'
                      }`}
                      style={isSelected ? { backgroundColor: brandColour } : isAvail && !isPast ? { backgroundColor: brandColour + '15' } : undefined}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* ─── Step 4: Select Time ────────────────────────────── */}
        {step === 4 && selectedDate && (
          <>
            <h2 className={`${headingClass} text-2xl text-dark`}>
              {selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            {availableSlots.length === 0 ? (
              <div
                className={`${iTheme.cardRadius} p-8 text-center`}
                style={{ background: iTheme.cardBg, border: `1.5px solid ${iTheme.cardBorder}` }}
              >
                <Calendar className="w-10 h-10 mx-auto mb-3 text-dark/20" />
                <p className="text-dark/50">No available times on this date.</p>
                <button onClick={() => setStep(3)} className="mt-4 text-sm font-medium hover:underline" style={{ color: brandColour }}>
                  Choose another date
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableSlots.map(slot => (
                  <button
                    key={slot}
                    onClick={() => { setSelectedTime(slot); if (!isSupercar) setStep(5) }}
                    className={`py-3 ${iTheme.cardRadius} text-sm font-semibold transition-all`}
                    style={
                      selectedTime === slot
                        ? { backgroundColor: brandColour, color: '#ffffff', border: `1.5px solid ${brandColour}` }
                        : { background: iTheme.cardBg, border: `1.5px solid ${iTheme.cardBorder}`, color: iTheme.textPrimary }
                    }
                  >
                    {formatTime(slot)}
                  </button>
                ))}
              </div>
            )}

            {isSupercar && selectedTime && (
              <div
                className={`${iTheme.cardRadius} p-5 mt-6 space-y-4 ${iTheme.glassCards ? 'glass-card' : ''}`}
                style={{ background: iTheme.cardBg, border: `1.5px solid ${iTheme.cardBorder}`, boxShadow: iTheme.cardShadow }}
              >
                <div>
                  <p className="font-semibold text-dark">Return details</p>
                  <p className="text-xs text-dark/50">Select your return date and time to complete the hire window.</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">Return date</label>
                    <input
                      type="date"
                      min={minReturnDateStr}
                      value={returnDate ? returnDate.toISOString().split('T')[0] : ''}
                      onChange={e => setReturnDate(e.target.value ? new Date(`${e.target.value}T00:00:00`) : null)}
                      className="mt-2 w-full h-10 px-3 rounded-xl border border-border text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">Return time</label>
                    <input
                      type="time"
                      value={returnTime}
                      onChange={e => setReturnTime(e.target.value)}
                      className="mt-2 w-full h-10 px-3 rounded-xl border border-border text-sm"
                    />
                  </div>
                </div>
                {rentalReturnInvalid && (
                  <p className="text-xs text-amber-600">
                    Return date must be at least {minRentalDays} day{minRentalDays === 1 ? '' : 's'} after pickup.
                  </p>
                )}
                <button
                  disabled={rentalReturnInvalid}
                  onClick={() => setStep(5)}
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
                  style={primaryButtonStyle}
                >
                  Continue to details
                </button>
              </div>
            )}
          </>
        )}

        {/* ─── Step 5: Your Details ───────────────────────────── */}
        {step === 5 && (
          <>
            <h2 className={`${headingClass} text-2xl text-dark`}>Your Details</h2>
            {/* Booking summary */}
            <div
              className={`${iTheme.cardRadius} p-4 space-y-2 ${iTheme.glassCards ? 'glass-card' : ''}`}
              style={{ background: iTheme.cardBg, border: `1.5px solid ${iTheme.cardBorder}`, boxShadow: iTheme.cardShadow }}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-dark/50">Service</span>
                <span className="font-semibold text-dark">{selectedService?.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-dark/50">Date</span>
                <span className="font-semibold text-dark">{selectedDate ? formatDate(selectedDate) : ''}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-dark/50">Time</span>
                <span className="font-semibold text-dark">{selectedTime ? formatTime(selectedTime) : ''}</span>
              </div>
              {isSupercar && returnDate && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dark/50">Return Date</span>
                    <span className="font-semibold text-dark">{formatDate(returnDate)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dark/50">Return Time</span>
                    <span className="font-semibold text-dark">{returnTime ? formatTime(returnTime) : ''}</span>
                  </div>
                </>
              )}
              {selectedStaff && selectedStaff !== 'any' && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-dark/50">With</span>
                  <span className="font-semibold text-dark">{(selectedStaff as Staff).name}</span>
                </div>
              )}
              <div className="border-t border-border pt-2 flex items-center justify-between">
                <span className="font-semibold text-dark">Total</span>
                <span className="font-bold text-dark text-lg" style={{ color: brandColour }}>
                  {formatCurrency(selectedService?.price_pence || 0)}
                </span>
              </div>
              {selectedService?.requires_deposit && (
                <div className="flex items-center justify-between text-sm bg-amber-50 rounded-lg px-3 py-2">
                  <span className="text-amber-700">Deposit required</span>
                  <span className="font-bold text-amber-700">{formatCurrency(selectedService.deposit_pence)}</span>
                </div>
              )}
            </div>

            {isSupercar && rentalRequirements && (
              <div
                className={`${iTheme.cardRadius} p-4 text-sm text-dark/70 ${iTheme.glassCards ? 'glass-card' : ''}`}
                style={{ background: iTheme.cardBg, border: `1.5px solid ${iTheme.cardBorder}`, boxShadow: iTheme.cardShadow }}
              >
                <p className="font-semibold text-dark mb-1">What to bring</p>
                <p>{rentalRequirements}</p>
              </div>
            )}

            <div
              className={`${iTheme.cardRadius} p-5 space-y-4 ${iTheme.glassCards ? 'glass-card' : ''}`}
              style={{ background: iTheme.cardBg, border: `1.5px solid ${iTheme.cardBorder}`, boxShadow: iTheme.cardShadow }}
            >
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-dark mb-1.5">
                  <User className="w-4 h-4" /> Full Name *
                </label>
                <input value={name} onChange={e => setName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-border text-sm focus:outline-none"
                  style={{ '--tw-ring-color': brandColour } as React.CSSProperties}
                  placeholder="Your full name" required />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-dark mb-1.5">
                  <Mail className="w-4 h-4" /> Email Address *
                </label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-border text-sm focus:outline-none"
                  placeholder="you@email.com" required />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-dark mb-1.5">
                  <Phone className="w-4 h-4" /> Phone Number *
                </label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-border text-sm focus:outline-none"
                  placeholder="07700 900000" required />
              </div>
              <div>
                <label className="text-sm font-medium text-dark mb-1.5 block">Notes (optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none resize-none"
                  placeholder="Any special requests or information?" />
              </div>
            </div>

            {bookingFields.length > 0 && (
              <div
                className={`${iTheme.cardRadius} p-5 space-y-4 ${iTheme.glassCards ? 'glass-card' : ''}`}
                style={{ background: iTheme.cardBg, border: `1.5px solid ${iTheme.cardBorder}`, boxShadow: iTheme.cardShadow }}
              >
                <div>
                  <p className="text-sm font-semibold text-dark">{isDental ? 'Appointment details' : 'Booking Details'}</p>
                  <p className="text-xs text-dark/50">
                    {isDental
                      ? 'A couple of quick questions so we can prepare properly for your visit.'
                      : `Helps ${tenant.business_name} prepare for your visit.`}
                  </p>
                </div>
                {bookingFields.map(field => (
                  <div key={field.id}>
                    <label className="text-sm font-medium text-dark mb-1.5 block">
                      {field.label}{field.required ? ' *' : ''}
                    </label>
                    {isDental && field.id === 'patient_type' && field.options ? (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {field.options.map(option => {
                          const selected = (extraFields[field.id] || '') === option
                          const label = option.startsWith('Yes') ? 'Yes' : option.startsWith('No') ? 'No' : option
                          const subtext = option.replace(/^Yes\s*-\s*/i, '').replace(/^No\s*-\s*/i, '')
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => setExtraFields(prev => ({ ...prev, [field.id]: option }))}
                              className="text-left px-4 py-3 rounded-xl border transition-all"
                              style={{
                                borderColor: selected ? brandColour : 'rgba(15, 23, 42, 0.12)',
                                background: selected ? hexToRgba(brandColour, 0.08) : 'transparent',
                              }}
                            >
                              <p className="font-semibold text-dark">{label}</p>
                              <p className="text-sm text-dark/50">{subtext}</p>
                            </button>
                          )
                        })}
                      </div>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        value={extraFields[field.id] || ''}
                        onChange={e => setExtraFields(prev => ({ ...prev, [field.id]: e.target.value }))}
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none resize-none"
                        placeholder={field.placeholder || ''}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={extraFields[field.id] || ''}
                        onChange={e => setExtraFields(prev => ({ ...prev, [field.id]: e.target.value }))}
                        className="w-full h-11 px-4 rounded-xl border border-border text-sm focus:outline-none"
                      >
                        <option value="">{field.placeholder || 'Select...'}</option>
                        {(field.options || []).map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={extraFields[field.id] || ''}
                        onChange={e => setExtraFields(prev => ({ ...prev, [field.id]: e.target.value }))}
                        className="w-full h-11 px-4 rounded-xl border border-border text-sm focus:outline-none"
                        placeholder={field.placeholder || ''}
                      />
                    )}
                  </div>
                ))}
                {missingRequired && (
                  <p className="text-xs text-amber-700">Please complete the required fields above.</p>
                )}
              </div>
            )}

            {tenant.cancellation_policy && (
              <div className="bg-amber-50 rounded-xl p-4 text-xs text-amber-800 border border-amber-200">
                <p className="font-semibold mb-1">Cancellation Policy</p>
                <p className="leading-relaxed">{tenant.cancellation_policy}</p>
              </div>
            )}

            {paymentRequired && !paymentsConfigured && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Online deposits aren&apos;t configured yet. You can still request a booking and the business will confirm payment.
              </div>
            )}

            {paymentError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {paymentError}
              </div>
            )}

            <button
              onClick={handleDetailsSubmit}
              disabled={submitting || paymentLoading || !name || !email || !phone || missingRequired}
              className="w-full py-4 rounded-xl font-bold text-base transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={primaryButtonStyle}
            >
              {(submitting || paymentLoading)
                ? <><Loader2 className="w-5 h-5 animate-spin" /> {paymentRequired ? 'Preparing payment…' : 'Confirming…'}</>
                : (paymentRequired ? 'Continue to Payment' : ctaLabel)}
            </button>
          </>
        )}

        {/* ─── Step 6: Payment ─────────────────────────────── */}
        {step === 'payment' && (
          <>
            <h2 className={`${headingClass} text-2xl text-dark`}>Pay Deposit</h2>
            <div
              className={`${iTheme.cardRadius} p-4 space-y-2 ${iTheme.glassCards ? 'glass-card' : ''}`}
              style={{ background: iTheme.cardBg, border: `1.5px solid ${iTheme.cardBorder}`, boxShadow: iTheme.cardShadow }}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-dark/50">Service</span>
                <span className="font-semibold text-dark">{selectedService?.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-dark/50">Date</span>
                <span className="font-semibold text-dark">{selectedDate ? formatDate(selectedDate) : ''}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-dark/50">Time</span>
                <span className="font-semibold text-dark">{selectedTime ? formatTime(selectedTime) : ''}</span>
              </div>
              <div className="pt-2 flex items-center justify-between" style={{ borderTop: `1px solid ${iTheme.dividerColor}` }}>
                <span className="font-semibold text-dark">Deposit due</span>
                <span className="font-bold text-lg" style={{ color: brandColour }}>
                  {formatCurrency(selectedService?.deposit_pence || 0)}
                </span>
              </div>
            </div>

            {!stripePromise && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                Payments are temporarily unavailable. Please contact the business to complete your booking.
              </div>
            )}

            {connectRequired && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                This business hasn&apos;t connected Stripe yet, so online deposits are unavailable.
              </div>
            )}

            {stripePromise && clientSecret && !connectRequired && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm
                  amountLabel={formatCurrency(selectedService?.deposit_pence || 0)}
                  primaryButtonStyle={primaryButtonStyle}
                  onBack={() => setStep(5)}
                  onSuccess={async (intentId) => {
                    setPaymentIntentId(intentId)
                    await createBooking({ depositPaid: true, paymentIntentId: intentId })
                  }}
                />
              </Elements>
            )}

            {paymentLoading && (
              <div className="flex items-center gap-2 text-sm text-dark/50">
                <Loader2 className="w-4 h-4 animate-spin" /> Preparing secure checkout…
              </div>
            )}
          </>
        )}

        {/* Back button — step is already narrowed to non-success here */}
        {step !== 1 && (
          <button
            onClick={() => {
              if (step === 'payment') setStep(5)
              else if (step === 5) setStep(4)
              else if (step === 4) setStep(3)
              else if (step === 3) setStep(staff.length > 1 ? 2 : 1)
              else if (step === 2) setStep(1)
            }}
            className="flex items-center gap-2 text-sm text-dark/50 hover:text-dark transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        )}
      </div>

      {/* Powered by */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-border py-2 text-center">
        <p className="text-xs text-dark/30">
          Powered by <a href="https://www.scudosystems.com" className="font-semibold text-dark/50 hover:text-dark" target="_blank" rel="noopener">ScudoSystems.com</a>
        </p>
      </div>
    </div>
  )
}
