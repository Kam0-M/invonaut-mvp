import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import DashboardHeader from '@/components/layout/dashboard-header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Get user profile with subscription tier, logo, and business name
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier, logo_url, business_name')
    .eq('id', user.id)
    .single()

  const subscriptionTier = profile?.subscription_tier || 'starter'
  const logoUrl = profile?.logo_url || null
  const businessName = profile?.business_name || null

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Header — fixed at top */}
      <DashboardHeader 
        user={user} 
        logoUrl={logoUrl}
        subscriptionTier={subscriptionTier}
        businessName={businessName}
      />

      {/* Body — sidebar + main scroll independently */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — scrolls on its own */}
        <Sidebar subscriptionTier={subscriptionTier} />

        {/* Main Content — scrolls on its own */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}