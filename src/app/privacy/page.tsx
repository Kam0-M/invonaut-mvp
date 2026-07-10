import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — Invonaut',
  description: 'How Invonaut collects, uses, and protects your data.',
}

const EFFECTIVE_DATE = 'July 9, 2026'

type Section = { title: string; body: string | string[] }

const sections: Section[] = [
  {
    title: 'What we collect',
    body: [
      `We collect what you give us directly: your name, email address, business name, and any billing address or tax details you add to your profile. We also collect everything you create inside the platform to run your business — invoices, client and contact records, contracts and their signatures, expense records and receipts, time entries, and direct payment logs.`,
      `If you connect a bank account through Plaid, we collect account balances and transaction data from that connection — see the dedicated section below for exactly what that does and doesn't include. We also collect basic technical data automatically: IP address, browser type, device information, and which features you use, so we can keep the product working and fix problems.`,
    ],
  },
  {
    title: 'How we use your data',
    body: `Your data is used to run Invonaut on your behalf and for no other purpose. That means generating invoices and PDFs, sending automated follow-up emails, calculating your cash flow forecast, computing client risk profiles, generating AI insights, and processing your subscription payments. We do not sell your data. We do not use your financial data — invoices, payments, bank transactions, or contracts — for advertising, and we never will.`,
  },
  {
    title: 'Bank connectivity via Plaid',
    body: [
      `If you choose to connect a bank account, that connection is handled entirely through Plaid's secure Link flow. You enter your bank credentials directly with Plaid or your bank — Invonaut never sees, receives, or stores your online banking username or password.`,
      `What we do store, encrypted, is a Plaid access token (which lets us request updated data on your behalf) and the transaction data Plaid returns: dates, amounts, merchant names, and categories. This access is read-only. Neither Plaid nor Invonaut has any ability to move money, initiate a transfer, or make a payment from a connected account.`,
      `You can disconnect a bank account at any time from Cash Management. Disconnecting immediately revokes the access token and we stop receiving new data from that account. Historical transaction data already synced remains in your account unless you separately request its deletion.`,
    ],
  },
  {
    title: 'AI-powered features',
    body: [
      `Certain features — payment risk scoring, the Intelligence Feed, AI contract review, and AI expense categorisation — send relevant data (such as invoice details, contract clauses, or expense descriptions) to OpenAI's API to generate a result.`,
      `This goes through OpenAI's business API, not the consumer ChatGPT product, and is governed by OpenAI's API data usage terms: as of this writing, data sent through the API is not used to train OpenAI's models. We only send what a feature needs to function, and AI outputs are always suggestions for you to review — never automated financial or legal decisions made without your input.`,
    ],
  },
  {
    title: 'Payment data',
    body: `Stripe processes all subscription payments. Invonaut never sees, transmits, or stores your full card number, CVC, or billing credentials — that data goes directly to Stripe, which is certified to the PCI-DSS standard used across the payments industry. We store only what we need to reference your subscription: your Stripe customer ID, subscription status, and plan.`,
  },
  {
    title: 'Other service providers we use',
    body: [
      `Invonaut relies on a small, fixed set of infrastructure providers, each of which only processes the data needed to perform its function: Supabase (database, authentication, and file storage), Stripe (payment processing), Plaid (bank connectivity), OpenAI (AI features), Resend (transactional email delivery), and Vercel (hosting).`,
      `None of these providers are permitted to use your data for their own purposes. We don't add new providers that touch your data without updating this policy.`,
    ],
  },
  {
    title: 'How your data is kept secure',
    body: [
      `Your data is stored on Supabase-managed infrastructure in the United States, protected by Row Level Security enforced at the database level — every query is scoped to your authenticated account, so one user's data is never reachable through another user's session, even by mistake in application code.`,
      `All data in transit is encrypted (TLS). Passwords are hashed and never stored or visible in plain text. Invonaut is currently operated by a single founder; no other employees or contractors have access to your account data, and administrative access to infrastructure is protected by credentials that are never shared or hardcoded in the codebase.`,
    ],
  },
  {
    title: 'Data retention',
    body: [
      `We keep your data for as long as your account is active. If you delete your account, we remove your profile, login credentials, and access to the platform immediately.`,
      `Some records — invoices, payment history, and related financial data — may be retained for a limited period afterward (typically up to 7 years) where standard financial recordkeeping practice or applicable law calls for it, even though your account itself is closed. Backups that include deleted data are cycled out within 30 days.`,
    ],
  },
  {
    title: 'Your rights',
    body: [
      `You can request a full export of your data at any time by emailing us. You can correct inaccurate information directly in your account settings, or by asking us to fix it.`,
      `You can delete your account at any time from Settings, subject to the recordkeeping retention described above. If you believe we're holding inaccurate or outdated information about you, you have the right to have it corrected.`,
    ],
  },
  {
    title: 'California and other U.S. state privacy rights',
    body: [
      `If you're a California resident, the CCPA and CPRA give you additional rights: to know what personal information we collect, to request deletion, to correct inaccuracies, and to opt out of the sale or sharing of personal information. We do not sell or share personal information, so there's nothing to opt out of.`,
      `Some of the information we collect — bank account and transaction data connected via Plaid — is classified as sensitive personal information under California law. We only use it to provide the features you've connected it for, never for advertising or profiling. Residents of other U.S. states with similar privacy laws (e.g. Virginia, Colorado, Connecticut) have comparable rights, which we honour the same way. To exercise any of these rights, email us.`,
    ],
  },
  {
    title: 'International users',
    body: `Invonaut's infrastructure is located in the United States. If you access the platform from outside the U.S., your information will be transferred to, stored, and processed in the U.S., where privacy laws may differ from those in your country. By using Invonaut, you consent to this transfer.`,
  },
  {
    title: "Children's privacy",
    body: `Invonaut is a business tool intended for freelancers and business owners. It is not directed at, and we do not knowingly collect information from, anyone under 16. If we learn that we've inadvertently collected information from someone under 16, we will delete it. If you believe a minor has provided us information, please email us.`,
  },
  {
    title: 'Cookies',
    body: `Invonaut uses a small number of cookies that are strictly necessary to operate: a session cookie for authentication, and a short-lived referral cookie for the affiliate programme that records which affiliate referred a new signup. We do not use advertising cookies, third-party tracking pixels, or analytics platforms like Google Analytics.`,
  },
  {
    title: 'Emails we send',
    body: `By creating an account, you agree to receive service emails that are part of operating the platform — invoice follow-up notifications, contract reminders, billing receipts, budget alerts, and your weekly time summary. Most of these can be turned off individually in your account settings. We do not send marketing emails without your explicit consent, and we never sell your email address.`,
  },
  {
    title: 'If something goes wrong',
    body: `If we discover a security incident that compromises your personal information, we'll notify affected users without undue delay, consistent with applicable law, along with what happened and what we're doing about it.`,
  },
  {
    title: 'If Invonaut is acquired or sold',
    body: `If Invonaut is acquired, merges with another company, or sells some or all of its assets, your information may be transferred as part of that transaction. We'll notify you by email before your data becomes subject to a different privacy policy, and any new owner will remain bound by the protections in this policy for data already collected.`,
  },
  {
    title: 'Changes to this policy',
    body: `If we make meaningful changes to how we handle your data, we'll notify you by email before the change takes effect and update the effective date at the top of this page. Continuing to use the platform after that notice means you accept the update.`,
  },
  {
    title: 'Contact',
    body: `For privacy questions, to exercise any of the rights above, or to request your data, email kamo@invonaut.app. We aim to respond within 5 business days.`,
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
              Invonaut handles financial data on your behalf — bank connections, payment records, contracts. We take that seriously. This policy explains plainly what we collect, how we use it, who we share it with, and how we protect it. No legalese where plain English works.
            </p>
          </div>

          {/* Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {sections.map((s, i) => (
              <div key={i} style={{ paddingBottom: 40, marginBottom: 40, borderBottom: i < sections.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#07070F', marginBottom: 12, letterSpacing: '-.01em' }}>
                  <span style={{ color: '#CBD5E1', fontWeight: 700, marginRight: 8 }}>{i + 1}.</span>{s.title}
                </h2>
                {(Array.isArray(s.body) ? s.body : [s.body]).map((para, pi) => (
                  <p key={pi} style={{ fontSize: '.9rem', color: '#64748B', fontWeight: 500, lineHeight: 1.85, margin: pi === 0 ? 0 : '14px 0 0' }}>{para}</p>
                ))}
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
