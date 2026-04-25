'use client'
// src/components/dashboard/dashboard-ai-strip.tsx
//
// Contextual AI insight bar on the dashboard.
// Generates 1–3 insights from live data passed as props.
// No backend call required — this is a UX perception layer.

import { Zap, TrendingDown, Clock, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface Props {
  overdueCount:      number
  pendingPayments:   number
  expiringSoonCount: number
  unbilledValue:     number
  totalRevenue:      number
  paidThisMonth:     number
}

type Insight = {
  icon:   React.ReactNode
  text:   string
  sub:    string
  href:   string
  color:  string
  urgent: boolean
}

function fmt(n: number) {
  if (n >= 999_500) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000)  return `$${(n / 1_000).toFixed(0)}K`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export default function DashboardAiStrip({
  overdueCount,
  pendingPayments,
  expiringSoonCount,
  unbilledValue,
  totalRevenue,
  paidThisMonth,
}: Props) {
  const insights: Insight[] = []

  // Overdue invoices
  if (overdueCount > 0) {
    insights.push({
      icon:   <AlertTriangle className="w-3.5 h-3.5" />,
      text:   `${overdueCount} invoice${overdueCount > 1 ? 's' : ''} overdue`,
      sub:    'AI follow-up ready to send',
      href:   '/dashboard/invoices?status=overdue',
      color:  'text-red-600 bg-red-50 border-red-200',
      urgent: true,
    })
  }

  // Contracts expiring
  if (expiringSoonCount > 0) {
    insights.push({
      icon:   <Clock className="w-3.5 h-3.5" />,
      text:   `${expiringSoonCount} contract${expiringSoonCount > 1 ? 's' : ''} expiring soon`,
      sub:    'Review before auto-expiry',
      href:   '/dashboard/contracts',
      color:  'text-amber-600 bg-amber-50 border-amber-200',
      urgent: true,
    })
  }

  // Unbilled time value
  if (unbilledValue >= 50) {
    insights.push({
      icon:   <Zap className="w-3.5 h-3.5" />,
      text:   `${fmt(unbilledValue)} in unbilled time`,
      sub:    'Convert hours to an invoice',
      href:   '/dashboard/time',
      color:  'text-blue-600 bg-blue-50 border-blue-200',
      urgent: false,
    })
  }

  // Pending pipeline
  if (pendingPayments > 0 && insights.length < 3) {
    insights.push({
      icon:   <TrendingDown className="w-3.5 h-3.5" />,
      text:   `${fmt(pendingPayments)} awaiting payment`,
      sub:    'Outstanding sent invoices',
      href:   '/dashboard/invoices?status=sent',
      color:  'text-indigo-600 bg-indigo-50 border-indigo-200',
      urgent: false,
    })
  }

  // Good month — positive signal
  if (insights.length === 0 && paidThisMonth > 0) {
    insights.push({
      icon:   <CheckCircle2 className="w-3.5 h-3.5" />,
      text:   `${fmt(paidThisMonth)} collected this month`,
      sub:    'Revenue is coming in on time',
      href:   '/dashboard/invoices?status=paid',
      color:  'text-emerald-600 bg-emerald-50 border-emerald-200',
      urgent: false,
    })
  }

  // Nothing meaningful to say yet
  if (insights.length === 0) return null

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* AI label */}
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white flex-shrink-0">
        <Sparkles className="w-3.5 h-3.5" />
        <span className="text-xs font-black tracking-wide">AI</span>
      </div>

      {insights.slice(0, 3).map((ins, i) => (
        <Link
          key={i}
          href={ins.href}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold
            hover:shadow-sm hover:-translate-y-0.5 transition-all duration-150
            ${ins.color}
          `}
        >
          {ins.icon}
          <span>{ins.text}</span>
          <span className="font-medium opacity-60 hidden sm:inline">· {ins.sub}</span>
        </Link>
      ))}
    </div>
  )
}
