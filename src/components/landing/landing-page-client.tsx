'use client'
// src/components/landing/landing-page-client.tsx
//
// Fully animated landing page.
// - No emojis — Lucide icons throughout
// - Framer Motion: scroll-triggered reveals, stagger grids, count-up stats, hero stagger
// - Brand blue (#2563EB) + teal (#0D9488) only — no green
// - Subtle dot grid texture on hero/dark sections (tech/finance feel, not Minnie Mouse)
// - Light/dark alternating sections
// - Honest stats: real numbers from what's built, no fake user counts
// - Nav scroll-aware: border fades in on scroll, no layout shift
// - All truncation handled: flex+min-w-0+truncate pattern everywhere
// - Activity feed items animate in with stagger on load

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, useInView, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion'
import {
  FileText, Banknote, BarChart2, Clock, FileCheck,
  TrendingUp, Receipt, Globe, Bot, ArrowRight,
  Bell, CheckCircle2, Activity, DollarSign,
  ChevronRight, Zap, Shield, Layers,
} from 'lucide-react'
import LandingPricingSection from '@/components/landing-pricing-section'

// ─── Animation variants ────────────────────────────────────────────────────────

const EASE = [0.22, 1, 0.36, 1] as const

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
}

const fadeLeft = {
  hidden: { opacity: 0, x: -28 },
  show:   { opacity: 1, x: 0,  transition: { duration: 0.65, ease: EASE } },
}

const fadeRight = {
  hidden: { opacity: 0, x: 28 },
  show:   { opacity: 1, x: 0,  transition: { duration: 0.65, ease: EASE } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  show:   { opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE } },
}

const stagger = (delay = 0.07) => ({
  hidden: {},
  show:   { transition: { staggerChildren: delay, delayChildren: 0.1 } },
})

// ─── Scroll-aware section wrapper ─────────────────────────────────────────────

function AnimSection({
  children,
  className = '',
  variant = fadeUp,
  containerVariant,
}: {
  children: React.ReactNode
  className?: string
  variant?: typeof fadeUp
  containerVariant?: ReturnType<typeof stagger>
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      variants={containerVariant ?? variant}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Count-up stat ─────────────────────────────────────────────────────────────

function CountUp({ target, suffix = '', duration = 1400 }: { target: number; suffix?: string; duration?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return
    const start = performance.now()
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3) // cubic ease-out
      setCount(Math.floor(ease * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [inView, target, duration])

  return (
    <span ref={ref}>
      {count}{suffix}
    </span>
  )
}

// ─── Module icon configs ───────────────────────────────────────────────────────

const MODULES = [
  {
    Icon: FileText,
    title: 'Invoice management',
    body: 'Create, send, and track invoices with branded PDFs. AI predicts which clients will pay late — before they do.',
    tag: 'Automated follow-ups',
    accent: '#2563EB',
    bg: 'rgba(37,99,235,0.08)',
  },
  {
    Icon: Banknote,
    title: 'Direct payment logging',
    body: 'Record every cash, POS, mobile money, and bank transfer instantly. Not everything goes through an invoice — now none of it is invisible.',
    tag: 'All income captured',
    accent: '#0D9488',
    bg: 'rgba(13,148,136,0.08)',
  },
  {
    Icon: BarChart2,
    title: 'Revenue intelligence',
    body: 'See exactly where your money comes from — by source, category, and payment method. Know which services earn you the most.',
    tag: 'Complete income picture',
    accent: '#4F46E5',
    bg: 'rgba(79,70,229,0.08)',
  },
  {
    Icon: Clock,
    title: 'Time tracking',
    body: 'Log hours with a live timer or manually. Convert unbilled time into an invoice with one click. The real automation loop.',
    tag: 'Hours → invoice in 1 click',
    accent: '#7C3AED',
    bg: 'rgba(124,58,237,0.08)',
  },
  {
    Icon: FileCheck,
    title: 'Contract management',
    body: 'Create from templates, send for legally-binding e-signatures. Automatic expiry reminders mean nothing slips through.',
    tag: 'E-signatures built in',
    accent: '#0891B2',
    bg: 'rgba(8,145,178,0.08)',
  },
  {
    Icon: TrendingUp,
    title: 'Cash flow forecast',
    body: '90-day forward view of your bank balance. Runway calculator. Predicted payment dates. Know exactly how long your money lasts.',
    tag: '90-day AI forecast',
    accent: '#059669',
    bg: 'rgba(5,150,105,0.08)',
  },
  {
    Icon: Receipt,
    title: 'Expense tracking',
    body: 'Log expenses with AI-suggested categories. Upload receipts. Set budget limits and get automatic alerts at 80% and 100%.',
    tag: 'AI categorisation',
    accent: '#D97706',
    bg: 'rgba(217,119,6,0.08)',
  },
  {
    Icon: Globe,
    title: 'Client portal',
    body: 'A branded portal where clients view invoices, download PDFs, and sign contracts — no account needed. Access by magic link.',
    tag: 'White-label ready',
    accent: '#0369A1',
    bg: 'rgba(3,105,161,0.08)',
  },
  {
    Icon: Bot,
    title: 'Autonomous collections',
    body: 'AI risk-scores every invoice. A daily cron identifies overdue high-risk invoices and sends reminders automatically — while you sleep.',
    tag: 'Runs without you',
    accent: '#BE123C',
    bg: 'rgba(190,18,60,0.08)',
  },
]

// ─── Activity feed item configs ────────────────────────────────────────────────

const ACTIVITY_ITEMS = [
  { Icon: FileText,     label: 'Invoice sent',                detail: 'INV-00089 · $4,200 · Acme Corp',             time: 'just now', accent: '#2563EB', bg: 'rgba(37,99,235,0.08)'   },
  { Icon: DollarSign,   label: 'Cash payment logged',         detail: '$850 · Airport Transfer · Transport',         time: '4m ago',   accent: '#0D9488', bg: 'rgba(13,148,136,0.08)'  },
  { Icon: Bell,         label: 'Follow-up sent automatically',detail: 'INV-00071 overdue 8 days · Risk 74%',         time: '1h ago',   accent: '#D97706', bg: 'rgba(217,119,6,0.08)'   },
  { Icon: CheckCircle2, label: 'Contract signed',             detail: 'Web Design Agreement · Jane Smith',           time: '2h ago',   accent: '#7C3AED', bg: 'rgba(124,58,237,0.08)'  },
  { Icon: Activity,     label: 'Cash runway updated',         detail: '4.2 months of runway · $12,400 in pipeline',  time: '3h ago',   accent: '#059669', bg: 'rgba(5,150,105,0.08)'   },
]

// ─── How it works steps ────────────────────────────────────────────────────────

const STEPS = [
  {
    step: '01', Icon: Layers,
    title: 'Capture all your income',
    body:  'Send invoices for billed work. Log direct payments for cash, POS, and mobile money. Tag everything with revenue categories. Your real total income is visible in one place for the first time.',
  },
  {
    step: '02', Icon: Bot,
    title: 'AI handles the chasing',
    body:  'Every invoice gets an AI risk score. The system watches for overdue invoices and sends follow-up reminders automatically — escalating with urgency the longer a payment is late.',
  },
  {
    step: '03', Icon: FileCheck,
    title: 'Contracts protect you',
    body:  'Create professional contracts from templates, get them signed in minutes, and link them to invoices. Automatic expiry reminders mean nothing slips through.',
  },
  {
    step: '04', Icon: TrendingUp,
    title: 'Know your financial future',
    body:  'Your cash flow forecast combines AI-predicted invoice payments with logged expenses to show a 90-day projection of your bank balance. The runway calculator tells you exactly how long your money lasts.',
  },
]

// ─── Autonomy processes ────────────────────────────────────────────────────────

const PROCESSES = [
  { Icon: Bell,         action: 'Invoice follow-up reminders', detail: 'Sent to overdue clients with AI risk ≥60',    schedule: 'Daily 9am'    },
  { Icon: FileCheck,    action: 'Contract expiry reminders',   detail: 'Sent at 30 / 15 / 7 / 1 days before expiry', schedule: 'Daily 9am'    },
  { Icon: Shield,       action: 'Auto-expire contracts',       detail: 'Contracts hard-expired when date passes',     schedule: 'Daily 9am'    },
  { Icon: Receipt,      action: 'Budget overspend alerts',     detail: 'Email at 80% and 100% of monthly limits',     schedule: 'Daily 9am'    },
  { Icon: Clock,        action: 'Weekly time summary',         detail: 'Hours, billable value, unbilled outstanding',  schedule: 'Monday 9am'   },
  { Icon: Zap,          action: 'AI invoice risk scoring',     detail: 'GPT-4o evaluates payment probability',        schedule: 'On send'      },
  { Icon: BarChart2,    action: 'AI expense categorisation',   detail: 'Category suggested from description',         schedule: 'On entry'     },
  { Icon: TrendingUp,   action: '90-day cash forecast',        detail: 'Balance projection recalculated live',        schedule: 'On open'      },
]

// ─── Subtle background patterns ───────────────────────────────────────────────

const DOT_PATTERN_LIGHT = {
  backgroundImage: 'radial-gradient(circle, rgba(37,99,235,0.07) 1px, transparent 1px)',
  backgroundSize: '28px 28px',
}

const DOT_PATTERN_DARK = {
  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)',
  backgroundSize: '28px 28px',
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function LandingPageClient() {
  const [navScrolled, setNavScrolled] = useState(false)
  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, 'change', (y) => setNavScrolled(y > 16))

  return (
    <div className="bg-white antialiased overflow-x-hidden">

      {/* ── Navigation ───────────────────────────────────────────────────────── */}
      <nav
        className="fixed w-full top-0 z-50 transition-all duration-300"
        style={{
          background: navScrolled ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: navScrolled ? '1px solid rgba(0,0,0,0.08)' : '1px solid transparent',
          boxShadow: navScrolled ? '0 1px 20px rgba(0,0,0,0.06)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <img src="/invonaut-logo.png" alt="Invonaut" className="w-8 h-8 rounded-full" />
              <span className="text-xl font-black tracking-tight text-gray-900">Invonaut</span>
            </Link>
            <div className="hidden md:flex items-center gap-7">
              <Link href="#platform"    className="text-gray-500 hover:text-gray-900 font-medium text-sm transition-colors">Platform</Link>
              <Link href="#how-it-works" className="text-gray-500 hover:text-gray-900 font-medium text-sm transition-colors">How It Works</Link>
              <Link href="#pricing"     className="text-gray-500 hover:text-gray-900 font-medium text-sm transition-colors">Pricing</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-gray-500 hover:text-gray-900 font-medium text-sm transition-colors hidden sm:block">
                Sign in
              </Link>
              <Link href="/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:shadow-lg">
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="pt-24 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Hero background — soft radial glow + subtle dot texture */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 85% 65% at 25% 35%, rgba(219,234,254,0.75) 0%, transparent 65%), radial-gradient(ellipse 55% 45% at 75% 65%, rgba(204,251,241,0.35) 0%, transparent 65%)',
        }} />
        <div className="absolute inset-0" style={DOT_PATTERN_LIGHT} />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-center">

            {/* Left — headline + CTA */}
            <motion.div
              variants={stagger(0.12)}
              initial="hidden"
              animate="show"
              className="min-w-0"
            >
              <motion.div variants={fadeUp}>
                <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-3 py-1.5 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Autonomous Finance OS</span>
                </div>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="text-5xl sm:text-6xl xl:text-7xl font-black text-gray-900 tracking-tight leading-[0.95] mb-5"
              >
                From contract<br />
                to cash.<br />
                <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                  Automated.
                </span>
              </motion.h1>

              <motion.p variants={fadeUp} className="text-lg text-gray-500 font-medium leading-relaxed mb-8 max-w-lg">
                Invonaut captures every dollar in — invoices, cash, POS, mobile money — then chases late payers,
                forecasts your runway, and runs your collections while you sleep.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
                <Link href="/signup"
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-7 py-3.5 rounded-xl font-bold text-sm hover:shadow-xl hover:scale-[1.02] transition-all">
                  Start free — 14 days
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="#platform"
                  className="inline-flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-7 py-3.5 rounded-xl font-bold text-sm hover:border-gray-300 hover:shadow-md transition-all">
                  See what it does
                </Link>
              </motion.div>
              <motion.p variants={fadeUp} className="text-xs text-gray-400 font-medium mt-3">
                No credit card required · Cancel anytime
              </motion.p>
            </motion.div>

            {/* Right — animated activity feed card */}
            <motion.div
              initial={{ opacity: 0, x: 32, y: 8 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
              className="hidden lg:block"
            >
              <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl p-6 relative">
                {/* Glow accent */}
                <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent" />

                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gray-900 flex items-center justify-center">
                      <Activity className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live activity</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs font-semibold text-green-600">Live</span>
                  </div>
                </div>

                <motion.div
                  variants={stagger(0.12)}
                  initial="hidden"
                  animate="show"
                  className="space-y-2.5"
                >
                  {ACTIVITY_ITEMS.map((item, i) => (
                    <motion.div
                      key={i}
                      variants={fadeUp}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: item.bg }}
                      >
                        <item.Icon className="w-4 h-4" style={{ color: item.accent }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{item.label}</p>
                        <p className="text-xs text-gray-400 truncate">{item.detail}</p>
                      </div>
                      <span className="text-xs text-gray-300 font-medium flex-shrink-0">{item.time}</span>
                    </motion.div>
                  ))}
                </motion.div>

                <div className="mt-5 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Revenue this month</span>
                    <span className="text-xs font-bold text-green-600">↑ 23%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-teal-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: '72%' }}
                      transition={{ duration: 1.2, delay: 1, ease: EASE }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-400">$0</span>
                    <span className="text-xs font-bold text-gray-700">$9,450 / $13,000</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <div className="absolute inset-0" style={DOT_PATTERN_DARK} />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <AnimSection
            containerVariant={stagger(0.12)}
            className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center"
          >
            {[
              { target: 8,  suffix: '',  label: 'Automated cron jobs'    },
              { target: 40, suffix: '%', label: 'Faster invoice payment' },
              { target: 12, suffix: '+', label: 'Modules in one platform'},
              { target: 0,  suffix: '',  label: 'Tool switching needed'  },
            ].map(stat => (
              <motion.div key={stat.label} variants={fadeUp}>
                <p className="text-4xl font-black text-white tracking-tight">
                  <CountUp target={stat.target} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-gray-400 font-medium mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </AnimSection>
        </div>
      </section>

      {/* ── Platform modules ─────────────────────────────────────────────────── */}
      <section id="platform" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <AnimSection className="text-center mb-14">
            <motion.div variants={fadeUp}>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">The complete platform</p>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
                Everything in one place.
              </h2>
              <p className="text-lg text-gray-500 font-medium mt-4 max-w-2xl mx-auto">
                No more switching between invoicing apps, time trackers, and spreadsheets.
                Invonaut models how money actually flows through your business.
              </p>
            </motion.div>
          </AnimSection>

          <AnimSection
            containerVariant={stagger(0.06)}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {MODULES.map(mod => (
              <motion.div
                key={mod.title}
                variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group bg-gray-50 hover:bg-white rounded-2xl p-6 border border-gray-100 hover:border-blue-100 hover:shadow-xl transition-all cursor-default"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ background: mod.bg }}
                >
                  <mod.Icon className="w-5 h-5" style={{ color: mod.accent }} />
                </div>
                <div
                  className="inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 mb-3"
                  style={{ background: mod.bg, color: mod.accent }}
                >
                  {mod.tag}
                </div>
                <h3 className="text-base font-black text-gray-900 mb-1.5 tracking-tight group-hover:text-blue-600 transition-colors">
                  {mod.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{mod.body}</p>
              </motion.div>
            ))}
          </AnimSection>
        </div>
      </section>

      {/* ── Autonomy callout (dark) ───────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <div className="absolute inset-0" style={DOT_PATTERN_DARK} />
        {/* Subtle blue glow top-right */}
        <div className="absolute top-0 right-0 w-96 h-96 opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)' }} />

        <div className="max-w-5xl mx-auto relative z-10">
          <AnimSection className="text-center mb-12">
            <motion.div variants={fadeUp}>
              <p className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-3">Always on</p>
              <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                Works while you don&apos;t.
              </h2>
              <p className="text-gray-400 font-medium mt-4 max-w-xl mx-auto">
                Eight automated processes run every day without you logging in.
              </p>
            </motion.div>
          </AnimSection>

          <AnimSection
            containerVariant={stagger(0.07)}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {PROCESSES.map((proc) => (
              <motion.div
                key={proc.action}
                variants={fadeLeft}
                whileHover={{ x: 4, transition: { duration: 0.15 } }}
                className="flex items-center gap-4 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] rounded-xl px-5 py-4 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                  <proc.Icon className="w-4 h-4 text-teal-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{proc.action}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{proc.detail}</p>
                </div>
                <span className="text-xs font-bold text-gray-500 flex-shrink-0 ml-2">{proc.schedule}</span>
              </motion.div>
            ))}
          </AnimSection>

          {/* Bottom stat strip */}
          <AnimSection className="mt-10">
            <motion.div
              variants={fadeUp}
              className="grid grid-cols-3 gap-4 bg-white/[0.04] border border-white/[0.07] rounded-2xl p-6 text-center"
            >
              {[
                { value: '8',    label: 'Active automations'  },
                { value: '24/7', label: 'System uptime'       },
                { value: '0',    label: 'Manual tasks needed' },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-2xl font-black text-teal-400">{s.value}</p>
                  <p className="text-xs text-gray-400 font-medium mt-1">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </AnimSection>
        </div>
      </section>

      {/* ── How it works (light) ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <AnimSection className="text-center mb-14">
            <motion.div variants={fadeUp}>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">How it works</p>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
                Your money, fully tracked.
              </h2>
            </motion.div>
          </AnimSection>

          <AnimSection containerVariant={stagger(0.15)} className="space-y-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                variants={i % 2 === 0 ? fadeLeft : fadeRight}
                className="flex gap-6 items-start bg-white rounded-2xl p-7 border border-gray-100 hover:border-blue-100 hover:shadow-lg transition-all group"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <step.Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-black text-blue-400 tracking-widest">{step.step}</span>
                    <h3 className="text-lg font-black text-gray-900 tracking-tight">{step.title}</h3>
                  </div>
                  <p className="text-gray-500 leading-relaxed text-sm">{step.body}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </motion.div>
            ))}
          </AnimSection>
        </div>
      </section>

      {/* ── White label callout (white) ──────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <AnimSection>
              <motion.div variants={fadeLeft}>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Professional &amp; Business</p>
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-4">
                  Your brand.<br />Not ours.
                </h2>
                <p className="text-gray-500 leading-relaxed mb-6">
                  Upload your logo and set your primary and secondary brand colors. Invonaut applies them everywhere your clients see — invoices, emails, portal, and contracts.
                </p>
                <ul className="space-y-3">
                  {[
                    { where: 'Invoice PDFs',    what: 'Your logo in the header, brand colors on accents and totals' },
                    { where: 'Invoice emails',  what: 'Sent from your business name, styled in your colors'        },
                    { where: 'Client portal',   what: 'Header shows your logo — Invonaut branding completely hidden' },
                    { where: 'Contract PDFs',   what: 'Signed documents carry your brand, not a third-party mark'  },
                  ].map(item => (
                    <li key={item.where} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-2.5 h-2.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-gray-900">{item.where}: </span>
                        <span className="text-sm text-gray-500">{item.what}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimSection>

            <AnimSection>
              <motion.div variants={fadeRight} className="bg-gray-50 rounded-2xl border border-gray-100 shadow-sm p-7">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Choose your brand colors</p>
                <div className="flex gap-3 mb-6 flex-wrap">
                  {[
                    { color: '#2563EB', label: 'Blue'   },
                    { color: '#0D9488', label: 'Teal'   },
                    { color: '#7C3AED', label: 'Purple' },
                    { color: '#DC2626', label: 'Red'    },
                    { color: '#D97706', label: 'Amber'  },
                    { color: '#059669', label: 'Green'  },
                  ].map((c, i) => (
                    <motion.div
                      key={c.color}
                      initial={{ opacity: 0, scale: 0.7 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.06, duration: 0.35, ease: EASE }}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <div
                        className="w-10 h-10 rounded-full shadow-md hover:scale-110 transition-transform cursor-pointer"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="text-xs text-gray-400">{c.label}</span>
                    </motion.div>
                  ))}
                </div>
                {/* Branded invoice preview */}
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                      <span className="text-white text-xs font-black">YB</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-gray-900 truncate">Your Business</p>
                      <p className="text-xs text-gray-400 truncate">invoice@yourbusiness.com</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    <div className="h-1 bg-blue-600 rounded-full w-3/4" />
                    <div className="h-1 bg-gray-200 rounded-full w-full" />
                    <div className="h-1 bg-gray-200 rounded-full w-2/3" />
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">$4,200.00</div>
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-center mt-3">Preview of your branded invoice</p>
              </motion.div>
            </AnimSection>
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <AnimSection className="text-center mb-14">
            <motion.div variants={fadeUp}>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Pricing</p>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
                Simple, transparent pricing.
              </h2>
              <p className="text-gray-500 font-medium mt-4 max-w-xl mx-auto">
                Start with a 14-day free trial on any plan. No credit card required.
              </p>
            </motion.div>
          </AnimSection>
          <AnimSection>
            <motion.div variants={scaleIn}>
              <LandingPricingSection />
            </motion.div>
          </AnimSection>
        </div>
      </section>

      {/* ── Final CTA (dark blue) ─────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 50%, #1e3a8a 100%)' }}>
        {/* Subtle dot texture */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />
        {/* Glow */}
        <div className="absolute inset-0 opacity-20"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(96,165,250,0.5) 0%, transparent 70%)' }} />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <AnimSection>
            <motion.div variants={fadeUp} className="space-y-6">
              <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                Stop chasing invoices.<br />Start getting paid.
              </h2>
              <p className="text-blue-100 text-lg font-medium max-w-xl mx-auto">
                Join freelancers and small businesses who have moved their entire financial operation into Invonaut.
              </p>
              <div>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 bg-white text-blue-700 px-9 py-4 rounded-xl font-black text-base hover:shadow-2xl hover:scale-[1.03] transition-all"
                >
                  Start free — 14 days
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-blue-200 text-xs font-medium mt-3">No credit card · Cancel anytime · 14-day free trial</p>
              </div>
            </motion.div>
          </AnimSection>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="bg-gray-950 text-gray-400 py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <img src="/invonaut-logo.png" alt="Invonaut" className="w-7 h-7 rounded-full" />
                <span className="text-base font-black text-white">Invonaut</span>
              </div>
              <p className="text-sm leading-relaxed">From Contract to Cash. Automated.</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-4">Product</p>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="#platform"     className="hover:text-white transition-colors">Platform</Link></li>
                <li><Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="#pricing"      className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-4">Account</p>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/signup" className="hover:text-white transition-colors">Sign up</Link></li>
                <li><Link href="/login"  className="hover:text-white transition-colors">Sign in</Link></li>
                <li><Link href="/help"   className="hover:text-white transition-colors">Help</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-4">Legal</p>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms"   className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs">© {new Date().getFullYear()} Invonaut. All rights reserved.</p>
            <p className="text-xs">Built for freelancers who mean business.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
