'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

type InvoiceFiltersProps = {
  onFilterChange: (filters: { status: string; search: string }) => void
}

export function InvoiceFilters({ onFilterChange }: InvoiceFiltersProps) {
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
    onFilterChange({ status: newStatus, search })
  }

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch)
    onFilterChange({ status, search: newSearch })
  }

  const handleClear = () => {
    setStatus('all')
    setSearch('')
    onFilterChange({ status: 'all', search: '' })
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Search Bar */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          suppressHydrationWarning
          type="text"
          placeholder="Search by client name or invoice number..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
        />
      </div>

      {/* Status Filter Dropdown */}
      <div className="flex gap-2">
        <select
          suppressHydrationWarning
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white min-w-[140px]"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>

        {/* Clear Filters Button */}
        {(status !== 'all' || search !== '') && (
          <Button
            variant="outline"
            onClick={handleClear}
            className="whitespace-nowrap"
          >
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  )
}