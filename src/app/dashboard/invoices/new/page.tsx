'use client'

import { useCurrency } from '@/lib/context/currency-context'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { pushHrefThenRefreshServer } from '@/lib/router-refresh'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, X, Loader2, Search, Check, ArrowLeft, Save, Clock, Paperclip, FileText, Zap } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import SubscriptionRequired from '@/components/subscription-required'
import UnbilledEntriesPicker, { type PickedLineItem } from '@/components/time/unbilled-entries-picker'

type Client = {
  id: string
  name: string
  company: string | null
}

type LineItem = {
  id: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

// Max attachment size: 10MB
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

export default function NewInvoicePage() {
  const { format: fmt } = useCurrency()
  const router = useRouter()
  const searchParams = useSearchParams()
  const preSelectedClientId = searchParams.get('clientId')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [invoiceLimitReached, setInvoiceLimitReached] = useState(false)
  const [monthlyInvoiceCount, setMonthlyInvoiceCount] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [invoiceNumber, setInvoiceNumber] = useState('INV-00001')
  const [clientSearchQuery, setClientSearchQuery] = useState('')
  const [clientId, setClientId] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unit_price: 0, total: 0 }
  ])
  const [notes, setNotes] = useState('')
  const [taxRate, setTaxRate] = useState(0)
  const [categoryId, setCategoryId] = useState<string>('')
  const [categories, setCategories] = useState<{ id: string; name: string; color: string }[]>([])

  // File attachment
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [attachmentError, setAttachmentError] = useState<string | null>(null)

  // Time tracking integration
  const [showTimePicker,  setShowTimePicker]  = useState(false)
  const [timeEntryIds,    setTimeEntryIds]    = useState<string[]>([])

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)
  const taxAmount = (subtotal * taxRate) / 100
  const totalAmount = subtotal + taxAmount

  const filteredClients = useMemo(() => {
    if (!clientSearchQuery.trim()) return clients
    const query = clientSearchQuery.toLowerCase()
    return clients.filter(client =>
      client.name.toLowerCase().includes(query) ||
      (client.company && client.company.toLowerCase().includes(query))
    )
  }, [clients, clientSearchQuery])

  const selectedClient = clients.find(c => c.id === clientId)
  const shouldShowDropdown = clientSearchQuery.trim().length > 0 && filteredClients.length > 0

  const fmt = (amount: number): string => {
    return fmt(amount)
  }

  useEffect(() => {
    const checkSubscriptionAndFetchData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('stripe_subscription_id, subscription_status, subscription_tier')
          .eq('id', user.id)
          .single()

        const isSubscribed = !!profile?.stripe_subscription_id &&
          (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')

        setHasActiveSubscription(isSubscribed)

        // Enforce 25 invoice/month limit for Starter tier
        const tier = profile?.subscription_tier ?? 'starter'
        if (isSubscribed && tier === 'starter') {
          const startOfMonth = new Date()
          startOfMonth.setDate(1)
          startOfMonth.setHours(0, 0, 0, 0)
          const { count } = await supabase
            .from('invoices')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', startOfMonth.toISOString())
          const monthCount = count ?? 0
          setMonthlyInvoiceCount(monthCount)
          if (monthCount >= 25) setInvoiceLimitReached(true)
        }

        const { data, error } = await supabase
          .from('clients')
          .select('id, name, company')
          .eq('user_id', user.id)
          .order('name', { ascending: true })

        if (error) throw error
        setClients(data || [])

        // Fetch revenue categories
        const { data: catData } = await supabase
          .from('revenue_categories')
          .select('id, name, color')
          .eq('user_id', user.id)
          .order('name', { ascending: true })
        setCategories(catData || [])

        if (preSelectedClientId) {
          setClientId(preSelectedClientId)
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        toast.error('Failed to load data. Please refresh the page.')
      } finally {
        setIsLoading(false)
      }
    }

    checkSubscriptionAndFetchData()
  }, [router, preSelectedClientId])

  useEffect(() => {
    const generateInvoiceNumber = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('invoices')
          .select('invoice_number')
          .eq('user_id', user.id)
          .order('invoice_number', { ascending: false })
          .limit(1)

        if (error && error.code !== 'PGRST116') throw error

        if (data && data.length > 0) {
          const lastNumber = data[0].invoice_number
          const match = lastNumber.match(/INV-(\d+)/)
          if (match) {
            const nextNum = parseInt(match[1], 10) + 1
            setInvoiceNumber(`INV-${nextNum.toString().padStart(5, '0')}`)
          }
        }
      } catch (err) {
        console.error('Error generating invoice number:', err)
      }
    }

    generateInvoiceNumber()
  }, [])

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setIssueDate(today)
    const dueDateObj = new Date()
    dueDateObj.setDate(dueDateObj.getDate() + 30)
    setDueDate(dueDateObj.toISOString().split('T')[0])
  }, [])

  // ── Attachment handlers ────────────────────────────────────────────────────

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
  }

  const removeAttachment = () => {
    setAttachmentFile(null)
    setAttachmentError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Line item handlers ────────────────────────────────────────────────────

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        if (field === 'quantity' || field === 'unit_price') {
          updated.total = updated.quantity * updated.unit_price
        }
        return updated
      }
      return item
    }))
  }

  const addLineItem = () => {
    const newId = Date.now().toString()
    setLineItems(prev => [...prev, {
      id: newId, description: '', quantity: 1, unit_price: 0, total: 0
    }])
  }

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(prev => prev.filter(item => item.id !== id))
    }
  }

  const handleSelectClient = (client: Client) => {
    setClientId(client.id)
    setClientSearchQuery('')
  }

  const handleAddTimeEntries = (newItems: PickedLineItem[], entryIds: string[]) => {
    setLineItems(prev => {
      const hasOnlyBlank = prev.length === 1 && prev[0].description.trim() === '' && prev[0].total === 0
      const base = hasOnlyBlank ? [] : prev
      return [...base, ...newItems]
    })
    setTimeEntryIds(prev => [...new Set([...prev, ...entryIds])])
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSaveDraft = async () => {
    if (!clientId) { toast.error('Please select a client'); return }

    const validItems = lineItems.filter(item => item.description.trim() !== '')
    if (validItems.length === 0) { toast.error('Please add at least one line item with a description'); return }
    if (lineItems.some(item => item.description.trim() === '')) { toast.error('All line items must have a description'); return }
    if (validItems.some(item => item.quantity < 1)) { toast.error('All line items must have a quantity of at least 1'); return }
    if (validItems.some(item => item.unit_price < 0)) { toast.error('Unit prices cannot be negative'); return }
    if (validItems.some(item => item.unit_price > 99999999.99)) {
      toast.error('Unit prices cannot exceed $99,999,999.99.')
      return
    }
    if (totalAmount === 0) {
      if (!window.confirm('This invoice has a total of $0.00. Do you want to continue?')) return
    }

    setIsSaving(true)
    const loadingToast = toast.loading('Saving invoice...')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // ── Upload attachment if one was selected ──────────────────────────
      let attachmentUrl: string | null = null
      if (attachmentFile) {
        const ext = attachmentFile.name.split('.').pop()
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

        attachmentUrl = urlData.publicUrl
      }

      // ── Insert invoice ─────────────────────────────────────────────────
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id:        user.id,
          client_id:      clientId,
          invoice_number: invoiceNumber,
          status:         'draft',
          issue_date:     issueDate,
          due_date:       dueDate,
          subtotal:       subtotal,
          tax_amount:     taxAmount,
          total_amount:   totalAmount,
          notes:          notes || null,
          attachment_url: attachmentUrl,
          revenue_category_id: categoryId || null,
        })
        .select()
        .single()

      if (invoiceError) throw invoiceError
      if (!invoice) throw new Error('Failed to create invoice')

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(validItems.map(item => ({
          invoice_id:  invoice.id,
          description: item.description,
          quantity:    item.quantity,
          unit_price:  item.unit_price,
          total:       item.total,
        })))

      if (itemsError) throw itemsError

      // Mark time entries as billed (non-fatal)
      if (timeEntryIds.length > 0) {
        try {
          await fetch('/api/time/update', {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ action: 'mark_billed', entryIds: timeEntryIds, invoiceId: invoice.id }),
          })
        } catch {
          console.error('Could not mark time entries as billed.')
        }
      }

      toast.success('Invoice created successfully!', { id: loadingToast, duration: 3000 })
      pushHrefThenRefreshServer(router, '/dashboard/invoices')
    } catch (err: any) {
      let errorMessage = 'Failed to save invoice. Please try again.'
      if (err?.code === '23505' || err?.message?.includes('duplicate key')) {
        errorMessage = 'This invoice number already exists. Please refresh the page to generate a new number.'
      } else if (err?.message && err.message.length < 150) {
        errorMessage = err.message
      }
      toast.error(errorMessage, { id: loadingToast, duration: 5000 })
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!hasActiveSubscription) return <SubscriptionRequired />

  if (invoiceLimitReached) return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/invoices" className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors mb-2 block">← Invoices</Link>
        <h1 className="text-2xl font-black text-gray-900">Create Invoice</h1>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
        <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileText className="w-6 h-6 text-orange-500" />
        </div>
        <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">Starter Plan · {monthlyInvoiceCount}/25 used</p>
        <h3 className="text-xl font-black text-gray-900 mb-2">Monthly invoice limit reached</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
          You&apos;ve created 25 invoices this month. Upgrade to Professional for unlimited invoices, advanced AI insights, and the full cash flow suite.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/dashboard/invoices" className="text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors">View Invoices</Link>
          <Link href="/dashboard/billing" className="btn-primary px-5 py-2.5 rounded-xl text-sm inline-flex items-center gap-2">
            <Zap className="w-4 h-4" />Upgrade to Professional
          </Link>
        </div>
      </div>
    </div>
  )

  const isClientLocked = !!preSelectedClientId

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <Link href="/dashboard/invoices" className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors mb-2 block">
          ← Invoices
        </Link>
        <h1 className="text-2xl font-black text-gray-900">Create Invoice</h1>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); handleSaveDraft() }}>

          {/* Client Selection */}
          <div className="relative">
            <label htmlFor="client-search" className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-3">
              Client <span className="text-red-500">*</span>
              {isClientLocked && <span className="ml-2 text-xs text-blue-600">(Pre-selected)</span>}
            </label>

            {!isClientLocked ? (
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="client-search"
                    type="text"
                    placeholder={selectedClient
                      ? `${selectedClient.name}${selectedClient.company ? ` (${selectedClient.company})` : ''}`
                      : "Start typing to search clients..."}
                    value={clientSearchQuery}
                    onChange={(e) => setClientSearchQuery(e.target.value)}
                    className={`h-12 pl-10 pr-10 text-base border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl ${selectedClient && !clientSearchQuery ? 'font-medium text-green-700' : ''}`}
                    disabled={isSaving}
                    autoComplete="off"
                  />
                  {selectedClient && !clientSearchQuery && (
                    <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-600" />
                  )}
                  {clientSearchQuery && (
                    <button type="button" onClick={() => setClientSearchQuery('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {shouldShowDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-md max-h-64 overflow-y-auto">
                    {filteredClients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleSelectClient(client)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center justify-between group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 line-clamp-2 break-words">{client.name}</p>
                          {client.company && <p className="text-xs text-gray-500 line-clamp-2 break-words mt-0.5">{client.company}</p>}
                        </div>
                        {clientId === client.id && <Check className="w-4 h-4 text-green-600 flex-shrink-0 ml-2" />}
                      </button>
                    ))}
                  </div>
                )}

                {clientSearchQuery && filteredClients.length === 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-md p-4 text-center">
                    <p className="text-sm text-gray-500 mb-2">No clients found matching &quot;{clientSearchQuery}&quot;</p>
                    <Link href="/dashboard/clients/new" className="text-sm text-blue-600 hover:underline font-bold">Add a new client</Link>
                  </div>
                )}

                {selectedClient && !clientSearchQuery ? (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1 font-medium"><Check className="w-3 h-3" />Client selected: {selectedClient.name}</p>
                ) : !clientSearchQuery && clients.length > 0 ? (
                  <p className="text-xs text-gray-500 mt-2 font-medium">Start typing to search through {clients.length} client{clients.length !== 1 ? 's' : ''}</p>
                ) : clients.length === 0 ? (
                  <p className="text-xs text-gray-500 mt-2 font-medium">No clients yet. <Link href="/dashboard/clients/new" className="text-blue-600 underline font-bold">Add your first client</Link></p>
                ) : null}

                <select value={clientId} onChange={() => {}} required className="sr-only" tabIndex={-1} aria-hidden="true">
                  <option value="">Select a client</option>
                  {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <Input
                  value={selectedClient ? `${selectedClient.name}${selectedClient.company ? ` (${selectedClient.company})` : ''}` : ''}
                  disabled={true}
                  className="h-12 text-base bg-gray-100 text-gray-500 cursor-not-allowed border"
                />
                <p className="text-xs text-gray-500 mt-2 font-medium">🔒 Client cannot be changed (pre-selected from client page)</p>
              </div>
            )}
          </div>

          {/* Invoice Number */}
          <div>
            <label htmlFor="invoiceNumber" className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-3">Invoice Number</label>
            <Input id="invoiceNumber" type="text" value={invoiceNumber} readOnly className="h-12 text-base bg-gray-50 border border-gray-200" />
          </div>

          {/* Add from Time Entries */}
          {clientId && (
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-50 rounded-xl border border-blue-100">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-gray-900 text-sm">Add from Time Entries</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Pull in unbilled hours for this client as invoice line items</p>
                {timeEntryIds.length > 0 && (
                  <p className="text-xs font-bold text-blue-600 mt-1">✓ {timeEntryIds.length} time {timeEntryIds.length === 1 ? 'entry' : 'entries'} added</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowTimePicker(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 hover:shadow-sm transition-all flex-shrink-0"
              >
                <Clock className="w-4 h-4" />
                {timeEntryIds.length > 0 ? 'Add more' : 'Add hours'}
              </button>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="issueDate" className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-3">Issue Date <span className="text-red-500">*</span></label>
              <Input
                id="issueDate" type="date" value={issueDate}
                onChange={(e) => {
                  const nextValue = e.target.value
                  setIssueDate(nextValue)
                  if (nextValue) {
                    const newIssueDate = new Date(nextValue)
                    if (!Number.isNaN(newIssueDate.getTime())) {
                      const newDueDate = new Date(newIssueDate)
                      newDueDate.setDate(newDueDate.getDate() + 30)
                      setDueDate(newDueDate.toISOString().split('T')[0])
                    }
                  }
                }}
                disabled={isSaving} required
                className="h-12 text-base border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
              />
            </div>
            <div>
              <label htmlFor="dueDate" className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-3">Due Date <span className="text-red-500">*</span></label>
              <Input
                id="dueDate" type="date" value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isSaving} required
                className="h-12 text-base border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <label className="block text-sm font-bold uppercase tracking-wide text-gray-700">Line Items <span className="text-red-500">*</span></label>
              <button type="button" onClick={addLineItem} disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all duration-200 font-bold text-gray-700 disabled:opacity-50">
                <Plus className="w-4 h-4" />Add Item
              </button>
            </div>
            <div className="space-y-4">
              {lineItems.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                  <div className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-12 md:col-span-5">
                      <label className="block text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">Description <span className="text-red-500">*</span></label>
                      <Input type="text" value={item.description} onChange={(e) => updateLineItem(item.id, 'description', e.target.value)} placeholder="Enter item description" disabled={isSaving} required className="h-10 text-sm border border-gray-200" />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">Quantity <span className="text-red-500">*</span></label>
                      <Input type="number" min="0" step="0.01" value={item.quantity} onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} disabled={isSaving} required className="h-10 text-sm border border-gray-200" />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">Unit Price <span className="text-red-500">*</span></label>
                      <Input type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)} disabled={isSaving} required className="h-10 text-sm border border-gray-200" />
                    </div>
                    <div className="col-span-3 md:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">Total</label>
                      <Input type="text" value={fmt(item.total)} readOnly className="h-10 text-sm bg-gray-100 font-bold border border-gray-200" />
                    </div>
                    <div className="col-span-1">
                      {lineItems.length > 1 && (
                        <button type="button" onClick={() => removeLineItem(item.id)} disabled={isSaving}
                          className="h-10 w-10 rounded-lg flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-3">Notes (Optional)</label>
            <textarea
              id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} disabled={isSaving}
              className="w-full text-base text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl resize-none p-3 focus:outline-none bg-white"
              placeholder="Additional notes or terms..."
            />
          </div>

          {/* Tax Rate */}
          <div>
            <label htmlFor="taxRate" className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-3">Tax Rate (%)</label>
            <Input id="taxRate" type="number" min="0" max="100" step="0.01" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} placeholder="0" disabled={isSaving}
              className="h-12 text-base border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl" />
          </div>

          {/* Revenue Category */}
          <div>
            <label htmlFor="revenueCategory" className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-3">
              Revenue Category <span className="text-xs font-medium text-gray-400 normal-case">(Optional — tag this invoice by income source)</span>
            </label>
            {categories.length === 0 ? (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-sm text-gray-500 font-medium flex-1">No categories yet.</p>
                <a href="/dashboard/settings" target="_blank" rel="noopener noreferrer"
                  className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline flex-shrink-0">
                  Create one in Settings →
                </a>
              </div>
            ) : (
              <div className="relative">
                {/* Color swatch preview for selected category */}
                {categoryId && (
                  <div
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full pointer-events-none z-10"
                    style={{ backgroundColor: categories.find(c => c.id === categoryId)?.color || '#6366F1' }}
                  />
                )}
                <select
                  id="revenueCategory"
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  disabled={isSaving}
                  className={`w-full h-12 text-base border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl bg-white text-gray-900 focus:outline-none appearance-none pr-4 ${categoryId ? 'pl-8' : 'pl-4'}`}
                >
                  <option value="">No category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* ── Attachment ──────────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-3">
              Attachment <span className="text-xs font-medium text-gray-400 normal-case">(Optional — sent alongside invoice PDF)</span>
            </label>

            {attachmentFile ? (
              /* File selected — show preview row */
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Paperclip className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{attachmentFile.name}</p>
                  <p className="text-xs text-gray-500 font-medium">{(attachmentFile.size / 1024).toFixed(0)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={removeAttachment}
                  disabled={isSaving}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors flex-shrink-0 disabled:opacity-50"
                  title="Remove attachment"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* No file — show upload zone */
              <div
                onClick={() => !isSaving && fileInputRef.current?.click()}
                className={`flex items-center gap-4 p-5 rounded-xl border border-dashed transition-all cursor-pointer ${
                  isSaving ? 'opacity-50 cursor-not-allowed' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Paperclip className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700">Attach a file</p>
                  <p className="text-xs text-gray-400 font-medium">PDF, DOCX, XLSX, PNG, JPG — max 10MB</p>
                </div>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_ATTACHMENT_EXT}
              onChange={handleAttachmentSelect}
              className="hidden"
            />

            {attachmentError && (
              <p className="mt-2 text-xs font-bold text-red-600">{attachmentError}</p>
            )}
          </div>

          {/* Totals Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-100 p-8">
            <div className="space-y-4">
              <div className="flex justify-between text-base">
                <span className="font-bold text-gray-700">Subtotal:</span>
                <span className="font-bold text-gray-900">{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="font-bold text-gray-700">Tax ({taxRate}%):</span>
                <span className="font-bold text-gray-900">{fmt(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-xl pt-4 border-t border-blue-200">
                <span className="font-black text-gray-900 tracking-tight">Total:</span>
                <span className="font-black text-blue-600 tracking-tight">{fmt(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100">
            <Link href="/dashboard/invoices"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm transition-all duration-200">
              Cancel
            </Link>
            <button type="submit" disabled={isSaving}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
              {isSaving ? (<><Loader2 className="w-5 h-5 animate-spin" />Saving...</>) : (<><Save className="w-5 h-5" />Save as Draft</>)}
            </button>
          </div>
        </form>
      </div>

      {showTimePicker && clientId && (
        <UnbilledEntriesPicker clientId={clientId} onAdd={handleAddTimeEntries} onClose={() => setShowTimePicker(false)} />
      )}
    </div>
  )
}