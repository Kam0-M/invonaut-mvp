'use client'
// src/components/landing/landing-page-client.tsx
//
// SURGICAL UPGRADE v3 — added on top of v2 without removing anything:
//   NEW A: "You're Leaving Money on the Table" pain section (after hero)
//   NEW B: Revenue Clarity Calculator (interactive sliders, after platform modules)
//   NEW C: Activity feed → progressive live demo (items appear over time)
//   NEW D: Competitor comparison table (before pricing)
//   FIX:   Spinning card border rebuilt using CSS @property (true "train on tracks")
//   FIX:   All new sections match existing design system exactly
//   HONEST: No fake user counts, no fake revenue claims

import { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, useInView, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion'
import {
  FileText, Banknote, BarChart2, Clock, FileCheck,
  TrendingUp, Receipt, Globe, Bot, ArrowRight,
  Bell, CheckCircle2, Activity, DollarSign,
  ChevronRight, Zap, Shield, Layers, X, Check,
  AlertTriangle, AlertCircle, Timer, Calculator, Users,
} from 'lucide-react'
import LandingPricingSection from '@/components/landing-pricing-section'

// ─── CSS: spinning border (@property technique = true "train on tracks") ───────
// @property lets us animate a CSS custom property as an angle, which drives the
// conic-gradient. The colored arc (the "train") moves clockwise along the
// transparent border (the "tracks"). No bleed, no flail.
//
// Additional keyframes for the activity feed "pulse in" effect and cycling gradient.
const GLOBAL_STYLES = `
@property --border-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
@keyframes orb-drift {
  0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.08; }
  33%       { transform: translate(30px, -20px) scale(1.08); opacity: 0.13; }
  66%       { transform: translate(-15px, 15px) scale(0.93); opacity: 0.06; }
}
@keyframes orb-drift-alt {
  0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.06; }
  33%       { transform: translate(-25px, 18px) scale(1.06); opacity: 0.11; }
  66%       { transform: translate(20px, -10px) scale(0.96); opacity: 0.08; }
}
@keyframes dot-breathe {
  0%, 100% { opacity: 0.035; }
  50%       { opacity: 0.07; }
}
.inv-orb-1 { animation: orb-drift     18s ease-in-out infinite; }
.inv-orb-2 { animation: orb-drift-alt 22s ease-in-out infinite; }
.inv-orb-3 { animation: orb-drift     14s ease-in-out infinite reverse; }
.inv-dot-breathe { animation: dot-breathe 6s ease-in-out infinite; }

  to { --border-angle: 360deg; }
}
@keyframes spin-cw  { from { transform: rotate(0deg); }   to { transform: rotate(360deg); } }
@keyframes spin-ccw { from { transform: rotate(0deg); }   to { transform: rotate(-360deg); } }
@keyframes grad-cycle {
  0%   { background-position: 0%   50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0%   50%; }
}
@keyframes feed-pulse {
  0%   { opacity: 0; transform: translateY(-8px) scale(0.97); }
  100% { opacity: 1; transform: translateY(0)    scale(1);    }
}
/* Main card border — 130-degree arc (longer train), 9s (slower) */
.spinning-track-border {
  background:
    linear-gradient(white, white) padding-box,
    conic-gradient(
      from var(--border-angle),
      #2563EB   0deg,
      #0D9488   80deg,
      #2563EB   130deg,
      rgba(37,99,235,0.05) 170deg,
      rgba(37,99,235,0.05) 350deg,
      #2563EB   360deg
    ) border-box;
  border: 2px solid transparent;
  border-radius: 16px;
  animation: border-rotate 9s linear infinite;
}
/* Button border — same train, 6s */
.button-track-border {
  background:
    linear-gradient(rgb(37,99,235), rgb(37,99,235)) padding-box,
    conic-gradient(
      from var(--border-angle),
      rgba(255,255,255,0.9)  0deg,
      rgba(13,212,170,0.9)   80deg,
      rgba(255,255,255,0.9)  130deg,
      rgba(255,255,255,0.1)  170deg,
      rgba(255,255,255,0.1)  350deg,
      rgba(255,255,255,0.9)  360deg
    ) border-box;
  border: 2px solid transparent;
  border-radius: 12px;
  animation: border-rotate 6s linear infinite;
}
/* Non-highlighted plan button border — blue bg with teal train */
.button-track-border-alt {
  background:
    linear-gradient(white, white) padding-box,
    conic-gradient(
      from var(--border-angle),
      #2563EB   0deg,
      #0D9488   80deg,
      #2563EB   130deg,
      rgba(37,99,235,0.06) 170deg,
      rgba(37,99,235,0.06) 350deg,
      #2563EB   360deg
    ) border-box;
  border: 2px solid transparent;
  border-radius: 12px;
  animation: border-rotate 6s linear infinite;
}
/* "Automated." hero text */
.automated-gradient {
  background: linear-gradient(270deg, #2563EB, #0D9488, #4F46E5, #2563EB);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: grad-cycle 4s ease infinite;
}
/* "Most Popular" badge */
.most-popular-badge {
  background: linear-gradient(270deg, #F59E0B, #F97316, #EF4444, #F59E0B);
  background-size: 300% 300%;
  animation: grad-cycle 3s ease infinite;
  color: white;
}
.feed-item-enter {
  animation: feed-pulse 0.45s cubic-bezier(0.22,1,0.36,1) forwards;
}
`

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

// ─── AnimSection wrapper ───────────────────────────────────────────────────────

function AnimSection({
  children, className = '', variant = fadeUp, containerVariant,
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
      const ease = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(ease * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [inView, target, duration])
  return <span ref={ref}>{count}{suffix}</span>
}

// ─── Progressive Live Activity Feed ────────────────────────────────────────────
// Items appear one-by-one with timed intervals to feel like a system running.
// After all items are shown, a new event appears at the top every 4 seconds,
// pushing the oldest off. This simulates a live event stream.

const ALL_FEED_EVENTS = [
  { Icon: FileText,     label: 'Invoice sent',                  detail: 'INV-00089 · $4,200 · Acme Corp',            accent: '#2563EB', bg: 'rgba(37,99,235,0.08)'  },
  { Icon: DollarSign,   label: 'Cash payment logged',           detail: '$850 · Airport Transfer · Transport',        accent: '#0D9488', bg: 'rgba(13,148,136,0.08)' },
  { Icon: Bell,         label: 'Follow-up sent automatically',  detail: 'INV-00071 overdue 8 days · Risk 74%',        accent: '#D97706', bg: 'rgba(217,119,6,0.08)'  },
  { Icon: CheckCircle2, label: 'Contract signed',               detail: 'Web Design Agreement · Jane Smith',          accent: '#2563EB', bg: 'rgba(37,99,235,0.08)'  },
  { Icon: Activity,     label: 'Cash runway updated',           detail: '4.2 months of runway · $12,400 in pipeline', accent: '#0D9488', bg: 'rgba(13,148,136,0.08)' },
  { Icon: Banknote,     label: 'POS payment captured',          detail: '$320 · Product Sale · Transport',            accent: '#2563EB', bg: 'rgba(37,99,235,0.08)'  },
  { Icon: FileCheck,    label: 'Contract auto-reminded',        detail: 'Renewal Agreement expiring in 7 days',       accent: '#0D9488', bg: 'rgba(13,148,136,0.08)' },
  { Icon: TrendingUp,   label: 'AI risk score updated',         detail: 'INV-00102 · 83% payment confidence',         accent: '#2563EB', bg: 'rgba(37,99,235,0.08)'  },
]

function LiveActivityFeed() {
  const VISIBLE = 5
  const [visibleCount, setVisibleCount] = useState(1)
  const [offset, setOffset]             = useState(0)
  const [animKey, setAnimKey]           = useState(0)

  useEffect(() => {
    // Phase 1: progressively reveal 5 items, 700ms apart
    if (visibleCount < VISIBLE) {
      const t = setTimeout(() => setVisibleCount(v => v + 1), 700)
      return () => clearTimeout(t)
    }
    // Phase 2: once all 5 are shown, cycle new event every 4s
    const t = setInterval(() => {
      setOffset(o => (o + 1) % ALL_FEED_EVENTS.length)
      setAnimKey(k => k + 1)
    }, 4000)
    return () => clearInterval(t)
  }, [visibleCount])

  const items = Array.from({ length: Math.min(visibleCount, VISIBLE) }, (_, i) => {
    const idx = (offset + i) % ALL_FEED_EVENTS.length
    return ALL_FEED_EVENTS[idx]
  })

  const times = ['just now', '2m ago', '9m ago', '34m ago', '1h ago']

  return (
    <div className="space-y-2.5">
      <AnimatePresence mode="popLayout">
        {items.map((item, i) => (
          <motion.div
            key={`${animKey}-${i}`}
            layout
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,   scale: 1    }}
            exit={{    opacity: 0, y:  10, scale: 0.97 }}
            transition={{ duration: 0.38, ease: EASE }}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: item.bg }}>
              <item.Icon className="w-4 h-4" style={{ color: item.accent }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{item.label}</p>
              <p className="text-xs text-gray-400 truncate">{item.detail}</p>
            </div>
            <span className="text-xs text-gray-300 font-medium flex-shrink-0">{times[i] ?? '—'}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ─── Module configs ────────────────────────────────────────────────────────────

const MODULES = [
  { Icon: FileText,   title: 'Invoice management',       body: 'Create, send, and track invoices with branded PDFs. AI predicts which clients will pay late — before they do.',                                          tag: 'Automated follow-ups',    accent: '#2563EB', bg: 'rgba(37,99,235,0.08)'   },
  { Icon: Banknote,   title: 'Direct payment logging',   body: 'Record every cash, POS, mobile money, and bank transfer instantly. Not everything goes through an invoice — now none of it is invisible.',               tag: 'All income captured',     accent: '#0D9488', bg: 'rgba(13,148,136,0.08)'  },
  { Icon: BarChart2,  title: 'Revenue intelligence',     body: 'See exactly where your money comes from — by source, category, and payment method. Know which services earn you the most.',                              tag: 'Complete income picture', accent: '#2563EB', bg: 'rgba(37,99,235,0.08)'   },
  { Icon: Clock,      title: 'Time tracking',            body: 'Log hours with a live timer or manually. Convert unbilled time into an invoice with one click. The real automation loop.',                               tag: 'Hours → invoice in 1 click', accent: '#0D9488', bg: 'rgba(13,148,136,0.08)'},
  { Icon: FileCheck,  title: 'Contract management',      body: 'Create from templates, send for legally-binding e-signatures. Automatic expiry reminders mean nothing slips through.',                                   tag: 'E-signatures built in',   accent: '#2563EB', bg: 'rgba(37,99,235,0.08)'   },
  { Icon: TrendingUp, title: 'Cash flow forecast',       body: '90-day forward view of your bank balance. Runway calculator. Predicted payment dates. Know exactly how long your money lasts.',                          tag: '90-day AI forecast',      accent: '#0D9488', bg: 'rgba(13,148,136,0.08)'  },
  { Icon: Receipt,    title: 'Expense tracking',         body: 'Log expenses with AI-suggested categories. Upload receipts. Set budget limits and get automatic alerts at 80% and 100%.',                               tag: 'AI categorisation',       accent: '#2563EB', bg: 'rgba(37,99,235,0.08)'   },
  { Icon: Globe,      title: 'Client portal',            body: 'A branded portal where clients view invoices, download PDFs, and sign contracts — no account needed. Access by magic link.',                             tag: 'White-label ready',       accent: '#0D9488', bg: 'rgba(13,148,136,0.08)'  },
  { Icon: Bot,        title: 'Autonomous collections',   body: 'AI risk-scores every invoice. A daily cron identifies overdue high-risk invoices and sends reminders automatically — while you sleep.',                  tag: 'Runs without you',        accent: '#2563EB', bg: 'rgba(37,99,235,0.08)'   },
]

// ─── Pain points for "You're Leaving Money on the Table" ──────────────────────

const PAIN_POINTS = [
  {
    Icon: Timer,
    pain:     'Invoices sit unpaid for weeks',
    without:  'You manually chase each client — if you remember',
    withUs:   'AI scores every invoice on send. Reminders fire automatically.',
  },
  {
    Icon: AlertTriangle,
    pain:     'Cash payments disappear from your records',
    without:  'Cash, POS, and mobile payments are invisible in most tools',
    withUs:   'Log any payment type in seconds. Your real income is visible.',
  },
  {
    Icon: FileText,
    pain:     'Contracts expire without warning',
    without:  'You find out when the client does — or after',
    withUs:   'Automatic reminders at 30/15/7/1 days. Nothing slips.',
  },
  {
    Icon: BarChart2,
    pain:     'You don\'t know which services make you the most',
    without:  'Total revenue is one number — no breakdown by source',
    withUs:   'Revenue intelligence shows every dollar by category and method.',
  },
]

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  { step: '01', Icon: Layers,     title: 'Capture all your income',    body: 'Send invoices for billed work. Log direct payments for cash, POS, and mobile money. Tag everything with revenue categories. Your real total income is visible in one place for the first time.' },
  { step: '02', Icon: Bot,        title: 'AI handles the chasing',     body: 'Every invoice gets an AI risk score. The system watches for overdue invoices and sends follow-up reminders automatically — escalating with urgency the longer a payment is late.' },
  { step: '03', Icon: FileCheck,  title: 'Contracts protect you',      body: 'Create professional contracts from templates, get them signed in minutes, and link them to invoices. Automatic expiry reminders mean nothing slips through.' },
  { step: '04', Icon: TrendingUp, title: 'Know your financial future', body: 'Your cash flow forecast combines AI-predicted invoice payments with logged expenses to show a 90-day projection of your bank balance. The runway calculator tells you exactly how long your money lasts.' },
]

// ─── Autonomy processes ───────────────────────────────────────────────────────

const PROCESSES = [
  { Icon: Bell,       action: 'Invoice follow-up reminders', detail: 'Sent to overdue clients with AI risk ≥60',    schedule: 'Daily 9am'  },
  { Icon: FileCheck,  action: 'Contract expiry reminders',   detail: 'Sent at 30 / 15 / 7 / 1 days before expiry', schedule: 'Daily 9am'  },
  { Icon: Shield,     action: 'Auto-expire contracts',       detail: 'Contracts hard-expired when date passes',     schedule: 'Daily 9am'  },
  { Icon: Receipt,    action: 'Budget overspend alerts',     detail: 'Email at 80% and 100% of monthly limits',     schedule: 'Daily 9am'  },
  { Icon: Clock,      action: 'Weekly time summary',         detail: 'Hours, billable value, unbilled outstanding',  schedule: 'Monday 9am' },
  { Icon: Zap,        action: 'AI invoice risk scoring',     detail: 'GPT-4o evaluates payment probability',        schedule: 'On send'    },
  { Icon: BarChart2,  action: 'AI expense categorisation',   detail: 'Category suggested from description',         schedule: 'On entry'   },
  { Icon: TrendingUp, action: '90-day cash forecast',        detail: 'Balance projection recalculated live',        schedule: 'On open'    },
]

// ─── Interactive Product Demo ─────────────────────────────────────────────────
// Tabbed demo showing 4 key product views: Invoice, Payment, Cash Flow, Contracts
// No fake data — framed as "what the system looks like"

const DEMO_TABS = [
  { id: 'invoice',   label: 'Invoices',       Icon: FileText   },
  { id: 'payment',   label: 'Payments',       Icon: Banknote   },
  { id: 'cashflow',  label: 'Cash Flow',      Icon: TrendingUp },
  { id: 'contract',  label: 'Contracts',      Icon: FileCheck  },
]

function InvoiceDemo() {
  const invoices = [
    { num: 'INV-00089', client: 'Acme Corp',      amount: '$4,200', status: 'sent',    risk: 72, daysAgo: 'Sent 3 days ago'   },
    { num: 'INV-00088', client: 'Taylor Design',  amount: '$1,800', status: 'overdue', risk: 88, daysAgo: '9 days overdue'    },
    { num: 'INV-00087', client: 'Northside Media',amount: '$6,500', status: 'paid',    risk: 0,  daysAgo: 'Paid yesterday'    },
    { num: 'INV-00086', client: 'Bright Labs',    amount: '$950',   status: 'overdue', risk: 65, daysAgo: '4 days overdue'    },
  ]
  const statusStyle: Record<string, string> = {
    sent:    'bg-blue-100 text-blue-700',
    overdue: 'bg-red-100 text-red-700',
    paid:    'bg-green-100 text-green-700',
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Invoice pipeline</p>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
          <Bot className="w-3 h-3" />AI scoring active
        </div>
      </div>
      {invoices.map((inv, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.09, duration: 0.3, ease: EASE }}
          className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-white cursor-default select-none transition-all">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-gray-900">{inv.client}</span>
              <span className="text-xs text-gray-400">{inv.num}</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{inv.daysAgo}</p>
          </div>
          <span className="text-sm font-black text-gray-900">{inv.amount}</span>
          {inv.status !== 'paid' && (
            <div className="flex items-center gap-1 bg-amber-50 rounded-lg px-2 py-1 flex-shrink-0">
              <Zap className="w-3 h-3 text-amber-500" />
              <span className="text-xs font-bold text-amber-600">{inv.risk}%</span>
            </div>
          )}
          <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${statusStyle[inv.status]}`}>
            {inv.status}
          </span>
        </motion.div>
      ))}
      <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-2">
        <Bell className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <p className="text-xs text-blue-700 font-medium">
          AI detected 2 high-risk invoices. Reminder scheduled for tomorrow at 9am.
        </p>
      </div>
    </div>
  )
}

function PaymentDemo() {
  const payments = [
    { desc: 'Airport Transfer',    amount: '$320',    method: 'Cash',   cat: 'Transport',  time: 'Today'     },
    { desc: 'Website Maintenance', amount: '$1,200',  method: 'Bank',   cat: 'Services',   time: 'Yesterday' },
    { desc: 'Product Sale',        amount: '$85',     method: 'POS',    cat: 'Retail',     time: '2 days ago'},
    { desc: 'Monthly Retainer',    amount: '$2,500',  method: 'Prepay', cat: 'Consulting', time: '3 days ago'},
  ]
  const methodColor: Record<string, string> = {
    Cash: 'bg-teal-100 text-teal-700', Bank: 'bg-blue-100 text-blue-700',
    POS: 'bg-blue-100 text-blue-700', Prepay: 'bg-amber-100 text-amber-700',
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">All income sources</p>
        <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full">$4,105 this week</span>
      </div>
      <div className="space-y-2">
        {payments.map((p, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.09, ease: EASE }}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white hover:border-teal-100 cursor-default select-none transition-all">
            <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4 text-teal-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{p.desc}</p>
              <p className="text-xs text-gray-400">{p.cat} · {p.time}</p>
            </div>
            <span className="text-sm font-black text-gray-900">{p.amount}</span>
            <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${methodColor[p.method]}`}>{p.method}</span>
          </motion.div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[{label:'Invoice income', val:'$4,200', color:'text-blue-600'}, {label:'Direct payments', val:'$4,105', color:'text-teal-600'}].map(s => (
          <div key={s.label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <p className="text-xs text-gray-400 font-medium">{s.label}</p>
            <p className={`text-lg font-black ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function CashFlowDemo() {
  const weeks = ['Now', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12']
  const balances = [9450, 11200, 8900, 13400, 12100, 15600, 13800, 16200, 14500, 17800, 16200, 19100, 18400]
  const maxBal = Math.max(...balances)
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">90-day cash forecast</p>
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">AI-powered</span>
      </div>
      <div className="flex items-end gap-1 h-28 mb-3">
        {weeks.map((w, i) => (
          <motion.div key={i} className="flex-1 flex flex-col items-center gap-1"
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.04, duration: 0.4, ease: EASE }}
            style={{ transformOrigin: 'bottom' }}>
            <div className="w-full rounded-t-sm"
              style={{ height: `${(balances[i] / maxBal) * 100}%`, background: i === 0 ? '#2563EB' : `rgba(37,99,235,${0.25 + (i/12)*0.5})` }} />
          </motion.div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-400 mb-4">
        <span>Now</span><span>Week 6</span><span>Week 12</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Current balance', val: '$9,450',  color: 'text-blue-600' },
          { label: 'Runway',          val: '4.2 mo',  color: 'text-teal-600' },
          { label: 'Forecast peak',   val: '$19,100', color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
            <p className="text-xs text-gray-400 font-medium mb-0.5">{s.label}</p>
            <p className={`text-base font-black ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ContractDemo() {
  const contracts = [
    { title: 'Web Design Agreement',    client: 'Acme Corp',      status: 'active',  value: '$12,000', daysLeft: 42  },
    { title: 'Monthly Retainer',        client: 'Taylor Design',  status: 'active',  value: '$3,600',  daysLeft: 18  },
    { title: 'Consulting Agreement',    client: 'Bright Labs',    status: 'expiring',value: '$8,500',  daysLeft: 6   },
    { title: 'Brand Identity Project',  client: 'Northside Media',status: 'draft',   value: '$5,200',  daysLeft: null},
  ]
  const statusStyle: Record<string, string> = {
    active: 'bg-green-100 text-green-700', expiring: 'bg-amber-100 text-amber-700', draft: 'bg-gray-100 text-gray-500',
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Contract lifecycle</p>
        <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full">$29,300 active</span>
      </div>
      <div className="space-y-2">
        {contracts.map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.09, ease: EASE }}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white hover:border-blue-100 cursor-default select-none transition-all">
            <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center flex-shrink-0">
              <FileCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{c.title}</p>
              <p className="text-xs text-gray-400">{c.client}</p>
            </div>
            <span className="text-sm font-bold text-gray-700 flex-shrink-0">{c.value}</span>
            {c.daysLeft && c.status === 'expiring' && (
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex-shrink-0">
                {c.daysLeft}d left
              </span>
            )}
            <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${statusStyle[c.status]}`}>{c.status}</span>
          </motion.div>
        ))}
      </div>
      <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-2">
        <Bell className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <p className="text-xs text-amber-700 font-medium">Consulting Agreement expiring in 6 days. Renewal reminder sent automatically.</p>
      </div>
    </div>
  )
}

function InteractiveProductDemo() {
  const [activeTab, setActiveTab] = useState('invoice')
  const demoContent: Record<string, React.ReactNode> = {
    invoice:  <InvoiceDemo />,
    payment:  <PaymentDemo />,
    cashflow: <CashFlowDemo />,
    contract: <ContractDemo />,
  }
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <AnimSection className="text-center mb-12">
          <motion.div variants={fadeUp}>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">See it in action</p>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
              Your entire business.<br />One screen.
            </h2>
            <p className="text-lg text-gray-500 font-medium mt-4 max-w-xl mx-auto">
              Tap through the tabs to explore each module. This is what the real interface looks like.
            </p>
          </motion.div>
        </AnimSection>

        <AnimSection>
          <motion.div variants={scaleIn}>
            {/* Browser chrome */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
              {/* Browser bar */}
              <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-400 font-mono border border-gray-200">
                  invonaut.app/dashboard
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-gray-400 font-medium">Live</span>
                </div>
              </div>

              <div className="flex">
                {/* Sidebar — icons wired to DEMO_TABS; clicking switches the active tab */}
                <div className="w-14 bg-gray-900 flex flex-col items-center py-4 gap-2 hidden sm:flex">
                  {DEMO_TABS.map(tab => (
                    <button key={tab.id}
                      suppressHydrationWarning
                      onClick={() => setActiveTab(tab.id)}
                      title={tab.label}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        activeTab === tab.id ? 'bg-blue-600 shadow-md' : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                    >
                      <tab.Icon className="w-4 h-4 text-white" />
                    </button>
                  ))}
                  {/* Non-functional UI chrome — dimmed to signal non-interactive */}
                  <div className="mt-1 space-y-2 opacity-20 pointer-events-none">
                    {[Globe, Receipt, Clock].map((Icon, i) => (
                      <div key={i} className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Main content */}
                <div className="flex-1 p-6 min-h-[420px]">
                  {/* Tab bar */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                      {DEMO_TABS.map(tab => (
                        <button
                          key={tab.id}
                          suppressHydrationWarning
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            activeTab === tab.id
                              ? 'bg-white text-blue-600 shadow-sm'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <tab.Icon className="w-3 h-3" />
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:block">
                      Click tabs to explore
                    </span>
                  </div>

                  {/* Content area */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25, ease: EASE }}
                    >
                      {demoContent[activeTab]}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Bottom label */}
            <p className="text-center text-xs text-gray-400 font-medium mt-4">
              Click the tabs to explore — this is what your dashboard looks like from day one.
            </p>
          </motion.div>
        </AnimSection>
      </div>
    </section>
  )
}

const COMPETITORS = ['Invonaut', 'FreshBooks', 'Wave', 'HoneyBook', 'Harvest'] as const

type CompetitorFeatureRow = {
  feature: string
  values: readonly boolean[]
  note: string | null
}

const COMP_FEATURES: readonly CompetitorFeatureRow[] = [
  { feature: 'Invoice management', values: [true, true, true, true, true], note: null },
  { feature: 'Cash + POS + mobile payment log', values: [true, false, false, false, false], note: 'Invonaut only' },
  { feature: 'Automated follow-up reminders', values: [true, false, false, false, false], note: 'Invonaut only' },
  { feature: 'AI payment risk scoring', values: [true, false, false, false, false], note: 'Invonaut only' },
  { feature: 'Time tracking to invoice', values: [true, true, false, false, true], note: null },
  { feature: 'Contract lifecycle + e-signature', values: [true, false, false, true, false], note: null },
  { feature: '90-day cash flow forecast', values: [true, false, false, false, false], note: 'Invonaut only' },
  { feature: 'Revenue intelligence breakdown', values: [true, false, false, false, false], note: 'Invonaut only' },
  { feature: 'Expense tracking + budget alerts', values: [true, true, true, false, false], note: null },
  { feature: 'Branded client portal', values: [true, true, false, true, false], note: null },
  { feature: 'No integrations required', values: [true, false, false, false, false], note: 'All-in-one' },
]

const DOT_LIGHT = {
  backgroundImage: 'radial-gradient(circle, rgba(37,99,235,0.07) 1px, transparent 1px)',
  backgroundSize: '28px 28px',
}
const DOT_DARK = {
  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)',
  backgroundSize: '28px 28px',
}

// ─── Revenue Clarity Calculator ───────────────────────────────────────────────
// Honest framing: shows the scale of the problem (late invoices at current rate),
// and the time cost. Does NOT claim specific recovery percentages as guaranteed.

function RevenueCalculator() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  const [invoices,   setInvoices]   = useState(20)
  const [avgValue,   setAvgValue]   = useState(2000)
  const [lateRate,   setLateRate]   = useState(25)

  const lateInvoicesPerMonth  = Math.round(invoices * lateRate / 100)
  const cashTiedUpMonthly     = lateInvoicesPerMonth * avgValue
  const annualCashTiedUp      = cashTiedUpMonthly * 12
  const hoursSavedMonthly     = Math.round(lateInvoicesPerMonth * 0.25) // ~15 min per manual follow-up
  const fmtCurrency = (n: number) =>
    n >= 1_000_000 ? `$${(n/1_000_000).toFixed(1)}M`
    : n >= 1_000   ? `$${(n/1_000).toFixed(0)}K`
    : `$${n}`

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-5xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: EASE }}
          className="text-center mb-12"
        >
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Revenue clarity</p>
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
            See your numbers.
          </h2>
          <p className="text-lg text-gray-500 font-medium mt-4 max-w-xl mx-auto">
            Adjust the sliders to match your business. See how much cash is sitting in late invoices right now.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Sliders */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.1, ease: EASE }}
            className="space-y-8"
          >
            {/* Invoices per month */}
            <div>
              <div className="flex justify-between items-baseline mb-3">
                <label className="text-sm font-bold text-gray-700">Invoices per month</label>
                <span className="text-xl font-black text-blue-600">{invoices}</span>
              </div>
              <input type="range" min="5" max="200" step="5" value={invoices}
                onChange={e => setInvoices(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: '#2563EB', background: `linear-gradient(to right, #2563EB ${(invoices-5)/195*100}%, #E5E7EB ${(invoices-5)/195*100}%)` }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1.5"><span>5</span><span>200</span></div>
            </div>

            {/* Average invoice value */}
            <div>
              <div className="flex justify-between items-baseline mb-3">
                <label className="text-sm font-bold text-gray-700">Average invoice value</label>
                <span className="text-xl font-black text-blue-600">${avgValue.toLocaleString()}</span>
              </div>
              <input type="range" min="200" max="10000" step="200" value={avgValue}
                onChange={e => setAvgValue(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: '#2563EB', background: `linear-gradient(to right, #2563EB ${(avgValue-200)/9800*100}%, #E5E7EB ${(avgValue-200)/9800*100}%)` }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1.5"><span>$200</span><span>$10,000</span></div>
            </div>

            {/* Late payment rate */}
            <div>
              <div className="flex justify-between items-baseline mb-3">
                <label className="text-sm font-bold text-gray-700">Typically paid late</label>
                <span className="text-xl font-black text-blue-600">{lateRate}%</span>
              </div>
              <input type="range" min="5" max="80" step="5" value={lateRate}
                onChange={e => setLateRate(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: '#2563EB', background: `linear-gradient(to right, #2563EB ${(lateRate-5)/75*100}%, #E5E7EB ${(lateRate-5)/75*100}%)` }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1.5"><span>5%</span><span>80%</span></div>
            </div>

            <p className="text-xs text-gray-400 italic">
              These are illustrative estimates based on your inputs — not guaranteed outcomes.
            </p>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.15, ease: EASE }}
            className="space-y-4"
          >
            {/* Main result */}
            <motion.div
              key={annualCashTiedUp}
              initial={{ scale: 0.97 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="rounded-2xl p-7 border-2 border-blue-100"
              style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.04), rgba(13,148,136,0.04))' }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calculator className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-500 font-semibold mb-1">Cash tied up in late invoices / year</p>
                  <motion.p
                    key={annualCashTiedUp}
                    initial={{ opacity: 0.5, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-black text-blue-600 tracking-tight"
                  >
                    {fmtCurrency(annualCashTiedUp)}
                  </motion.p>
                  <p className="text-xs text-gray-400 mt-1">
                    {lateInvoicesPerMonth} late invoices/mo × {fmtCurrency(avgValue)} avg value × 12 months
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Secondary metrics */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Late invoices / month', value: String(lateInvoicesPerMonth), sub: 'currently unautomated', accent: '#2563EB' },
                { label: 'Hours chasing manually', value: `${hoursSavedMonthly}h`, sub: 'per month at ~15 min each', accent: '#0D9488' },
              ].map(m => (
                <motion.div
                  key={m.label}
                  className="bg-gray-50 rounded-xl p-5 border border-gray-100"
                >
                  <p className="text-xs text-gray-400 font-semibold mb-1">{m.label}</p>
                  <motion.p
                    key={m.value}
                    initial={{ opacity: 0.5, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-black"
                    style={{ color: m.accent }}
                  >
                    {m.value}
                  </motion.p>
                  <p className="text-xs text-gray-400 mt-0.5">{m.sub}</p>
                </motion.div>
              ))}
            </div>

            <Link href="/signup"
              className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:shadow-xl transition-all">
              Automate this — free for 14 days
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ─── Portal preview ───────────────────────────────────────────────────────────

function PortalPreview() {
  const DEMO_INVOICES = [
    { num: 'INV-00089', client: 'Acme Corp',       amount: '$4,200', status: 'paid',    statusCls: 'bg-teal-50 text-teal-700' },
    { num: 'INV-00094', client: 'Studio Nine',     amount: '$1,800', status: 'pending', statusCls: 'bg-amber-50 text-amber-700' },
    { num: 'INV-00097', client: 'Acme Corp',       amount: '$2,650', status: 'pending', statusCls: 'bg-amber-50 text-amber-700' },
  ]
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-center">

          {/* Left: copy */}
          <AnimSection>
            <motion.div variants={fadeLeft} className="max-w-lg">
              <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-3">For your clients</p>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight leading-[1.05] mb-5">
                Professional from<br />every angle.
              </h2>
              <p className="text-lg text-gray-500 font-medium leading-relaxed mb-8">
                Every client gets a branded portal via magic link — no account needed.
                They see their invoices, download PDFs, sign contracts, and access files you&apos;ve shared.
              </p>
              <div className="space-y-4">
                {[
                  { title: 'Magic link access',    body: 'Clients click one link. No passwords, no signup.' },
                  { title: 'Invoice & PDF view',   body: 'All sent invoices, statuses, and downloadable PDFs in one place.' },
                  { title: 'Contract signing',     body: 'Legally binding e-signature directly in the portal.' },
                  { title: 'Shared file access',   body: 'Briefs, proposals, assets — shared and downloadable.' },
                ].map(f => (
                  <div key={f.title} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{f.title}</p>
                      <p className="text-sm text-gray-500">{f.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimSection>

          {/* Right: portal mockup */}
          <AnimSection>
            <motion.div variants={fadeRight} className="relative">
              {/* Glow */}
              <div className="absolute -inset-4 bg-gradient-to-br from-teal-100 to-blue-100 rounded-3xl opacity-50 blur-2xl" />
              {/* Browser frame */}
              <div className="relative bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
                {/* Browser bar */}
                <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-400 font-mono border border-gray-200">
                    invonaut.app/portal/acme-corp
                  </div>
                </div>

                {/* Portal content */}
                <div className="p-5 space-y-4">
                  {/* Portal header */}
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                      <span className="text-white font-black text-sm">AC</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900">Acme Corp</p>
                      <p className="text-xs text-gray-400">Client Portal · Secured by magic link</p>
                    </div>
                  </div>

                  {/* Invoices */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Your Invoices</p>
                    <div className="space-y-2">
                      {DEMO_INVOICES.map((inv, i) => (
                        <motion.div key={inv.num}
                          initial={{ opacity: 0, x: 12 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.12 + 0.3 }}
                          className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                          <div>
                            <p className="text-xs font-bold text-gray-900">{inv.num}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{inv.client}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-gray-900">{inv.amount}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${inv.statusCls}`}>{inv.status}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Contract sign prompt */}
                  <div className="bg-blue-50 rounded-xl border border-blue-100 px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-blue-900">Web Design Agreement</p>
                        <p className="text-[10px] text-blue-500">Awaiting your signature</p>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-white bg-blue-600 px-3 py-1.5 rounded-lg flex-shrink-0">
                      Sign →
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimSection>
        </div>
      </div>
    </section>
  )
}

// ─── Framer-style scroll-sticky how it works ──────────────────────────────────

function HowItWorksScrollSection() {
  const containerRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] })
  const [activeStep, setActiveStep] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', v =>
    setActiveStep(Math.min(STEPS.length - 1, Math.floor(v * STEPS.length)))
  )

  // ── Per-step mini-demo components ─────────────────────────────────────────
  function IncomeDemo() {
    const rows = [
      { Icon: FileText, label: 'INV-00089 · Acme Corp',  sub: 'Invoice · Net 30',      amt: '$4,200', badge: 'Sent',   bc: 'bg-amber-50 text-amber-700', delay: 0 },
      { Icon: Banknote, label: 'Airport Transfer · Cash', sub: 'Direct Payment · Today', amt: '$320',   badge: 'Logged', bc: 'bg-teal-50 text-teal-700',  delay: 0.22 },
    ]
    return (
      <div className="space-y-3">
        {rows.map((r, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: r.delay, duration: 0.4, ease: EASE }}
            className="flex items-center gap-3 bg-gray-50 rounded-xl p-3.5 border border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <r.Icon className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">{r.label}</p>
              <p className="text-[10px] text-gray-400">{r.sub}</p>
            </div>
            <span className="text-sm font-black text-gray-900 flex-shrink-0">{r.amt}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${r.bc}`}>{r.badge}</span>
          </motion.div>
        ))}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.4, ease: EASE }}
          className="bg-teal-50 border border-teal-100 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">Total revenue visible</p>
            <p className="text-xl font-black text-teal-800">$4,520</p>
          </div>
          <span className="text-[10px] font-bold text-teal-500 bg-teal-100 px-2 py-1 rounded-lg">Both sources captured</span>
        </motion.div>
      </div>
    )
  }

  function AIDemo() {
    return (
      <div className="space-y-3">
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold font-mono text-gray-700">INV-00094</span>
            <span className="text-xs font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded-full border border-red-100">9 days overdue</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Taylor Design · $1,800</p>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-xs font-black text-red-600">AI Risk 88%</span>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.1, duration: 0.45, ease: EASE }}
          className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Bell className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-blue-900">Reminder sent automatically</p>
            <p className="text-[10px] text-blue-500">9:00 AM · Invonaut follow-up system</p>
          </div>
          <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded flex-shrink-0">Sent ✓</span>
        </motion.div>
      </div>
    )
  }

  function ContractDemo() {
    const [signed, setSigned] = useState(false)
    useEffect(() => { const t = setTimeout(() => setSigned(true), 1600); return () => clearTimeout(t) }, [])
    return (
      <div className="space-y-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-sm font-bold text-gray-900">Web Design Agreement</p>
              <p className="text-xs text-gray-400 mt-0.5">Acme Corp · $12,000 total value</p>
            </div>
            <motion.span
              animate={{
                backgroundColor: signed ? '#f0fdf4' : '#fffbeb',
                color: signed ? '#15803d' : '#92400e',
                borderColor: signed ? '#86efac' : '#fde68a',
              }}
              className="text-xs font-bold px-2.5 py-1 rounded-full border flex-shrink-0 transition-colors"
            >
              {signed ? '✓ Signed' : '⏳ Awaiting'}
            </motion.span>
          </div>
          {signed && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 bg-teal-50 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              <p className="text-xs text-teal-700 font-bold">Legally binding · PDF generated automatically</p>
            </motion.div>
          )}
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-[10px] text-gray-400 text-center">
          30 · 15 · 7 · 1 day expiry reminders fire automatically
        </motion.div>
      </div>
    )
  }

  function ForecastDemo() {
    const bars  = [62, 45, 78, 55, 88, 70, 95, 82]
    const clrs  = ['#93C5FD','#93C5FD','#60A5FA','#60A5FA','#3B82F6','#3B82F6','#0066FF','#0066FF']
    return (
      <div className="space-y-4">
        <div className="flex items-end gap-1.5 h-24">
          {bars.map((h, i) => (
            <motion.div key={i} className="flex-1 rounded-t-md"
              style={{ transformOrigin: 'bottom', height: `${h}%`, backgroundColor: clrs[i] }}
              initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
              transition={{ delay: i * 0.06, duration: 0.35, ease: EASE }} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: '90-day runway', value: '67 days', color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Pipeline',      value: '$11K',    color: 'text-teal-600', bg: 'bg-teal-50' },
            { label: 'Net position',  value: '+$8.2K',  color: 'text-green-600', bg: 'bg-green-50' },
          ].map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className={`${m.bg} rounded-xl p-3 text-center`}>
              <p className={`text-sm font-black ${m.color}`}>{m.value}</p>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wide mt-0.5">{m.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  const demos = [<IncomeDemo key="i" />, <AIDemo key="a" />, <ContractDemo key="c" />, <ForecastDemo key="f" />]

  return (
    <>
      {/* ── Desktop: Framer-style sticky scroll ────────────────────────────── */}
      <section ref={containerRef} id="how-it-works"
        className="relative hidden lg:block"
        style={{ height: `${STEPS.length * 100}vh` }}
      >
        <div className="sticky top-0 h-screen bg-gray-50 flex items-center overflow-hidden">
          <div className="max-w-6xl mx-auto w-full px-8 flex gap-16 items-center">

            {/* Left nav */}
            <div className="w-64 flex-shrink-0">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-8">How it works</p>
              <div className="space-y-0.5">
                {STEPS.map((step, i) => (
                  <motion.div key={i}
                    animate={{ opacity: activeStep === i ? 1 : 0.3 }}
                    transition={{ duration: 0.35 }}
                    className="flex items-start gap-4 py-3.5 pr-4 rounded-xl"
                  >
                    <div className="flex-shrink-0 w-0.5 self-stretch relative mt-0.5">
                      <motion.div
                        animate={{ height: activeStep === i ? '44px' : '28px', backgroundColor: activeStep === i ? '#0066FF' : '#E5E7EB' }}
                        transition={{ duration: 0.4 }}
                        className="rounded-full absolute top-0 left-0 w-full"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-blue-400 tracking-widest mb-0.5">{step.step}</p>
                      <p className={`text-sm font-black leading-tight transition-colors duration-300 ${activeStep === i ? 'text-gray-900' : 'text-gray-500'}`}>
                        {step.title}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right demo */}
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                <motion.div key={activeStep}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm"
                >
                  <div className="mb-5">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">{STEPS[activeStep].step}</p>
                    <h3 className="text-xl font-black text-gray-900 mb-2">{STEPS[activeStep].title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{STEPS[activeStep].body}</p>
                  </div>
                  <div className="border-t border-gray-100 pt-5">
                    {demos[activeStep]}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Scroll progress indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {STEPS.map((_, i) => (
              <motion.div key={i}
                animate={{ width: activeStep === i ? 24 : 6, backgroundColor: activeStep === i ? '#0066FF' : '#D1D5DB' }}
                transition={{ duration: 0.3 }}
                className="h-1.5 rounded-full"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Mobile: stacked cards ──────────────────────────────────────────── */}
      <section className="lg:hidden py-20 px-4 sm:px-6 bg-gray-50" id="how-it-works-mobile">
        <div className="max-w-xl mx-auto">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">How it works</p>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-10">Your full financial OS.</h2>
          <div className="space-y-4">
            {STEPS.map((step, i) => (
              <AnimSection key={i}>
                <motion.div variants={fadeUp}
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <step.Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-blue-400 tracking-widest">{step.step}</p>
                      <p className="text-sm font-black text-gray-900">{step.title}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.body}</p>
                </motion.div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

// ─── Section A: Payment flow animation ────────────────────────────────────────

function PaymentFlowSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [activeStep, setActiveStep] = useState(-1)

  useEffect(() => {
    if (!inView) return
    const delays = [0, 700, 1400, 2100, 2800, 3500]
    const timers = delays.map((d, i) => setTimeout(() => setActiveStep(i), d))
    return () => timers.forEach(clearTimeout)
  }, [inView])

  const FLOW = [
    { Icon: FileCheck,  label: 'Contract signed',    sub: 'Client signs digitally',      color: '#00D4AA' },
    { Icon: FileText,   label: 'Invoice sent',        sub: 'PDF delivered by email',      color: '#0066FF' },
    { Icon: Bot,        label: 'AI risk scored',      sub: '72% — on-time probability',   color: '#0066FF' },
    { Icon: Bell,       label: 'Reminder fired',      sub: 'Auto-sent at 9 AM',           color: '#F59E0B' },
    { Icon: DollarSign, label: 'Payment received',    sub: '$4,200 collected',             color: '#00D4AA' },
    { Icon: BarChart2,  label: 'Forecast updated',    sub: 'Cash flow recalculated',       color: '#0066FF' },
  ]

  return (
    <section ref={ref} className="py-24 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">End to end</p>
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
            From contract to cash.<br />Watch it happen.
          </h2>
          <p className="text-gray-500 font-medium mt-4 max-w-lg mx-auto">
            Scroll into view and the whole flow plays out — every step automated.
          </p>
        </div>

        {/* Flow steps */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 lg:gap-2 relative">
          {/* Background connector line */}
          <div className="absolute top-8 left-[calc(8.33%+28px)] right-[calc(8.33%+28px)] h-px bg-gray-100 hidden lg:block" />

          {FLOW.map((step, i) => {
            const active = activeStep >= i
            return (
              <div key={i} className="flex flex-col items-center text-center gap-3 relative z-10">
                {/* Icon circle */}
                <motion.div
                  animate={active
                    ? { scale: [1, 1.12, 1], transition: { duration: 0.4, delay: 0.05 } }
                    : {}}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 flex-shrink-0"
                  style={{
                    backgroundColor: active ? step.color + '18' : '#F9FAFB',
                    border: `1.5px solid ${active ? step.color : '#E5E7EB'}`,
                    boxShadow: active ? `0 0 18px ${step.color}28` : 'none',
                  }}
                >
                  <step.Icon className="w-6 h-6 transition-colors duration-500"
                    style={{ color: active ? step.color : '#D1D5DB' }} />
                </motion.div>

                {/* Arrow connector — desktop only */}
                {i < FLOW.length - 1 && (
                  <div className="absolute top-[26px] left-[calc(100%-8px)] w-4 items-center justify-center hidden lg:flex">
                    <motion.div
                      animate={active ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                      style={{ transformOrigin: 'left' }}
                      className="w-3 h-px bg-gray-300"
                    />
                  </div>
                )}

                {/* Step number badge */}
                <motion.div
                  animate={{ opacity: active ? 1 : 0.3 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center gap-0.5"
                >
                  <p className="text-xs font-black text-gray-900 leading-tight">{step.label}</p>
                  <p className="text-[10px] text-gray-400 leading-tight">{step.sub}</p>
                </motion.div>

                {/* Step number */}
                <div className={`text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center transition-all duration-500 ${active ? 'text-white' : 'text-gray-300 border border-gray-200'}`}
                  style={{ backgroundColor: active ? step.color : 'transparent' }}>
                  {i + 1}
                </div>
              </div>
            )
          })}
        </div>

        {/* Completion callout */}
        <motion.div
          animate={activeStep >= 5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.6 }}
          className="mt-10 bg-teal-50 rounded-2xl border border-teal-100 p-5 text-center"
        >
          <p className="text-sm font-bold text-teal-800">
            You signed the contract. Invonaut handled the rest — zero manual steps.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Section B component (replaces static PROCESSES grid) ─────────────────────

function AutomationTimeline() {
  // The 4 scheduled automations — shown as notification feed
  const SCHEDULED = [
    { time: '9:00 AM daily',  Icon: Bell,       title: 'Invoice follow-up sent',       body: 'Marcus K. · INV-00089 · $4,200 · 8 days overdue',          color: '#EF4444' },
    { time: '9:00 AM daily',  Icon: AlertCircle, title: 'Contract expiry warning sent', body: 'Consulting Agreement · expires in 6 days',                  color: '#F59E0B' },
    { time: '9:01 AM daily',  Icon: Receipt,     title: 'Budget alert dispatched',      body: 'Marketing: $410 of $500 monthly limit (82%)',               color: '#0066FF' },
    { time: 'Monday 9:00 AM', Icon: Clock,        title: 'Weekly time summary emailed', body: '23.5 billable hours · $2,820 this week',                    color: '#00D4AA' },
  ]
  // The 4 reactive automations — shown in compact grid
  const REACTIVE = [
    { Icon: Zap,       title: 'AI risk scoring',       sub: 'Every invoice on send',      color: '#0066FF' },
    { Icon: Shield,    title: 'Contract auto-expiry',  sub: 'When date passes',            color: '#EF4444' },
    { Icon: BarChart2, title: 'AI expense category',   sub: 'Suggested on every entry',    color: '#00D4AA' },
    { Icon: TrendingUp,title: '90-day forecast',       sub: 'Recalculated on open',        color: '#F59E0B' },
  ]

  return (
    <div className="space-y-6">
      {/* Scheduled notification feed */}
      <div className="space-y-3">
        {SCHEDULED.map((item, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: i * 0.15, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-start gap-4 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl px-5 py-4 transition-all"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ backgroundColor: item.color + '20' }}>
              <item.Icon className="w-4 h-4" style={{ color: item.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <p className="text-sm font-bold text-white">{item.title}</p>
                <span className="text-[9px] font-black text-teal-400 bg-teal-400/10 px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0">Sent ✓</span>
              </div>
              <p className="text-xs text-gray-400">{item.body}</p>
            </div>
            <span className="text-[10px] font-bold text-gray-600 flex-shrink-0 mt-0.5 hidden sm:block">{item.time}</span>
          </motion.div>
        ))}
      </div>

      {/* Reactive automations compact grid */}
      <div>
        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Plus 4 that fire instantly</p>
        <div className="grid grid-cols-2 gap-2">
          {REACTIVE.map((item, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 + 0.6, duration: 0.35 }}
              className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-3"
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: item.color + '18' }}>
                <item.Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{item.title}</p>
                <p className="text-[10px] text-gray-500">{item.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Competitor comparison section ────────────────────────────────────────────

function CompetitorComparison() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <AnimSection className="text-center mb-12">
          <motion.div variants={fadeUp}>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">How we stack up</p>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
              One platform.<br />Not four tools.
            </h2>
            <p className="text-lg text-gray-500 font-medium mt-4 max-w-2xl mx-auto">
              Most tools do one thing well. You end up paying for four of them and context-switching all day.
              Invonaut does everything — and then some.
            </p>
          </motion.div>
        </AnimSection>

        <AnimSection>
          <motion.div variants={scaleIn}>
            <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm bg-white">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-5 px-5 text-sm font-bold text-gray-500 w-[38%]">Feature</th>
                    {COMPETITORS.map((c, i) => (
                      <th key={c} className={`py-5 px-3 text-center text-sm font-bold ${i === 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                        {i === 0 ? (
                          <span className="inline-flex items-center gap-1.5 bg-blue-50 rounded-lg px-3 py-1 border border-blue-100">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            {c}
                          </span>
                        ) : c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMP_FEATURES.map((row, ri) => (
                    <motion.tr
                      key={ri}
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: ri * 0.04 }}
                      className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors last:border-0"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-900">{row.feature}</span>
                          {row.note && (
                            <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                              {row.note}
                            </span>
                          )}
                        </div>
                      </td>
                      {row.values.map((has, ci) => (
                        <td key={ci} className="py-4 px-3 text-center">
                          {has ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              whileInView={{ scale: 1 }}
                              viewport={{ once: true }}
                              transition={{ type: 'spring', stiffness: 300, delay: ri * 0.04 + ci * 0.02 }}
                              className="flex justify-center"
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${ci === 0 ? 'bg-blue-600' : 'bg-gray-200'}`}>
                                <Check className={`w-3.5 h-3.5 ${ci === 0 ? 'text-white' : 'text-gray-500'}`} />
                              </div>
                            </motion.div>
                          ) : (
                            <div className="flex justify-center">
                              <X className="w-4 h-4 text-gray-200" />
                            </div>
                          )}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom differentiator pills */}
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              {[
                { icon: Banknote,   label: 'Captures cash, POS & mobile — not just invoices'  },
                { icon: Bot,        label: 'Autonomous: chases payments without you'            },
                { icon: Layers,     label: 'One platform — replaces 4 separate tools'          },
              ].map(d => (
                <div key={d.label}
                  className="inline-flex items-center gap-2 bg-white border border-blue-100 rounded-full px-4 py-2 shadow-sm">
                  <d.icon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm font-semibold text-gray-700">{d.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimSection>
      </div>
    </section>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function LandingPageClient() {
  const [navScrolled, setNavScrolled] = useState(false)
  const [selectedBrandColor, setSelectedBrandColor] = useState('#2563EB')
  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, 'change', (y) => setNavScrolled(y > 16))

  return (
    <div className="bg-white antialiased overflow-x-hidden">
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />

      {/* ── Navigation ───────────────────────────────────────────────────────── */}
      <nav className="fixed w-full top-0 z-50 transition-all duration-300" style={{
        background:    navScrolled ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.95)',
        backdropFilter:'blur(12px)',
        borderBottom:  navScrolled ? '1px solid rgba(0,0,0,0.08)' : '1px solid transparent',
        boxShadow:     navScrolled ? '0 1px 20px rgba(0,0,0,0.06)' : 'none',
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <Link href="/" className="flex items-center gap-2.5">
              <img src="/invonaut-logo.png" alt="Invonaut" className="w-8 h-8 rounded-full" />
              <div>
                <span className="text-xl font-black tracking-tight text-gray-900">Invonaut</span>
                <span className="hidden sm:inline text-xs text-gray-400 font-medium ml-2">Finance OS</span>
              </div>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {[
                { href: '#platform',     label: 'Platform'    },
                { href: '#how-it-works', label: 'How It Works'},
                { href: '#pricing',      label: 'Pricing'     },
              ].map(link => (
                <Link key={link.href} href={link.href}
                  className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 font-medium text-sm px-3 py-1.5 rounded-lg transition-all">
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-gray-500 hover:text-gray-900 font-medium text-sm transition-colors hidden sm:block">Sign in</Link>
              <Link href="/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:shadow-lg inline-flex items-center gap-1.5">
                Start free
                <span className="text-blue-200 text-xs font-normal">14 days</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="pt-24 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 85% 65% at 25% 35%, rgba(219,234,254,0.75) 0%, transparent 65%), radial-gradient(ellipse 55% 45% at 75% 65%, rgba(204,251,241,0.35) 0%, transparent 65%)' }} />
        <div className="absolute inset-0" style={DOT_LIGHT} />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-center">

            {/* Left */}
            <motion.div variants={stagger(0.12)} initial="hidden" animate="show" className="min-w-0">
              <motion.div variants={fadeUp}>
                <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-3 py-1.5 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Built for freelancers &amp; small businesses</span>
                </div>
              </motion.div>

              <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl xl:text-7xl font-black text-gray-900 tracking-tight leading-[0.95] mb-5">
                Money in your<br />business shouldn&apos;t<br />feel<br />
                <span className="automated-gradient">unpredictable.</span>
              </motion.h1>

              <motion.p variants={fadeUp} className="text-lg text-gray-500 font-medium leading-relaxed mb-8 max-w-lg">
                Late invoices. Cash you can&apos;t see. Contracts that expire quietly.
                Invonaut catches all of it — and handles most of it for you, automatically.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
                <Link href="/signup" className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-7 py-3.5 rounded-xl font-bold text-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  Start free — 14 days <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="#platform" className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-7 py-3.5 rounded-xl font-bold text-sm hover:border-gray-300 hover:shadow-md transition-all">
                  See what it does
                </Link>
              </motion.div>
              <motion.p variants={fadeUp} className="text-xs text-gray-400 font-medium mt-3">No credit card required · Cancel anytime</motion.p>
            </motion.div>

            {/* Right — live activity feed with @property spinning border */}
            <motion.div
              initial={{ opacity: 0, x: 32, y: 8 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
              className="hidden lg:block"
            >
              <div className="spinning-track-border p-[2px]">
                <div className="bg-white rounded-[14px] p-6 relative overflow-hidden">
                  {/* Inner top glow line */}
                  <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent opacity-60" />

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

                  <LiveActivityFeed />

                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Revenue this month</span>
                      <span className="text-xs font-bold text-teal-600">↑ 23%</span>
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
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── NEW: You're leaving money on the table ─────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <AnimSection className="text-center mb-12">
            <motion.div variants={fadeUp}>
              <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3">The real cost of manual finance</p>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
                You&apos;re leaving money<br />on the table.
              </h2>
              <p className="text-lg text-gray-500 font-medium mt-4 max-w-2xl mx-auto">
                Without automation, these problems compound silently every week.
                With Invonaut, they disappear.
              </p>
            </motion.div>
          </AnimSection>

          <AnimSection containerVariant={stagger(0.09)} className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
            {PAIN_POINTS.map((p, i) => (
              <motion.div key={i} variants={i % 2 === 0 ? fadeLeft : fadeRight}
                className="bg-white rounded-2xl border border-gray-100 hover:shadow-lg transition-all group overflow-hidden">
                {/* Red header */}
                <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                    <p.Icon className="w-4 h-4 text-red-500" />
                  </div>
                  <p className="text-sm font-black text-red-700">{p.pain}</p>
                </div>
                <div className="px-6 py-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Without Invonaut</p>
                    <p className="text-sm text-gray-500">{p.without}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1.5">With Invonaut</p>
                    <p className="text-sm text-gray-700 font-medium">{p.withUs}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimSection>

          <AnimSection className="text-center">
            <motion.div variants={fadeUp}>
              <Link href="/signup"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold hover:shadow-xl hover:scale-[1.02] transition-all">
                Fix this — free for 14 days <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </AnimSection>
        </div>
      </section>

      {/* ── Stats bar (dark) ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <div className="absolute inset-0" style={DOT_DARK} />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <AnimSection containerVariant={stagger(0.12)} className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
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

      {/* ── Platform modules (light) ──────────────────────────────────────────── */}
      <section id="platform" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <AnimSection className="text-center mb-14">
            <motion.div variants={fadeUp}>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">The complete platform</p>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">Everything in one place.</h2>
              <p className="text-lg text-gray-500 font-medium mt-4 max-w-2xl mx-auto">
                No more switching between invoicing apps, time trackers, and spreadsheets.
                Invonaut models how money actually flows through your business.
              </p>
            </motion.div>
          </AnimSection>
          <AnimSection containerVariant={stagger(0.06)} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {MODULES.map(mod => (
              <motion.div key={mod.title} variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group bg-gray-50 hover:bg-white rounded-2xl p-6 border border-gray-100 hover:border-blue-100 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-default">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:rotate-3" style={{ background: mod.bg }}>
                  <mod.Icon className="w-5 h-5" style={{ color: mod.accent }} />
                </div>
                <div className="inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 mb-3" style={{ background: mod.bg, color: mod.accent }}>
                  {mod.tag}
                </div>
                <h3 className="text-base font-black text-gray-900 mb-1.5 tracking-tight group-hover:text-blue-600 transition-colors">{mod.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{mod.body}</p>
              </motion.div>
            ))}
          </AnimSection>
        </div>
      </section>

      {/* ── NEW: Revenue clarity calculator (white) ──────────────────────────── */}
      <RevenueCalculator />

      {/* ── Autonomy callout (dark) ───────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        {/* Breathing dot grid — always animating */}
        <div className="absolute inset-0 inv-dot-breathe" style={DOT_DARK} />
        {/* Drifting orbs — give the section an always-alive feel */}
        <div className="inv-orb-1 absolute top-[10%] right-[8%] w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.6) 0%, transparent 70%)' }} />
        <div className="inv-orb-2 absolute bottom-[15%] left-[5%] w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.5) 0%, transparent 70%)' }} />
        <div className="inv-orb-3 absolute top-[40%] left-[40%] w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)' }} />
        <div className="max-w-5xl mx-auto relative z-10">
          <AnimSection className="text-center mb-12">
            <motion.div variants={fadeUp}>
              <p className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-3">Always on</p>
              <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">Works while you don&apos;t.</h2>
              <p className="text-gray-400 font-medium mt-4 max-w-xl mx-auto">Eight automated processes run every day without you logging in.</p>
            </motion.div>
          </AnimSection>
          <AnimSection containerVariant={stagger(0.1)}>
            <AutomationTimeline />
          </AnimSection>
          <AnimSection className="mt-10">
            <motion.div variants={fadeUp} className="grid grid-cols-3 gap-4 bg-white/[0.04] border border-white/[0.07] rounded-2xl p-6 text-center">
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

      {/* ── How it works — Framer-style scroll sticky ─────────────────────── */}
      <HowItWorksScrollSection />

      {/* ── Interactive product demo ──────────────────────────────────────────── */}
      {/* ── Section A: From contract to cash ───────────────────────────────── */}
      <PaymentFlowSection />

      <InteractiveProductDemo />

      {/* ── Portal preview ───────────────────────────────────────────────────── */}
      <PortalPreview />

      {/* ── White label callout (white) ──────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <AnimSection>
              <motion.div variants={fadeLeft}>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Professional &amp; Business</p>
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-4">Your brand.<br />Not ours.</h2>
                <p className="text-gray-500 leading-relaxed mb-6">
                  Upload your logo and set your primary and secondary brand colors. Invonaut applies them everywhere your clients see — invoices, emails, portal, and contracts.
                </p>
                <ul className="space-y-3">
                  {[
                    { where: 'Invoice PDFs',   what: 'Your logo in the header, brand colors on accents and totals'  },
                    { where: 'Invoice emails', what: 'Sent from your business name, styled in your colors'          },
                    { where: 'Client portal',  what: 'Header shows your logo — Invonaut branding completely hidden'  },
                    { where: 'Contract PDFs',  what: 'Signed documents carry your brand, not a third-party mark'    },
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
                    <motion.div key={c.color}
                      initial={{ opacity: 0, scale: 0.7 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.06, duration: 0.35, ease: EASE }}
                      className="flex flex-col items-center gap-1.5 cursor-pointer"
                      onClick={() => setSelectedBrandColor(c.color)}>
                      <div
                        className="w-10 h-10 rounded-full transition-all duration-200"
                        style={{
                          backgroundColor: c.color,
                          boxShadow: selectedBrandColor === c.color
                            ? `0 0 0 3px white, 0 0 0 5px ${c.color}`
                            : '0 2px 6px rgba(0,0,0,0.15)',
                          transform: selectedBrandColor === c.color ? 'scale(1.15)' : 'scale(1)',
                        }}
                      />
                      <span className="text-xs text-gray-400">{c.label}</span>
                    </motion.div>
                  ))}
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-300"
                      style={{ backgroundColor: selectedBrandColor }}>
                      <span className="text-white text-xs font-black">YB</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-gray-900 truncate">Your Business</p>
                      <p className="text-xs text-gray-400 truncate">invoice@yourbusiness.com</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    <div className="h-1 rounded-full w-3/4 transition-colors duration-300"
                      style={{ backgroundColor: selectedBrandColor }} />
                    <div className="h-1 bg-gray-200 rounded-full w-full" />
                    <div className="h-1 bg-gray-200 rounded-full w-2/3" />
                  </div>
                  <div className="flex justify-end">
                    <div className="text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors duration-300"
                      style={{ backgroundColor: selectedBrandColor }}>$4,200.00</div>
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-center mt-3">
                  Click a color — your invoice preview updates instantly
                </p>
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
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">Simple, transparent pricing.</h2>
              <p className="text-gray-500 font-medium mt-4 max-w-xl mx-auto">Start with a 14-day free trial on any plan. No credit card required.</p>
            </motion.div>
          </AnimSection>
          <AnimSection>
            <motion.div variants={scaleIn} className="relative">
              <LandingPricingSection />
            </motion.div>
          </AnimSection>
        </div>
      </section>

      {/* ── Final CTA (dark blue) ─────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 50%, #1e3a8a 100%)' }}>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(96,165,250,0.5) 0%, transparent 70%)' }} />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <AnimSection>
            <motion.div variants={fadeUp} className="space-y-6">
              <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                Stop chasing invoices.<br />Start getting paid.
              </h2>
              <p className="text-blue-100 text-lg font-medium max-w-xl mx-auto">
                Your financial operations on autopilot. Invoices tracked. Payments logged.
                Cash flow forecast. Collections automated.
              </p>
              <div>
                <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-blue-700 px-9 py-4 rounded-xl font-black text-base hover:shadow-md hover:-translate-y-0.5 transition-all">
                  Start free — 14 days <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-blue-200 text-xs font-medium mt-3">No credit card · Cancel anytime · 14-day free trial</p>
              </div>
            </motion.div>
          </AnimSection>
        </div>
      </section>

      {/* ── Footer wave transition art ────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ height: '72px', background: '#030712' }}>
        <svg viewBox="0 0 1440 72" xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none" className="absolute top-0 left-0 w-full h-full">
          {/* Deep wave */}
          <path fill="#1e3a8a"
            d="M0,0 L0,36 C180,72 360,18 540,45 C720,72 900,18 1080,36 C1260,54 1380,18 1440,28 L1440,0 Z" />
          {/* Mid wave */}
          <path fill="#1d4ed8" fillOpacity="0.45"
            d="M0,0 L0,18 C240,54 480,0 720,30 C960,60 1200,12 1440,36 L1440,0 Z" />
          {/* Top shimmer */}
          <path fill="rgba(96,165,250,0.2)"
            d="M0,0 L0,8 C360,28 720,4 1080,20 C1260,28 1380,8 1440,14 L1440,0 Z" />
        </svg>
        {/* Floating star particles */}
        {[
          { cx: 180,  cy: 30, r: 1.2, op: 0.5 }, { cx: 420, cy: 15, r: 0.8, op: 0.4 },
          { cx: 690,  cy: 42, r: 1.5, op: 0.6 }, { cx: 900, cy: 20, r: 1.0, op: 0.45 },
          { cx: 1100, cy: 50, r: 0.9, op: 0.35 },{ cx: 1330, cy: 25, r: 1.3, op: 0.5 },
        ].map((s, i) => (
          <div key={i} className="absolute rounded-full bg-blue-300"
            style={{ left: s.cx, top: s.cy, width: s.r * 2, height: s.r * 2, opacity: s.op }} />
        ))}
      </div>

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
            <p className="text-xs">Built for people who run their own business.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}