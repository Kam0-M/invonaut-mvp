import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ExpenseForm from '@/components/expenses/expense-form'

export default async function NewExpensePage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier, stripe_subscription_id, subscription_status')
    .eq('id', user.id)
    .single()

  const hasActiveSubscription = !!profile?.stripe_subscription_id &&
    (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')

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
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/expenses"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg transition-all font-bold text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Add Expense</h1>
          <p className="text-gray-500 mt-1 font-medium">Track a new business expense</p>
        </div>
      </div>

      <ExpenseForm clients={clients} hasPro={hasPro} />
    </div>
  )
}