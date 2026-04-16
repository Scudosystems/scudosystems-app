'use client'

import { useState, useEffect, useMemo } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Copy, Check, Globe, QrCode, Share2, Eye, ExternalLink, MessageCircle, Mail, Sparkles, Palette, Type } from 'lucide-react'
import { LIVE_AVAILABILITY_VERTICALS, hasModule } from '@/lib/industry-modules'
import { fetchLatestTenant } from '@/lib/tenant'
import QRCode from 'qrcode'
import { VERTICALS } from '@/lib/verticals'
import type { VerticalId } from '@/lib/verticals'
import type { Tenant } from '@/types/database'

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '')
  const isShort = normalized.length === 3
  const r = parseInt(isShort ? normalized[0] + normalized[0] : normalized.slice(0, 2), 16)
  const g = parseInt(isShort ? normalized[1] + normalized[1] : normalized.slice(2, 4), 16)
  const b = parseInt(isShort ? normalized[2] + normalized[2] : normalized.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const normalizeCtaLabel = (value?: string | null) => {
  const cleaned = (value || '').replace(/undefined/gi, '').trim()
  return cleaned
}

const BOOKING_THEMES: Record<string, { label: string; pageBg: string; heroTint: number }> = {
  soft: {
    label: 'Soft Aura',
    pageBg: 'radial-gradient(1200px 600px at 15% -10%, rgba(13,148,136,0.12), transparent 60%), linear-gradient(180deg, #f8fafc 0%, #ffffff 55%)',
    heroTint: 0.18,
  },
  mist: {
    label: 'Cool Mist',
    pageBg: 'radial-gradient(1200px 600px at 15% -10%, rgba(59,130,246,0.14), transparent 60%), linear-gradient(180deg, #eef2ff 0%, #ffffff 55%)',
    heroTint: 0.22,
  },
  sand: {
    label: 'Warm Sand',
    pageBg: 'radial-gradient(1200px 600px at 15% -10%, rgba(245,158,11,0.15), transparent 60%), linear-gradient(180deg, #fff7ed 0%, #ffffff 55%)',
    heroTint: 0.22,
  },
  slate: {
    label: 'Slate Glow',
    pageBg: 'radial-gradient(1200px 600px at 15% -10%, rgba(15,23,42,0.08), transparent 60%), linear-gradient(180deg, #f1f5f9 0%, #ffffff 55%)',
    heroTint: 0.2,
  },
  blush: {
    label: 'Blush Tint',
    pageBg: 'radial-gradient(1200px 600px at 15% -10%, rgba(236,72,153,0.14), transparent 60%), linear-gradient(180deg, #fff1f2 0%, #ffffff 55%)',
    heroTint: 0.22,
  },
}

const FONT_OPTIONS = [
  { value: 'sans', label: 'Modern Sans' },
  { value: 'serif', label: 'Classic Serif' },
]

const BUTTON_STYLES = [
  { value: 'solid', label: 'Solid' },
  { value: 'soft', label: 'Soft' },
  { value: 'outline', label: 'Outline' },
]

export default function BookingPageDashboard() {
  const supabase = createSupabaseBrowserClient()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [toggling, setToggling] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [waitQrDataUrl, setWaitQrDataUrl] = useState<string | null>(null)
  const [waitQrLoading, setWaitQrLoading] = useState(false)
  const [waitQrError, setWaitQrError] = useState('')
  const [posterSize, setPosterSize] = useState<'A4' | 'A5' | 'A3'>('A4')
  const [posterUploading, setPosterUploading] = useState(false)
  const [posterUploadError, setPosterUploadError] = useState<string | null>(null)
  const [formReady, setFormReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [previewTick, setPreviewTick] = useState(0)
  const [abStats, setAbStats] = useState({
    A: { views: 0, bookings: 0 },
    B: { views: 0, bookings: 0 },
  })
  const [abLoading, setAbLoading] = useState(false)
  const [autoApplied, setAutoApplied] = useState(false)
  const [abNotice, setAbNotice] = useState<string | null>(null)

  const supportsLiveAvailability = tenant?.vertical
    ? LIVE_AVAILABILITY_VERTICALS.has(tenant.vertical as string)
    : false
  const supportsWaitTime = tenant?.vertical
    ? hasModule(tenant.vertical as string, 'wait_time')
    : false
  const [form, setForm] = useState({
    brand_colour: '#0d6e6e',
    booking_page_headline: '',
    booking_page_subtext: '',
    booking_page_theme: 'soft',
    booking_page_cta_label: '',
    booking_page_font: 'sans',
    booking_page_button_style: 'solid',
    booking_page_ab_enabled: false,
    booking_page_ab_split: 50,
    booking_page_ab_auto_apply: true,
    booking_page_variant_b_headline: '',
    booking_page_variant_b_subtext: '',
    booking_page_variant_b_cta_label: '',
    booking_page_variant_b_theme: 'soft',
    booking_page_variant_b_font: 'sans',
    booking_page_variant_b_button_style: 'solid',
    booking_page_variant_b_brand_colour: '',
    wait_page_enabled: true,
    wait_qr_headline: '',
    wait_qr_subtext: '',
    wait_qr_cta: '',
    queue_delay_minutes: 0,
    booking_page_show_live_availability: false,
    booking_page_live_window_minutes: 60,
    booking_page_live_buffer_minutes: 20,
    rental_min_days: 1,
    rental_requirements: '',
    booking_poster_offer: '',
    booking_poster_headline: '',
    booking_poster_subtext: '',
    booking_poster_cta: '',
    booking_poster_image_url: '',
  })

  useEffect(() => {
    fetchLatestTenant(supabase, '*')
      .then(tenantRow => {
        if (!tenantRow) return
        setTenant(tenantRow)
        if (!formReady) {
        setForm({
          brand_colour: tenantRow.brand_colour || '#0d6e6e',
          booking_page_headline: tenantRow.booking_page_headline || '',
          booking_page_subtext: tenantRow.booking_page_subtext || '',
          booking_page_theme: tenantRow.booking_page_theme || 'soft',
          booking_page_cta_label: normalizeCtaLabel((tenantRow as any).booking_page_cta_label),
          booking_page_font: (tenantRow as any).booking_page_font || 'sans',
          booking_page_button_style: (tenantRow as any).booking_page_button_style || 'solid',
          booking_page_ab_enabled: tenantRow.booking_page_ab_enabled ?? false,
          booking_page_ab_split: tenantRow.booking_page_ab_split ?? 50,
          booking_page_ab_auto_apply: tenantRow.booking_page_ab_auto_apply ?? true,
          booking_page_variant_b_headline: (tenantRow as any).booking_page_variant_b_headline || '',
          booking_page_variant_b_subtext: (tenantRow as any).booking_page_variant_b_subtext || '',
          booking_page_variant_b_cta_label: normalizeCtaLabel((tenantRow as any).booking_page_variant_b_cta_label),
          booking_page_variant_b_theme: (tenantRow as any).booking_page_variant_b_theme || 'soft',
          booking_page_variant_b_font: (tenantRow as any).booking_page_variant_b_font || 'sans',
          booking_page_variant_b_button_style: (tenantRow as any).booking_page_variant_b_button_style || 'solid',
          booking_page_variant_b_brand_colour: (tenantRow as any).booking_page_variant_b_brand_colour || '',
          wait_page_enabled: (tenantRow as any).wait_page_enabled ?? true,
          wait_qr_headline: (tenantRow as any).wait_qr_headline || '',
          wait_qr_subtext: (tenantRow as any).wait_qr_subtext || '',
          wait_qr_cta: (tenantRow as any).wait_qr_cta || '',
          queue_delay_minutes: (tenantRow as any).queue_delay_minutes ?? 0,
          booking_page_show_live_availability: (tenantRow as any).booking_page_show_live_availability ?? false,
          booking_page_live_window_minutes: (tenantRow as any).booking_page_live_window_minutes ?? 60,
          booking_page_live_buffer_minutes: (tenantRow as any).booking_page_live_buffer_minutes ?? 20,
          rental_min_days: (tenantRow as any).rental_min_days ?? 1,
          rental_requirements: (tenantRow as any).rental_requirements || '',
          booking_poster_offer: tenantRow.booking_poster_offer || '',
          booking_poster_headline: (tenantRow as any).booking_poster_headline || '',
          booking_poster_subtext: (tenantRow as any).booking_poster_subtext || '',
          booking_poster_cta: (tenantRow as any).booking_poster_cta || '',
          booking_poster_image_url: (tenantRow as any).booking_poster_image_url || '',
        })
        setFormReady(true)
      }
      })
      .catch(() => {})
  }, [formReady])

  useEffect(() => {
    if (!tenant) return
    setAbLoading(true)
    fetch('/api/booking-page/ab')
      .then(r => r.json())
      .then(data => {
        if (data?.stats) setAbStats(data.stats)
      })
      .finally(() => setAbLoading(false))
  }, [tenant?.id])

  // ── Booking URLs ────────────────────────────────────────────────────────────
  // Always use the configured app URL (or the current origin at runtime).
  // This means the embed code always shows the correct public URL even in dev.
  const appOrigin = useMemo(() => {
    const envUrl = process.env.NEXT_PUBLIC_APP_URL
    // Reject env URLs that point to Vercel preview domains — they require SSO login
    // and should never appear in booking links, QR codes, or embed code.
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('vercel.app')) return envUrl
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') return window.location.origin
    return 'https://www.scudosystems.com'
  }, [])

  const bookingUrl = useMemo(() => (
    tenant?.slug ? `${appOrigin}/book/${tenant.slug}` : ''
  ), [tenant, appOrigin])
  const previewUrl = useMemo(() => {
    if (!tenant?.slug) return ''
    const previewOrigin = typeof window !== 'undefined' ? window.location.origin : appOrigin
    return `${previewOrigin}/book/${tenant.slug}?preview=1`
  }, [tenant?.slug, appOrigin])
  const waitUrl = useMemo(() => (
    tenant?.slug ? `${appOrigin}/wait/${tenant.slug}` : ''
  ), [tenant, appOrigin])
  const brandColour = form.brand_colour || tenant?.brand_colour || '#0d6e6e'
  const variantBColour = form.booking_page_variant_b_brand_colour || brandColour
  const offerText = (form.booking_poster_offer || tenant?.booking_poster_offer || '').trim()
  const vertical = tenant?.vertical ? VERTICALS[tenant.vertical as VerticalId] : null
  const businessName = tenant?.business_name || 'your business'
  const recommendedHeadline = vertical
    ? `${vertical.bookingPageLabel} at ${businessName}`
    : `Book an Appointment at ${businessName}`
  const recommendedSubtext = (() => {
    if (!vertical) return `Choose a service, pick a time, and you're confirmed instantly.`
    if (vertical.id === 'dental') {
      return `Book check-ups, hygiene, emergency visits and cosmetic consults in minutes — choose a time and you’re sorted.`
    }
    const top = vertical.defaultServices?.slice(0, 3).map(s => s.name) || []
    if (top.length >= 2) {
      const list = top.length === 3 ? `${top[0]}, ${top[1]} or ${top[2]}` : `${top[0]} or ${top[1]}`
      return `Book ${list} in minutes — choose a time and you’re all set.`
    }
    return `Choose a service, pick a time, and you're confirmed instantly.`
  })()
  const recommendedCta = 'Confirm Booking'
  const isSupercar = vertical?.id === 'supercar'
  const recommendedPosterHeadline = isSupercar
    ? `Reserve ${businessName} Online`
    : `Book ${businessName} Online`
  const recommendedPosterSubtext = isSupercar
    ? 'Scan the QR code to reserve your pickup and return in minutes.'
    : 'Scan the QR code to book instantly — no calls, no waiting.'
  const recommendedPosterCta = isSupercar ? 'Scan to Reserve' : 'Scan to Book Now'
  const recommendedOffer = isSupercar
    ? 'Scan this QR code and use code DRIVE10 for 10% off your first day.'
    : 'Scan this QR code and use code WELCOME10 for 10% off your first booking.'
  const recommendedWaitHeadline = `Check Your Wait Time`
  const recommendedWaitSubtext = 'Scan to see your estimated start time, add concerns, and get live updates.'
  const recommendedWaitCta = 'Scan for Live Queue'
  const liveAvailabilityTitle = isSupercar ? 'Live fleet availability' : 'Live availability indicator'
  const liveAvailabilityHelp = isSupercar
    ? 'Show a live banner when a vehicle becomes available soon.'
    : 'Show a live banner when a slot opens within the next hour.'
  const liveAvailabilityBoost = isSupercar
    ? 'Highlighting available cars increases conversion by reducing uncertainty.'
    : 'Highlighting open slots increases conversion by creating urgency.'

  const headline = (form.booking_page_headline || '').trim() || recommendedHeadline
  const subtext = (form.booking_page_subtext || '').trim() || recommendedSubtext
  const ctaLabel = normalizeCtaLabel(form.booking_page_cta_label) || recommendedCta
  const posterHeadline = (form.booking_poster_headline || '').trim() || recommendedPosterHeadline
  const posterSubtext = (form.booking_poster_subtext || '').trim() || recommendedPosterSubtext
  const posterCta = (form.booking_poster_cta || '').trim() || recommendedPosterCta
  const posterImage = (form.booking_poster_image_url || tenant?.booking_poster_image_url || '').trim()
  const waitHeadline = (form.wait_qr_headline || '').trim() || recommendedWaitHeadline
  const waitSubtext = (form.wait_qr_subtext || '').trim() || recommendedWaitSubtext
  const waitCta = (form.wait_qr_cta || '').trim() || recommendedWaitCta

  const fontChoice = form.booking_page_font || 'sans'
  const fontClass = fontChoice === 'serif' ? 'font-serif' : 'font-sans'
  const buttonStyle = form.booking_page_button_style || 'solid'
  const themeKey = form.booking_page_theme || 'soft'
  const theme = BOOKING_THEMES[themeKey] || BOOKING_THEMES.soft

  const getButtonStyle = (styleKey: string, colour: string): React.CSSProperties =>
    styleKey === 'solid'
      ? { backgroundColor: colour, color: '#ffffff' }
      : styleKey === 'soft'
        ? { backgroundColor: hexToRgba(colour, 0.15), color: colour, border: `1px solid ${hexToRgba(colour, 0.35)}` }
        : { backgroundColor: 'transparent', color: colour, border: `2px solid ${colour}` }

  const primaryButtonStyle = getButtonStyle(buttonStyle, brandColour)

  const previewA = {
    headline,
    subtext,
    cta: ctaLabel,
    theme: theme,
    font: fontChoice,
    buttonStyle: buttonStyle,
    colour: brandColour,
  }

  const previewB = {
    headline: (form.booking_page_variant_b_headline || headline).trim() || headline,
    subtext: (form.booking_page_variant_b_subtext || subtext).trim() || subtext,
    cta: normalizeCtaLabel(form.booking_page_variant_b_cta_label || ctaLabel) || ctaLabel,
    theme: BOOKING_THEMES[form.booking_page_variant_b_theme] || theme,
    font: form.booking_page_variant_b_font || fontChoice,
    buttonStyle: form.booking_page_variant_b_button_style || buttonStyle,
    colour: variantBColour,
  }
  const buildVariantUrl = (variant: 'A' | 'B') =>
    previewUrl ? `${previewUrl}${previewUrl.includes('?') ? '&' : '?'}ab=${variant}` : ''
  const previewItems = isSupercar
    ? (form.booking_page_ab_enabled
      ? [
          { label: 'Page A', data: previewA, url: buildVariantUrl('A') },
          { label: 'Page B', data: previewB, url: buildVariantUrl('B') },
        ]
      : [{ label: 'Live preview', data: previewA, url: previewUrl }])
    : (form.booking_page_ab_enabled
      ? [
          { label: 'Page A', data: previewA },
          { label: 'Page B', data: previewB },
        ]
      : [
          { label: 'Live preview', data: previewA },
        ])

  const aViews = abStats.A.views
  const bViews = abStats.B.views
  const aBookings = abStats.A.bookings
  const bBookings = abStats.B.bookings
  const aRate = aViews ? (aBookings / aViews) * 100 : 0
  const bRate = bViews ? (bBookings / bViews) * 100 : 0
  const minViewsForRecommendation = 50
  const recommendSwitchToB = form.booking_page_ab_enabled &&
    aViews >= minViewsForRecommendation &&
    bViews >= minViewsForRecommendation &&
    bRate >= aRate * 1.2

  useEffect(() => {
    if (!recommendSwitchToB) return
    if (!form.booking_page_ab_auto_apply || autoApplied) return
    applyVariantB()
  }, [recommendSwitchToB, form.booking_page_ab_auto_apply, autoApplied])

  useEffect(() => {
    const buildQr = async () => {
      if (!bookingUrl) {
        setQrDataUrl(null)
        return
      }
      setQrLoading(true)
      try {
        const url = await QRCode.toDataURL(bookingUrl, {
          width: 320,
          margin: 1,
          color: { dark: '#0f172a', light: '#ffffff' },
        })
        setQrDataUrl(url)
      } catch {
        setQrDataUrl(null)
      } finally {
        setQrLoading(false)
      }
    }
    buildQr()
  }, [bookingUrl])

  useEffect(() => {
    const buildWaitQr = async () => {
      if (!supportsWaitTime) {
        setWaitQrDataUrl(null)
        setWaitQrError('')
        return
      }
      setWaitQrError('')
      const fallbackUrl = tenant?.slug ? `${appOrigin}/wait/${tenant.slug}` : ''
      const urlToEncode = waitUrl || fallbackUrl
      if (!urlToEncode) {
        setWaitQrDataUrl(null)
        setWaitQrError('Wait-time link is missing. Please complete onboarding to set your business URL.')
        return
      }
      setWaitQrLoading(true)
      try {
        const url = await QRCode.toDataURL(urlToEncode, {
          width: 320,
          margin: 1,
          color: { dark: '#0f172a', light: '#ffffff' },
        })
        setWaitQrDataUrl(url)
      } catch {
        setWaitQrDataUrl(null)
        setWaitQrError('Could not generate the wait-time QR. Please try again.')
      } finally {
        setWaitQrLoading(false)
      }
    }
    buildWaitQr()
  }, [waitUrl, tenant?.slug, supportsWaitTime])

  const copy = async (text: string, key: string) => {
    if (!text) return
    try {
      if (window.isSecureContext && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const el = document.createElement('textarea')
        el.value = text
        el.setAttribute('readonly', '')
        el.style.position = 'fixed'
        el.style.opacity = '0'
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        el.remove()
      }
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // Fallback: open prompt so user can copy manually
      window.prompt('Copy this link:', text)
    }
  }

  const togglePage = async () => {
    if (!tenant) return
    setToggling(true)
    const next = !tenant.booking_page_enabled
    const { error } = await (supabase.from('tenants') as any).update({ booking_page_enabled: next }).eq('id', tenant.id)
    if (error) {
      setSaveError(error.message || 'Could not update booking page status.')
    } else {
      setTenant(t => t ? { ...t, booking_page_enabled: next } : t)
      setForm(p => ({ ...p, booking_page_enabled: next }))
    }
    setToggling(false)
  }

  const iframeCode = bookingUrl
    ? `<iframe\n  src="${bookingUrl}"\n  width="100%"\n  height="800"\n  frameborder="0"\n  style="border-radius:12px;"\n></iframe>`
    : null

  const whatsappLink = `https://wa.me/?text=Book%20your%20appointment%20with%20us%3A%20${encodeURIComponent(bookingUrl)}`

  const downloadQr = () => {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `${tenant?.slug || 'booking'}-qr.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const downloadWaitQr = () => {
    if (!waitQrDataUrl) return
    const a = document.createElement('a')
    a.href = waitQrDataUrl
    a.download = `${tenant?.slug || 'wait'}-queue-qr.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const MAX_POSTER_MB = 5
  const ALLOWED_POSTER_TYPES = ['image/jpeg', 'image/png', 'image/webp']

  const handlePosterUpload = async (file: File) => {
    if (!tenant) return
    if (!ALLOWED_POSTER_TYPES.includes(file.type)) {
      setPosterUploadError('Unsupported file type. Use JPG, PNG, or WebP.')
      return
    }
    if (file.size > MAX_POSTER_MB * 1024 * 1024) {
      setPosterUploadError(`Image is too large. Max ${MAX_POSTER_MB}MB.`)
      return
    }
    setPosterUploading(true)
    setPosterUploadError(null)
    try {
      const ext = file.name.split('.').pop() || 'png'
      const filePath = `${tenant.id}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('posters').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })
      if (error) throw error
      const { data } = supabase.storage.from('posters').getPublicUrl(filePath)
      setForm(p => ({ ...p, booking_poster_image_url: data.publicUrl }))
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : 'Upload failed.'
      setPosterUploadError(`${message} Please try a different image.`)
    } finally {
      setPosterUploading(false)
    }
  }

  const posterSizes = {
    A5: { width: 148, height: 210 },
    A4: { width: 210, height: 297 },
    A3: { width: 297, height: 420 },
  } as const

  const openPoster = () => {
    if (!qrDataUrl || !tenant) return
    const size = posterSizes[posterSize]
    const offer = offerText ? `<div class="offer">${offerText}</div>` : ''
    const imageBlock = posterImage
      ? `<div class="photo"><img src="${posterImage}" alt="Poster image" /></div>`
      : ''
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Booking Poster</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700;800&family=Inter:wght@400;600;700&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Inter', sans-serif; background: #ffffff; color: #0f172a; }
  @page { size: ${posterSize} portrait; margin: 0; }
  .poster { width:${size.width}mm; min-height:${size.height}mm; padding:18mm; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:22px; }
  .badge { background: ${hexToRgba(brandColour, 0.1)}; border: 1px solid ${hexToRgba(brandColour, 0.25)}; color: ${brandColour}; font-size:11px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; padding:6px 14px; border-radius:999px; }
  .headline { font-family: 'Fraunces', serif; font-size:40px; font-weight:800; text-align:center; line-height:1.1; }
  .subtext { font-size:16px; text-align:center; line-height:1.6; color:#475569; max-width:380px; }
  .photo { width: 140px; height: 140px; border-radius: 24px; overflow:hidden; border:1px solid #e2e8f0; background:#f8fafc; display:flex; align-items:center; justify-content:center; }
  .photo img { width:100%; height:100%; object-fit:cover; }
  .qr-wrap { background:white; border-radius:22px; padding:16px; border:1px solid #e2e8f0; }
  .qr-wrap img { display:block; width:200px; height:200px; }
  .cta { font-size:18px; font-weight:800; color:${brandColour}; text-align:center; }
  .offer { font-size:14px; font-weight:600; text-align:center; color:#0f172a; background:${hexToRgba(brandColour, 0.12)}; border:1px dashed ${hexToRgba(brandColour, 0.35)}; padding:8px 12px; border-radius:14px; }
  .url { font-size:12px; color:#94a3b8; text-align:center; word-break:break-all; }
  .powered { font-size:11px; color:#cbd5f5; margin-top:auto; padding-top:14px; }
</style></head><body>
<div class="poster">
  <div class="badge">Online Booking</div>
  <h1 class="headline">${posterHeadline}</h1>
  <p class="subtext">${posterSubtext}</p>
  ${imageBlock}
  <div class="qr-wrap"><img src="${qrDataUrl}" /></div>
  <p class="cta">${posterCta}</p>
  ${offer}
  <p class="url">${bookingUrl}</p>
</div>
<script>window.onload = function(){ window.print(); }</script>
</body></html>`
    const w = window.open('', '_blank', 'width=900,height=700')
    if (w) { w.document.write(html); w.document.close() }
  }

  const openWaitPoster = () => {
    if (!waitQrDataUrl || !tenant) return
    const size = posterSizes[posterSize]
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Live Wait Poster</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700;800&family=Inter:wght@400;600;700&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Inter', sans-serif; background: #ffffff; color: #0f172a; }
  @page { size: ${posterSize} portrait; margin: 0; }
  .poster { width:${size.width}mm; min-height:${size.height}mm; padding:18mm; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:22px; }
  .badge { background: ${hexToRgba(brandColour, 0.1)}; border: 1px solid ${hexToRgba(brandColour, 0.25)}; color: ${brandColour}; font-size:11px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; padding:6px 14px; border-radius:999px; }
  .headline { font-family: 'Fraunces', serif; font-size:40px; font-weight:800; text-align:center; line-height:1.1; }
  .subtext { font-size:16px; text-align:center; line-height:1.6; color:#475569; max-width:380px; }
  .qr-wrap { background:white; border-radius:22px; padding:16px; border:1px solid #e2e8f0; }
  .qr-wrap img { display:block; width:200px; height:200px; }
  .cta { font-size:18px; font-weight:800; color:${brandColour}; text-align:center; }
  .url { font-size:12px; color:#94a3b8; text-align:center; word-break:break-all; }
  .powered { font-size:11px; color:#cbd5f5; margin-top:auto; padding-top:14px; }
</style></head><body>
<div class="poster">
  <div class="badge">Live Queue</div>
  <h1 class="headline">${waitHeadline}</h1>
  <p class="subtext">${waitSubtext}</p>
  <div class="qr-wrap"><img src="${waitQrDataUrl}" /></div>
  <p class="cta">${waitCta}</p>
  <p class="url">${waitUrl}</p>
</div>
<script>window.onload = function(){ window.print(); }</script>
</body></html>`
    const w = window.open('', '_blank', 'width=900,height=700')
    if (w) { w.document.write(html); w.document.close() }
  }

  const saveChanges = async () => {
    if (!tenant) return
    setSaving(true)
    setSaved(false)
    setSaveError(null)
    const payload = {
      brand_colour: form.brand_colour || '#0d6e6e',
      booking_page_headline: form.booking_page_headline.trim() || null,
      booking_page_subtext: form.booking_page_subtext.trim() || null,
      booking_page_theme: form.booking_page_theme || 'soft',
      booking_page_cta_label: normalizeCtaLabel(form.booking_page_cta_label) || null,
      booking_page_font: form.booking_page_font || 'sans',
      booking_page_button_style: form.booking_page_button_style || 'solid',
      booking_page_ab_enabled: !!form.booking_page_ab_enabled,
      booking_page_ab_split: Math.min(Math.max(Number(form.booking_page_ab_split) || 50, 0), 100),
      booking_page_ab_auto_apply: !!form.booking_page_ab_auto_apply,
      booking_page_variant_b_headline: form.booking_page_variant_b_headline.trim() || null,
      booking_page_variant_b_subtext: form.booking_page_variant_b_subtext.trim() || null,
      booking_page_variant_b_cta_label: normalizeCtaLabel(form.booking_page_variant_b_cta_label) || null,
      booking_page_variant_b_theme: form.booking_page_variant_b_theme || 'soft',
      booking_page_variant_b_font: form.booking_page_variant_b_font || 'sans',
      booking_page_variant_b_button_style: form.booking_page_variant_b_button_style || 'solid',
      booking_page_variant_b_brand_colour: form.booking_page_variant_b_brand_colour || null,
      wait_page_enabled: supportsWaitTime ? !!form.wait_page_enabled : false,
      wait_qr_headline: supportsWaitTime ? (form.wait_qr_headline.trim() || null) : null,
      wait_qr_subtext: supportsWaitTime ? (form.wait_qr_subtext.trim() || null) : null,
      wait_qr_cta: supportsWaitTime ? (form.wait_qr_cta.trim() || null) : null,
      queue_delay_minutes: supportsWaitTime ? Math.min(Math.max(Number(form.queue_delay_minutes) || 0, 0), 60) : 0,
      booking_page_show_live_availability: !!form.booking_page_show_live_availability,
      booking_page_live_window_minutes: Math.min(Math.max(Number(form.booking_page_live_window_minutes) || 60, 15), 240),
      booking_page_live_buffer_minutes: Math.min(Math.max(Number(form.booking_page_live_buffer_minutes) || 20, 0), 60),
      rental_min_days: Math.max(1, Number(form.rental_min_days) || 1),
      rental_requirements: form.rental_requirements.trim() || null,
      booking_poster_offer: form.booking_poster_offer.trim() || null,
      booking_poster_headline: form.booking_poster_headline.trim() || null,
      booking_poster_subtext: form.booking_poster_subtext.trim() || null,
      booking_poster_cta: form.booking_poster_cta.trim() || null,
      booking_poster_image_url: (form.booking_poster_image_url || '').trim() || null,
    }
    const { error } = await (supabase.from('tenants') as any).update(payload).eq('id', tenant.id)
    if (!error) {
      setTenant(t => (t ? { ...t, ...payload } : t))
      setSaved(true)
      setPreviewTick(t => t + 1)
      setTimeout(() => setSaved(false), 2000)
    } else {
      setSaveError(error.message || 'Could not save changes.')
    }
    setSaving(false)
  }

  const toggleLiveAvailability = async () => {
    if (!tenant || !supportsLiveAvailability) return
    const nextEnabled = !form.booking_page_show_live_availability
    const nextPayload = {
      booking_page_show_live_availability: nextEnabled,
      booking_page_live_window_minutes: Math.min(Math.max(Number(form.booking_page_live_window_minutes) || 60, 15), 240),
      booking_page_live_buffer_minutes: Math.min(Math.max(Number(form.booking_page_live_buffer_minutes) || 20, 0), 60),
    }
    setForm(p => ({ ...p, ...nextPayload }))
    setSaving(true)
    setSaved(false)
    setSaveError(null)
    const { error } = await (supabase.from('tenants') as any).update(nextPayload).eq('id', tenant.id)
    if (!error) {
      setTenant(t => (t ? { ...t, ...nextPayload } : t))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } else {
      setSaveError(error.message || 'Could not save live availability settings.')
    }
    setSaving(false)
  }

  const applyVariantB = async () => {
    if (!tenant) return
    const payload = {
      booking_page_headline: (form.booking_page_variant_b_headline || form.booking_page_headline).trim() || '',
      booking_page_subtext: (form.booking_page_variant_b_subtext || form.booking_page_subtext).trim() || '',
      booking_page_cta_label: normalizeCtaLabel(form.booking_page_variant_b_cta_label || form.booking_page_cta_label) || '',
      booking_page_theme: form.booking_page_variant_b_theme || form.booking_page_theme || 'soft',
      booking_page_font: form.booking_page_variant_b_font || form.booking_page_font || 'sans',
      booking_page_button_style: form.booking_page_variant_b_button_style || form.booking_page_button_style || 'solid',
      brand_colour: form.booking_page_variant_b_brand_colour || form.brand_colour || '#0d6e6e',
      booking_page_ab_enabled: false,
    }
    setSaving(true)
    const { error } = await (supabase.from('tenants') as any).update(payload).eq('id', tenant.id)
    if (!error) {
      setForm(p => ({
        ...p,
        ...payload,
        booking_page_ab_enabled: false,
      }))
      setTenant(t => (t ? { ...t, ...payload } : t))
      setSaved(true)
      setAutoApplied(true)
      setAbNotice('Page B is now live. A/B testing has been paused.')
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-dark">Booking Page</h1>
          <p className="text-sm text-dark/50">Share with customers to start receiving bookings</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tenant?.booking_page_enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
            {tenant?.booking_page_enabled ? '● Live' : '● Offline'}
          </span>
          <button onClick={togglePage} disabled={toggling}
            className={`w-10 h-5 rounded-full transition-all relative disabled:opacity-50 ${tenant?.booking_page_enabled ? 'bg-teal' : 'bg-border'}`}>
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${tenant?.booking_page_enabled ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <div className="space-y-6">
          {/* Customisation */}
          <div className="bg-white rounded-2xl border border-border p-6 space-y-6">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-teal" />
              <h3 className="font-semibold text-dark">Customize your booking experience</h3>
            </div>

            {isSupercar && (
              <div className="border-t border-border pt-5 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-dark">Rental settings</p>
                  <p className="text-xs text-dark/50">Set minimum hire length and what guests need to bring.</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">Minimum rental days</label>
                    <input
                      type="number"
                      min={1}
                      value={form.rental_min_days}
                      onChange={e => setForm(p => ({ ...p, rental_min_days: Number(e.target.value) }))}
                      className="mt-2 w-full h-10 px-3 rounded-xl border border-border text-sm"
                    />
                    <p className="text-xs text-dark/40 mt-1">Used to validate return date on the booking page.</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">Requirements to bring</label>
                    <textarea
                      value={form.rental_requirements}
                      onChange={e => setForm(p => ({ ...p, rental_requirements: e.target.value }))}
                      placeholder="e.g. Full driving licence, proof of address, and the deposit card used for booking."
                      rows={3}
                      className="mt-2 w-full px-3 py-2 rounded-xl border border-border text-sm resize-none"
                    />
                    <p className="text-xs text-dark/40 mt-1">Shown on the live booking page before confirmation.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">Brand colour</label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="color"
                    value={form.brand_colour}
                    onChange={e => setForm(p => ({ ...p, brand_colour: e.target.value }))}
                    className="h-10 w-12 rounded-lg border border-border"
                  />
                  <input
                    type="text"
                    value={form.brand_colour}
                    onChange={e => setForm(p => ({ ...p, brand_colour: e.target.value }))}
                    className="flex-1 h-10 px-3 rounded-xl border border-border text-sm font-mono"
                    placeholder="#0d6e6e"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">Background</label>
                <select
                  value={form.booking_page_theme}
                  onChange={e => setForm(p => ({ ...p, booking_page_theme: e.target.value }))}
                  className="mt-2 w-full h-10 px-3 rounded-xl border border-border text-sm"
                >
                  {Object.entries(BOOKING_THEMES).map(([key, value]) => (
                    <option key={key} value={key}>{value.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">Font style</label>
                <div className="flex items-center gap-2 mt-2">
                  <Type className="w-4 h-4 text-dark/40" />
                  <select
                    value={form.booking_page_font}
                    onChange={e => setForm(p => ({ ...p, booking_page_font: e.target.value }))}
                    className="flex-1 h-10 px-3 rounded-xl border border-border text-sm"
                  >
                    {FONT_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">Button style</label>
                <select
                  value={form.booking_page_button_style}
                  onChange={e => setForm(p => ({ ...p, booking_page_button_style: e.target.value }))}
                  className="mt-2 w-full h-10 px-3 rounded-xl border border-border text-sm"
                >
                  {BUTTON_STYLES.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-border pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-dark">{liveAvailabilityTitle}</p>
                  <p className="text-xs text-dark/50">
                    {liveAvailabilityHelp}
                  </p>
                </div>
                <button
                  onClick={toggleLiveAvailability}
                  disabled={!supportsLiveAvailability}
                  className={`w-10 h-5 rounded-full transition-all relative ${
                    form.booking_page_show_live_availability ? 'bg-teal' : 'bg-border'
                  } ${supportsLiveAvailability ? '' : 'opacity-40 cursor-not-allowed'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.booking_page_show_live_availability ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
              {!supportsLiveAvailability && (
                <p className="text-xs text-dark/50">
                  Live availability is designed for appointment-based businesses.
                </p>
              )}
              {supportsLiveAvailability && (
                <p className="text-xs text-dark/50">{liveAvailabilityBoost}</p>
              )}
              {form.booking_page_show_live_availability && supportsLiveAvailability && (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">Live window (minutes)</label>
                      <input
                        type="number"
                        min={15}
                        max={240}
                        value={form.booking_page_live_window_minutes}
                        onChange={e => setForm(p => ({ ...p, booking_page_live_window_minutes: Number(e.target.value) }))}
                        className="mt-2 w-full h-10 px-3 rounded-xl border border-border text-sm"
                      />
                      <p className="text-xs text-dark/40 mt-1">Urgent banner shows when a slot opens within this window.</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">Buffer after booking (minutes)</label>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={form.booking_page_live_buffer_minutes}
                        onChange={e => setForm(p => ({ ...p, booking_page_live_buffer_minutes: Number(e.target.value) }))}
                        className="mt-2 w-full h-10 px-3 rounded-xl border border-border text-sm"
                      />
                      <p className="text-xs text-dark/40 mt-1">Gap reserved between bookings before next slot opens.</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-dashed border-teal/30 bg-teal/5 p-4">
                    <p className="text-xs font-semibold text-dark/60">
                      Preview appears on the right, alongside your booking calendar.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">Headline</label>
                <input
                  value={form.booking_page_headline}
                  onChange={e => setForm(p => ({ ...p, booking_page_headline: e.target.value }))}
                  placeholder={recommendedHeadline}
                  className="mt-2 w-full h-10 px-3 rounded-xl border border-border text-sm"
                />
                <button
                  onClick={() => setForm(p => ({ ...p, booking_page_headline: recommendedHeadline }))}
                  className="mt-2 text-xs text-teal font-semibold flex items-center gap-1 hover:underline"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Use recommended
                </button>
              </div>
              <div>
                <label className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">Subtext</label>
                <textarea
                  value={form.booking_page_subtext}
                  onChange={e => setForm(p => ({ ...p, booking_page_subtext: e.target.value }))}
                  placeholder={recommendedSubtext}
                  rows={2}
                  className="mt-2 w-full px-3 py-2 rounded-xl border border-border text-sm resize-none"
                />
                <button
                  onClick={() => setForm(p => ({ ...p, booking_page_subtext: recommendedSubtext }))}
                  className="mt-2 text-xs text-teal font-semibold flex items-center gap-1 hover:underline"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Use recommended
                </button>
              </div>
              <div>
                <label className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">Primary button text</label>
                <input
                  value={form.booking_page_cta_label}
                  onChange={e => setForm(p => ({ ...p, booking_page_cta_label: e.target.value }))}
                  placeholder={recommendedCta}
                  className="mt-2 w-full h-10 px-3 rounded-xl border border-border text-sm"
                />
                <p className="text-xs text-dark/40 mt-1">Leave blank to use the high‑converting default.</p>
              </div>
            </div>

            <div className="border-t border-border pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-dark">A/B test your booking page</p>
                  <p className="text-xs text-dark/50">Compare Page A vs Page B to see which converts more bookings.</p>
                </div>
                <button
                  onClick={() => setForm(p => ({ ...p, booking_page_ab_enabled: !p.booking_page_ab_enabled }))}
                  className={`w-10 h-5 rounded-full transition-all relative ${form.booking_page_ab_enabled ? 'bg-teal' : 'bg-border'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.booking_page_ab_enabled ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>

              {abNotice && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-dark/60">
                  {abNotice}
                </div>
              )}

              {!form.booking_page_ab_enabled && (
                <p className="text-xs text-dark/40">A/B testing is paused. Turn it on to compare Page A vs Page B.</p>
              )}

              {form.booking_page_ab_enabled && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">Traffic split (B %)</label>
                    <div className="flex items-center gap-3 mt-2">
                      <input
                        type="range"
                        min={10}
                        max={90}
                        step={10}
                        value={form.booking_page_ab_split}
                        onChange={e => setForm(p => ({ ...p, booking_page_ab_split: Number(e.target.value) }))}
                        className="flex-1"
                      />
                      <span className="text-sm font-semibold text-dark">{form.booking_page_ab_split}%</span>
                    </div>
                    <p className="text-xs text-dark/40 mt-1">Remaining traffic stays on Page A.</p>
                  </div>

                  <div className="flex items-center justify-between bg-white border border-border rounded-xl px-4 py-3">
                    <div>
                      <p className="text-xs font-semibold text-dark/70">Auto‑apply winner (recommended)</p>
                      <p className="text-[11px] text-dark/40">When Page B clearly wins, switch automatically.</p>
                    </div>
                    <button
                      onClick={() => setForm(p => ({ ...p, booking_page_ab_auto_apply: !p.booking_page_ab_auto_apply }))}
                      className={`w-10 h-5 rounded-full transition-all relative ${form.booking_page_ab_auto_apply ? 'bg-emerald-500' : 'bg-border'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.booking_page_ab_auto_apply ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>

                  {recommendSwitchToB && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">Recommendation: switch to Page B</p>
                        <p className="text-xs text-emerald-700">
                          Page B is converting at {bRate.toFixed(1)}% vs {aRate.toFixed(1)}% on Page A.
                        </p>
                      </div>
                      <button
                        onClick={applyVariantB}
                        disabled={saving}
                        className="bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-lg"
                      >
                        Use Page B
                      </button>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">Page B headline</label>
                      <input
                        value={form.booking_page_variant_b_headline}
                        onChange={e => setForm(p => ({ ...p, booking_page_variant_b_headline: e.target.value }))}
                        placeholder={recommendedHeadline}
                        className="mt-2 w-full h-10 px-3 rounded-xl border border-border text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">Page B subtext</label>
                      <textarea
                        value={form.booking_page_variant_b_subtext}
                        onChange={e => setForm(p => ({ ...p, booking_page_variant_b_subtext: e.target.value }))}
                        placeholder={recommendedSubtext}
                        rows={2}
                        className="mt-2 w-full px-3 py-2 rounded-xl border border-border text-sm resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">Page B button text</label>
                      <input
                        value={form.booking_page_variant_b_cta_label}
                        onChange={e => setForm(p => ({ ...p, booking_page_variant_b_cta_label: e.target.value }))}
                        placeholder={recommendedCta}
                        className="mt-2 w-full h-10 px-3 rounded-xl border border-border text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">Page B background</label>
                      <select
                        value={form.booking_page_variant_b_theme}
                        onChange={e => setForm(p => ({ ...p, booking_page_variant_b_theme: e.target.value }))}
                        className="mt-2 w-full h-10 px-3 rounded-xl border border-border text-sm"
                      >
                        {Object.entries(BOOKING_THEMES).map(([key, value]) => (
                          <option key={key} value={key}>{value.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">Page B brand colour</label>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="color"
                          value={form.booking_page_variant_b_brand_colour || brandColour}
                          onChange={e => setForm(p => ({ ...p, booking_page_variant_b_brand_colour: e.target.value }))}
                          className="h-10 w-12 rounded-lg border border-border"
                        />
                        <input
                          value={form.booking_page_variant_b_brand_colour}
                          onChange={e => setForm(p => ({ ...p, booking_page_variant_b_brand_colour: e.target.value }))}
                          placeholder={brandColour}
                          className="flex-1 h-10 px-3 rounded-xl border border-border text-sm"
                        />
                      </div>
                      <p className="text-[11px] text-dark/40 mt-1">Leave blank to use Page A colour.</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">Page B font style</label>
                      <select
                        value={form.booking_page_variant_b_font}
                        onChange={e => setForm(p => ({ ...p, booking_page_variant_b_font: e.target.value }))}
                        className="mt-2 w-full h-10 px-3 rounded-xl border border-border text-sm"
                      >
                        {FONT_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">Page B button style</label>
                      <select
                        value={form.booking_page_variant_b_button_style}
                        onChange={e => setForm(p => ({ ...p, booking_page_variant_b_button_style: e.target.value }))}
                        className="mt-2 w-full h-10 px-3 rounded-xl border border-border text-sm"
                      >
                        {BUTTON_STYLES.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="bg-[#f8f6f1] rounded-xl px-4 py-3 text-xs text-dark/60 flex items-center justify-between gap-3 flex-wrap">
                    {abLoading ? (
                      <span>Loading stats…</span>
                    ) : (
                      <span>
                        Page A: <strong>{aBookings}/{aViews}</strong> bookings ({aRate.toFixed(1)}%)&nbsp;&nbsp;·&nbsp;&nbsp;
                        Page B: <strong>{bBookings}/{bViews}</strong> bookings ({bRate.toFixed(1)}%)
                      </span>
                    )}
                    <button
                      onClick={async () => {
                        if (!confirm('Reset A/B stats? This clears all view and booking counts for both variants so you can start a clean test.')) return
                        await fetch('/api/booking-page/ab', { method: 'DELETE' })
                        setAbStats({ A: { views: 0, bookings: 0 }, B: { views: 0, bookings: 0 } })
                      }}
                      className="text-xs text-dark/40 hover:text-red-500 transition-colors underline underline-offset-2 flex-shrink-0"
                    >
                      Reset stats
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-border pt-5">
              <div className="flex items-center gap-2 mb-3">
                <QrCode className="w-4 h-4 text-teal" />
                <h4 className="font-semibold text-dark">Poster text</h4>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">Poster headline</label>
                  <input
                    value={form.booking_poster_headline}
                    onChange={e => setForm(p => ({ ...p, booking_poster_headline: e.target.value }))}
                    placeholder={recommendedPosterHeadline}
                    className="mt-2 w-full h-10 px-3 rounded-xl border border-border text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">Poster subtext</label>
                  <textarea
                    value={form.booking_poster_subtext}
                    onChange={e => setForm(p => ({ ...p, booking_poster_subtext: e.target.value }))}
                    placeholder={recommendedPosterSubtext}
                    rows={2}
                    className="mt-2 w-full px-3 py-2 rounded-xl border border-border text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">Poster CTA</label>
                  <input
                    value={form.booking_poster_cta}
                    onChange={e => setForm(p => ({ ...p, booking_poster_cta: e.target.value }))}
                    placeholder={recommendedPosterCta}
                    className="mt-2 w-full h-10 px-3 rounded-xl border border-border text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">Offer text</label>
                  <input
                    value={form.booking_poster_offer}
                    onChange={e => setForm(p => ({ ...p, booking_poster_offer: e.target.value }))}
                    placeholder={recommendedOffer}
                    className="mt-2 w-full h-10 px-3 rounded-xl border border-border text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={saveChanges} disabled={saving} className="btn-primary text-sm py-2 px-4 disabled:opacity-60">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              {saved && <span className="text-xs text-emerald-600 font-semibold">Saved!</span>}
              {saveError && <span className="text-xs text-red-600 font-semibold">{saveError}</span>}
            </div>
          </div>

          {/* Booking URL */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-teal" />
              <h3 className="font-semibold text-dark">Your Booking Link</h3>
            </div>
            <div className="flex items-center gap-2 bg-[#f8f6f1] rounded-xl px-4 py-3">
              <span className="flex-1 text-sm font-mono text-teal truncate">{bookingUrl}</span>
              <button onClick={() => copy(bookingUrl, 'url')}
                className="flex items-center gap-1 text-xs font-medium text-dark/50 hover:text-dark transition-colors px-2 py-1 rounded-lg hover:bg-white flex-shrink-0">
                {copied === 'url' ? <><Check className="w-3.5 h-3.5 text-teal" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </button>
              <a href={bookingUrl} target="_blank" rel="noopener"
                className="flex items-center gap-1 text-xs font-medium text-dark/50 hover:text-dark transition-colors px-2 py-1 rounded-lg hover:bg-white flex-shrink-0">
                <ExternalLink className="w-3.5 h-3.5" /> Preview
              </a>
            </div>
          </div>

          {/* Share */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Share2 className="w-4 h-4 text-teal" />
              <h3 className="font-semibold text-dark">Share</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href={whatsappLink} target="_blank" rel="noopener"
                className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white rounded-xl text-sm font-semibold hover:bg-[#20b958] transition-colors">
                <MessageCircle className="w-4 h-4" /> Share on WhatsApp
              </a>
              <a href={`mailto:?subject=Book%20an%20appointment&body=Book%20here%3A%20${encodeURIComponent(bookingUrl)}`}
                className="flex items-center gap-2 px-4 py-2.5 bg-dark text-white rounded-xl text-sm font-semibold hover:bg-dark/80 transition-colors">
                <Mail className="w-4 h-4" /> Share via Email
              </a>
              <button onClick={() => copy(bookingUrl, 'share')}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                {copied === 'share' ? <><Check className="w-4 h-4 text-teal" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Link</>}
              </button>
            </div>
          </div>

          {/* Embed code */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-dark">Embed on Your Website</h3>
                <p className="text-xs text-dark/50">Paste this code into your website HTML</p>
              </div>
              {iframeCode && (
                <button onClick={() => copy(iframeCode, 'embed')}
                  className="flex items-center gap-1.5 text-sm font-medium text-teal hover:underline">
                  {copied === 'embed' ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Code</>}
                </button>
              )}
            </div>
            {iframeCode ? (
              <pre className="bg-[#1a1814] text-[#a0d4d4] rounded-xl p-4 text-xs overflow-x-auto font-mono leading-relaxed whitespace-pre">
                {iframeCode}
              </pre>
            ) : (
              <div className="bg-[#1a1814] rounded-xl p-4 space-y-2">
                <div className="h-3 w-24 rounded bg-white/10 animate-pulse" />
                <div className="h-3 w-64 rounded bg-white/10 animate-pulse" />
                <div className="h-3 w-20 rounded bg-white/10 animate-pulse" />
                <div className="h-3 w-16 rounded bg-white/10 animate-pulse" />
                <div className="h-3 w-36 rounded bg-white/10 animate-pulse" />
                <div className="h-3 w-12 rounded bg-white/10 animate-pulse" />
              </div>
            )}
          </div>

          {/* Help installing */}
          <div className="bg-teal/5 border border-teal/20 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-teal/10 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4 text-teal" />
            </div>
            <div>
              <p className="font-semibold text-dark text-sm">Need help adding this to your website?</p>
              <p className="text-xs text-dark/60 mt-0.5 leading-relaxed">
                We can install your booking page for you — free of charge. Just send us a message and we'll get it live on your site.
              </p>
              <a
                href="mailto:hello@scudosystems.com?subject=Please%20help%20install%20my%20booking%20page&body=Hi%2C%20I%20need%20help%20adding%20the%20booking%20page%20to%20my%20website."
                className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-teal hover:underline"
              >
                <Mail className="w-3.5 h-3.5" /> Contact us for free installation help
              </a>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <div className="flex items-center gap-2 mb-3">
              <QrCode className="w-4 h-4 text-teal" />
              <h3 className="font-semibold text-dark">Booking page QR code</h3>
            </div>
            <p className="text-sm text-dark/50 mb-4">Print and display at reception, on your window, or on your menu.</p>
            <div className="flex items-start gap-6">
              <div className="w-32 h-32 bg-[#f8f6f1] rounded-xl flex items-center justify-center border border-border overflow-hidden">
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrDataUrl} alt="Booking page QR code" className="w-full h-full object-contain" />
                ) : (
                  <QrCode className="w-16 h-16 text-dark/20" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs text-dark/50 mb-3">
                  {qrDataUrl
                    ? 'Scan to open your booking page instantly.'
                    : 'QR codes are generated dynamically. Your QR code will appear here once your booking page is configured.'}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={downloadQr} disabled={!qrDataUrl || qrLoading} className="btn-primary text-sm py-2 disabled:opacity-60">
                    {qrLoading ? 'Generating…' : 'Download QR Code'}
                  </button>
                  <div className="flex items-center gap-2">
                    <select
                      value={posterSize}
                      onChange={e => setPosterSize(e.target.value as 'A4' | 'A5' | 'A3')}
                      className="h-9 px-3 rounded-xl border border-border text-xs font-semibold text-dark/70"
                    >
                      <option value="A4">A4 Poster</option>
                      <option value="A5">A5 Poster</option>
                      <option value="A3">A3 Poster</option>
                    </select>
                    <button onClick={openPoster} disabled={!qrDataUrl} className="btn-secondary text-sm py-2 disabled:opacity-60">
                      Get Booking Poster
                    </button>
                  </div>
                </div>

                <div className="mt-5 border-t border-border pt-4">
                  <p className="text-sm font-semibold text-dark mb-1">Poster image</p>
                  <p className="text-xs text-dark/50 mb-3">
                    Upload your brand image or a real event photo (JPG, PNG, or WebP up to {MAX_POSTER_MB}MB).
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="w-16 h-16 rounded-2xl border border-border bg-[#f8f6f1] overflow-hidden flex items-center justify-center">
                      {posterImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={posterImage} alt="Poster" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-dark/30">No image</span>
                      )}
                    </div>
                    <label className="btn-secondary text-sm py-2 px-4 cursor-pointer">
                      {posterUploading ? 'Uploading…' : 'Upload image'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) handlePosterUpload(file)
                          e.currentTarget.value = ''
                        }}
                      />
                    </label>
                    {posterImage && (
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, booking_poster_image_url: '' }))}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Remove image
                      </button>
                    )}
                  </div>
                  {posterUploadError && (
                    <p className="text-xs text-red-600 mt-2">{posterUploadError}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Live Wait-Time QR */}
          {supportsWaitTime && (
          <div className="bg-white rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-teal" />
                <h3 className="font-semibold text-dark">Live wait‑time QR code</h3>
              </div>
              <button
                onClick={() => setForm(p => ({ ...p, wait_page_enabled: !p.wait_page_enabled }))}
                className={`w-10 h-5 rounded-full transition-all relative ${form.wait_page_enabled ? 'bg-teal' : 'bg-border'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.wait_page_enabled ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
            <p className="text-sm text-dark/50 mb-4">
              Give {vertical?.customerLabel?.toLowerCase() || 'customers'} a live queue link to check wait time, add concerns, and leave feedback.
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">Headline</label>
                <input
                  value={form.wait_qr_headline}
                  onChange={e => setForm(p => ({ ...p, wait_qr_headline: e.target.value }))}
                  placeholder={recommendedWaitHeadline}
                  className="mt-2 w-full h-10 px-3 rounded-xl border border-border text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">CTA text</label>
                <input
                  value={form.wait_qr_cta}
                  onChange={e => setForm(p => ({ ...p, wait_qr_cta: e.target.value }))}
                  placeholder={recommendedWaitCta}
                  className="mt-2 w-full h-10 px-3 rounded-xl border border-border text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">Subtext</label>
                <textarea
                  value={form.wait_qr_subtext}
                  onChange={e => setForm(p => ({ ...p, wait_qr_subtext: e.target.value }))}
                  placeholder={recommendedWaitSubtext}
                  rows={2}
                  className="mt-2 w-full px-3 py-2 rounded-xl border border-border text-sm resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">Queue buffer (minutes)</label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={form.queue_delay_minutes}
                  onChange={e => setForm(p => ({ ...p, queue_delay_minutes: Number(e.target.value) }))}
                  className="mt-2 w-full h-10 px-3 rounded-xl border border-border text-sm"
                />
                <p className="text-xs text-dark/40 mt-1">Extra time added between appointments in the wait‑time ETA.</p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-32 h-32 bg-[#f8f6f1] rounded-xl flex items-center justify-center border border-border overflow-hidden">
                {waitQrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={waitQrDataUrl} alt="Wait-time QR code" className="w-full h-full object-contain" />
                ) : (
                  <QrCode className="w-16 h-16 text-dark/20" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs text-dark/50 mb-3">
                  {waitQrDataUrl
                    ? 'Scan to open the live wait‑time page.'
                    : 'Your live wait‑time QR will appear once the booking page is configured.'}
                </p>
                {waitQrError && (
                  <p className="text-xs text-red-600 mb-2">{waitQrError}</p>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={downloadWaitQr} disabled={!waitQrDataUrl || waitQrLoading} className="btn-primary text-sm py-2 disabled:opacity-60">
                    {waitQrLoading ? 'Generating…' : 'Download Wait QR'}
                  </button>
                  <div className="flex items-center gap-2">
                    <select
                      value={posterSize}
                      onChange={e => setPosterSize(e.target.value as 'A4' | 'A5' | 'A3')}
                      className="h-9 px-3 rounded-xl border border-border text-xs font-semibold text-dark/70"
                    >
                      <option value="A4">A4 Poster</option>
                      <option value="A5">A5 Poster</option>
                      <option value="A3">A3 Poster</option>
                    </select>
                    <button onClick={openWaitPoster} disabled={!waitQrDataUrl} className="btn-secondary text-sm py-2 disabled:opacity-60">
                      Get Wait‑Time Poster
                    </button>
                  </div>
                  <button
                    onClick={() => copy(waitUrl, 'wait')}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-border rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                  >
                    {copied === 'wait' ? <><Check className="w-4 h-4 text-teal" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Link</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Conversion tips */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h3 className="font-semibold text-dark mb-3">Increase bookings & returns</h3>
            <p className="text-sm text-dark/50 mb-4">Small operational wins lift conversion fast.</p>
            <div className="space-y-2 text-sm text-dark/70">
              <div className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-teal" />
                Keep the booking area clean and professional so walk‑ins trust you instantly.
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-teal" />
                Great customer service — friendly greetings and clear updates — boosts reviews and re‑bookings.
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-teal" />
                Be fast to respond and on‑time for appointments; speed increases repeat bookings.
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-teal" />
                Make the QR code visible at reception, window, and checkout for easy re‑booking.
              </div>
            </div>
          </div>

          {/* Preview button */}
          <a href={bookingUrl} target="_blank" rel="noopener"
            className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-teal/30 rounded-2xl text-teal font-semibold hover:bg-teal/5 transition-colors">
            <Eye className="w-5 h-5" />
            Open Live Booking Page
          </a>
        </div>

        {/* Right Preview Column */}
        <aside className="space-y-6 lg:sticky lg:top-24">
          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">Booking Page Preview</p>
              <span className="text-[11px] text-dark/40">Live preview</span>
            </div>
            <div className="space-y-4">
              {previewItems.map(item => {
                const previewColour = item.data.colour || brandColour
                return (
                  <div key={item.label} className="space-y-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                      {item.label}
                    </span>
                    {isSupercar ? (
                      <div className="rounded-2xl border border-border overflow-hidden bg-black">
                        <iframe
                          key={`${previewTick}-${item.label}`}
                          src={(item as any).url || previewUrl || bookingUrl}
                          title={`Booking page preview ${item.label}`}
                          className="w-full h-[420px] bg-black"
                        />
                      </div>
                    ) : (
                      <div
                        className={`rounded-2xl border border-border overflow-hidden ${item.data.font === 'serif' ? 'font-serif' : 'font-sans'}`}
                        style={{ background: item.data.theme.pageBg }}
                      >
                        <div className="p-4" style={{ background: `linear-gradient(135deg, ${hexToRgba(previewColour, item.data.theme.heroTint)}, ${hexToRgba(previewColour, 0.06)})` }}>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: previewColour }}>
                            {vertical?.label || 'Bookings'}
                          </p>
                          <h3 className="mt-2 text-lg font-bold text-dark">{item.data.headline}</h3>
                          <p className="text-xs text-dark/60 mt-1">{item.data.subtext}</p>
                        </div>
                        <div className="p-4">
                          <button
                            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
                            style={getButtonStyle(item.data.buttonStyle, previewColour)}
                          >
                            {item.data.cta}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">{liveAvailabilityTitle} Preview</p>
              <span className="text-[11px] text-dark/40">{form.booking_page_show_live_availability ? 'Enabled' : 'Off'}</span>
            </div>
            {!form.booking_page_show_live_availability ? (
              <p className="text-xs text-dark/50">Turn on the live availability toggle to show the banner on your booking page.</p>
            ) : isSupercar ? (
              <div className="space-y-3">
                <p className="text-xs text-dark/50">This banner sits above your calendar to highlight vehicles available soon.</p>
                <div className="rounded-2xl border px-4 py-3 flex items-center gap-3 bg-emerald-50 border-emerald-200">
                  <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
                  </span>
                  <div className="text-sm">
                    <p className="font-semibold text-dark">Vehicles available today</p>
                    <p className="text-dark/60">Reserve now before prime slots go</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-dark/50">This banner sits just above your calendar so customers see it immediately.</p>
                <div className="rounded-2xl border px-4 py-3 flex items-center gap-3 bg-emerald-50 border-emerald-200">
                  <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
                  </span>
                  <div className="text-sm">
                    <p className="font-semibold text-dark">Available soon — book while it lasts</p>
                    <p className="text-dark/60">Next opening at 14:30</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-slate-50 p-3 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-dark/40">Calendar preview</p>
                  <div className="grid grid-cols-7 gap-1 text-[10px] text-dark/40">
                    {['M','T','W','T','F','S','S'].map(d => (
                      <span key={d} className="text-center">{d}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-[10px]">
                    {[...Array(7)].map((_, i) => (
                      <div key={`c1-${i}`} className="rounded-md border border-border bg-white py-1 text-center text-dark/60">{i + 10}</div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['10:00','11:30','14:30','17:00'].map(t => (
                      <span key={t} className={`px-2 py-1 rounded-lg text-[11px] border ${t === '14:30' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-border text-dark/60'}`}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border px-4 py-3 flex items-center gap-3 bg-amber-50 border-amber-200">
                  <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-600" />
                  </span>
                  <div className="text-sm">
                    <p className="font-semibold text-dark">Opening available later today</p>
                    <p className="text-dark/60">Next opening at 17:00</p>
                  </div>
                </div>
                <div className="rounded-2xl border px-4 py-3 flex items-center gap-3 bg-slate-50 border-slate-200">
                  <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-400" />
                  </span>
                  <p className="text-sm text-dark/60">No openings left today — please select another date.</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">Poster Preview</p>
              <span className="text-[11px] text-dark/40">{posterSize}</span>
            </div>
            <div className={`rounded-2xl border border-border p-4 text-center space-y-3 ${fontClass}`}>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: brandColour }}>Online Booking</div>
              <h3 className="text-lg font-bold text-dark leading-snug">{posterHeadline}</h3>
              <p className="text-xs text-dark/50">{posterSubtext}</p>
              {posterImage && (
                <div className="mx-auto w-20 h-20 rounded-2xl border border-border overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={posterImage} alt="Poster" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="mx-auto w-32 h-32 bg-[#f8f6f1] rounded-xl border border-border flex items-center justify-center overflow-hidden">
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrDataUrl} alt="Poster QR" className="w-full h-full object-contain" />
                ) : (
                  <QrCode className="w-14 h-14 text-dark/20" />
                )}
              </div>
              <p className="text-sm font-semibold" style={{ color: brandColour }}>{posterCta}</p>
              {offerText && (
                <div className="text-[11px] font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: hexToRgba(brandColour, 0.12), color: brandColour }}>
                  {offerText}
                </div>
              )}
            </div>
          </div>

          {supportsWaitTime && (
            <div className="bg-white rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-dark/50 uppercase tracking-[0.2em]">Wait‑Time Poster</p>
                <span className="text-[11px] text-dark/40">{posterSize}</span>
              </div>
              <div className={`rounded-2xl border border-border p-4 text-center space-y-3 ${fontClass}`}>
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: brandColour }}>Live Queue</div>
                <h3 className="text-lg font-bold text-dark leading-snug">{waitHeadline}</h3>
                <p className="text-xs text-dark/50">{waitSubtext}</p>
                <div className="mx-auto w-32 h-32 bg-[#f8f6f1] rounded-xl border border-border flex items-center justify-center overflow-hidden">
                  {waitQrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={waitQrDataUrl} alt="Wait poster QR" className="w-full h-full object-contain" />
                  ) : (
                    <QrCode className="w-14 h-14 text-dark/20" />
                  )}
                </div>
                <p className="text-sm font-semibold" style={{ color: brandColour }}>{waitCta}</p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
