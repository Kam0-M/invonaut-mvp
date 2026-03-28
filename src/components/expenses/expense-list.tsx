'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileImage, Trash2, Loader2, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { getCategoryLabel, EXPENSE_CATEGORIES } from '@/lib/ai/expense-categorization'

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

const categoryColors: Record<string, string> = {
  software:     'bg-blue-50 text-blue-700 border-blue-200',
  hardware:     'bg-gray-50 text-gray-700 border-gray-200',
  travel:       'bg-amber-50 text-amber-700 border-amber-200',
  meals:        'bg-orange-50 text-orange-700 border-orange-200',
  marketing:    'bg-pink-50 text-pink-700 border-pink-200',
  office:       'bg-cyan-50 text-cyan-700 border-cyan-200',
  professional: 'bg-violet-50 text-violet-700 border-violet-200',
  utilities:    'bg-teal-50 text-teal-700 border-teal-200',
  education:    'bg-indigo-50 text-indigo-700 border-indigo-200',
  insurance:    'bg-green-50 text-green-700 border-green-200',
  taxes:        'bg-red-50 text-red-700 border-red-200',
  other:        'bg-gray-50 text-gray-600 border-gray-200',
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
      className="p-2 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
      title="Delete expense"
    >
      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  )
}

export default function ExpenseList({ expenses, totalAmount }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-12 text-center">
        <p className="text-gray-400 font-medium">No expenses found.</p>
        <Link
          href="/dashboard/expenses/new"
          className="inline-flex mt-4 items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all"
        >
          Add first expense
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden">
      {/* Total bar */}
      <div className="px-6 py-4 bg-gray-50 border-b-2 border-gray-100 flex items-center justify-between">
        <span className="text-sm font-bold text-gray-600">{expenses.length} expense{expenses.length !== 1 ? 's' : ''}</span>
        <span className="text-base font-black text-gray-900">{formatCurrency(totalAmount)}</span>
      </div>

      <div className="divide-y divide-gray-50">
        {expenses.map(expense => {
          const client = Array.isArray(expense.clients) ? expense.clients[0] : expense.clients
          const catColor = categoryColors[expense.category] ?? categoryColors.other
          return (
            <div key={expense.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">

              {/* Receipt thumbnail */}
              <div className="w-10 h-10 flex-shrink-0">
                {expense.receipt_url ? (
                  <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer">
                    {expense.receipt_url.endsWith('.pdf') ? (
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <FileImage className="w-5 h-5 text-red-500" />
                      </div>
                    ) : (
                      <img
                        src={expense.receipt_url}
                        alt="Receipt"
                        className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                      />
                    )}
                  </a>
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FileImage className="w-5 h-5 text-gray-300" />
                  </div>
                )}
              </div>

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-bold text-sm text-gray-900 truncate">{expense.description}</p>
                  <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-bold border flex-shrink-0 ${catColor}`}>
                    {getCategoryLabel(expense.category)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>{new Date(expense.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  {expense.vendor && <><span>·</span><span>{expense.vendor}</span></>}
                  {client && (
                    <>
                      <span>·</span>
                      <Link href={`/dashboard/clients/${client.id}`} className="text-blue-500 hover:underline flex items-center gap-0.5">
                        {client.name} <ExternalLink className="w-3 h-3" />
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Amount */}
              <span className="text-base font-black text-gray-900 flex-shrink-0">
                {formatCurrency(Number(expense.amount))}
              </span>

              {/* Delete */}
              <DeleteButton expenseId={expense.id} />
            </div>
          )
        })}
      </div>
    </div>
  )
}