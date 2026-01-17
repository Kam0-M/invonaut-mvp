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

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis 
          dataKey="month" 
          stroke="#6B7280"
        />
        <YAxis 
          stroke="#6B7280"
          tickFormatter={formatCurrency}
        />
        <Tooltip 
          formatter={(value: number) => formatCurrency(value)}
        />
        <Line 
          type="monotone" 
          dataKey="revenue" 
          stroke="#0066FF" 
          strokeWidth={4}
          dot={{ fill: '#0066FF', r: 5 }}
          activeDot={{ r: 7 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}