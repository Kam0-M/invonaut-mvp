'use client'

import { useState, useCallback } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import { Building2, Loader2 } from 'lucide-react'

interface BankConnectButtonProps {
  onSuccess: () => void
  disabled?: boolean
  limitReached?: boolean
}

export default function BankConnectButton({ onSuccess, disabled, limitReached }: BankConnectButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const fetchLinkToken = async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/plaid/create-link-token', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setLoading(false); return }
      setLinkToken(data.link_token)
    } catch {
      setError('Failed to initialise bank connection.')
      setLoading(false)
    }
  }

  const onPlaidSuccess = useCallback(async (public_token: string, metadata: any) => {
    setLoading(true)
    try {
      const res = await fetch('/api/plaid/exchange-token', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ public_token, metadata }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      onSuccess()
    } catch {
      setError('Failed to connect account. Please try again.')
    } finally {
      setLoading(false)
      setLinkToken(null)
    }
  }, [onSuccess])

  const { open, ready } = usePlaidLink({
    token:     linkToken ?? '',
    onSuccess: onPlaidSuccess,
    onExit:    () => { setLinkToken(null); setLoading(false) },
  })

  // Once we have a link token and Plaid is ready, open automatically
  if (linkToken && ready) {
    open()
  }

  if (limitReached) {
    return (
      <div className="text-xs text-gray-400 font-medium px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
        Account limit reached — upgrade to connect more
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={fetchLinkToken}
        disabled={disabled || loading}
        className="inline-flex items-center gap-2 btn-primary px-5 py-2.5 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
          : <><Building2 className="w-4 h-4" /> Connect a bank account</>
        }
      </button>
      {error && <p className="text-xs text-red-500 mt-2 font-medium">{error}</p>}
    </div>
  )
}
