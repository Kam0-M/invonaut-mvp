'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, X, Loader2, Search, Check, ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import SubscriptionRequired from '@/components/subscription-required'

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

export default function NewInvoicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preSelectedClientId = searchParams.get('clientId')
  
  const [isLoading, setIsLoading] = useState(true)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
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

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
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

        // Check subscription status
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('stripe_subscription_id, subscription_status')
          .eq('id', user.id)
          .single()

        const isSubscribed = !!profile?.stripe_subscription_id && 
          (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')
        
        setHasActiveSubscription(isSubscribed)

        // Fetch clients
        const { data, error } = await supabase
          .from('clients')
          .select('id, name, company')
          .eq('user_id', user.id)
          .order('name', { ascending: true })

        if (error) throw error
        setClients(data || [])
        
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
          .order('created_at', { ascending: false })
          .limit(1)

        if (error && error.code !== 'PGRST116') throw error

        if (data && data.length > 0) {
          const lastNumber = data[0].invoice_number
          const match = lastNumber.match(/INV-(\\d+)/)
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
      id: newId,
      description: '',
      quantity: 1,
      unit_price: 0,
      total: 0
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

  const handleSaveDraft = async () => {
    if (!clientId) {
      toast.error('Please select a client')
      return
    }

    const validItems = lineItems.filter(item => item.description.trim() !== '')
    if (validItems.length === 0) {
      toast.error('Please add at least one line item with a description')
      return
    }

    const emptyDescriptions = lineItems.some(item => item.description.trim() === '')
    if (emptyDescriptions) {
      toast.error('All line items must have a description')
      return
    }

    const invalidQuantities = validItems.filter(item => item.quantity < 1)
    if (invalidQuantities.length > 0) {
      toast.error('All line items must have a quantity of at least 1')
      return
    }

    const negativeUnitPrices = validItems.filter(item => item.unit_price < 0)
    if (negativeUnitPrices.length > 0) {
      toast.error('Unit prices cannot be negative')
      return
    }

    const MAX_UNIT_PRICE = 99999999.99
    const excessiveUnitPrices = validItems.filter(item => item.unit_price > MAX_UNIT_PRICE)
    if (excessiveUnitPrices.length > 0) {
      toast.error(`Unit prices cannot exceed ${formatCurrency(MAX_UNIT_PRICE)}. Please use a smaller amount.`)
      return
    }

    if (totalAmount === 0) {
      const confirmZero = window.confirm(
        'This invoice has a total of $0.00. This is typically used for free services or quotes. Do you want to continue?'
      )
      if (!confirmZero) return
    }

    setIsSaving(true)
    const loadingToast = toast.loading('Saving invoice...')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          client_id: clientId,
          invoice_number: invoiceNumber,
          status: 'draft',
          issue_date: issueDate,
          due_date: dueDate,
          subtotal: subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          notes: notes || null
        })
        .select()
        .single()

      if (invoiceError) throw invoiceError

      if (!invoice) {
        throw new Error('Failed to create invoice')
      }

      const itemsToInsert = validItems.map(item => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total
      }))

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert)

      if (itemsError) throw itemsError

      toast.success('Invoice created successfully!', { id: loadingToast, duration: 3000 })
      
      setTimeout(() => {
        router.push('/dashboard/invoices')
        router.refresh()
      }, 500)
    } catch (err: any) {
      let errorMessage = 'Failed to save invoice. Please try again.'
      
      if (err?.code === '23505' || err?.message?.includes('duplicate key') || err?.message?.includes('unique constraint')) {
        errorMessage = 'This invoice number already exists. Please refresh the page to generate a new invoice number.'
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

  // GATE: Show subscription required if no active subscription
  if (!hasActiveSubscription) {
    return <SubscriptionRequired />
  }

  const isClientLocked = !!preSelectedClientId

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Link 
            href="/dashboard/invoices"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg transition-all duration-200 font-bold text-gray-700 w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Invoices</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">Create Invoice</h1>
            <p className="text-base sm:text-lg text-gray-600 mt-2 font-medium">
              Generate a new invoice for your client
            </p>
          </div>
        </div>
      </div>

      {/* Premium Form Card */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-10 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
        <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); handleSaveDraft(); }}>
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
                    className={`h-12 pl-10 pr-10 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl ${selectedClient && !clientSearchQuery ? 'font-medium text-green-700' : ''}`}
                    disabled={isSaving}
                    autoComplete="off"
                  />
                  {selectedClient && !clientSearchQuery && (
                    <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-600" />
                  )}
                  {clientSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setClientSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {shouldShowDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                    {filteredClients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleSelectClient(client)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center justify-between group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 line-clamp-2 break-words" title={client.name}>
                            {client.name}
                          </p>
                          {client.company && (
                            <p className="text-xs text-gray-500 line-clamp-2 break-words mt-0.5" title={client.company}>
                              {client.company}
                            </p>
                          )}
                        </div>
                        {clientId === client.id && (
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0 ml-2" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {clientSearchQuery && filteredClients.length === 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-2xl p-4 text-center">
                    <p className="text-sm text-gray-500 mb-2">No clients found matching &quot;{clientSearchQuery}&quot;</p>
                    <Link 
                      href="/dashboard/clients/new" 
                      className="text-sm text-blue-600 hover:underline font-bold"
                    >
                      Add a new client
                    </Link>
                  </div>
                )}

                {selectedClient && !clientSearchQuery ? (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1 font-medium">
                    <Check className="w-3 h-3" />
                    Client selected: {selectedClient.name}
                  </p>
                ) : !clientSearchQuery && clients.length > 0 ? (
                  <p className="text-xs text-gray-500 mt-2 font-medium">
                    Start typing to search through {clients.length} client{clients.length !== 1 ? 's' : ''}
                  </p>
                ) : clients.length === 0 ? (
                  <p className="text-xs text-gray-500 mt-2 font-medium">
                    No clients yet.{' '}
                    <Link href="/dashboard/clients/new" className="text-blue-600 underline font-bold">
                      Add your first client
                    </Link>
                  </p>
                ) : null}

                <select
                  value={clientId}
                  onChange={() => {}}
                  required
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <Input
                  value={selectedClient ? `${selectedClient.name}${selectedClient.company ? ` (${selectedClient.company})` : ''}` : ''}
                  disabled={true}
                  className="h-12 text-base bg-gray-100 text-gray-500 cursor-not-allowed border-2"
                />
                <p className="text-xs text-gray-500 mt-2 font-medium">🔒 Client cannot be changed (pre-selected from client page)</p>
              </div>
            )}
          </div>

          {/* Invoice Number */}
          <div>
            <label htmlFor="invoiceNumber" className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-3">
              Invoice Number
            </label>
            <Input
              id="invoiceNumber"
              type="text"
              value={invoiceNumber}
              readOnly
              className="h-12 text-base bg-gray-50 border-2 border-gray-200"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="issueDate" className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-3">
                Issue Date <span className="text-red-500">*</span>
              </label>
              <Input
                id="issueDate"
                type="date"
                value={issueDate}
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
                disabled={isSaving}
                required
                className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
              />
            </div>
            <div>
              <label htmlFor="dueDate" className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-3">
                Due Date <span className="text-red-500">*</span>
              </label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isSaving}
                required
                className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <label className="block text-sm font-bold uppercase tracking-wide text-gray-700">
                Line Items <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={addLineItem}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg transition-all duration-200 font-bold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {lineItems.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-xl border-2 border-gray-200 p-6">
                  <div className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-12 md:col-span-5">
                      <label className="block text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        placeholder="Enter item description"
                        disabled={isSaving}
                        required
                        className="h-10 text-sm border-2 border-gray-200"
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">
                        Quantity <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        disabled={isSaving}
                        required
                        className="h-10 text-sm border-2 border-gray-200"
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">
                        Unit Price <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                        disabled={isSaving}
                        required
                        className="h-10 text-sm border-2 border-gray-200"
                      />
                    </div>
                    <div className="col-span-3 md:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">
                        Total
                      </label>
                      <Input
                        type="text"
                        value={formatCurrency(item.total)}
                        readOnly
                        className="h-10 text-sm bg-gray-100 font-bold border-2 border-gray-200"
                      />
                    </div>
                    <div className="col-span-1">
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLineItem(item.id)}
                          disabled={isSaving}
                          className="h-10 w-10 rounded-lg flex items-center justify-center text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50"
                        >
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
            <label htmlFor="notes" className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-3">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              disabled={isSaving}
              className="w-full text-base text-gray-900 placeholder:text-gray-400 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl resize-none p-3 focus:outline-none bg-white"
              placeholder="Additional notes or terms..."
            />
          </div>

          {/* Tax Rate */}
          <div>
            <label htmlFor="taxRate" className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-3">
              Tax Rate (%)
            </label>
            <Input
              id="taxRate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              placeholder="0"
              disabled={isSaving}
              className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
            />
          </div>

          {/* Totals Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200 p-8">
            <div className="space-y-4">
              <div className="flex justify-between text-base">
                <span className="font-bold text-gray-700">Subtotal:</span>
                <span className="font-bold text-gray-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="font-bold text-gray-700">Tax ({taxRate}%):</span>
                <span className="font-bold text-gray-900">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-xl pt-4 border-t-2 border-blue-300">
                <span className="font-black text-gray-900 tracking-tight">Total:</span>
                <span className="font-black text-blue-600 tracking-tight">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t-2 border-gray-100">
            <Link 
              href="/dashboard/invoices"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-400 hover:shadow-lg transition-all duration-200"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-2xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save as Draft
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}