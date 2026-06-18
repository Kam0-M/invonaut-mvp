'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link         from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User }    from '@supabase/supabase-js'
import {
  LogOut, Menu, X, ChevronDown, Settings, CreditCard, Users2, HelpCircle,
  Sparkles,
} from 'lucide-react'
import Image from 'next/image'
import { NAV } from './sidebar'

interface DashboardHeaderProps {
  user:              User
  logoUrl?:          string | null
  subscriptionTier?: string
  businessName?:     string | null
  overdueCount?:     number
  highRiskCount?:    number
}

export default function DashboardHeader({
  user, logoUrl, subscriptionTier = 'starter', businessName,
  overdueCount = 0, highRiskCount = 0,
}: DashboardHeaderProps) {
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const router   = useRouter()
  const supabase = createClient()
  const pathname  = usePathname()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Lock body scroll while the mobile nav drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  // Close the drawer automatically if the route changes (e.g. back button)
  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Close on Escape
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  const showLogo = (subscriptionTier === 'professional' || subscriptionTier === 'business') && logoUrl
  const initials  = (user.email ?? 'U').charAt(0).toUpperCase()
  const displayName = businessName || user.email || ''

  const tierBadge: Record<string, { label: string; cls: string }> = {
    starter:      { label: 'Starter',      cls: 'bg-gray-100 text-gray-600'       },
    professional: { label: 'Professional', cls: 'bg-blue-50 text-blue-700'        },
    business:     { label: 'Business',     cls: 'bg-teal-500 text-white'          },
  }

  const PAGE_NAMES: Record<string, string> = {
    '/dashboard':                    'Dashboard',
    '/dashboard/invoices':           'Invoices',
    '/dashboard/payments':           'Payments',
    '/dashboard/clients':            'Clients',
    '/dashboard/contracts':          'Contracts',
    '/dashboard/expenses':           'Expenses',
    '/dashboard/time':               'Time Tracking',
    '/dashboard/cash':               'Cash Flow',
    '/dashboard/portal':             'Client Portal',
    '/dashboard/analytics':          'Analytics',
    '/dashboard/reports':            'Reports',
    '/dashboard/billing':            'Billing',
    '/dashboard/affiliate':          'Affiliate',
    '/dashboard/settings':           'Settings',
  }
  const pageName = PAGE_NAMES[pathname] ?? PAGE_NAMES[Object.keys(PAGE_NAMES).find(k => pathname.startsWith(k + '/')) ?? ''] ?? 'Invonaut'
  const badge = tierBadge[subscriptionTier] ?? tierBadge.starter

  const mobileNav = subscriptionTier === 'starter'
    ? [...NAV, { name: 'Upgrade', href: '/pricing', icon: Sparkles }]
    : NAV

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center px-4 sm:px-6 gap-4 flex-shrink-0 z-30 relative">

      {/* Left — current page name (desktop only, sidebar shows logo/brand) */}
      <Link href="/dashboard" className="hidden md:block text-base font-black text-gray-900 tracking-tight mr-2">
        {pageName}
      </Link>
      {/* Mobile — current page name */}
      <Link href="/dashboard" className="md:hidden text-base font-black text-gray-900 tracking-tight truncate">
        {pageName}
      </Link>

      {/* Tier badge */}
      <span className={`hidden sm:inline-flex text-[10px] font-black px-2.5 py-1 rounded-full flex-shrink-0 ${badge.cls}`}>
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
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 overflow-hidden p-1">
              {/* The Naut — shown when user hasn't uploaded a custom logo */}
              <img src="/naut-white.svg" alt="Invonaut" className="w-full h-full object-contain" draggable={false} />
            </div>
          )}
          <span className="text-sm font-medium text-gray-700 max-w-[160px] truncate">{displayName}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden z-20">
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="text-xs text-gray-400 font-medium">Signed in as</p>
                <p className="text-sm font-bold text-gray-900 truncate">{user.email}</p>
              </div>
              <Link
                href="/dashboard/billing"
                onClick={() => setMenuOpen(false)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <CreditCard className="w-4 h-4 text-gray-400" />
                Billing
              </Link>
              <Link
                href="/dashboard/affiliate"
                onClick={() => setMenuOpen(false)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Users2 className="w-4 h-4 text-gray-400" />
                <span>Affiliate</span>
                <span className="ml-auto text-[10px] font-black text-orange-500">30%</span>
              </Link>
              <Link
                href="/help"
                onClick={() => setMenuOpen(false)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-50"
              >
                <HelpCircle className="w-4 h-4 text-gray-400" />
                Help
              </Link>
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
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileOpen}
        className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 flex-shrink-0"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile full-screen nav drawer — actual app navigation, not just account links */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />

          {/* Panel */}
          <div className="relative ml-auto w-[82%] max-w-[320px] h-full bg-gray-900 flex flex-col shadow-2xl inv-drawer-in">
            {/* Header row inside drawer */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-white/[0.06] flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center overflow-hidden p-1">
                  <img src="/naut-white.svg" alt="Invonaut" className="w-full h-full object-contain" draggable={false} />
                </div>
                <span className="text-white font-black text-[11px] tracking-[0.14em] uppercase">INVONAUT</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="p-2 -mr-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.07]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Identity row */}
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2.5 flex-shrink-0">
              {showLogo ? (
                <div className="w-8 h-8 rounded-full bg-white overflow-hidden flex-shrink-0">
                  <Image src={logoUrl} alt="Logo" width={32} height={32} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 overflow-hidden p-1">
                  <img src="/naut-white.svg" alt="Invonaut" className="w-full h-full object-contain" draggable={false} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{displayName}</p>
                <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
              </div>
              <span className={`text-[9px] font-black px-2 py-1 rounded-full flex-shrink-0 ${
                subscriptionTier === 'business' ? 'bg-teal-500 text-white'
                : subscriptionTier === 'professional' ? 'bg-blue-500/20 text-blue-300'
                : 'bg-white/10 text-gray-300'
              }`}>
                {badge.label}
              </span>
            </div>

            {/* Nav items — same set the desktop sidebar uses */}
            <nav className="flex-1 overflow-y-auto px-2.5 py-3 flex flex-col gap-0.5">
              {mobileNav.map(item => {
                const Icon = item.icon
                const isActive = item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname?.startsWith(item.href)
                const isUpgrade = item.name === 'Upgrade'
                const isInvoice = item.name === 'Invoices'
                const isAnalytics = item.name === 'Analytics'
                const showOverdueBadge = isInvoice && overdueCount > 0
                const showRiskBadge    = isAnalytics && highRiskCount > 0 && !showOverdueBadge

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                      isUpgrade
                        ? 'btn-secondary text-white mt-1'
                        : isActive
                        ? 'inv-sidebar-active text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/[0.07]'
                    }`}
                  >
                    {isActive && !isUpgrade && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-white/60" />
                    )}
                    <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                    <span className="flex-1">{item.name}</span>
                    {showOverdueBadge && (
                      <span className="text-[9px] font-black bg-red-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center tabular-nums">
                        {overdueCount > 9 ? '9+' : overdueCount}
                      </span>
                    )}
                    {showRiskBadge && (
                      <span className="text-[9px] font-black bg-orange-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center tabular-nums">
                        {highRiskCount > 9 ? '9+' : highRiskCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Account section */}
            <div className="flex-shrink-0 border-t border-white/[0.06] px-2.5 py-3 flex flex-col gap-0.5">
              <Link href="/dashboard/billing"   onClick={() => setMobileOpen(false)} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/[0.07]"><CreditCard className="w-[18px] h-[18px]"/>Billing</Link>
              <Link href="/dashboard/affiliate" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/[0.07]"><Users2 className="w-[18px] h-[18px]"/><span className="flex-1">Affiliate</span><span className="text-[10px] font-black text-orange-400">30%</span></Link>
              <Link href="/dashboard/settings"  onClick={() => setMobileOpen(false)} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/[0.07]"><Settings className="w-[18px] h-[18px]"/>Settings</Link>
              <button
                suppressHydrationWarning
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-red-500/10 hover:text-red-400 transition-colors mt-1"
              >
                <LogOut className="w-[18px] h-[18px]" />Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
