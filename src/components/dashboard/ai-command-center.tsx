'use client'

import { useCurrency } from '@/lib/context/currency-context'
// src/components/dashboard/ai-command-center.tsx
//
// - Horizontal scanning beam background (slow left→right→left march, 14s)
// - Cycling AI insights, paused on hover
// - Brand colors: blue-600 (#0066FF), teal-400 (#00D4AA), orange-500 (#FF6B35)
// - No purple
// - All numbers use correct formatCompact

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Zap, AlertTriangle, TrendingUp, Lightbulb,
  BarChart3, Plus, Activity,
} from 'lucide-react'

interface Props {
  totalRevenue:          number
  pendingPayments:       number
  paidThisMonth:         number
  overdueCount:          number
  profitMargin:          number | null
  expiringSoon:          number
  unbilledValue:         number
  hasActiveSubscription: boolean
}

type Severity = 'warning' | 'critical' | 'success' | 'info'
type Insight = {
  title: string
  description: string
  action: string
  href: string
  severity: Severity
  icon: typeof AlertTriangle
}

export default function AICommandCenter({
  totalRevenue, pendingPayments, paidThisMonth, overdueCount,
  profitMargin, expiringSoon, unbilledValue, hasActiveSubscription,
}: Props) {
  const { format: fmt } = useCurrency()
  const [active,     setActive]     = useState(0)
  const [key,        setKey]        = useState(0)
  const [paused,     setPaused]     = useState(false)
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  const insights: Insight[] = [
    overdueCount > 0 && {
      title:       `${overdueCount} invoice${overdueCount > 1 ? 's' : ''} overdue`,
      description: `${fmt(pendingPayments)} is waiting on clients. Automated reminders can recover this without a single manual email.`,
      action:      'Review overdue invoices',
      href:        '/dashboard/invoices?status=overdue',
      severity:    'critical' as Severity,
      icon:        AlertTriangle,
    },
    pendingPayments > 0 && {
      title:       `${fmt(pendingPayments)} awaiting payment`,
      description: `AI follow-up sequences can nudge clients before they go overdue.`,
      action:      'View sent invoices',
      href:        '/dashboard/invoices?status=sent',
      severity:    'warning' as Severity,
      icon:        AlertTriangle,
    },
    unbilledValue > 0 && {
      title:       `${fmt(unbilledValue)} in unbilled time`,
      description: `You have hours tracked but not invoiced. Converting them now keeps cash flow consistent.`,
      action:      'Convert to invoice',
      href:        '/dashboard/time',
      severity:    'info' as Severity,
      icon:        Lightbulb,
    },
    expiringSoon > 0 && {
      title:       `${expiringSoon} contract${expiringSoon > 1 ? 's' : ''} expiring soon`,
      description: `Invonaut sends expiry reminders at 30, 15, 7, and 1 day. Review and renew before auto-expiry.`,
      action:      'Review contracts',
      href:        '/dashboard/contracts',
      severity:    'warning' as Severity,
      icon:        AlertTriangle,
    },
    paidThisMonth > 0 && {
      title:       `${fmt(paidThisMonth)} collected this month`,
      description: `${profitMargin !== null ? `Profit margin at ${profitMargin}%. ` : ''}Keep momentum by staying on top of outstanding invoices.`,
      action:      'See revenue breakdown',
      href:        '/dashboard/analytics',
      severity:    'success' as Severity,
      icon:        TrendingUp,
    },
    {
      title:       totalRevenue > 0 ? `${fmt(totalRevenue)} total revenue tracked` : 'Your financial OS is ready',
      description: totalRevenue > 0
        ? 'Invonaut is capturing every dollar — invoiced and direct — in one place.'
        : 'Create your first invoice or log a payment to build your financial picture.',
      action:      totalRevenue > 0 ? 'View analytics' : 'Create first invoice',
      href:        totalRevenue > 0 ? '/dashboard/analytics' : '/dashboard/invoices/new',
      severity:    'info' as Severity,
      icon:        BarChart3,
    },
  ].filter((item): item is Insight => Boolean(item))

  const startCycle = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      if (!paused) {
        setActive(p => (p + 1) % insights.length)
        setKey(p => p + 1)
      }
    }, 6000)
  }

  useEffect(() => {
    startCycle()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [insights.length, paused])

  const current = insights[active]
  const Icon    = current.icon

  const theme: Record<Severity, { bg: string; border: string; badge: string; btn: string }> = {
    warning:  { bg: 'bg-amber-50/60',   border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-800',   btn: 'bg-white border border-amber-200 text-amber-800 hover:bg-amber-50' },
    critical: { bg: 'bg-red-50/60',     border: 'border-red-200',    badge: 'bg-red-100 text-red-800',       btn: 'bg-red-600 text-white hover:bg-red-700' },
    success:  { bg: 'bg-teal-50/60',    border: 'border-teal-200',   badge: 'bg-teal-100 text-teal-800',     btn: 'bg-teal-500 text-white hover:bg-teal-600' },
    info:     { bg: 'bg-blue-50/60',    border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-800',     btn: 'bg-blue-600 text-white hover:bg-blue-700' },
  }
  const t = theme[current.severity]

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-blue-200/60 inv-fade-up inv-fade-up-1 inv-glow-blue"
    >
      {/* ── Shimmer sweep ───────────────────────────────────────────────
          A diagonal highlight slides across every 5s via CSS ::after.
          Defined edge makes it visible without high opacity. */}
      <div className="inv-shimmer-sweep-wrap" aria-hidden />

      {/* Content — lightly tinted so shimmer passes through */}
      <div className="relative z-10 bg-[#F8FAFF]/80 p-6 sm:p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center shadow-md flex-shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900">AI Command Center</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inv-pulse-glow flex-shrink-0" />
                <p className="text-xs text-gray-500 font-medium">Monitoring revenue patterns</p>
              </div>
            </div>
          </div>
          {hasActiveSubscription && (
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/dashboard/invoices/new"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-primary text-xs transition-all hover:shadow-md active:scale-[0.98]">
                <Plus className="w-3 h-3" />Invoice
              </Link>
              <Link href="/dashboard/payments/new"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-secondary text-xs transition-all hover:shadow-md active:scale-[0.98]">
                <Plus className="w-3 h-3" />Payment
              </Link>
            </div>
          )}
        </div>

        {/* Cycling insight — pauses on hover */}
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            key={key}
            className={`inv-insight-in ${t.bg} border ${t.border} rounded-xl p-5`}
          >
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-lg bg-white/70 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                <Icon className="w-4 h-4 text-gray-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="text-sm font-black text-gray-900">{current.title}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.badge}`}>
                    {current.severity === 'critical' ? 'Critical' : current.severity === 'warning' ? 'Warning' : current.severity === 'success' ? 'On track' : 'Info'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">{current.description}</p>
                <Link
                  href={current.href}
                  className={`inline-flex items-center px-4 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-[0.98] ${t.btn}`}
                >
                  {current.action} →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation dots */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {insights.map((_, i) => (
            <button
              key={i}
              onClick={() => { setActive(i); setKey(k => k + 1) }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? 'bg-blue-600 w-6' : 'bg-gray-300 w-1.5 hover:bg-gray-400'
              }`}
              aria-label={`Insight ${i + 1}`}
            />
          ))}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-gray-200/60">
          {[
            { label: 'Total Revenue',  value: fmt(totalRevenue),    color: 'text-gray-900'  },
            { label: 'Pending',        value: fmt(pendingPayments), color: 'text-amber-600' },
            { label: 'This Month',     value: fmt(paidThisMonth),   color: 'text-teal-600'  },
            { label: 'Profit Margin',  value: profitMargin !== null ? `${profitMargin}%` : '—', color: 'text-blue-600' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
              <p
                className={`inv-breath ${stat.color}`}
                style={{
                  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  letterSpacing: '-.03em',
                  lineHeight: 1.1,
                }}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
