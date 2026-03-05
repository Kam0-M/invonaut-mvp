'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { LogOut, Menu, X, Building2 } from 'lucide-react'
import Image from 'next/image'

interface DashboardHeaderProps {
  user: User
  logoUrl?: string | null
  subscriptionTier?: string
  businessName?: string | null
}

export default function DashboardHeader({ user, logoUrl, subscriptionTier = 'starter', businessName }: DashboardHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Get user initials for avatar
  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase()
  }

  // Show logo if Professional or Business tier and logo exists
  const showLogo = (subscriptionTier === 'professional' || subscriptionTier === 'business') && logoUrl

  return (
    <header className="bg-white border-b-2 border-gray-100 sticky top-0 z-40 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo (Mobile Only) */}
          <div className="flex items-center md:hidden">
            <Link href="/dashboard" className="flex items-center">
              <span className="text-2xl font-black text-gray-900">Invonaut</span>
            </Link>
          </div>

          {/* Desktop Navigation - Right Side */}
          <div className="hidden md:flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl border-2 border-gray-100">
              {/* Profile Picture Circle or Logo */}
              {showLogo ? (
                <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center overflow-hidden shadow-lg">
                  <Image
                    src={logoUrl}
                    alt="Your logo"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-bold">
                    {getInitials(user.email || 'U')}
                  </span>
                </div>
              )}
              {/* Email and Business Name */}
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium text-gray-700">
                  {user.email}
                </div>
                
                {/* Business Name Display */}
                {businessName && (
                  <>
                    <div className="h-6 w-px bg-gray-300"></div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-bold text-gray-900">{businessName}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 rounded-xl transition-all border-2 border-gray-200 hover:border-blue-600"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-2 border-gray-200"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-gray-100 bg-white shadow-lg">
          <div className="px-4 py-4 space-y-3">
            {/* Mobile Profile */}
            <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-100">
              {showLogo ? (
                <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center overflow-hidden shadow-lg">
                  <Image
                    src={logoUrl}
                    alt="Your logo"
                    width={40}
                    height={40}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold">
                    {getInitials(user.email || 'U')}
                  </span>
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-gray-700">
                  {user.email}
                </div>
                {/* Business Name - Mobile */}
                {businessName && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Building2 className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs font-bold text-gray-900">{businessName}</span>
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-4 py-3 text-sm font-bold text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 rounded-xl transition-all border-2 border-gray-200"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  )
}