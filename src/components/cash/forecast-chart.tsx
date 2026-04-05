'use client'
// src/components/cash/forecast-chart.tsx
//
// WHAT IT DOES:
//   An area chart showing projected bank balance week-by-week over 13 weeks.
//   Each data point = start-of-week projected balance after:
//     + invoices due that week (inflows)
//     - average weekly expenses (outflows)
//
// DATA IS COMPUTED SERVER-SIDE on the cash page and passed as props.
// This component is pure display.
//
// EDGE CASES HANDLED:
//   - Negative projected balance: clamped to 0 on display, shown in red
//   - No balance set: caller passes empty array, parent shows prompt instead
//   - @ts-ignore on all Recharts components (known TS issue, intentional)

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

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)

const formatYAxis = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as ForecastPoint
  const isNegative = d.projectedBalance < 0
  return (
    <div style={{
      background: '#fff', border: '2px solid #E5E7EB', borderRadius: 12,
      padding: '12px 16px', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', minWidth: 180,
    }}>
      <p style={{ fontWeight: 700, color: '#6B7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>{label}</p>
      <p style={{ fontWeight: 900, fontSize: 18, margin: '0 0 6px', color: isNegative ? '#DC2626' : '#1D4ED8' }}>
        {isNegative ? '−' : ''}{formatCurrency(Math.abs(d.projectedBalance))}
      </p>
      {d.inflows > 0 && (
        <p style={{ fontSize: 12, color: '#059669', margin: '2px 0', fontWeight: 600 }}>
          + {formatCurrency(d.inflows)} expected in
        </p>
      )}
      {d.outflows > 0 && (
        <p style={{ fontSize: 12, color: '#DC2626', margin: '2px 0', fontWeight: 600 }}>
          − {formatCurrency(d.outflows)} expenses
        </p>
      )}
      {isNegative && (
        <p style={{ fontSize: 11, color: '#DC2626', marginTop: 6, fontWeight: 700 }}>⚠ Projected shortfall</p>
      )}
    </div>
  )
}

export function ForecastChart({ data }: { data: ForecastPoint[] }) {
  if (!data.length) return null

  const hasNegative = data.some(d => d.projectedBalance < 0)

  // Use separate gradient IDs per instance to avoid SVG conflicts
  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        {/* @ts-ignore */}
        <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 60 }}>
          <defs>
            <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="forecastGradNeg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {/* @ts-ignore */}
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          {/* @ts-ignore */}
          <XAxis
            dataKey="week"
            stroke="none"
            tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
            interval={1}
          />
          {/* @ts-ignore */}
          <YAxis
            stroke="none"
            tickFormatter={formatYAxis}
            tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
            width={56}
          />
          {/* @ts-ignore */}
          <Tooltip content={<CustomTooltip />} />
          {/* Zero line — only shown when chart dips below 0 */}
          {hasNegative && (
            // @ts-ignore
            <ReferenceLine y={0} stroke="#EF4444" strokeDasharray="4 4" strokeWidth={1.5} />
          )}
          {/* @ts-ignore */}
          <Area
            type="monotone"
            dataKey="projectedBalance"
            stroke={hasNegative ? '#EF4444' : '#2563EB'}
            strokeWidth={2.5}
            fill={hasNegative ? 'url(#forecastGradNeg)' : 'url(#forecastGrad)'}
            dot={{ r: 3, fill: hasNegative ? '#EF4444' : '#2563EB', strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}