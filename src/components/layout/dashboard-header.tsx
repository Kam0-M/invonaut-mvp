'use client'

import { useState } from 'react'
import Link         from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User }    from '@supabase/supabase-js'
import { LogOut, Menu, X, ChevronDown, Settings } from 'lucide-react'
import Image from 'next/image'

interface DashboardHeaderProps {
  user:              User
  logoUrl?:          string | null
  subscriptionTier?: string
  businessName?:     string | null
}

export default function DashboardHeader({
  user, logoUrl, subscriptionTier = 'starter', businessName,
}: DashboardHeaderProps) {
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const showLogo = (subscriptionTier === 'professional' || subscriptionTier === 'business') && logoUrl
  const initials  = (user.email ?? 'U').charAt(0).toUpperCase()
  const displayName = businessName || user.email || ''

  const tierBadge: Record<string, { label: string; cls: string }> = {
    starter:      { label: 'Starter',      cls: 'bg-gray-100 text-gray-600'       },
    professional: { label: 'Professional', cls: 'bg-blue-50 text-blue-700'        },
    business:     { label: 'Business',     cls: 'bg-teal-500 text-white'          },
  }
  const badge = tierBadge[subscriptionTier] ?? tierBadge.starter

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center px-6 gap-4 flex-shrink-0 z-30">

      {/* Left — wordmark (desktop only, sidebar shows icon) */}
      <Link href="/dashboard" className="hidden md:block text-lg font-black text-gray-900 tracking-tight mr-2">
        Invonaut
      </Link>
      {/* Mobile logo */}
      <Link href="/dashboard" className="md:hidden text-lg font-black text-gray-900 tracking-tight">
        Invonaut
      </Link>

      {/* Tier badge */}
      <span className={`hidden sm:inline-flex text-[10px] font-black px-2.5 py-1 rounded-full ${badge.cls}`}>
        {badge.label}
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Desktop user menu */}
      <div className="hidden md:block relative">
        <button
          suppressHydrationWarning
          onClick={() => setMenuOpen(o => !o)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
        >
          {showLogo ? (
            <div className="w-7 h-7 rounded-full bg-white border border-gray-200 overflow-hidden flex-shrink-0">
              <Image src={logoUrl} alt="Logo" width={28} height={28} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
          )}
          <span className="text-sm font-medium text-gray-700 max-w-[160px] truncate">{displayName}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden z-20">
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="text-xs text-gray-400 font-medium">Signed in as</p>
                <p className="text-sm font-bold text-gray-900 truncate">{user.email}</p>
              </div>
              <Link
                href="/dashboard/settings"
                onClick={() => setMenuOpen(false)}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <button
                suppressHydrationWarning
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors border-t border-gray-50"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </>
        )}
      </div>

      {/* Mobile hamburger */}
      <button
        suppressHydrationWarning
        onClick={() => setMobileOpen(o => !o)}
        className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="absolute top-14 left-0 right-0 bg-white border-b border-gray-100 shadow-lg z-50 md:hidden px-6 py-4 space-y-3">
          <p className="text-sm text-gray-500 font-medium">{user.email}</p>
          <button
            suppressHydrationWarning
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm font-bold text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />Sign out
          </button>
        </div>
      )}
    </header>
  )
}
