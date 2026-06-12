import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — Invonaut',
  description: 'How Invonaut collects, uses, and protects your data.',
}

const EFFECTIVE_DATE = 'June 1, 2025'

const sections = [
  {
    title: 'What we collect',
    body: `We collect information you provide when you create an account — your name, email address, and business name. We also collect the data you create inside the platform: invoices, client records, contracts, expenses, time entries, and payment records. Beyond that, we collect basic usage data to keep the product working well — things like which features you use and where errors occur.`,
  },
  {
    title: 'How we use your data',
    body: `Your data is used to run Invonaut on your behalf. That means sending follow-up emails for overdue invoices, calculating your cash forecast, generating AI insights, and delivering the automated processes the platform runs for you. We do not sell your data to anyone. We do not use your financial data for advertising, now or ever.`,
  },
  {
    title: 'Third-party services we use',
    body: `Invonaut uses a small number of trusted services to operate: Supabase for your database and login security, Stripe for payment processing, Resend for sending emails, OpenAI for AI-powered features, Plaid for optional bank connectivity, and Vercel for hosting. Each of these services only processes your data to the extent needed to do their job. Their privacy policies are available on their respective websites.`,
  },
  {
    title: 'How your data is kept secure',
    body: `Your data is stored in the United States on Supabase-managed infrastructure. Every piece of data is protected at the individual account level — only your authenticated account can access it. Passwords are never stored in plain text. Everything travels over encrypted connections. Stripe handles all payment card data and Invonaut never sees or stores your card details directly.`,
  },
  {
    title: 'Your rights',
    body: `You can request a full export of your data at any time by emailing us. You can delete your account at any time through your settings — this removes your profile and access credentials. Some financial records may be held for a short period to meet standard recordkeeping requirements before permanent deletion. If any information we hold about you is inaccurate, you have the right to have it corrected.`,
  },
  {
    title: 'Cookies',
    body: `Invonaut uses a small number of cookies that are strictly necessary to operate — session authentication and referral tracking for the affiliate programme. We do not use advertising cookies, third-party tracking pixels, or analytics from platforms like Google Analytics.`,
  },
  {
    title: 'Emails we send',
    body: `By creating an account, you agree to receive emails that are part of operating the service — things like invoice follow-up notifications, contract reminders, billing receipts, and your weekly summary. Most of these can be turned off in your account settings. We don't send marketing emails without explicit consent.`,
  },
  {
    title: 'Changes to this policy',
    body: `If we make meaningful changes to how we handle your data, we will let you know by email before the change takes effect and update the date at the top of this page. Continuing to use the platform after we've notified you means you accept the updated terms.`,
  },
  {
    title: 'Contact',
    body: `For any privacy questions or to request your data, email us at kamo@invonaut.app. We aim to respond within 5 business days.`,
  },
]

export default function PrivacyPage() {
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
              Privacy Policy
            </h1>
            <p style={{ fontSize: '.9rem', color: '#94A3B8', fontWeight: 500 }}>
              Effective {EFFECTIVE_DATE} · Invonaut is operated by Kamo Motelle
            </p>
          </div>

          {/* Intro */}
          <div style={{ background: '#F8FAFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '24px 28px', marginBottom: 56 }}>
            <p style={{ fontSize: '.95rem', color: '#374151', fontWeight: 500, lineHeight: 1.8, margin: 0 }}>
              Invonaut handles financial data on your behalf. We take that seriously. This policy explains plainly what we collect, how we use it, and how we protect it. No legalese where plain English works.
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
            <Link href="/terms"   style={{ fontSize: '.8rem', color: '#94A3B8', fontWeight: 600, textDecoration: 'none' }}>Terms of Service</Link>
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
