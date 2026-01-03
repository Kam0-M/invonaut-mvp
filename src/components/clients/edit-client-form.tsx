'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type Client = {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  address: string | null
  payment_terms: number | null
}

type EditClientFormProps = {
  client: Client
}

export default function EditClientForm({ client }: EditClientFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: client.name,
    email: client.email || '',
    phone: client.phone || '',
    company: client.company || '',
    address: client.address || '',
    payment_terms: client.payment_terms || 30
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      const MAX_CLIENT_NAME_LENGTH = 200
  if (formData.name.trim().length > MAX_CLIENT_NAME_LENGTH) {
    toast.error(`Client name cannot exceed ${MAX_CLIENT_NAME_LENGTH} characters. Please use a shorter name.`, { duration: 3000 })
    return
  }
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      if (!formData.name.trim()) {
        toast.error('Client name is required. Please enter a name for this client.', { duration: 3000 })
        setLoading(false)
        return
      }

      if (formData.email && !formData.email.includes('@')) {
        toast.error('Please enter a valid email address. Make sure it includes an @ symbol.', { duration: 3000 })
        setLoading(false)
        return
      }

      const loadingToast = toast.loading('Updating client...')

      const { error: updateError } = await supabase
        .from('clients')
        .update({
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          company: formData.company.trim() || null,
          address: formData.address.trim() || null,
          payment_terms: formData.payment_terms
        })
        .eq('id', client.id)
        .eq('user_id', user.id)

      if (updateError) {
        throw updateError
      }

      toast.success('Client updated successfully!', { id: loadingToast, duration: 3000 })
      
      setTimeout(() => {
        router.push(`/dashboard/clients/${client.id}`)
        router.refresh()
      }, 500)

    } catch (err: any) {
      let errorMessage = 'Could not update client. Please check your internet connection and try again.'
      
      if (err?.code === 'PGRST116') {
        errorMessage = 'Could not update client. The database connection was interrupted. Please check your internet connection and try again.'
      } else if (err?.message) {
        if (err.message.includes('network') || err.message.includes('connection') || err.message.includes('timeout')) {
          errorMessage = 'Could not update client. Please check your internet connection and try again.'
        } else if (err.message.length < 100 && !err.message.includes('PGRST')) {
          errorMessage = err.message
        }
      }
      
      toast.error('' + errorMessage, { duration: 3000 })
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john@example.com"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Phone
          </label>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="555-0123"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Company
          </label>
          <Input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            placeholder="Acme Corporation"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Address
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="123 Main Street, City, State, ZIP"
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 placeholder:text-gray-500"
            rows={3}
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Payment Terms
          </label>
          <select
            value={formData.payment_terms}
            onChange={(e) => setFormData({ ...formData, payment_terms: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 bg-white"
            disabled={loading}
          >
            <option value={7}>7 days</option>
            <option value={15}>15 days</option>
            <option value={30}>30 days</option>
            <option value={45}>45 days</option>
            <option value={60}>60 days</option>
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="bg-primary text-white hover:bg-primary/90"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
          <Button
            type="button"
            onClick={() => router.push(`/dashboard/clients/${client.id}`)}
            disabled={loading}
            variant="outline"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}

