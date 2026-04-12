import Link from 'next/link'
import { Shield } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy — ScudoSystems',
  description: 'How ScudoSystems collects, uses, and protects your personal data.',
}

export default function PrivacyPage() {
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
              <Shield className="w-5 h-5 text-teal" />
            </div>
            <span className="text-sm font-medium text-teal">Legal</span>
          </div>
          <h1 className="text-4xl font-bold text-dark tracking-tight mb-3">Privacy Policy</h1>
          <p className="text-dark/50 text-sm">Last updated: 1 January 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="prose prose-slate max-w-none">

          <p className="text-dark/70 text-base leading-relaxed mb-8">
            ScudoSystems ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform at scudosystems.com and any related services.
          </p>

          <Section title="1. Who We Are">
            <p>ScudoSystems is an online booking and business management platform. Our contact details are available at <Link href="/contact" className="text-teal hover:underline">scudosystems.com/contact</Link>. We are the data controller for information collected through our platform.</p>
          </Section>

          <Section title="2. Information We Collect">
            <p>We collect the following categories of information:</p>
            <ul>
              <li><strong>Account information</strong> — your name, email address, and business details when you sign up.</li>
              <li><strong>Business data</strong> — services, staff, schedules, and bookings you create on the platform.</li>
              <li><strong>Customer data</strong> — names, phone numbers, and email addresses of your clients submitted through booking pages.</li>
              <li><strong>Payment information</strong> — billing details processed securely via Stripe. We do not store card numbers on our servers.</li>
              <li><strong>Usage data</strong> — pages visited, features used, browser type, and IP address collected via standard web analytics.</li>
              <li><strong>Communications</strong> — messages you send to our support team.</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Information">
            <ul>
              <li>Provide, operate, and maintain the ScudoSystems platform.</li>
              <li>Process bookings and payments on behalf of your business.</li>
              <li>Send transactional emails (booking confirmations, reminders, receipts).</li>
              <li>Respond to support requests and account queries.</li>
              <li>Improve and develop new platform features.</li>
              <li>Comply with our legal obligations under UK law.</li>
            </ul>
          </Section>

          <Section title="4. Legal Basis for Processing">
            <p>Under the UK GDPR, we process your personal data on the following legal bases:</p>
            <ul>
              <li><strong>Contract performance</strong> — to provide the service you have subscribed to.</li>
              <li><strong>Legitimate interests</strong> — to improve our product and prevent fraud.</li>
              <li><strong>Legal obligation</strong> — to comply with applicable UK laws and regulations.</li>
              <li><strong>Consent</strong> — for marketing communications, where you have opted in.</li>
            </ul>
          </Section>

          <Section title="5. Sharing Your Information">
            <p>We do not sell your personal data. We share information only with trusted third-party service providers who process data on our behalf:</p>
            <ul>
              <li><strong>Supabase</strong> — database and authentication hosting.</li>
              <li><strong>Stripe</strong> — subscription billing and secure payment processing for your ScudoSystems plan.</li>
              <li><strong>Resend</strong> — transactional email delivery.</li>
              <li><strong>Vercel</strong> — application hosting and edge network.</li>
            </ul>
            <p>Each provider is bound by data processing agreements and operates under appropriate safeguards.</p>
          </Section>

          <Section title="6. Data Retention">
            <p>We retain your account data for as long as your account is active and for up to 7 years after account closure to comply with UK tax and accounting regulations. Booking and customer data may be retained for up to 3 years. You may request deletion of your data at any time (see Your Rights below).</p>
          </Section>

          <Section title="7. Your Rights">
            <p>Under UK GDPR, you have the right to:</p>
            <ul>
              <li><strong>Access</strong> — request a copy of the personal data we hold about you.</li>
              <li><strong>Rectification</strong> — request correction of inaccurate or incomplete data.</li>
              <li><strong>Erasure</strong> — request deletion of your data where there is no compelling reason to continue processing.</li>
              <li><strong>Restriction</strong> — request we limit processing of your data in certain circumstances.</li>
              <li><strong>Portability</strong> — receive your data in a structured, machine-readable format.</li>
              <li><strong>Objection</strong> — object to processing based on legitimate interests.</li>
            </ul>
            <p>To exercise any of these rights, contact us at <a href="mailto:hello@scudosystems.com" className="text-teal hover:underline">hello@scudosystems.com</a>. We will respond within 30 days.</p>
          </Section>

          <Section title="8. Cookies">
            <p>We use cookies and similar technologies to keep you signed in and understand how the platform is used. See our <Link href="/cookies" className="text-teal hover:underline">Cookie Policy</Link> for full details.</p>
          </Section>

          <Section title="9. Data Security">
            <p>We implement industry-standard security measures including encryption in transit (TLS), encryption at rest, access controls, and regular security reviews. No method of transmission over the internet is 100% secure; however, we strive to protect your data using commercially acceptable means.</p>
          </Section>

          <Section title="10. International Transfers">
            <p>Our service providers may process data outside the UK. Where this occurs, we ensure appropriate safeguards are in place, such as UK adequacy decisions or Standard Contractual Clauses.</p>
          </Section>

          <Section title="11. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by email or via a notice on the platform. Continued use of ScudoSystems after changes constitutes acceptance of the revised policy.</p>
          </Section>

          <Section title="12. Contact Us">
            <p>For privacy-related queries or to exercise your rights, contact us at:</p>
            <p><strong>ScudoSystems</strong><br />
            Email: <a href="mailto:hello@scudosystems.com" className="text-teal hover:underline">hello@scudosystems.com</a></p>
            <p>You also have the right to lodge a complaint with the Information Commissioner's Office (ICO) at <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-teal hover:underline">ico.org.uk</a>.</p>
          </Section>

        </div>
      </div>

      <Footer />
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
