'use client'

import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from 'recharts'

type StatusChartProps = {
  data: Array<{
    name: string
    value: number
    color: string
  }>
}

export function StatusChart({ data }: StatusChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
          paddingAngle={3}
          dataKey="value"
          strokeWidth={2}
          stroke="#fff"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: number) => `${value} invoices`}
        />
        <Legend 
          verticalAlign="bottom" 
          height={36}
          formatter={(value) => {
            const item = data.find(d => d.name === value)
            return `${value} (${item?.value || 0})`
          }}
        />
        <text
          x="50%"
          y="48%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="32"
          fontWeight="900"
          fill="#111827"
        >
          {total}
        </text>
        <text
          x="50%"
          y="58%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="13"
          fontWeight="700"
          fill="#6B7280"
        >
          Total
        </text>
      </PieChart>
    </ResponsiveContainer>
  )
}