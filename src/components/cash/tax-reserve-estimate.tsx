// src/components/cash/tax-reserve-estimate.tsx
// Pure server component — receives pre-computed numbers as props.
//
// WHAT IT DOES:
//   Shows a conservative US self-employment tax reserve estimate:
//   - SE tax (15.3%) + estimated federal income tax (~12.7% blended)
//   - Total: ~28% of net profit as a rough reserve target
//
// This is an ESTIMATE only. The disclaimer is required and prominent.
// We err on the high side so users don't get surprised at tax time.
//
// WHY 28%:
//   US self-employed freelancers typically owe:
//   - 15.3% SE tax on net earnings (employer + employee share)
//   - ~10–15% federal income tax depending on bracket
//   28% is conservative but reasonable for a solo freelancer earning $50–150K.

import { PiggyBank, AlertCircle } from 'lucide-react'

interface TaxReserveEstimateProps {
  netProfit:    number   // totalRevenue - totalExpenses, all time
  totalRevenue: number   // for context display
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

const formatCompact = (n: number): string => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000)    return `$${(n / 1_000).toFixed(0)}K`
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n)
}

const TAX_RATE = 0.28

export default function TaxReserveEstimate({ netProfit, totalRevenue }: TaxReserveEstimateProps) {
  const taxableProfit = Math.max(0, netProfit)
  const reserveAmount = Math.round(taxableProfit * TAX_RATE)
  const hasData       = totalRevenue > 0

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <PiggyBank className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-black text-gray-900 tracking-tight">Tax Reserve</h2>
          <p className="text-sm text-gray-500 font-medium">Estimated amount to set aside</p>
        </div>
      </div>

      {!hasData ? (
        <p className="text-gray-400 text-sm font-medium">
          No revenue recorded yet. Send and collect invoices to see your tax estimate.
        </p>
      ) : netProfit <= 0 ? (
        <p className="text-gray-400 text-sm font-medium">
          No positive net profit recorded. Tax reserve applies when revenue exceeds expenses.
        </p>
      ) : (
        <>
          {/* Reserve amount */}
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl p-5 mb-4">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Estimated Reserve</p>
            <p
              className="text-3xl font-black text-amber-900 tracking-tight truncate min-w-0"
              title={formatCurrency(reserveAmount)}
            >
              {formatCompact(reserveAmount)}
            </p>
            <p className="text-sm text-amber-600 font-medium mt-1">
              {TAX_RATE * 100}% of {formatCompact(taxableProfit)} net profit
            </p>
          </div>

          {/* Breakdown */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">SE tax (~15.3%)</span>
              <span className="font-bold text-gray-700" title={formatCurrency(taxableProfit * 0.153)}>
                {formatCompact(taxableProfit * 0.153)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Federal income (~12.7%)</span>
              <span className="font-bold text-gray-700" title={formatCurrency(taxableProfit * 0.127)}>
                {formatCompact(taxableProfit * 0.127)}
              </span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
              <span className="font-bold text-gray-700">Total estimate</span>
              <span className="font-black text-amber-800" title={formatCurrency(reserveAmount)}>
                {formatCompact(reserveAmount)}
              </span>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Estimate only — not tax advice. Your actual liability depends on deductions,
              credits, state taxes, and your filing status. Consult a tax professional
              for your specific situation.
            </p>
          </div>
        </>
      )}
    </div>
  )
}