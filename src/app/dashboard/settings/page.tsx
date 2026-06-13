import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsForm from '@/components/settings/settings-form'
import type { ColorScheme } from '@/components/settings/settings-form'
import RevenueCategoryManager from '@/components/settings/revenue-category-manager'
import Link from 'next/link'
import { Tag, Users2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('logo_url, brand_color, secondary_brand_color, invoice_color_scheme, subscription_tier, full_name, email, business_name, address, stripe_subscription_id, stripe_customer_id, subscription_status, currency, currency_symbol, tax_label, tax_number, country')
    .eq('id', user.id)
    .single()

  const { data: categoriesRaw } = await supabase
    .from('revenue_categories')
    .select('id, name, description, color, created_at')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  const hasActiveSubscription = !!profile?.stripe_subscription_id &&
    (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')
  const hasEverSubscribed = !!profile?.stripe_customer_id || !!profile?.stripe_subscription_id

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold text-[#0055FF] uppercase tracking-widest mb-1">Account</p>
        <h1 className="text-2xl font-black text-gray-900" style={{ letterSpacing: '-.02em' }}>Settings</h1>
      </div>

      <SettingsForm
        userId={user.id}
        currentLogoUrl={profile?.logo_url || null}
        currentBrandColor={profile?.brand_color || '#0055FF'}
        currentSecondaryBrandColor={profile?.secondary_brand_color || '#00C4A0'}
        invoiceColorScheme={(profile?.invoice_color_scheme as ColorScheme) || 'classic'}
        subscriptionTier={profile?.subscription_tier || 'starter'}
        hasActiveSubscription={hasActiveSubscription}
        hasEverSubscribed={hasEverSubscribed}
        subscriptionStatus={profile?.subscription_status || 'inactive'}
        userProfile={{
          full_name: profile?.full_name || null,
          email: profile?.email || user.email || '',
          business_name: profile?.business_name || null,
          address: profile?.address || null,
        }}
        currency={profile?.currency || 'USD'}
        currencySymbol={profile?.currency_symbol || '$'}
        taxLabel={profile?.tax_label || 'Tax'}
        taxNumber={profile?.tax_number || null}
        country={profile?.country || 'US'}
      />

      {/* Revenue Categories */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-[#F8FAFF] rounded-xl flex items-center justify-center border border-gray-100">
            <Tag className="w-4 h-4 text-[#0055FF]" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#0055FF] uppercase tracking-widest mb-0.5">Categories</p>
            <h2 className="text-base font-black text-gray-900">Revenue categories</h2>
          </div>
        </div>
        <RevenueCategoryManager initialCategories={categoriesRaw || []} />
      </div>

      {/* Affiliate Programme */}
      <Link href="/dashboard/affiliate" style={{ textDecoration: 'none', display: 'block' }}>
        <div className="relative overflow-hidden rounded-2xl p-6" style={{
          background: 'linear-gradient(135deg, #002ECC 0%, #0044EE 50%, #0055FF 100%)',
        }}>
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse 50% 80% at 110% 50%, rgba(0,196,160,0.18) 0%, transparent 60%)',
          }} />
          <div className="relative flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <Users2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-white text-sm leading-tight mb-0.5">Affiliate Programme — Earn 30% recurring</p>
              <p className="text-xs text-white/50 font-medium">Know a business that needs this? Share your link and earn every month they stay subscribed.</p>
            </div>
            <span className="text-xs text-white/40 font-bold flex-shrink-0">View →</span>
          </div>
        </div>
      </Link>
    </div>
  )
}
