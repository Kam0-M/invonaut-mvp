'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type MarkAsPaidButtonProps = {
  invoiceId: string
  invoiceNumber: string
  fullWidth?: boolean
}

export function MarkAsPaidButton({ 
  invoiceId, 
  invoiceNumber,
  fullWidth = false 
}: MarkAsPaidButtonProps) {
  const [isMarking, setIsMarking] = useState(false)
  const router = useRouter()

  const handleMarkAsPaid = async () => {
    setIsMarking(true)
    const loadingToast = toast.loading('Marking invoice as paid...')

    try {
      const supabase = createClient()
      
      // Verify user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please log in to continue', { id: loadingToast })
        router.push('/login')
        return
      }

      // Update invoice status to 'paid'
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', invoiceId)
        .eq('user_id', user.id) // Security: ensure user owns this invoice

      if (error) throw error

      toast.success(`Invoice ${invoiceNumber} marked as paid!`, { id: loadingToast, duration: 3000 })
      
      // Refresh the page to show updated status
      router.refresh()
    } catch (error: any) {
      console.error('Error marking invoice as paid:', error)
      toast.error(
        error.message || 'Failed to mark invoice as paid. Please try again.',
        { id: loadingToast }
      )
    } finally {
      setIsMarking(false)
    }
  }

  return (
    <Button
      onClick={handleMarkAsPaid}
      disabled={isMarking}
      className={`bg-green-600 hover:bg-green-700 text-white ${fullWidth ? 'w-full justify-start' : ''}`}
      size="sm"
    >
      {isMarking ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Marking...
        </>
      ) : (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          Mark as Paid
        </>
      )}
    </Button>
  )
}