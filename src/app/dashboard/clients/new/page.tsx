'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    payment_terms: 30
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Validate required fields
      if (!formData.name.trim()) {
        setError('Client name is required')
        setLoading(false)
        return
      }

      // Validate email format if provided
      if (formData.email && !formData.email.includes('@')) {
        setError('Please enter a valid email address')
        setLoading(false)
        return
      }

      // Insert client
      const { error: insertError } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          company: formData.company.trim() || null,
          address: formData.address.trim() || null,
          payment_terms: formData.payment_terms
        })

      if (insertError) {
        throw insertError
      }

      setSuccess('Client added successfully!')
      
      // Redirect after 1 second
      setTimeout(() => {
        router.push('/dashboard/clients')
      }, 1000)

    } catch (err: any) {
      setError(err.message || 'Failed to add client. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Add New Client</h1>
        <p className="text-sm text-slate-500 mt-1">
          Add a new client to your Flowance account
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-600">
              {success}
            </div>
          )}

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
              {loading ? 'Saving...' : 'Save Client'}
            </Button>
            <Button
              type="button"
              onClick={() => router.push('/dashboard/clients')}
              disabled={loading}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}