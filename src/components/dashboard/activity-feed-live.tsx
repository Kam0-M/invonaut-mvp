'use client'
// src/components/dashboard/activity-feed-live.tsx
//
// Real-time activity feed with:
// - Staggered slide-in entrance (80ms per item)
// - Left border color-coded by type
// - AI follow-up items get a pulsing AI badge
// - Relative timestamps
// - Type label badges

import { useState, useEffect } from 'react'
import Link from 'next/link'

type ActivityType = 'invoice' | 'payment' | 'followup' | 'contract'

export type ActivityItem = {
  id:        string
  type:      ActivityType
  icon:      string
  title:     string
  detail:    string
  timestamp: string
}

interface Props {
  items:    ActivityItem[]
  viewAll?: string
}

const typeStyles: Record<ActivityType, string> = {
  invoice:  'border-l-blue-500 hover:bg-blue-50/40',
  payment:  'border-l-teal-500 hover:bg-teal-50/40',
  followup: 'border-l-cyan-500 hover:bg-cyan-50/40',
  contract: 'border-l-indigo-500 hover:bg-indigo-50/40',
}

const typeLabels: Record<ActivityType, string> = {
  invoice:  'Invoice',
  payment:  'Payment',
  followup: 'AI Follow-up',
  contract: 'Contract',
}

function relativeTime(ts: string) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (diff < 60)        return 'just now'
  if (diff < 3600)      return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)     return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800)    return `${Math.floor(diff / 86400)}d ago`
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ActivityFeedLive({ items, viewAll }: Props) {
  const [visible, setVisible] = useState<number[]>([])

  useEffect(() => {
    items.forEach((_, i) => {
      setTimeout(() => setVisible(v => [...v, i]), i * 80)
    })
  }, [items.length])

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden inv-fade-up inv-fade-up-5">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Activity</p>
        <span className="flex items-center gap-1.5 text-xs font-bold text-teal-600">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 inv-pulse-dot" />Live
        </span>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-6">
          <span className="text-3xl mb-3">⚡</span>
          <p className="text-sm font-bold text-gray-400 mb-1">No activity yet</p>
          <p className="text-xs text-gray-300 font-medium">Sent invoices, logged payments, and signed contracts appear here</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {items.map((item, i) => (
            <div
              key={item.id}
              className={`
                border-l-4 px-5 py-3.5 transition-all duration-300
                ${typeStyles[item.type]}
                ${visible.includes(i) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3'}
              `}
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0 mt-0.5">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs font-bold text-gray-900">{item.title}</p>
                    {item.type === 'followup' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-cyan-100 text-cyan-700 rounded-full">
                        <span className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse" />AI
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{item.detail}</p>
                  <p className="text-[10px] text-gray-300 font-medium mt-1">{relativeTime(item.timestamp)}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md flex-shrink-0 self-start">
                  {typeLabels[item.type]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewAll && (
        <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/40 text-center">
          <Link href={viewAll} className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
            View all activity →
          </Link>
        </div>
      )}
    </div>
  )
}
