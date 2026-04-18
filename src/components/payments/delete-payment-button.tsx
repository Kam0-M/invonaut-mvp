'use client'
// src/components/payments/delete-payment-button.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface Props {
  paymentId:   string
  description: string
}

export default function DeletePaymentButton({ paymentId, description }: Props) {
  const router = useRouter()
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/direct-payments/delete', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: paymentId }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success('Payment deleted')
      router.push('/dashboard/payments')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete payment')
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-red-200 bg-white text-red-600 font-bold hover:bg-red-50 hover:border-red-300 hover:shadow-lg transition-all"
      >
        <Trash2 className="w-4 h-4" />Delete
      </button>
      <ConfirmDialog
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={handleDelete}
        title="Delete Payment"
        description={`Are you sure you want to delete the payment for "${description}"? This cannot be undone.`}
        confirmText="Delete"
        isLoading={loading}
      />
    </>
  )
}
