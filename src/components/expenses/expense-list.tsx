'use client'

import { useCurrency } from '@/lib/context/currency-context'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileImage, Trash2, Loader2, ExternalLink, Receipt, Tag } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { getCategoryLabel } from '@/lib/ai/expense-categorization'

type Expense = {
  id: string
  description: string
  amount: number
  date: string
  vendor: string | null
  category: string
  receipt_url: string | null
  receipt_is_pdf?: boolean
  notes: string | null
  is_cogs: boolean
  clients: { id: string; name: string } | null
}

interface ExpenseListProps {
  expenses: Expense[]
  totalAmount: number
}


const categoryColors: Record<string, { pill: string; dot: string }> = {
  software:     { pill: 'bg-blue-50 text-blue-700 border-blue-200',      dot: 'bg-blue-500'    },
  hardware:     { pill: 'bg-gray-50 text-gray-700 border-gray-200',      dot: 'bg-gray-400'    },
  travel:       { pill: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-500'   },
  meals:        { pill: 'bg-orange-50 text-orange-700 border-orange-200',dot: 'bg-orange-500'  },
  marketing:    { pill: 'bg-pink-50 text-pink-700 border-pink-200',      dot: 'bg-pink-500'    },
  office:       { pill: 'bg-cyan-50 text-cyan-700 border-cyan-200',      dot: 'bg-cyan-500'    },
  professional: { pill: 'bg-violet-50 text-violet-700 border-violet-200',dot: 'bg-violet-500'  },
  utilities:    { pill: 'bg-teal-50 text-teal-700 border-teal-200',      dot: 'bg-teal-500'    },
  education:    { pill: 'bg-blue-50 text-blue-700 border-blue-200',dot: 'bg-blue-500'  },
  insurance:    { pill: 'bg-green-50 text-green-700 border-green-200',   dot: 'bg-green-500'   },
  taxes:        { pill: 'bg-red-50 text-red-700 border-red-200',         dot: 'bg-red-500'     },
  other:        { pill: 'bg-gray-50 text-gray-600 border-gray-200',      dot: 'bg-gray-400'    },
}

// ── Inline COGS toggle ────────────────────────────────────────────────────────
function CogsToggle({ expenseId, initialValue }: { expenseId: string; initialValue: boolean }) {
  const [isCogs, setIsCogs] = useState(initialValue)
  const [isPending, startTransition] = useTransition()

  const toggle = () => {
    const next = !isCogs
    setIsCogs(next) // optimistic
    startTransition(async () => {
      try {
        const res = await fetch(`/api/expenses/${expenseId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_cogs: next }),
        })
        if (!res.ok) {
          setIsCogs(!next) // revert
          toast.error('Could not update expense.')
        } else {
          toast.success(next ? 'Marked as COGS' : 'Marked as operating expense')
        }
      } catch {
        setIsCogs(!next)
        toast.error('Could not update expense.')
      }
    })
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      title={isCogs ? 'COGS — click to mark as operating expense' : 'Mark as cost of goods sold (COGS)'}
      className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-all border"
      style={{
        background:   isCogs ? 'rgba(0,85,255,0.06)' : 'transparent',
        borderColor:  isCogs ? 'rgba(0,85,255,0.2)'  : '#E5E7EB',
        color:        isCogs ? '#0055FF'              : '#9CA3AF',
        opacity:      isPending ? 0.6 : 1,
        cursor:       isPending ? 'not-allowed' : 'pointer',
      }}
    >
      <Tag
        size={9}
        style={{ color: isCogs ? '#0055FF' : '#D1D5DB', transition: 'color .15s' }}
      />
      COGS
    </button>
  )
}

// ── Delete button ─────────────────────────────────────────────────────────────
function DeleteButton({ expenseId }: { expenseId: string }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm('Delete this expense?')) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/expenses/${expenseId}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Could not delete expense.'); return }
      toast.success('Expense deleted.')
      router.refresh()
    } catch {
      toast.error('Could not delete expense.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
      title="Delete expense"
    >
      {isDeleting
        ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        : <Trash2 className="w-4 h-4" />}
    </button>
  )
}

// ── Main list ─────────────────────────────────────────────────────────────────
export default function ExpenseList({
  expenses, totalAmount }: ExpenseListProps) {
  const { format: fmt } = useCurrency()
  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-12 text-center">
          <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-7 h-7 text-orange-400" />
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-2">Log your first expense</h3>
          <p className="text-sm text-gray-500 font-medium mb-6 max-w-sm mx-auto">
            Invonaut AI-categorizes expenses automatically and surfaces them in your P&amp;L, profit margin score, and monthly burn rate — all without manual work.
          </p>
          <Link
            href="/dashboard/expenses/new"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all "
          >
            Add first expense
          </Link>
        </div>
      </div>
    )
  }

  const cogsTotal  = expenses.filter(e => e.is_cogs).reduce((s, e) => s + Number(e.amount || 0), 0)
  const opexTotal  = expenses.filter(e => !e.is_cogs).reduce((s, e) => s + Number(e.amount || 0), 0)
  const cogsCount  = expenses.filter(e => e.is_cogs).length

  return (
    <div className="space-y-2">
      {/* Summary bar */}
      <div className="flex items-center justify-between px-1 mb-1 flex-wrap gap-2">
        <p className="text-sm text-gray-500 font-medium">
          <span className="text-gray-900 font-bold">{expenses.length}</span> expense{expenses.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-4">
          {cogsCount > 0 && (
            <>
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                  style={{ background: 'rgba(0,85,255,0.06)', borderColor: 'rgba(0,85,255,0.2)', color: '#0055FF' }}
                >
                  <Tag size={8} /> COGS
                </span>
                <span className="text-sm font-black text-gray-900">{fmt(cogsTotal)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">OpEx</span>
                <span className="text-sm font-black text-gray-900">{fmt(opexTotal)}</span>
              </div>
            </>
          )}
          <p className="text-sm font-black text-gray-900">{fmt(totalAmount)}</p>
        </div>
      </div>

      {/* COGS explanation banner — shown only when nothing is tagged yet */}
      {cogsCount === 0 && expenses.length > 0 && (
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-xl border text-xs font-medium text-gray-500"
          style={{ background: 'rgba(0,85,255,0.03)', borderColor: 'rgba(0,85,255,0.1)' }}
        >
          <Tag size={13} style={{ color: '#0055FF', flexShrink: 0, marginTop: 1 }} />
          <span>
            <strong className="text-gray-700">Tag expenses as COGS</strong> to split Cost of Goods from Operating Expenses in your{' '}
            <Link href="/dashboard/reports" className="text-blue-600 font-bold hover:underline">
              P&L and EBITDA waterfall
            </Link>.
            Click the <strong className="text-gray-700">COGS</strong> button on any row below.
          </span>
        </div>
      )}

      {expenses.map((expense, idx) => {
        const client  = Array.isArray(expense.clients) ? expense.clients[0] : expense.clients
        const catCfg  = categoryColors[expense.category] ?? categoryColors.other
        const dateStr = new Date(expense.date + 'T12:00:00').toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        })

        return (
          <div
            key={expense.id}
            className="inv-row-in bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            style={{ animationDelay: `${idx * 25}ms` }}
          >
            <div className="flex items-center gap-4 px-5 py-4">

              {/* Receipt thumbnail or category dot */}
              <div className="w-10 h-10 flex-shrink-0">
                {expense.receipt_url ? (
                  <a
                    href={expense.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="block w-10 h-10 rounded-xl overflow-hidden border border-gray-100 hover:border-orange-300 transition-colors"
                    title="View receipt"
                  >
                    {expense.receipt_is_pdf ? (
                      <div className="w-full h-full bg-red-50 flex items-center justify-center">
                        <FileImage className="w-5 h-5 text-red-400" />
                      </div>
                    ) : (
                      <img src={expense.receipt_url} alt="Receipt" className="w-full h-full object-cover" />
                    )}
                  </a>
                ) : (
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${catCfg.pill} border`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${catCfg.dot}`} />
                  </div>
                )}
              </div>

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-sm text-gray-900 truncate">{expense.description}</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${catCfg.pill}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${catCfg.dot}`} />
                    {getCategoryLabel(expense.category)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 flex-wrap">
                  <span>{dateStr}</span>
                  {expense.vendor && (
                    <>
                      <span className="text-gray-200">·</span>
                      <span className="font-medium text-gray-500">{expense.vendor}</span>
                    </>
                  )}
                  {client && (
                    <>
                      <span className="text-gray-200">·</span>
                      <Link
                        href={`/dashboard/clients/${client.id}`}
                        onClick={e => e.stopPropagation()}
                        className="text-blue-500 hover:text-blue-700 font-medium flex items-center gap-0.5 transition-colors"
                      >
                        {client.name} <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* COGS toggle */}
              <CogsToggle expenseId={expense.id} initialValue={expense.is_cogs ?? false} />

              {/* Amount */}
              <span className="text-base font-black text-gray-900 group-hover:text-orange-600 transition-colors flex-shrink-0">
                {fmt(Number(expense.amount))}
              </span>

              {/* Delete */}
              <DeleteButton expenseId={expense.id} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
