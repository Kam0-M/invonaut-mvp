'use client'

import { useCurrency } from '@/lib/context/currency-context'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2, RefreshCw, Trash2, AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import BankConnectButton from './bank-connect-button'

interface ConnectedAccount {
  id: string
  institution_name: string
  account_name: string
  account_subtype: string
  current_balance: number | null
  available_balance: number | null
  currency: string
  last_synced_at: string | null
  sync_status: string
}

interface Props {
  accounts: ConnectedAccount[]
  subscriptionTier: string
  transactionCount: number
}

const TIER_LIMITS: Record<string, number> = { starter: 1, professional: 3, business: 999 }

function fmt(n: number | null, currency = 'USD') {
  if (n === null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)
}

function timeAgo(iso: string | null) {
  if (!iso) return 'Never synced'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function ConnectedAccountsSection({
  const { format: fmt } = useCurrency() accounts: initialAccounts, subscriptionTier, transactionCount }: Props) {
  const router = useRouter()

  // Local state mirrors the accounts list so sync/disconnect update instantly
  const [accounts, setAccounts] = useState<ConnectedAccount[]>(initialAccounts)
  const [syncing,       setSyncing]       = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [syncError,     setSyncError]     = useState<string | null>(null)

  const limit        = TIER_LIMITS[subscriptionTier] ?? 1
  const limitReached = accounts.length >= limit

  const handleSync = async (accountId: string) => {
    setSyncing(accountId)
    setSyncError(null)
    try {
      const res  = await fetch('/api/plaid/sync', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ connected_account_id: accountId }),
      })
      if (res.ok) {
        // Update last_synced_at in local state immediately — no server round-trip needed
        setAccounts(prev => prev.map(acc =>
          acc.id === accountId
            ? { ...acc, last_synced_at: new Date().toISOString(), sync_status: 'active' }
            : acc
        ))
        // Also refresh in background so balance updates
        router.refresh()
      } else {
        setSyncError('Sync failed — try again')
        setAccounts(prev => prev.map(acc =>
          acc.id === accountId ? { ...acc, sync_status: 'error' } : acc
        ))
      }
    } catch {
      setSyncError('Sync failed — check your connection')
    } finally {
      setSyncing(null)
    }
  }

  const handleDisconnect = async (accountId: string) => {
    if (!window.confirm('Disconnect this account? Your transaction history will be deleted.')) return
    setDisconnecting(accountId)
    try {
      const res = await fetch('/api/plaid/disconnect', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ connected_account_id: accountId }),
      })
      if (res.ok) {
        // Remove from local state immediately — instant UI feedback
        setAccounts(prev => prev.filter(acc => acc.id !== accountId))
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        alert(`Disconnect failed: ${data.error ?? 'unknown error'}`)
      }
    } catch {
      alert('Disconnect failed — check your connection')
    } finally {
      setDisconnecting(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-gray-900">Connected Bank Accounts</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {accounts.length} of {limit === 999 ? 'unlimited' : limit} accounts connected
            {transactionCount > 0 && ` · ${transactionCount} transactions synced`}
          </p>
        </div>
        <BankConnectButton
          onSuccess={() => {
            router.refresh()
            // After new connection, refresh to show new account
            setTimeout(() => router.refresh(), 1500)
          }}
          limitReached={limitReached}
        />
      </div>

      {syncError && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {syncError}
        </div>
      )}

      {/* Account cards */}
      {accounts.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-8 text-center">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-sm font-black text-gray-900 mb-1">No bank accounts connected</p>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            Connect your bank to automatically sync transactions, track your real cash position, and reconcile payments.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map(acc => (
            <div key={acc.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-gray-900 truncate">{acc.institution_name}</p>
                    <p className="text-xs text-gray-400 capitalize">{acc.account_name} · {acc.account_subtype}</p>
                  </div>
                </div>

                {/* Balance */}
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-black text-gray-900">{fmt(acc.current_balance, acc.currency)}</p>
                  {acc.available_balance !== acc.current_balance && (
                    <p className="text-xs text-gray-400">{fmt(acc.available_balance, acc.currency)} available</p>
                  )}
                </div>
              </div>

              {/* Footer row */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-1.5">
                  {acc.sync_status === 'active'
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                    : <AlertCircle  className="w-3.5 h-3.5 text-red-500" />
                  }
                  <span className="text-xs text-gray-400">
                    {acc.sync_status === 'error' ? 'Sync error — ' : ''}Synced {timeAgo(acc.last_synced_at)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSync(acc.id)}
                    disabled={syncing === acc.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${syncing === acc.id ? 'animate-spin' : ''}`} />
                    {syncing === acc.id ? 'Syncing…' : 'Sync now'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDisconnect(acc.id)}
                    disabled={disconnecting === acc.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3" />
                    {disconnecting === acc.id ? 'Disconnecting…' : 'Disconnect'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
