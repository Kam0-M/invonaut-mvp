'use client'

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
  const router = useRouter()

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })

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

  // Check if due date should be red
  const isDueDateOverdue = isOverdue(dueDate, status)

  const handleClick = () => {
    console.log('=== INVOICE CLICK DEBUG ===')
    console.log('Invoice ID:', id)
    console.log('Invoice Number:', invoiceNumber)
    console.log('Target URL:', `/dashboard/invoices/${id}`)
    console.log('Router object:', router)
    
    router.push(`/dashboard/invoices/${id}`)
    
    console.log('Router.push called')
    console.log('===========================')
  }

  return (
    <tr 
      className="hover:bg-slate-50 cursor-pointer transition-colors"
      onClick={handleClick}
    >
      <td className="px-4 py-3 text-sm font-medium text-slate-900">
        {invoiceNumber}
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {clientName || '—'}
      </td>
      <td className={`px-4 py-3 text-sm ${isDueDateOverdue ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>
        {formatDate(dueDate)}
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {formatCurrency(totalAmount)}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(status)}`}
        >
          {status}
        </span>
      </td>
    </tr>
  )
}
