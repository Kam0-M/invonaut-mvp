'use client'
// src/components/cash/runway-calculator.tsx
//
// WHAT IT DOES:
//   The most interactive part of the Cash Management page.
//   Lets the user enter their current bank balance, saves it to /api/cash/snapshot,
//   then shows:
//     1. Months of runway = balance / avgMonthlyExpenses
//     2. The impact of collecting overdue invoices: "Collecting $X extends runway by Y months"
//
// WHY CLIENT COMPONENT:
//   The balance input needs to be editable. Everything else on the cash page is
//   server-rendered, so this is the only piece that re-renders on user interaction.
//
// PROPS FROM SERVER PAGE:
//   avgMonthlyExpenses — computed from last 90 days of expenses / 3
//   overdueTotal       — sum of all overdue invoice amounts
//   initialBalance     — from latest cash_snapshot (null if none saved yet)
//
// EDGE CASES:
//   - avgMonthlyExpenses = 0: show "∞ runway (no expenses recorded)"
//   - balance = 0 + expenses > 0: "0 months — funds exhausted"
//   - negative balance: not allowed (validated before save)
//   - large numbers: formatCompact to prevent overflow

import { useState } from 'react'
import { Loader2, Save, Wallet, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface RunwayCalculatorProps {
  avgMonthlyExpenses: number
  overdueTotal:       number
  initialBalance:     number | null
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000)    return `$${(n / 1_000).toFixed(0)}K`
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n)
}

function formatRunway(months: number): string {
  if (!isFinite(months)) return '∞'
  if (months <= 0)       return '0'
  if (months < 1)        return '< 1 mo'
  if (months < 12)       return `${months.toFixed(1)} mo`
  return `${(months / 12).toFixed(1)} yr`
}

function runwayColor(months: number): string {
  if (!isFinite(months) || months > 6) return 'text-green-700'
  if (months > 3)                       return 'text-amber-700'
  return 'text-red-700'
}

function runwayBg(months: number): string {
  if (!isFinite(months) || months > 6) return 'bg-green-50 border-green-200'
  if (months > 3)                       return 'bg-amber-50 border-amber-200'
  return 'bg-red-50 border-red-200'
}

export default function RunwayCalculator({
  avgMonthlyExpenses,
  overdueTotal,
  initialBalance,
}: RunwayCalculatorProps) {
  const [balance,   setBalance]   = useState(initialBalance !== null ? String(initialBalance) : '')
  const [isSaving,  setIsSaving]  = useState(false)
  const [saved,     setSaved]     = useState(initialBalance !== null)

  const numBalance = parseFloat(balance) || 0
  const hasBalance = balance !== '' && !isNaN(parseFloat(balance))

  // Runway calculations
  const currentRunway = avgMonthlyExpenses > 0
    ? numBalance / avgMonthlyExpenses
    : Infinity

  const collectedRunway = avgMonthlyExpenses > 0 && overdueTotal > 0
    ? (numBalance + overdueTotal) / avgMonthlyExpenses
    : null

  const runwayGain = collectedRunway !== null ? collectedRunway - currentRunway : 0

  const handleSave = async () => {
    const num = parseFloat(balance)
    if (!balance || isNaN(num) || num < 0) {
      toast.error('Enter a valid balance (0 or higher).')
      return
    }
    setIsSaving(true)
    try {
      const res  = await fetch('/api/cash/snapshot', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ balance: num }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Could not save balance.')
        return
      }
      setSaved(true)
      toast.success('Balance saved.')
    } catch {
      toast.error('Could not save balance.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Wallet className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-black text-gray-900 tracking-tight">Cash Runway</h2>
          <p className="text-sm text-gray-500 font-medium">Enter your current bank balance to see how long your funds last</p>
        </div>
      </div>

      {/* Balance input */}
      <div>
        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
          Current bank balance
        </label>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span>
            <input
              type="number"
              value={balance}
              onChange={e => { setBalance(e.target.value); setSaved(false) }}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              min="0"
              step="0.01"
              placeholder="0.00"
              disabled={isSaving}
              className="w-full pl-8 pr-4 py-3 rounded-xl border-2 border-gray-200 text-gray-900 font-bold
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all
                         disabled:bg-gray-50 text-lg"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || !balance}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl btn-primary
                       disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 text-sm"
          >
            {isSaving
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : saved
              ? <CheckCircle2 className="w-4 h-4" />
              : <Save className="w-4 h-4" />
            }
            {isSaving ? 'Saving...' : saved ? 'Saved' : 'Save'}
          </button>
        </div>
        {avgMonthlyExpenses > 0 && (
          <p className="text-xs text-gray-400 font-medium mt-1.5">
            Based on {formatCompact(avgMonthlyExpenses)}/mo avg expenses (last 90 days)
          </p>
        )}
        {avgMonthlyExpenses === 0 && (
          <p className="text-xs text-amber-600 font-medium mt-1.5">
            No expenses logged yet — add expenses to calculate runway accurately.
          </p>
        )}
      </div>

      {/* Runway display */}
      {hasBalance && (
        <div className={`rounded-xl border-2 p-5 ${runwayBg(currentRunway)}`}>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Estimated Runway</p>
          <p className={`text-4xl font-black tracking-tight ${runwayColor(currentRunway)} min-w-0 truncate`}
             title={isFinite(currentRunway) ? `${currentRunway.toFixed(2)} months` : 'Unlimited'}>
            {formatRunway(currentRunway)}
          </p>
          <p className="text-sm font-medium text-gray-500 mt-1">
            {!isFinite(currentRunway)
              ? 'No expenses recorded — log expenses for an accurate estimate.'
              : currentRunway <= 0
              ? 'Funds exhausted. Invoice clients or reduce expenses.'
              : currentRunway < 3
              ? 'Low runway — consider invoicing outstanding clients urgently.'
              : currentRunway < 6
              ? 'Moderate runway — keep an eye on outstanding invoices.'
              : 'Healthy runway — keep it up.'}
          </p>
        </div>
      )}

      {/* Overdue impact statement */}
      {hasBalance && overdueTotal > 0 && collectedRunway !== null && runwayGain > 0.1 && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-blue-900">
              Collecting {formatCompact(overdueTotal)} in overdue invoices would extend your runway by{' '}
              <span className="text-blue-700">{formatRunway(runwayGain)}</span>
            </p>
            <p className="text-xs text-blue-600 font-medium mt-0.5">
              {formatRunway(currentRunway)} → {formatRunway(collectedRunway)} total runway
            </p>
          </div>
        </div>
      )}

      {/* No overdue, no balance input yet */}
      {!hasBalance && (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <p className="text-sm text-gray-500 font-medium">
            Enter your bank balance above to see your cash runway calculation.
          </p>
        </div>
      )}
    </div>
  )
}