'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, X, Loader2, Link2 } from 'lucide-react'
import { toast } from 'sonner'

type Contract = {
  id: string
  title: string
  status: string
  template_type: string | null
}

type LinkedContract = {
  contract_id: string
  link_type: string
  contract: Contract | null
}

interface InvoiceContractLinkerProps {
  invoiceId: string
  clientId: string
  linkedContracts: LinkedContract[]
  availableContracts: Contract[]
}

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  awaiting_signature: 'Awaiting signature',
  active: 'Active',
  expired: 'Expired',
  cancelled: 'Cancelled',
}

export default function InvoiceContractLinker({
  invoiceId,
  linkedContracts,
  availableContracts,
}: InvoiceContractLinkerProps) {
  const router = useRouter()
  const [showPicker, setShowPicker] = useState(false)
  const [selectedContractId, setSelectedContractId] = useState('')
  const [isLinking, setIsLinking] = useState(false)
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null)

  const linkedIds = new Set(linkedContracts.map(l => l.contract_id))
  const unlinkedContracts = availableContracts.filter(c => !linkedIds.has(c.id))

  const handleLink = async () => {
    if (!selectedContractId) { toast.error('Select a contract.'); return }
    setIsLinking(true)
    try {
      const res = await fetch('/api/contracts/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: selectedContractId,
          invoiceId,
          linkType: 'initial_payment',
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) { toast.error(data.error || 'Could not link contract.'); return }
      toast.success('Contract linked.')
      setShowPicker(false)
      setSelectedContractId('')
      router.refresh()
    } catch { toast.error('Could not link contract.') }
    finally { setIsLinking(false) }
  }

  const handleUnlink = async (contractId: string) => {
    setUnlinkingId(contractId)
    try {
      const res = await fetch('/api/contracts/link', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId, invoiceId }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) { toast.error(data.error || 'Could not remove link.'); return }
      toast.success('Link removed.')
      router.refresh()
    } catch { toast.error('Could not remove link.') }
    finally { setUnlinkingId(null) }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider">
          Linked Contracts
        </h3>
        {unlinkedContracts.length > 0 && (
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Link2 className="w-3.5 h-3.5" />
            Link contract
          </button>
        )}
      </div>

      {/* Contract picker */}
      {showPicker && (
        <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/30 space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Contract</label>
            <select
              value={selectedContractId}
              onChange={e => setSelectedContractId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 bg-white focus:border-blue-500 outline-none transition-all"
            >
              <option value="">Select a contract...</option>
              {unlinkedContracts.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title} · {statusLabels[c.status] ?? c.status}
                  {c.template_type ? ` · ${c.template_type.replace(/_/g, ' ')}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleLink}
              disabled={isLinking || !selectedContractId}
              className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {isLinking ? 'Linking...' : 'Link'}
            </button>
            <button
              onClick={() => { setShowPicker(false); setSelectedContractId('') }}
              className="px-4 py-2 rounded-lg text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Linked contracts list */}
      {linkedContracts.length === 0 && !showPicker ? (
        <p className="text-sm text-gray-400">No contracts linked yet.</p>
      ) : (
        <div className="space-y-2">
          {linkedContracts.map((link) => {
            const c = link.contract
            if (!c) return null
            return (
              <div key={link.contract_id} className="flex items-center gap-2">
                <Link
                  href={`/dashboard/contracts/${c.id}`}
                  className="flex-1 flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors group"
                >
                  <span className="font-bold text-sm text-gray-900 group-hover:text-blue-700 truncate">
                    {c.title}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-2 capitalize">
                    {statusLabels[c.status] ?? c.status.replace(/_/g, ' ')}
                  </span>
                </Link>
                <button
                  onClick={() => handleUnlink(link.contract_id)}
                  disabled={unlinkingId === link.contract_id}
                  className="p-2 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
                  title="Remove link"
                >
                  {unlinkingId === link.contract_id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <X className="w-4 h-4" />
                  }
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}