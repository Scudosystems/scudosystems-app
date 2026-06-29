import {
  ArrowRight,
  BarChart3,
  BatteryCharging,
  CheckCircle2,
  Droplets,
  Mail,
  MapPinned,
  ParkingCircle,
  QrCode,
  Shirt,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'

const CONTACT_EMAIL = 'scudosystems@protonemail.com'

const focusAreas = [
  {
    icon: Droplets,
    title: 'Car Wash Operators',
    text: 'QR payments, wash bay dashboards, customer flow tracking, promotions and cleaner reporting for self-serve and staffed sites.',
  },
  {
    icon: BatteryCharging,
    title: 'EV Charging Operators',
    text: 'Scan-to-pay journeys, charger performance visibility, site revenue tracking and operator dashboards built around uptime and usage.',
  },
  {
    icon: Shirt,
    title: 'Laundry & Launderettes',
    text: 'Simple customer payments, machine/session visibility, site-level reporting and tools to reduce cash handling and manual admin.',
  },
  {
    icon: ParkingCircle,
    title: 'Parking & Mobility Sites',
    text: 'QR payment flows, location-based reporting, usage insights and cleaner controls for car parks, private bays and mobility operators.',
  },
]

const services = [
  'QR code payment systems',
  'White-label dashboards',
  'Booking and reservation pages',
  'Operator reporting and revenue stats',
  'Customer journey design',
  'On-site setup planning',
  'Industry-specific workflows',
  'Automation and admin reduction',
]

const industries = [
  'Car washes',
  'EV charging sites',
  'Launderettes',
  'Parking operators',
  'Mobility infrastructure',
  'Forecourts',
  'Dog wash sites',
  'Service businesses',
]

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f9fc] text-slate-950">
      <section className="relative px-5 py-6 sm:px-8 lg:px-12">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.14),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(13,110,110,0.12),transparent_28%)]" />

        <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-3xl border border-white/80 bg-white/80 px-5 py-4 shadow-sm shadow-slate-200/70 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2563eb] shadow-lg shadow-blue-500/20">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight">ScudoSystems</span>
          </div>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=ScudoSystems%20project%20enquiry`}
            className="hidden rounded-2xl bg-[#0d6e6e] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-900/10 transition hover:bg-[#095c5c] sm:inline-flex"
          >
            Contact us
          </a>
        </nav>

        <div className="mx-auto grid max-w-6xl items-center gap-10 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-bold text-blue-700 shadow-sm">
              <Sparkles className="h-4 w-4" />
              Digital systems for physical businesses
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              QR payments, booking systems and dashboards built around how your site actually runs.
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              ScudoSystems helps operators modernise customer payments, bookings, reservations and reporting — without forcing the business into a complicated software setup. We work with car washes, EV charging operators, launderettes, parking and mobility sites, and other service-led businesses that need cleaner systems and better visibility.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=ScudoSystems%20project%20enquiry`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0d6e6e] px-7 py-4 text-base font-black text-white shadow-xl shadow-teal-900/15 transition hover:-translate-y-0.5 hover:bg-[#095c5c]"
              >
                Email us about a project <ArrowRight className="h-5 w-5" />
              </a>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-7 py-4 text-base font-bold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
              >
                <Mail className="h-5 w-5" /> {CONTACT_EMAIL}
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-blue-100 via-white to-teal-100 blur-2xl" />
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200/80">
              <div className="rounded-[1.5rem] bg-[#0f172a] p-5 text-white">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-300">Operator snapshot</p>
                    <h2 className="mt-2 text-2xl font-black">From scan to revenue clarity.</h2>
                  </div>
                  <QrCode className="h-10 w-10 text-blue-300" />
                </div>

                <div className="grid gap-3">
                  {[
                    ['Scan', 'Customer scans a QR code or booking link.'],
                    ['Pay or book', 'They complete the action on mobile.'],
                    ['Track', 'The operator sees sessions, revenue and activity.'],
                  ].map(([title, text]) => (
                    <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="font-bold text-white">{title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-300">{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <BarChart3 className="mb-3 h-6 w-6 text-blue-600" />
                  <p className="text-sm font-black">Live stats</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Revenue, usage and site performance.</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <ShieldCheck className="mb-3 h-6 w-6 text-[#0d6e6e]" />
                  <p className="text-sm font-black">Cleaner control</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Less manual chasing and admin.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-5 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <p className="mb-6 text-sm font-black uppercase tracking-[0.25em] text-blue-600">Where we help</p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {focusAreas.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70">
                <Icon className="mb-5 h-8 w-8 text-[#0d6e6e]" />
                <h3 className="text-lg font-black">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-600">What we build</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Simple systems for payments, bookings and operator visibility.</h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              The public platform is being simplified while we finalise the best payment setup. For now, ScudoSystems is focused on private projects, operator dashboards and practical digital workflows for businesses that need better control over customer actions and site performance.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {services.map(service => (
                <div key={service} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <span className="text-sm font-semibold text-slate-700">{service}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-[#0f172a] p-8 text-white shadow-2xl shadow-slate-300/60">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-300">Industries</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Built for operators who need customers to act fast.</h2>
            <p className="mt-5 text-base leading-8 text-slate-300">
              We can adapt the workflow to different sectors: scan-to-pay, booking, reservation, intake forms, site reporting, staff controls, reminders and customer feedback.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {industries.map(industry => (
                <span key={industry} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-100">
                  {industry}
                </span>
              ))}
              <span className="rounded-full border border-blue-300/30 bg-blue-400/10 px-4 py-2 text-sm font-bold text-blue-100">
                And much more
              </span>
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-start gap-3">
                <MapPinned className="mt-1 h-6 w-6 shrink-0 text-blue-300" />
                <div>
                  <p className="font-black">Project enquiries</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    If you run a site and want to discuss QR payments, booking pages, dashboards or a custom workflow, email us and tell us what you operate.
                  </p>
                  <a className="mt-4 inline-flex items-center gap-2 font-black text-blue-200 hover:text-white" href={`mailto:${CONTACT_EMAIL}?subject=ScudoSystems%20project%20enquiry`}>
                    {CONTACT_EMAIL} <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-5 pb-10 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 border-t border-slate-200 pt-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 ScudoSystems. All rights reserved.</p>
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold text-slate-700 hover:text-[#0d6e6e]">
            {CONTACT_EMAIL}
          </a>
        </div>
      </footer>
    </main>
  )
}
