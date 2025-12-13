'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Plus, Trash2, X } from 'lucide-react'
import Link from 'next/link'

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
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [invoiceNumber, setInvoiceNumber] = useState('INV-00001')

  // Form state
  const [clientId, setClientId] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unit_price: 0, total: 0 }
  ])
  const [notes, setNotes] = useState('')
  const [taxRate, setTaxRate] = useState(0)

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)
  const taxAmount = (subtotal * taxRate) / 100
  const totalAmount = subtotal + taxAmount

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  // Fetch clients on mount
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
      } catch (err) {
        console.error('Error fetching clients:', err)
        setError('Failed to load clients. Please refresh the page.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchClients()
  }, [router])

  // Generate invoice number
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

  // Set default dates
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setIssueDate(today)
    
    const dueDateObj = new Date()
    dueDateObj.setDate(dueDateObj.getDate() + 30)
    setDueDate(dueDateObj.toISOString().split('T')[0])
  }, [])

  // Calculate totals are handled in updateLineItem function

  // Update line item
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

  // Add line item
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

  // Remove line item
  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(prev => prev.filter(item => item.id !== id))
    }
  }

  // Handle save as draft
  const handleSaveDraft = async () => {
    setError(null)
    setSuccess(false)

    // Validation
    if (!clientId) {
      setError('Please select a client')
      return
    }

    const validItems = lineItems.filter(item => item.description.trim() !== '')
    if (validItems.length === 0) {
      setError('Please add at least one line item with a description')
      return
    }

    setIsSaving(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Insert invoice
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

      // Insert line items
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

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard/invoices')
      }, 1000)
    } catch (err: any) {
      console.error('Error saving invoice:', err)
      setError(err.message || 'Failed to save invoice. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

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

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </Card>
      )}

      {success && (
        <Card className="p-4 bg-green-50 border-green-200">
          <p className="text-sm text-green-800">Invoice saved successfully! Redirecting...</p>
        </Card>
      )}

      <Card className="p-6">
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSaveDraft(); }}>
          {/* Client Selection */}
          <div>
            <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-2">
              Client <span className="text-red-500">*</span>
            </label>
            <select
              id="client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              required
            >
              <option value="">Select a client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name} {client.company ? `(${client.company})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Invoice Number */}
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

          {/* Dates */}
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
                  // Auto-update due date if issue date changes and has a valid value
                  if (nextValue) {
                    const newIssueDate = new Date(nextValue)
                    if (!Number.isNaN(newIssueDate.getTime())) {
                      const newDueDate = new Date(newIssueDate)
                      newDueDate.setDate(newDueDate.getDate() + 30)
                      setDueDate(newDueDate.toISOString().split('T')[0])
                    }
                  }
                }}
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
                required
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Line Items
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLineItem}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {lineItems.map((item, index) => (
                <Card key={item.id} className="p-4">
                  <div className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-12 md:col-span-5">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Description
                      </label>
                      <Input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        placeholder="Item description"
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Quantity
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Unit Price
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
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

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              placeholder="Additional notes or terms..."
            />
          </div>

          {/* Tax Rate */}
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
            />
          </div>

          {/* Summary */}
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

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <Link href="/dashboard/invoices">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90"
            >
              {isSaving ? 'Saving...' : 'Save as Draft'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

