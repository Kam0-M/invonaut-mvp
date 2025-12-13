'use client'

import { useState, useMemo } from 'react'
import { InvoiceFilters } from './invoice-filters'
import { InvoiceRow } from '@/app/dashboard/invoices/invoice-row'

type Invoice = {
  id: string
  invoice_number: string
  issue_date: string
  due_date: string
  total_amount: number
  status: string
  clients: {
    name: string
  } | null
}

type InvoiceListProps = {
  invoices: Invoice[]
}

export function InvoiceList({ invoices }: InvoiceListProps) {
  const [filters, setFilters] = useState({ status: 'all', search: '' })

  // Filter invoices based on status and search
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      // Status filter
      const matchesStatus =
        filters.status === 'all' || invoice.status === filters.status

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  onClick={() =>
                    (window.location.href = `/dashboard/invoices/${invoice.id}`)
                  }
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                    {invoice.invoice_number}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {invoice.clients?.name || '—'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {formatDate(invoice.issue_date)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {formatDate(invoice.due_date)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {formatCurrency(invoice.total_amount)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(
                        invoice.status
                      )}`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}