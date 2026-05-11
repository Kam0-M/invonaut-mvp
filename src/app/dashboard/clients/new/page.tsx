'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, UserPlus, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import SubscriptionRequired from '@/components/subscription-required'

export default function NewClientPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    payment_terms: '30'
  })

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
          return
        }

        // Check subscription status
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('stripe_subscription_id, subscription_status')
          .eq('id', user.id)
          .single()

        const isSubscribed = !!profile?.stripe_subscription_id && 
          (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')
        
        setHasActiveSubscription(isSubscribed)
      } catch (err) {
        console.error('Error checking subscription:', err)
      } finally {
        setIsLoading(false)
      }
    }

    checkSubscription()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.name.trim()) {
      setError('Client name is required')
      setLoading(false)
      return
    }

    if (formData.name.length > 200) {
      setError('Client name must be 200 characters or less')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { error: insertError } = await supabase
      .from('clients')
      .insert([
        {
          user_id: user.id,
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          company: formData.company.trim() || null,
          address: formData.address.trim() || null,
          payment_terms: parseInt(formData.payment_terms) || 30
        }
      ])

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard/clients')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // GATE: Show subscription required if no active subscription
  if (!hasActiveSubscription) {
    return <SubscriptionRequired />
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Link href="/dashboard/clients" className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors mb-2 block">
          ← Clients
        </Link>
        <h1 className="text-2xl font-black text-gray-900">Add Client</h1>
      </div>

      {/* Premium Form Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {/* Client Name (Required) */}
          <div className="space-y-3">
            <Label htmlFor="name" className="text-sm font-bold uppercase tracking-wide text-gray-700">
              Client Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe or Company Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              maxLength={200}
              className="h-12 text-base border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
            />
            <p className="text-xs text-gray-500 font-medium">
              {formData.name.length}/200 characters
            </p>
          </div>

          {/* Email */}
          <div className="space-y-3">
            <Label htmlFor="email" className="text-sm font-bold uppercase tracking-wide text-gray-700">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="client@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="h-12 text-base border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
            />
          </div>

          {/* Phone */}
          <div className="space-y-3">
            <Label htmlFor="phone" className="text-sm font-bold uppercase tracking-wide text-gray-700">
              Phone
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="h-12 text-base border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
            />
          </div>

          {/* Company */}
          <div className="space-y-3">
            <Label htmlFor="company" className="text-sm font-bold uppercase tracking-wide text-gray-700">
              Company
            </Label>
            <Input
              id="company"
              type="text"
              placeholder="Acme Corporation"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="h-12 text-base border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
            />
          </div>

          {/* Address */}
          <div className="space-y-3">
            <Label htmlFor="address" className="text-sm font-bold uppercase tracking-wide text-gray-700">
              Address
            </Label>
            <textarea
              id="address"
              placeholder="123 Main St, Suite 100, City, State, ZIP"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              className="w-full text-base text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl resize-none p-3 focus:outline-none bg-white"
            />
          </div>

          {/* Payment Terms */}
          <div className="space-y-3">
            <Label htmlFor="payment_terms" className="text-sm font-bold uppercase tracking-wide text-gray-700">
              Payment Terms (Days)
            </Label>
            <Input
              id="payment_terms"
              type="number"
              placeholder="30"
              value={formData.payment_terms}
              onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
              min="1"
              max="365"
              className="h-12 text-base border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
            />
            <p className="text-xs text-gray-500 font-medium">
              Default number of days until invoice payment is due
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus className="w-5 h-5" />
              {loading ? 'Creating Client...' : 'Create Client'}
            </button>
            <Link 
              href="/dashboard/clients"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm transition-all duration-200"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}