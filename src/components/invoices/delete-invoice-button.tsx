'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type DeleteInvoiceButtonProps = {
  invoiceId: string
  invoiceNumber: string
}

export function DeleteInvoiceButton({
  invoiceId,
  invoiceNumber
}: DeleteInvoiceButtonProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)
    const loadingToast = toast.loading('Deleting invoice...')

    try {
      const supabase = createClient()

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId)

      if (itemsError) throw itemsError

      const { error: invoiceError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId)

      if (invoiceError) throw invoiceError

      toast.success('Invoice deleted successfully!', { id: loadingToast, duration: 3000 })
      
      setTimeout(() => {
        router.push('/dashboard/invoices')
        router.refresh()
      }, 500)
    } catch (err: any) {
      console.error('Error deleting invoice:', err)
      setError(err.message || 'Failed to delete invoice')
      toast.error(err.message || 'Failed to delete invoice', { id: loadingToast, duration: 3000 })
      setIsDeleting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsDialogOpen(true)}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border-2 border-red-300 bg-white hover:bg-red-50 hover:border-red-400 hover:shadow-lg transition-all duration-200 font-bold text-red-600 text-sm whitespace-nowrap"
      >
        <Trash2 className="w-4 h-4" />
        Delete Invoice
      </button>

      <ConfirmDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Invoice?"
        description={`Are you sure you want to delete invoice ${invoiceNumber}? This action cannot be undone and will permanently remove all associated line items.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
      />

      {error && (
        <div className="mt-2 p-3 bg-red-50 border-2 border-red-200 rounded-xl">
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}
    </>
  )
}