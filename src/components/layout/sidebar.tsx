'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, FileText, ScrollText, Users, ExternalLink,
  Settings, BarChart3, HelpCircle, CreditCard, Sparkles,
  Receipt, Clock, TrendingUp, Banknote,
} from 'lucide-react'
import TimerSidebarBadge from '@/components/time/timer-sidebar-badge'

interface SidebarProps { subscriptionTier?: string }

const NAV = [
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

export function Sidebar({ subscriptionTier = 'starter' }: SidebarProps) {
  const pathname  = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const nav = subscriptionTier === 'starter'
    ? [...NAV, { name: 'Upgrade', href: '/pricing', icon: Sparkles }]
    : NAV

  return (
    /* Always icon-only — matches demo exactly */
    <div className="hidden md:flex md:w-16 md:flex-col flex-shrink-0">
      <div className="flex flex-col flex-grow bg-gray-900 overflow-y-auto">

        {/* Logo mark */}
        <div className="h-16 flex items-center justify-center flex-shrink-0 border-b border-white/[0.06]">
          <Link href="/dashboard" title="Dashboard"
            className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center hover:bg-blue-500 transition-colors">
            <span className="text-white font-black text-sm">IN</span>
          </Link>
        </div>

        {/* Nav icons */}
        <nav className="flex-1 flex flex-col items-center gap-1 py-4 px-2">
          {nav.map((item) => {
            const Icon     = item.icon
            const isActive = item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname?.startsWith(item.href)
            const isUpgrade = item.name === 'Upgrade'
            const isTime    = item.name === 'Time'

            return (
              <Link
                key={item.name}
                href={item.href}
                title={item.name}
                className={cn(
                  'relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150',
                  isUpgrade
                    ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white'
                    : isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 hover:text-white hover:bg-white/10'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isTime && mounted && (
                  <span className="absolute top-1.5 right-1.5">
                    <TimerSidebarBadge isNavActive={!!isActive} />
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
