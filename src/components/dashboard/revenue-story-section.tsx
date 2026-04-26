'use client'
// src/components/dashboard/revenue-story-section.tsx
//
// Transforms the revenue chart into a storytelling component.
// - Narrative headline: "Revenue is up 18% this month"
// - Animated bar draw-in (1400ms ease-out)
// - This month vs last month quick stats
// - Insight footer with average analysis
// - Blue→teal gradient on current bar

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import Link from 'next/link'

type MonthData = { month: string; revenue: number; isCurrentMonth?: boolean }

interface Props {
  data:          MonthData[]
  currentMonth:  number
  previousMonth: number
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const fmtK = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : fmt(n)

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg border border-cyan-400/30 text-xs">
      <p className="font-bold text-gray-300 mb-0.5">{payload[0].payload.month}</p>
      <p className="font-black text-cyan-300">{fmtK(payload[0].value)}</p>
    </div>
  )
}

export default function RevenueStorySection({ data, currentMonth, previousMonth }: Props) {
  const [animated, setAnimated] = useState(data.map(d => ({ ...d, displayRevenue: 0 })))

  const trendPct  = previousMonth > 0 ? Math.round(((currentMonth - previousMonth) / previousMonth) * 100) : 0
  const isGrowing = trendPct >= 0
  const avg6      = data.reduce((s, d) => s + d.revenue, 0) / data.length

  // Draw-in animation
  useEffect(() => {
    const duration  = 1400
    const startTime = Date.now()

    const tick = () => {
      const elapsed  = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const ease     = 1 - Math.pow(1 - progress, 3) // ease-out cubic

      setAnimated(data.map(d => ({ ...d, displayRevenue: d.revenue * ease })))
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [data])

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden inv-fade-up inv-fade-up-3">

      {/* Header */}
      <div className="p-6 border-b border-gray-50 bg-gradient-to-br from-blue-50/60 via-cyan-50/30 to-transparent">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            {/* Narrative headline */}
            <div className="flex items-center gap-2 mb-2">
              {isGrowing
                ? <TrendingUp  className="w-5 h-5 text-teal-600 flex-shrink-0" />
                : <TrendingDown className="w-5 h-5 text-red-500 flex-shrink-0" />
              }
              <h2 className="text-xl font-black text-gray-900">
                {previousMonth > 0
                  ? `Revenue is ${isGrowing ? 'up' : 'down'} ${Math.abs(trendPct)}% this month`
                  : 'Revenue is building'}
              </h2>
            </div>
            <p className="text-sm text-gray-500 font-medium">
              {isGrowing
                ? `${fmtK(currentMonth)} collected. Momentum is ${trendPct > 15 ? 'accelerating' : 'building'}.`
                : `${fmtK(currentMonth)} collected. Consider reviewing your pipeline.`}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-md flex-shrink-0">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-white/60 rounded-xl border border-gray-200/70">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">This month</p>
            <p className="text-lg font-black text-gray-900 mt-0.5">{fmtK(currentMonth)}</p>
          </div>
          <div className="p-3 bg-white/60 rounded-xl border border-gray-200/70">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Last month</p>
            <p className="text-lg font-black text-gray-900 mt-0.5">{fmtK(previousMonth)}</p>
          </div>
          <div className={`p-3 rounded-xl border ${isGrowing ? 'bg-teal-50 border-teal-200' : 'bg-red-50 border-red-200'}`}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Change</p>
            <p className={`text-lg font-black mt-0.5 ${isGrowing ? 'text-teal-600' : 'text-red-600'}`}>
              {isGrowing ? '+' : ''}{trendPct}%
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <div className="w-full h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={animated} margin={{ top: 4, right: 0, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#2563EB" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.4}  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" stroke="#CBD5E1" tick={{ fontSize: 10, fill: '#94A3B8' }} />
              <YAxis stroke="#CBD5E1" tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(6,182,212,0.06)' }} />
              <Bar dataKey="displayRevenue" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                {animated.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.isCurrentMonth ? '#06B6D4' : 'url(#rev-grad)'}
                    opacity={entry.isCurrentMonth ? 1 : 0.75}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Insight footer */}
        <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-100">
          <p className="text-xs text-gray-600">
            <span className="font-bold text-blue-600">📊 Insight: </span>
            Your 6-month average is {fmtK(avg6)}. This month is{' '}
            <span className={`font-bold ${currentMonth >= avg6 ? 'text-teal-600' : 'text-amber-600'}`}>
              {currentMonth >= avg6 ? 'above' : 'below'} trend.
            </span>
          </p>
        </div>

        <div className="flex justify-end mt-3">
          <Link href="/dashboard/analytics" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
            Full analytics →
          </Link>
        </div>
      </div>
    </div>
  )
}
