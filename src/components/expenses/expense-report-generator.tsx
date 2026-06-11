'use client'

import { useState } from 'react'
import { Download, Loader2, FileText, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import { EXPENSE_CATEGORIES } from '@/lib/ai/expense-categorization'

export default function ExpenseReportGenerator() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [category, setCategory] = useState('all')
  const [isExporting, setIsExporting] = useState<'csv' | 'pdf' | null>(null)

  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(format)
    try {
      const res = await fetch('/api/expenses/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, startDate: startDate || null, endDate: endDate || null, category }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Could not generate report.')
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `expense-report-${Date.now()}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(`${format.toUpperCase()} report downloaded.`)
    } catch {
      toast.error('Could not generate report.')
    } finally {
      setIsExporting(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
      <h3 className="font-black text-gray-900">Export Report</h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">From</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">To</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">Category</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:border-blue-500 outline-none transition-all bg-white"
          >
            <option value="all">All categories</option>
            {EXPENSE_CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => handleExport('csv')}
          disabled={!!isExporting}
          className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
        >
          {isExporting === 'csv'
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <FileSpreadsheet className="w-4 h-4 text-green-600" />
          }
          {isExporting === 'csv' ? 'Generating...' : 'Export CSV'}
        </button>
        <button
          onClick={() => handleExport('pdf')}
          disabled={!!isExporting}
          className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
        >
          {isExporting === 'pdf'
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <FileText className="w-4 h-4 text-red-500" />
          }
          {isExporting === 'pdf' ? 'Generating...' : 'Export PDF'}
        </button>
      </div>

      <p className="text-xs text-gray-400 italic">
        For reference only — not tax advice. Consult a qualified tax professional.
      </p>
    </div>
  )
}