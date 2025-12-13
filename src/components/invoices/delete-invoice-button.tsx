'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { createClient } from '@/lib/supabase/client'

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

    try {
      const supabase = createClient()

      // Delete invoice items first (cascade)
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId)

      if (itemsError) throw itemsError

      // Delete the invoice
      const { error: invoiceError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId)

      if (invoiceError) throw invoiceError

      // Success! Redirect to invoice list
      router.push('/dashboard/invoices')
      router.refresh()
    } catch (err: any) {
      console.error('Error deleting invoice:', err)
      setError(err.message || 'Failed to delete invoice')
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsDialogOpen(true)}
        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Delete Invoice
      </Button>

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
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </>
  )
}