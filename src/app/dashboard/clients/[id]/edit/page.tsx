import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EditClientForm from '@/components/clients/edit-client-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !client) {
    redirect('/dashboard/clients')
  }

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Link 
            href={`/dashboard/clients/${id}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg transition-all duration-200 font-bold text-gray-700 w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Client</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">Edit Client</h1>
            <p className="text-base sm:text-lg text-gray-600 mt-2 font-medium">
              Update {client.name}'s information
            </p>
          </div>
        </div>
      </div>

      {/* Premium Form Card */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-10 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
        <EditClientForm client={client} />
      </div>
    </div>
  )
}