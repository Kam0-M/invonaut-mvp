'use client'
// src/components/analytics/client-intelligence-panel.tsx
//
// WHY THIS IS A CLIENT COMPONENT:
//   The analytics page is a server component that reads URL params and fetches data.
//   The controls (sort, limit, view mode) previously used <Link> tags which trigger
//   full page navigations and always scroll to the top — annoying when the section
//   is midway down the page.
//
//   By moving the controls into this client component, we use router.push() with
//   { scroll: false } which updates the URL and re-runs the server component WITHOUT
//   scrolling. The server re-renders with new params, the client component re-renders
//   with the new sorted data — all without jumping to the top.
//
// VIEW MODES:
//   list    — ranked horizontal bars (original)
//   table   — frequency table with all columns (revenue, invoices, paid, overdue, rate)
//   revenue — Recharts vertical bar chart, revenue per client
//   rate    — horizontal progress bars colored by payment rate

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Users, BarChart2, Table2, TrendingUp, Percent } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ClientStat = {
  id:             string
  name:           string
  company:        string | null
  totalRevenue:   number
  paidCount:      number
  overdueCount:   number
  totalSent:      number
  totalInvoices:  number
  collectionRate: number | null
}

type SortKey   = 'revenue' | 'rate' | 'invoices' | 'overdue'
type LimitVal  = 5 | 10 | 20
type ViewMode  = 'list' | 'table' | 'revenue' | 'rate'

interface Props {
  allClientStats: ClientStat[]
  sortedClients:  ClientStat[]
  sortBy:         SortKey
  limit:          LimitVal
  viewMode:       ViewMode
}

// ─── Config ───────────────────────────────────────────────────────────────────

const SORT_OPTIONS: { key: SortKey; label: string; description: string }[] = [
  { key: 'revenue',  label: 'Revenue',      description: 'Highest total paid value' },
  { key: 'rate',     label: 'Pay Rate',      description: 'Most consistent payers' },
  { key: 'invoices', label: 'Most Active',   description: 'Most invoices issued' },
  { key: 'overdue',  label: 'Overdue Risk',  description: 'Highest overdue risk (fewest paid %)' },
]

const VIEW_OPTIONS: { key: ViewMode; label: string; icon: typeof BarChart2 }[] = [
  { key: 'list',    label: 'Ranked List',    icon: BarChart2 },
  { key: 'table',   label: 'Stats Table',    icon: Table2    },
  { key: 'revenue', label: 'Revenue Chart',  icon: TrendingUp },
  { key: 'rate',    label: 'Pay Rate Chart', icon: Percent   },
]

const LIMIT_OPTIONS: LimitVal[] = [5, 10, 20]

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

const fmtCompact = (n: number): string => {
  if (n >= 999_500) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000)  return `$${(n / 1_000).toFixed(0)}K`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

// ─── Tooltip for Recharts ─────────────────────────────────────────────────────

const RevenueTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '2px solid #E5E7EB', borderRadius: 12, padding: '10px 14px', boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}>
      <p style={{ fontWeight: 700, color: '#6B7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>{label}</p>
      <p style={{ fontWeight: 900, color: '#1D4ED8', fontSize: 16, margin: 0 }}>{fmt(payload[0].value)}</p>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClientIntelligencePanel({
  allClientStats, sortedClients, sortBy, limit, viewMode,
}: Props) {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()

  // Navigate without scrolling to top
  const navigate = useCallback((overrides: Partial<{ sortBy: SortKey; limit: LimitVal; viewMode: ViewMode }>) => {
    const p = new URLSearchParams(searchParams.toString())
    if (overrides.sortBy  !== undefined) p.set('sortBy',   overrides.sortBy)
    if (overrides.limit   !== undefined) p.set('limit',    String(overrides.limit))
    if (overrides.viewMode !== undefined) p.set('viewMode', overrides.viewMode)
    router.push(`${pathname}?${p.toString()}`, { scroll: false })
  }, [router, pathname, searchParams])

  // Bar widths for list view
  const maxValue = (() => {
    switch (sortBy) {
      case 'rate':     return 100
      case 'invoices': return Math.max(...sortedClients.map(c => c.totalInvoices), 1)
      case 'overdue':  return Math.max(...sortedClients.map(c => c.overdueCount), 1)
      default:         return Math.max(...sortedClients.map(c => c.totalRevenue), 1)
    }
  })()

  // Recharts data for revenue chart — truncate long names
  const revenueChartData = sortedClients
    .filter(c => c.totalRevenue > 0)
    .map(c => ({
      name:    c.name.length > 16 ? c.name.slice(0, 14) + '…' : c.name,
      revenue: c.totalRevenue,
      id:      c.id,
    }))

  const ctrlBtn = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
      active
        ? 'bg-blue-600 text-white shadow-sm'
        : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
    }`

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg p-8">

      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Client Intelligence</h2>
            <p className="text-sm text-gray-500 font-medium">
              Showing top {Math.min(limit, allClientStats.length)} of {allClientStats.length} clients
            </p>
          </div>
        </div>
        <Link href="/dashboard/clients" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors flex-shrink-0">
          View all clients →
        </Link>
      </div>

      {/* Controls bar */}
      <div className="flex flex-col gap-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">

        {/* View mode */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">View As</p>
          <div className="flex flex-wrap gap-2">
            {VIEW_OPTIONS.map(opt => {
              const Icon = opt.icon
              return (
                <button key={opt.key} onClick={() => navigate({ viewMode: opt.key })} className={ctrlBtn(viewMode === opt.key)}>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon className="w-3 h-3" />
                    {opt.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          {/* Sort by */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Rank By</p>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map(opt => (
                <button key={opt.key} title={opt.description} onClick={() => navigate({ sortBy: opt.key })} className={ctrlBtn(sortBy === opt.key)}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Limit */}
          <div className="flex-shrink-0">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Show</p>
            <div className="flex gap-2">
              {LIMIT_OPTIONS.map(l => (
                <button key={l} onClick={() => navigate({ limit: l })} className={ctrlBtn(limit === l)}>
                  Top {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── VIEW: Ranked List ───────────────────────────────────────────────── */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {sortedClients.map((client, idx) => {
            const barPct = (() => {
              switch (sortBy) {
                case 'rate':     return client.collectionRate ?? 0
                case 'invoices': return maxValue > 0 ? Math.round((client.totalInvoices / maxValue) * 100) : 0
                case 'overdue':  return maxValue > 0 ? Math.round((client.overdueCount  / maxValue) * 100) : 0
                default:         return maxValue > 0 ? Math.round((client.totalRevenue  / maxValue) * 100) : 0
              }
            })()

            const rate = client.collectionRate

            const barStyle: React.CSSProperties = (() => {
              switch (sortBy) {
                case 'rate':
                  return { width: `${barPct}%`, background: rate === null ? '#E5E7EB' : rate >= 80 ? '#10B981' : rate >= 60 ? '#F59E0B' : '#EF4444' }
                case 'overdue':
                  return { width: `${barPct}%`, background: client.overdueCount > 0 ? '#EF4444' : '#E5E7EB' }
                case 'invoices':
                  return { width: `${barPct}%`, background: '#3B82F6' }
                default:
                  return { width: `${barPct}%`, background: 'linear-gradient(to right, #14B8A6, #2563EB)' }
              }
            })()

            const primaryMetric = (() => {
              switch (sortBy) {
                case 'rate':     return rate !== null ? `${rate}% paid` : '—'
                case 'invoices': return `${client.totalInvoices} invoice${client.totalInvoices !== 1 ? 's' : ''}`
                case 'overdue':  return client.overdueCount > 0 ? `${client.overdueCount} overdue` : 'None overdue'
                default:         return client.totalRevenue > 0 ? fmtCompact(client.totalRevenue) : 'No revenue'
              }
            })()

            return (
              <div key={client.id}>
                <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                  <span className={`text-xs font-black w-5 flex-shrink-0 ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-700' : 'text-gray-300'}`}>
                    #{idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-gray-900 truncate">{client.name}</span>
                      {client.company && <span className="text-xs text-gray-400 font-medium truncate">{client.company}</span>}
                      {client.overdueCount > 0 && sortBy !== 'overdue' && (
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 flex-shrink-0">
                          {client.overdueCount} overdue
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {sortBy !== 'rate' && rate !== null && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${rate >= 80 ? 'text-green-700 bg-green-100' : rate >= 60 ? 'text-amber-700 bg-amber-100' : 'text-red-700 bg-red-100'}`}>
                        {rate}% paid
                      </span>
                    )}
                    {sortBy !== 'revenue' && client.totalRevenue > 0 && (
                      <span className="text-xs text-gray-400 font-bold" title={fmt(client.totalRevenue)}>
                        {fmtCompact(client.totalRevenue)}
                      </span>
                    )}
                    <span
                      className={`text-sm font-black ${
                        sortBy === 'overdue' && client.overdueCount > 0 ? 'text-red-700'
                        : sortBy === 'rate' && rate !== null ? (rate >= 80 ? 'text-green-700' : rate >= 60 ? 'text-amber-700' : 'text-red-700')
                        : 'text-gray-900'
                      }`}
                      title={sortBy === 'revenue' ? fmt(client.totalRevenue) : primaryMetric}
                    >
                      {primaryMetric}
                    </span>
                  </div>
                </div>
                <div className="ml-8 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={barStyle} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── VIEW: Stats Table ──────────────────────────────────────────────── */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="text-left px-3 py-3 text-xs font-black text-gray-500 uppercase tracking-wide">#</th>
                <th className="text-left px-3 py-3 text-xs font-black text-gray-500 uppercase tracking-wide">Client</th>
                <th className="text-right px-3 py-3 text-xs font-black text-gray-500 uppercase tracking-wide">Revenue</th>
                <th className="text-center px-3 py-3 text-xs font-black text-gray-500 uppercase tracking-wide">Invoices</th>
                <th className="text-center px-3 py-3 text-xs font-black text-gray-500 uppercase tracking-wide">Paid</th>
                <th className="text-center px-3 py-3 text-xs font-black text-gray-500 uppercase tracking-wide">Overdue</th>
                <th className="text-center px-3 py-3 text-xs font-black text-gray-500 uppercase tracking-wide">Pay Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedClients.map((c, idx) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3.5">
                    <span className={`text-xs font-black ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-700' : 'text-gray-300'}`}>
                      #{idx + 1}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <p className="font-bold text-gray-900 truncate max-w-[140px]" title={c.name}>{c.name}</p>
                    {c.company && <p className="text-xs text-gray-400 truncate max-w-[140px]">{c.company}</p>}
                  </td>
                  <td className="px-3 py-3.5 text-right font-black text-gray-900 tabular-nums" title={fmt(c.totalRevenue)}>
                    {fmtCompact(c.totalRevenue)}
                  </td>
                  <td className="px-3 py-3.5 text-center font-bold text-gray-600 tabular-nums">{c.totalInvoices}</td>
                  <td className="px-3 py-3.5 text-center font-bold text-green-700 tabular-nums">{c.paidCount}</td>
                  <td className="px-3 py-3.5 text-center tabular-nums">
                    <span className={`font-bold ${c.overdueCount > 0 ? 'text-red-600' : 'text-gray-300'}`}>
                      {c.overdueCount > 0 ? c.overdueCount : '—'}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center justify-center gap-2">
                      {c.collectionRate !== null ? (
                        <>
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${c.collectionRate}%`, background: c.collectionRate >= 80 ? '#10B981' : c.collectionRate >= 60 ? '#F59E0B' : '#EF4444' }}
                            />
                          </div>
                          <span className={`text-xs font-black tabular-nums ${c.collectionRate >= 80 ? 'text-green-700' : c.collectionRate >= 60 ? 'text-amber-700' : 'text-red-700'}`}>
                            {c.collectionRate}%
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-300 text-xs font-bold">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── VIEW: Revenue Chart ────────────────────────────────────────────── */}
      {viewMode === 'revenue' && (
        <div>
          {revenueChartData.length === 0 ? (
            <p className="text-center text-gray-400 font-medium py-10">No paid revenue to chart yet.</p>
          ) : (
            <div style={{ width: '100%', height: Math.max(240, revenueChartData.length * 40) }}>
              <ResponsiveContainer width="100%" height="100%">
                {/* @ts-ignore */}
                <BarChart
                  data={revenueChartData}
                  layout="vertical"
                  margin={{ top: 4, right: 80, bottom: 4, left: 8 }}
                  barCategoryGap="20%"
                >
                  {/* @ts-ignore */}
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                  {/* @ts-ignore */}
                  <XAxis
                    type="number"
                    stroke="none"
                    tickFormatter={(v: number) => {
                      if (v >= 999_500) return `$${(v/1_000_000).toFixed(1)}M`
                      if (v >= 10_000)  return `$${(v/1_000).toFixed(0)}K`
                      return `$${v}`
                    }}
                    tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 600 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  {/* @ts-ignore */}
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={96}
                    stroke="none"
                    tick={{ fill: '#374151', fontSize: 12, fontWeight: 700 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  {/* @ts-ignore */}
                  <Tooltip content={<RevenueTooltip />} cursor={{ fill: '#F9FAFB' }} />
                  {/* @ts-ignore */}
                  <Bar dataKey="revenue" radius={[0, 6, 6, 0]} maxBarSize={28}>
                    {revenueChartData.map((_, i) => (
                      // @ts-ignore
                      <Cell key={i} fill={i === 0 ? '#1D4ED8' : i === 1 ? '#2563EB' : '#3B82F6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ── VIEW: Pay Rate Chart ───────────────────────────────────────────── */}
      {viewMode === 'rate' && (
        <div className="space-y-3">
          {sortedClients
            .filter(c => c.totalSent > 0)
            .map((c, idx) => {
              const rate = c.collectionRate ?? 0
              const color = rate >= 80 ? '#10B981' : rate >= 60 ? '#F59E0B' : '#EF4444'
              const label = rate >= 80 ? 'Reliable' : rate >= 60 ? 'Moderate' : 'At Risk'
              return (
                <div key={c.id} className="flex items-center gap-4">
                  <span className={`text-xs font-black w-5 flex-shrink-0 text-right ${idx === 0 ? 'text-amber-500' : 'text-gray-300'}`}>
                    #{idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <span className="text-sm font-bold text-gray-900 truncate">{c.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full`}
                          style={{ background: color + '22', color }}>
                          {label}
                        </span>
                        <span className="text-sm font-black tabular-nums" style={{ color }}>
                          {rate}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${rate}%`, background: color }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 font-medium mt-1">
                      {c.paidCount} of {c.totalSent} invoices paid
                      {c.overdueCount > 0 && ` · ${c.overdueCount} currently overdue`}
                    </p>
                  </div>
                </div>
              )
            })}
          {sortedClients.filter(c => c.totalSent > 0).length === 0 && (
            <p className="text-center text-gray-400 font-medium py-10">No invoices sent yet.</p>
          )}
        </div>
      )}

    </div>
  )
}