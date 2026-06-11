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
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 w-full sm:w-auto">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}
      {currentStatus === 'draft' && (
        <button
          onClick={() => updateStatus('sent')}
          disabled={isUpdating}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl btn-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
        >
          <Send className="w-4 h-4" />
          {isUpdating ? 'Updating...' : 'Mark as Sent'}
        </button>
      )}
      {currentStatus === 'sent' && (
        <button
          onClick={() => updateStatus('paid')}
          disabled={isUpdating}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#00C4A0] hover:bg-[#00b090] text-white font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
        >
          <CheckCircle className="w-4 h-4" />
          {isUpdating ? 'Updating...' : 'Mark as Paid'}
        </button>
      )}
    </div>
  )
}