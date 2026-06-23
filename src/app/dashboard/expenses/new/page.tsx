import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ExpenseForm from '@/components/expenses/expense-form'
import { isSubscriptionActive } from '@/lib/subscription-status'

export default async function NewExpensePage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier, stripe_subscription_id, subscription_status, trial_end_date')
    .eq('id', user.id)
    .single()

  const hasActiveSubscription = isSubscriptionActive(profile)

  if (!hasActiveSubscription) redirect('/dashboard/expenses')

  const tier = profile?.subscription_tier ?? 'starter'
  const hasPro = tier === 'professional' || tier === 'business'

  const { data: clientsData } = await supabase
    .from('clients')
    .select('id, name, company')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  const clients = (clientsData ?? []) as { id: string; name: string; company: string | null }[]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Link href="/dashboard/expenses" className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors mb-2 block">
          ← Expenses
        </Link>
        <h1 className="text-2xl font-black text-gray-900">Add Expense</h1>
      </div>

      <ExpenseForm clients={clients} hasPro={hasPro} />
    </div>
  )
}