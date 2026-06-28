'use client'

import { useState } from 'react'
import { Sparkles, Loader2, AlertTriangle, AlertCircle, Info, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import InlineUpgradePrompt from '@/components/ui/inline-upgrade-prompt'

type ReviewIssue = {
  severity: 'high' | 'medium' | 'low'
  title: string
  explanation: string
}

type ReviewResult = {
  issues: ReviewIssue[]
  summary: string
  overallRisk: 'high' | 'medium' | 'low'
}

interface ContractReviewProps {
  contractId: string
  isPro: boolean
}

const severityConfig = {
  high: {
    icon: AlertTriangle,
    containerClass: 'bg-red-50 border-red-200',
    iconClass: 'text-red-500',
    labelClass: 'text-red-700 bg-red-100',
    titleClass: 'text-red-900',
    textClass: 'text-red-700',
    label: 'High risk',
  },
  medium: {
    icon: AlertCircle,
    containerClass: 'bg-amber-50 border-amber-200',
    iconClass: 'text-amber-500',
    labelClass: 'text-amber-700 bg-amber-100',
    titleClass: 'text-amber-900',
    textClass: 'text-amber-700',
    label: 'Medium risk',
  },
  low: {
    icon: Info,
    containerClass: 'bg-blue-50 border-blue-200',
    iconClass: 'text-blue-500',
    labelClass: 'text-blue-700 bg-blue-100',
    titleClass: 'text-blue-900',
    textClass: 'text-blue-600',
    label: 'Low risk',
  },
}

const overallRiskConfig = {
  high: { label: 'Needs attention', class: 'bg-red-100 text-red-700 border border-red-200' },
  medium: { label: 'Some gaps found', class: 'bg-amber-100 text-amber-700 border border-amber-200' },
  low: { label: 'Well protected', class: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
}

export default function ContractReview({ contractId, isPro }: ContractReviewProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ReviewResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)

  const handleReview = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/contracts/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || 'Could not complete review.')
        return
      }
      setResult(data.result)
      setExpanded(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Locked state for non-Pro users
  if (!isPro) {
    return (
      <InlineUpgradePrompt
        icon={Sparkles}
        title="AI Contract Review"
        description="Automatically flag missing protections — no IP clause, no liability cap, weak payment terms, and more."
        requiredPlan="Professional & Business"
      />
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#0055FF]" />
          AI Contract Review
        </h3>
        {result && (
          <button
            onClick={() => setExpanded(prev => !prev)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Initial / re-run button */}
      {!result && !isLoading && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 leading-relaxed">
            Analyze this contract for missing protections, weak clauses, and common legal gaps.
          </p>
          <button
            onClick={handleReview}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0055FF] to-[#0044DD] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:from-[#0044DD] hover:to-[#0033CC] hover: transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Review with AI
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-3 py-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#0055FF] flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-gray-700">Reviewing contract...</p>
            <p className="text-xs text-gray-400">This usually takes 5–10 seconds.</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-red-700">{error}</p>
          </div>
          <button
            onClick={handleReview}
            className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* Results */}
      {result && expanded && (
        <div className="space-y-4">
          {/* Summary row */}
          <div className="flex items-start gap-3">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0 ${overallRiskConfig[result.overallRisk].class}`}>
              {overallRiskConfig[result.overallRisk].label}
            </span>
            <p className="text-xs text-gray-600 leading-relaxed">{result.summary}</p>
          </div>

          {/* No issues */}
          {result.issues.length === 0 && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <p className="text-xs font-bold text-emerald-700">No significant issues found.</p>
            </div>
          )}

          {/* Issue list */}
          {result.issues.length > 0 && (
            <div className="space-y-2">
              {result.issues.map((issue, i) => {
                const cfg = severityConfig[issue.severity]
                const Icon = cfg.icon
                return (
                  <div key={i} className={`border rounded-xl p-3 space-y-1 ${cfg.containerClass}`}>
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${cfg.iconClass}`} />
                      <p className={`text-xs font-black ${cfg.titleClass}`}>{issue.title}</p>
                      <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-md flex-shrink-0 ${cfg.labelClass}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed pl-5 ${cfg.textClass}`}>
                      {issue.explanation}
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Re-run */}
          <button
            onClick={handleReview}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-[#0055FF] transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Re-run review
          </button>
        </div>
      )}
    </div>
  )
}