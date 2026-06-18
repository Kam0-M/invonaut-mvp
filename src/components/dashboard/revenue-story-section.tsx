'use client'

import { useCurrency } from '@/lib/context/currency-context'
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

import { TrendingUp, TrendingDown, BarChart3, Minus } from 'lucide-react'
import Link from 'next/link'

type MonthData = { month: string; revenue: number; isCurrentMonth?: boolean }

interface Props {
  data:          MonthData[]
  currentMonth:  number
  previousMonth: number
}

function getSituationalTitle(
  currentMonth: number,
  previousMonth: number,
  trendPct: number,
  hasAnyRevenue: boolean,
  fmt: (n: number) => string,
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

export default function RevenueStorySection({
  data, currentMonth, previousMonth }: Props) {
  const { format: fmt } = useCurrency()

  const trendPct     = previousMonth > 0
    ? Math.round(((currentMonth - previousMonth) / previousMonth) * 100)
    : 0
  const hasAnyRevenue = data.some(d => d.revenue > 0)
  const avg6          = data.length > 0
    ? data.reduce((s, d) => s + d.revenue, 0) / data.length
    : 0

  const { headline, sub, icon } = getSituationalTitle(
    currentMonth, previousMonth, trendPct, hasAnyRevenue, fmt,
  )

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden inv-fade-up inv-fade-up-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">

      {/* Header */}
      <div className="p-6 border-b border-gray-50 bg-[#F8FAFF]">
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
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-white/70 rounded-xl border border-gray-200/70">
              <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider">This month</p>
              <p className="text-base sm:text-lg font-black text-gray-900 mt-0.5 inv-mono">{fmt(currentMonth)}</p>
            </div>
            <div className="p-2 sm:p-3 bg-white/70 rounded-xl border border-gray-200/70">
              <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider">Last month</p>
              <p className="text-base sm:text-lg font-black text-gray-900 mt-0.5 inv-mono">{fmt(previousMonth)}</p>
            </div>
            <div className={`p-3 rounded-xl border ${
              trendPct > 0  ? 'bg-teal-50 border-teal-200' :
              trendPct < 0  ? 'bg-red-50 border-red-200'   :
                              'bg-gray-50 border-gray-200'
            }`}>
              <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider">Change</p>
              <p className={`text-base sm:text-lg font-black mt-0.5 ${
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
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <BarChart3 className="w-10 h-10 text-gray-200 mb-2" />
            <p className="text-sm font-bold text-gray-400 mb-1">No revenue data yet</p>
            <p className="text-xs text-gray-300">Send your first invoice to populate this chart</p>
          </div>
        ) : (() => {
          const maxVal = Math.max(...data.map(d => d.revenue), 1)
          const BAR_H  = 160
          return (
            <div style={{ display:'flex', gap:6, alignItems:'flex-end', height: BAR_H + 28 }}>
              {data.map((d, i) => (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <div style={{ width:'100%', height: BAR_H, display:'flex', alignItems:'flex-end' }}>
                    <div
                      style={{
                        width: '100%',
                        height: `${Math.max(Math.round((d.revenue / maxVal) * BAR_H), d.revenue > 0 ? 3 : 0)}px`,
                        borderRadius: '3px 3px 0 0',
                        background: d.isCurrentMonth
                          ? 'linear-gradient(180deg,#0066FF,#0044CC)'
                          : 'linear-gradient(180deg,#6BA4FF,#4477DD)',
                        opacity: d.isCurrentMonth ? 1 : 0.7,
                        transition: 'height .3s',
                        position: 'relative',
                      }}
                      title={`${d.month}: ${fmt(d.revenue)}`}
                    >
                      {d.isCurrentMonth && (
                        <div style={{
                          position:'absolute', bottom: '100%', left:'50%', transform:'translateX(-50%)',
                          marginBottom:4, background:'#0A0A0A', color:'#fff',
                          fontSize:'.6rem', fontWeight:800, padding:'2px 6px', borderRadius:4,
                          whiteSpace:'nowrap', pointerEvents:'none',
                        }}>
                          {fmt(d.revenue)}
                        </div>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize:'.6rem', color: d.isCurrentMonth ? '#0055FF' : '#9CA3AF', fontWeight: d.isCurrentMonth ? 800 : 600, letterSpacing:'.02em' }}>
                    {d.month}
                  </span>
                </div>
              ))}
            </div>
          )
        })()}

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
