// src/app/dashboard/reports/page.tsx
export const dynamic = 'force-dynamic'

import { redirect }     from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getInvoiceDisplayStatus } from '@/lib/utils/invoice-status'
import { ReportsClient } from '@/components/reports/reports-client'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profileRaw },
    { data: invoicesRaw },
    { data: directPaymentsRaw },
    { data: expensesRaw },
    { data: revCategoriesRaw },
    { data: assetsRaw },
    { data: liabilitiesRaw },
    { data: cashSnapshots },
  ] = await Promise.all([
    supabase.from('user_profiles').select('business_name, full_name, subscription_tier').eq('id', user.id).single(),
    supabase.from('invoices').select('id, status, issue_date, due_date, total_amount, revenue_category_id').eq('user_id', user.id),
    supabase.from('direct_payments').select('id, amount, payment_date, revenue_category_id, payment_type, payment_method, description').eq('user_id', user.id),
    supabase.from('expenses').select('id, amount, date, category, description, vendor').eq('user_id', user.id),
    supabase.from('revenue_categories').select('id, name, color').eq('user_id', user.id),
    supabase.from('assets').select('*').eq('user_id', user.id).order('purchase_date', { ascending: false }),
    supabase.from('liabilities').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('cash_snapshots').select('balance, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
  ])

  const invoices = (invoicesRaw ?? []).map((inv: any) => ({
    ...inv,
    displayStatus: getInvoiceDisplayStatus({ status: inv.status, due_date: inv.due_date }),
  }))

  const latestCash = cashSnapshots?.[0]?.balance ?? null

  return (
    <ReportsClient
      businessName={profileRaw?.business_name || profileRaw?.full_name || 'My Business'}
      tier={profileRaw?.subscription_tier ?? 'starter'}
      invoices={invoices}
      directPayments={directPaymentsRaw ?? []}
      expenses={expensesRaw ?? []}
      revCategories={revCategoriesRaw ?? []}
      initialAssets={assetsRaw ?? []}
      initialLiabilities={liabilitiesRaw ?? []}
      latestCashBalance={latestCash}
    />
  )
}
