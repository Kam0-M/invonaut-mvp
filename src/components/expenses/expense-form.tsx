'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { EXPENSE_CATEGORIES } from '@/lib/ai/expense-categorization'
import ReceiptUploader from '@/components/expenses/receipt-uploader'

type Client = { id: string; name: string; company: string | null }

interface ExpenseFormProps {
  clients: Client[]
  hasPro: boolean
}

export default function ExpenseForm({ clients, hasPro }: ExpenseFormProps) {
  const router = useRouter()

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [vendor, setVendor] = useState('')
  const [category, setCategory] = useState('other')
  const [clientId, setClientId] = useState('')
  const [receiptUrl, setReceiptUrl] = useState('')
  const [notes, setNotes] = useState('')

  const [isSaving, setIsSaving] = useState(false)
  const [isCategorizing, setIsCategorizing] = useState(false)

  const handleAISuggest = async () => {
    if (!description.trim()) { toast.error('Enter a description first.'); return }
    setIsCategorizing(true)
    try {
      const res = await fetch('/api/expenses/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, vendor }),
      })
      const data = await res.json()
      if (data.success && data.category) {
        setCategory(data.category)
        toast.success('Category suggested.')
      }
    } catch {
      toast.error('Could not suggest category.')
    } finally {
      setIsCategorizing(false)
    }
  }

  const handleSave = async () => {
    if (!description.trim()) { toast.error('Description is required.'); return }
    if (!amount || isNaN(Number(amount)) || Number(amount) < 0) {
      toast.error('Enter a valid amount.')
      return
    }
    if (!date) { toast.error('Date is required.'); return }

    setIsSaving(true)
    try {
      const res = await fetch('/api/expenses/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          amount: parseFloat(amount),
          date,
          vendor: vendor.trim() || null,
          category,
          clientId: clientId || null,
          receiptUrl: receiptUrl || null,
          notes: notes.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Could not save expense.')
        return
      }
      toast.success('Expense saved.')
      router.push('/dashboard/expenses')
    } catch {
      toast.error('Could not save expense. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Core fields */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-6 space-y-5">
        <h3 className="font-black text-gray-900">Expense details</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Description */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Adobe Creative Cloud subscription"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full pl-8 pr-4 py-3 rounded-xl border-2 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
          </div>

          {/* Vendor */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Vendor (optional)</label>
            <input
              type="text"
              value={vendor}
              onChange={e => setVendor(e.target.value)}
              placeholder="e.g. Adobe Inc."
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-gray-700">Category</label>
              {hasPro && (
                <button
                  type="button"
                  onClick={handleAISuggest}
                  disabled={isCategorizing}
                  className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors disabled:opacity-50"
                >
                  {isCategorizing
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Sparkles className="w-3 h-3" />
                  }
                  {isCategorizing ? 'Suggesting...' : 'AI suggest'}
                </button>
              )}
            </div>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white"
            >
              {EXPENSE_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Client link */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Link to client (optional)
            </label>
            <select
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white"
            >
              <option value="">No client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.company ? ` — ${c.company}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Any additional details..."
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-y"
            />
          </div>
        </div>
      </div>

      {/* Receipt upload */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-6">
        <ReceiptUploader
          onUploaded={url => setReceiptUrl(url)}
          currentUrl={receiptUrl || null}
        />
      </div>

      {/* Save */}
      <div className="flex justify-end pb-8">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-2xl transition-all disabled:opacity-50"
        >
          {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
          {isSaving ? 'Saving...' : 'Save Expense'}
        </button>
      </div>
    </div>
  )
}