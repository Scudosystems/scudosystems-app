import Link from 'next/link'
import { Cookie } from 'lucide-react'

export const metadata = {
  title: 'Cookie Policy — ScudoSystems',
  description: 'How ScudoSystems uses cookies and similar tracking technologies.',
}

export default function CookiesPage() {
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
              <Cookie className="w-5 h-5 text-teal" />
            </div>
            <span className="text-sm font-medium text-teal">Legal</span>
          </div>
          <h1 className="text-4xl font-bold text-dark tracking-tight mb-3">Cookie Policy</h1>
          <p className="text-dark/50 text-sm">Last updated: 1 January 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="prose prose-slate max-w-none">

          <p className="text-dark/70 text-base leading-relaxed mb-8">
            This Cookie Policy explains how ScudoSystems uses cookies and similar technologies when you visit our website or use our platform. By continuing to use ScudoSystems, you consent to our use of cookies as described below.
          </p>

          <Section title="1. What Are Cookies?">
            <p>Cookies are small text files placed on your device when you visit a website. They allow the site to recognise your device and remember certain information about your visit. Cookies cannot run programs, deliver viruses, or access your device's files.</p>
          </Section>

          <Section title="2. Types of Cookies We Use">

            <div className="mt-4 space-y-5">
              <CookieCategory
                name="Essential Cookies"
                required
                description="These cookies are strictly necessary for the platform to function. They enable core features such as authentication, session management, and security. You cannot opt out of essential cookies."
                examples={[
                  { name: 'sb-auth-token', purpose: 'Keeps you signed in to your ScudoSystems account', duration: 'Session' },
                  { name: '__session', purpose: 'Maintains your authenticated session', duration: '7 days' },
                ]}
              />

              <CookieCategory
                name="Performance & Analytics Cookies"
                description="These cookies help us understand how visitors interact with the platform so we can improve it. All data collected is aggregated and anonymous."
                examples={[
                  { name: '_vercel_analytics', purpose: 'Measures page views and performance (Vercel Analytics)', duration: '1 year' },
                ]}
              />

              <CookieCategory
                name="Functional Cookies"
                description="These cookies remember your preferences and personalise your experience, such as your selected dashboard view or notification settings."
                examples={[
                  { name: 'ss_prefs', purpose: 'Stores UI preferences (e.g., sidebar state)', duration: '1 year' },
                ]}
              />

              <CookieCategory
                name="Third-Party Cookies"
                description="Our payment processor Stripe may set cookies on checkout pages to prevent fraud and ensure secure transactions. These are governed by Stripe's own Privacy Policy."
                examples={[
                  { name: '__stripe_mid', purpose: 'Stripe fraud prevention and device fingerprinting', duration: '1 year' },
                  { name: '__stripe_sid', purpose: 'Stripe session identifier', duration: '30 minutes' },
                ]}
              />
            </div>
          </Section>

          <Section title="3. Managing Your Cookie Preferences">
            <p>You can control and manage cookies in several ways:</p>
            <ul>
              <li><strong>Browser settings</strong> — most browsers allow you to refuse cookies or delete existing ones. Refer to your browser's help documentation for instructions.</li>
              <li><strong>Opt-out tools</strong> — you can opt out of analytics cookies by enabling "Do Not Track" in your browser.</li>
              <li><strong>Third-party opt-outs</strong> — visit <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-teal hover:underline">stripe.com/privacy</a> to manage Stripe's cookies.</li>
            </ul>
            <p>Please note that disabling certain cookies may affect the functionality of the platform. Essential cookies cannot be disabled without preventing you from using ScudoSystems.</p>
          </Section>

          <Section title="4. Cookie Consent">
            <p>When you first visit our website, you will be presented with a cookie notice. By continuing to browse or clicking "Accept", you consent to our use of non-essential cookies. You may withdraw your consent at any time by adjusting your browser settings.</p>
          </Section>

          <Section title="5. Updates to This Policy">
            <p>We may update this Cookie Policy from time to time to reflect changes in technology, law, or our practices. Any significant changes will be communicated via a notice on our website or by email. The date at the top of this page indicates when the policy was last revised.</p>
          </Section>

          <Section title="6. Contact Us">
            <p>If you have any questions about our use of cookies, please contact us at <a href="mailto:hello@scudosystems.com" className="text-teal hover:underline">hello@scudosystems.com</a>.</p>
          </Section>

        </div>
      </div>

      <Footer />
    </div>
  )
}

function CookieCategory({
  name, required, description, examples,
}: {
  name: string
  required?: boolean
  description: string
  examples: { name: string; purpose: string; duration: string }[]
}) {
  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 border-b border-gray-100">
        <span className="font-semibold text-dark text-sm">{name}</span>
        {required
          ? <span className="text-xs bg-teal/10 text-teal font-medium px-2.5 py-1 rounded-full">Always active</span>
          : <span className="text-xs bg-gray-200 text-gray-500 font-medium px-2.5 py-1 rounded-full">Optional</span>
        }
      </div>
      <div className="px-5 py-4">
        <p className="text-sm text-dark/60 mb-4">{description}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-dark/40 uppercase tracking-wider">
                <th className="text-left pb-2 font-semibold pr-4">Cookie Name</th>
                <th className="text-left pb-2 font-semibold pr-4">Purpose</th>
                <th className="text-left pb-2 font-semibold">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {examples.map(e => (
                <tr key={e.name}>
                  <td className="py-2 pr-4 font-mono text-dark/70">{e.name}</td>
                  <td className="py-2 pr-4 text-dark/60">{e.purpose}</td>
                  <td className="py-2 text-dark/40 whitespace-nowrap">{e.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold text-dark tracking-tight mb-4 pb-2 border-b border-gray-100">{title}</h2>
      <div className="text-dark/70 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_p]:text-base [&_strong]:text-dark [&_strong]:font-semibold">
        {children}
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
