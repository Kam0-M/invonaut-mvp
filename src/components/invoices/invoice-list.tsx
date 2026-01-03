'use client'

import { useState, useMemo } from 'react'
import { InvoiceFilters } from './invoice-filters'
import { FollowUpButton } from './follow-up-button'

type Invoice = {
  id: string
  invoice_number: string
  issue_date: string
  due_date: string
  total_amount: number
  status: string
  last_followed_up?: string | null
  clients: {
    name: string
  } | null
}

type InvoiceListProps = {
  invoices: Invoice[]
}

export function InvoiceList({ invoices }: InvoiceListProps) {
  const [filters, setFilters] = useState({ status: 'all', search: '' })

  // Calculate days overdue for an invoice
  const getDaysOverdue = (dueDate: string, status: string) => {
    if (status !== 'sent') return 0
    
    const now = new Date()
    const due = new Date(dueDate)
    const daysOverdue = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
    
    return daysOverdue > 0 ? daysOverdue : 0
  }

  // Filter invoices based on status and search
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      // Status filter
      let matchesStatus = false
      
      if (filters.status === 'all') {
        matchesStatus = true
      } else if (filters.status === 'overdue') {
        // Special handling for overdue filter
        const daysOverdue = getDaysOverdue(invoice.due_date, invoice.status)
        matchesStatus = daysOverdue > 0 && invoice.status === 'sent'
      } else {
        matchesStatus = invoice.status === filters.status
      }

      // Search filter (client name or invoice number)
      const searchLower = filters.search.toLowerCase()
      const matchesSearch =
        !filters.search ||
        invoice.invoice_number.toLowerCase().includes(searchLower) ||
        invoice.clients?.name.toLowerCase().includes(searchLower)

      return matchesStatus && matchesSearch
    })
  }, [invoices, filters])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string, dueDate: string) => {
    // Check if overdue
    const daysOverdue = getDaysOverdue(dueDate, status)
    if (daysOverdue > 0 && status === 'sent') {
      return 'bg-red-100 text-red-800'
    }

    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'paid':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string, dueDate: string) => {
    const daysOverdue = getDaysOverdue(dueDate, status)
    if (daysOverdue > 0 && status === 'sent') {
      return 'overdue'
    }
    return status
  }

  return (
    <>
      {/* Filters */}
      <InvoiceFilters onFilterChange={setFilters} />

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {filteredInvoices.length} of {invoices.length} invoice
          {invoices.length !== 1 ? 's' : ''}
          {filters.status !== 'all' && (
            <span className="font-medium"> · Status: {filters.status}</span>
          )}
          {filters.search && (
            <span className="font-medium"> · Search: "{filters.search}"</span>
          )}
        </p>
      </div>

      {/* Invoice Table */}
      {filteredInvoices.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-600 text-lg font-medium">No invoices found</p>
          <p className="text-gray-500 text-sm mt-2">
            Try adjusting your filters or search terms
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Invoice #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 w-[200px]">
                      Client
                    </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Issue Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredInvoices.map((invoice) => {
                const daysOverdue = getDaysOverdue(invoice.due_date, invoice.status)
                const isOverdue = daysOverdue > 0 && invoice.status === 'sent'

                return (
                  <tr
                    key={invoice.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td 
                      className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900 cursor-pointer"
                      onClick={() => window.location.href = `/dashboard/invoices/${invoice.id}`}
                    >
                      {invoice.invoice_number}
                    </td>
                    <td 
                      className="px-6 py-4 text-sm text-slate-600 cursor-pointer max-w-[200px]"
                      onClick={() => window.location.href = `/dashboard/invoices/${invoice.id}`}
                    >
                      <div className="truncate" title={invoice.clients?.name || undefined}>
                        {invoice.clients?.name || '—'}
                      </div>
                    </td>
                    <td 
                      className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 cursor-pointer"
                      onClick={() => window.location.href = `/dashboard/invoices/${invoice.id}`}
                    >
                      {formatDate(invoice.issue_date)}
                    </td>
                    <td 
                      className="whitespace-nowrap px-6 py-4 text-sm cursor-pointer"
                      onClick={() => window.location.href = `/dashboard/invoices/${invoice.id}`}
                    >
                      <div className="flex flex-col gap-1">
                        <span className={isOverdue ? 'text-red-600 font-medium' : 'text-slate-600'}>
                          {formatDate(invoice.due_date)}
                        </span>
                        {isOverdue && (
                          <span className="text-xs text-red-500">
                            {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                          </span>
                        )}
                      </div>
                    </td>
                    <td 
                      className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 cursor-pointer"
                      onClick={() => window.location.href = `/dashboard/invoices/${invoice.id}`}
                    >
                      {formatCurrency(invoice.total_amount)}
                    </td>
                    <td 
                      className="whitespace-nowrap px-6 py-4 cursor-pointer"
                      onClick={() => window.location.href = `/dashboard/invoices/${invoice.id}`}
                    >
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(
                          invoice.status,
                          invoice.due_date
                        )}`}
                      >
                        {getStatusLabel(invoice.status, invoice.due_date)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {isOverdue ? (
                        <FollowUpButton
                          invoiceId={invoice.id}
                          invoiceNumber={invoice.invoice_number}
                          clientName={invoice.clients?.name || 'Client'}
                          lastFollowedUp={invoice.last_followed_up || null}
                          daysOverdue={daysOverdue}
                        />
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
            </div>
          </div>
        </div>
      )}
    </>
  )
}