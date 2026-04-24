'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
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
  Sparkles,
  Receipt,
  Clock,
  TrendingUp,
  Banknote,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import TimerSidebarBadge from '@/components/time/timer-sidebar-badge'

interface SidebarProps {
  subscriptionTier?: string
}

export function Sidebar({ subscriptionTier = 'starter' }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCollapsed(localStorage.getItem('invonaut_sidebar_collapsed') === 'true')
  }, [])

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('invonaut_sidebar_collapsed', String(next))
  }

  const navigation = [
    { name: 'Dashboard',     href: '/dashboard',           icon: LayoutDashboard },
    { name: 'Invoices',      href: '/dashboard/invoices',  icon: FileText        },
    { name: 'Payments',      href: '/dashboard/payments',  icon: Banknote        },
    { name: 'Clients',       href: '/dashboard/clients',   icon: Users           },
    { name: 'Contracts',     href: '/dashboard/contracts', icon: ScrollText      },
    { name: 'Expenses',      href: '/dashboard/expenses',  icon: Receipt         },
    { name: 'Time',          href: '/dashboard/time',      icon: Clock           },
    { name: 'Cash Flow',     href: '/dashboard/cash',      icon: TrendingUp      },
    { name: 'Client Portal', href: '/dashboard/portal',    icon: ExternalLink    },
    { name: 'Analytics',     href: '/dashboard/analytics', icon: BarChart3       },
    { name: 'Settings',      href: '/dashboard/settings',  icon: Settings        },
    { name: 'Billing',       href: '/dashboard/billing',   icon: CreditCard      },
    { name: 'Help',          href: '/help',                icon: HelpCircle      },
  ]

  if (subscriptionTier === 'starter') {
    navigation.push({ name: 'Upgrade', href: '/pricing', icon: Sparkles })
  }

  // Avoid layout shift before mount by rendering expanded (SSR default)
  const isCollapsed = mounted && collapsed

  return (
    <div className={cn(
      'hidden md:flex md:flex-col flex-shrink-0 transition-all duration-300',
      isCollapsed ? 'md:w-16' : 'md:w-64'
    )}>
      <div className="flex flex-col flex-grow pt-8 bg-white overflow-y-auto border-r-2 border-gray-100">
        {/* Logo + collapse toggle */}
        <div className={cn('mb-8 flex items-center', isCollapsed ? 'px-3 justify-center' : 'px-6 justify-between')}>
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center">
              <span className="text-2xl font-black text-gray-900 tracking-tight">Invonaut</span>
            </Link>
          )}
          <button
            onClick={toggleCollapsed}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all',
              isCollapsed ? 'w-10 h-10' : 'w-7 h-7'
            )}
          >
            {isCollapsed
              ? <ChevronRight className="w-4 h-4" />
              : <ChevronLeft className="w-4 h-4" />
            }
          </button>
        </div>

        {/* Navigation */}
        <div className="flex flex-col flex-grow px-2">
          <nav className="flex-1 space-y-1 pb-6">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname?.startsWith(item.href)
              const isUpgrade = item.name === 'Upgrade'
              const isTime    = item.name === 'Time'

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={isCollapsed ? item.name : undefined}
                  className={cn(
                    'group flex items-center rounded-xl transition-all duration-200',
                    isCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3',
                    'text-sm font-bold',
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

                  {!isCollapsed && (
                    <>
                      {item.name}

                      {/* Timer running indicator — only on the Time nav item */}
                      {isTime && <TimerSidebarBadge isNavActive={!!isActive} />}

                      {/* Active dot */}
                      {isActive && !isUpgrade && !isTime && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                      )}

                      {isUpgrade && (
                        <div className="ml-auto">
                          <span className="text-xs font-black">→</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Timer badge in collapsed mode */}
                  {isCollapsed && isTime && (
                    <TimerSidebarBadge isNavActive={!!isActive} />
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