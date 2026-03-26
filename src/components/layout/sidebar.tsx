'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard,
  FileText,
  ScrollText,
  Users,
  ExternalLink,
  Settings,
  BarChart3,
  HelpCircle,
  CreditCard,
  Sparkles
} from 'lucide-react'

interface SidebarProps {
  subscriptionTier?: string
}

export function Sidebar({ subscriptionTier = 'starter' }: SidebarProps) {
  const pathname = usePathname()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Invoices', href: '/dashboard/invoices', icon: FileText },
    { name: 'Clients', href: '/dashboard/clients', icon: Users },
    { name: 'Contracts', href: '/dashboard/contracts', icon: ScrollText },
    { name: 'Client Portal', href: '/dashboard/portal', icon: ExternalLink },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
    { name: 'Help', href: '/help', icon: HelpCircle },
  ]

  // Only show upgrade for starter users
  if (subscriptionTier === 'starter') {
    navigation.push({ 
      name: 'Upgrade', 
      href: '/pricing', 
      icon: Sparkles 
    })
  }

  return (
    <div className="hidden md:flex md:w-64 md:flex-col h-full">
      <div className="flex flex-col h-full pt-8 bg-white overflow-y-auto border-r-2 border-gray-100">
        {/* Logo */}
        <div className="px-6 mb-8">
          <Link href="/dashboard" className="flex items-center">
            <span className="text-2xl font-black text-gray-900 tracking-tight">Invonaut</span>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex flex-col flex-grow px-4">
          <nav className="flex-1 space-y-2 pb-6">
            {navigation.map((item) => {
              const Icon = item.icon
              // Exact match for Dashboard, startsWith for others
              const isActive = item.href === '/dashboard' 
                ? pathname === '/dashboard'
                : pathname?.startsWith(item.href)
              
              // Special styling for Upgrade button
              const isUpgrade = item.name === 'Upgrade'
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200',
                    isUpgrade
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-200 hover:shadow-xl hover:scale-105'
                      : isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon
                    className={cn(
                      'flex-shrink-0 h-5 w-5',
                      isUpgrade || isActive 
                        ? 'text-white' 
                        : 'text-gray-400 group-hover:text-blue-600'
                    )}
                  />
                  {item.name}
                  {isActive && !isUpgrade && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></div>
                  )}
                  {isUpgrade && (
                    <div className="ml-auto">
                      <span className="text-xs font-black">→</span>
                    </div>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}