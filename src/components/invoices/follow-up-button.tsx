'use client'

import { useState } from 'react'
import { Bell, Clock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
      toast.warning('⚠️ Please wait 48 hours between follow-ups', { duration: 3000 })
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
          toast.error('⚠️ Demo Mode: Can only send to kamohelo.thakhisi@gmail.com', { id: loadingToast, duration: 3000 })
        } else {
          toast.error('⚠️ ' + errorMessage, { id: loadingToast, duration: 3000 })
        }
        
        setIsSending(false)
        return
      }

      toast.success('Reminder sent successfully!', { id: loadingToast, duration: 3000 })
      setIsSending(false)
      
      // Refresh page after 1 second
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
    } catch (error) {
      toast.error('⚠️ Failed to send follow-up', { id: loadingToast, duration: 3000 })
      setIsSending(false)
    }
  }

  const timeSince = getTimeSinceFollowUp()
  const allowedToFollowUp = canFollowUp()

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleFollowUp}
        disabled={isSending || !allowedToFollowUp}
        size="sm"
        variant={allowedToFollowUp ? "default" : "outline"}
        className={allowedToFollowUp 
          ? "bg-orange-500 hover:bg-orange-600 text-white" 
          : "opacity-50 cursor-not-allowed"
        }
      >
        {isSending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Bell className="w-4 h-4 mr-2" />
            Send Reminder
          </>
        )}
      </Button>

      {timeSince && (
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Last followed up {timeSince}
        </p>
      )}

      {!allowedToFollowUp && timeSince && (
        <p className="text-xs text-orange-600">
          Wait 48 hours between reminders
        </p>
      )}
    </div>
  )
}