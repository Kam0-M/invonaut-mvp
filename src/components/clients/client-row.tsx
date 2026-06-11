'use client'

import Link from 'next/link'
import { Edit, Lock } from 'lucide-react'

interface ClientRowProps {
  id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  paymentTerms: number | null
  hasActiveSubscription: boolean
}

export function ClientRow({
  id,
  name,
  company,
  email,
  phone,
  paymentTerms,
  hasActiveSubscription
}: ClientRowProps) {
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      {/* Name */}
      <td 
        className="px-6 py-4 text-sm font-medium text-slate-900 cursor-pointer max-w-[200px]"
        onClick={() => window.location.href = `/dashboard/clients/${id}`}
      >
        <div className="truncate" title={name}>
          {name}
        </div>
      </td>

      {/* Company */}
      <td 
        className="px-6 py-4 text-sm text-slate-600 cursor-pointer max-w-[200px]"
        onClick={() => window.location.href = `/dashboard/clients/${id}`}
      >
        <div className="truncate" title={company || undefined}>
          {company || '—'}
        </div>
      </td>

      {/* Email */}
      <td 
        className="px-6 py-4 text-sm text-slate-600 cursor-pointer"
        onClick={() => window.location.href = `/dashboard/clients/${id}`}
      >
        <div className="truncate" title={email || undefined}>
          {email || '—'}
        </div>
      </td>

      {/* Phone */}
      <td 
        className="px-6 py-4 text-sm text-slate-600 cursor-pointer"
        onClick={() => window.location.href = `/dashboard/clients/${id}`}
      >
        {phone || '—'}
      </td>

      {/* Payment Terms */}
      <td 
        className="px-6 py-4 text-sm text-slate-600 cursor-pointer"
        onClick={() => window.location.href = `/dashboard/clients/${id}`}
      >
        {paymentTerms ? `${paymentTerms} days` : '—'}
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {/* View Button (always visible) */}
          <Link 
            href={`/dashboard/clients/${id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-all text-xs font-bold text-blue-700"
          >
            View
          </Link>

          {/* Edit Button - Conditional based on subscription */}
          {hasActiveSubscription ? (
            <Link 
              href={`/dashboard/clients/${id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all text-xs font-bold text-gray-700"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit
            </Link>
          ) : (
            <button
              disabled
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-400 text-xs font-bold cursor-not-allowed"
              title="Subscribe to edit clients"
            >
              <Lock className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}