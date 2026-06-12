import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — Invonaut',
  description: 'The terms governing your use of the Invonaut platform.',
}

const EFFECTIVE_DATE = 'June 1, 2025'

const sections = [
  {
    title: 'The service',
    body: `Invonaut is a web-based business operations platform — invoicing, contract management, time tracking, expense tracking, cash flow forecasting, and related financial tools. By creating an account you agree to these terms. If you don't agree, don't use the service.`,
  },
  {
    title: 'Your account',
    body: `You must provide accurate information when signing up. You're responsible for keeping your login credentials secure and for everything that happens under your account. If you think someone has accessed your account without permission, email us at kamo@invonaut.app immediately. You must be at least 16 years old to use Invonaut.`,
  },
  {
    title: 'Acceptable use',
    body: `You may use Invonaut for lawful business purposes only. You may not use it to create fraudulent invoices, process transactions for goods or services you don't intend to deliver, or do anything that violates applicable law. You may not attempt to reverse-engineer, scrape, or interfere with how the platform works.`,
  },
  {
    title: 'Your data',
    body: `You own all the data you put into Invonaut — invoices, client records, contracts, expenses, and everything else. You give us a limited licence to store and process that data for the sole purpose of operating the service on your behalf. We do not claim ownership of your content and will never use it for any other purpose.`,
  },
  {
    title: 'Subscriptions and billing',
    body: `Invonaut runs on a monthly or annual subscription. Payments are charged in advance. A 14-day free trial is available on all plans — no credit card required to start. After the trial, you'll be billed at your chosen plan's rate. You can cancel at any time. Cancellation takes effect at the end of your current billing period and you keep access until then. Partial billing periods are not refunded unless required by law.`,
  },
  {
    title: 'Payment processing',
    body: `Payments are handled by Stripe. By subscribing you also agree to Stripe's terms of service, available at stripe.com. Invonaut never stores your card details — all payment data is handled directly by Stripe.`,
  },
  {
    title: 'AI-powered features',
    body: `Invonaut includes AI-powered tools — payment risk predictions, contract review suggestions, expense categorisation, and financial briefings. These are suggestions to help you make better decisions. They are not financial or legal advice. You are responsible for verifying any AI output before acting on it. We don't guarantee the accuracy of AI-generated content.`,
  },
  {
    title: 'Availability and changes',
    body: `We aim for high availability but can't guarantee uninterrupted access. We may change, suspend, or discontinue features with reasonable notice. For material changes to pricing or core features, we'll give you at least 30 days' notice by email.`,
  },
  {
    title: 'Limitation of liability',
    body: `Invonaut is provided as-is. To the maximum extent the law allows, we are not liable for indirect, incidental, or consequential damages arising from your use of the platform — including lost revenue, data loss, or missed business opportunities. Our total liability to you for any claim will not exceed what you paid us in the three months before that claim arose.`,
  },
  {
    title: 'Termination',
    body: `You can stop using Invonaut and delete your account at any time through your settings. We reserve the right to suspend or terminate accounts that violate these terms. After termination you can request an export of your data within 30 days.`,
  },
  {
    title: 'Governing law',
    body: `These terms are governed by the laws of the State of Maryland, United States. Disputes will be resolved in the courts of Maryland.`,
  },
  {
    title: 'Questions',
    body: `For questions about these terms, email us at kamo@invonaut.app.`,
  },
]

export default function TermsPage() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600..800;1,9..144,600..700&family=DM+Sans:ital,opsz,wght@0,9..40,300..700&display=swap" rel="stylesheet"/>

      <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#fff', color: '#07070F' }}>

        {/* Nav */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 50, height: 58,
          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)',
          borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center',
        }}>
          <div style={{ maxWidth: 1160, margin: '0 auto', width: '100%', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <img src="/naut-blue.svg" alt="" aria-hidden="true" style={{ width: 34, height: 34, objectFit: 'contain', flexShrink: 0 }} />
              <span style={{ fontFamily: "'Fraunces', serif", fontSize: '1.15rem', fontWeight: 700, color: '#07070F', letterSpacing: '-.02em' }}>Invonaut</span>
            </Link>
            <Link href="/" style={{ fontSize: '.85rem', fontWeight: 600, color: '#64748B', textDecoration: 'none' }}>← Back</Link>
          </div>
        </nav>

        {/* Content */}
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '72px 24px 96px' }}>

          {/* Header */}
          <div style={{ marginBottom: 56 }}>
            <p style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#0055FF', marginBottom: 16 }}>Legal</p>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(2.4rem, 5vw, 3.6rem)', fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.05, color: '#07070F', marginBottom: 16 }}>
              Terms of Service
            </h1>
            <p style={{ fontSize: '.9rem', color: '#94A3B8', fontWeight: 500 }}>
              Effective {EFFECTIVE_DATE} · Invonaut is operated by Kamo Motelle
            </p>
          </div>

          {/* Intro */}
          <div style={{ background: '#F8FAFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '24px 28px', marginBottom: 56 }}>
            <p style={{ fontSize: '.95rem', color: '#374151', fontWeight: 500, lineHeight: 1.8, margin: 0 }}>
              These terms cover your use of Invonaut. We've kept them plain and direct. If anything is unclear, email us at kamo@invonaut.app and we'll explain it properly.
            </p>
          </div>

          {/* Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {sections.map((s, i) => (
              <div key={i} style={{ paddingBottom: 40, marginBottom: 40, borderBottom: i < sections.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#07070F', marginBottom: 12, letterSpacing: '-.01em' }}>{s.title}</h2>
                <p style={{ fontSize: '.9rem', color: '#64748B', fontWeight: 500, lineHeight: 1.85, margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>

          {/* Footer links */}
          <div style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid #F1F5F9', display: 'flex', flexWrap: 'wrap', gap: 24 }}>
            <Link href="/privacy" style={{ fontSize: '.8rem', color: '#94A3B8', fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</Link>
            <Link href="/help"    style={{ fontSize: '.8rem', color: '#94A3B8', fontWeight: 600, textDecoration: 'none' }}>Help Centre</Link>
            <Link href="/pricing" style={{ fontSize: '.8rem', color: '#94A3B8', fontWeight: 600, textDecoration: 'none' }}>Pricing</Link>
            <span style={{ fontSize: '.8rem', color: '#CBD5E1', fontWeight: 500 }}>© {new Date().getFullYear()} Invonaut</span>
          </div>
        </div>

        {/* Footer band */}
        <footer style={{ background: '#030712', padding: '32px 24px' }}>
          <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="/naut-white.svg" alt="" aria-hidden="true" style={{ width: 22, height: 22, objectFit: 'contain', opacity: .7 }} />
              <span style={{ fontFamily: "'Fraunces', serif", fontSize: '.9rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Invonaut</span>
            </div>
            <p style={{ fontSize: '.75rem', color: 'rgba(255,255,255,0.2)', margin: 0 }}>From Contract to Cash. Automated.</p>
          </div>
        </footer>
      </div>
    </>
  )
}
