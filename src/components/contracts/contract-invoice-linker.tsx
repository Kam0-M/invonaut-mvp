'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, X, Loader2, Link2 } from 'lucide-react'
import { toast } from 'sonner'

type Invoice = {
  id: string
  invoice_number: string
  total_amount: number
  status: string
}

type LinkedInvoice = {
  invoice_id: string
  link_type: string
  invoices: Invoice | null
}

interface ContractInvoiceLinkerProps {
  contractId: string
  linkedInvoices: LinkedInvoice[]
  availableInvoices: Invoice[]
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

const linkTypeLabels: Record<string, string> = {
  initial_payment: 'Initial payment',
  milestone: 'Milestone',
  retainer: 'Retainer',
  final: 'Final payment',
}

export default function ContractInvoiceLinker({
  contractId,
  linkedInvoices,
  availableInvoices,
}: ContractInvoiceLinkerProps) {
  const router = useRouter()
  const [showPicker, setShowPicker] = useState(false)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('')
  const [selectedLinkType, setSelectedLinkType] = useState('initial_payment')
  const [isLinking, setIsLinking] = useState(false)
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null)

  const linkedIds = new Set(linkedInvoices.map(l => l.invoice_id))
  const unlinkedInvoices = availableInvoices.filter(inv => !linkedIds.has(inv.id))

  const handleLink = async () => {
    if (!selectedInvoiceId) { toast.error('Select an invoice.'); return }
    setIsLinking(true)
    try {
      const res = await fetch('/api/contracts/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId, invoiceId: selectedInvoiceId, linkType: selectedLinkType }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) { toast.error(data.error || 'Could not link invoice.'); return }
      toast.success('Invoice linked.')
      setShowPicker(false)
      setSelectedInvoiceId('')
      router.refresh()
    } catch { toast.error('Could not link invoice.') }
    finally { setIsLinking(false) }
  }

  const handleUnlink = async (invoiceId: string) => {
    setUnlinkingId(invoiceId)
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
    <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider">
          Linked Invoices
        </h3>
        {unlinkedInvoices.length > 0 && (
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Link2 className="w-3.5 h-3.5" />
            Link invoice
          </button>
        )}
      </div>

      {/* Invoice picker */}
      {showPicker && (
        <div className="border-2 border-blue-100 rounded-xl p-4 bg-blue-50/30 space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Invoice</label>
            <select
              value={selectedInvoiceId}
              onChange={e => setSelectedInvoiceId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm text-gray-900 bg-white focus:border-blue-500 outline-none transition-all"
            >
              <option value="">Select an invoice...</option>
              {unlinkedInvoices.map(inv => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoice_number} · {formatCurrency(Number(inv.total_amount))} · {inv.status}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Link type</label>
            <select
              value={selectedLinkType}
              onChange={e => setSelectedLinkType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm text-gray-900 bg-white focus:border-blue-500 outline-none transition-all"
            >
              {Object.entries(linkTypeLabels).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleLink}
              disabled={isLinking || !selectedInvoiceId}
              className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {isLinking ? 'Linking...' : 'Link'}
            </button>
            <button
              onClick={() => { setShowPicker(false); setSelectedInvoiceId('') }}
              className="px-4 py-2 rounded-lg text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Linked invoices list */}
      {linkedInvoices.length === 0 && !showPicker ? (
        <p className="text-sm text-gray-400">No invoices linked yet.</p>
      ) : (
        <div className="space-y-2">
          {linkedInvoices.map((link) => {
            const inv = link.invoices
            if (!inv) return null
            return (
              <div key={link.invoice_id} className="flex items-center gap-2">
                <Link
                  href={`/dashboard/invoices/${inv.id}`}
                  className="flex-1 flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors group"
                >
                  <div>
                    <span className="font-mono text-sm font-bold text-gray-900 group-hover:text-blue-700">
                      {inv.invoice_number}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {linkTypeLabels[link.link_type] ?? link.link_type}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatCurrency(Number(inv.total_amount))}
                  </span>
                </Link>
                <button
                  onClick={() => handleUnlink(link.invoice_id)}
                  disabled={unlinkingId === link.invoice_id}
                  className="p-2 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
                  title="Remove link"
                >
                  {unlinkingId === link.invoice_id
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