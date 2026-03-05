'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type RevenueChartProps = {
  data: Array<{
    month: string
    revenue: number
  }>
}

export function RevenueChart({ data }: RevenueChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`
    }
    return `$${value}`
  }

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          border: '2px solid #E5E7EB',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{ 
            fontWeight: 700, 
            marginBottom: '6px', 
            color: '#111827',
            fontSize: '13px'
          }}>
            {label}
          </p>
          <p style={{ 
            fontWeight: 900, 
            color: '#0066FF',
            fontSize: '18px',
            margin: 0
          }}>
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        {/* @ts-ignore - Recharts typing issue */}
        <LineChart 
          data={data} 
          margin={{ top: 10, right: 30, bottom: 10, left: 70 }}
        >
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0066FF" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#0066FF" stopOpacity={0}/>
            </linearGradient>
          </defs>
          {/* @ts-ignore - Recharts typing issue */}
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          {/* @ts-ignore - Recharts typing issue */}
          <XAxis 
            dataKey="month" 
            stroke="#9CA3AF"
            tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={false}
          />
          {/* @ts-ignore - Recharts typing issue */}
          <YAxis 
            stroke="#9CA3AF"
            tickFormatter={formatYAxis}
            tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={false}
            width={65}
          />
          {/* @ts-ignore - Recharts typing issue */}
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#0066FF', strokeWidth: 1, strokeDasharray: '5 5' }} />
          {/* @ts-ignore - Recharts typing issue */}
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="#0066FF" 
            strokeWidth={3.5}
            dot={{ fill: '#0066FF', r: 5, strokeWidth: 3, stroke: '#FFFFFF' }}
            activeDot={{ 
              r: 7, 
              fill: '#0066FF', 
              strokeWidth: 3, 
              stroke: '#FFFFFF',
              filter: 'drop-shadow(0px 2px 8px rgba(0, 102, 255, 0.3))'
            }}
            fill="url(#colorRevenue)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}