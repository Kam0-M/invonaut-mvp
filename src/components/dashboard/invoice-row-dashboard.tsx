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
        return 'bg-gray-100 text-gray-800 border-2 border-gray-300'
      case 'sent':
        return 'bg-blue-100 text-blue-800 border-2 border-blue-300'
      case 'paid':
        return 'bg-green-100 text-green-800 border-2 border-green-300'
      case 'overdue':
        return 'bg-red-100 text-red-800 border-2 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-2 border-gray-300'
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