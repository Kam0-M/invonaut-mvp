'use client'

import { useCurrency } from '@/lib/context/currency-context'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Clock, Zap, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'

interface UnbilledGroup {
  client_id: string
  client_name: string
  total_hours: number
  total_value: number
  entry_count: number
  entries: {
    id: string
    description: string
    duration_seconds: number
    hourly_rate: number
  }[]
}

interface Props {
  groups: UnbilledGroup[]
}

function fmtHours(secs: number) {
  const h = secs / 3600
  return h < 1 ? `${Math.round(h * 60)}m` : `${h.toFixed(1)}h`
}

export default function SmartInvoiceDrafts({
  groups }: Props) {
  const { format: fmt } = useCurrency()
  const router = useRouter()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [creating, setCreating] = useState<string | null>(null)

  const totalValue = groups.reduce((s, g) => s + g.total_value, 0)

  const handleCreate = async (group: UnbilledGroup) => {
    setCreating(group.client_id)
    try {
      const res = await fetch('/api/intelligence/create-draft-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id:  group.client_id,
          entry_ids:  group.entries.map(e => e.id),
        }),
      })
      const data = await res.json()
      if (data.invoice_id) {
        router.push(`/dashboard/invoices/${data.invoice_id}`)
      } else {
        console.error('[smart-drafts] create failed:', data.error ?? data)
        alert(`Failed to create invoice: ${data.error ?? 'Unknown error'}`)
        router.refresh()
      }
    } catch (err) {
      console.error('[smart-drafts] network error:', err)
      alert('Failed to create invoice — check your connection and try again.')
    } finally {
      setCreating(null)
    }
  }

  if (groups.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-blue-100 bg-blue-50/20 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Smart Drafts</p>
            <p className="text-sm font-black text-gray-900 mt-0.5">
              {fmt(totalValue)} in unbilled work across {groups.length} client{groups.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <span className="text-xs text-gray-400 font-medium">Ready to invoice</span>
        </div>
      </div>

      {/* Client groups */}
      <div className="space-y-3">
        {groups.map(group => (
          <div key={group.client_id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Group header */}
            <div className="flex items-center justify-between gap-3 p-4">
              <button
                type="button"
                onClick={() => setExpanded(p => ({ ...p, [group.client_id]: !p[group.client_id] }))}
                className="flex items-center gap-3 flex-1 min-w-0 text-left"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-gray-900 truncate">{group.client_name}</p>
                  <p className="text-xs text-gray-400">
                    {group.total_hours.toFixed(1)}h · {group.entry_count} entr{group.entry_count !== 1 ? 'ies' : 'y'}
                  </p>
                </div>
                {expanded[group.client_id]
                  ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  : <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                }
              </button>

              <div className="flex items-center gap-3 flex-shrink-0">
                <p className="text-sm font-black text-teal-600">{fmt(group.total_value)}</p>
                <button
                  type="button"
                  onClick={() => handleCreate(group)}
                  disabled={creating === group.client_id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-lg transition disabled:opacity-50"
                >
                  {creating === group.client_id ? (
                    'Creating…'
                  ) : (
                    <><Zap className="w-3 h-3" /> Create invoice</>
                  )}
                </button>
              </div>
            </div>

            {/* Expanded entries */}
            {expanded[group.client_id] && (
              <div className="border-t border-gray-50 px-4 pb-3 pt-2 space-y-2">
                {group.entries.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between gap-3 text-xs text-gray-500">
                    <span className="truncate flex-1">{entry.description || 'Time entry'}</span>
                    <span className="flex-shrink-0 font-medium">
                      {fmtHours(entry.duration_seconds)} @ ${entry.hourly_rate}/h
                      = {fmt((entry.duration_seconds / 3600) * entry.hourly_rate)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Creating an invoice marks all selected time entries as billed and generates a draft for your review.
      </p>
    </div>
  )
}
