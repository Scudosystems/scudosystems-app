'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { VERTICAL_LIST } from '@/lib/verticals'
import {
  CheckCircle2, Calendar, CreditCard, BarChart3, Users, Bell,
  Shield, Clock, Globe, Zap, Star, ArrowRight, Menu, X,
  TrendingUp, Banknote, CalendarClock, ChevronDown, ChevronUp,
  Play, Sparkles, Lock, RefreshCw, Phone, Mail, MapPin, QrCode
} from 'lucide-react'

// ─── Data ────────────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  { name: 'Luxwash Team', business: 'Luxwash, Walsall', vertical: 'Car Wash', rating: 5, quote: 'ScudoSystems took around four days to integrate properly into our setup, but once it was live the difference was obvious. Bookings became easier to manage, the dashboard gave us clearer numbers, and the whole customer journey felt far more polished.' },
  { name: 'Sarah Mitchell', business: 'Glow Beauty Studio, Birmingham', vertical: 'Hair & Beauty', rating: 5, quote: 'We went from losing bookings on Instagram DMs to fully booked every week. Setup took literally 12 minutes. Wish we found this sooner.' },
  { name: 'Dr James Okonkwo', business: 'Smile Dental, Manchester', vertical: 'Dental Practice', rating: 5, quote: 'The deposit protection alone has saved us thousands. Patients love 24/7 booking — we get appointments at 11pm regularly now.' },
  { name: 'Marcus Webb', business: 'Iron Temple Gym, London', vertical: 'Gym & PT', rating: 5, quote: 'My PT sessions fill themselves now. The revenue dashboard shows me exactly what\'s coming in this month. Game changer.' },
  { name: 'Priya Sharma', business: 'Serenity Spa, Leeds', vertical: 'Spa & Wellness', rating: 5, quote: 'We handle 200+ bookings a month with zero admin. The reminder automations have cut our no-shows by 80%.' },
  { name: 'Tom Bradley', business: 'Speedy MOT, Sheffield', vertical: 'Auto & MOT', rating: 5, quote: 'Customers book online at midnight. The reg capture and reminder automation is exactly what we needed.' },
]

const FEATURES = [
  { icon: Clock,        title: '24/7 Online Booking',          desc: 'Stay available around the clock so customers can book, reserve or request the right slot without waiting for your team to reply.' },
  { icon: CreditCard,   title: 'Monthly Subscription Billing',  desc: 'One clean monthly subscription per business, with a 14-day free trial and self-serve billing when you need to upgrade, update or reactivate.' },
  { icon: Zap,          title: 'Live Availability Banner',     desc: 'Show live availability when it matters — whether that is a slot, a bay, a vehicle or the next available team member.' },
  { icon: Bell,         title: 'Automated Reminders',          desc: 'SMS and email reminders at 24 and 48 hours reduce no‑shows and last‑minute drop‑outs.' },
  { icon: Shield,       title: 'No‑Show Protection',           desc: 'Require a deposit to confirm. Customers who’ve paid are far more likely to show.' },
  { icon: Users,        title: 'Multi‑Staff Scheduling',       desc: 'Set individual hours, holidays and breaks. Customers can choose who they want.' },
  { icon: Users,        title: 'Staff Portal Access',          desc: 'Give each team member a private view of their own diary, reviews and upcoming shifts.' },
  { icon: Star,         title: 'Reviews & Feedback',           desc: 'Collect star ratings and comments after each visit so you can improve fast.' },
  { icon: CalendarClock, title: 'Wait‑Time Link',              desc: 'Useful for businesses that manage live queues, reception flow or same-day demand — especially dental, beauty, car wash and similar services.' },
  { icon: QrCode,       title: 'QR Booking Posters',           desc: 'Download A5/A4/A3 posters in your colours with a book‑now QR code.' },
  { icon: Sparkles,     title: 'A/B Tested Booking Pages',     desc: 'Run two versions of your booking page and let ScudoSystems keep the winner.' },
  { icon: CheckCircle2, title: 'Industry‑Specific Forms',      desc: 'Capture the right details for each industry — from allergies and emergency contacts to vehicle registration, pickup notes and site-specific requirements.' },
  { icon: Globe,        title: 'Website Embed & Share Link',   desc: 'Drop the widget on your website or share the link anywhere your customers already are.' },
  { icon: Globe,        title: 'Your Brand, Your Page',        desc: 'Logo, colours, custom headline and buttons — it looks like your system, not a marketplace.' },
  { icon: BarChart3,    title: 'Revenue Dashboard & Forecasts', desc: 'Track confirmed revenue, forecasts, top services and return rate in one view.' },
  { icon: QrCode,       title: 'QR Payments & Operator Dashboards', desc: 'Launch QR payment systems for charging, parking, wash bays and on-site collections with a separate operator dashboard, live stats and promotion tools.' },
  { icon: Zap,          title: 'EV & Mobility Infrastructure', desc: 'We also build payment flows for EV charging stations, parking and wider mobility infrastructure, with dashboards designed to increase usage and operator revenue.' },
]

const STEPS = [
  { num: '01', title: 'Set up in 10 minutes', desc: 'Pick your industry, add your services and opening hours. ScudoSystems pre-fills everything based on your business type — no guesswork.' },
  { num: '02', title: 'Share your booking link', desc: 'Drop your unique link in your Instagram bio, WhatsApp, or add the booking widget to your website. Customers book themselves 24/7 without calling you.' },
  { num: '03', title: 'Watch bookings and operations move', desc: 'Get instant visibility across bookings, revenue, staff activity and customer flow. ScudoSystems handles the admin so your team can focus on delivery.' },
]

const FAQS = [
  { q: 'How long does setup actually take?', a: 'Most businesses are live in under 10 minutes. You pick your industry, add your services and hours, customise your brand colours, and your booking page is ready to share. No tech skills required.' },
  { q: 'Do my customers need to sign up or download anything?', a: 'No. Customers visit your booking link, pick a slot, and confirm — no account, no app, no friction. Works on any device.' },
  { q: 'How does billing work?', a: 'ScudoSystems is billed monthly per business. Your 14-day free trial starts first, then billing continues on the monthly plan for your industry, which you can manage any time from your dashboard settings.' },
  { q: 'Can I charge different prices for different services?', a: 'Yes. Every service can have its own price, duration, and deposit rules. You are never locked into one flat price.' },
  { q: 'Is pricing the same for every industry?', a: 'No. Each industry has its own monthly price based on the workflows, forms, and tools included for that business type. Everything sits inside one monthly subscription.' },
  { q: 'Can I cancel anytime?', a: 'Yes — no contracts, no lock-in. Cancel from your dashboard settings at any time. We\'re confident you\'ll stay because the results speak for themselves.' },
  { q: 'What happens after the 14-day free trial?', a: 'If you don\'t add a payment method, your account pauses — no charges, ever. When you\'re ready to go live, pick a plan and reactivate in seconds.' },
]

const CORE_FEATURES = [
  '24/7 online booking page',
  'Unlimited services',
  'Unlimited bookings',
  'SMS + Email reminders',
  'Multi-staff scheduling',
  'Staff portal access',
  'Monthly subscription billing',
  'Website embed widget',
  'QR booking posters',
  'Live availability banner',
  'Review capture & feedback',
  'Custom brand & booking link',
  'Revenue dashboard',
]

function parseBillingModel(model: string) {
  const baseMatch = model.match(/£\s*([0-9]+(?:\.[0-9]+)?)\s*\/mo/i)

  const base = baseMatch?.[1] ?? null
  return { base, per: null, unit: 'booking' as const, headline: base ? `£${base}/mo` : model, isFlat: false }
}

// ─── Animated Dashboard Preview ───────────────────────────────────────────────

function DashboardPreview() {
  const [bookings, setBookings] = useState(14)
  const [revenue, setRevenue] = useState(4820)
  const [projected, setProjected] = useState(7340)
  const [showNotif, setShowNotif] = useState(false)
  const [notifKey, setNotifKey] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setBookings(b => b + 1)
      setRevenue(r => r + Math.floor(Math.random() * 85 + 45))
      setProjected(p => p + Math.floor(Math.random() * 120 + 60))
      setShowNotif(true)
      setNotifKey(k => k + 1)
      setTimeout(() => setShowNotif(false), 3500)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const bars = [62, 45, 78, 55, 90, 38, 71, 85, 60, 95, 48, 73, 88, 52]

  return (
    <div className="relative w-full">
      {/* Notification popup */}
      {showNotif && (
        <div
          key={notifKey}
          className="absolute -top-4 right-4 z-20 bg-white rounded-xl shadow-xl border border-blue-100 px-4 py-3 flex items-center gap-3 animate-notification-in"
        >
          <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800">New Booking!</p>
            <p className="text-xs text-slate-500">Just confirmed · £{Math.floor(Math.random() * 60 + 40)}</p>
          </div>
        </div>
      )}

      {/* Browser chrome */}
      <div className="bg-[#0F172A] rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/30 border border-white/5">
        <div className="bg-[#1E293B] px-4 py-3 flex items-center gap-2 border-b border-white/5">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <div className="flex-1 mx-3 bg-white/5 rounded-md h-5 flex items-center px-3">
            <span className="text-white/30 text-[10px]">dashboard.scudosystems.com</span>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-4 space-y-3">
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "Today's Bookings", value: bookings, prefix: '', suffix: '', color: 'text-blue-400' },
              { label: 'Month Revenue',    value: `£${revenue.toLocaleString()}`, prefix: '', suffix: '', color: 'text-emerald-400' },
              { label: 'Active Customers', value: 186, prefix: '', suffix: '', color: 'text-violet-400' },
              { label: 'Projected',        value: `£${projected.toLocaleString()}`, prefix: '', suffix: '', color: 'text-amber-400' },
            ].map((s, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-3">
                <p className="text-white/30 text-[10px] mb-1">{s.label}</p>
                <p className={`font-bold text-base tabular-nums transition-all duration-500 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Mini chart */}
          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/40 text-[10px]">Revenue — Last 14 Days</p>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 text-[10px] font-semibold">+18%</span>
              </div>
            </div>
            <div className="flex items-end gap-0.5 h-12">
              {bars.map((h, i) => (
                <div key={i} className="flex-1 rounded-sm transition-all duration-1000" style={{
                  height: `${h}%`,
                  background: `rgba(37,99,235,${0.4 + (h / 100) * 0.6})`
                }} />
              ))}
            </div>
          </div>

          {/* Recent bookings */}
          <div className="space-y-1.5">
            {[
              { name: 'Emma T.',  service: 'Haircut & Blow Dry', time: '09:00', amount: '£65', status: 'confirmed' },
              { name: 'James R.', service: 'Beard Trim',          time: '10:30', amount: '£25', status: 'pending' },
              { name: 'Aisha K.', service: 'Full Highlights',     time: '12:00', amount: '£120', status: 'confirmed' },
            ].map((b, i) => (
              <div key={i} className="bg-white/5 rounded-lg px-3 py-2 flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: b.status === 'confirmed' ? '#34d399' : '#fbbf24' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-[10px] font-medium truncate">{b.name} · {b.service}</p>
                </div>
                <p className="text-white/40 text-[10px]">{b.time}</p>
                <p className="text-emerald-400 text-[10px] font-bold tabular-nums">{b.amount}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [testimonialIdx, setTestimonialIdx] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [selectedIndustry, setSelectedIndustry] = useState(VERTICAL_LIST[0])
  const [mounted, setMounted] = useState(false)
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

  const industryPricing = parseBillingModel(selectedIndustry.billingModel)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const t = setInterval(() => setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length), 6000)
    return () => clearInterval(t)
  }, [])

  // Reveal on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const trust = [
    { icon: Lock,        text: 'Secure monthly billing' },
    { icon: Zap,         text: 'Live in 10 minutes' },
    { icon: Shield,      text: 'No setup fee' },
    { icon: RefreshCw,   text: 'Cancel anytime' },
    { icon: Bell,        text: 'Auto reminders' },
    { icon: BarChart3,   text: 'Revenue dashboard' },
    { icon: CheckCircle2, text: 'No credit card' },
    { icon: Globe,       text: 'Custom booking page' },
  ]

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ─── Navbar ──────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-teal rounded-lg flex items-center justify-center shadow-sm shadow-teal/30">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl text-dark tracking-tight">ScudoSystems</span>
          </Link>
          <div className="hidden md:flex items-center gap-7">
            <a href="#features" className="text-sm text-slate-500 hover:text-dark transition-colors font-medium">Features</a>
            <a href="#industries" className="text-sm text-slate-500 hover:text-dark transition-colors font-medium">Industries</a>
            <a href="#pricing" className="text-sm text-slate-500 hover:text-dark transition-colors font-medium">Pricing</a>
            <Link href="/sign-in" className="text-sm text-slate-500 hover:text-dark transition-colors font-medium">Sign in</Link>
            <Link href="/sign-up" className="btn-primary py-2 px-5 text-sm">Start Free Trial</Link>
          </div>
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-4 py-4 flex flex-col gap-4">
            <a href="#features" className="text-sm font-medium text-slate-600">Features</a>
            <a href="#industries" className="text-sm font-medium text-slate-600">Industries</a>
            <a href="#pricing" className="text-sm font-medium text-slate-600">Pricing</a>
            <Link href="/sign-in" className="text-sm font-medium text-slate-600">Sign in</Link>
            <Link href="/sign-up" className="btn-primary text-center">Start Free Trial</Link>
          </div>
        )}
      </nav>

      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 hero-glow pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-100 rounded-full filter blur-3xl opacity-40 animate-blob pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-72 h-72 bg-violet-100 rounded-full filter blur-3xl opacity-30 animate-blob pointer-events-none" style={{ animationDelay: '3s' }} />

        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Copy */}
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-teal border border-blue-100 px-4 py-2 rounded-full text-sm font-semibold mb-8">
                <Sparkles className="w-3.5 h-3.5" />
                Built for 25+ business types across bookings, rentals and on-site operations
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-[64px] font-bold text-dark leading-[1.05] mb-6 tracking-tight">
                Your business,
                <br />
                <span className="gradient-text italic font-serif">fully working.</span>
                <br />
                Without the chaos.
              </h1>

              <p className="text-xl text-slate-500 max-w-lg mb-10 leading-relaxed">
                ScudoSystems gives you booking pages, dashboards, staff access, automation and industry-specific workflows — so customers can book, reserve, enquire or pay without the usual back-and-forth. Set up quickly, go live cleanly, and run the whole operation with far less admin.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link href="/sign-up" className="btn-primary text-base px-8 py-4 flex items-center justify-center gap-2 rounded-2xl">
                  Start Free — 14 Days Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
                {demoMode && (
                  <Link href="/sign-in?demo=1&vertical=dental" className="btn-secondary text-base px-8 py-4 flex items-center justify-center gap-2 rounded-2xl">
                    <Play className="w-4 h-4" />
                    Client Demo
                  </Link>
                )}
                <a href="#how-it-works" className="btn-secondary text-base px-8 py-4 flex items-center justify-center gap-2 rounded-2xl">
                  <Play className="w-4 h-4" />
                  See how it works
                </a>
              </div>

              <div className="flex items-center gap-6 text-sm text-slate-400">
                {['No credit card', 'Cancel anytime', '10-min setup'].map(t => (
                  <div key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal flex-shrink-0" />
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Animated Dashboard */}
            <div className="relative animate-fade-in-slow" style={{ animationDelay: '0.3s' }}>
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-blue-500/10 rounded-3xl blur-xl" />
              <div className="relative animate-float">
                <DashboardPreview />
              </div>
              {/* Floating stat pills */}
              <div className="absolute -left-6 top-1/3 bg-white rounded-xl shadow-xl border border-slate-100 px-4 py-2.5 hidden lg:flex items-center gap-2.5 animate-fade-in" style={{ animationDelay: '1s' }}>
                <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Revenue this month</p>
                  <p className="text-sm font-bold text-slate-800">+18% vs last</p>
                </div>
              </div>
              <div className="absolute -right-6 bottom-1/4 bg-white rounded-xl shadow-xl border border-slate-100 px-4 py-2.5 hidden lg:flex items-center gap-2.5 animate-fade-in" style={{ animationDelay: '1.3s' }}>
                <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                  <Bell className="w-4 h-4 text-teal" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">No-shows reduced</p>
                  <p className="text-sm font-bold text-slate-800">Less fewer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust Bar ─────────────────────────────────────────────────── */}
      <div className="border-y border-slate-100 bg-slate-50 py-4 overflow-hidden">
        <div className="flex gap-12 animate-trust-scroll" style={{ width: 'max-content' }}>
          {[...trust, ...trust].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-slate-400 text-sm font-medium whitespace-nowrap">
              <item.icon className="w-4 h-4 text-teal" />
              {item.text}
            </div>
          ))}
        </div>
      </div>

      {/* ─── How It Works ──────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 reveal">
            <p className="text-sm font-semibold text-teal uppercase tracking-widest mb-3">Simple by design</p>
            <h2 className="text-4xl font-bold text-dark mb-4 tracking-tight">From setup to live operations in 3 steps</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">No developer. No IT team. No complicated software. Just a booking system that works.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={i} className="reveal relative" style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="text-6xl font-black text-slate-50 select-none mb-4 leading-none">{step.num}</div>
                <div className="absolute top-3 left-0 text-4xl font-black text-teal/10 select-none leading-none">{step.num}</div>
                <div className="w-10 h-10 rounded-2xl bg-teal/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-5 h-5 text-teal" />
                </div>
                <h3 className="text-xl font-bold text-dark mb-3">{step.title}</h3>
                <p className="text-slate-500 leading-relaxed">{step.desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 right-0 translate-x-1/2 text-slate-200">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ──────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 reveal">
            <p className="text-sm font-semibold text-teal uppercase tracking-widest mb-3">Everything included</p>
            <h2 className="text-4xl font-bold text-dark mb-4 tracking-tight">One platform for bookings, operations and growth</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              From appointments and rentals to QR-led customer journeys, ScudoSystems gives you booking, operations and reporting tools in one place — without bolting together five different systems.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="reveal bg-white p-6 rounded-2xl border border-slate-100 hover:border-teal/20 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 group" style={{ transitionDelay: `${(i % 3) * 60}ms` }}>
                <div className="w-11 h-11 bg-teal/10 rounded-xl flex items-center justify-center text-teal mb-5 group-hover:bg-teal group-hover:text-white transition-all duration-300">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-dark mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Social Proof Numbers ──────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="reveal rounded-[32px] border border-slate-200 bg-gradient-to-r from-[#0F172A] via-[#132042] to-[#1d4ed8] shadow-[0_30px_80px_rgba(15,23,42,0.18)] overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 text-center">
            {[
              { value: '25+',  label: 'Industries supported', subtext: 'From dental and beauty to rentals, EV and mobility operators' },
              { value: '100+', label: 'Businesses', subtext: 'Using ScudoSystems to run bookings, teams and daily operations' },
              { value: 'Less', label: 'Admin overhead', subtext: 'Cleaner workflows, fewer phone calls and less manual chasing' },
              { value: 'Live', label: 'Operator visibility', subtext: 'See availability, customer flow and reporting in one place' },
            ].map(({ value, label, subtext }) => (
              <div key={label} className="bg-white/5 px-6 py-8 md:px-8 md:py-10">
                <p className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">{value}</p>
                <p className="text-blue-100 text-sm font-semibold uppercase tracking-[0.16em] mb-2">{label}</p>
                <p className="text-blue-200/80 text-sm leading-relaxed max-w-[220px] mx-auto">{subtext}</p>
              </div>
            ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Industries ────────────────────────────────────────────────── */}
      <section id="industries" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 reveal">
            <p className="text-sm font-semibold text-teal uppercase tracking-widest mb-3">25 industries</p>
            <h2 className="text-4xl font-bold text-dark mb-4 tracking-tight">Built around how your business actually runs</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Used by clinics, salons, rentals, car washes, venues, instructors, EV operators and mobility sites that need clearer workflows, stronger conversion and better day-to-day visibility.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {VERTICAL_LIST.map((v) => {
              const isActive = selectedIndustry?.id === v.id
              return (
                <a key={v.id} href="#pricing" onClick={() => setSelectedIndustry(v)}
                  className={`reveal group flex items-start gap-4 p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'border-teal bg-blue-50/70 shadow-sm'
                      : 'border-slate-100 hover:border-teal/30 hover:bg-blue-50/50 hover:shadow-sm'
                  }`}>
                  <div className="text-2xl flex-shrink-0">{v.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-dark text-sm mb-1">{v.label}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{v.tagline}</p>
                    <div className="mt-2">
                      <span className="inline-flex items-center text-[11px] font-semibold text-teal-700 bg-teal/10 px-2 py-0.5 rounded-full">
                        {v.billingModel}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {v.features.slice(0, 2).map(f => (
                        <span key={f} className="text-xs bg-teal/10 text-teal-700 px-2 py-0.5 rounded-full font-medium">{f}</span>
                      ))}
                    </div>
                  </div>
                  <ArrowRight className={`w-4 h-4 transition-colors flex-shrink-0 mt-0.5 ${isActive ? 'text-teal' : 'text-slate-200 group-hover:text-teal'}`} />
                </a>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── ScudoCharge ─────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1.1fr,0.9fr] gap-8 items-stretch">
            <div className="reveal rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold text-teal uppercase tracking-widest mb-3">ScudoCharge</p>
              <h2 className="text-4xl font-bold text-dark mb-4 tracking-tight">Need QR payments as well? We build that too.</h2>
              <p className="text-slate-600 text-lg leading-relaxed mb-6">
                ScudoCharge is our separate payments product for operators who want customers to scan, pay and move quickly — with a dedicated dashboard for transactions, charger or bay performance, uptime and site revenue. If you need QR payments installed properly, we also arrange a guided setup process so everything is connected and working as it should.
              </p>
              <div className="grid sm:grid-cols-2 gap-3 mb-6">
                {[
                  'QR payments for EV charging sessions',
                  'Parking and mobility infrastructure payment flows',
                  'Dedicated operator dashboard with live stats',
                  'Promotion and offer controls for higher usage',
                  'Fast mobile journeys for scan-to-pay customers',
                  'Built for sites that need revenue clarity by location',
                  'Guided setup support available for every operator rollout',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3 border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-teal mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-500 mb-6">
                Ideal for EV stations, parking operators, forecourts, self-serve wash bays and mobility sites that want cleaner payments, better operational reporting and a proper setup process from day one.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="/scudocharge-demo/index.html" className="btn-primary inline-flex items-center gap-2">
                  View payment demo <ArrowRight className="w-4 h-4" />
                </a>
                <a href="/scudocharge-demo/dashboard/index.html" className="btn-secondary inline-flex items-center gap-2">
                  View dashboard demo
                </a>
              </div>
            </div>
            <div className="reveal rounded-3xl bg-dark p-8 border border-slate-800 shadow-2xl shadow-slate-900/20">
              <p className="text-teal text-sm font-semibold uppercase tracking-widest mb-3">Operator snapshot</p>
              <h3 className="text-white text-2xl font-bold mb-4">A cleaner payments layer for physical infrastructure</h3>
              <div className="space-y-4">
                {[
                  ['EV charging', 'Track sessions, revenue per charger, idle periods and promotion performance.'],
                  ['Parking', 'See occupancy trends, scan-to-pay behaviour and revenue by site or bay.'],
                  ['Mobility operators', 'Bring QR payments, reporting and promo controls into one place.'],
                ].map(([title, desc]) => (
                  <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-white font-semibold mb-1">{title}</p>
                    <p className="text-slate-300 text-sm leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ──────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 reveal">
            <p className="text-sm font-semibold text-teal uppercase tracking-widest mb-3">Real results</p>
            <h2 className="text-4xl font-bold text-dark tracking-tight">Loved by growing businesses</h2>
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-100 border border-slate-100 text-center transition-all duration-500">
              <div className="flex justify-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-lg sm:text-xl text-slate-700 leading-relaxed mb-8 italic">
                "{TESTIMONIALS[testimonialIdx].quote}"
              </p>
              <div>
                <p className="font-bold text-dark">{TESTIMONIALS[testimonialIdx].name}</p>
                <p className="text-slate-400 text-sm mt-0.5">{TESTIMONIALS[testimonialIdx].business}</p>
                <span className="inline-block mt-3 text-xs bg-teal/10 text-teal-700 px-3 py-1 rounded-full font-medium">
                  {TESTIMONIALS[testimonialIdx].vertical}
                </span>
              </div>
            </div>
            <div className="flex justify-center gap-2 mt-6">
              {TESTIMONIALS.map((_, i) => (
                <button key={i} onClick={() => setTestimonialIdx(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${i === testimonialIdx ? 'bg-teal w-6' : 'bg-slate-200 w-2 hover:bg-slate-300'}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pricing ────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 reveal">
            <p className="text-sm font-semibold text-teal uppercase tracking-widest mb-3">Simple pricing</p>
            <h2 className="text-4xl font-bold text-dark mb-4 tracking-tight">One monthly subscription. Tailored to your industry.</h2>
            <p className="text-slate-500 text-lg max-w-3xl mx-auto">
              Pick your industry below and see your exact monthly price. Whether you run appointments, reservations, rentals, wash bays, EV chargers or mobility sites, your subscription is matched to the workflow your business actually needs.
            </p>
          </div>

          {/* Industry picker */}
          <div className="reveal mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 text-center mb-5">Select your industry to see your price</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {VERTICAL_LIST.filter(v => v.id !== 'carwash').slice(0, 18).map(v => (
                <button
                  key={v.id}
                  onClick={() => setSelectedIndustry(v)}
                  className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-2xl border text-center transition-all duration-150 ${
                    selectedIndustry?.id === v.id
                      ? 'border-teal bg-teal/5 shadow-sm shadow-teal/10'
                      : 'border-slate-100 hover:border-teal/30 hover:bg-teal/3 bg-white'
                  }`}
                >
                  <span className="text-xl">{v.icon}</span>
                  <span className={`text-[10px] font-semibold leading-tight ${selectedIndustry?.id === v.id ? 'text-teal' : 'text-slate-500'}`}>
                    {v.label.split('&')[0].trim()}
                  </span>
                </button>
              ))}
            </div>
            {VERTICAL_LIST.filter(v => v.id !== 'carwash').length > 18 && (
              <p className="text-center text-xs text-slate-400 mt-3">+{VERTICAL_LIST.filter(v => v.id !== 'carwash').length - 18} more industries supported</p>
            )}

            <div className="mt-5 reveal rounded-2xl border border-amber-200 bg-amber-50/70 px-5 py-4 text-center">
              <p className="text-sm font-semibold text-slate-900 mb-1">Need EV charging, parking, mobility or QR-led wash bay payments?</p>
              <p className="text-sm text-slate-600 mb-3">Those operator systems are handled through ScudoCharge with a dedicated setup process, dashboard and guided installation support.</p>
              <a href="mailto:hello@scudosystems.com?subject=ScudoCharge%20operator%20setup" className="inline-flex items-center gap-2 text-sm font-semibold text-teal hover:text-teal-700">
                Contact us to get started <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Single plan card */}
          <div className="reveal">
            <div className="relative bg-teal rounded-3xl overflow-hidden shadow-2xl shadow-teal/25">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-teal to-blue-700 opacity-90" />
              <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full" />

              <div className="relative p-8 sm:p-10">
                <div className="flex flex-col md:flex-row gap-8 items-start">

                  {/* Left: price + industry */}
                  <div className="md:w-72 flex-shrink-0">
                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-2xl px-4 py-2 mb-5">
                      <span className="text-lg">{selectedIndustry.icon}</span>
                      <div>
                        <p className="text-blue-100 text-[10px] font-semibold uppercase tracking-wider">Your industry</p>
                        <p className="text-white font-bold text-sm leading-tight">{selectedIndustry.label}</p>
                      </div>
                    </div>

                    {/* Price display */}
                    <div className="mb-2">
                      {industryPricing.base ? (
                        <div>
                          <div className="flex items-end gap-1">
                            <span className="text-6xl font-black text-white tracking-tight">£{industryPricing.base}</span>
                            <span className="text-blue-200 text-lg mb-2">/mo</span>
                          </div>
                          <p className="text-blue-200 text-sm mt-1">One monthly subscription for your sector, with every core platform feature included.</p>
                        </div>
                      ) : null}
                    </div>

                    <p className="text-blue-200 text-sm mb-1">14-day free trial included</p>
                    <p className="text-blue-300/60 text-xs">All prices exclude VAT · No setup fee · Cancel anytime</p>

                    {selectedIndustry.id === 'supercar' ? (
                      <>
                        <a href="mailto:hello@scudosystems.com?subject=ScudoSystems%20luxury%20rental%20setup" className="mt-6 w-full flex items-center justify-center gap-2 bg-white text-teal font-black py-4 rounded-2xl text-base hover:bg-blue-50 transition-colors shadow-xl">
                          Contact us to get started
                          <ArrowRight className="w-5 h-5" />
                        </a>
                        <p className="text-blue-300/60 text-xs text-center mt-2">We will help scope your rental setup properly before go-live</p>
                      </>
                    ) : (
                      <>
                        <Link href="/sign-up" className="mt-6 w-full flex items-center justify-center gap-2 bg-white text-teal font-black py-4 rounded-2xl text-base hover:bg-blue-50 transition-colors shadow-xl">
                          Start 14-day free trial
                          <ArrowRight className="w-5 h-5" />
                        </Link>
                        <p className="text-blue-300/60 text-xs text-center mt-2">No credit card required to start</p>
                      </>
                    )}
                  </div>

                  {/* Right: features */}
                  <div className="flex-1">
                    <p className="text-white font-bold text-lg mb-5">Built for {selectedIndustry.label}</p>
                    <p className="text-blue-100/90 text-sm leading-relaxed mb-6 max-w-2xl">
                      Your plan includes the platform essentials plus the workflow details that matter for your sector — whether that means patient intake, vehicle turnaround, bay scheduling, guest flow, operator reporting or mobility payments.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-8">
                      <div>
                        <p className="text-blue-200 text-[11px] font-semibold uppercase tracking-[0.2em] mb-3">Industry features</p>
                        <div className="space-y-2.5">
                          {selectedIndustry.features.map(f => (
                            <div key={f} className="flex items-center gap-2.5">
                              <CheckCircle2 className="w-4 h-4 text-blue-200 flex-shrink-0" />
                              <span className="text-blue-50 text-sm">{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-blue-200 text-[11px] font-semibold uppercase tracking-[0.2em] mb-3">Core platform</p>
                        <div className="space-y-2.5">
                          {CORE_FEATURES.map(f => (
                            <div key={f} className="flex items-center gap-2.5">
                              <CheckCircle2 className="w-4 h-4 text-blue-200 flex-shrink-0" />
                              <span className="text-blue-50 text-sm">{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-slate-400 mt-6">
            Secure monthly billing · 14-day free trial · Pricing tailored for service businesses, rentals and operators
          </p>
        </div>
      </section>

      {/* ─── FAQ ────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12 reveal">
            <p className="text-sm font-semibold text-teal uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-4xl font-bold text-dark tracking-tight">Common questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="reveal bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span className="font-semibold text-dark pr-4">{faq.q}</span>
                  {openFaq === i
                    ? <ChevronUp className="w-5 h-5 text-teal flex-shrink-0" />
                    : <ChevronDown className="w-5 h-5 text-slate-300 flex-shrink-0" />
                  }
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-slate-500 text-sm leading-relaxed border-t border-slate-50 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ──────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center reveal">
          <div className="relative bg-teal rounded-3xl p-12 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-600 to-blue-800 opacity-60" />
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full animate-blob" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/5 rounded-full animate-blob" style={{ animationDelay: '2s' }} />
            <div className="relative">
              <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest mb-4">Ready to grow?</p>
              <h2 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-5 leading-tight">
                Ready to grow with less admin?
              </h2>
              <p className="text-blue-100 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
                Join businesses using ScudoSystems to manage bookings, reservations, staff flow, customer journeys and reporting from one clean system. Go live fast and stay in control as you grow.
              </p>
              <Link href="/sign-up" className="inline-flex items-center gap-2 bg-white text-teal font-bold px-8 py-4 rounded-2xl text-base hover:bg-blue-50 transition-colors shadow-xl">
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-blue-300 text-sm mt-4">No credit card required for trial · Cancel anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="bg-[#0F172A] text-slate-400 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-teal rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white text-lg">ScudoSystems</span>
              </div>
              <p className="text-sm leading-relaxed mb-5">
                Booking systems, operator dashboards and customer payment flows built to improve business performance across services, rentals and infrastructure.
              </p>
              <div className="space-y-2 text-sm">
                <a href="mailto:hello@scudosystems.com" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Mail className="w-3.5 h-3.5" /> hello@scudosystems.com
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#industries" className="hover:text-white transition-colors">Industries</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link href="/sign-up" className="hover:text-white transition-colors">Start trial</Link></li>
              </ul>
            </div>

            {/* Industries */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Industries</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#industries" className="hover:text-white transition-colors">Dental Practice</a></li>
                <li><a href="#industries" className="hover:text-white transition-colors">Beauty Salon</a></li>
                <li><a href="#industries" className="hover:text-white transition-colors">Gym & Personal Training</a></li>
                <li><a href="#industries" className="hover:text-white transition-colors">Spa & Wellness</a></li>
                <li><a href="#industries" className="hover:text-white transition-colors">Auto & MOT</a></li>
                <li><a href="#industries" className="hover:text-white transition-colors">View all 25 →</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            {mounted && <p>© 2026 ScudoSystems. All rights reserved.</p>}
            <div className="flex items-center gap-2 text-slate-500">
              <Lock className="w-3.5 h-3.5" />
              <span>Payments secured by Stripe</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
