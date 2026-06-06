'use client'

// src/components/cash/upcoming-payments-list.tsx
// Pure server component — receives data as props from the cash page.
//
// WHAT IT DOES:
//   Shows all unpaid invoices (status='sent') sorted by due_date ascending.
//   - Overdue entries: shown in red with a "X days overdue" badge
//   - Due soon (≤7 days): shown in amber
//   - Upcoming: shown normally
//
// WHY NO CLIENT STATE:
//   This is read-only. The user can click through to the invoice detail page
//   if they want to act (send follow-up, mark paid, etc.).

import Link from 'next/link'
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react'
import { useCurrency } from '@/lib/context/currency-context'

type Invoice = {
  id:             string
  invoice_number: string
  total_amount:   number
  due_date:       string
  clients:        { name: string } | null
}

interface UpcomingPaymentsListProps {
  invoices: Invoice[]
}


export default function UpcomingPaymentsList({
  invoices }: UpcomingPaymentsListProps) {
  const { format: fmt } = useCurrency()
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  // Annotate each invoice with days until/past due
  const annotated = invoices.map(inv => {
    const due      = new Date(inv.due_date + 'T12:00:00')
    const diffMs   = due.getTime() - now.getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
    return { ...inv, diffDays, due }
  }).sort((a, b) => a.diffDays - b.diffDays)   // overdue first, then soonest

  if (annotated.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle2 className="w-10 h-10 text-green-300 mb-3" />
        <p className="text-gray-500 font-bold">No outstanding invoices.</p>
        <p className="text-gray-400 text-sm font-medium mt-1">All sent invoices have been paid.</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-50">
      {annotated.map(inv => {
        const isOverdue = inv.diffDays < 0
        const isDueSoon = inv.diffDays >= 0 && inv.diffDays <= 7
        const dayAbs    = Math.abs(inv.diffDays)

        const rowBg     = isOverdue  ? 'hover:bg-red-50'    : isDueSoon ? 'hover:bg-amber-50' : 'hover:bg-gray-50'
        const badgeCls  = isOverdue
          ? 'bg-red-100 text-red-700 border border-red-200'
          : isDueSoon
          ? 'bg-amber-100 text-amber-700 border border-amber-200'
          : 'bg-gray-100 text-gray-600 border border-gray-200'

        const badgeLabel = isOverdue
          ? `${dayAbs}d overdue`
          : inv.diffDays === 0
          ? 'Due today'
          : `Due in ${dayAbs}d`

        const Icon = isOverdue ? AlertCircle : Clock

        return (
          <Link
            key={inv.id}
            href={`/dashboard/invoices/${inv.id}`}
            className={`flex items-center gap-4 px-4 py-4 transition-colors group ${rowBg}`}
          >
            {/* Icon */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isOverdue ? 'bg-red-50' : isDueSoon ? 'bg-amber-50' : 'bg-gray-50'
            }`}>
              <Icon className={`w-4 h-4 ${
                isOverdue ? 'text-red-500' : isDueSoon ? 'text-amber-500' : 'text-gray-400'
              }`} />
            </div>

            {/* Invoice info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-gray-900 font-mono">{inv.invoice_number}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeCls}`}>
                  {badgeLabel}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-medium mt-0.5 truncate">
                {inv.clients?.name ?? '—'} · Due{' '}
                {inv.due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            {/* Amount */}
            <span
              className={`text-sm font-black flex-shrink-0 ml-2 group-hover:text-blue-600 transition-colors ${
                isOverdue ? 'text-red-700' : 'text-gray-900'
              }`}
              title={fmt(inv.total_amount)}
            >
              {formatCompact(inv.total_amount)}
            </span>
          </Link>
        )
      })}
    </div>
  )
}