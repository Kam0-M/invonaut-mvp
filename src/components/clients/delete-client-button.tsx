'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type DeleteClientButtonProps = {
  clientId: string
  clientName: string
  hasInvoices: boolean
}

export function DeleteClientButton({
  clientId,
  clientName,
  hasInvoices
}: DeleteClientButtonProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (hasInvoices) {
      toast.error('Cannot delete client with existing invoices. Please delete or reassign invoices first.', { duration: 3000 })
      setIsDialogOpen(false)
      return
    }

    setIsDeleting(true)
    const loadingToast = toast.loading('Deleting client...')

    try {
      const supabase = createClient()

      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)

      if (deleteError) throw deleteError

      toast.success('Client deleted successfully!', { id: loadingToast, duration: 3000 })
      
      setTimeout(() => {
        router.push('/dashboard/clients')
        router.refresh()
      }, 500)
    } catch (err: any) {
      console.error('Error deleting client:', err)
      toast.error('' + (err.message || 'Failed to delete client'), { id: loadingToast, duration: 3000 })
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsDialogOpen(true)}
        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
        size="sm"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Delete Client
      </Button>

      <ConfirmDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Client?"
        description={`Are you sure you want to delete ${clientName}? This action cannot be undone. ${hasInvoices ? 'This client has invoices and cannot be deleted.' : ''}`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
      />
    </>
  )
}

