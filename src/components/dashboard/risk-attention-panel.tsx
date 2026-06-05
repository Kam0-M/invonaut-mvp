'use client'

// src/components/dashboard/risk-attention-panel.tsx
// Risk & Attention — groups urgent items by severity

import { AlertTriangle, Clock, Send } from 'lucide-react'
import Link from 'next/link'
import { useCurrency } from '@/lib/context/currency-context'

interface Props {
  overdueCount:      number
  expiringSoon:      number
  followUpsSent:     number
  overdueValue:      number
}

export default function RiskAttentionPanel({
  overdueCount, expiringSoon, followUpsSent, overdueValue }: Props) {
  const { format: fmt } = useCurrency()
  const allClear = overdueCount === 0 && expiringSoon === 0

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden inv-fade-up inv-fade-up-4 transition-all duration-200 hover:-translate-y-0.5 inv-glow-red ${allClear ? 'border-gray-100' : 'border-red-100'}`}>
      {/* Header */}
      <div className={`p-5 border-b border-gray-50 ${allClear ? 'bg-teal-50/40' : 'bg-red-50/30'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${allClear ? 'bg-teal-500' : 'bg-red-500'}`}>
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900">Risk & Attention</h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              {allClear ? 'No urgent items — all clear' : 'Items needing immediate action'}
            </p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="p-5 space-y-3">

        {/* Overdue */}
        <div className={`p-4 rounded-xl border ${overdueCount > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${overdueCount > 0 ? 'text-red-500' : 'text-gray-400'}`} />
              <p className="text-xs font-bold text-gray-700">Overdue Invoices</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${overdueCount > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-500'}`}>
              {overdueCount > 0 ? `${overdueCount} active` : 'None'}
            </span>
          </div>
          <p className={`text-2xl font-black ${overdueCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>{overdueCount}</p>
          {overdueValue > 0 && <p className="text-xs text-red-500 font-medium mt-0.5">{fmt(overdueValue)} at risk</p>}
        </div>

        {/* Expiring */}
        <div className={`p-4 rounded-xl border ${expiringSoon > 0 ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'}`}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${expiringSoon > 0 ? 'text-amber-500' : 'text-gray-400'}`} />
              <p className="text-xs font-bold text-gray-700">Expiring Contracts</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${expiringSoon > 0 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-500'}`}>
              {expiringSoon > 0 ? `${expiringSoon} active` : 'None'}
            </span>
          </div>
          <p className={`text-2xl font-black ${expiringSoon > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{expiringSoon}</p>
        </div>

        {/* AI Follow-ups */}
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" />
              <p className="text-xs font-bold text-gray-700">AI Follow-ups Sent</p>
            </div>
            <p className="text-lg font-black text-blue-600">{followUpsSent}</p>
          </div>
          <p className="text-[10px] text-gray-500 font-medium mt-1">Automated collection running in the background</p>
        </div>

        {/* Actions */}
        {(overdueCount > 0 || expiringSoon > 0) && (
          <div className="flex gap-2 pt-1">
            {overdueCount > 0 && (
              <Link href="/dashboard/invoices?status=overdue"
                className="flex-1 text-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all active:scale-[0.98]">
                Send Reminders
              </Link>
            )}
            {expiringSoon > 0 && (
              <Link href="/dashboard/contracts"
                className="flex-1 text-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-all active:scale-[0.98]">
                Review Contracts
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
