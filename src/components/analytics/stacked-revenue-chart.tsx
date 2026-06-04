'use client'

import { useCurrency } from '@/lib/context/currency-context'
// src/components/analytics/stacked-revenue-chart.tsx
//
// Stacked bar chart: Invoice Income (blue) + Direct Payments (#00D4AA teal)
// stacked into one revenue bar, with Expenses (orange) as a side-by-side bar.
// Uses Recharts BarChart with stackId to stack the two revenue series.
// @ts-ignore on all Recharts — intentional throughout this codebase.

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

export type StackedRevPoint = {
  month:      string
  invoiceRev: number
  directRev:  number
  revenue:    number   // total (kept for compat)
  expenses:   number
  profit:     number
}

const fmt = (n: number) =>
  fmt(n)

const formatYAxis = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const invRev = payload.find((p: any) => p.dataKey === 'invoiceRev')?.value ?? 0
  const dirRev = payload.find((p: any) => p.dataKey === 'directRev')?.value  ?? 0
  const exp    = payload.find((p: any) => p.dataKey === 'expenses')?.value   ?? 0
  const total  = invRev + dirRev
  const profit = total - exp
  return (
    <div style={{
      background: '#fff', border: '2px solid #E5E7EB', borderRadius: 12,
      padding: '12px 16px', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', minWidth: 190,
    }}>
      <p style={{ fontWeight: 700, color: '#6B7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
        {label}
      </p>
      {invRev > 0 && (
        <p style={{ fontSize: 13, margin: '2px 0', color: '#2563EB', fontWeight: 700 }}>
          Invoices: {fmt(invRev)}
        </p>
      )}
      {dirRev > 0 && (
        <p style={{ fontSize: 13, margin: '2px 0', color: '#0D9488', fontWeight: 700 }}>
          Direct: {fmt(dirRev)}
        </p>
      )}
      {total > 0 && (invRev > 0 || dirRev > 0) && (
        <p style={{ fontSize: 13, margin: '2px 0 6px', color: '#059669', fontWeight: 900 }}>
          Total Income: {fmt(total)}
        </p>
      )}
      <p style={{ fontSize: 13, margin: '2px 0', color: '#F97316', fontWeight: 700 }}>
        Expenses: {fmt(exp)}
      </p>
      <p style={{
        fontSize: 13, margin: '6px 0 0', borderTop: '1px solid #F3F4F6',
        paddingTop: 6, fontWeight: 900,
        color: profit >= 0 ? '#1D4ED8' : '#DC2626',
      }}>
        {profit >= 0 ? 'Profit' : 'Loss'}: {profit < 0 ? '−' : ''}{fmt(Math.abs(profit))}
      </p>
    </div>
  )
}

const CustomLegend = () => (
  <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 10, flexWrap: 'wrap' }}>
    {[
      { label: 'Invoice Income',   color: '#2563EB' },
      { label: 'Direct Payments',  color: '#00D4AA' },
      { label: 'Expenses',         color: '#F97316' },
    ].map(l => (
      <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#6B7280' }}>
        <span style={{ width: 12, height: 12, borderRadius: 3, background: l.color, display: 'inline-block' }} />
        {l.label}
      </span>
    ))}
  </div>
)

export function StackedRevenueChart({
  data }: { data: StackedRevPoint[] }) {
  const { format: fmt } = useCurrency()
  const hasData = data.some(d => d.invoiceRev > 0 || d.directRev > 0 || d.expenses > 0)

  return (
    <div>
      <CustomLegend />
      <div style={{ width: '100%', height: 300 }}>
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

            {/* Invoice income — blue, bottom of stack */}
            {/* @ts-ignore */}
            <Bar dataKey="invoiceRev" stackId="income" fill="#2563EB" maxBarSize={32} radius={[0, 0, 0, 0]} name="Invoice Income" />

            {/* Direct payments — teal (#00D4AA), top of stack — rounded top corners */}
            {/* @ts-ignore */}
            <Bar dataKey="directRev" stackId="income" fill="#00D4AA" maxBarSize={32} radius={[4, 4, 0, 0]} name="Direct Payments" />

            {/* Expenses — orange, separate bar */}
            {/* @ts-ignore */}
            <Bar dataKey="expenses" fill="#F97316" maxBarSize={32} radius={[4, 4, 0, 0]} name="Expenses" />
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
