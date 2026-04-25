'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileImage, Trash2, Loader2, ExternalLink, Receipt } from 'lucide-react'
import { useState } from 'react'
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
  notes: string | null
  clients: { id: string; name: string } | null
}

interface ExpenseListProps {
  expenses: Expense[]
  totalAmount: number
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

const categoryColors: Record<string, { pill: string; dot: string }> = {
  software:     { pill: 'bg-blue-50 text-blue-700 border-blue-200',     dot: 'bg-blue-500'   },
  hardware:     { pill: 'bg-gray-50 text-gray-700 border-gray-200',     dot: 'bg-gray-400'   },
  travel:       { pill: 'bg-amber-50 text-amber-700 border-amber-200',  dot: 'bg-amber-500'  },
  meals:        { pill: 'bg-orange-50 text-orange-700 border-orange-200',dot: 'bg-orange-500' },
  marketing:    { pill: 'bg-pink-50 text-pink-700 border-pink-200',     dot: 'bg-pink-500'   },
  office:       { pill: 'bg-cyan-50 text-cyan-700 border-cyan-200',     dot: 'bg-cyan-500'   },
  professional: { pill: 'bg-violet-50 text-violet-700 border-violet-200',dot:'bg-violet-500' },
  utilities:    { pill: 'bg-teal-50 text-teal-700 border-teal-200',     dot: 'bg-teal-500'   },
  education:    { pill: 'bg-indigo-50 text-indigo-700 border-indigo-200',dot:'bg-indigo-500' },
  insurance:    { pill: 'bg-green-50 text-green-700 border-green-200',  dot: 'bg-green-500'  },
  taxes:        { pill: 'bg-red-50 text-red-700 border-red-200',        dot: 'bg-red-500'    },
  other:        { pill: 'bg-gray-50 text-gray-600 border-gray-200',     dot: 'bg-gray-400'   },
}

function DeleteButton({ expenseId }: { expenseId: string }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm('Delete this expense?')) return
    setIsDeleting(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error } = await supabase.from('expenses').delete().eq('id', expenseId)
      if (error) { toast.error('Could not delete expense.'); return }
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

export default function ExpenseList({ expenses, totalAmount }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-1 inv-animated-bar" />
        <div className="p-12 text-center">
          <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-7 h-7 text-orange-400" />
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-2">No expenses recorded yet</h3>
          <p className="text-sm text-gray-500 font-medium mb-6 max-w-sm mx-auto">
            Log your first expense and Invonaut will categorise it automatically — helping you understand where money is going.
          </p>
          <Link
            href="/dashboard/expenses/new"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:shadow-lg hover:scale-[1.02]"
          >
            Add first expense
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Summary bar */}
      <div className="flex items-center justify-between px-1 mb-1">
        <p className="text-sm text-gray-500 font-medium">
          <span className="text-gray-900 font-bold">{expenses.length}</span> expense{expenses.length !== 1 ? 's' : ''}
        </p>
        <p className="text-sm font-black text-gray-900">{formatCurrency(totalAmount)}</p>
      </div>

      {expenses.map((expense, idx) => {
        const client   = Array.isArray(expense.clients) ? expense.clients[0] : expense.clients
        const catCfg   = categoryColors[expense.category] ?? categoryColors.other
        const dateStr  = new Date(expense.date + 'T12:00:00').toLocaleDateString('en-US', {
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
                    {expense.receipt_url.endsWith('.pdf') ? (
                      <div className="w-full h-full bg-red-50 flex items-center justify-center">
                        <FileImage className="w-5 h-5 text-red-400" />
                      </div>
                    ) : (
                      <img
                        src={expense.receipt_url}
                        alt="Receipt"
                        className="w-full h-full object-cover"
                      />
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

              {/* Amount */}
              <span className="text-base font-black text-gray-900 group-hover:text-orange-600 transition-colors flex-shrink-0">
                {formatCurrency(Number(expense.amount))}
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
