'use client'
// src/components/reports/reports-client.tsx
// Financial Reports hub. Three tabs: P&L Statement · Period Breakdown · Balance Sheet
// Design: matches editorial quality of landing/affiliate pages.
// All filtering and calculation done client-side — data passed from server component.

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  TrendingUp, TrendingDown, Lock, Printer,
  ChevronDown, BarChart2, FileText, Scale,
  ArrowUpRight, ArrowDownRight, Minus,
  Info,
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Invoice {
  id: string
  status: string
  displayStatus: string
  issue_date: string
  due_date: string
  total_amount: number
  revenue_category_id: string | null
}
interface DirectPayment {
  id: string
  amount: number
  payment_date: string
  revenue_category_id: string | null
  payment_type: string
  payment_method: string
  description: string
}
interface Expense {
  id: string
  amount: number
  date: string
  category: string
  description: string
  vendor: string
}
interface RevCategory {
  id: string
  name: string
  color: string
}
interface Props {
  businessName: string
  tier: string
  invoices: Invoice[]
  directPayments: DirectPayment[]
  expenses: Expense[]
  revCategories: RevCategory[]
}

// ─── Date range helpers ────────────────────────────────────────────────────────
function rangeFor(key: string): { start: Date; end: Date; label: string } {
  const now   = new Date()
  const y     = now.getFullYear()
  const m     = now.getMonth()

  const ranges: Record<string, { start: Date; end: Date; label: string }> = {
    this_month:   { start: new Date(y, m, 1),     end: new Date(y, m+1, 0),     label: now.toLocaleString('default',{month:'long',year:'numeric'}) },
    last_month:   { start: new Date(y, m-1, 1),   end: new Date(y, m, 0),       label: new Date(y,m-1,1).toLocaleString('default',{month:'long',year:'numeric'}) },
    this_quarter: { start: new Date(y, Math.floor(m/3)*3, 1), end: new Date(y, Math.floor(m/3)*3+3, 0), label: `Q${Math.floor(m/3)+1} ${y}` },
    last_quarter: { start: new Date(y, Math.floor(m/3)*3-3, 1), end: new Date(y, Math.floor(m/3)*3, 0), label: `Q${Math.floor(m/3)||4} ${Math.floor(m/3)?y:y-1}` },
    this_year:    { start: new Date(y, 0, 1),      end: new Date(y, 11, 31),     label: `Full Year ${y}` },
    last_year:    { start: new Date(y-1, 0, 1),    end: new Date(y-1, 11, 31),   label: `Full Year ${y-1}` },
    all_time:     { start: new Date(2020, 0, 1),   end: new Date(y+1, 0, 1),     label: 'All Time' },
  }
  return ranges[key] || ranges['this_year']
}

function inRange(dateStr: string, start: Date, end: Date): boolean {
  const d = new Date(dateStr + 'T12:00:00') // UTC midnight bug prevention
  return d >= start && d <= end
}

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)

const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const EXPENSE_COLORS: Record<string, string> = {
  software: '#0066FF', hardware: '#6B7280', travel: '#F59E0B',
  meals: '#FF6B35', marketing: '#EC4899', office: '#00D4AA',
  professional: '#6366F1', utilities: '#14B8A6', education: '#8B5CF6',
  insurance: '#22C55E', taxes: '#EF4444', other: '#9CA3AF',
}
function expColor(cat: string) { return EXPENSE_COLORS[cat?.toLowerCase()] || '#94A3B8' }

// ─── Shared CSS ───────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..800&family=DM+Sans:opsz,wght@9..40,300..700&family=DM+Mono:ital,wght@0,400;0,500&display=swap');
  .f-display { font-family:'Fraunces',serif; font-optical-sizing:auto; }
  .f-mono    { font-family:'DM Mono',monospace; }

  .rpt-tab {
    padding: 9px 20px; border-radius: 9px; font-size: .82rem; font-weight: 700;
    border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 7px;
    transition: background .15s, color .15s;
    font-family: 'DM Sans', sans-serif;
  }
  .rpt-tab-active  { background: #0A0A0A; color: #fff; }
  .rpt-tab-inactive { background: transparent; color: #64748B; }
  .rpt-tab-inactive:hover { background: #F1F5F9; color: #374151; }

  .rpt-range-btn {
    padding: 7px 14px; border-radius: 7px; font-size: .75rem; font-weight: 700;
    border: 1px solid #E2E8F0; cursor: pointer; background: #fff; color: #64748B;
    transition: all .12s; font-family: 'DM Sans', sans-serif; white-space: nowrap;
  }
  .rpt-range-btn:hover  { border-color: #0055FF; color: #0055FF; background: rgba(0,85,255,0.03); }
  .rpt-range-btn-active { border-color: #0055FF !important; color: #0055FF !important; background: rgba(0,85,255,0.06) !important; }

  .rpt-stat {
    background: #fff; border: 1px solid #E2E8F0; border-radius: 16px; padding: 24px 24px 20px;
    transition: box-shadow .15s, transform .15s;
  }
  .rpt-stat:hover { box-shadow: 0 4px 20px rgba(0,85,255,0.07); transform: translateY(-1px); }

  .rpt-section {
    background: #fff; border: 1px solid #E2E8F0; border-radius: 16px;
    overflow: hidden;
  }
  .rpt-section-head {
    padding: 20px 24px 16px; border-bottom: 1px solid #F1F5F9;
  }
  .rpt-table { width: 100%; border-collapse: collapse; }
  .rpt-table th {
    font-size: .66rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em;
    color: #94A3B8; padding: 0 24px 12px; text-align: left; border-bottom: 1px solid #E2E8F0;
  }
  .rpt-table th:not(:first-child) { text-align: right; }
  .rpt-table td {
    font-size: .83rem; color: #374151; padding: 13px 24px;
    border-bottom: 1px solid #F8FAFC;
  }
  .rpt-table td:not(:first-child) { text-align: right; font-family: 'DM Mono', monospace; font-size: .79rem; }
  .rpt-table tr:last-child td { border-bottom: none; }
  .rpt-table tbody tr:hover td { background: #F8FAFF; }
  .rpt-total-row td {
    font-weight: 800; border-top: 2px solid #E2E8F0 !important;
    border-bottom: none !important; padding-top: 14px; background: #F8FAFF;
  }

  .bar-track { background: #F1F5F9; border-radius: 4px; height: 6px; flex: 1; }
  .bar-fill  { height: 6px; border-radius: 4px; transition: width .4s; }

  .period-bar-wrap { display: flex; flex-direction: column; gap: 3px; align-items: center; flex: 1; }
  .period-bar      { width: 100%; border-radius: 4px 4px 0 0; transition: height .3s; min-height: 2px; }

  .locked-overlay {
    background: rgba(248,250,255,0.92); backdrop-filter: blur(6px);
    border-radius: 16px; border: 1px solid #E2E8F0; padding: 64px 32px;
    text-align: center;
  }

  @media print {
    .no-print { display: none !important; }
    body { background: white; }
    .rpt-stat, .rpt-section { box-shadow: none; border: 1px solid #e2e8f0; }
  }
`

// ─── Bar chart for period breakdown ───────────────────────────────────────────
function PeriodChart({ rows }: { rows: { label: string; revenue: number; expenses: number; profit: number }[] }) {
  const maxVal = Math.max(...rows.flatMap(r => [r.revenue, r.expenses]), 1)
  const BAR_H  = 160

  return (
    <div style={{ padding: '24px 24px 0' }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: BAR_H + 28 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', width: '100%', height: BAR_H }}>
              <div
                style={{
                  flex: 1, borderRadius: '3px 3px 0 0', background: 'linear-gradient(180deg,#0066FF,#0044CC)',
                  height: `${Math.round((r.revenue / maxVal) * BAR_H)}px`,
                  minHeight: r.revenue > 0 ? 3 : 0, transition: 'height .3s',
                  opacity: 0.85,
                }}
                title={`Revenue: ${fmtCurrency(r.revenue)}`}
              />
              <div
                style={{
                  flex: 1, borderRadius: '3px 3px 0 0', background: 'linear-gradient(180deg,#FF6B35,#E04E20)',
                  height: `${Math.round((r.expenses / maxVal) * BAR_H)}px`,
                  minHeight: r.expenses > 0 ? 3 : 0, transition: 'height .3s',
                  opacity: 0.75,
                }}
                title={`Expenses: ${fmtCurrency(r.expenses)}`}
              />
            </div>
            <span style={{ fontSize: '.6rem', color: '#94A3B8', fontWeight: 600, letterSpacing: '.02em' }}>
              {r.label}
            </span>
          </div>
        ))}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, padding: '16px 0 20px', borderTop: '1px solid #F1F5F9', marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#0066FF', display: 'inline-block' }}/>
          <span style={{ fontSize: '.72rem', fontWeight: 600, color: '#64748B' }}>Revenue</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#FF6B35', display: 'inline-block' }}/>
          <span style={{ fontSize: '.72rem', fontWeight: 600, color: '#64748B' }}>Expenses</span>
        </div>
      </div>
    </div>
  )
}

// ─── Category bar row ──────────────────────────────────────────────────────────
function CategoryRow({ name, amount, total, color }: { name: string; amount: number; total: number; color: string }) {
  const pct = total > 0 ? (amount / total) * 100 : 0
  return (
    <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }}/>
      <span style={{ flex: 1, fontSize: '.82rem', color: '#374151', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </span>
      <div className="bar-track" style={{ maxWidth: 100 }}>
        <div className="bar-fill" style={{ width: `${pct}%`, background: color }}/>
      </div>
      <span style={{ fontSize: '.78rem', color: '#94A3B8', fontWeight: 600, minWidth: 36, textAlign: 'right' }}>
        {pct.toFixed(0)}%
      </span>
      <span className="f-mono" style={{ fontSize: '.78rem', color: '#0A0A0A', fontWeight: 700, minWidth: 88, textAlign: 'right' }}>
        {fmtCurrency(amount)}
      </span>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export function ReportsClient({ businessName, tier, invoices, directPayments, expenses, revCategories }: Props) {
  const [tab,      setTab]      = useState<'pl' | 'period' | 'balance'>('pl')
  const [rangeKey, setRangeKey] = useState('this_year')

  const range = rangeFor(rangeKey)

  // ── Core filtered data ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const { start, end } = range

    const paidInvoices = invoices.filter(i =>
      i.displayStatus === 'paid' && inRange(i.issue_date, start, end)
    )
    const payments = directPayments.filter(p =>
      inRange(p.payment_date, start, end)
    )
    const exps = expenses.filter(e =>
      inRange(e.date, start, end)
    )

    const invoiceRevenue = paidInvoices.reduce((s, i) => s + Number(i.total_amount || 0), 0)
    const paymentRevenue = payments.reduce((s, p)     => s + Number(p.amount || 0), 0)
    const totalRevenue   = invoiceRevenue + paymentRevenue
    const totalExpenses  = exps.reduce((s, e)          => s + Number(e.amount || 0), 0)
    const grossProfit    = totalRevenue - totalExpenses
    const profitMargin   = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

    // Revenue by category
    const catMap = new Map<string, { name: string; color: string; amount: number }>()
    const addRev = (amount: number, catId: string | null) => {
      const cat = revCategories.find(c => c.id === catId)
      const key = cat?.id || '__uncategorised__'
      const cur = catMap.get(key) || { name: cat?.name || 'Uncategorised', color: cat?.color || '#94A3B8', amount: 0 }
      catMap.set(key, { ...cur, amount: cur.amount + amount })
    }
    paidInvoices.forEach(i => addRev(Number(i.total_amount || 0), i.revenue_category_id))
    payments.forEach(p     => addRev(Number(p.amount || 0),       p.revenue_category_id))
    const revByCategory = Array.from(catMap.values()).sort((a, b) => b.amount - a.amount)

    // Expense by category
    const expCatMap = new Map<string, { name: string; color: string; amount: number }>()
    exps.forEach(e => {
      const key = e.category || 'other'
      const cur = expCatMap.get(key) || { name: (e.category || 'Other'), color: expColor(e.category), amount: 0 }
      expCatMap.set(key, { ...cur, amount: cur.amount + Number(e.amount || 0) })
    })
    const expByCategory = Array.from(expCatMap.values()).sort((a, b) => b.amount - a.amount)

    return {
      paidInvoices, payments, exps,
      invoiceRevenue, paymentRevenue, totalRevenue, totalExpenses, grossProfit, profitMargin,
      revByCategory, expByCategory,
    }
  }, [invoices, directPayments, expenses, revCategories, rangeKey])

  // ── 12-month period data (always last 12 months, not range-sensitive) ───────
  const periodRows = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
      const y = d.getFullYear(), m = d.getMonth()
      const start = new Date(y, m, 1), end = new Date(y, m+1, 0)

      const rev = invoices.filter(inv => inv.displayStatus === 'paid' && inRange(inv.issue_date, start, end))
                          .reduce((s, i) => s + Number(i.total_amount || 0), 0)
               + directPayments.filter(p => inRange(p.payment_date, start, end))
                                .reduce((s, p) => s + Number(p.amount || 0), 0)
      const exp = expenses.filter(e => inRange(e.date, start, end))
                          .reduce((s, e) => s + Number(e.amount || 0), 0)

      return { label: MONTHS[m], y, m, revenue: rev, expenses: exp, profit: rev - exp }
    })
  }, [invoices, directPayments, expenses])

  const RANGE_OPTS = [
    { key: 'this_month',   label: 'This month'   },
    { key: 'last_month',   label: 'Last month'   },
    { key: 'this_quarter', label: 'This quarter' },
    { key: 'last_quarter', label: 'Last quarter' },
    { key: 'this_year',    label: 'This year'    },
    { key: 'last_year',    label: 'Last year'    },
    { key: 'all_time',     label: 'All time'     },
  ]

  const { totalRevenue, totalExpenses, grossProfit, profitMargin, revByCategory, expByCategory } = filtered

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", color: '#0A0A0A', maxWidth: 1100, margin: '0 auto' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }}/>

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <Link href="/dashboard" style={{ fontSize: '.75rem', fontWeight: 700, color: '#94A3B8', textDecoration: 'none', letterSpacing: '.02em' }}>
          ← Dashboard
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginTop: 12 }}>
          <div>
            <h1 className="f-display" style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 800, letterSpacing: '-.022em', lineHeight: 1.08, color: '#0A0A0A', marginBottom: 5 }}>
              Financial Reports
            </h1>
            <p style={{ fontSize: '.875rem', color: '#64748B' }}>{businessName}</p>
          </div>
          <button
            onClick={() => window.print()}
            className="no-print"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', border: '1px solid #E2E8F0', borderRadius: 9, background: '#fff', color: '#374151', fontWeight: 600, fontSize: '.8rem', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
            <Printer size={14}/> Print / Export
          </button>
        </div>
      </div>

      {/* ── Tab bar ───────────────────────────────────────────────────────── */}
      <div className="no-print" style={{ display: 'flex', gap: 4, padding: '4px', background: '#F8FAFF', borderRadius: 12, width: 'fit-content', marginBottom: 28, border: '1px solid #E2E8F0' }}>
        {[
          { key: 'pl',      label: 'P&L Statement',    icon: FileText  },
          { key: 'period',  label: 'Period Breakdown',  icon: BarChart2 },
          { key: 'balance', label: 'Balance Sheet',     icon: Scale     },
        ].map(t => (
          <button
            key={t.key}
            className={`rpt-tab ${tab === t.key ? 'rpt-tab-active' : 'rpt-tab-inactive'}`}
            onClick={() => setTab(t.key as any)}
          >
            <t.icon size={13}/>
            {t.label}
            {t.key === 'balance' && <Lock size={11} style={{ opacity: .5 }}/>}
          </button>
        ))}
      </div>

      {/* ── Date range — shown on P&L and Period tabs ─────────────────────── */}
      {tab !== 'balance' && (
        <div className="no-print" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 28, alignItems: 'center' }}>
          <span style={{ fontSize: '.72rem', fontWeight: 700, color: '#94A3B8', letterSpacing: '.06em', textTransform: 'uppercase', marginRight: 4 }}>Period</span>
          {RANGE_OPTS.map(o => (
            <button
              key={o.key}
              className={`rpt-range-btn ${rangeKey === o.key ? 'rpt-range-btn-active' : ''}`}
              onClick={() => setRangeKey(o.key)}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1 — P&L Statement                                               */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {tab === 'pl' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Period label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="f-display" style={{ fontSize: '1rem', fontWeight: 700, color: '#0A0A0A', letterSpacing: '-.01em' }}>
              {range.label}
            </span>
            <span style={{ fontSize: '.72rem', color: '#94A3B8', fontWeight: 600 }}>— Profit & Loss Statement</span>
          </div>

          {/* 4 stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {[
              {
                label: 'Total Revenue',
                value: fmtCurrency(totalRevenue),
                sub: `${filtered.paidInvoices.length} invoices + ${filtered.payments.length} direct payments`,
                color: '#0055FF', bg: 'rgba(0,85,255,0.05)',
                icon: TrendingUp,
              },
              {
                label: 'Total Expenses',
                value: fmtCurrency(totalExpenses),
                sub: `${filtered.exps.length} expense entries`,
                color: '#FF6B35', bg: 'rgba(255,107,53,0.05)',
                icon: TrendingDown,
              },
              {
                label: 'Gross Profit',
                value: fmtCurrency(grossProfit),
                sub: grossProfit >= 0 ? 'Net positive' : 'Net loss',
                color: grossProfit >= 0 ? '#16A34A' : '#DC2626',
                bg: grossProfit >= 0 ? 'rgba(22,163,74,0.05)' : 'rgba(220,38,38,0.05)',
                icon: grossProfit >= 0 ? ArrowUpRight : ArrowDownRight,
              },
              {
                label: 'Profit Margin',
                value: totalRevenue > 0 ? `${profitMargin.toFixed(1)}%` : '—',
                sub: profitMargin >= 20 ? 'Healthy margin' : profitMargin >= 0 ? 'Below average' : 'Loss margin',
                color: profitMargin >= 20 ? '#16A34A' : profitMargin >= 0 ? '#D97706' : '#DC2626',
                bg: profitMargin >= 20 ? 'rgba(22,163,74,0.05)' : 'rgba(248,250,255,1)',
                icon: Minus,
              },
            ].map(c => (
              <div key={c.label} className="rpt-stat">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <p style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94A3B8' }}>
                    {c.label}
                  </p>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <c.icon size={14} color={c.color}/>
                  </div>
                </div>
                <p className="f-display" style={{ fontSize: '1.65rem', fontWeight: 800, color: c.color, letterSpacing: '-.02em', marginBottom: 5 }}>
                  {c.value}
                </p>
                <p style={{ fontSize: '.72rem', color: '#94A3B8' }}>{c.sub}</p>
              </div>
            ))}
          </div>

          {/* P&L summary table */}
          <div className="rpt-section">
            <div className="rpt-section-head">
              <p style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#94A3B8', marginBottom: 4 }}>Summary</p>
              <p className="f-display" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0A0A0A', letterSpacing: '-.02em' }}>Profit & Loss — {range.label}</p>
            </div>
            <table className="rpt-table">
              <thead>
                <tr>
                  <th style={{ paddingTop: 16 }}>Item</th>
                  <th style={{ paddingTop: 16 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 700, color: '#0A0A0A' }}>Revenue</td>
                  <td/>
                </tr>
                <tr>
                  <td style={{ paddingLeft: 40, color: '#6B7280' }}>Invoice payments received</td>
                  <td style={{ color: '#0A0A0A', fontWeight: 600 }}>{fmtCurrency(filtered.invoiceRevenue)}</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: 40, color: '#6B7280' }}>Direct payments</td>
                  <td style={{ color: '#0A0A0A', fontWeight: 600 }}>{fmtCurrency(filtered.paymentRevenue)}</td>
                </tr>
                <tr style={{ borderTop: '1px solid #E2E8F0' }}>
                  <td style={{ fontWeight: 800, color: '#0055FF', paddingLeft: 40 }}>Total Revenue</td>
                  <td style={{ fontWeight: 800, color: '#0055FF' }}>{fmtCurrency(totalRevenue)}</td>
                </tr>
                <tr><td style={{ paddingTop: 8, color: '#fff' }}>–</td><td/></tr>
                <tr>
                  <td style={{ fontWeight: 700, color: '#0A0A0A' }}>Expenses</td>
                  <td/>
                </tr>
                {expByCategory.length === 0 ? (
                  <tr>
                    <td style={{ paddingLeft: 40, color: '#94A3B8', fontStyle: 'italic' }}>No expenses recorded</td>
                    <td style={{ color: '#94A3B8' }}>{fmtCurrency(0)}</td>
                  </tr>
                ) : expByCategory.map(c => (
                  <tr key={c.name}>
                    <td style={{ paddingLeft: 40, color: '#6B7280', textTransform: 'capitalize' }}>{c.name}</td>
                    <td style={{ color: '#FF6B35', fontWeight: 600 }}>({fmtCurrency(c.amount)})</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '1px solid #E2E8F0' }}>
                  <td style={{ fontWeight: 800, color: '#FF6B35', paddingLeft: 40 }}>Total Expenses</td>
                  <td style={{ fontWeight: 800, color: '#FF6B35' }}>({fmtCurrency(totalExpenses)})</td>
                </tr>
                <tr><td style={{ paddingTop: 4, color: '#fff' }}>–</td><td/></tr>
              </tbody>
              <tfoot>
                <tr className="rpt-total-row">
                  <td style={{ color: grossProfit >= 0 ? '#16A34A' : '#DC2626', fontSize: '.9rem' }}>
                    NET {grossProfit >= 0 ? 'PROFIT' : 'LOSS'} — {range.label}
                  </td>
                  <td style={{ color: grossProfit >= 0 ? '#16A34A' : '#DC2626', fontSize: '.9rem' }}>
                    {fmtCurrency(Math.abs(grossProfit))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Revenue + Expense breakdowns side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* Revenue by category */}
            <div className="rpt-section">
              <div className="rpt-section-head">
                <p style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#94A3B8', marginBottom: 4 }}>Revenue breakdown</p>
                <p style={{ fontWeight: 800, fontSize: '.9rem', color: '#0A0A0A', letterSpacing: '-.01em' }}>By income category</p>
              </div>
              {revByCategory.length === 0 ? (
                <div style={{ padding: '28px 24px', textAlign: 'center' }}>
                  <p style={{ fontSize: '.825rem', color: '#94A3B8' }}>No revenue in this period</p>
                </div>
              ) : (
                <div style={{ padding: '8px 0' }}>
                  {revByCategory.map(c => (
                    <CategoryRow key={c.name} name={c.name} amount={c.amount} total={totalRevenue} color={c.color}/>
                  ))}
                  <div style={{ padding: '12px 24px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '.75rem', fontWeight: 700, color: '#374151' }}>Total</span>
                    <span className="f-mono" style={{ fontSize: '.82rem', fontWeight: 800, color: '#0055FF' }}>{fmtCurrency(totalRevenue)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Expenses by category */}
            <div className="rpt-section">
              <div className="rpt-section-head">
                <p style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#94A3B8', marginBottom: 4 }}>Expense breakdown</p>
                <p style={{ fontWeight: 800, fontSize: '.9rem', color: '#0A0A0A', letterSpacing: '-.01em' }}>By expense category</p>
              </div>
              {expByCategory.length === 0 ? (
                <div style={{ padding: '28px 24px', textAlign: 'center' }}>
                  <p style={{ fontSize: '.825rem', color: '#94A3B8' }}>No expenses in this period</p>
                </div>
              ) : (
                <div style={{ padding: '8px 0' }}>
                  {expByCategory.map(c => (
                    <CategoryRow key={c.name} name={c.name} amount={c.amount} total={totalExpenses} color={c.color}/>
                  ))}
                  <div style={{ padding: '12px 24px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '.75rem', fontWeight: 700, color: '#374151' }}>Total</span>
                    <span className="f-mono" style={{ fontSize: '.82rem', fontWeight: 800, color: '#FF6B35' }}>{fmtCurrency(totalExpenses)}</span>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* No-data notice */}
          {totalRevenue === 0 && totalExpenses === 0 && (
            <div style={{ background: '#F8FAFF', border: '1px solid rgba(0,85,255,0.1)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Info size={14} color="#0055FF"/>
              <p style={{ fontSize: '.82rem', color: '#64748B' }}>
                No financial data found for <strong>{range.label}</strong>. Try a different period or{' '}
                <Link href="/dashboard/invoices" style={{ color: '#0055FF', fontWeight: 600, textDecoration: 'none' }}>record some invoices</Link>.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2 — Period Breakdown                                            */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {tab === 'period' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="f-display" style={{ fontSize: '1rem', fontWeight: 700, color: '#0A0A0A', letterSpacing: '-.01em' }}>
              Last 12 months
            </span>
            <span style={{ fontSize: '.72rem', color: '#94A3B8', fontWeight: 600 }}>— Revenue vs Expenses by month</span>
          </div>

          {/* Chart */}
          <div className="rpt-section">
            <div className="rpt-section-head">
              <p style={{ fontWeight: 800, fontSize: '.9rem', color: '#0A0A0A', letterSpacing: '-.01em' }}>12-month overview</p>
            </div>
            <PeriodChart rows={periodRows}/>
          </div>

          {/* Monthly table */}
          <div className="rpt-section">
            <div className="rpt-section-head">
              <p style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#94A3B8', marginBottom: 4 }}>Month by month</p>
              <p style={{ fontWeight: 800, fontSize: '.9rem', color: '#0A0A0A', letterSpacing: '-.01em' }}>Period statements</p>
            </div>
            <table className="rpt-table">
              <thead>
                <tr>
                  <th style={{ paddingTop: 16 }}>Period</th>
                  <th style={{ paddingTop: 16 }}>Revenue</th>
                  <th style={{ paddingTop: 16 }}>Expenses</th>
                  <th style={{ paddingTop: 16 }}>Net Profit</th>
                  <th style={{ paddingTop: 16 }}>Margin</th>
                </tr>
              </thead>
              <tbody>
                {[...periodRows].reverse().map((r, i) => {
                  const margin = r.revenue > 0 ? (r.profit / r.revenue) * 100 : null
                  const profitColor = r.profit > 0 ? '#16A34A' : r.profit < 0 ? '#DC2626' : '#94A3B8'
                  const hasData = r.revenue > 0 || r.expenses > 0
                  return (
                    <tr key={i} style={{ opacity: hasData ? 1 : 0.4 }}>
                      <td style={{ fontWeight: 600, color: '#0A0A0A' }}>
                        {r.label} {r.y}
                      </td>
                      <td style={{ color: '#0055FF', fontWeight: 600 }}>
                        {r.revenue > 0 ? fmtCurrency(r.revenue) : '—'}
                      </td>
                      <td style={{ color: '#FF6B35', fontWeight: 600 }}>
                        {r.expenses > 0 ? `(${fmtCurrency(r.expenses)})` : '—'}
                      </td>
                      <td style={{ color: profitColor, fontWeight: 800 }}>
                        {hasData ? fmtCurrency(r.profit) : '—'}
                      </td>
                      <td style={{ color: profitColor }}>
                        {margin !== null ? `${margin.toFixed(1)}%` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="rpt-total-row">
                  <td>12-month total</td>
                  <td style={{ color: '#0055FF' }}>{fmtCurrency(periodRows.reduce((s,r) => s+r.revenue, 0))}</td>
                  <td style={{ color: '#FF6B35' }}>({fmtCurrency(periodRows.reduce((s,r) => s+r.expenses, 0))})</td>
                  <td style={{ color: periodRows.reduce((s,r) => s+r.profit, 0) >= 0 ? '#16A34A' : '#DC2626' }}>
                    {fmtCurrency(periodRows.reduce((s,r) => s+r.profit, 0))}
                  </td>
                  <td>
                    {(() => {
                      const rev = periodRows.reduce((s,r) => s+r.revenue, 0)
                      const pro = periodRows.reduce((s,r) => s+r.profit, 0)
                      return rev > 0 ? `${((pro/rev)*100).toFixed(1)}%` : '—'
                    })()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3 — Balance Sheet (placeholder)                                 */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {tab === 'balance' && (
        <div className="locked-overlay">
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#0044EE,#0066FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Scale size={22} color="#fff"/>
          </div>
          <h2 className="f-display" style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-.02em', color: '#0A0A0A', marginBottom: 12 }}>
            Balance Sheet
          </h2>
          <p style={{ fontSize: '.9rem', color: '#64748B', maxWidth: 420, margin: '0 auto 28px', lineHeight: 1.75 }}>
            The balance sheet requires an Asset Register to calculate total assets and derive equity.
            We're building the Asset Register next — once it's live, this will automatically populate
            with a full assets vs. liabilities vs. equity statement.
          </p>
          <div style={{ display: 'inline-grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: '#E2E8F0', borderRadius: 12, overflow: 'hidden', maxWidth: 480, width: '100%', margin: '0 auto' }}>
            {[
              { label: 'Total Assets',      sub: 'Cash + receivables + fixed assets' },
              { label: 'Total Liabilities', sub: 'Outstanding payables' },
              { label: 'Net Equity',        sub: 'Assets minus liabilities' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '20px 16px', background: '#fff', textAlign: 'left' }}>
                <p style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94A3B8', marginBottom: 8 }}>{item.label}</p>
                <p style={{ fontSize: '.75rem', color: '#C4CBDA', lineHeight: 1.5 }}>{item.sub}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '.72rem', color: '#C4CBDA', marginTop: 24 }}>Coming in the next build — Asset Register + Balance Sheet</p>
        </div>
      )}

    </div>
  )
}
