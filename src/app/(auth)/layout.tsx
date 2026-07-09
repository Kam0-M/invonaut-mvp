import { ReactNode } from 'react'
import Link from 'next/link'

// ─── Design tokens — local re-declaration, matching the established pattern
// on landing-page-client.tsx, /pricing, and every /vs/[competitor] page. ────
const CSS = `
  .auth-body  { font-family:'DM Sans',sans-serif; -webkit-font-smoothing:antialiased; }
  .f-display  { font-family:'Fraunces',serif; font-optical-sizing:auto; }
  .f-mono     { font-family:'JetBrains Mono',monospace; font-feature-settings:'tnum'; }
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
  @keyframes auth-cursor-blink { 0%,49% { opacity:1 } 50%,100% { opacity:0 } }
  .auth-cursor::after { content:'▋'; margin-left:3px; color:var(--teal); animation:auth-cursor-blink 1.1s step-end infinite; }
  .auth-back-link:hover { color:var(--ink) !important; }
`

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="auth-body"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'radial-gradient(ellipse 60% 45% at 50% 0%, rgba(0,85,255,0.055) 0%, transparent 60%), #ffffff',
        color: 'var(--ink)',
      }}
    >
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..800;1,9..144,400..700&family=DM+Sans:ital,opsz,wght@0,9..40,300..700&family=JetBrains+Mono:wght@400;500;700&display=swap"
        rel="stylesheet"
      />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, height: 58, background: 'rgba(255,255,255,0.9)', borderBottom: '1px solid var(--rule)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', width: '100%', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <img src="/naut-blue.svg" alt="" aria-hidden="true" style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }} />
            <span className="f-display" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.02em' }}>Invonaut</span>
          </Link>
          <Link href="/" className="auth-back-link" style={{ color: 'var(--mid)', fontWeight: 600, fontSize: '.85rem', textDecoration: 'none', transition: 'color .15s' }}>
            ← Back
          </Link>
        </div>
      </nav>

      {/* ── FORM ─────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          {children}
        </div>
      </div>

      {/* ── FOOTER CAPTION ───────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', padding: '0 24px 40px', flexShrink: 0 }}>
        <p className="f-mono auth-cursor" style={{ fontSize: '.68rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--faint)', display: 'inline-block' }}>
          From contract to cash. Automated.
        </p>
      </div>
    </div>
  )
}
