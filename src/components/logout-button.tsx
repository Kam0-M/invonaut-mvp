'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Logout error:', error)
        // Still redirect even if there's an error
      }
      
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="destructive"
      onClick={handleLogout}
      disabled={isLoading}
      className="w-full sm:w-auto"
    >
      <LogOut className="w-4 h-4 mr-2" />
      {isLoading ? 'Signing out...' : 'Logout'}
    </Button>
  )
}

