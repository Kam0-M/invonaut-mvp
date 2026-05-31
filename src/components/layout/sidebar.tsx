'use client'

import Link            from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn }          from '@/lib/utils'
import {
  LayoutDashboard, FileText, ScrollText, Users, ExternalLink,
  BarChart3, HelpCircle, Sparkles,
  Receipt, Clock, TrendingUp, Banknote,
  ChevronRight, ChevronLeft, PanelLeftClose, PanelLeftOpen,
  FileBarChart2,
} from 'lucide-react'
import TimerSidebarBadge from '@/components/time/timer-sidebar-badge'

interface SidebarProps { subscriptionTier?: string }

// Settings removed — lives in the header dropdown now
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
  { name: 'Reports',       href: '/dashboard/reports',   icon: FileBarChart2   },
  { name: 'Help',          href: '/help',                icon: HelpCircle      },
]

export function Sidebar({ subscriptionTier = 'starter' }: SidebarProps) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)
  const [mounted,  setMounted]  = useState(false)

  useEffect(() => {
    setMounted(true)
    // Default: expanded unless user has explicitly collapsed
    const stored = localStorage.getItem('inv_sidebar_expanded')
    setExpanded(stored === null ? true : stored === 'true')
  }, [])

  const toggle = () => {
    const next = !expanded
    setExpanded(next)
    localStorage.setItem('inv_sidebar_expanded', String(next))
  }

  const nav = subscriptionTier === 'starter'
    ? [...NAV, { name: 'Upgrade', href: '/pricing', icon: Sparkles }]
    : NAV

  const isExpanded = mounted && expanded

  return (
    <div
      className={cn(
        'hidden md:flex md:flex-col flex-shrink-0 bg-gray-900 overflow-hidden transition-all duration-200',
        isExpanded ? 'md:w-56' : 'md:w-16'
      )}
      suppressHydrationWarning
    >
      {/* Logo row */}
      <div className={cn(
        'h-14 flex items-center flex-shrink-0 border-b border-white/[0.06]',
        isExpanded ? 'px-4 gap-3' : 'justify-center'
      )}>
        <Link href="/dashboard" title="Dashboard"
          className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center hover:bg-blue-500 transition-colors flex-shrink-0">
          <span className="text-white font-black text-xs">IN</span>
        </Link>
        {isExpanded && (
          <span className="text-white font-black text-sm tracking-tight truncate">Invonaut</span>
        )}
      </div>

      {/* Nav items */}
      <nav className={cn(
        'flex-1 flex flex-col gap-1 py-4 overflow-y-auto',
        isExpanded ? 'px-3' : 'items-center px-2'
      )}>
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
                  ? 'btn-secondary text-white'
                  : isActive
                  ? 'inv-sidebar-active text-white'
                  : 'text-gray-500 hover:text-white hover:bg-white/10'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {isExpanded && (
                <span className="text-sm font-bold truncate flex-1">{item.name}</span>
              )}
              {isTime && mounted && (
                <span className={cn(isExpanded ? 'ml-auto' : 'absolute top-1 right-1')}>
                  <TimerSidebarBadge isNavActive={!!isActive} />
                </span>
              )}
              {/* Active dot — only visible when expanded */}
              {!isTime && isExpanded && (
                <span className={cn(
                  'flex-shrink-0 rounded-full w-1.5 h-1.5 ml-auto transition-all duration-200',
                  isActive ? 'bg-white opacity-90' : 'border border-gray-600 opacity-30'
                )} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Expand / collapse toggle — sits below Help, above the bottom edge */}
      <div className={cn(
        'flex-shrink-0 border-t border-white/[0.06] py-3',
        isExpanded ? 'px-3' : 'flex justify-center'
      )}>
        <button
          suppressHydrationWarning
          onClick={toggle}
          title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          className={cn(
            'flex items-center rounded-xl text-gray-500 hover:text-white hover:bg-white/10 transition-all',
            isExpanded
              ? 'gap-3 px-3 py-2.5 w-full'
              : 'w-10 h-10 justify-center'
          )}
        >
          {isExpanded
            ? <><PanelLeftClose className="w-5 h-5 flex-shrink-0" /><span className="text-sm font-bold">Collapse</span></>
            : <PanelLeftOpen   className="w-5 h-5" />
          }
        </button>
      </div>
    </div>
  )
}
