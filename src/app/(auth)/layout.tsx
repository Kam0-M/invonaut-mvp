import { ReactNode } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'

const VALUE_PROPS = [
  { title: 'Invoices followed up automatically',   sub: 'AI risk-scores every invoice and fires reminders at 9am daily' },
  { title: 'Contracts with built-in e-signatures', sub: 'Six templates, 19 clauses, expiry alerts — nothing slips' },
  { title: '90-day cash flow forecast',             sub: 'Know your runway before it becomes a problem' },
  { title: 'Every dollar captured',                 sub: 'Invoiced, cash, POS, mobile — all income in one place' },
]

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', position: 'relative', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..800&family=DM+Sans:opsz,wght@9..40,300..700&display=swap" rel="stylesheet" />

      {/* ── Left panel ─────────────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-5/12 xl:w-[42%] flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #002ECC 0%, #0044EE 35%, #0055FF 65%, #003DCC 100%)',
        }}
      >
        {/* Gradient mesh overlay — same as landing CTA */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: [
            'radial-gradient(ellipse 70% 70% at 110% -5%, rgba(0,196,160,0.18) 0%, transparent 55%)',
            'radial-gradient(ellipse 50% 50% at -10% 110%, rgba(255,255,255,0.05) 0%, transparent 55%)',
          ].join(', '),
        }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: '1.4rem', fontWeight: 700, color: '#fff', letterSpacing: '-.02em' }}>
              Invonaut
            </span>
          </Link>
        </div>

        {/* Headline + value props */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <p style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 18 }}>
            Autonomous Finance OS
          </p>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(1.9rem, 2.8vw, 2.6rem)', fontWeight: 800, color: '#fff', lineHeight: 1.08, letterSpacing: '-.025em', marginBottom: 40 }}>
            From contract<br />to cash.<br />
            <span style={{ opacity: .65 }}>Automated.</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 48 }}>
            {VALUE_PROPS.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <Check size={11} color="#fff" strokeWidth={3} />
                </div>
                <div>
                  <p style={{ fontSize: '.875rem', fontWeight: 700, color: '#fff', marginBottom: 3 }}>{p.title}</p>
                  <p style={{ fontSize: '.78rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{p.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 32 }}>
            {[['8', 'daily automations'], ['14 days', 'free trial'], ['$0', 'setup cost']].map(([n, l]) => (
              <div key={l}>
                <p style={{ fontFamily: "'Fraunces', serif", fontSize: '1.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-.02em', marginBottom: 2 }}>{n}</p>
                <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(255,255,255,0.35)' }}>{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <p style={{ fontSize: '.75rem', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>
            No credit card required · Cancel anytime
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Supabase', 'Stripe', 'OpenAI'].map(t => (
              <span key={t} style={{ fontSize: '.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Wave seam ──────────────────────────────────────────────────────── */}
      <div className="hidden lg:block absolute top-0 bottom-0 z-20 pointer-events-none"
        style={{ left: 'calc(42% - 28px)', width: '56px' }}>
        <svg viewBox="0 0 56 1000" xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <path fill="white" d="M56,0 L56,1000 L28,1000 C22,870 38,750 26,620 C14,490 36,370 22,240 C8,110 34,55 28,0 Z"/>
          <path fill="rgba(255,255,255,0.25)" d="M56,0 L56,1000 L38,1000 C32,880 48,730 36,590 C24,450 44,320 32,180 C20,80 44,30 38,0 Z"/>
          <path fill="rgba(255,255,255,0.07)" d="M56,0 L56,1000 L20,1000 C10,900 30,760 16,620 C2,480 26,340 12,200 C-2,90 22,40 20,0 Z"/>
        </svg>
      </div>

      {/* ── Right panel — form ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: '48px 24px', minHeight: '100vh' }}>
        {/* Mobile logo */}
        <div className="lg:hidden" style={{ marginBottom: 40, width: '100%', maxWidth: 360 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: '1.25rem', fontWeight: 700, color: '#0A0A0A' }}>Invonaut</span>
          </Link>
        </div>
        <div style={{ width: '100%', maxWidth: 360 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
