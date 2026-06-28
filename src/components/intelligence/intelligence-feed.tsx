'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AlertTriangle, TrendingDown, Zap, Lightbulb,
  ArrowRight, X, CheckCircle2, RefreshCw,
  AlertCircle, DollarSign, Users, FileText, Clock
} from 'lucide-react'
import InlineUpgradePrompt from '@/components/ui/inline-upgrade-prompt'

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

// Terminal color map — signal-driven, not category-driven
const URGENCY = {
  critical:    { dot: '#f87171', label: 'CRITICAL',    filterBg: 'bg-red-500',    filterText: 'text-white',    inactiveBg: 'bg-red-950/40',  inactiveText: 'text-red-400'  },
  warning:     { dot: '#FF6B35', label: 'WARNING',     filterBg: 'bg-orange-500', filterText: 'text-white',    inactiveBg: 'bg-orange-950/40',inactiveText: 'text-orange-400'},
  opportunity: { dot: '#00C4A0', label: 'SIGNAL',      filterBg: 'bg-teal-500',   filterText: 'text-white',    inactiveBg: 'bg-teal-950/40',  inactiveText: 'text-teal-400' },
  info:        { dot: '#64748B', label: 'INFO',         filterBg: 'bg-slate-600',  filterText: 'text-white',    inactiveBg: 'bg-slate-800/40', inactiveText: 'text-slate-400'},
} as const

const TYPE_ICON: Record<string, React.ElementType> = {
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
  if (hrs < 1)  return 'just now'
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

/** Wrap dollar figures in teal monospace spans for data-feed legibility */
function highlightAmounts(text: string): React.ReactNode[] {
  const parts = text.split(/(\$[\d,]+(?:\.\d{2})?(?:[KMB])?)/g)
  return parts.map((part, i) =>
    /^\$/.test(part)
      ? <span key={i} className="inv-mono inv-terminal-signal font-bold">{part}</span>
      : <span key={i}>{part}</span>
  )
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

  /* ── Gated: starter tier ──────────────────────────────────────────────── */
  if (!isPro) {
    return (
      <InlineUpgradePrompt
        icon={Zap}
        title="Intelligence Feed"
        description="Upgrade to get AI-powered signals, client risk profiles, and proactive cash flow warnings."
        requiredPlan="Professional & Business"
      />
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Animated signal strip — communicates "live system" */}
      <div className="inv-signal-strip" />

      <div className="p-5">
        {/* Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="inv-live-dot" />
            <div>
              <p className="text-xs font-bold text-[#0055FF] uppercase tracking-widest leading-none">
                Intelligence Feed
              </p>
              {lastRefreshed && (
                <p className="text-[10px] text-gray-400 mt-0.5 inv-mono">
                  Updated {timeAgo(lastRefreshed)}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-lg transition disabled:opacity-40 inv-mono"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Scanning…' : 'Refresh'}
          </button>
        </div>

        {/* Filter pills ─────────────────────────────────────────────────── */}
        {active.length > 0 && (
          <div className="flex items-center gap-1.5 mb-4 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-black transition inv-mono ${
                filter === 'all'
                  ? 'bg-[#0055FF] text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              ALL {active.length}
            </button>
            {criticalCount > 0 && (
              <button onClick={() => setFilter(filter === 'critical' ? 'all' : 'critical')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black transition inv-mono ${
                  filter === 'critical' ? 'bg-red-500 text-white' : 'bg-red-950/20 text-red-400 hover:bg-red-950/30 border border-red-900/30'
                }`}>
                ● {criticalCount} CRITICAL
              </button>
            )}
            {warningCount > 0 && (
              <button onClick={() => setFilter(filter === 'warning' ? 'all' : 'warning')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black transition inv-mono ${
                  filter === 'warning' ? 'bg-orange-500 text-white' : 'bg-orange-950/20 text-orange-400 hover:bg-orange-950/30 border border-orange-900/30'
                }`}>
                ● {warningCount} WARNING
              </button>
            )}
            {opportunityCount > 0 && (
              <button onClick={() => setFilter(filter === 'opportunity' ? 'all' : 'opportunity')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black transition inv-mono ${
                  filter === 'opportunity' ? 'bg-teal-500 text-white' : 'bg-teal-950/20 text-teal-400 hover:bg-teal-950/30 border border-teal-900/30'
                }`}>
                ● {opportunityCount} SIGNAL
              </button>
            )}
          </div>
        )}

        {/* Terminal feed panel ──────────────────────────────────────────── */}
        <div className="inv-terminal">
          {filtered.length === 0 ? (
            /* Empty state — aspirational, not apologetic */
            <div className="py-10 px-5 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-3">
                <div className="inv-live-dot" style={{ background: '#334155' }} />
                <span className="text-[10px] inv-mono text-slate-600 uppercase tracking-widest">
                  {active.length === 0 ? 'Awaiting data' : 'No signals in this category'}
                </span>
              </div>
              <p className="text-sm font-black text-slate-300 mb-2">
                {active.length === 0 ? 'No signals detected' : 'All clear here'}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                {active.length === 0
                  ? 'The feed will surface cash flow risks, high-risk clients, and payment anomalies as your business generates financial data. Run a refresh to scan now.'
                  : 'Switch to All to see other active signals.'}
              </p>
              {active.length === 0 && (
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-teal-400 border border-teal-900/40 rounded-lg hover:bg-teal-950/20 transition inv-mono disabled:opacity-40"
                >
                  <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Scanning…' : 'Run scan'}
                </button>
              )}
            </div>
          ) : (
            /* Feed entries */
            <div>
              {filtered.map((insight, idx) => {
                const urgencyCfg = URGENCY[insight.urgency as keyof typeof URGENCY] ?? URGENCY.info
                const Icon = TYPE_ICON[insight.type] ?? Zap

                return (
                  <div
                    key={insight.id}
                    className="inv-intel-entry group"
                  >
                    {/* Urgency signal dot */}
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                      style={{ backgroundColor: urgencyCfg.dot }}
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className="text-[9px] font-black inv-mono px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: `${urgencyCfg.dot}22`,
                              color: urgencyCfg.dot,
                              border: `1px solid ${urgencyCfg.dot}33`,
                            }}
                          >
                            {urgencyCfg.label}
                          </span>
                          <p className="text-xs font-black text-slate-100 leading-tight">
                            {insight.title}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDismiss(insight.id)}
                          disabled={dismissing === insight.id}
                          className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded text-slate-600 hover:text-slate-300 hover:bg-white/5 transition disabled:opacity-40"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                        {highlightAmounts(insight.body)}
                      </p>

                      <div className="flex items-center gap-3 flex-wrap">
                        {insight.action_label && insight.action_url && (
                          <Link
                            href={insight.action_url}
                            className="inline-flex items-center gap-1 text-[11px] font-black text-[#00C4A0] hover:text-teal-300 transition inv-mono"
                          >
                            {insight.action_label} <ArrowRight className="w-2.5 h-2.5" />
                          </Link>
                        )}
                        <span className="text-[10px] text-slate-700 inv-mono ml-auto">
                          {timeAgo(insight.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
