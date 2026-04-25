import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import { Sidebar }      from '@/components/layout/sidebar'
import DashboardHeader  from '@/components/layout/dashboard-header'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier, logo_url, business_name')
    .eq('id', user.id)
    .single()

  const subscriptionTier = profile?.subscription_tier || 'starter'
  const logoUrl          = profile?.logo_url          || null
  const businessName     = profile?.business_name     || null

  return (
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
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
