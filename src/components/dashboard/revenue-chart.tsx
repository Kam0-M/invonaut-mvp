'use client'

import { useCurrency } from '@/lib/context/currency-context'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'

type RevenueChartProps = {
  data: Array<{
    month: string
    revenue: number
    isCurrentMonth?: boolean
  }>
}


const formatYAxis = (value: number) => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

const CustomTooltip = ({ active, payload, label }: any) => {
  const { format: fmt } = useCurrency()
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: '#fff',
        border: '2px solid #E5E7EB',
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
      }}>
        <p style={{ fontWeight: 700, color: '#6B7280', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </p>
        <p style={{ fontWeight: 900, color: '#1D4ED8', fontSize: '20px', margin: 0 }}>
          {fmt(payload[0].value)}
        </p>
      </div>
    )
  }
  return null
}

export function RevenueChart({
  data }: RevenueChartProps) {
  const { format: fmt } = useCurrency()
  const hasAnyRevenue = data.some(d => d.revenue > 0)

  return (
    <div style={{ position: 'relative', width: '100%', height: '280px' }}>
      <ResponsiveContainer width="100%" height="100%">
        {/* @ts-ignore */}
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 56 }} barCategoryGap="32%">
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity={1} />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.7} />
            </linearGradient>
            <linearGradient id="barGradientCurrent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1D4ED8" stopOpacity={1} />
              <stop offset="100%" stopColor="#2563EB" stopOpacity={0.9} />
            </linearGradient>
            <linearGradient id="barGradientEmpty" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E5E7EB" stopOpacity={1} />
              <stop offset="100%" stopColor="#F3F4F6" stopOpacity={1} />
            </linearGradient>
          </defs>
          {/* @ts-ignore */}
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          {/* @ts-ignore */}
          <XAxis
            dataKey="month"
            stroke="none"
            tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
          />
          {/* @ts-ignore */}
          <YAxis
            stroke="none"
            tickFormatter={formatYAxis}
            tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
            width={52}
          />
          {/* @ts-ignore */}
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB', radius: 6 }} />
          {/* @ts-ignore */}
          <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={56}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.revenue === 0
                    ? 'url(#barGradientEmpty)'
                    : entry.isCurrentMonth
                    ? 'url(#barGradientCurrent)'
                    : 'url(#barGradient)'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {!hasAnyRevenue && (
        <div style={{
          position: 'absolute',
          bottom: '48px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.9)',
          border: '1.5px solid #E5E7EB',
          borderRadius: '10px',
          padding: '8px 16px',
          pointerEvents: 'none',
        }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#9CA3AF', margin: 0, whiteSpace: 'nowrap' }}>
            No paid invoices yet
          </p>
        </div>
      )}
    </div>
  )
}