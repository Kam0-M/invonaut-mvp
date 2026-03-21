import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import PortalSettingsForm from '@/components/portal/portal-settings-form'

export default async function PortalPage() {
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
    .select(
      'business_name, logo_url, brand_color, subscription_tier, stripe_subscription_id, subscription_status'
    )
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Profile fetch error:', profileError)
  }

  const { data: portalSettingsRow } = await supabase
    .from('portal_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const hasActiveSubscription =
    !!profile?.stripe_subscription_id &&
    (profile?.subscription_status === 'active' ||
      profile?.subscription_status === 'trialing')

  const portalSettings =
    portalSettingsRow &&
    portalSettingsRow.id &&
    typeof portalSettingsRow.slug === 'string'
      ? {
          id: portalSettingsRow.id as string,
          slug: portalSettingsRow.slug as string,
          is_enabled: Boolean(portalSettingsRow.is_enabled),
          custom_message:
            portalSettingsRow.custom_message === undefined ||
            portalSettingsRow.custom_message === null
              ? null
              : String(portalSettingsRow.custom_message)
        }
      : null

  return (
    <div className="space-y-8">
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
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
              Client Portal
            </h1>
            <p className="text-base sm:text-lg text-gray-600 mt-2 font-medium">
              Give your clients a branded portal to view invoices and documents
            </p>
          </div>
        </div>
      </div>

      <PortalSettingsForm
        userId={user.id}
        businessName={profile?.business_name ?? null}
        logoUrl={profile?.logo_url ?? null}
        brandColor={profile?.brand_color || '#0066FF'}
        subscriptionTier={profile?.subscription_tier || 'starter'}
        hasActiveSubscription={hasActiveSubscription}
        portalSettings={portalSettings}
      />
    </div>
  )
}
