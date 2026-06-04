// src/components/dashboard/opportunity-panel.tsx
// Growth Opportunities — unbilled time + active contract value

import { TrendingUp, Clock, FileSignature } from 'lucide-react'
import Link from 'next/link'
import { useCurrency } from '@/lib/context/currency-context'

const fmt = (n: number) => {
  if (n >= 999_500) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000)  return `$${(n / 1_000).toFixed(0)}K`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
}

interface Props {
  unbilledHours:     number
  unbilledValue:     number
  activeContracts:   number
  contractValue:     number
}

export default function OpportunityPanel({
  unbilledHours, unbilledValue, activeContracts, contractValue }: Props) {
  const { format: fmt } = useCurrency()
  const hasOpportunities = unbilledValue > 0 || contractValue > 0

  return (
    <div className="bg-white border border-teal-100 rounded-2xl overflow-hidden inv-fade-up inv-fade-up-4 transition-all duration-200 hover:-translate-y-0.5 inv-glow-teal">
      {/* Header */}
      <div className="p-5 border-b border-gray-50 bg-teal-50/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shadow-sm">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900">Growth Opportunities</h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Untapped revenue potential</p>
          </div>
        </div>
      </div>

      {/* Panels */}
      <div className="p-5">
        <div className="grid grid-cols-2 gap-3">
          {/* Unbilled hours */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">Potential</span>
            </div>
            <p className="text-xs font-bold text-gray-600 mb-1">Unbilled Hours</p>
            <p className="text-xl font-black text-blue-600">{unbilledHours}h</p>
            {unbilledValue > 0 && (
              <p className="text-xs text-gray-500 mt-0.5">≈ <span className="font-bold text-blue-600">{fmt(unbilledValue)}</span></p>
            )}
            <Link href="/dashboard/time"
              className="mt-auto pt-3 block text-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all active:scale-[0.98]">
              Create Invoice
            </Link>
          </div>

          {/* Contract value */}
          <div className="p-4 rounded-xl bg-teal-50 border border-teal-100 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <FileSignature className="w-4 h-4 text-teal-600" />
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded-full">Active</span>
            </div>
            <p className="text-xs font-bold text-gray-600 mb-1">Contract Value</p>
            <p className="text-xl font-black text-teal-600">{fmt(contractValue)}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              <span className="font-bold text-teal-600">{activeContracts}</span> active
            </p>
            <Link href="/dashboard/contracts"
              className="mt-auto pt-3 block text-center px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-all active:scale-[0.98]">
              View Contracts
            </Link>
          </div>
        </div>

          <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
            <p className="text-xs text-gray-600">
              <span className="font-bold text-blue-700">Insight: </span>
              Converting unbilled hours and active contracts could increase monthly revenue by{' '}
              <span className="font-bold">18–24%</span>.
            </p>
          </div>
      </div>
    </div>
  )
}
