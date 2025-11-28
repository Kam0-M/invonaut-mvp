import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LogoutButton } from '@/components/logout-button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Flowance!
          </CardTitle>
          <CardDescription className="text-base">
            You're successfully signed in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">Signed in as:</p>
            <p className="text-lg font-semibold text-primary">{user.email}</p>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600 text-center mb-4">
              Ready to start managing your business? Explore the dashboard to create invoices, manage clients, and track your revenue.
            </p>
            <div className="flex justify-center">
              <LogoutButton />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
