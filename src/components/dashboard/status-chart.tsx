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

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
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
            {payload[0].name}
          </p>
          <p style={{ 
            fontWeight: 900, 
            color: payload[0].payload.color,
            fontSize: '18px',
            margin: 0
          }}>
            {payload[0].value} invoice{payload[0].value !== 1 ? 's' : ''}
          </p>
        </div>
      )
    }
    return null
  }

  // Custom legend
  const renderLegend = (props: any) => {
    const { payload } = props
    return (
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        justifyContent: 'center', 
        gap: '16px',
        marginTop: '16px'
      }}>
        {payload.map((entry: any, index: number) => {
          const item = data.find(d => d.name === entry.value)
          return (
            <div 
              key={`legend-${index}`} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#374151'
              }}
            >
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                backgroundColor: entry.color,
                boxShadow: `0 2px 6px ${entry.color}40`
              }} />
              <span>
                {entry.value} <span style={{ color: '#6B7280' }}>({item?.value || 0})</span>
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            {data.map((entry, index) => (
              <filter key={`shadow-${index}`} id={`shadow-${index}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                <feOffset dx="0" dy="2" result="offsetblur"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.2"/>
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            ))}
          </defs>
          {/* @ts-ignore - Recharts typing issue */}
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={65}
            outerRadius={105}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
            animationBegin={0}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                style={{ 
                  filter: `drop-shadow(0px 4px 8px ${entry.color}30)`,
                  cursor: 'pointer'
                }}
              />
            ))}
          </Pie>
          {/* @ts-ignore - Recharts typing issue */}
          <Tooltip content={<CustomTooltip />} />
          {/* @ts-ignore - Recharts typing issue */}
          <Legend 
            content={renderLegend}
            verticalAlign="bottom"
            height={50}
          />
          {/* Center text */}
          <text
            x="50%"
            y="42%"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontSize: '36px',
              fontWeight: 900,
              fill: '#111827',
              filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.1))'
            }}
          >
            {total}
          </text>
          <text
            x="50%"
            y="51%"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontSize: '13px',
              fontWeight: 700,
              fill: '#6B7280',
              letterSpacing: '0.5px'
            }}
          >
            TOTAL
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}