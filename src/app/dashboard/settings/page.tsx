import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsForm from '@/components/settings/settings-form'
import RevenueCategoryManager from '@/components/settings/revenue-category-manager'
import Link from 'next/link'
import { Tag } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('logo_url, brand_color, secondary_brand_color, subscription_tier, full_name, email, business_name, address, stripe_subscription_id, stripe_customer_id, subscription_status')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Profile fetch error:', profileError)
  }

  const logoUrl = profile?.logo_url || null
  const brandColor = profile?.brand_color || '#0066FF'
  const secondaryBrandColor = profile?.secondary_brand_color || '#00D4AA'
  const subscriptionTier = profile?.subscription_tier || 'starter'
  
  // Calculate subscription state
  const hasActiveSubscription = !!profile?.stripe_subscription_id && 
    (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')
  const hasEverSubscribed = !!profile?.stripe_customer_id || !!profile?.stripe_subscription_id

  // Revenue categories
  const { data: categoriesRaw } = await supabase
    .from('revenue_categories')
    .select('id, name, description, color, created_at')
    .eq('user_id', user.id)
    .order('name', { ascending: true })
  const initialCategories = categoriesRaw || []

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Link href="/dashboard" className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors mb-2 block">
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-black text-gray-900">Settings</h1>
      </div>

      {/* Settings Form */}
      <SettingsForm
        userId={user.id}
        currentLogoUrl={logoUrl}
        currentBrandColor={brandColor}
        currentSecondaryBrandColor={secondaryBrandColor}
        subscriptionTier={subscriptionTier}
        hasActiveSubscription={hasActiveSubscription}
        hasEverSubscribed={hasEverSubscribed}
        subscriptionStatus={profile?.subscription_status || 'inactive'}
        userProfile={{
          full_name: profile?.full_name || null,
          email: profile?.email || user.email || '',
          business_name: profile?.business_name || null,
          address: profile?.address || null
        }}
      />

      {/* Revenue Categories */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Tag className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Revenue Categories</h2>
            <p className="text-sm text-gray-500 font-medium mt-0.5">
              Tag your income by source — consulting, delivery, subscriptions, and more
            </p>
          </div>
        </div>
        <RevenueCategoryManager initialCategories={initialCategories} />
      </div>

    </div>
  )
}