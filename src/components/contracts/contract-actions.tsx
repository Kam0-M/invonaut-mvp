'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ContractActionsProps {
  contractId: string
  status: string
  clientEmail: string | null
}

export default function ContractActions({ contractId, status, clientEmail }: ContractActionsProps) {
  const router = useRouter()
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    if (!clientEmail) {
      toast.error('This client has no email address. Add one in their profile first.')
      return
    }
    setIsSending(true)
    try {
      const res = await fetch('/api/contracts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Could not send contract.')
        return
      }
      toast.success('Contract sent to client.')
      router.refresh()
    } catch {
      toast.error('Could not send contract. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  if (status !== 'draft') return null

  return (
    <button
      onClick={handleSend}
      disabled={isSending}
      className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transition-all disabled:opacity-50 w-full sm:w-auto justify-center"
    >
      {isSending ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Send className="w-5 h-5" />
      )}
      {isSending ? 'Sending...' : 'Send to Client'}
    </button>
  )
}