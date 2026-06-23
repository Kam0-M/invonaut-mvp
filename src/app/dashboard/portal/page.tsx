import { redirect }     from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PortalSettingsForm from '@/components/portal/portal-settings-form'
import { ExternalLink, Users, Zap, Lock, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { isSubscriptionActive } from '@/lib/subscription-status'

export default async function PortalPage() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('business_name, logo_url, brand_color, subscription_tier, stripe_subscription_id, subscription_status, trial_end_date')
    .eq('id', user.id).single()

  const { data: portalSettingsRow } = await supabase
    .from('portal_settings').select('*').eq('user_id', user.id).maybeSingle()

  const { data: clientsCount } = await supabase
    .from('clients').select('id', { count: 'exact', head: true }).eq('user_id', user.id)

  const hasActiveSubscription = isSubscriptionActive(profile)

  const portalSettings = portalSettingsRow?.id && typeof portalSettingsRow.slug === 'string'
    ? {
        id:             portalSettingsRow.id as string,
        slug:           portalSettingsRow.slug as string,
        is_enabled:     Boolean(portalSettingsRow.is_enabled),
        custom_message: portalSettingsRow.custom_message ? String(portalSettingsRow.custom_message) : null,
      }
    : null

  const isLive = portalSettings?.is_enabled && portalSettings?.slug
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://invonaut.app').replace(/\/$/, '')
  const portalUrl = portalSettings?.slug ? `${appUrl}/portal/${portalSettings.slug}` : null

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-[#0055FF] uppercase tracking-widest inv-overline mb-1">Client Portal</p>
          <div className="flex items-center gap-3 flex-wrap">
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inv-pulse-dot" />Live
              </span>
            ) : (
              <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">Not configured</span>
            )}
            {portalUrl && (
              <a href={portalUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1">
                Preview portal <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
        {hasActiveSubscription && portalSettings && (
          <Link href={`${appUrl}/portal/${portalSettings.slug}`} target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl btn-primary text-sm flex-shrink-0">
            <ExternalLink className="w-3.5 h-3.5" />Open Portal
          </Link>
        )}
      </div>

      {/* Value strip — 3 bullets explaining what the portal does */}
      {!portalSettings && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: ExternalLink, title: 'One branded link', sub: 'Clients click, no account needed' },
            { icon: CheckCircle2, title: 'Invoice + signing', sub: 'View invoices, sign contracts' },
            { icon: Zap,          title: 'Magic link auth',  sub: 'Secure 7-day token, sent by you' },
          ].map(item => (
            <div key={item.title} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!hasActiveSubscription ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-blue-600" />
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-2">Subscribe to activate your Client Portal</h3>
          <p className="text-sm text-gray-500 font-medium max-w-sm mx-auto mb-6">
            Give every client a branded link to view their invoices and sign contracts. No account needed on their end.
          </p>
          <Link href="/pricing"
            className="inline-flex items-center gap-2 btn-primary px-5 py-2.5 rounded-xl text-sm">
            View Plans
          </Link>
        </div>
      ) : (
        <PortalSettingsForm
          userId={user.id}
          businessName={profile?.business_name ?? null}
          logoUrl={profile?.logo_url ?? null}
          brandColor={profile?.brand_color || '#0066FF'}
          subscriptionTier={profile?.subscription_tier || 'starter'}
          hasActiveSubscription={hasActiveSubscription}
          portalSettings={portalSettings}
        />
      )}
    </div>
  )
}
