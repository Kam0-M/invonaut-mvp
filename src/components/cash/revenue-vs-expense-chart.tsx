'use client'

import { useCurrency } from '@/lib/context/currency-context'
// src/components/cash/revenue-vs-expense-chart.tsx
//
// WHAT IT DOES:
//   A grouped bar chart showing revenue vs expenses side-by-side for each of
//   the last 12 months. The gap between the bars is the monthly profit/loss.
//   Used on both the Cash Management page and the Analytics page.
//
// Data is computed server-side and passed as props.
// @ts-ignore on all Recharts — known TS issue, intentional throughout this codebase.

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from 'recharts'

export type RevExpPoint = {
  month:    string   // "Jan", "Feb", etc.
  revenue:  number
  expenses: number
  profit:   number   // revenue - expenses (for tooltip)
}


const formatYAxis = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

const CustomTooltip = ({ active, payload, label }: any) => {
  const { format: fmt } = useCurrency()
  if (!active || !payload?.length) return null
  const rev  = payload.find((p: any) => p.dataKey === 'revenue')?.value  ?? 0
  const exp  = payload.find((p: any) => p.dataKey === 'expenses')?.value ?? 0
  const prof = rev - exp
  return (
    <div style={{
      background: '#fff', border: '2px solid #E5E7EB', borderRadius: 12,
      padding: '12px 16px', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', minWidth: 170,
    }}>
      <p style={{ fontWeight: 700, color: '#6B7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>{label}</p>
      <p style={{ fontSize: 13, margin: '2px 0', color: '#0066FF', fontWeight: 700 }}>
        Revenue: {fmt(rev)}
      </p>
      <p style={{ fontSize: 13, margin: '2px 0', color: '#F97316', fontWeight: 700 }}>
        Expenses: {fmt(exp)}
      </p>
      <p style={{ fontSize: 13, margin: '6px 0 0', borderTop: '1px solid #F3F4F6', paddingTop: 6, fontWeight: 900, color: prof >= 0 ? '#1D4ED8' : '#DC2626' }}>
        {prof >= 0 ? 'Profit' : 'Loss'}: {prof < 0 ? '−' : ''}{fmt(Math.abs(prof))}
      </p>
    </div>
  )
}

const CustomLegend = () => (
  <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 8 }}>
    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#6B7280' }}>
      <span style={{ width: 12, height: 12, borderRadius: 3, background: '#0066FF', display: 'inline-block' }} />
      Revenue
    </span>
    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#6B7280' }}>
      <span style={{ width: 12, height: 12, borderRadius: 3, background: '#F97316', display: 'inline-block' }} />
      Expenses
    </span>
  </div>
)

export function RevenueVsExpenseChart({
  data }: { data: RevExpPoint[] }) {
  const { format: fmt } = useCurrency()
  const hasData = data.some(d => d.revenue > 0 || d.expenses > 0)

  return (
    <div>
      <CustomLegend />
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          {/* @ts-ignore */}
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 56 }} barCategoryGap="28%" barGap={2}>
            {/* @ts-ignore */}
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            {/* @ts-ignore */}
            <XAxis
              dataKey="month"
              stroke="none"
              tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
            />
            {/* @ts-ignore */}
            <YAxis
              stroke="none"
              tickFormatter={formatYAxis}
              tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
              width={52}
            />
            {/* @ts-ignore */}
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB', radius: 4 }} />
            {/* @ts-ignore */}
            <Bar dataKey="revenue"  radius={[4, 4, 0, 0]} fill="#0066FF" maxBarSize={32} />
            {/* @ts-ignore */}
            <Bar dataKey="expenses" radius={[4, 4, 0, 0]} fill="#F97316" maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {!hasData && (
        <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#9CA3AF', marginTop: 8 }}>
          No data yet for the last 12 months.
        </p>
      )}
    </div>
  )
}