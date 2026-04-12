'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Paperclip, X } from 'lucide-react'

interface LineItem {
  id?: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

interface EditInvoiceFormProps {
  invoice: any
  invoiceItems: any[]
  clients: any[]
}

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
const ACCEPTED_ATTACHMENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/jpg',
]
const ACCEPTED_ATTACHMENT_EXT = '.pdf,.docx,.xlsx,.png,.jpg,.jpeg'

// Extract a clean display name from a Supabase Storage URL.
// Paths are stored as {userId}/{timestamp}-{originalname}, so we strip the timestamp prefix.
function extractAttachmentName(url: string): string {
  const lastSegment = decodeURIComponent(url.split('/').pop() || '')
  // Remove leading {timestamp}- prefix (13-digit epoch)
  return lastSegment.replace(/^\d{13}-/, '') || lastSegment
}

export default function EditInvoiceForm({
  invoice,
  invoiceItems,
  clients,
}: EditInvoiceFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [clientId,  setClientId]  = useState(invoice.client_id)
  const [issueDate, setIssueDate] = useState(invoice.issue_date)
  const [dueDate,   setDueDate]   = useState(invoice.due_date)
  const [notes,     setNotes]     = useState(invoice.notes || '')
  const [taxRate,   setTaxRate]   = useState(
    invoice.tax_amount && invoice.subtotal
      ? ((invoice.tax_amount / invoice.subtotal) * 100).toFixed(2)
      : '0'
  )

  // Attachment state
  // existingUrl = what's already in the DB (may be null)
  // attachmentFile = a new file the user has chosen (replaces existing on save)
  // removeExisting = user clicked × on the existing attachment
  const [existingUrl,     setExistingUrl]     = useState<string | null>(invoice.attachment_url || null)
  const [attachmentFile,  setAttachmentFile]  = useState<File | null>(null)
  const [removeExisting,  setRemoveExisting]  = useState(false)
  const [attachmentError, setAttachmentError] = useState<string | null>(null)

  const [lineItems, setLineItems] = useState<LineItem[]>(
    invoiceItems.length > 0
      ? invoiceItems.map((item) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
        }))
      : [{ description: '', quantity: 1, unit_price: 0, total: 0 }]
  )

  const subtotal    = lineItems.reduce((sum, item) => sum + item.total, 0)
  const taxAmount   = subtotal * (parseFloat(taxRate) / 100)
  const totalAmount = subtotal + taxAmount

  // ── Line item helpers ─────────────────────────────────────────────────────

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0, total: 0 }])
  }

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems]
    updated[index] = { ...updated[index], [field]: value }
    if (field === 'quantity' || field === 'unit_price') {
      updated[index].total = updated[index].quantity * updated[index].unit_price
    }
    setLineItems(updated)
  }

  // ── Attachment helpers ────────────────────────────────────────────────────

  const handleAttachmentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ACCEPTED_ATTACHMENT_TYPES.includes(file.type)) {
      setAttachmentError('Only PDF, DOCX, XLSX, PNG, and JPG files are accepted.')
      e.target.value = ''
      return
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setAttachmentError('File must be under 10MB.')
      e.target.value = ''
      return
    }

    setAttachmentError(null)
    setAttachmentFile(file)
    setRemoveExisting(false) // new file supersedes "remove existing" action
  }

  const handleRemoveNewFile = () => {
    setAttachmentFile(null)
    setAttachmentError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemoveExisting = () => {
    setRemoveExisting(true)
    setExistingUrl(null)
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (lineItems.some(item => item.description.trim() === '')) {
      toast.error('All line items must have a description')
      return
    }

    setIsLoading(true)
    const loadingToast = toast.loading('Saving changes...')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // ── Resolve final attachment_url ───────────────────────────────────
      let finalAttachmentUrl: string | null = existingUrl

      if (attachmentFile) {
        // Upload new file
        const safeName = attachmentFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const filePath = `${user.id}/${Date.now()}-${safeName}`

        const { error: uploadError } = await supabase.storage
          .from('invoice-attachments')
          .upload(filePath, attachmentFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: attachmentFile.type,
          })

        if (uploadError) throw new Error(`Attachment upload failed: ${uploadError.message}`)

        const { data: urlData } = supabase.storage
          .from('invoice-attachments')
          .getPublicUrl(filePath)

        finalAttachmentUrl = urlData.publicUrl
      } else if (removeExisting) {
        finalAttachmentUrl = null
      }

      // ── Update invoice ────────────────────────────────────────────────
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          client_id:      clientId,
          issue_date:     issueDate,
          due_date:       dueDate,
          subtotal,
          tax_amount:     taxAmount,
          total_amount:   totalAmount,
          notes,
          attachment_url: finalAttachmentUrl,
        })
        .eq('id', invoice.id)

      if (invoiceError) throw invoiceError

      // Replace line items
      const { error: deleteError } = await supabase.from('invoice_items').delete().eq('invoice_id', invoice.id)
      if (deleteError) throw deleteError

      const { error: itemsError } = await supabase.from('invoice_items').insert(
        lineItems.map((item) => ({
          invoice_id:  invoice.id,
          description: item.description,
          quantity:    item.quantity,
          unit_price:  item.unit_price,
          total:       item.total,
        }))
      )
      if (itemsError) throw itemsError

      toast.success('Invoice updated successfully!', { id: loadingToast })
      setTimeout(() => { router.push(`/dashboard/invoices/${invoice.id}`); router.refresh() }, 500)
    } catch (error: any) {
      console.error('Error updating invoice:', error)
      toast.error(error.message || 'Failed to update invoice. Please try again.', { id: loadingToast })
      setIsLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">

      {/* Client — locked */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
        <select value={clientId} onChange={(e) => setClientId(e.target.value)} disabled={true} required
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed">
          <option value="">Select a client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>{client.name} {client.company && `(${client.company})`}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">🔒 Client cannot be changed after invoice creation</p>
      </div>

      {/* Invoice number — locked */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
        <input type="text" value={invoice.invoice_number} disabled
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed" />
        <p className="text-xs text-gray-500 mt-1">Invoice number cannot be changed</p>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date *</label>
          <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" />
        </div>
      </div>

      {/* Line Items */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Line Items *</label>
        <div className="space-y-2">
          {lineItems.map((item, index) => (
            <div key={index} className="flex gap-2 items-start">
              <input type="text" placeholder="Description" value={item.description}
                onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                required disabled={isLoading}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-400" />
              <input type="number" placeholder="Qty" value={item.quantity}
                onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                min="0" step="0.01" required disabled={isLoading}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-400" />
              <input type="number" placeholder="Price" value={item.unit_price}
                onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                min="0" step="0.01" required disabled={isLoading}
                className="w-28 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-400" />
              <div className="w-28 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-right text-gray-900 font-medium">
                ${item.total.toFixed(2)}
              </div>
              <button type="button" onClick={() => removeLineItem(index)} disabled={lineItems.length === 1 || isLoading}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50 transition-colors">
                ✕
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addLineItem} disabled={isLoading}
          className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors disabled:opacity-50">
          + Add Line Item
        </button>
      </div>

      {/* Tax Rate */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
        <input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)}
          min="0" max="100" step="0.01" disabled={isLoading}
          className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" />
      </div>

      {/* Totals */}
      <div className="bg-gray-50 p-4 rounded-md space-y-2 border border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax ({taxRate}%):</span>
          <span className="font-medium text-gray-900">${taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
          <span className="text-gray-900">Total:</span>
          <span className="text-blue-600">${totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} disabled={isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-400"
          placeholder="Additional notes or payment instructions..." />
      </div>

      {/* ── Attachment ──────────────────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Attachment <span className="text-xs text-gray-400">(Optional — sent alongside invoice PDF)</span>
        </label>

        <div className="space-y-3">
          {/* Existing attachment from DB */}
          {existingUrl && !attachmentFile && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <Paperclip className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <a href={existingUrl} target="_blank" rel="noopener noreferrer"
                className="flex-1 text-sm font-medium text-blue-600 hover:underline truncate">
                {extractAttachmentName(existingUrl)}
              </a>
              <button type="button" onClick={handleRemoveExisting} disabled={isLoading}
                className="w-7 h-7 rounded flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors flex-shrink-0"
                title="Remove attachment">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* New file chosen */}
          {attachmentFile && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Paperclip className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{attachmentFile.name}</p>
                <p className="text-xs text-gray-500">{(attachmentFile.size / 1024).toFixed(0)} KB · will replace existing attachment</p>
              </div>
              <button type="button" onClick={handleRemoveNewFile} disabled={isLoading}
                className="w-7 h-7 rounded flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors flex-shrink-0"
                title="Discard new file">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Upload button */}
          {!attachmentFile && (
            <button type="button" onClick={() => !isLoading && fileInputRef.current?.click()} disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50">
              <Paperclip className="w-4 h-4" />
              {existingUrl ? 'Replace attachment' : 'Add attachment'}
            </button>
          )}
        </div>

        <input ref={fileInputRef} type="file" accept={ACCEPTED_ATTACHMENT_EXT} onChange={handleAttachmentSelect} className="hidden" />

        {attachmentError && (
          <p className="mt-2 text-xs font-bold text-red-600">{attachmentError}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <button type="button" onClick={() => router.back()} disabled={isLoading}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2">
          {isLoading ? (<><Loader2 className="w-4 h-4 animate-spin" />Saving...</>) : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}