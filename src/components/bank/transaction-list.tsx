'use client'

import { useCurrency } from '@/lib/context/currency-context'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowDownLeft, ArrowUpRight, CheckCircle2,
  X, AlertCircle, Sparkles, ChevronDown
} from 'lucide-react'
import { rankInvoiceMatches, type ScoredInvoice } from '@/lib/utils/reconcile-score'

interface BankTransaction {
  id: string
  amount: number
  direction: string
  date: string
  merchant_name: string | null
  description: string
  category: string | null
  match_status: string
  matched_invoice_id: string | null
  pending: boolean
  currency: string
}

interface Invoice {
  id: string
  invoice_number: string
  total_amount: number
  client_name: string
  due_date?: string
}

interface Props {
  transactions: BankTransaction[]
  unmatchedInvoices: Invoice[]
  isPro: boolean
}

function fmt(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Math.abs(amount))
}

const CONFIDENCE_STYLE = {
  high:   { badge: 'bg-teal-100 text-teal-700',   dot: 'bg-teal-500',  label: 'High confidence' },
  medium: { badge: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500', label: 'Possible match'  },
  low:    { badge: 'bg-gray-100 text-gray-500',    dot: 'bg-gray-400',  label: 'Low confidence'  },
}

function ReconcilePanel({
  tx,
  unmatchedInvoices,
  isPro,
}: {
  tx: BankTransaction
  unmatchedInvoices: Invoice[]
  isPro: boolean
}) {
  const router = useRouter()
  const [saving, setSaving]       = useState(false)
  const [expanded, setExpanded]   = useState(false)

  // Score every invoice against this transaction
  const ranked: ScoredInvoice[] = useMemo(
    () => rankInvoiceMatches(tx.amount, tx.date, tx.merchant_name ?? tx.description, unmatchedInvoices),
    [tx, unmatchedInvoices]
  )

  // Pre-select the top match if high confidence
  const topMatch    = ranked[0]
  const autoSelect  = topMatch?.confidence === 'high' ? topMatch.id : ''
  const [selected, setSelected] = useState(autoSelect)

  const handleAction = async (action: 'confirm' | 'dismiss') => {
    setSaving(true)
    try {
      await fetch('/api/plaid/reconcile', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: tx.id,
          action,
          invoice_id: action === 'confirm' ? (selected || null) : null,
        }),
      })
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const selectedInvoice = ranked.find(r => r.id === selected)

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
      {/* Top suggestion */}
      {topMatch && (
        <div className={`rounded-xl border p-3 ${
          topMatch.confidence === 'high'   ? 'border-teal-100 bg-teal-50/50' :
          topMatch.confidence === 'medium' ? 'border-amber-100 bg-amber-50/40' :
                                             'border-gray-100 bg-gray-50'
        }`}>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className={`w-3 h-3 ${
                topMatch.confidence === 'high' ? 'text-teal-500' : 'text-amber-500'
              }`} />
              <span className="text-xs font-black text-gray-700">
                {topMatch.confidence === 'high' ? 'Best match' : 'Possible match'}
              </span>
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${CONFIDENCE_STYLE[topMatch.confidence].badge}`}>
                {topMatch.score}% match
              </span>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name={`invoice-${tx.id}`}
                value={topMatch.id}
                checked={selected === topMatch.id}
                onChange={() => setSelected(topMatch.id)}
                className="accent-teal-500"
              />
              <span className="text-xs text-gray-600 font-medium sr-only">Select</span>
            </label>
          </div>
          <p className="text-xs font-black text-gray-900">{topMatch.invoice_number} — {topMatch.client_name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{fmt(topMatch.total_amount)} · {topMatch.reasons[0]}</p>
        </div>
      )}

      {/* Other invoices — expandable */}
      {ranked.length > 1 && (
        <div>
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 font-medium transition"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            {expanded ? 'Hide' : `Show ${ranked.length - 1} other invoice${ranked.length - 1 !== 1 ? 's' : ''}`}
          </button>

          {expanded && (
            <div className="mt-2 space-y-1.5">
              {ranked.slice(1).map(inv => (
                <label
                  key={inv.id}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    selected === inv.id
                      ? 'border-blue-200 bg-blue-50/50'
                      : 'border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`invoice-${tx.id}`}
                    value={inv.id}
                    checked={selected === inv.id}
                    onChange={() => setSelected(inv.id)}
                    className="accent-blue-600 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-gray-900 truncate">
                      {inv.invoice_number} — {inv.client_name}
                    </p>
                    <p className="text-[10px] text-gray-400">{fmt(inv.total_amount)}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${CONFIDENCE_STYLE[inv.confidence].badge}`}>
                    {inv.score}%
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No invoices at all */}
      {ranked.length === 0 && (
        <p className="text-xs text-gray-400">No outstanding invoices to match against.</p>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleAction('confirm')}
          disabled={saving || !selected}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-xs font-black rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          {selected ? 'Confirm match' : 'Select an invoice first'}
        </button>
        <button
          type="button"
          onClick={() => handleAction('dismiss')}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-black rounded-xl transition disabled:opacity-40"
        >
          <X className="w-3.5 h-3.5" /> Not an invoice
        </button>
      </div>
    </div>
  )
}

export default function TransactionList({
  const { format: fmt } = useCurrency() transactions, unmatchedInvoices, isPro }: Props) {
  const [filter, setFilter] = useState<'all' | 'inflow' | 'outflow' | 'unmatched'>('all')

  const filtered = transactions.filter(tx => {
    if (filter === 'inflow')    return tx.direction === 'inflow'
    if (filter === 'outflow')   return tx.direction === 'outflow'
    if (filter === 'unmatched') return tx.match_status === 'unmatched' && tx.direction === 'inflow'
    return true
  })

  const unmatchedInflows = transactions.filter(
    tx => tx.direction === 'inflow' && tx.match_status === 'unmatched' && !tx.pending
  )

  return (
    <div className="space-y-4">
      {/* Reconciliation prompt */}
      {isPro && unmatchedInflows.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-black text-gray-900">
              {unmatchedInflows.length} deposit{unmatchedInflows.length > 1 ? 's' : ''} to reconcile
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Invonaut has scored each one against your outstanding invoices. High-confidence matches are pre-selected.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFilter('unmatched')}
            className="flex-shrink-0 text-xs font-black text-amber-600 hover:text-amber-700 transition"
          >
            Review →
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['all', 'inflow', 'outflow', 'unmatched'] as const).map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f === 'all' ? 'All' : f === 'inflow' ? 'Money in' : f === 'outflow' ? 'Money out' : 'Unmatched'}
            {f === 'unmatched' && unmatchedInflows.length > 0 && (
              <span className="ml-1.5 bg-amber-400 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                {unmatchedInflows.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Transaction rows */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm font-medium">No transactions to show</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(tx => {
            const isIn      = tx.direction === 'inflow'
            const matched   = tx.match_status === 'matched'
            const dismissed = tx.match_status === 'dismissed'
            const canMatch  = isPro && isIn && tx.match_status === 'unmatched' && !tx.pending

            return (
              <div
                key={tx.id}
                className={`bg-white rounded-2xl border transition-all duration-200 ${
                  matched   ? 'border-teal-100 bg-teal-50/30'   :
                  dismissed ? 'border-gray-100 opacity-60'      :
                              'border-gray-100 hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isIn ? 'bg-teal-50' : 'bg-red-50'
                    }`}>
                      {isIn
                        ? <ArrowDownLeft className="w-4 h-4 text-teal-600" />
                        : <ArrowUpRight  className="w-4 h-4 text-red-500"  />
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-black text-gray-900 truncate">
                            {tx.merchant_name ?? tx.description}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(tx.date + 'T12:00:00').toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric'
                            })}
                            {tx.category && ` · ${tx.category.replace(/_/g, ' ')}`}
                            {tx.pending && ' · Pending'}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-sm font-black ${isIn ? 'text-teal-600' : 'text-red-500'}`}>
                            {isIn ? '+' : '-'}{fmt(tx.amount, tx.currency)}
                          </p>
                          {matched && (
                            <span className="text-[10px] font-black text-teal-600 bg-teal-100 px-1.5 py-0.5 rounded-full">
                              Matched ✓
                            </span>
                          )}
                        </div>
                      </div>

                      {canMatch && (
                        <ReconcilePanel
                          tx={tx}
                          unmatchedInvoices={unmatchedInvoices}
                          isPro={isPro}
                        />
                      )}
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
