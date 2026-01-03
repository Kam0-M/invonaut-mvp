'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Plus, Trash2, X, Loader2, Search, Check } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
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
// Filter clients based on search query
const filteredClients = useMemo(() => {
if (!clientSearchQuery.trim()) return clients
const query = clientSearchQuery.toLowerCase()
return clients.filter(client => 
  client.name.toLowerCase().includes(query) ||
  (client.company && client.company.toLowerCase().includes(query))
)
}, [clients, clientSearchQuery])
// Get selected client
const selectedClient = clients.find(c => c.id === clientId)
// Automatically show dropdown when there are search results
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
const fetchClients = async () => {
try {
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

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
    console.error('Error fetching clients:', err)
    toast.error('Failed to load clients. Please refresh the page.')
  } finally {
    setIsLoading(false)
  }
}

fetchClients()
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
setClientSearchQuery('') // Clear search after selection
}
const handleSaveDraft = async () => {
// Validation: Client must be selected
if (!clientId) {
toast.error('Please select a client')
return
}
// Validation: At least one line item with description
const validItems = lineItems.filter(item => item.description.trim() !== '')
if (validItems.length === 0) {
  toast.error('Please add at least one line item with a description')
  return
}

// Validation: All line items must have descriptions
const emptyDescriptions = lineItems.some(item => item.description.trim() === '')
if (emptyDescriptions) {
  toast.error('All line items must have a description')
  return
}

// NEW VALIDATION: Check for zero or negative quantities
const invalidQuantities = validItems.filter(item => item.quantity < 1)
if (invalidQuantities.length > 0) {
  toast.error('All line items must have a quantity of at least 1')
  return
}

// NEW VALIDATION: Check for negative unit prices (allow $0 for free items)
const negativeUnitPrices = validItems.filter(item => item.unit_price < 0)
if (negativeUnitPrices.length > 0) {
  toast.error('Unit prices cannot be negative')
  return
}

// NEW VALIDATION: Check for maximum unit price (prevent unrealistic amounts)
const MAX_UNIT_PRICE = 99999999.99
const excessiveUnitPrices = validItems.filter(item => item.unit_price > MAX_UNIT_PRICE)
if (excessiveUnitPrices.length > 0) {
  toast.error(`Unit prices cannot exceed ${formatCurrency(MAX_UNIT_PRICE)}. Please use a smaller amount.`)
  return
}

// Warning: Invoice total is $0 (allow but warn)
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
  // Better error messages - no console.error
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
<Loader2 className="w-8 h-8 animate-spin text-primary" />
<p className="text-gray-600">Loading...</p>
</div>
</div>
)
}
const isClientLocked = !!preSelectedClientId
return (
<div className="space-y-6">
<div className="flex items-center justify-between">
<h1 className="text-3xl font-bold text-gray-900">Create Invoice</h1>
<Link href="/dashboard/invoices">
<Button variant="outline">
<X className="w-4 h-4 mr-2" />
Cancel
</Button>
</Link>
</div>
  <Card className="p-6">
    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSaveDraft(); }}>
      {/* Client Selection with Auto-Opening Search */}
      <div className="relative">
        <label htmlFor="client-search" className="block text-sm font-medium text-gray-700 mb-2">
          Client <span className="text-red-500">*</span>
          {isClientLocked && <span className="ml-2 text-xs text-blue-600">(Pre-selected)</span>}
        </label>

        {!isClientLocked ? (
          <div>
            {/* Search Input */}
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
                className={`pl-10 pr-10 ${selectedClient && !clientSearchQuery ? 'font-medium text-green-700' : ''}`}
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

            {/* Auto-Opening Dropdown Results */}
            {shouldShowDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {filteredClients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => handleSelectClient(client)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center justify-between group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-primary line-clamp-2 break-words" title={client.name}>
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

            {/* No Results Message */}
            {clientSearchQuery && filteredClients.length === 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center">
                <p className="text-sm text-gray-500 mb-2">No clients found matching &quot;{clientSearchQuery}&quot;</p>
                <Link 
                  href="/dashboard/clients/new" 
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Add a new client
                </Link>
              </div>
            )}

            {/* Helper Text */}
            {selectedClient && !clientSearchQuery ? (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Client selected: {selectedClient.name}
              </p>
            ) : !clientSearchQuery && clients.length > 0 ? (
              <p className="text-xs text-gray-500 mt-1">
                Start typing to search through {clients.length} client{clients.length !== 1 ? 's' : ''}
              </p>
            ) : clients.length === 0 ? (
              <p className="text-xs text-gray-500 mt-1">
                No clients yet.{' '}
                <Link href="/dashboard/clients/new" className="text-primary underline font-medium">
                  Add your first client
                </Link>
              </p>
            ) : null}

            {/* Hidden select for form validation */}
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
              className="bg-gray-100 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">🔒 Client cannot be changed (pre-selected from client page)</p>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 mb-2">
          Invoice Number
        </label>
        <Input
          id="invoiceNumber"
          type="text"
          value={invoiceNumber}
          readOnly
          className="bg-gray-50"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700 mb-2">
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
          />
        </div>
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
            Due Date <span className="text-red-500">*</span>
          </label>
          <Input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={isSaving}
            required
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Line Items <span className="text-red-500">*</span>
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLineItem}
            disabled={isSaving}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        <div className="space-y-4">
          {lineItems.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="grid grid-cols-12 gap-4 items-end">
                <div className="col-span-12 md:col-span-5">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                    placeholder="Enter item description"
                    disabled={isSaving}
                    required
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
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
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
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
                  />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Total
                  </label>
                  <Input
                    type="text"
                    value={formatCurrency(item.total)}
                    readOnly
                    className="bg-gray-50 font-semibold"
                  />
                </div>
                <div className="col-span-1">
                  {lineItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(item.id)}
                      disabled={isSaving}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
          Notes (Optional)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          disabled={isSaving}
          className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          placeholder="Additional notes or terms..."
        />
      </div>

      <div>
        <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700 mb-2">
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
        />
      </div>

      <Card className="p-6 bg-gray-50">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax ({taxRate}%):</span>
            <span className="font-semibold text-gray-900">{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex justify-between text-lg pt-3 border-t border-gray-300">
            <span className="font-bold text-gray-900">Total:</span>
            <span className="font-bold text-primary">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-4 pt-4">
        <Link href="/dashboard/invoices">
          <Button type="button" variant="outline" disabled={isSaving}>
            Cancel
          </Button>
        </Link>
        <Button
          type="submit"
          disabled={isSaving}
          className="bg-primary hover:bg-primary/90"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save as Draft'
          )}
        </Button>
      </div>
    </form>
  </Card>
</div>
)
}