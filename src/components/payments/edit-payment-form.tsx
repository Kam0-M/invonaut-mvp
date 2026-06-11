'use client'
// src/components/payments/edit-payment-form.tsx

import { useState, useRef } from 'react'
import { useRouter }         from 'next/navigation'
import { pushHrefThenRefreshServer } from '@/lib/router-refresh'
import { toast }             from 'sonner'
import { Loader2, Paperclip, X } from 'lucide-react'

type Category = { id: string; name: string; color: string }
type Client   = { id: string; name: string; company: string | null }

interface Props {
  payment:    any
  categories: Category[]
  clients:    Client[]
}

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
const ACCEPTED_EXT = '.pdf,.docx,.xlsx,.png,.jpg,.jpeg'

const PAYMENT_TYPES   = [
  { value: 'cash',   label: 'Cash'   },
  { value: 'prepay', label: 'Prepay' },
]
const PAYMENT_METHODS = [
  { value: 'cash',   label: 'Cash'          },
  { value: 'bank',   label: 'Bank Transfer' },
  { value: 'mobile', label: 'Mobile Money'  },
  { value: 'pos',    label: 'POS'           },
]

export default function EditPaymentForm({ payment, categories, clients }: Props) {
  const router      = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  const [amount,        setAmount]        = useState(String(payment.amount))
  const [paymentDate,   setPaymentDate]   = useState(payment.payment_date)
  const [paymentType,   setPaymentType]   = useState(payment.payment_type)
  const [paymentMethod, setPaymentMethod] = useState(payment.payment_method)
  const [categoryId,    setCategoryId]    = useState(payment.revenue_categories?.id || '')
  const [clientId,      setClientId]      = useState(payment.clients?.id || '')
  const [description,   setDescription]   = useState(payment.description)
  const [notes,         setNotes]         = useState(payment.notes || '')

  const [existingUrl,    setExistingUrl]    = useState<string | null>(payment.attachment_url || null)
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [removeExisting, setRemoveExisting] = useState(false)
  const [attachmentError,setAttachmentError]= useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_ATTACHMENT_BYTES) { setAttachmentError('File must be under 10MB.'); e.target.value = ''; return }
    setAttachmentError(null)
    setAttachmentFile(file)
    setRemoveExisting(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) { toast.error('Amount must be greater than 0'); return }
    if (!categoryId)  { toast.error('Revenue category is required'); return }
    if (!description.trim()) { toast.error('Description is required'); return }

    setLoading(true)
    const tid = toast.loading('Saving changes…')

    try {
      const fd = new FormData()
      fd.append('id',                 payment.id)
      fd.append('amount',             amount)
      fd.append('payment_type',       paymentType)
      fd.append('payment_method',     paymentMethod)
      fd.append('revenue_category_id',categoryId)
      fd.append('description',        description.trim())
      fd.append('notes',              notes.trim())
      fd.append('payment_date',       paymentDate)
      fd.append('client_id',          clientId || '')
      fd.append('remove_attachment',  removeExisting ? 'true' : 'false')
      if (attachmentFile) fd.append('attachment', attachmentFile)

      const res  = await fetch('/api/direct-payments/update', { method: 'PATCH', body: fd })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      toast.success('Payment updated', { id: tid })
      pushHrefThenRefreshServer(router, `/dashboard/payments/${payment.id}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update', { id: tid })
    } finally {
      setLoading(false)
    }
  }

  const toggleBtn = (active: boolean) =>
    `flex-1 py-2 rounded-xl text-sm font-bold transition-all border ${
      active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
    }`

  const attachmentDisplayName = existingUrl
    ? decodeURIComponent(existingUrl.split('/').pop() || '').replace(/^\d{13}-/, '')
    : null

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-10  space-y-6">
      <h2 className="text-xl font-black text-gray-900">Edit Payment</h2>

      {/* Amount + Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Amount *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
            <input type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
              disabled={loading} required
              className="w-full h-10 pl-7 pr-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Payment Date *</label>
          <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)}
            disabled={loading} required
            className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" />
        </div>
      </div>

      {/* Payment Type */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Payment Type</label>
        <div className="flex gap-3">
          {PAYMENT_TYPES.map(t => (
            <button key={t.value} type="button" onClick={() => setPaymentType(t.value)} disabled={loading}
              className={toggleBtn(paymentType === t.value)}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Payment Method */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Payment Method</label>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_METHODS.map(m => (
            <button key={m.value} type="button" onClick={() => setPaymentMethod(m.value)} disabled={loading}
              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                paymentMethod === m.value ? 'bg-[#0055FF] text-white border-[#0055FF]' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}>{m.label}</button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Revenue Category *</label>
        <div className="relative flex items-center">
          {categoryId && (
            <div className="absolute left-3 w-3 h-3 rounded-full pointer-events-none z-10"
              style={{ backgroundColor: categories.find(c => c.id === categoryId)?.color || '#6366F1' }} />
          )}
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)} disabled={loading} required
            className={`w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${categoryId ? 'pl-8 pr-3' : 'px-3'}`}>
            <option value="">Select a category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Description *</label>
        <input type="text" value={description} onChange={e => setDescription(e.target.value)}
          disabled={loading} required
          className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" />
      </div>

      {/* Client */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Client (Optional)</label>
        <select value={clientId} onChange={e => setClientId(e.target.value)} disabled={loading}
          className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white">
          <option value="">No client</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Notes (Optional)</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} disabled={loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-400 resize-none"
          placeholder="Any additional context…" />
      </div>

      {/* Attachment */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Attachment (Optional)</label>
        <div className="space-y-2">
          {existingUrl && !attachmentFile && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <Paperclip className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <a href={existingUrl} target="_blank" rel="noopener noreferrer"
                className="flex-1 text-sm font-medium text-blue-600 hover:underline truncate">
                {attachmentDisplayName}
              </a>
              <button type="button" onClick={() => { setRemoveExisting(true); setExistingUrl(null) }} disabled={loading}
                className="w-7 h-7 rounded flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {attachmentFile && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Paperclip className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{attachmentFile.name}</p>
                <p className="text-xs text-gray-500">{(attachmentFile.size / 1024).toFixed(0)} KB</p>
              </div>
              <button type="button" onClick={() => { setAttachmentFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }} disabled={loading}
                className="w-7 h-7 rounded flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {!attachmentFile && (
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50">
              <Paperclip className="w-4 h-4" />
              {existingUrl ? 'Replace attachment' : 'Add attachment'}
            </button>
          )}
          <input ref={fileInputRef} type="file" accept={ACCEPTED_EXT} onChange={handleFileSelect} className="hidden" />
          {attachmentError && <p className="text-xs font-bold text-red-600">{attachmentError}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <button type="button" onClick={() => router.push(`/dashboard/payments/${payment.id}`)} disabled={loading}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
