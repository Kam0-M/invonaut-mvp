'use client'
// src/components/contracts/contract-list.tsx
// Client component — handles search + template_type filter for the contracts list

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, X, Clock, AlertTriangle, Filter } from 'lucide-react'

type Contract = {
  id: string
  title: string
  status: string
  template_type: string
  total_value: number | null
  created_at: string
  end_date?: string | null
  expiry_date?: string | null
  clients: { name: string; company?: string | null } | null
}

interface Props {
  contracts: Contract[]
}

const templateLabels: Record<string, string> = {
  service_agreement: 'Service Agreement',
  nda:               'NDA',
  project_proposal:  'Project Proposal',
  retainer:          'Retainer',
  work_for_hire:     'Work for Hire',
  subcontractor:     'Subcontractor',
  custom:            'Custom',
}

const statusCfg: Record<string, { pill: string; dot: string; label: string }> = {
  draft:     { pill: 'bg-gray-100 text-gray-600 border border-gray-200',        dot: 'bg-gray-400',    label: 'Draft'     },
  sent:      { pill: 'bg-blue-50 text-blue-700 border border-blue-200',          dot: 'bg-blue-500',    label: 'Sent'      },
  active:    { pill: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500', label: 'Active'    },
  expired:   { pill: 'bg-gray-100 text-gray-500 border border-gray-200',         dot: 'bg-gray-400',    label: 'Expired'   },
  completed: { pill: 'bg-teal-50 text-teal-700 border border-teal-200',          dot: 'bg-teal-500',    label: 'Completed' },
}

function fmt(n: number) {
  if (n >= 999_500) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000)  return `$${(n / 1_000).toFixed(0)}K`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function avatarColor(name: string) {
  const palette = [
    { bg: 'bg-blue-100',   text: 'text-blue-700'   },
    { bg: 'bg-teal-100',   text: 'text-teal-700'   },
    { bg: 'bg-indigo-100', text: 'text-indigo-700' },
    { bg: 'bg-amber-100',  text: 'text-amber-700'  },
    { bg: 'bg-cyan-100',   text: 'text-cyan-700'   },
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return palette[Math.abs(hash) % palette.length]
}

export default function ContractList({ contracts }: Props) {
  const [search,     setSearch]     = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  // All 6 predefined types always shown — user uses search for custom types
  const ALL_TYPES = [
    { key: 'service_agreement', label: 'Service Agreement' },
    { key: 'nda',               label: 'NDA'               },
    { key: 'project_proposal',  label: 'Project Proposal'  },
    { key: 'retainer',          label: 'Retainer'          },
    { key: 'work_for_hire',     label: 'Work for Hire'     },
    { key: 'subcontractor',     label: 'Subcontractor'     },
  ]

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return contracts.filter(c => {
      const client = c.clients?.name ?? ''
      const matchSearch = !q
        || c.title.toLowerCase().includes(q)
        || client.toLowerCase().includes(q)
      const matchType = typeFilter === 'all' || c.template_type === typeFilter
      return matchSearch && matchType
    })
  }, [contracts, search, typeFilter])

  const now = new Date()

  return (
    <div className="space-y-4">
      {/* Search + filter bar */}
      <div className="flex flex-col gap-3">
      {/* Search bar — compact to leave room for type filters */}
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search title or client…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Type filter — all 6 always shown, wraps on small screens */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl flex-wrap">
        <button
          onClick={() => setTypeFilter('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            typeFilter === 'all'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Filter className="w-3 h-3" />All Types
        </button>
        {ALL_TYPES.map(t => (
          <button
            key={t.key}
            onClick={() => setTypeFilter(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              typeFilter === t.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      </div>

      {/* Results count */}
      {(search || typeFilter !== 'all') && (
        <p className="text-sm text-gray-500 font-medium">
          <span className="text-gray-900 font-bold">{filtered.length}</span> of {contracts.length} contracts
          {typeFilter !== 'all' && <span className="text-blue-600"> · {templateLabels[typeFilter] ?? typeFilter}</span>}
          {search && <span className="text-blue-600"> · "{search}"</span>}
        </p>
      )}

      {/* No results */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <Search className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm font-bold text-gray-400 mb-1">No contracts found</p>
          <p className="text-xs text-gray-300 font-medium">
            {search ? `No results for "${search}"` : 'No contracts match this filter'}
          </p>
          <button
            onClick={() => { setSearch(''); setTypeFilter('all') }}
            className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Contract rows */}
      <div className="space-y-2">
        {filtered.map((contract, idx) => {
          const clientName = contract.clients?.name ?? 'No client'
          const value      = contract.total_value ? Number(contract.total_value) : null
          const expiryDate = contract.expiry_date
            ? new Date(contract.expiry_date + 'T12:00:00') : null
          const daysToExpiry = expiryDate
            ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : null

          const isExpiringSoon = daysToExpiry !== null && daysToExpiry <= 14 && daysToExpiry >= 0
          const isUrgent       = daysToExpiry !== null && daysToExpiry <= 7  && daysToExpiry >= 0
          const isExpired      = daysToExpiry !== null && daysToExpiry < 0

          const cfg = statusCfg[contract.status] ?? statusCfg.draft
          const av  = avatarColor(clientName)
          const letters = clientName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

          return (
            <div
              key={contract.id}
              className="inv-row-in relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <div className="flex items-center gap-4 px-5 py-4">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm ${av.bg} ${av.text}`}>
                  {letters}
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm text-gray-900 truncate">{contract.title}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${cfg.pill}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                    {isExpiringSoon && !isUrgent && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                        <Clock className="w-2.5 h-2.5" />
                        {daysToExpiry === 0 ? 'Expires today' : `${daysToExpiry}d left`}
                      </span>
                    )}
                    {isUrgent && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        {daysToExpiry === 0 ? 'Expires today' : `${daysToExpiry}d — urgent`}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm text-gray-600 font-medium">{clientName}</span>
                    <span className="text-gray-200 text-xs">·</span>
                    <span className="text-xs text-gray-400">{templateLabels[contract.template_type] ?? contract.template_type}</span>
                  </div>
                </div>

                {/* Expiry */}
                {expiryDate && (
                  <div className="hidden sm:flex flex-col items-end flex-shrink-0 min-w-[90px]">
                    <span className={`text-xs font-bold ${isExpiringSoon ? 'text-amber-500' : isExpired ? 'text-gray-400' : 'text-gray-500'}`}>
                      {isExpired
                        ? 'Expired'
                        : `Expires ${expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                      }
                    </span>
                    {!isExpired && (
                      <span className="text-[10px] text-gray-300 mt-0.5">
                        {expiryDate.toLocaleDateString('en-US', { year: 'numeric' })}
                      </span>
                    )}
                  </div>
                )}

                {/* Value */}
                <div className="flex-shrink-0 text-right min-w-[80px]">
                  {value
                    ? <span className="text-base font-black text-gray-900 group-hover:text-blue-600 transition-colors">{fmt(value)}</span>
                    : <span className="text-sm text-gray-300 font-medium">—</span>
                  }
                </div>

                <span className="text-xs font-bold text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0">
                  View →
                </span>
              </div>

              <Link
                href={`/dashboard/contracts/${contract.id}`}
                className="absolute inset-0 rounded-2xl"
                aria-label={`View contract ${contract.title}`}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
