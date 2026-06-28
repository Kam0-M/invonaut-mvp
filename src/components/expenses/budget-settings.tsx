'use client'

import { useCurrency } from '@/lib/context/currency-context'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { EXPENSE_CATEGORIES, getCategoryLabel } from '@/lib/ai/expense-categorization'
import { createClient } from '@/lib/supabase/client'
import InlineUpgradePrompt from '@/components/ui/inline-upgrade-prompt'

type Budget = {
  id: string
  category: string
  monthly_limit: number
  amountSpent?: number
  percentUsed?: number
}

interface BudgetSettingsProps {
  budgets: Budget[]
  isBusiness: boolean
}


export default function BudgetSettings({
  budgets: initialBudgets, isBusiness }: BudgetSettingsProps) {
  const { format: fmt } = useCurrency()
  const router = useRouter()
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets)
  const [showForm, setShowForm] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [newLimit, setNewLimit] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const usedCategories = new Set(budgets.map(b => b.category))
  const availableCategories = EXPENSE_CATEGORIES.filter(c => !usedCategories.has(c.value))

  const handleAdd = async () => {
    if (!newCategory) { toast.error('Select a category.'); return }
    if (!newLimit || isNaN(Number(newLimit)) || Number(newLimit) <= 0) {
      toast.error('Enter a valid monthly limit.')
      return
    }

    setIsSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error('Not logged in.'); return }

      const { data, error } = await supabase
        .from('expense_budgets')
        .insert({
          user_id: user.id,
          category: newCategory,
          monthly_limit: parseFloat(newLimit),
        })
        .select('id, category, monthly_limit')
        .single()

      if (error) { toast.error('Could not save budget.'); return }

      setBudgets(prev => [...prev, data as Budget])
      setShowForm(false)
      setNewCategory('')
      setNewLimit('')
      toast.success('Budget set.')
      router.refresh()
    } catch {
      toast.error('Could not save budget.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this budget?')) return
    setDeletingId(id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('expense_budgets').delete().eq('id', id)
      if (error) { toast.error('Could not remove budget.'); return }
      setBudgets(prev => prev.filter(b => b.id !== id))
      toast.success('Budget removed.')
      router.refresh()
    } catch {
      toast.error('Could not remove budget.')
    } finally {
      setDeletingId(null)
    }
  }

  if (!isBusiness) {
    return (
      <InlineUpgradePrompt
        icon={ShieldAlert}
        title="Budget Alerts"
        description="Set monthly spending limits per category. See live status here as you spend, plus email alerts at 80% and 100%."
        requiredPlan="Business"
      />
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          Budget Alerts
        </h3>
        {availableCategories.length > 0 && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add budget
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        Live status below updates as you log expenses. Email alerts at 80%/100% also send once your account's email setup is fully verified.
      </p>

      {/* Add form */}
      {showForm && (
        <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/30 space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Category</label>
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 bg-white focus:border-blue-500 outline-none transition-all"
            >
              <option value="">Select a category...</option>
              {availableCategories.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Monthly limit</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
              <input
                type="number"
                value={newLimit}
                onChange={e => setNewLimit(e.target.value)}
                placeholder="500"
                min="1"
                step="1"
                className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => { setShowForm(false); setNewCategory(''); setNewLimit('') }}
              className="px-4 py-2 rounded-lg text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Budget list */}
      {budgets.length === 0 && !showForm ? (
        <p className="text-sm text-gray-400">No budgets set yet.</p>
      ) : (
        <div className="space-y-2">
          {budgets.map(budget => {
            const percentUsed = budget.percentUsed ?? 0
            const amountSpent = budget.amountSpent ?? 0
            const isOver    = percentUsed >= 100
            const isWarning = percentUsed >= 80 && percentUsed < 100
            const barColor  = isOver ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-[#00C896]'
            const textColor = isOver ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-gray-400'

            return (
              <div key={budget.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{getCategoryLabel(budget.category)}</p>
                    <p className={`text-xs font-bold ${textColor}`}>
                      {fmt(amountSpent)} / {fmt(budget.monthly_limit)} this month ({percentUsed}%)
                      {isOver && ' — over budget'}
                      {isWarning && ' — approaching limit'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(budget.id)}
                    disabled={deletingId === budget.id}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
                    title="Remove budget"
                  >
                    {deletingId === budget.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />
                    }
                  </button>
                </div>
                <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${barColor}`}
                    style={{ width: `${Math.min(100, percentUsed)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}