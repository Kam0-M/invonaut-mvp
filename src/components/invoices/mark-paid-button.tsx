'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please log in to continue', { id: loadingToast })
        router.push('/login')
        return
      }

      const { error } = await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', invoiceId)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success(`Invoice ${invoiceNumber} marked as paid!`, { id: loadingToast, duration: 3000 })
      
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
    <button
      onClick={handleMarkAsPaid}
      disabled={isMarking}
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#00C4A0] hover:bg-[#00b090] text-white transition-all duration-200 font-bold text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${fullWidth ? 'w-full' : ''}`}
    >
      {isMarking ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Marking...
        </>
      ) : (
        <>
          <CheckCircle className="w-4 h-4" />
          Mark as Paid
        </>
      )}
    </button>
  )
}