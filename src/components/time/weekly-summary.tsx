'use client'

// src/components/time/weekly-summary.tsx
// Server component — receives entries as a prop from the page.
//
// WHAT IT DOES:
//   - Shows this-week totals: total hours, billable hours, unbilled value
//   - Shows a per-client breakdown for the week
//   - "This week" = Sunday to Saturday of the current week
//   - Pure display — no client-side state needed

import { Clock, DollarSign, TrendingUp, Users } from 'lucide-react'
import { formatDuration, toDecimalHours, calcBillableAmount, fmt } from '@/lib/utils/time-formatting'
import { useCurrency } from '@/lib/context/currency-context'

// Compact formatter — abbreviates large values so they never overflow their card.
// Mirrors formatCurrencyCompact in dashboard/page.tsx.
function formatCompact(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 10_000)    return `$${(amount / 1_000).toFixed(0)}K`
  return fmt(amount)
}

type Client = { id: string; name: string; company: string | null }

type TimeEntry = {
  id:               string
  description:      string
  started_at:       string
  duration_seconds: number | null
  hourly_rate:      number | null
  billable:         boolean
  invoice_id:       string | null
  clients:          Client | null
}

interface WeeklySummaryProps {
  entries: TimeEntry[]
}

function getWeekBounds(): { start: Date; end: Date } {
  const now   = new Date()
  const day   = now.getDay()           // 0 = Sun
  const start = new Date(now)
  start.setDate(now.getDate() - day)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export default function WeeklySummary({
  entries }: WeeklySummaryProps) {
  const { format: fmt } = useCurrency()
  const { start: weekStart, end: weekEnd } = getWeekBounds()

  const weekEntries = entries.filter(e => {
    const d = new Date(e.started_at)
    return d >= weekStart && d <= weekEnd
  })

  const totalSeconds    = weekEntries.reduce((s, e) => s + (e.duration_seconds ?? 0), 0)
  const billableSeconds = weekEntries
    .filter(e => e.billable)
    .reduce((s, e) => s + (e.duration_seconds ?? 0), 0)

  const unbilledValue = weekEntries
    .filter(e => e.billable && !e.invoice_id && e.hourly_rate)
    .reduce((s, e) => s + calcBillableAmount(e.duration_seconds ?? 0, e.hourly_rate!), 0)

  // Per-client breakdown
  const clientMap = new Map<string, { name: string; seconds: number; unbilledValue: number }>()

  weekEntries.forEach(e => {
    const key  = e.clients?.id ?? '__no_client'
    const name = e.clients?.name ?? 'No client'
    const existing = clientMap.get(key) ?? { name, seconds: 0, unbilledValue: 0 }
    const amount = e.billable && !e.invoice_id && e.hourly_rate
      ? calcBillableAmount(e.duration_seconds ?? 0, e.hourly_rate)
      : 0
    clientMap.set(key, {
      name,
      seconds:       existing.seconds + (e.duration_seconds ?? 0),
      unbilledValue: existing.unbilledValue + amount,
    })
  })

  const clientBreakdown = Array.from(clientMap.values()).sort((a, b) => b.seconds - a.seconds)

  const metrics = [
    {
      label: 'Total Hours',
      value: formatDuration(totalSeconds),
      sub:   `${toDecimalHours(totalSeconds)} hrs`,
      icon:  Clock,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Billable Hours',
      value: formatDuration(billableSeconds),
      sub:   `${toDecimalHours(billableSeconds)} hrs`,
      icon:  TrendingUp,
      color: 'bg-teal-50 text-teal-600',
    },
    {
      label: 'Unbilled Value',
      value: formatCompact(unbilledValue),
      full:  fmt(unbilledValue),
      sub:   'Ready to invoice',
      icon:  DollarSign,
      color: 'bg-green-50 text-green-600',
    },
  ]

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-black text-gray-900 tracking-tight">This Week</h2>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
          {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
          {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {metrics.map(m => (
          <div key={m.label} className="bg-gray-50 rounded-xl p-4 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${m.color}`}>
              <m.icon className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{m.label}</p>
            <p
              className="text-2xl font-black text-gray-900 mt-0.5 truncate"
              title={'full' in m ? m.full : m.value}
            >
              {m.value}
            </p>
            <p className="text-xs text-gray-400 font-medium mt-0.5">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Client breakdown */}
      {clientBreakdown.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">By Client</h3>
          </div>
          <div className="space-y-2">
            {clientBreakdown.map(c => (
              <div key={c.name} className="flex items-center justify-between py-2 px-3 rounded-xl bg-gray-50">
                <span className="text-sm font-bold text-gray-700 truncate">{c.name}</span>
                <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                  <span className="text-sm font-bold text-gray-500">{formatDuration(c.seconds)}</span>
                  {c.unbilledValue > 0 && (
                    <span
                      className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full"
                      title={fmt(c.unbilledValue)}
                    >
                      {formatCompact(c.unbilledValue)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {weekEntries.length === 0 && (
        <p className="text-center text-gray-400 text-sm font-medium py-4">
          No time tracked this week yet.
        </p>
      )}
    </div>
  )
}