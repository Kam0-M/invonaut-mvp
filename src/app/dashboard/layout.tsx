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

  // Get user profile with subscription tier and logo
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier, logo_url')
    .eq('id', user.id)
    .single()

  const subscriptionTier = profile?.subscription_tier || 'starter'
  const logoUrl = profile?.logo_url || null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardHeader 
        user={user} 
        logoUrl={logoUrl}
        subscriptionTier={subscriptionTier}
      />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar subscriptionTier={subscriptionTier} />

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}