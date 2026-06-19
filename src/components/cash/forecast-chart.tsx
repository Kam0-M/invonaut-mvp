'use client'

import { useCurrency } from '@/lib/context/currency-context'
// src/components/cash/forecast-chart.tsx
//
// Dark terminal aesthetic — teal line on #0F1117 background.
// DATA IS COMPUTED SERVER-SIDE on the cash page and passed as props.

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'

export type ForecastPoint = {
  week:             string   // e.g. "Apr 7"
  projectedBalance: number   // may be negative before clamping in tooltip
  inflows:          number   // invoice payments expected this week
  outflows:         number   // average weekly expenses
}

const TEAL    = '#00C4A0'
const RED     = '#f87171'
const BG      = '#0F1117'
const GRID    = 'rgba(255,255,255,0.06)'
const MUTED   = '#475569'

const CustomTooltip = ({ active, payload, label }: any) => {
  const { format: fmt, symbol } = useCurrency()
  const formatY = (n: number): string => {
    const abs = Math.abs(n)
    if (abs >= 999_500) return `${symbol}${(abs/1_000_000).toFixed(1)}M`
    if (abs >= 9_950)   return `${symbol}${(abs/1_000).toFixed(0)}K`
    return `${symbol}${Math.round(abs)}`
  }
  if (!active || !payload?.length) return null
  const d = payload[0].payload as ForecastPoint
  const isNeg = d.projectedBalance < 0
  return (
    <div style={{
      background: '#131929',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10,
      padding: '12px 16px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      minWidth: 180,
    }}>
      <p style={{
        fontWeight: 700, color: MUTED, fontSize: 10,
        textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px',
        fontFamily: "'JetBrains Mono', monospace",
      }}>{label}</p>
      <p style={{
        fontWeight: 900, fontSize: 18, margin: '0 0 6px',
        color: isNeg ? RED : TEAL,
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        {isNeg ? '−' : ''}{fmt(Math.abs(d.projectedBalance))}
      </p>
      {d.inflows > 0 && (
        <p style={{ fontSize: 11, color: TEAL, margin: '2px 0', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
          + {fmt(d.inflows)} expected in
        </p>
      )}
      {d.outflows > 0 && (
        <p style={{ fontSize: 11, color: '#f87171', margin: '2px 0', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
          − {fmt(d.outflows)} expenses
        </p>
      )}
      {isNeg && (
        <p style={{ fontSize: 10, color: RED, marginTop: 6, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
          Projected shortfall
        </p>
      )}
    </div>
  )
}

export function ForecastChart({ data }: { data: ForecastPoint[] }) {
  const { format: fmt, symbol } = useCurrency()
  const formatY = (n: number): string => {
    const abs = Math.abs(n)
    if (abs >= 999_500) return `${symbol}${(abs/1_000_000).toFixed(1)}M`
    if (abs >= 9_950)   return `${symbol}${(abs/1_000).toFixed(0)}K`
    return `${symbol}${Math.round(abs)}`
  }
  if (!data.length) return null

  const hasNegative = data.some(d => d.projectedBalance < 0)
  const lineColor   = hasNegative ? RED : TEAL
  const todayLabel  = data[0]?.week

  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        {/* @ts-ignore */}
        <AreaChart data={data} margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="forecastGradTeal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={TEAL} stopOpacity={0.18} />
              <stop offset="95%" stopColor={TEAL} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="forecastGradRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={RED} stopOpacity={0.15} />
              <stop offset="95%" stopColor={RED} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {/* @ts-ignore */}
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />

          {/* @ts-ignore */}
          <XAxis
            dataKey="week"
            stroke="none"
            tick={{ fill: MUTED, fontSize: 10, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}
            tickLine={false}
            axisLine={false}
            interval={1}
          />

          {/* @ts-ignore */}
          <YAxis
            stroke="none"
            tickFormatter={formatY}
            tick={{ fill: MUTED, fontSize: 10, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}
            tickLine={false}
            axisLine={false}
            width={56}
          />

          {/* @ts-ignore */}
          <Tooltip content={<CustomTooltip />} />

          {/* Today marker — vertical dashed rule at current week */}
          {todayLabel && (
            // @ts-ignore
            <ReferenceLine
              x={todayLabel}
              stroke="rgba(0,196,160,0.5)"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{
                value: 'NOW',
                fill: TEAL,
                fontSize: 9,
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                position: 'top',
              }}
            />
          )}

          {/* Zero line — only when chart dips negative */}
          {hasNegative && (
            // @ts-ignore
            <ReferenceLine y={0} stroke={RED} strokeDasharray="4 4" strokeWidth={1.5} />
          )}

          {/* @ts-ignore */}
          <Area
            type="monotone"
            dataKey="projectedBalance"
            stroke={lineColor}
            strokeWidth={2.5}
            fill={hasNegative ? 'url(#forecastGradRed)' : 'url(#forecastGradTeal)'}
            dot={{ r: 2.5, fill: lineColor, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: lineColor, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
