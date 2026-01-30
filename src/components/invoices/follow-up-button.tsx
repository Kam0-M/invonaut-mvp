'use client'

import { useState } from 'react'
import { Bell, Clock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type FollowUpButtonProps = {
  invoiceId: string
  invoiceNumber: string
  clientName: string
  lastFollowedUp: string | null
  daysOverdue: number
}

export function FollowUpButton({
  invoiceId,
  invoiceNumber,
  clientName,
  lastFollowedUp,
  daysOverdue
}: FollowUpButtonProps) {
  const [isSending, setIsSending] = useState(false)

  const getTimeSinceFollowUp = () => {
    if (!lastFollowedUp) return null
    
    const now = new Date()
    const lastFollowUp = new Date(lastFollowedUp)
    const hoursSince = (now.getTime() - lastFollowUp.getTime()) / (1000 * 60 * 60)
    
    if (hoursSince < 24) {
      return `${Math.floor(hoursSince)} hours ago`
    } else {
      return `${Math.floor(hoursSince / 24)} days ago`
    }
  }

  const canFollowUp = () => {
    if (!lastFollowedUp) return true
    
    const now = new Date()
    const lastFollowUp = new Date(lastFollowedUp)
    const hoursSince = (now.getTime() - lastFollowUp.getTime()) / (1000 * 60 * 60)
    
    return hoursSince >= 48
  }

  const handleFollowUp = async () => {
    if (!canFollowUp()) {
      toast.warning('Please wait 48 hours between follow-ups', { duration: 3000 })
      return
    }

    setIsSending(true)
    const loadingToast = toast.loading('Sending follow-up reminder...')

    try {
      const response = await fetch('/api/follow-up-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.error || 'Failed to send follow-up'
        
        if (errorMessage.includes('Demo mode')) {
          toast.error('Demo Mode: Can only send to kamohelo.thakhisi@gmail.com', { id: loadingToast, duration: 3000 })
        } else {
          toast.error(errorMessage, { id: loadingToast, duration: 3000 })
        }
        
        setIsSending(false)
        return
      }

      toast.success('Reminder sent successfully!', { id: loadingToast, duration: 3000 })
      setIsSending(false)
      
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
    } catch (error) {
      toast.error('Failed to send follow-up', { id: loadingToast, duration: 3000 })
      setIsSending(false)
    }
  }

  const timeSince = getTimeSinceFollowUp()
  const allowedToFollowUp = canFollowUp()

  return (
    <button
      onClick={handleFollowUp}
      disabled={isSending || !allowedToFollowUp}
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border-2 font-bold text-sm whitespace-nowrap transition-all duration-200 ${
        allowedToFollowUp 
          ? 'border-orange-300 bg-orange-500 hover:bg-orange-600 hover:border-orange-400 hover:shadow-lg text-white' 
          : 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
      }`}
    >
      {isSending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Sending...
        </>
      ) : (
        <>
          <Bell className="w-4 h-4" />
          Send Reminder
        </>
      )}
    </button>
  )
}