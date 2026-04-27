'use client'
// src/components/dashboard/revenue-story-section.tsx
//
// FIX: twitching was caused by calling setAnimated() on every rAF tick,
// which triggers a full Recharts re-render at 60fps. The fix: animate a
// single CSS opacity on an overlay element instead of mutating chart data.
// The bars are rendered at full height immediately; a white overlay fades
// from opacity-1 to opacity-0 over 1200ms, creating the "draw in" illusion
// without any data mutations or re-renders after the first paint.
//
// Title is situational — never lies to the user.

import { useState, useEffect, useRef } from 'react'
import { TrendingUp, TrendingDown, BarChart3, Minus } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import Link from 'next/link'

type MonthData = { month: string; revenue: number; isCurrentMonth?: boolean }

interface Props {
  data:          MonthData[]
  currentMonth:  number
  previousMonth: number
}

const fmt = (n: number) => {
  if (n >= 999_500) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000)  return `$${(n / 1_000).toFixed(0)}K`
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n)
}

const yFmt = (v: number) => {
  if (v === 0)        return '$0'
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `$${Math.round(v / 1_000)}K`
  return `$${v}`
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg border border-white/10 text-xs">
      <p className="font-bold text-gray-400 mb-0.5">{payload[0].payload.month}</p>
      <p className="font-black text-blue-300">{fmt(payload[0].value)}</p>
    </div>
  )
}

function getSituationalTitle(
  currentMonth: number,
  previousMonth: number,
  trendPct: number,
  hasAnyRevenue: boolean,
): { headline: string; sub: string; icon: 'up' | 'down' | 'flat' | 'none' } {
  // No revenue at all
  if (!hasAnyRevenue) {
    return {
      headline: 'No revenue recorded yet',
      sub: 'Send your first invoice or log a payment to start tracking.',
      icon: 'none',
    }
  }

  // Revenue exists but no previous month to compare
  if (previousMonth === 0 && currentMonth > 0) {
    return {
      headline: `${fmt(currentMonth)} collected this month`,
      sub: 'First data point recorded. Keep it going.',
      icon: 'up',
    }
  }

  if (previousMonth === 0 && currentMonth === 0) {
    return {
      headline: 'No activity this month yet',
      sub: 'Last 6 months shown below. Send an invoice to update this.',
      icon: 'flat',
    }
  }

  // Genuine comparison
  if (trendPct >= 20) {
    return {
      headline: `Revenue up ${trendPct}% — strong month`,
      sub: `${fmt(currentMonth)} collected. Momentum is accelerating.`,
      icon: 'up',
    }
  }
  if (trendPct > 0) {
    return {
      headline: `Revenue up ${trendPct}% this month`,
      sub: `${fmt(currentMonth)} collected. Steady growth.`,
      icon: 'up',
    }
  }
  if (trendPct === 0) {
    return {
      headline: 'Revenue is flat this month',
      sub: `${fmt(currentMonth)} — same as last month. Time to push.`,
      icon: 'flat',
    }
  }
  if (trendPct >= -20) {
    return {
      headline: `Revenue down ${Math.abs(trendPct)}% this month`,
      sub: `${fmt(currentMonth)} collected. Check your pipeline.`,
      icon: 'down',
    }
  }
  return {
    headline: `Revenue down ${Math.abs(trendPct)}% — needs attention`,
    sub: `${fmt(currentMonth)} collected. Review overdue invoices.`,
    icon: 'down',
  }
}

export default function RevenueStorySection({ data, currentMonth, previousMonth }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)

  const trendPct     = previousMonth > 0
    ? Math.round(((currentMonth - previousMonth) / previousMonth) * 100)
    : 0
  const hasAnyRevenue = data.some(d => d.revenue > 0)
  const avg6          = data.length > 0
    ? data.reduce((s, d) => s + d.revenue, 0) / data.length
    : 0

  const { headline, sub, icon } = getSituationalTitle(
    currentMonth, previousMonth, trendPct, hasAnyRevenue,
  )

  // Fade-out overlay instead of mutating data — zero re-renders, zero twitching
  useEffect(() => {
    const el = overlayRef.current
    if (!el) return
    el.style.opacity = '1'
    const start = Date.now()
    const duration = 1200

    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1)
      // ease-out cubic
      el.style.opacity = String(1 - (1 - Math.pow(1 - t, 3)))
      if (t < 1) requestAnimationFrame(tick)
      else el.style.opacity = '0'
    }

    const raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden inv-fade-up inv-fade-up-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">

      {/* Header */}
      <div className="p-6 border-b border-gray-50 bg-gradient-to-br from-blue-50/50 to-transparent">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              {icon === 'up'   && <TrendingUp   className="w-5 h-5 text-teal-600 flex-shrink-0" />}
              {icon === 'down' && <TrendingDown  className="w-5 h-5 text-red-500 flex-shrink-0" />}
              {icon === 'flat' && <Minus         className="w-5 h-5 text-gray-400 flex-shrink-0" />}
              {icon === 'none' && <BarChart3     className="w-5 h-5 text-gray-400 flex-shrink-0" />}
              <h2 className="text-xl font-black text-gray-900">{headline}</h2>
            </div>
            <p className="text-sm text-gray-500 font-medium">{sub}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm flex-shrink-0">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Quick stats — only show when there's something to compare */}
        {(currentMonth > 0 || previousMonth > 0) && (
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-white/70 rounded-xl border border-gray-200/70">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">This month</p>
              <p className="text-lg font-black text-gray-900 mt-0.5">{fmt(currentMonth)}</p>
            </div>
            <div className="p-3 bg-white/70 rounded-xl border border-gray-200/70">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Last month</p>
              <p className="text-lg font-black text-gray-900 mt-0.5">{fmt(previousMonth)}</p>
            </div>
            <div className={`p-3 rounded-xl border ${
              trendPct > 0  ? 'bg-teal-50 border-teal-200' :
              trendPct < 0  ? 'bg-red-50 border-red-200'   :
                              'bg-gray-50 border-gray-200'
            }`}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Change</p>
              <p className={`text-lg font-black mt-0.5 ${
                trendPct > 0 ? 'text-teal-600' : trendPct < 0 ? 'text-red-600' : 'text-gray-500'
              }`}>
                {trendPct > 0 ? '+' : ''}{previousMonth > 0 ? `${trendPct}%` : '—'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="p-6">
        {!hasAnyRevenue ? (
          /* Ghost empty state */
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <BarChart3 className="w-10 h-10 text-gray-200 mb-2" />
            <p className="text-sm font-bold text-gray-400 mb-1">No revenue data yet</p>
            <p className="text-xs text-gray-300">Send your first invoice to populate this chart</p>
          </div>
        ) : (
          /* Overlay trick: chart renders at full height, white overlay fades out */
          <div className="relative w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 4, right: 8, left: 8, bottom: 0 }}
                barCategoryGap="32%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="none"
                  tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="none"
                  tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={yFmt}
                  width={48}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: 'rgba(0,102,255,0.04)' }}
                />
                <Bar
                  dataKey="revenue"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={52}
                  isAnimationActive={false}
                >
                  {data.map((entry, i) => (
                    <Cell
                      key={i}
                      fill="#0066FF"
                      opacity={entry.isCurrentMonth ? 1 : 0.55}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Fade-out overlay — creates draw-in effect without re-renders */}
            <div
              ref={overlayRef}
              className="absolute inset-0 bg-white rounded pointer-events-none"
              style={{ opacity: 1 }}
            />
          </div>
        )}

        {/* Insight footer */}
        {hasAnyRevenue && avg6 > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-100">
            <p className="text-xs text-gray-600">
              <span className="font-bold text-blue-700">Insight: </span>
              Your 6-month average is {fmt(avg6)}. This month is{' '}
              <span className={`font-bold ${currentMonth >= avg6 ? 'text-teal-600' : 'text-amber-600'}`}>
                {currentMonth >= avg6 ? 'above' : 'below'} trend.
              </span>
            </p>
          </div>
        )}

        <div className="flex justify-end mt-3">
          <Link
            href="/dashboard/analytics"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Full analytics →
          </Link>
        </div>
      </div>
    </div>
  )
}
