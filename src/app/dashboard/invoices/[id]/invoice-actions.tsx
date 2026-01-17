'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Send, CheckCircle, AlertCircle } from 'lucide-react'

type InvoiceActionsProps = {
  invoiceId: string
  currentStatus: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
}

export function InvoiceActions({ invoiceId, currentStatus }: InvoiceActionsProps) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateStatus = async (newStatus: 'sent' | 'paid') => {
    setIsUpdating(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoiceId)

      if (updateError) throw updateError

      router.refresh()
    } catch (err: any) {
      console.error('Error updating invoice status:', err)
      setError(err.message || 'Failed to update invoice status')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 flex items-start gap-2 w-full sm:w-auto">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}
      {currentStatus === 'draft' && (
        <button
          onClick={() => updateStatus('sent')}
          disabled={isUpdating}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-2xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-w-[160px]"
        >
          <Send className="w-4 h-4" />
          {isUpdating ? 'Updating...' : 'Mark as Sent'}
        </button>
      )}
      {currentStatus === 'sent' && (
        <button
          onClick={() => updateStatus('paid')}
          disabled={isUpdating}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white font-bold hover:from-green-700 hover:to-green-800 hover:shadow-2xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-w-[160px]"
        >
          <CheckCircle className="w-4 h-4" />
          {isUpdating ? 'Updating...' : 'Mark as Paid'}
        </button>
      )}
    </div>
  )
}