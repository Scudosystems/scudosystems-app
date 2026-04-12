import Link from 'next/link'
import { FileText } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service — ScudoSystems',
  description: 'The terms and conditions governing your use of the ScudoSystems platform.',
}

export default function TermsPage() {
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
              <FileText className="w-5 h-5 text-teal" />
            </div>
            <span className="text-sm font-medium text-teal">Legal</span>
          </div>
          <h1 className="text-4xl font-bold text-dark tracking-tight mb-3">Terms of Service</h1>
          <p className="text-dark/50 text-sm">Last updated: 1 January 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="prose prose-slate max-w-none">

          <p className="text-dark/70 text-base leading-relaxed mb-8">
            Please read these Terms of Service carefully before using the ScudoSystems platform. By creating an account or using our services, you agree to be bound by these terms. If you do not agree, please do not use ScudoSystems.
          </p>

          <Section title="1. Definitions">
            <ul>
              <li><strong>"ScudoSystems"</strong> means the ScudoSystems platform and its operators ("we", "us", "our").</li>
              <li><strong>"Platform"</strong> means the software-as-a-service booking and business management platform available at scudosystems.com.</li>
              <li><strong>"Subscriber"</strong> means a business or individual who has registered an account to use the Platform.</li>
              <li><strong>"End Customer"</strong> means a customer of the Subscriber who uses booking pages powered by the Platform.</li>
              <li><strong>"Content"</strong> means all data, text, images, and information uploaded to the Platform by a Subscriber.</li>
            </ul>
          </Section>

          <Section title="2. Account Registration">
            <p>To use the Platform, you must create an account and provide accurate, complete information. You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account. You must be at least 18 years old and authorised to enter into a binding contract on behalf of your business. ScudoSystems reserves the right to refuse registration at our sole discretion.</p>
          </Section>

          <Section title="3. Subscriptions and Billing">
            <p>ScudoSystems offers monthly subscription plans. By subscribing, you authorise us to charge your payment method on a recurring basis. Subscription fees are non-refundable except where required by law.</p>
            <ul>
              <li>Subscriptions renew automatically at the end of each billing period unless cancelled before the renewal date.</li>
              <li>You may cancel at any time from your account settings. Cancellation takes effect at the end of the current billing period.</li>
              <li>We reserve the right to change pricing with 30 days' written notice to your registered email address.</li>
              <li>ScudoSystems is billed as a monthly subscription with no usage-based platform charges on top of your plan.</li>
            </ul>
          </Section>

          <Section title="4. Acceptable Use">
            <p>You agree not to use the Platform to:</p>
            <ul>
              <li>Violate any applicable UK or international law or regulation.</li>
              <li>Transmit unsolicited commercial communications or spam.</li>
              <li>Collect, store, or process personal data in violation of data protection laws.</li>
              <li>Impersonate any person or entity or misrepresent your affiliation.</li>
              <li>Upload or distribute viruses, malware, or any harmful code.</li>
              <li>Attempt to gain unauthorised access to any part of the Platform or its infrastructure.</li>
              <li>Resell or sublicense access to the Platform without our written permission.</li>
            </ul>
          </Section>

          <Section title="5. Intellectual Property">
            <p>ScudoSystems and its licensors own all intellectual property rights in the Platform, including software, design, trademarks, and documentation. We grant you a limited, non-exclusive, non-transferable licence to use the Platform solely for your internal business purposes during your subscription period. You retain ownership of all Content you upload to the Platform.</p>
          </Section>

          <Section title="6. Data and Privacy">
            <p>Your use of the Platform is governed by our <Link href="/privacy" className="text-teal hover:underline">Privacy Policy</Link>. As a Subscriber, you act as a data controller for your End Customers' personal data. You are responsible for obtaining any necessary consents and complying with all applicable data protection laws, including the UK GDPR.</p>
          </Section>

          <Section title="7. Third-Party Services">
            <p>The Platform integrates with third-party services including Stripe (payments), Supabase (database), and Resend (email). Your use of these services is subject to their respective terms of service. ScudoSystems is not responsible for the availability, accuracy, or conduct of third-party services.</p>
          </Section>

          <Section title="8. Service Availability">
            <p>We aim to maintain Platform availability of 99.5% per month, excluding scheduled maintenance. We do not guarantee uninterrupted access and are not liable for downtime beyond our reasonable control. We will endeavour to notify you of planned maintenance in advance.</p>
          </Section>

          <Section title="9. Limitation of Liability">
            <p>To the maximum extent permitted by applicable law, ScudoSystems' total liability to you for any claims arising from these Terms or your use of the Platform shall not exceed the total fees paid by you in the 12 months preceding the claim. We are not liable for any indirect, incidental, consequential, or punitive damages, including loss of profit, data, or business opportunity.</p>
            <p>Nothing in these Terms limits liability for death or personal injury caused by negligence, fraud, or any other liability that cannot be excluded under English law.</p>
          </Section>

          <Section title="10. Termination">
            <p>Either party may terminate the agreement at any time. We may suspend or terminate your account immediately if you breach these Terms, fail to pay fees, or if continued provision would expose us to legal or regulatory risk. Upon termination, your access to the Platform will cease and we will retain your data in accordance with our Privacy Policy before deletion.</p>
          </Section>

          <Section title="11. Governing Law">
            <p>These Terms are governed by the laws of England and Wales. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
          </Section>

          <Section title="12. Changes to These Terms">
            <p>We may update these Terms from time to time. We will notify you of material changes by email at least 30 days before they take effect. Continued use of the Platform after changes constitutes acceptance of the revised Terms.</p>
          </Section>

          <Section title="13. Contact">
            <p>For questions about these Terms, contact us at <a href="mailto:hello@scudosystems.com" className="text-teal hover:underline">hello@scudosystems.com</a>.</p>
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
