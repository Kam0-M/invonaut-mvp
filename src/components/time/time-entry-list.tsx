'use client'

import { useCurrency } from '@/lib/context/currency-context'
// src/components/time/time-entry-list.tsx
// Displays all time entries in a filterable, paginated list.
//
// WHAT IT DOES:
//   - Shows description, client, date, duration, billable amount, and billed/unbilled status
//   - Filter tabs: All / Unbilled / Billed
//   - Delete button on unbilled entries (billed entries are locked)
//   - Empty states for each filter tab
//   - Calls /api/time/update { action: 'delete' } to remove an entry

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Clock, DollarSign, CheckCircle2, CircleDashed } from 'lucide-react'
import { toast } from 'sonner'
import { formatDuration, calcBillableAmount } from '@/lib/utils/time-formatting'

type Client = { id: string; name: string; company: string | null }

type TimeEntry = {
  id:               string
  description:      string
  started_at:       string
  ended_at:         string | null
  duration_seconds: number | null
  hourly_rate:      number | null
  billable:         boolean
  invoice_id:       string | null
  created_at:       string
  clients:          Client | null
}

interface TimeEntryListProps {
  entries: TimeEntry[]
}

type FilterTab = 'all' | 'unbilled' | 'billed'

export default function TimeEntryList({
  entries }: TimeEntryListProps) {
  const { format: fmt } = useCurrency()
  const router            = useRouter()
  const [filter, setFilter] = useState<FilterTab>('all')
  const [deleting, setDeleting] = useState<string | null>(null)

  const filtered = entries.filter(e => {
    if (filter === 'unbilled') return !e.invoice_id
    if (filter === 'billed')   return !!e.invoice_id
    return true
  })

  const unbilledCount = entries.filter(e => !e.invoice_id && e.billable).length

  const handleDelete = async (entry: TimeEntry) => {
    if (!confirm('Delete this time entry? This cannot be undone.')) return
    setDeleting(entry.id)
    try {
      const res  = await fetch('/api/time/update', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'delete', entryId: entry.id }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Could not delete entry.')
        return
      }
      toast.success('Entry deleted.')
      router.refresh()
    } catch {
      toast.error('Could not delete entry.')
    } finally {
      setDeleting(null)
    }
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all',      label: `All (${entries.length})` },
    { key: 'unbilled', label: `Unbilled (${unbilledCount})` },
    { key: 'billed',   label: `Billed (${entries.filter(e => !!e.invoice_id).length})` },
  ]

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm">
      {/* Header + filter tabs */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100">
        <h2 className="text-xl font-black text-gray-900 tracking-tight mb-4">Time Log</h2>
        <div className="flex gap-2 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                filter === tab.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Entry list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
          <Clock className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">
            {filter === 'unbilled' ? 'No unbilled entries.' :
             filter === 'billed'   ? 'No billed entries yet.' :
             'No time entries yet. Start the timer above.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {filtered.map(entry => {
            const duration    = entry.duration_seconds ?? 0
            const billable    = entry.billable && (entry.hourly_rate ?? 0) > 0
            const amount      = billable ? calcBillableAmount(duration, entry.hourly_rate!) : null
            const isBilled    = !!entry.invoice_id
            const entryDate   = new Date(entry.started_at + (entry.started_at.includes('T') ? '' : 'T12:00:00'))

            return (
              <div key={entry.id} className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                {/* Icon */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isBilled ? 'bg-green-50' : 'bg-blue-50'
                }`}>
                  {isBilled
                    ? <CheckCircle2 className="w-4.5 h-4.5 text-green-600" />
                    : <CircleDashed  className="w-4.5 h-4.5 text-blue-500" />
                  }
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{entry.description}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    {entry.clients && (
                      <span className="text-xs text-gray-500 font-medium">{entry.clients.name}</span>
                    )}
                    <span className="text-xs text-gray-400">
                      {entryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {duration > 0 && (
                      <span className="text-xs font-bold text-gray-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(duration)}
                      </span>
                    )}
                    {amount !== null && (
                      <span className="text-xs font-bold text-green-700 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {fmt(amount)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status badge + delete */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    isBilled
                      ? 'bg-green-100 text-green-800'
                      : entry.billable
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isBilled ? 'Billed' : entry.billable ? 'Unbilled' : 'Non-billable'}
                  </span>

                  {!isBilled && (
                    <button
                      onClick={() => handleDelete(entry)}
                      disabled={deleting === entry.id}
                      title="Delete entry"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400
                                 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}