'use client'
// src/components/vs/comparison-page.tsx
// Shared component for all Invonaut vs [Competitor] pages
// Honest, specific, conversion-focused

import Link from 'next/link'
import { Check, X, Minus, ArrowRight, Zap } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ComparisonFeature {
  name:        string
  category:    string
  inv:         boolean | 'partial'
  comp:        boolean | 'partial'
  invNote?:    string
  compNote?:   string
}

export interface ComparisonConfig {
  competitor:       string
  competitorSlug:   string   // 'wave' | 'freshbooks' | 'bonsai'
  whatTheyAre:      string   // honest one-liner about the competitor
  whatWeAre:        string   // honest one-liner about Invonaut
  intro:            string   // 2–3 sentence honest framing
  features:         ComparisonFeature[]
  theyWinAt:        { label: string; detail: string }[]
  weWinAt:          { label: string; detail: string }[]
  pricing: {
    compLabel:  string   // e.g. "Wave — Free / $16–$55/mo"
    invLabel:   string   // e.g. "Invonaut — $29–$109/mo"
    pricingNote: string
  }
  verdict: string
}

// ─── CSS (local to comparison pages) ─────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,800;1,9..144,700&family=JetBrains+Mono:wght@400;500;700&display=swap');
  .vs-body   { font-family:'DM Sans',sans-serif; background:#fff; color:#07070F; -webkit-font-smoothing:antialiased; }
  .vs-display { font-family:'Fraunces',serif; font-optical-sizing:auto; }
  .vs-mono    { font-family:'JetBrains Mono',monospace; font-feature-settings:'tnum'; }
  :root {
    --ink:    #07070F;
    --blue:   #0055FF;
    --teal:   #00C4A0;
    --orange: #FF6B35;
    --mid:    #64748B;
    --faint:  #94A3B8;
    --rule:   #E2E8F0;
    --surf:   #F8FAFF;
  }
  .vs-check-inv  { color:#0055FF; }
  .vs-check-comp { color:#64748B; }
  .vs-row-hover:hover { background:var(--surf); }
  @media(max-width:720px) {
    .vs-hero-grid  { grid-template-columns:1fr !important; }
    .vs-pros-grid  { grid-template-columns:1fr !important; }
    .vs-footer-grid { grid-template-columns:1fr 1fr !important; }
    .vs-nav-back-text { display:none !important; }
    .vs-nav-cta { padding:8px 14px !important; font-size:.8rem !important; }
    .vs-nav-right { gap:8px !important; }
  }
  @media(max-width:480px) {
    .vs-nav-back-icon { display:none !important; }
  }
`

// ─── Sub-components ───────────────────────────────────────────────────────────
function FeatureDot({ val }: { val: boolean | 'partial' }) {
  if (val === true)      return <Check  size={16} strokeWidth={2.5} style={{ color: '#0055FF' }} />
  if (val === 'partial') return <Minus  size={16} strokeWidth={2.5} style={{ color: '#F59E0B' }} />
  return                        <X      size={16} strokeWidth={2.5} style={{ color: '#CBD5E1' }} />
}

function FeatureLabel({ val, note }: { val: boolean | 'partial'; note?: string }) {
  const color = val === true ? '#0055FF' : val === 'partial' ? '#F59E0B' : '#94A3B8'
  const text  = val === true ? (note || 'Yes') : val === 'partial' ? (note || 'Partial') : (note || '—')
  return (
    <span style={{ fontSize: '.78rem', color, fontWeight: val === true ? 600 : 400, lineHeight: 1.5 }}>
      {text}
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ComparisonPage({ config }: { config: ComparisonConfig }) {
  // Group features by category
  const categories = Array.from(new Set(config.features.map(f => f.category)))

  return (
    <div className="vs-body">
      <style>{CSS}</style>

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50, height: 56,
        background: 'rgba(255,255,255,0.97)', borderBottom: '1px solid var(--rule)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', width: '100%', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <img src="/naut-blue.svg" alt="" aria-hidden="true" style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }} />
            <span className="vs-display" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.02em' }}>Invonaut</span>
          </Link>
          <div className="vs-nav-right" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link href="/" style={{ color: 'var(--mid)', fontWeight: 500, fontSize: '.85rem', textDecoration: 'none', display:'inline-flex', alignItems:'center', gap:4 }}>
              <span className="vs-nav-back-icon">←</span>
              <span className="vs-nav-back-text">Back to home</span>
            </Link>
            <Link href="/signup" className="vs-nav-cta" style={{ background: 'var(--blue)', color: '#fff', padding: '9px 20px', borderRadius: 9, fontWeight: 700, fontSize: '.875rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Start free <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: '72px 24px 64px', background: '#fff', borderBottom: '1px solid var(--rule)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <p style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--faint)', marginBottom: 20 }}>
            Comparison
          </p>
          <h1 className="vs-display" style={{ fontSize: 'clamp(2.4rem,5vw,4rem)', fontWeight: 800, letterSpacing: '-.025em', lineHeight: 1.06, color: 'var(--ink)', marginBottom: 32, maxWidth: 640 }}>
            Invonaut vs {config.competitor}
          </h1>
          <div className="vs-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '1.05rem', color: 'var(--mid)', lineHeight: 1.8, marginBottom: 28 }}>
                {config.intro}
              </p>
              <Link href="/signup" style={{ background: 'var(--blue)', color: '#fff', padding: '13px 28px', borderRadius: 10, fontWeight: 700, fontSize: '.95rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Try Invonaut free — 14 days <ArrowRight size={16} />
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ padding: '20px 20px', borderRadius: 12, border: '1px solid var(--rule)', background: '#fff' }}>
                <p style={{ fontSize: '.67rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--faint)', marginBottom: 10 }}>
                  {config.competitor}
                </p>
                <p style={{ fontSize: '.875rem', color: 'var(--mid)', lineHeight: 1.7 }}>{config.whatTheyAre}</p>
              </div>
              <div style={{ padding: '20px 20px', borderRadius: 12, border: '2px solid rgba(0,85,255,0.25)', background: 'rgba(0,85,255,0.02)' }}>
                <p style={{ fontSize: '.67rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: 10 }}>
                  Invonaut
                </p>
                <p style={{ fontSize: '.875rem', color: 'var(--ink)', lineHeight: 1.7, fontWeight: 500 }}>{config.whatWeAre}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE TABLE ────────────────────────────────────────────────── */}
      <section style={{ padding: '72px 24px', background: 'var(--surf)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <p style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--faint)', marginBottom: 16 }}>Feature comparison</p>
          <h2 className="vs-display" style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 800, letterSpacing: '-.022em', color: 'var(--ink)', marginBottom: 40 }}>
            What each tool does.
          </h2>

          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--rule)', overflow: 'hidden' }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 0, padding: '14px 24px', background: 'var(--surf)', borderBottom: '1px solid var(--rule)' }}>
              <p style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--faint)' }}>Feature</p>
              <p style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--blue)', textAlign: 'center' }}>Invonaut</p>
              <p style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--faint)', textAlign: 'center' }}>{config.competitor}</p>
            </div>

            {categories.map((cat, ci) => {
              const catFeatures = config.features.filter(f => f.category === cat)
              return (
                <div key={cat}>
                  {/* Category divider */}
                  <div style={{ padding: '10px 24px', background: 'var(--surf)', borderTop: ci === 0 ? 'none' : '1px solid var(--rule)', borderBottom: '1px solid var(--rule)' }}>
                    <p style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--mid)' }}>{cat}</p>
                  </div>
                  {catFeatures.map((f, fi) => (
                    <div
                      key={f.name}
                      className="vs-row-hover"
                      style={{
                        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 0,
                        padding: '14px 24px',
                        borderBottom: fi < catFeatures.length - 1 ? '1px solid var(--rule)' : 'none',
                        transition: 'background .12s',
                      }}
                    >
                      <p style={{ fontSize: '.85rem', fontWeight: 500, color: 'var(--ink)' }}>{f.name}</p>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <FeatureDot val={f.inv} />
                        {f.invNote && <FeatureLabel val={f.inv} note={f.invNote} />}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <FeatureDot val={f.comp} />
                        {f.compNote && <FeatureLabel val={f.comp} note={f.compNote} />}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── PROS/CONS ────────────────────────────────────────────────────── */}
      <section style={{ padding: '72px 24px', background: '#fff', borderTop: '1px solid var(--rule)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <p style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--faint)', marginBottom: 40 }}>
            Honest assessment
          </p>
          <div className="vs-pros-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
            {/* Competitor wins */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--faint)', flexShrink: 0 }} />
                <p style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--faint)' }}>
                  Where {config.competitor} wins
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {config.theyWinAt.map((item, i) => (
                  <div key={i}>
                    <p style={{ fontWeight: 700, fontSize: '.875rem', color: 'var(--ink)', marginBottom: 5, letterSpacing: '-.01em' }}>{item.label}</p>
                    <p style={{ fontSize: '.825rem', color: 'var(--mid)', lineHeight: 1.75 }}>{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Invonaut wins */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--blue)', flexShrink: 0 }} />
                <p style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--blue)' }}>
                  Where Invonaut wins
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {config.weWinAt.map((item, i) => (
                  <div key={i}>
                    <p style={{ fontWeight: 700, fontSize: '.875rem', color: 'var(--ink)', marginBottom: 5, letterSpacing: '-.01em' }}>{item.label}</p>
                    <p style={{ fontSize: '.825rem', color: 'var(--mid)', lineHeight: 1.75 }}>{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING COMPARISON ───────────────────────────────────────────── */}
      <section style={{ padding: '64px 24px', background: 'var(--surf)', borderTop: '1px solid var(--rule)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <p style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--faint)', marginBottom: 16 }}>Pricing</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 640 }}>
            <div style={{ padding: '20px 24px', borderRadius: 12, border: '1px solid var(--rule)', background: '#fff' }}>
              <p style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--mid)', marginBottom: 8 }}>{config.competitor}</p>
              <p style={{ fontSize: '.875rem', color: 'var(--mid)', lineHeight: 1.7 }}>{config.pricing.compLabel}</p>
            </div>
            <div style={{ padding: '20px 24px', borderRadius: 12, border: '2px solid rgba(0,85,255,0.25)', background: 'rgba(0,85,255,0.02)' }}>
              <p style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--blue)', marginBottom: 8 }}>Invonaut</p>
              <p style={{ fontSize: '.875rem', color: 'var(--ink)', lineHeight: 1.7, fontWeight: 500 }}>{config.pricing.invLabel}</p>
            </div>
          </div>
          <p style={{ fontSize: '.825rem', color: 'var(--mid)', lineHeight: 1.75, maxWidth: 540, marginTop: 20 }}>{config.pricing.pricingNote}</p>
        </div>
      </section>

      {/* ── VERDICT ──────────────────────────────────────────────────────── */}
      <section style={{ padding: '72px 24px', background: '#fff', borderTop: '1px solid var(--rule)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(0,85,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Zap size={22} style={{ color: 'var(--blue)' }} />
          </div>
          <h2 className="vs-display" style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 800, letterSpacing: '-.022em', color: 'var(--ink)', marginBottom: 20, lineHeight: 1.15 }}>
            The bottom line
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--mid)', lineHeight: 1.85, marginBottom: 36 }}>
            {config.verdict}
          </p>
          <Link href="/signup" style={{ background: 'var(--blue)', color: '#fff', padding: '14px 32px', borderRadius: 10, fontWeight: 700, fontSize: '.95rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 20px rgba(0,85,255,0.3)' }}>
            Try Invonaut free — 14 days <ArrowRight size={16} />
          </Link>
          <p style={{ fontSize: '.75rem', color: 'var(--faint)', marginTop: 14 }}>No credit card required · Cancel anytime · Plans from $29/mo</p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ background: '#030712', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/naut-white.svg" alt="" aria-hidden="true" style={{ width: 24, height: 24, opacity: .7 }} />
            <span className="vs-display" style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Invonaut</span>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { href: '/', l: 'Home' },
              { href: '/vs/wave', l: 'vs Wave' },
              { href: '/vs/freshbooks', l: 'vs FreshBooks' },
              { href: '/vs/bonsai', l: 'vs Bonsai' },
              { href: '/pricing', l: 'Pricing' },
              { href: '/signup', l: 'Start free' },
            ].map(lk => (
              <Link key={lk.href} href={lk.href} style={{ color: 'rgba(255,255,255,0.3)', fontSize: '.82rem', textDecoration: 'none', transition: 'color .15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
                {lk.l}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
