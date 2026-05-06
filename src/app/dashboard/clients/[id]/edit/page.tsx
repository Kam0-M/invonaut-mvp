import { createClient }     from '@/lib/supabase/server'
import { redirect }         from 'next/navigation'
import EditClientForm       from '@/components/clients/edit-client-form'
import Link                 from 'next/link'
import { Users }            from 'lucide-react'
import SubscriptionRequired from '@/components/subscription-required'

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }   = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles').select('stripe_subscription_id, subscription_status')
    .eq('id', user.id).single()

  const hasActiveSubscription = !!profile?.stripe_subscription_id &&
    (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')
  if (!hasActiveSubscription) return <SubscriptionRequired />

  const { data: client, error } = await supabase
    .from('clients').select('*').eq('id', id).eq('user_id', user.id).single()
  if (error || !client) redirect('/dashboard/clients')

  return (
    <div className="space-y-5">
      <div>
        <Link href={`/dashboard/clients/${id}`}
          className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors mb-2 block">
          ← {client.name}
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">Edit Client</h1>
            <p className="text-sm text-gray-400 font-medium">Updating {client.name}</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-sm transition-all">
        <EditClientForm client={client} />
      </div>
    </div>
  )
}
