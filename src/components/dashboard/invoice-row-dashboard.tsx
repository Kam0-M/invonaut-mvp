'use client'

import { useCurrency } from '@/lib/context/currency-context'

import { useRouter } from 'next/navigation'
import { isOverdue } from '@/lib/utils/invoice-status'

type InvoiceRowDashboardProps = {
  id: string
  invoiceNumber: string
  clientName: string | null
  dueDate: string
  totalAmount: number
  status: string
}

export function InvoiceRowDashboard({
  id, 
  invoiceNumber, 
  clientName, 
  dueDate, 
  totalAmount, 
  status 
}: InvoiceRowDashboardProps) {
  const { format: fmt } = useCurrency()
  const router = useRouter()

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })

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

  const isDueDateOverdue = isOverdue(dueDate, status)

  const handleClick = () => {
    router.push(`/dashboard/invoices/${id}`)
  }

  return (
    <tr 
      className="hover:bg-blue-50 cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-b-0"
      onClick={handleClick}
    >
      <td className="px-4 py-4 text-sm font-black text-gray-900">
        {invoiceNumber}
      </td>
      <td className="px-4 py-4 text-sm font-bold text-gray-700">
        {clientName || '—'}
      </td>
      <td className={`px-4 py-4 text-sm font-bold ${isDueDateOverdue ? 'text-red-600' : 'text-gray-600'}`}>
        {formatDate(dueDate)}
      </td>
      <td className="px-4 py-4 text-sm font-black text-gray-900">
        {fmt(totalAmount)}
      </td>
      <td className="px-4 py-4">
        <span
          className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-wide ${getStatusColor(status)}`}
        >
          {status}
        </span>
      </td>
    </tr>
  )
}