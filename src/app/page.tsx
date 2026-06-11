// src/app/page.tsx
// Server component wrapper — imports the fully animated client landing page.
import LandingPageClient from '@/components/landing/landing-page-client'

export const metadata = {
  title: 'Invonaut — From Contract to Cash. Automated.',
  description: 'The autonomous finance OS for small businesses and independent professionals. Invoices, contracts, time tracking, direct payments, expenses, and 90-day cash flow forecasting — all in one platform.',
  keywords: 'invoicing software, business finance, invoice automation, cash flow forecast, small business, contract management, time tracking, expense tracking',
  openGraph: {
    title: 'Invonaut — From Contract to Cash. Automated.',
    description: 'Capture every dollar, automate collections, and forecast your runway. The complete financial OS for small businesses.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Invonaut — From Contract to Cash. Automated.',
  },
}

export default function LandingPage() {
  return <LandingPageClient />
}
