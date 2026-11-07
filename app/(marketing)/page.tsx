'use client'

import { motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  BatteryCharging,
  Check,
  CircleDollarSign,
  Droplets,
  Mail,
  ParkingCircle,
  QrCode,
  Shirt,
  Sparkles,
  Zap,
} from 'lucide-react'

const CONTACT_EMAIL = 'scudosystems@protonemail.com'

const focusAreas = [
  { icon: Droplets, title: 'Car wash', text: 'Payments, wash-bay insights and cleaner customer journeys.' },
  { icon: BatteryCharging, title: 'EV charging', text: 'Flexible payment flows and clearer site performance.' },
  { icon: ParkingCircle, title: 'Parking', text: 'Scan-to-pay parking with live operator visibility.' },
  { icon: Shirt, title: 'Service sites', text: 'Modern booking, payment and management tools.' },
]

const capabilities = [
  'Branded QR payment pages',
  'Live operator dashboards',
  'Booking and reservation flows',
  'Revenue and activity reporting',
  'Staff controls and customer tools',
  'Custom workflows for your site',
]

const heroVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
}

export default function LandingPage() {
  return (
    <main className="scudo-marketing min-h-screen overflow-hidden bg-[#060916] text-white">
      <section className="relative isolate min-h-[760px] px-5 pb-16 pt-5 sm:px-8 lg:px-12">
        <div className="scudo-grid absolute inset-0 -z-20 opacity-70" />
        <div className="scudo-orb scudo-orb-one absolute -left-36 top-20 -z-10 h-80 w-80 rounded-full blur-3xl" />
        <div className="scudo-orb scudo-orb-two absolute right-0 top-12 -z-10 h-[28rem] w-[28rem] rounded-full blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-64 bg-gradient-to-t from-[#060916] to-transparent" />

        <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 backdrop-blur-xl sm:px-5">
          <a href="#top" className="flex items-center gap-3" aria-label="ScudoSystems home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 to-blue-600 shadow-lg shadow-cyan-500/30"><Zap className="h-5 w-5 fill-white text-white" /></span>
            <span className="text-lg font-black tracking-[-0.04em] sm:text-xl">Scudo<span className="text-cyan-300">Systems</span></span>
          </a>
          <div className="hidden items-center gap-7 text-sm font-semibold text-slate-300 md:flex"><a href="#solutions" className="transition hover:text-white">Solutions</a><a href="#platform" className="transition hover:text-white">Platform</a><a href="#contact" className="transition hover:text-white">Contact</a></div>
          <a href={`mailto:${CONTACT_EMAIL}?subject=ScudoSystems%20project%20enquiry`} className="rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-cyan-200 sm:px-5">Start a conversation</a>
        </nav>

        <div id="top" className="mx-auto grid max-w-7xl items-center gap-14 py-20 lg:grid-cols-[1.04fr_.96fr] lg:py-28">
          <motion.div initial="hidden" animate="visible" transition={{ staggerChildren: 0.11 }}>
            <motion.div variants={heroVariants} transition={{ duration: 0.55 }} className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.15em] text-cyan-200"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-70" /><span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-200" /></span>Built for real-world operations</motion.div>
            <motion.h1 variants={heroVariants} transition={{ duration: 0.65 }} className="max-w-3xl text-5xl font-black leading-[0.93] tracking-[-0.065em] sm:text-6xl lg:text-7xl">Infrastructure that makes physical businesses <span className="scudo-gradient-text">move faster.</span></motion.h1>
            <motion.p variants={heroVariants} transition={{ duration: 0.6 }} className="mt-8 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">ScudoSystems creates polished payment, booking and dashboard experiences for operators who need customers to act quickly and teams to see what is happening across their sites.</motion.p>
            <motion.div variants={heroVariants} transition={{ duration: 0.6 }} className="mt-9 flex flex-col gap-3 sm:flex-row"><a href={`mailto:${CONTACT_EMAIL}?subject=ScudoSystems%20project%20enquiry`} className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300 to-blue-400 px-6 py-4 font-black text-slate-950 shadow-xl shadow-cyan-500/20 transition hover:scale-[1.02]">Discuss your project <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></a><a href="#platform" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.035] px-6 py-4 font-bold text-white transition hover:border-cyan-200/50 hover:bg-white/[0.08]">Explore the platform</a></motion.div>
            <motion.div variants={heroVariants} transition={{ duration: 0.6 }} className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-400"><span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-cyan-300" />No app required for customers</span><span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-cyan-300" />Built around your operations</span></motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95, y: 25 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative mx-auto w-full max-w-xl">
            <div className="scudo-dashboard-glow absolute -inset-10 -z-10 rounded-[3rem] blur-3xl" />
            <div className="scudo-dashboard-card relative overflow-hidden rounded-[1.8rem] border border-white/15 bg-[#10172b]/90 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-5">
              <div className="scudo-scan-line pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-cyan-200/10 to-transparent" />
              <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-300/15"><BarChart3 className="h-5 w-5 text-cyan-200" /></span><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Live operator view</p><p className="font-black">Site performance</p></div></div><span className="rounded-full bg-emerald-300/10 px-3 py-1.5 text-xs font-bold text-emerald-200">● All systems live</span></div>
              <div className="grid grid-cols-2 gap-3"><DashboardStat title="Today’s revenue" value="£1,284" detail="+18.4% this week" accent="cyan" /><DashboardStat title="Customer actions" value="286" detail="Across 4 live sites" accent="violet" /></div>
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="flex items-center justify-between"><div><p className="text-sm font-black">Customer activity</p><p className="mt-1 text-xs text-slate-400">Live activity across connected locations</p></div><QrCode className="h-7 w-7 text-cyan-200" /></div><div className="mt-6 flex h-24 items-end gap-2">{[34, 48, 39, 63, 51, 78, 60, 87, 69, 96, 77, 91].map((height, index) => <span key={index} className="scudo-chart-bar flex-1 rounded-t-full bg-gradient-to-t from-blue-600 to-cyan-300" style={{ height: `${height}%`, animationDelay: `${index * 90}ms` }} />)}</div></div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">{['Payments live', 'Bookings synced', 'Reports ready'].map((item, index) => <div key={item} className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-3 text-xs font-bold text-slate-300"><span className={`mr-2 inline-block h-2 w-2 rounded-full ${index === 1 ? 'bg-violet-300' : 'bg-cyan-300'}`} />{item}</div>)}</div>
            </div>
            <motion.div animate={{ y: [0, -10, 0], rotate: [0, 1, 0] }} transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }} className="absolute -bottom-7 -left-6 hidden rounded-2xl border border-white/15 bg-[#17213c]/95 p-4 shadow-xl backdrop-blur-xl sm:block"><p className="text-xs font-bold uppercase tracking-[.14em] text-slate-400">Customer journey</p><p className="mt-1 text-lg font-black">Scan <span className="text-cyan-200">→</span> act <span className="text-cyan-200">→</span> track</p></motion.div>
          </motion.div>
        </div>
      </section>

      <section id="solutions" className="relative border-y border-white/10 bg-[#0b1020] px-5 py-20 sm:px-8 lg:px-12"><div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">Solutions</p><h2 className="mt-4 text-4xl font-black tracking-[-0.05em] sm:text-5xl">One clear system, designed for the way your operation works.</h2></div><div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{focusAreas.map(({ icon: Icon, title, text }, index) => <motion.article key={title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.45, delay: index * 0.06 }} whileHover={{ y: -7 }} className="group rounded-3xl border border-white/10 bg-white/[0.035] p-6 transition hover:border-cyan-200/40 hover:bg-white/[0.06]"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300/20 to-blue-500/20 text-cyan-200"><Icon className="h-6 w-6" /></span><h3 className="mt-7 text-xl font-black">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{text}</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-cyan-200">Built to adapt <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></motion.article>)}</div></div></section>

      <section id="platform" className="relative px-5 py-24 sm:px-8 lg:px-12"><div className="scudo-orb scudo-orb-three absolute right-10 top-1/2 -z-10 h-80 w-80 rounded-full blur-3xl" /><div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[.88fr_1.12fr]"><div><p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">The platform</p><h2 className="mt-4 text-4xl font-black tracking-[-0.05em] sm:text-5xl">Less friction for customers. More clarity for your team.</h2><p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">Every project is configured around the site, the staff and the customer journey. No generic portal. No unnecessary complexity.</p></div><div className="grid gap-3 sm:grid-cols-2">{capabilities.map((capability, index) => <motion.div key={capability} initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: index * 0.06 }} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200"><Check className="h-5 w-5" /></span><span className="font-bold text-slate-100">{capability}</span></motion.div>)}</div></div></section>

      <section id="contact" className="px-5 pb-6 sm:px-8 lg:px-12"><div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-cyan-200/20 bg-gradient-to-br from-[#18317b] via-[#112556] to-[#071128] px-7 py-12 sm:px-12 sm:py-16"><div className="relative z-10 grid items-end gap-8 lg:grid-cols-[1fr_auto]"><div><p className="text-sm font-black uppercase tracking-[.22em] text-cyan-200">Tell us what you operate</p><h2 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.05em] sm:text-5xl">Let’s create a cleaner way for your customers to pay, book and move.</h2><p className="mt-5 max-w-2xl text-lg leading-8 text-blue-100">Send a short outline of your site or business. We’ll come back with the most practical next step.</p></div><a href={`mailto:${CONTACT_EMAIL}?subject=ScudoSystems%20project%20enquiry`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-4 font-black text-slate-950 transition hover:bg-cyan-100">Email ScudoSystems <Mail className="h-5 w-5" /></a></div></div></section>

      <footer className="px-5 py-10 sm:px-8 lg:px-12"><div className="mx-auto flex max-w-7xl flex-col gap-4 border-t border-white/10 pt-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p>© 2026 ScudoSystems. All rights reserved.</p><a href={`mailto:${CONTACT_EMAIL}`} className="font-bold text-slate-300 transition hover:text-cyan-200">{CONTACT_EMAIL}</a></div></footer>
    </main>
  )
}

function DashboardStat({ title, value, detail, accent }: { title: string; value: string; detail: string; accent: 'cyan' | 'violet' }) {
  const isCyan = accent === 'cyan'
  return <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="flex items-center justify-between"><p className="text-xs font-bold text-slate-400">{title}</p>{isCyan ? <CircleDollarSign className="h-4 w-4 text-cyan-200" /> : <Sparkles className="h-4 w-4 text-violet-200" />}</div><p className="mt-3 text-2xl font-black tracking-tight">{value}</p><p className={`mt-1 text-xs font-bold ${isCyan ? 'text-cyan-200' : 'text-violet-200'}`}>{detail}</p></div>
}
