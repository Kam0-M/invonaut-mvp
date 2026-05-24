'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AlertTriangle, TrendingDown, Zap, Lightbulb,
  ArrowRight, X, CheckCircle2, RefreshCw,
  AlertCircle, DollarSign, Users, FileText, Clock
} from 'lucide-react'

interface Insight {
  id: string
  type: string
  urgency: string
  title: string
  body: string
  action_label: string | null
  action_url: string | null
  status: string
  created_at: string
}

interface Props {
  insights: Insight[]
  isPro: boolean
  lastRefreshed?: string | null
}

const URGENCY_CONFIG = {
  critical:    { icon: AlertTriangle, bg: 'bg-red-50',    border: 'border-red-100',    icon_bg: 'bg-red-100',    icon_color: 'text-red-600',    badge: 'bg-red-100 text-red-700',    label: 'Critical'     },
  warning:     { icon: AlertCircle,   bg: 'bg-amber-50',  border: 'border-amber-100',  icon_bg: 'bg-amber-100',  icon_color: 'text-amber-600',  badge: 'bg-amber-100 text-amber-700',  label: 'Warning'      },
  opportunity: { icon: Lightbulb,     bg: 'bg-blue-50',   border: 'border-blue-100',   icon_bg: 'bg-blue-100',   icon_color: 'text-blue-600',   badge: 'bg-blue-100 text-blue-700',    label: 'Opportunity'  },
  info:        { icon: Zap,           bg: 'bg-gray-50',   border: 'border-gray-100',   icon_bg: 'bg-gray-100',   icon_color: 'text-gray-500',   badge: 'bg-gray-100 text-gray-600',    label: 'Info'         },
}

const TYPE_ICON: Record<string, any> = {
  cash_dip:               TrendingDown,
  revenue_concentration:  Users,
  spending_spike:         DollarSign,
  unbilled_work:          Clock,
  stagnant_client:        Users,
  contract_gap:           FileText,
  pipeline_risk:          AlertCircle,
  opportunity:            Lightbulb,
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const hrs  = Math.floor(diff / 3600000)
  if (hrs < 1)  return 'Just now'
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function IntelligenceFeed({ insights, isPro, lastRefreshed }: Props) {
  const router  = useRouter()
  const [dismissing, setDismissing] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'opportunity'>('all')

  const active = insights.filter(i => i.status === 'active')
  const filtered = active.filter(i => filter === 'all' || i.urgency === filter)

  const criticalCount    = active.filter(i => i.urgency === 'critical').length
  const warningCount     = active.filter(i => i.urgency === 'warning').length
  const opportunityCount = active.filter(i => i.urgency === 'opportunity').length

  const handleDismiss = async (id: string) => {
    setDismissing(id)
    try {
      await fetch('/api/intelligence/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insight_id: id }),
      })
      router.refresh()
    } finally {
      setDismissing(null)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetch('/api/intelligence/refresh', { method: 'POST' })
      router.refresh()
    } finally {
      setRefreshing(false)
    }
  }

  if (!isPro) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Financial Intelligence</p>
        </div>
        <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-6 text-center">
          <p className="text-sm font-black text-gray-900 mb-1">Intelligence requires Professional</p>
          <p className="text-xs text-gray-400 mb-4 max-w-xs mx-auto">
            Upgrade to get AI-powered alerts, client risk profiles, and proactive cash flow warnings.
          </p>
          <Link href="/dashboard/billing" className="btn-primary px-4 py-2 rounded-xl text-sm inline-flex items-center gap-1.5">
            Upgrade <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Financial Intelligence</p>
            {lastRefreshed && (
              <p className="text-[10px] text-gray-300 mt-0.5">Updated {timeAgo(lastRefreshed)}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Analysing…' : 'Refresh'}
        </button>
      </div>

      {/* Summary pills */}
      {active.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {criticalCount > 0 && (
            <button onClick={() => setFilter(filter === 'critical' ? 'all' : 'critical')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black transition ${filter === 'critical' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
              <AlertTriangle className="w-3 h-3" /> {criticalCount} Critical
            </button>
          )}
          {warningCount > 0 && (
            <button onClick={() => setFilter(filter === 'warning' ? 'all' : 'warning')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black transition ${filter === 'warning' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}>
              <AlertCircle className="w-3 h-3" /> {warningCount} Warning
            </button>
          )}
          {opportunityCount > 0 && (
            <button onClick={() => setFilter(filter === 'opportunity' ? 'all' : 'opportunity')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black transition ${filter === 'opportunity' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
              <Lightbulb className="w-3 h-3" /> {opportunityCount} Opportunity
            </button>
          )}
        </div>
      )}

      {/* Insight cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-5 h-5 text-teal-500" />
          </div>
          <p className="text-sm font-black text-gray-900">
            {active.length === 0 ? 'No insights yet' : 'All clear in this category'}
          </p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
            {active.length === 0
              ? 'Hit Refresh to run an analysis of your financial data.'
              : 'Switch to All to see other insights.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(insight => {
            const cfg     = URGENCY_CONFIG[insight.urgency as keyof typeof URGENCY_CONFIG] ?? URGENCY_CONFIG.info
            const Icon    = TYPE_ICON[insight.type] ?? cfg.icon
            const CfgIcon = cfg.icon

            return (
              <div
                key={insight.id}
                className={`rounded-2xl border p-4 ${cfg.bg} ${cfg.border} transition-all duration-200`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 ${cfg.icon_bg} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className={`w-4 h-4 ${cfg.icon_color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                        <p className="text-sm font-black text-gray-900">{insight.title}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDismiss(insight.id)}
                        disabled={dismissing === insight.id}
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/60 transition disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed mb-3">{insight.body}</p>

                    <div className="flex items-center gap-2 flex-wrap">
                      {insight.action_label && insight.action_url && (
                        <Link
                          href={insight.action_url}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-black rounded-lg transition"
                        >
                          {insight.action_label} <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                      <span className="text-[10px] text-gray-300">{timeAgo(insight.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
