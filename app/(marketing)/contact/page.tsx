'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Mail, MessageSquare, Clock, CheckCircle2, ArrowRight, Building2 } from 'lucide-react'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate submission — wire up to Resend or your preferred email API
    await new Promise(r => setTimeout(r, 1200))
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl text-dark tracking-tight">
            Scudo<span className="text-teal">System</span>
          </Link>
          <Link href="/sign-up" className="btn-primary text-sm px-5 py-2.5">
            Start free trial
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-gradient-to-b from-blue-50 to-white py-16 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-teal" />
            </div>
            <span className="text-sm font-medium text-teal">Support</span>
          </div>
          <h1 className="text-4xl font-bold text-dark tracking-tight mb-3">Get in touch</h1>
          <p className="text-dark/50 text-lg max-w-xl">
            Have a question, feedback, or need help getting started? We're here.
          </p>
        </div>
      </div>

      {/* Main grid */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-5 gap-12">

          {/* Left — info */}
          <div className="lg:col-span-2 space-y-8">

            <div>
              <h2 className="text-lg font-bold text-dark tracking-tight mb-4">Contact details</h2>
              <div className="space-y-4">
                <ContactDetail
                  icon={Mail}
                  label="Email"
                  value="hello@scudosystems.com"
                  href="mailto:hello@scudosystems.com"
                />
                <ContactDetail
                  icon={Building2}
                  label="Platform"
                  value="ScudoSystems"
                  sub="scudosystems.com"
                />
                <ContactDetail
                  icon={Clock}
                  label="Response time"
                  value="Within 24 hours"
                  sub="Monday – Friday"
                />
              </div>
            </div>

            <div className="rounded-2xl bg-teal/5 border border-teal/10 p-5">
              <p className="text-sm font-semibold text-dark mb-1">Looking for quick answers?</p>
              <p className="text-sm text-dark/50 mb-4">Check our help documentation for setup guides, billing FAQs, and integration walkthroughs.</p>
              <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-teal hover:underline">
                Back to homepage <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div>
              <p className="text-xs text-dark/30 leading-relaxed">
                For legal and data protection enquiries please email hello@scudosystems.com with the subject "Legal Enquiry".
              </p>
            </div>

          </div>

          {/* Right — form */}
          <div className="lg:col-span-3">
            {sent ? (
              <div className="flex flex-col items-center justify-center text-center py-16 px-8 rounded-2xl border border-emerald-100 bg-emerald-50">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-dark mb-2">Message sent!</h3>
                <p className="text-dark/50 text-sm max-w-sm">
                  Thanks for reaching out. We'll get back to you at <strong className="text-dark">{form.email}</strong> within 24 hours.
                </p>
                <button
                  onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
                  className="mt-6 text-sm font-medium text-teal hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-dark mb-1.5">Your name</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Jane Smith"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark mb-1.5">Email address</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="jane@yourbusiness.com"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">Subject</label>
                  <select
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm text-dark focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40 transition-all"
                  >
                    <option value="" disabled>Select a topic</option>
                    <option value="general">General enquiry</option>
                    <option value="billing">Billing & subscriptions</option>
                    <option value="technical">Technical support</option>
                    <option value="onboarding">Getting started</option>
                    <option value="partnership">Partnership / press</option>
                    <option value="legal">Legal / data protection</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">Message</label>
                  <textarea
                    required
                    rows={6}
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Tell us how we can help..."
                    className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40 transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-teal text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-teal-700 active:scale-[0.98] transition-all shadow-md shadow-teal/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>Send message <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>

                <p className="text-center text-xs text-dark/30">
                  By submitting this form you agree to our{' '}
                  <Link href="/privacy" className="underline hover:text-dark">Privacy Policy</Link>.
                </p>
              </form>
            )}
          </div>

        </div>
      </div>

      <Footer />
    </div>
  )
}

function ContactDetail({
  icon: Icon, label, value, sub, href,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  href?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-dark/50" />
      </div>
      <div>
        <p className="text-xs text-dark/40 font-medium mb-0.5">{label}</p>
        {href ? (
          <a href={href} className="text-sm font-semibold text-teal hover:underline">{value}</a>
        ) : (
          <p className="text-sm font-semibold text-dark">{value}</p>
        )}
        {sub && <p className="text-xs text-dark/40 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-dark/40">
        <p>© 2026 ScudoSystems part of Ntoala G (unregistered, part of Ntoala). All rights reserved.</p>
        <div className="flex items-center gap-6">
          <Link href="/privacy" className="hover:text-dark transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-dark transition-colors">Terms</Link>
          <Link href="/cookies" className="hover:text-dark transition-colors">Cookies</Link>
          <Link href="/contact" className="hover:text-dark transition-colors">Contact</Link>
        </div>
      </div>
    </footer>
  )
}
