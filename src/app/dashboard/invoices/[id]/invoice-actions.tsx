'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Send, CheckCircle } from 'lucide-react'

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
    <div className="flex items-center gap-3">
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {currentStatus === 'draft' && (
        <Button
          onClick={() => updateStatus('sent')}
          disabled={isUpdating}
          className="bg-primary hover:bg-primary/90"
        >
          <Send className="w-4 h-4 mr-2" />
          {isUpdating ? 'Updating...' : 'Mark as Sent'}
        </Button>
      )}
      {currentStatus === 'sent' && (
        <Button
          onClick={() => updateStatus('paid')}
          disabled={isUpdating}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          {isUpdating ? 'Updating...' : 'Mark as Paid'}
        </Button>
      )}
    </div>
  )
}

