import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsForm from '@/components/settings/settings-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

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

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg transition-all duration-200 font-bold text-gray-700 w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">Settings</h1>
            <p className="text-base sm:text-lg text-gray-600 mt-2 font-medium">
              Manage your account, branding, and subscription
            </p>
          </div>
        </div>
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
    </div>
  )
}