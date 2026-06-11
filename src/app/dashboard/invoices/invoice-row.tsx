'use client'

import { useCurrency } from '@/lib/context/currency-context'

import { useRouter } from 'next/navigation'

type InvoiceRowProps = {
  invoice: {
    id: string
    invoice_number: string
    issue_date: string
    due_date: string
    total_amount: number
    status: string
    clients: { name: string } | null
  }
}

export function InvoiceRow({
  invoice }: InvoiceRowProps) {
  const { format: fmt } = useCurrency()
  const router = useRouter()

  
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
        return 'bg-gray-100 text-gray-700 border border-gray-200'
      case 'sent':
        return 'bg-blue-50 text-blue-700 border border-blue-200'
      case 'paid':
        return 'bg-teal-50 text-teal-700 border border-teal-200'
      case 'overdue':
        return 'bg-red-50 text-red-700 border border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200'
    }
  }

  return (
    <tr
      onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
      className="hover:bg-blue-50 cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-b-0"
    >
      <td className="px-6 py-4 text-sm font-black text-gray-900">
        {invoice.invoice_number}
      </td>
      <td className="px-6 py-4 text-sm font-bold text-gray-700">
        {invoice.clients?.name || '—'}
      </td>
      <td className="px-6 py-4 text-sm font-medium text-gray-600">
        {formatDate(invoice.issue_date)}
      </td>
      <td className="px-6 py-4 text-sm font-medium text-gray-600">
        {formatDate(invoice.due_date)}
      </td>
      <td className="px-6 py-4 text-sm font-black text-gray-900">
        {fmt(invoice.total_amount)}
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-wide ${getStatusColor(
            invoice.status
          )}`}
        >
          {invoice.status}
        </span>
      </td>
    </tr>
  )
}