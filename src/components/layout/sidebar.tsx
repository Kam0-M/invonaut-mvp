'use client'

import Link            from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn }          from '@/lib/utils'
import {
  LayoutDashboard, FileText, ScrollText, Users, ExternalLink,
  Settings, BarChart3, HelpCircle, CreditCard, Sparkles,
  Receipt, Clock, TrendingUp, Banknote, ChevronRight, ChevronLeft,
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
  // Always start collapsed on SSR — expand after mount if localStorage says so.
  // This prevents hydration mismatch.
  const [expanded, setExpanded] = useState(false)
  const [mounted,  setMounted]  = useState(false)

  useEffect(() => {
    setMounted(true)
    setExpanded(localStorage.getItem('inv_sidebar_expanded') === 'true')
  }, [])

  const toggle = () => {
    const next = !expanded
    setExpanded(next)
    localStorage.setItem('inv_sidebar_expanded', String(next))
  }

  const nav = subscriptionTier === 'starter'
    ? [...NAV, { name: 'Upgrade', href: '/pricing', icon: Sparkles }]
    : NAV

  // SSR always renders collapsed width. After mount, CSS transition handles expand.
  const isExpanded = mounted && expanded

  return (
    <div
      className={cn(
        'hidden md:flex md:flex-col flex-shrink-0 bg-gray-900 overflow-y-auto transition-all duration-200',
        isExpanded ? 'md:w-56' : 'md:w-16'
      )}
      // Suppress the one-time width mismatch caused by localStorage on first client paint
      suppressHydrationWarning
    >
      {/* Logo + toggle */}
      <div className={cn(
        'h-16 flex items-center flex-shrink-0 border-b border-white/[0.06]',
        isExpanded ? 'px-4 justify-between' : 'justify-center'
      )}>
        {isExpanded && (
          <Link href="/dashboard"
            className="text-white font-black text-base tracking-tight hover:text-blue-400 transition-colors">
            Invonaut
          </Link>
        )}
        {!isExpanded && (
          <Link href="/dashboard" title="Dashboard"
            className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center hover:bg-blue-500 transition-colors flex-shrink-0">
            <span className="text-white font-black text-sm">IN</span>
          </Link>
        )}
        <button
          onClick={toggle}
          title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          className={cn(
            'flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all flex-shrink-0',
            isExpanded ? 'w-7 h-7' : 'w-7 h-7 ml-0'
          )}
          style={isExpanded ? {} : { marginLeft: 'auto', marginRight: 'auto', marginTop: '0', position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)' }}
        >
          {isExpanded
            ? <ChevronLeft  className="w-3.5 h-3.5" />
            : <ChevronRight className="w-3.5 h-3.5" />
          }
        </button>
      </div>

      {/* Nav */}
      <nav className={cn('flex-1 flex flex-col gap-1 py-4', isExpanded ? 'px-3' : 'items-center px-2')}>
        {nav.map((item) => {
          const Icon      = item.icon
          const isActive  = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname?.startsWith(item.href)
          const isUpgrade = item.name === 'Upgrade'
          const isTime    = item.name === 'Time'

          return (
            <Link
              key={item.name}
              href={item.href}
              title={!isExpanded ? item.name : undefined}
              className={cn(
                'relative flex items-center rounded-xl transition-all duration-150',
                isExpanded ? 'gap-3 px-3 py-2.5' : 'w-10 h-10 justify-center',
                isUpgrade
                  ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white'
                  : isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:text-white hover:bg-white/10'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {isExpanded && (
                <span className="text-sm font-bold truncate">{item.name}</span>
              )}
              {isTime && mounted && (
                <span className={cn(isExpanded ? 'ml-auto' : 'absolute top-1 right-1')}>
                  <TimerSidebarBadge isNavActive={!!isActive} />
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Expand toggle pinned to bottom when collapsed */}
      {isExpanded && (
        <div className="px-3 pb-4">
          <button onClick={toggle}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-gray-600 hover:text-gray-400 hover:bg-white/5 transition-all text-xs font-medium">
            <ChevronLeft className="w-3.5 h-3.5" />
            Collapse
          </button>
        </div>
      )}
    </div>
  )
}
