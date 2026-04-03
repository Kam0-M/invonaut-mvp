'use client'
// src/components/time/unbilled-entries-picker.tsx
//
// WHAT IT DOES:
//   This is the flagship Phase 11 feature — "Invoice from Time Entries."
//   It renders as a modal overlay inside the invoice creation page.
//   When a client is selected on the invoice form, a button appears to open this picker.
//   The user selects which unbilled hours to add. On confirm, those entries become
//   invoice line items (quantity = decimal hours, unit_price = hourly rate).
//   After the invoice is saved, the parent calls /api/time/update { action: 'mark_billed' }
//   so selected entries can never be added to a second invoice.
//
// PROPS:
//   clientId  — filters entries to only this client
//   onAdd     — callback with (lineItems, entryIds) when user confirms
//   onClose   — called when user cancels or after onAdd

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Clock, Check, X, Loader2, AlertCircle } from 'lucide-react'
import {
  formatDuration,
  toDecimalHours,
  calcBillableAmount,
  formatCurrency,
} from '@/lib/utils/time-formatting'

type UnbilledEntry = {
  id:               string
  description:      string
  started_at:       string
  duration_seconds: number
  hourly_rate:      number | null
  billable:         boolean
}

// Shape expected by the invoice form's lineItems state
export type PickedLineItem = {
  id:          string
  description: string
  quantity:    number   // decimal hours, e.g. 2.5
  unit_price:  number   // hourly rate
  total:       number
}

interface UnbilledEntriesPickerProps {
  clientId: string
  onAdd:    (lineItems: PickedLineItem[], entryIds: string[]) => void
  onClose:  () => void
}

export default function UnbilledEntriesPicker({
  clientId,
  onAdd,
  onClose,
}: UnbilledEntriesPickerProps) {
  const [entries, setEntries] = useState<UnbilledEntry[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading]   = useState(true)
  const [fetchError, setFetchError] = useState('')

  useEffect(() => {
    if (!clientId) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setFetchError('')
      const supabase = createClient()
      const { data, error } = await supabase
        .from('time_entries')
        .select('id, description, started_at, duration_seconds, hourly_rate, billable')
        .eq('client_id', clientId)
        .is('invoice_id', null)
        .eq('billable', true)
        .order('started_at', { ascending: false })

      if (cancelled) return
      if (error) { setFetchError('Could not load time entries.'); setLoading(false); return }

      const valid = (data ?? []).filter(
        (e: any) => e.duration_seconds && e.duration_seconds > 0
      ) as UnbilledEntry[]

      setEntries(valid)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [clientId])

  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const toggleAll = () =>
    setSelected(
      selected.size === entries.length ? new Set() : new Set(entries.map(e => e.id))
    )

  const handleAdd = () => {
    const chosen = entries.filter(e => selected.has(e.id))

    const lineItems: PickedLineItem[] = chosen.map(e => {
      const hours = toDecimalHours(e.duration_seconds)
      const rate  = e.hourly_rate ?? 0
      const total = Math.round(hours * rate * 100) / 100
      return {
        id:          `te-${e.id}`,   // prefix avoids collision with manual line item IDs
        description: e.description,
        quantity:    hours,
        unit_price:  rate,
        total,
      }
    })

    onAdd(lineItems, chosen.map(e => e.id))
    onClose()
  }

  const selectedTotal = entries
    .filter(e => selected.has(e.id) && e.hourly_rate)
    .reduce((s, e) => s + calcBillableAmount(e.duration_seconds, e.hourly_rate!), 0)

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              Add from Time Entries
            </h2>
            <p className="text-sm text-gray-500 font-medium mt-0.5">
              Select unbilled hours to add as invoice line items
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* ── Entry list ─────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : fetchError ? (
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm font-medium text-red-700">{fetchError}</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-bold">No unbilled time entries for this client.</p>
              <p className="text-gray-400 text-sm mt-1">
                Use the timer on the Time page, then come back to invoice those hours.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Select / deselect all */}
              <button
                onClick={toggleAll}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-200
                           hover:border-blue-300 hover:bg-blue-50 transition-all text-sm font-bold text-gray-600"
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                  selected.size === entries.length
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-gray-300'
                }`}>
                  {selected.size === entries.length && <Check className="w-3 h-3 text-white" />}
                </div>
                {selected.size === entries.length
                  ? 'Deselect all'
                  : `Select all (${entries.length} entr${entries.length === 1 ? 'y' : 'ies'})`}
              </button>

              {entries.map(entry => {
                const isSelected = selected.has(entry.id)
                const hours      = toDecimalHours(entry.duration_seconds)
                const amount     = entry.hourly_rate
                  ? calcBillableAmount(entry.duration_seconds, entry.hourly_rate)
                  : null
                const dateStr    = new Date(entry.started_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })

                return (
                  <button
                    key={entry.id}
                    onClick={() => toggle(entry.id)}
                    className={`w-full flex items-start gap-3 px-4 py-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-blue-400 bg-blue-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {/* Checkbox */}
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                      isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{entry.description}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                        <span className="text-xs text-gray-400">{dateStr}</span>
                        <span className="text-xs font-bold text-gray-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(entry.duration_seconds)}&nbsp;({hours}&nbsp;hrs)
                        </span>
                        {entry.hourly_rate && (
                          <span className="text-xs text-gray-400">${entry.hourly_rate}/hr</span>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    {amount !== null && (
                      <span className="text-sm font-black text-gray-900 flex-shrink-0 ml-2">
                        {formatCurrency(amount)}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        {!loading && !fetchError && entries.length > 0 && (
          <div className="px-6 py-5 border-t border-gray-100 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-gray-900">
                {selected.size} {selected.size === 1 ? 'entry' : 'entries'} selected
              </p>
              {selectedTotal > 0 && (
                <p className="text-sm font-bold text-green-700">{formatCurrency(selectedTotal)} total</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-bold
                           hover:bg-gray-50 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={selected.size === 0}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white
                           font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transition-all
                           text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add {selected.size > 0 ? `${selected.size} ` : ''}to Invoice
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}