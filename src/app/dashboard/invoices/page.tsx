import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InvoiceList } from '@/components/invoices/invoice-list'
import { Plus, FileText, Lock, Zap, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'
import ViewOnlyBanner from '@/components/view-only-banner'
import { getInvoiceDisplayStatus } from '@/lib/utils/invoice-status'

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
    .select('id, invoice_number, issue_date, due_date, total_amount, status, last_followed_up, clients(name, company)')
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
    <div className="space-y-0">
      {/* Dark gradient hero header — matches landing page aesthetic */}
      <div className="relative overflow-hidden rounded-2xl mb-8"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)' }} />

        <div className="relative z-10 p-8 sm:p-10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">Invoices</h1>
              </div>
              <p className="text-white/50 font-medium text-sm mt-1">
                {invoices.length === 0
                  ? 'Send your first invoice to start getting paid'
                  : `${invoices.length} invoice${invoices.length !== 1 ? 's' : ''} · ${formatCompact(totalValue)} total value`}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              {hasActiveSubscription ? (
                <Link href="/dashboard/invoices/new"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm hover:shadow-lg hover:scale-[1.02] transition-all w-full sm:w-auto">
                  <Plus className="w-4 h-4" />Create Invoice
                </Link>
              ) : (
                <button disabled
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 text-white/40 font-bold text-sm cursor-not-allowed w-full sm:w-auto">
                  <Lock className="w-4 h-4" />Create Invoice
                </button>
              )}
              {invoices.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-xs text-white/40 font-medium">AI risk scoring active</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats row — only when data exists */}
          {invoices.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-8 border-t border-white/[0.08]">
              {[
                { label: 'Total value',   value: formatCompact(totalValue),          icon: TrendingUp,   color: 'text-blue-400'  },
                { label: 'Collected',     value: formatCompact(paidValue),           icon: CheckCircle2, color: 'text-teal-400'  },
                { label: 'Awaiting',      value: String(sentCount),                  icon: Clock,        color: 'text-amber-400' },
                { label: 'Overdue',       value: String(overdueCount),               icon: Zap,          color: 'text-red-400'   },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <s.icon className={`w-4 h-4 ${s.color} flex-shrink-0`} />
                  <div className="min-w-0">
                    <p className={`text-lg font-black ${s.color} leading-none`}>{s.value}</p>
                    <p className="text-xs text-white/40 font-medium mt-0.5">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!hasActiveSubscription && <ViewOnlyBanner />}

      {/* Empty state */}
      {invoices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Animated cycling top accent */}
          <style>{`
            @keyframes inv-gradient-shift {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
            }
            .inv-animated-bar {
              background: linear-gradient(90deg, #2563EB, #0D9488, #7C3AED, #DB2777, #2563EB);
              background-size: 300% 100%;
              animation: inv-gradient-shift 4s ease-in-out infinite;
            }
          `}</style>
          <div className="h-1 inv-animated-bar" />
          <div className="p-12 sm:p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-3">No invoices yet</h3>
            <p className="text-gray-500 font-medium max-w-md mx-auto mb-2">
              {hasActiveSubscription
                ? 'Create your first invoice and Invonaut starts tracking it immediately — AI scores payment risk, automated reminders fire when it goes overdue.'
                : 'Subscribe to start creating invoices. AI tracks payment risk and sends automated reminders without you lifting a finger.'}
            </p>
            <p className="text-sm text-gray-400 mb-8">Once you send an invoice, the system watches it for you.</p>
            {hasActiveSubscription ? (
              <Link href="/dashboard/invoices/new"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold hover:shadow-lg hover:scale-[1.02] transition-all">
                <Plus className="w-5 h-5" />Create Your First Invoice
              </Link>
            ) : (
              <Link href="/pricing"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold hover:shadow-lg transition-all">
                <Lock className="w-5 h-5" />Start 14-Day Free Trial
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <InvoiceList invoices={invoices} hasActiveSubscription={hasActiveSubscription} />
        </div>
      )}
    </div>
  )
}
