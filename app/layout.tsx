import type { Metadata } from 'next'
import '@fontsource-variable/inter'
import '@fontsource-variable/playfair-display'
import './globals.css'
// ─── Metadata ─────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: 'ScudoSystems — Booking & Business Management',
    template: '%s | ScudoSystems',
  },
  description:
    'The booking and business management platform built to increase businesses outcomes for UK businesses. Dental practices, salons, spas, gyms, vets and more.',
  keywords: 'booking system, appointment scheduling, UK, salon software, dental booking, spa management',
  openGraph: {
    title: 'ScudoSystems — Booking & Business Management',
    description: 'Your customers book. You just show up.',
    url: 'https://www.scudosystems.com',
    siteName: 'ScudoSystems',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ScudoSystems',
    description: 'Your customers book. You just show up.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-GB">
      <body className="min-h-screen bg-cream font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
