'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, X, AlertCircle, Filter } from 'lucide-react'

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
}

interface Props {
  transactions: BankTransaction[]
  unmatchedInvoices: Invoice[]
  isPro: boolean
}

function fmt(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Math.abs(amount))
}

const DIRECTION_LABELS: Record<string, string> = {
  inflow:  'Money in',
  outflow: 'Money out',
}

export default function TransactionList({ transactions, unmatchedInvoices, isPro }: Props) {
  const router = useRouter()
  const [filter, setFilter]         = useState<'all' | 'inflow' | 'outflow' | 'unmatched'>('all')
  const [reconciling, setReconciling] = useState<string | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<Record<string, string>>({})

  const filtered = transactions.filter(tx => {
    if (filter === 'inflow')    return tx.direction === 'inflow'
    if (filter === 'outflow')   return tx.direction === 'outflow'
    if (filter === 'unmatched') return tx.match_status === 'unmatched' && tx.direction === 'inflow'
    return true
  })

  const handleReconcile = async (txId: string, action: 'confirm' | 'dismiss') => {
    setReconciling(txId)
    try {
      await fetch('/api/plaid/reconcile', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          transaction_id: txId,
          action,
          invoice_id: action === 'confirm' ? (selectedInvoice[txId] ?? null) : null,
        }),
      })
      router.refresh()
    } finally {
      setReconciling(null)
    }
  }

  const unmatchedInflows = transactions.filter(
    tx => tx.direction === 'inflow' && tx.match_status === 'unmatched' && !tx.pending
  )

  return (
    <div className="space-y-4">
      {/* Reconciliation prompt — Pro only */}
      {isPro && unmatchedInflows.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-gray-900">
              {unmatchedInflows.length} incoming payment{unmatchedInflows.length > 1 ? 's' : ''} to reconcile
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Match these deposits to your outstanding invoices to mark them as paid automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFilter('unmatched')}
            className="flex-shrink-0 text-xs font-black text-amber-600 hover:text-amber-700 transition ml-auto"
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
              filter === f
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f === 'all' ? 'All' : f === 'inflow' ? 'Money in' : f === 'outflow' ? 'Money out' : 'Unmatched'}
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
                  matched   ? 'border-teal-100 bg-teal-50/30' :
                  dismissed ? 'border-gray-100 opacity-60'    :
                              'border-gray-100 hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                <div className="p-4 flex items-start gap-3">
                  {/* Direction icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isIn ? 'bg-teal-50' : 'bg-red-50'
                  }`}>
                    {isIn
                      ? <ArrowDownLeft className="w-4 h-4 text-teal-600" />
                      : <ArrowUpRight  className="w-4 h-4 text-red-500"  />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-gray-900 truncate">
                          {tx.merchant_name ?? tx.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(tx.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
                            Matched
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Reconciliation UI — Pro only, unmatched inflows */}
                    {canMatch && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs font-bold text-gray-500 mb-2">Match to an invoice?</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <select
                            value={selectedInvoice[tx.id] ?? ''}
                            onChange={e => setSelectedInvoice(p => ({ ...p, [tx.id]: e.target.value }))}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 flex-1 min-w-0"
                          >
                            <option value="">Select an invoice…</option>
                            {unmatchedInvoices
                              .filter(inv => Math.abs(Math.abs(tx.amount) - inv.total_amount) < 1)
                              .map(inv => (
                                <option key={inv.id} value={inv.id}>
                                  {inv.invoice_number} — {inv.client_name} — ${inv.total_amount}
                                </option>
                              ))
                            }
                            {unmatchedInvoices
                              .filter(inv => Math.abs(Math.abs(tx.amount) - inv.total_amount) >= 1)
                              .map(inv => (
                                <option key={inv.id} value={inv.id}>
                                  {inv.invoice_number} — {inv.client_name} — ${inv.total_amount}
                                </option>
                              ))
                            }
                          </select>
                          <button
                            type="button"
                            onClick={() => handleReconcile(tx.id, 'confirm')}
                            disabled={reconciling === tx.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-black rounded-lg transition disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReconcile(tx.id, 'dismiss')}
                            disabled={reconciling === tx.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-black rounded-lg transition disabled:opacity-50"
                          >
                            <X className="w-3 h-3" /> Not an invoice
                          </button>
                        </div>
                      </div>
                    )}
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
