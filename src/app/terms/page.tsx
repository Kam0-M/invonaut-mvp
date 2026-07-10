import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — Invonaut',
  description: 'The terms governing your use of the Invonaut platform.',
}

const EFFECTIVE_DATE = 'July 9, 2026'

type Section = { title: string; body: string | string[] }

const sections: Section[] = [
  {
    title: 'The service',
    body: `Invonaut is a web-based business operations platform providing invoicing, direct payment logging, contract management, time tracking, expense tracking, cash flow forecasting, bank connectivity, and related financial tools for freelancers and small businesses. By creating an account, you agree to these terms. If you don't agree, please don't use the service.`,
  },
  {
    title: 'Eligibility and your account',
    body: [
      `You must be at least 16 years old and able to form a legally binding contract to use Invonaut. If you're using Invonaut on behalf of a business, you're confirming you have the authority to bind that business to these terms.`,
      `You must provide accurate information when signing up and keep it up to date. You're responsible for keeping your login credentials secure and for all activity that happens under your account. If you believe someone has accessed your account without permission, email us at kamo@invonaut.app immediately.`,
    ],
  },
  {
    title: 'Acceptable use',
    body: [
      `You may use Invonaut for lawful business purposes only. You may not use it to create fraudulent invoices, bill for goods or services you don't intend to deliver, launder money, or facilitate any illegal transaction.`,
      `You may not attempt to reverse-engineer, scrape, or interfere with how the platform works, attempt to bypass subscription tier limits through technical means, or use the AI features to generate content that's fraudulent, deceptive, or harmful to a third party.`,
    ],
  },
  {
    title: 'Your data and content',
    body: [
      `You own all the data you put into Invonaut — invoices, client records, contracts, expenses, time entries, and everything else. You grant us a limited licence to store, process, and display that data for the sole purpose of operating the service on your behalf. We don't claim ownership of your content and won't use it for any other purpose.`,
      `We may use aggregated, de-identified data (data that no longer identifies you or any individual) to understand how the product is used and to improve it. This never includes your actual invoices, client details, or financial figures in identifiable form.`,
    ],
  },
  {
    title: 'AI-powered features',
    body: `Invonaut includes AI-powered tools — payment risk predictions, the Intelligence Feed, contract review suggestions, and expense categorisation. These are suggestions to help you make faster decisions, not financial, legal, tax, or professional advice. AI-generated output can be incomplete or wrong. You're responsible for reviewing and verifying any AI output before relying on it, and we're not liable for decisions made based on it.`,
  },
  {
    title: 'Subscriptions, billing, and free trial',
    body: [
      `Invonaut runs on a monthly or annual subscription, charged in advance. A 14-day free trial is available on all plans with no credit card required to start. After the trial, you'll be billed at your chosen plan's rate unless you cancel first.`,
      `Subscriptions renew automatically at the end of each billing period unless cancelled beforehand. If we change subscription pricing, we'll give existing subscribers at least 30 days' notice by email before the new price applies to their next renewal. Prices shown exclude any applicable taxes, which are your responsibility.`,
    ],
  },
  {
    title: 'Payment processing',
    body: `Payments are handled by Stripe. By subscribing, you also agree to Stripe's terms of service, available at stripe.com. Invonaut never stores your card details — all payment data is handled directly by Stripe.`,
  },
  {
    title: 'Refunds and cancellation',
    body: [
      `You can cancel your subscription at any time from Billing. Cancellation takes effect at the end of your current billing period, and you keep access until then.`,
      `We don't offer refunds for partial billing periods or unused time, except where required by law. If you believe you were billed in error, email us and we'll look into it.`,
    ],
  },
  {
    title: 'Intellectual property',
    body: `Invonaut, its logo, brand, software, and underlying technology are owned by Invonaut and protected by intellectual property law. These terms grant you a limited, non-exclusive, non-transferable licence to use the platform for your own business purposes — they don't give you any ownership stake in Invonaut itself, and you may not copy, resell, or create derivative works from the platform.`,
  },
  {
    title: 'Third-party services',
    body: `Invonaut integrates with third-party services — Plaid for bank connectivity, OpenAI for AI features, Stripe for payments, Resend for email delivery, and Supabase and Vercel for infrastructure. Your use of features built on these services is also subject to the relevant provider's own terms. We're not responsible for outages, errors, or changes made by these providers that are outside our control, though we'll do what we reasonably can to minimise any disruption to you.`,
  },
  {
    title: 'Availability and changes',
    body: `We aim for high availability but can't guarantee uninterrupted or error-free access. We may change, add, suspend, or discontinue features with reasonable notice. For material changes to pricing or core features you're actively using, we'll give at least 30 days' notice by email.`,
  },
  {
    title: 'Disclaimer of warranties',
    body: `Invonaut is provided "as is" and "as available," without warranties of any kind, whether express or implied, including any implied warranty of merchantability, fitness for a particular purpose, or non-infringement. We don't warrant that the service will be uninterrupted, timely, secure, or error-free, or that any AI-generated output will be accurate.`,
  },
  {
    title: 'Limitation of liability',
    body: `To the maximum extent the law allows, Invonaut is not liable for indirect, incidental, special, consequential, or punitive damages arising from your use of the platform — including lost revenue, lost profits, data loss, or missed business opportunities — even if we've been advised of the possibility of such damages. Our total liability to you for any claim arising from these terms or your use of Invonaut will not exceed the amount you paid us in the three months before the claim arose.`,
  },
  {
    title: 'Indemnification',
    body: `You agree to indemnify and hold Invonaut harmless from any claim, loss, or expense (including reasonable legal fees) arising from your use of the platform, your violation of these terms, or your violation of any law or the rights of a third party.`,
  },
  {
    title: 'Termination',
    body: [
      `You can stop using Invonaut and delete your account at any time through Settings. We reserve the right to suspend or terminate accounts that violate these terms, with notice where practical.`,
      `After termination, you can request an export of your data within 30 days, after which it may be permanently deleted subject to the retention periods described in our Privacy Policy. Termination doesn't entitle you to a refund for the remainder of any current billing period, except where required by law.`,
    ],
  },
  {
    title: 'Dispute resolution and arbitration',
    body: [
      `Most concerns can be resolved by emailing us directly, and we'd genuinely rather sort things out that way first. If a dispute can't be resolved informally within 30 days, you and Invonaut agree to resolve it through binding individual arbitration administered by the American Arbitration Association under its Consumer Arbitration Rules, rather than in court.`,
      `You and Invonaut each waive the right to a jury trial and to participate in a class action or class-wide arbitration. This doesn't apply to small claims court cases or to either party seeking injunctive relief for intellectual property infringement or unauthorised access to the platform.`,
      `You can opt out of this arbitration agreement by emailing kamo@invonaut.app within 30 days of first creating your account, stating clearly that you wish to opt out. If you opt out, disputes will instead be resolved in the courts described below.`,
    ],
  },
  {
    title: 'Governing law',
    body: `These terms are governed by the laws of the State of Maryland, United States, without regard to its conflict-of-law principles. Subject to the arbitration agreement above, any dispute not subject to arbitration will be resolved exclusively in the state or federal courts located in Maryland.`,
  },
  {
    title: 'General provisions',
    body: [
      `These terms, together with our Privacy Policy, make up the entire agreement between you and Invonaut regarding your use of the service. If any provision is found unenforceable, the rest of these terms remain in effect. Our failure to enforce a provision isn't a waiver of our right to do so later.`,
      `You may not assign these terms without our written consent. We may assign these terms in connection with a merger, acquisition, or sale of assets. Neither party is liable for delays or failures caused by events beyond reasonable control, including an outage at an infrastructure provider we rely on.`,
    ],
  },
  {
    title: 'Changes to these terms',
    body: `We may update these terms as the platform evolves. If we make a material change, we'll notify you by email at least 30 days before it takes effect and update the effective date at the top of this page. Continuing to use Invonaut after that notice means you accept the updated terms.`,
  },
  {
    title: 'Questions',
    body: `For questions about these terms, email kamo@invonaut.app.`,
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
              These terms cover your use of Invonaut, including billing, acceptable use, and how disputes get resolved. We've kept them plain and direct wherever we could. If anything is unclear, email us at kamo@invonaut.app and we'll explain it properly.
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
