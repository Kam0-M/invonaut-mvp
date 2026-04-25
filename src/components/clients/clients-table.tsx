'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, X, Users, Mail, Phone, Building2, Clock } from 'lucide-react'

type Client = {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  payment_terms: number | null
  created_at?: string
}

interface Props {
  clients: Client[]
  hasActiveSubscription: boolean
}

function avatarColor(name: string) {
  const palette = [
    { bg: 'bg-blue-100',   text: 'text-blue-700'   },
    { bg: 'bg-teal-100',   text: 'text-teal-700'   },
    { bg: 'bg-purple-100', text: 'text-purple-700' },
    { bg: 'bg-amber-100',  text: 'text-amber-700'  },
    { bg: 'bg-rose-100',   text: 'text-rose-700'   },
    { bg: 'bg-indigo-100', text: 'text-indigo-700' },
    { bg: 'bg-green-100',  text: 'text-green-700'  },
    { bg: 'bg-orange-100', text: 'text-orange-700' },
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return palette[Math.abs(hash) % palette.length]
}

export default function ClientsTable({ clients, hasActiveSubscription }: Props) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return clients
    const q = search.toLowerCase()
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.company ?? '').toLowerCase().includes(q) ||
      (c.phone ?? '').toLowerCase().includes(q)
    )
  }, [clients, search])

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, company, or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-sm"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {search && (
        <p className="text-sm text-gray-500 font-medium">
          <span className="text-gray-900 font-bold">{filtered.length}</span> result{filtered.length !== 1 ? 's' : ''} for "{search}"
        </p>
      )}

      {/* No results */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6 text-gray-400" />
          </div>
          <p className="font-bold text-gray-900 mb-1">No clients found</p>
          <p className="text-sm text-gray-400 mb-4">
            {search ? `No clients match "${search}"` : 'No clients yet'}
          </p>
          {search && (
            <button onClick={() => setSearch('')} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition">
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((client, idx) => {
            const av       = avatarColor(client.name)
            const initials = client.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

            return (
              <div
                key={client.id}
                className="inv-row-in relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Avatar */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm ${av.bg} ${av.text}`}>
                    {initials}
                  </div>

                  {/* Name + company */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-900 group-hover:text-blue-700 transition-colors truncate">{client.name}</p>
                    {client.company && (
                      <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3" />
                        {client.company}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  {client.email && (
                    <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-400 font-medium min-w-0 max-w-[180px] flex-shrink-0">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}

                  {/* Phone */}
                  {client.phone && (
                    <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-400 font-medium flex-shrink-0">
                      <Phone className="w-3.5 h-3.5" />
                      {client.phone}
                    </div>
                  )}

                  {/* Payment terms */}
                  {client.payment_terms && (
                    <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-xs font-bold px-2 py-1 rounded-lg bg-gray-100 text-gray-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Net {client.payment_terms}
                      </span>
                    </div>
                  )}

                  <span className="text-xs font-bold text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0">View →</span>
                </div>

                <Link href={`/dashboard/clients/${client.id}`} className="absolute inset-0 rounded-2xl" aria-label={`View client ${client.name}`} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
