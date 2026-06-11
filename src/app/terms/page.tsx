import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service — Invonaut',
  description: 'The terms governing your use of the Invonaut platform.',
}

const EFFECTIVE_DATE = 'June 1, 2025'

const sections = [
  {
    title: 'The service',
    body: `Invonaut is a web-based business operations platform that provides invoicing, contract management, 
    time tracking, expense tracking, cash flow forecasting, and related financial tools. By creating an 
    account you agree to these terms. If you do not agree, do not use the service.`,
  },
  {
    title: 'Your account',
    body: `You must provide accurate information when creating an account. You are responsible for 
    maintaining the security of your login credentials and for all activity that occurs under your account. 
    You must notify us immediately at kamo@invonaut.app if you suspect unauthorised access. You must be 
    at least 16 years old to use Invonaut.`,
  },
  {
    title: 'Acceptable use',
    body: `You may use Invonaut only for lawful business purposes. You may not use the platform to 
    process fraudulent transactions, create invoices for goods or services you do not intend to deliver, 
    or engage in any activity that violates applicable law. You may not attempt to reverse-engineer, 
    scrape, or interfere with the platform's operation.`,
  },
  {
    title: 'Your data',
    body: `You retain ownership of all data you upload to Invonaut — invoices, client information, 
    contracts, expenses, and all other content. You grant us a limited licence to store and process 
    that data solely to operate the service on your behalf. We do not claim ownership of your data and 
    will not use it for any purpose beyond operating and improving the platform.`,
  },
  {
    title: 'Subscriptions and billing',
    body: `Invonaut operates on a monthly or annual subscription model. Subscriptions are billed in advance. 
    A 14-day free trial is available on all plans with no credit card required to start. After the trial, 
    you will be charged at the rate of your chosen plan. You may cancel at any time — cancellation takes 
    effect at the end of your current billing period and you retain access until then. Refunds are not 
    provided for partial billing periods except where required by law.`,
  },
  {
    title: 'Payments via Stripe',
    body: `Payment processing is handled by Stripe. By subscribing, you also agree to Stripe's terms of 
    service. Invonaut does not store your payment card details. Stripe is PCI-DSS compliant.`,
  },
  {
    title: 'AI features',
    body: `Invonaut includes AI-powered features (payment risk predictions, contract review suggestions, 
    expense categorisation, financial briefings) powered by OpenAI. These features provide suggestions, 
    not financial or legal advice. You are responsible for verifying any AI-generated output before acting 
    on it. We do not guarantee the accuracy of AI-generated content.`,
  },
  {
    title: 'Availability and changes',
    body: `We aim to maintain high uptime but do not guarantee uninterrupted access. We may modify, 
    suspend, or discontinue features with reasonable notice. We will notify subscribers of material 
    changes to the service or pricing with at least 30 days' advance notice by email.`,
  },
  {
    title: 'Limitation of liability',
    body: `Invonaut is provided "as is." To the maximum extent permitted by law, we are not liable for 
    any indirect, incidental, or consequential damages arising from your use of the platform — including 
    loss of revenue, data, or business opportunities. Our total liability to you for any claim shall not 
    exceed the amount you paid us in the three months preceding the claim.`,
  },
  {
    title: 'Termination',
    body: `Either party may terminate the relationship at any time. You may delete your account at any 
    time in account settings. We reserve the right to suspend or terminate accounts that violate these 
    terms. Upon termination, you may request an export of your data within 30 days.`,
  },
  {
    title: 'Governing law',
    body: `These terms are governed by the laws of the State of Maryland, United States, without regard 
    to conflict of law principles. Disputes shall be resolved in the courts of Maryland.`,
  },
  {
    title: 'Contact',
    body: `For questions about these terms, contact us at kamo@invonaut.app.`,
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 sticky top-0 z-10 bg-white/95 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/invonaut-logo.png" alt="Invonaut" className="w-7 h-7 rounded-full" />
            <span className="text-base font-black tracking-tight text-gray-900">Invonaut</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />Back
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <p className="text-xs font-bold text-[#0055FF] uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-4" style={{ fontFamily: "'Fraunces', serif", letterSpacing: '-.03em' }}>
            Terms of Service
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Effective date: {EFFECTIVE_DATE} · Invonaut is operated by Kamo Motelle.
          </p>
        </div>

        {/* Intro */}
        <div className="bg-[#F8FAFF] border border-gray-100 rounded-2xl p-6 mb-10">
          <p className="text-sm text-gray-700 font-medium leading-relaxed">
            These terms govern your use of Invonaut. By using the platform you agree to them. 
            We've kept them as plain and direct as possible. If anything is unclear, email us at 
            kamo@invonaut.app.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map((s, i) => (
            <div key={i} className="border-b border-gray-50 pb-10 last:border-0 last:pb-0">
              <h2 className="text-base font-black text-gray-900 mb-3">{s.title}</h2>
              <p className="text-sm text-gray-600 font-medium leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        {/* Footer links */}
        <div className="mt-16 pt-8 border-t border-gray-100 flex flex-wrap gap-6 text-xs text-gray-400 font-medium">
          <Link href="/privacy" className="hover:text-gray-700 transition-colors">Privacy Policy</Link>
          <Link href="/help"    className="hover:text-gray-700 transition-colors">Help Center</Link>
          <Link href="/pricing" className="hover:text-gray-700 transition-colors">Pricing</Link>
          <span>© {new Date().getFullYear()} Invonaut</span>
        </div>
      </div>
    </div>
  )
}
