import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import { Sidebar }      from '@/components/layout/sidebar'
import DashboardHeader  from '@/components/layout/dashboard-header'
import PageAutoRefresh  from '@/components/ui/page-auto-refresh'
import { CurrencyProvider } from '@/lib/context/currency-context'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier, logo_url, business_name, currency, currency_symbol')
    .eq('id', user.id)
    .single()

  const subscriptionTier = profile?.subscription_tier || 'starter'
  const logoUrl          = profile?.logo_url          || null
  const businessName     = profile?.business_name     || null
  const currency         = (profile as any)?.currency         || 'USD'
  const currencySymbol   = (profile as any)?.currency_symbol  || '$'

  return (
    <CurrencyProvider currency={currency} symbol={currencySymbol}>
    <div className="h-screen flex overflow-hidden bg-white">
      {/* Dark icon sidebar */}
      <Sidebar subscriptionTier={subscriptionTier} />

      {/* Right column: top header + scrolling main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <DashboardHeader
          user={user}
          logoUrl={logoUrl}
          subscriptionTier={subscriptionTier}
          businessName={businessName}
        />
        <main className="flex-1 overflow-y-auto" style={{background:'var(--inv-surf)'}}>
          <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <PageAutoRefresh interval={30_000} />
            {children}
          </div>
        </main>
      </div>
    </div>
    </CurrencyProvider>
  )
}
