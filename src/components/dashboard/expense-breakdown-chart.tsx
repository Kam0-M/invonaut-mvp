'use client'

import { useCurrency } from '@/lib/context/currency-context'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

type ChartEntry = {
  name: string
  value: number
  color: string
}


const CustomTooltip = ({ active, payload }: any) => {
  const { format: fmt } = useCurrency()
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: '#fff',
        border: '2px solid #E5E7EB',
        borderRadius: '12px',
        padding: '10px 14px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
      }}>
        <p style={{ fontWeight: 700, color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
          {payload[0].name}
        </p>
        <p style={{ fontWeight: 900, color: '#111827', fontSize: '18px', margin: 0 }}>
          {fmt(payload[0].value)}
        </p>
      </div>
    )
  }
  return null
}

export function ExpenseBreakdownChart({
  data }: { data: ChartEntry[] }) {
  const { format: fmt } = useCurrency()
  return (
    <div style={{ width: '100%', height: '280px' }}>
      <ResponsiveContainer width="100%" height="100%">
        {/* @ts-ignore */}
        <PieChart>
          {/* @ts-ignore */}
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              // @ts-ignore
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          {/* @ts-ignore */}
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}