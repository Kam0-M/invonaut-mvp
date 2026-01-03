import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EditClientForm from '@/components/clients/edit-client-form'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href={`/dashboard/clients/${id}`}>
            <Button variant="outline" size="sm" className="shrink-0">
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Back to Client</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Edit Client</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Update client information
            </p>
          </div>
        </div>
      </div>

      <EditClientForm client={client} />
    </div>
  )
}

