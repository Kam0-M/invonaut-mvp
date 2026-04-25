import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InvoiceList } from '@/components/invoices/invoice-list'
import { Plus, FileText, Lock, Zap, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'
import ViewOnlyBanner from '@/components/view-only-banner'
import { getInvoiceDisplayStatus } from '@/lib/utils/invoice-status'
import CoreTabBar from '@/components/layout/core-tab-bar'

function formatCompact(n: number): string {
  if (n >= 999_500) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000)  return `$${(n / 1_000).toFixed(0)}K`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export default async function InvoicesPage() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_subscription_id, subscription_status')
    .eq('id', user.id)
    .single()

  const hasActiveSubscription = !!profile?.stripe_subscription_id &&
    (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')

  const { data: allInvoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, issue_date, due_date, total_amount, status, last_followed_up, ai_risk_score, clients(name, company)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(500)

  const invoices = (allInvoices ?? []).map((inv: any) => ({
    ...inv,
    displayStatus: getInvoiceDisplayStatus({ status: inv.status, due_date: inv.due_date }),
    clients: Array.isArray(inv.clients) && inv.clients.length > 0 ? inv.clients[0] : inv.clients,
  }))

  const totalValue   = invoices.reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0)
  const paidValue    = invoices.filter((i: any) => i.displayStatus === 'paid').reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0)
  const overdueCount = invoices.filter((i: any) => i.displayStatus === 'overdue').length
  const sentCount    = invoices.filter((i: any) => i.displayStatus === 'sent').length

  return (
    <div className="space-y-6">
      {/* Tab bar — matches demo */}
      <CoreTabBar />

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Invoice pipeline</p>
            {invoices.length > 0 && (
              <div className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                <Zap className="w-3 h-3" />AI scoring active
              </div>
            )}
          </div>
          {invoices.length > 0 && (
            <div className="flex items-center gap-4">
              {[
                { label: 'Total',    value: formatCompact(totalValue), color: 'text-gray-900' },
                { label: 'Paid',     value: formatCompact(paidValue),  color: 'text-emerald-600' },
                { label: 'Awaiting', value: String(sentCount),          color: 'text-blue-600' },
                { label: 'Overdue',  value: String(overdueCount),       color: 'text-red-500' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <span className={`text-sm font-black ${s.color}`}>{s.value}</span>
                  <span className="text-xs text-gray-400 font-medium">{s.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          {hasActiveSubscription ? (
            <Link href="/dashboard/invoices/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all hover:shadow-md">
              <Plus className="w-4 h-4" />New Invoice
            </Link>
          ) : (
            <button disabled className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-400 font-bold text-sm cursor-not-allowed">
              <Lock className="w-4 h-4" />New Invoice
            </button>
          )}
        </div>
      </div>

      {!hasActiveSubscription && <ViewOnlyBanner />}

      {/* Empty state */}
      {invoices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="h-1 inv-animated-bar" />
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-2">No invoices yet</h3>
            <p className="text-sm text-gray-500 font-medium max-w-sm mx-auto mb-6">
              Create your first invoice and Invonaut starts watching it immediately — AI scores payment risk, automated reminders fire when it goes overdue.
            </p>
            {hasActiveSubscription ? (
              <Link href="/dashboard/invoices/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all hover:shadow-md">
                <Plus className="w-4 h-4" />Create Your First Invoice
              </Link>
            ) : (
              <Link href="/pricing"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all">
                <Lock className="w-4 h-4" />Start Free Trial
              </Link>
            )}
          </div>
        </div>
      ) : (
        <InvoiceList invoices={invoices} hasActiveSubscription={hasActiveSubscription} />
      )}
    </div>
  )
}
