'use client'
// src/components/landing/landing-page-client.tsx
// Full rebuild — v4.0
// Design: Editorial Precision — Fraunces serif headlines, DM Sans body, DM Mono log
// No orbs, no browser chrome, no icon grids, no animated gradients, no fake stats
// 9 sections: Nav → Hero → Pain → How It Works → Platform → Automation → Trust → Pricing → CTA → Footer

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import LandingPricingSection from '@/components/landing-pricing-section'

// ─── Styles ───────────────────────────────────────────────────────────────────
const BASE_CSS = `
  .f-display { font-family: 'Fraunces', serif; font-optical-sizing: auto; }
  .f-mono    { font-family: 'DM Mono', monospace; }
  .f-sans    { font-family: 'DM Sans', sans-serif; }

  :root {
    --ink:     #0A0A0A;
    --blue:    #0055FF;
    --mid:     #6B7280;
    --faint:   #9CA3AF;
    --rule:    #E5E7EB;
    --surface: #F9FAFB;
  }

  @keyframes cursor-blink {
    0%, 49%  { opacity: 1; }
    50%, 100% { opacity: 0; }
  }
  .log-cursor::after {
    content: '▋';
    animation: cursor-blink 1.1s step-end infinite;
    margin-left: 3px;
    color: var(--blue);
    font-size: 0.9em;
  }

  /* Responsive grid helpers */
  @media (max-width: 900px) {
    .hero-grid   { grid-template-columns: 1fr !important; }
    .steps-grid  { grid-template-columns: 1fr 1fr !important; }
    .auto-row    { grid-template-columns: 1fr !important; gap: 4px !important; }
    .auto-sched  { display: none !important; }
    .trust-grid  { grid-template-columns: 1fr 1fr !important; }
    .footer-grid { grid-template-columns: 1fr 1fr !important; }
  }
  @media (max-width: 600px) {
    .steps-grid  { grid-template-columns: 1fr !important; }
    .trust-grid  { grid-template-columns: 1fr !important; }
    .footer-grid { grid-template-columns: 1fr !important; }
  }
`

// ─── Animation ────────────────────────────────────────────────────────────────
const EASE = [0.16, 1, 0.3, 1] as const

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

const stagger = (d = 0.09) => ({
  hidden: {},
  show:   { transition: { staggerChildren: d, delayChildren: 0.04 } },
})

function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div ref={ref} variants={stagger()} initial="hidden" animate={inView ? 'show' : 'hidden'} className={className}>
      {children}
    </motion.div>
  )
}

// ─── System Log Feed ──────────────────────────────────────────────────────────
const LOG_LINES = [
  { t: '09:00:12', a: 'Invoice follow-up sent',        d: 'INV-00089 · Acme Corp · $4,200 · 8 days overdue'  },
  { t: '09:00:13', a: 'Contract expiry reminder sent', d: 'Consulting Agreement · 6 days remaining'           },
  { t: '09:00:14', a: 'Budget alert dispatched',       d: 'Marketing · $410 of $500 limit reached'            },
  { t: '09:00:51', a: 'AI risk score updated',         d: 'INV-00094 · payment confidence 88%'                },
  { t: '09:01:03', a: 'Cash forecast recalculated',    d: '4.2 months runway · $12,400 in pipeline'           },
  { t: '09:01:44', a: 'Contract auto-signed',          d: 'Web Design Agreement · Northside Media'            },
  { t: '09:02:11', a: 'Weekly time summary sent',      d: '23.5h billable · $2,820 outstanding'               },
]

function SystemLog() {
  const [count,  setCount]  = useState(1)
  const [offset, setOffset] = useState(0)
  const SHOW = 5

  useEffect(() => {
    if (count < LOG_LINES.length) {
      const t = setTimeout(() => setCount(v => v + 1), 620)
      return () => clearTimeout(t)
    }
    const t = setInterval(() => setOffset(o => (o + 1) % LOG_LINES.length), 3800)
    return () => clearInterval(t)
  }, [count])

  const items = Array.from({ length: Math.min(count, SHOW) }, (_, i) =>
    LOG_LINES[(offset + i) % LOG_LINES.length]
  )

  return (
    <div className="f-mono" style={{ fontSize: '0.7rem', lineHeight: 1.9 }}>
      <p style={{ fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--faint)', marginBottom: 18 }}>
        invonaut · system log · today
      </p>
      <AnimatePresence mode="popLayout">
        {items.map((line, i) => (
          <motion.div
            key={`${offset}-${i}`}
            layout
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            style={{ marginBottom: 6 }}
          >
            <span style={{ color: 'var(--faint)', userSelect: 'none' }}>{line.t}  </span>
            <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{line.a}</span>
            <br />
            <span style={{ color: 'var(--faint)', paddingLeft: '5.8em' }}>{line.d}</span>
          </motion.div>
        ))}
      </AnimatePresence>
      <div className="log-cursor" style={{ color: 'var(--blue)', fontSize: '0.65rem', marginTop: 8 }}>
        running again tomorrow at 09:00
      </div>
    </div>
  )
}

// ─── Pain points ──────────────────────────────────────────────────────────────
const PAINS = [
  {
    n:    '01',
    head: 'Your invoices are being paid whenever your clients feel like it.',
    body: "Without automated follow-ups, late payment is the default. Most freelancers have thousands of dollars in outstanding invoices at any given time — not because clients won't pay, but because nobody is consistently asking.",
  },
  {
    n:    '02',
    head: "Half your income isn't in your accounting tool.",
    body: 'Cash from a client. A POS payment. A bank transfer that arrived while you were on a job. Most finance tools only track invoices — which means most finance tools are showing you a partial picture of your real revenue.',
  },
  {
    n:    '03',
    head: "You'll find out your contract expired after the fact.",
    body: 'Contracts expire quietly. The client knows their obligations are over. You find out when the work stops or the dispute starts.',
  },
]

// ─── How it works ─────────────────────────────────────────────────────────────
const STEPS = [
  {
    n:     '01',
    title: 'Capture all income',
    body:  'Send invoices for billed work. Log direct payments for everything else — cash, POS, mobile money, bank transfer. Your real total income, visible in one place for the first time.',
  },
  {
    n:     '02',
    title: 'AI handles the chasing',
    body:  "Every invoice gets an AI risk score. Overdue invoices with high risk trigger automatic follow-up emails. You're informed. You don't have to act.",
  },
  {
    n:     '03',
    title: 'Contracts protect you',
    body:  'Create from templates, collect legally binding e-signatures in minutes. Automatic reminders at 30, 15, 7, and 1 day before expiry mean nothing slips.',
  },
  {
    n:     '04',
    title: 'Know your financial future',
    body:  'A 90-day cash flow forecast combines AI-predicted invoice payments and logged expenses. The runway calculator shows exactly how long your money lasts.',
  },
]

// ─── Platform features ────────────────────────────────────────────────────────
const PLATFORM = [
  {
    group: 'Track every dollar',
    items: [
      { name: 'Invoice management',     desc: 'Create, send, and track invoices with branded PDFs. AI predicts which clients will pay late before they do. Automated follow-ups fire without you touching anything.' },
      { name: 'Direct payment logging', desc: 'Log cash, POS, bank transfer, and mobile money in seconds. Not everything goes through an invoice — now none of it is invisible.' },
      { name: 'Time tracking',          desc: 'Live timer or manual entry. Convert any client\'s unbilled hours into a full draft invoice in one click, with all line items already filled.' },
      { name: 'Expense tracking',       desc: 'AI-suggested categories on every entry. Upload receipts. Set monthly limits and get automatic alerts at 80% and 100% spend.' },
    ],
  },
  {
    group: 'Protect your work',
    items: [
      { name: 'Contract management', desc: 'Six template types, a 19-clause library, and legally-binding e-signatures. Automatic reminders at 30/15/7/1 days before expiry. Nothing expires without warning.' },
      { name: 'Client portal',       desc: 'A branded portal where clients view invoices, download PDFs, and sign contracts. Access by magic link — no account needed, no friction for them.' },
      { name: 'White-label branding', desc: 'Your logo, your colours, applied everywhere your clients see — invoices, emails, the client portal, and contract PDFs. Invonaut is invisible.' },
    ],
  },
  {
    group: 'Understand your money',
    items: [
      { name: 'Cash flow forecast',   desc: '90-day projection of your bank balance. Runway calculator. Predicted payment dates. Know exactly how long your money lasts before it becomes a crisis.' },
      { name: 'Revenue intelligence', desc: 'Every dollar by source, category, and payment method. Know which services earn the most and which clients are worth the most of your time.' },
      { name: 'Bank connections',     desc: 'Connect via Plaid. Transactions sync automatically. Invonaut matches incoming deposits to outstanding invoices and marks them paid.' },
    ],
  },
]

// ─── Automation schedule ──────────────────────────────────────────────────────
const AUTOMATIONS = [
  { schedule: 'Daily · 9:00am',   name: 'Invoice follow-up reminders',  desc: 'Sent to every client with an overdue invoice and an AI risk score of 60% or higher. Escalating urgency the longer the invoice is outstanding.' },
  { schedule: 'Daily · 9:00am',   name: 'Contract expiry warnings',      desc: 'Dispatched automatically at 30, 15, 7, and 1 day before a contract expires. Sent to you, not the client — you stay in control.' },
  { schedule: 'Daily · 9:00am',   name: 'Contract auto-expiry',          desc: 'Contracts are hard-expired the moment their end date passes. Status updates automatically. No manual action required.' },
  { schedule: 'Daily · 9:00am',   name: 'Budget overspend alerts',       desc: 'Email dispatched when any expense category hits 80% and again at 100% of its monthly limit. Business tier feature.' },
  { schedule: 'Monday · 9:00am',  name: 'Weekly time summary',           desc: 'Total hours tracked, billable value, and any unbilled work that has not yet been invoiced — so nothing is forgotten.' },
  { schedule: 'On send',          name: 'AI invoice risk scoring',       desc: 'GPT-4o-mini evaluates every invoice for payment probability based on client history, invoice age, and amount.' },
  { schedule: 'On entry',         name: 'AI expense categorisation',     desc: 'Category suggested from the expense description. Accept it, change it, or correct it — the system learns your patterns.' },
  { schedule: 'On open',          name: '90-day cash forecast',          desc: 'Balance projection recalculated live every time you open the cash flow page. Always current, no maintenance needed.' },
]

// ─── Main component ───────────────────────────────────────────────────────────
export default function LandingPageClient() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Shared inline style shorthand
  const px = { paddingLeft: 24, paddingRight: 24 }
  const section = (py = 100, bg = '#fff', extra?: React.CSSProperties) => ({
    ...px, paddingTop: py, paddingBottom: py, background: bg, ...extra,
  })

  return (
    <div className="f-sans" style={{ color: 'var(--ink)', background: '#fff', overflowX: 'clip' }}>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..800;1,9..144,400..700&family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..500&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <style dangerouslySetInnerHTML={{ __html: BASE_CSS }} />

      {/* ── NAV ────────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: 58,
        background: scrolled ? 'rgba(255,255,255,0.96)' : 'transparent',
        borderBottom: scrolled ? '1px solid var(--rule)' : '1px solid transparent',
        backdropFilter: 'blur(14px)',
        transition: 'background 0.25s, border-color 0.25s',
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', width: '100%', ...px, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span className="f-display" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
              Invonaut
            </span>
          </Link>

          <div style={{ display: 'flex', gap: 2, alignItems: 'center' }} className="hidden md:flex">
            {[
              { href: '#how-it-works', label: 'How it works' },
              { href: '#platform',     label: 'Platform' },
              { href: '#pricing',      label: 'Pricing' },
              { href: '/affiliate',    label: 'Affiliate' },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{
                color: 'var(--mid)', fontWeight: 500, fontSize: '0.875rem',
                padding: '7px 14px', borderRadius: 8, textDecoration: 'none', transition: 'color 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--mid)')}
              >{l.label}</Link>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link href="/login" style={{ color: 'var(--mid)', fontWeight: 500, fontSize: '0.875rem', textDecoration: 'none' }} className="hidden sm:block">
              Sign in
            </Link>
            <Link href="/signup" style={{
              background: 'var(--ink)', color: '#fff', padding: '8px 20px',
              borderRadius: 8, fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 8, lineHeight: 1,
            }}>
              Start free
              <span style={{ opacity: 0.45, fontWeight: 400, fontSize: '0.78rem' }}>14 days</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section style={{ ...px, paddingTop: 130, paddingBottom: 110 }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>

          {/* Founding member strip */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              border: '1px solid var(--rule)', borderRadius: 100,
              padding: '6px 16px', marginBottom: 44,
              fontSize: '0.75rem', fontWeight: 600, color: 'var(--mid)',
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--blue)', flexShrink: 0, display: 'inline-block' }} />
            Founding member pricing · $19/mo locks in forever · Ends at public launch in August
          </motion.div>

          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'flex-start' }}>
            {/* Left */}
            <motion.div variants={stagger(0.1)} initial="hidden" animate="show">
              <motion.p variants={fadeUp} style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--faint)', marginBottom: 24 }}>
                For freelancers and independent businesses
              </motion.p>

              <motion.h1
                variants={fadeUp}
                className="f-display"
                style={{
                  fontSize: 'clamp(2.6rem, 5.5vw, 4.6rem)',
                  fontWeight: 800, lineHeight: 1.03,
                  letterSpacing: '-0.025em',
                  color: 'var(--ink)',
                  marginBottom: 28,
                }}
              >
                You built a<br />
                business, not an<br />
                admin department.
              </motion.h1>

              <motion.p variants={fadeUp} style={{ fontSize: '1.1rem', color: 'var(--mid)', lineHeight: 1.75, marginBottom: 40, maxWidth: 480 }}>
                Invonaut tracks every dollar, follows up every invoice, manages every contract, and forecasts your cash — automatically. Eight processes run every day without you logging in.
              </motion.p>

              <motion.div variants={fadeUp} style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
                <Link href="/signup" style={{
                  background: 'var(--blue)', color: '#fff',
                  padding: '14px 30px', borderRadius: 10,
                  fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                }}>
                  Start free — 14 days <ArrowRight size={16} strokeWidth={2.5} />
                </Link>
                <Link href="#how-it-works" style={{ color: 'var(--mid)', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>
                  See how it works →
                </Link>
              </motion.div>

              <motion.p variants={fadeUp} style={{ fontSize: '0.75rem', color: 'var(--faint)' }}>
                No credit card required · Cancel anytime · Plans from $19/mo
              </motion.p>
            </motion.div>

            {/* Right — system log */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="hidden lg:block"
              style={{ borderLeft: '2px solid var(--rule)', paddingLeft: 44, paddingTop: 4 }}
            >
              <SystemLog />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── PAIN ───────────────────────────────────────────────────────────── */}
      <section style={{ ...section(96, 'var(--ink)') }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>

          <Reveal>
            <motion.p variants={fadeUp} style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 72 }}>
              The three things that quietly cost freelancers money
            </motion.p>
          </Reveal>

          {PAINS.map((p, i) => (
            <Reveal key={i}>
              <motion.div
                variants={fadeUp}
                style={{
                  display: 'grid', gridTemplateColumns: '72px 1fr', gap: 44,
                  paddingBottom: i < PAINS.length - 1 ? 60 : 0,
                  marginBottom: i < PAINS.length - 1 ? 60 : 0,
                  borderBottom: i < PAINS.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                }}
              >
                <div className="f-display" style={{ fontSize: '2.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.08)', lineHeight: 1, paddingTop: 4 }}>
                  {p.n}
                </div>
                <div>
                  <p className="f-display" style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.85rem)', fontWeight: 700, color: '#fff', lineHeight: 1.25, marginBottom: 18 }}>
                    {p.head}
                  </p>
                  <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.42)', lineHeight: 1.8 }}>
                    {p.body}
                  </p>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ ...section(100) }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>

          <Reveal>
            <motion.div variants={fadeUp} style={{ marginBottom: 64 }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--faint)', marginBottom: 20 }}>
                How it works
              </p>
              <h2 className="f-display" style={{ fontSize: 'clamp(1.9rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.022em', lineHeight: 1.08, color: 'var(--ink)', maxWidth: 520 }}>
                Four steps. Everything else is handled.
              </h2>
            </motion.div>
          </Reveal>

          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid var(--rule)' }}>
            {STEPS.map((step, i) => (
              <Reveal key={i}>
                <motion.div
                  variants={fadeUp}
                  style={{
                    padding: '40px 32px',
                    borderRight: i < STEPS.length - 1 ? '1px solid var(--rule)' : 'none',
                    height: '100%',
                  }}
                >
                  <div className="f-display" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--rule)', marginBottom: 28, lineHeight: 1 }}>
                    {step.n}
                  </div>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)', marginBottom: 12, letterSpacing: '-0.01em' }}>
                    {step.title}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--mid)', lineHeight: 1.8 }}>
                    {step.body}
                  </p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATFORM ───────────────────────────────────────────────────────── */}
      <section id="platform" style={{ ...section(100, 'var(--surface)'), borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>

          <Reveal>
            <motion.div variants={fadeUp} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24, marginBottom: 72 }}>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--faint)', marginBottom: 20 }}>
                  Platform
                </p>
                <h2 className="f-display" style={{ fontSize: 'clamp(1.9rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.022em', lineHeight: 1.08, color: 'var(--ink)' }}>
                  One system.<br />Ten capabilities.
                </h2>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--mid)', maxWidth: 340, lineHeight: 1.75 }}>
                Everything under one login. No integrations required. No tool-switching. No duct-taped stack of four subscriptions.
              </p>
            </motion.div>
          </Reveal>

          {PLATFORM.map((group, gi) => (
            <div key={gi} style={{ marginBottom: gi < PLATFORM.length - 1 ? 56 : 0 }}>
              <Reveal>
                <motion.p variants={fadeUp} style={{
                  fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: 'var(--blue)',
                  marginBottom: 20, paddingBottom: 14,
                  borderBottom: '1px solid var(--rule)',
                }}>
                  {group.group}
                </motion.p>
              </Reveal>

              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${group.items.length}, 1fr)`, gap: 1, background: 'var(--rule)' }}>
                {group.items.map((feat, fi) => (
                  <Reveal key={fi}>
                    <motion.div variants={fadeUp} style={{ background: 'var(--surface)', padding: '28px 30px' }}>
                      <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--ink)', marginBottom: 10, letterSpacing: '-0.01em' }}>
                        {feat.name}
                      </p>
                      <p style={{ fontSize: '0.825rem', color: 'var(--mid)', lineHeight: 1.8 }}>
                        {feat.desc}
                      </p>
                    </motion.div>
                  </Reveal>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AUTOMATION ─────────────────────────────────────────────────────── */}
      <section style={{ ...section(100) }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>

          <Reveal>
            <motion.div
              variants={fadeUp}
              className="auto-header"
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'flex-end', marginBottom: 64 }}
            >
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--faint)', marginBottom: 20 }}>
                  Automation
                </p>
                <h2 className="f-display" style={{ fontSize: 'clamp(1.9rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.022em', lineHeight: 1.08, color: 'var(--ink)' }}>
                  Works while<br />you don't.
                </h2>
              </div>
              <p style={{ fontSize: '0.975rem', color: 'var(--mid)', lineHeight: 1.8 }}>
                Eight processes run automatically every day. Chasing late payments, warning you about expiring contracts, keeping your forecast current — without you logging in.
              </p>
            </motion.div>
          </Reveal>

          <div style={{ borderTop: '1px solid var(--rule)' }}>
            {AUTOMATIONS.map((a, i) => (
              <Reveal key={i}>
                <motion.div
                  variants={fadeUp}
                  className="auto-row"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '160px 1fr 2fr',
                    gap: 32,
                    padding: '22px 0',
                    borderBottom: '1px solid var(--rule)',
                    alignItems: 'baseline',
                  }}
                >
                  <p className="f-mono auto-sched" style={{ fontSize: '0.68rem', color: 'var(--blue)', fontWeight: 500, paddingTop: 1 }}>
                    {a.schedule}
                  </p>
                  <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                    {a.name}
                  </p>
                  <p style={{ fontSize: '0.825rem', color: 'var(--mid)', lineHeight: 1.75 }}>
                    {a.desc}
                  </p>
                </motion.div>
              </Reveal>
            ))}
          </div>

          {/* Summary strip */}
          <Reveal>
            <motion.div
              variants={fadeUp}
              style={{
                marginTop: 48,
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                border: '1px solid var(--rule)', borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              {[
                { val: '8',    label: 'Automated processes' },
                { val: '24/7', label: 'Runs while you sleep' },
                { val: '0',    label: 'Manual triggers needed' },
              ].map((s, i) => (
                <div key={i} style={{
                  padding: '28px 32px', textAlign: 'center',
                  borderRight: i < 2 ? '1px solid var(--rule)' : 'none',
                  background: 'var(--surface)',
                }}>
                  <p className="f-display" style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.03em', marginBottom: 6 }}>
                    {s.val}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--mid)', fontWeight: 500 }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </Reveal>
        </div>
      </section>

      {/* ── TRUST ──────────────────────────────────────────────────────────── */}
      <section style={{ ...section(72, 'var(--surface)'), borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div className="trust-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 48 }}>
            {[
              { title: 'No lock-in',          body: 'Cancel any time. Your data exports in full. No contracts. No exit fees.' },
              { title: 'Free for 14 days',    body: 'Every plan, fully featured. No credit card required to start.' },
              { title: 'Finance-grade auth',  body: 'Row-level security on every table. Auth by Supabase. Payments by Stripe.' },
              { title: 'No outside funding',  body: 'Built without investors. Pricing reflects what the product is worth — not a growth target.' },
            ].map(({ title, body }) => (
              <Reveal key={title}>
                <motion.div variants={fadeUp}>
                  <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--ink)', marginBottom: 8, letterSpacing: '-0.01em' }}>
                    {title}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--mid)', lineHeight: 1.8 }}>
                    {body}
                  </p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ ...section(100) }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>

          <Reveal>
            <motion.div variants={fadeUp} style={{ marginBottom: 56, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24 }}>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--faint)', marginBottom: 20 }}>
                  Pricing
                </p>
                <h2 className="f-display" style={{ fontSize: 'clamp(1.9rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.022em', lineHeight: 1.08, color: 'var(--ink)' }}>
                  Pick a plan.<br />Cancel anytime.
                </h2>
              </div>
              <div style={{
                padding: '12px 20px', border: '1px solid var(--blue)',
                borderRadius: 10, fontSize: '0.8rem', color: 'var(--blue)',
                fontWeight: 600, maxWidth: 360, lineHeight: 1.65,
              }}>
                Founding member pricing locks in permanently. You pay this price forever — it never increases as the product evolves. Ends at public launch.
              </div>
            </motion.div>
          </Reveal>

          <Reveal>
            <motion.div variants={fadeUp}>
              <LandingPricingSection />
            </motion.div>
          </Reveal>

          <Reveal>
            <motion.p variants={fadeUp} style={{ fontSize: '0.825rem', color: 'var(--faint)', marginTop: 36, textAlign: 'center' }}>
              A bookkeeper charges $300–500/month. A fractional CFO charges more. Invonaut does what both do — automatically — starting at $19.
            </motion.p>
          </Reveal>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────────────── */}
      <section style={{ ...section(128, 'var(--ink)') }}>
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <motion.div variants={stagger(0.1)} initial="hidden">
              <motion.h2 variants={fadeUp} className="f-display" style={{
                fontSize: 'clamp(2.4rem, 6vw, 4.8rem)',
                fontWeight: 800, letterSpacing: '-0.025em',
                lineHeight: 1.03, color: '#fff', marginBottom: 28,
              }}>
                Run a calmer,<br />more organised<br />business.
              </motion.h2>
              <motion.p variants={fadeUp} style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.42)', lineHeight: 1.8, marginBottom: 52, maxWidth: 480, margin: '0 auto 52px' }}>
                The admin weight doesn't come back. That's the part most people don't expect.
              </motion.p>
              <motion.div variants={fadeUp}>
                <Link href="/signup" style={{
                  background: '#fff', color: 'var(--ink)',
                  padding: '16px 44px', borderRadius: 10,
                  fontWeight: 800, fontSize: '1rem', textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                }}>
                  Start free — 14 days <ArrowRight size={18} strokeWidth={2.5} />
                </Link>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', marginTop: 18 }}>
                  Plans from $19/mo · No credit card · Cancel anytime
                </p>
              </motion.div>
            </motion.div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer style={{ background: '#030712', ...px, paddingTop: 64, paddingBottom: 40 }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 52 }}>
            <div>
              <span className="f-display" style={{ display: 'block', fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 14 }}>
                Invonaut
              </span>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.75 }}>
                From Contract to Cash. Automated.
              </p>
            </div>

            {[
              { head: 'Product', links: [{ href: '#platform', l: 'Platform' }, { href: '#how-it-works', l: 'How it works' }, { href: '#pricing', l: 'Pricing' }, { href: '/affiliate', l: 'Affiliate — Earn 30%' }] },
              { head: 'Account', links: [{ href: '/signup', l: 'Sign up' }, { href: '/login', l: 'Sign in' }, { href: '/help', l: 'Help' }] },
              { head: 'Legal',   links: [{ href: '/privacy', l: 'Privacy Policy' }, { href: '/terms', l: 'Terms of Service' }] },
            ].map(col => (
              <div key={col.head}>
                <p style={{ fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginBottom: 22 }}>
                  {col.head}
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {col.links.map(link => (
                    <li key={link.href}>
                      <Link href={link.href} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', textDecoration: 'none', transition: 'color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                      >
                        {link.l}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)' }}>
              © {new Date().getFullYear()} Invonaut. All rights reserved.
            </p>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)' }}>
              Built for people who run their own business.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
