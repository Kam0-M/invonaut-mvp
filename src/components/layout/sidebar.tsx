'use client'

import Link            from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn }          from '@/lib/utils'
import {
  LayoutDashboard, FileText, ScrollText, Users, ExternalLink,
  BarChart3, HelpCircle, Sparkles,
  Receipt, Clock, TrendingUp, Banknote,
  PanelLeftClose, PanelLeftOpen,
  FileBarChart2,
} from 'lucide-react'
import TimerSidebarBadge from '@/components/time/timer-sidebar-badge'

interface SidebarProps {
  subscriptionTier?: string
  overdueCount?:    number
  highRiskCount?:   number
}

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

export function Sidebar({
  subscriptionTier = 'starter',
  overdueCount     = 0,
  highRiskCount    = 0,
}: SidebarProps) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)
  const [mounted,  setMounted]  = useState(false)

  useEffect(() => {
    setMounted(true)
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
        isExpanded ? 'px-4 gap-2' : 'justify-center'
      )}>
        <Link href="/dashboard" title="Dashboard"
          className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center hover:bg-blue-500 transition-colors flex-shrink-0 overflow-hidden p-1">
          <img src="/naut-white.svg" alt="Invonaut" className="w-full h-full object-contain" draggable={false} />
        </Link>
        {isExpanded && (
          <span className="text-white font-black text-[11px] tracking-[0.14em] uppercase truncate">INVONAUT</span>
        )}
      </div>

      {/* Nav items */}
      <nav className={cn(
        'flex-1 flex flex-col gap-0.5 py-3 overflow-y-auto',
        isExpanded ? 'px-2.5' : 'items-center px-2'
      )}>
        {nav.map((item) => {
          const Icon      = item.icon
          const isActive  = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname?.startsWith(item.href)
          const isUpgrade = item.name === 'Upgrade'
          const isTime    = item.name === 'Time'
          const isInvoice = item.name === 'Invoices'
          const isAnalytics = item.name === 'Analytics'

          // Badge logic
          const showOverdueBadge  = isInvoice   && overdueCount  > 0
          const showRiskBadge     = isAnalytics  && highRiskCount > 0

          return (
            <Link
              key={item.name}
              href={item.href}
              title={!isExpanded ? item.name : undefined}
              className={cn(
                'relative flex items-center rounded-xl transition-all duration-150',
                isExpanded ? 'gap-2.5 px-3 py-2' : 'w-10 h-10 justify-center',
                isUpgrade
                  ? 'btn-secondary text-white'
                  : isActive
                  ? 'inv-sidebar-active text-white'
                  : 'text-gray-500 hover:text-white hover:bg-white/[0.07]'
              )}
            >
              {/* Active left-edge accent */}
              {isActive && !isUpgrade && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-white/60" />
              )}

              <Icon className="w-4.5 h-4.5 flex-shrink-0" style={{ width: 18, height: 18 }} />

              {isExpanded && (
                <span
                  className="text-[12.5px] font-bold truncate flex-1 leading-none"
                  style={{ letterSpacing: '0.01em' }}
                >
                  {item.name}
                </span>
              )}

              {/* Timer badge (Time nav item) */}
              {isTime && mounted && (
                <span className={cn(isExpanded ? 'ml-auto' : 'absolute top-0.5 right-0.5')}>
                  <TimerSidebarBadge isNavActive={!!isActive} />
                </span>
              )}

              {/* Overdue badge (Invoices nav item) */}
              {showOverdueBadge && mounted && (
                isExpanded ? (
                  <span className="ml-auto flex-shrink-0 text-[9px] font-black bg-red-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none tabular-nums">
                    {overdueCount > 9 ? '9+' : overdueCount}
                  </span>
                ) : (
                  <span className="absolute top-0.5 right-0.5 w-[14px] h-[14px] rounded-full bg-red-500 flex items-center justify-center text-[8px] font-black text-white leading-none">
                    {overdueCount > 9 ? '9' : overdueCount}
                  </span>
                )
              )}

              {/* High-risk badge (Analytics nav item) */}
              {showRiskBadge && mounted && !showOverdueBadge && (
                isExpanded ? (
                  <span className="ml-auto flex-shrink-0 text-[9px] font-black bg-orange-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none tabular-nums">
                    {highRiskCount > 9 ? '9+' : highRiskCount}
                  </span>
                ) : (
                  <span className="absolute top-0.5 right-0.5 w-[14px] h-[14px] rounded-full bg-orange-500 flex items-center justify-center text-[8px] font-black text-white leading-none">
                    {highRiskCount > 9 ? '9' : highRiskCount}
                  </span>
                )
              )}

              {/* Active indicator dot — expanded only, non-special items */}
              {!isTime && !isUpgrade && !showOverdueBadge && !showRiskBadge && isExpanded && (
                <span className={cn(
                  'flex-shrink-0 rounded-full transition-all duration-200 ml-auto',
                  isActive ? 'w-1.5 h-1.5 bg-white opacity-80' : 'w-1 h-1 bg-white/20'
                )} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Expand / collapse toggle */}
      <div className={cn(
        'flex-shrink-0 border-t border-white/[0.06] py-3',
        isExpanded ? 'px-2.5' : 'flex justify-center'
      )}>
        <button
          suppressHydrationWarning
          onClick={toggle}
          title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          className={cn(
            'flex items-center rounded-xl text-gray-500 hover:text-white hover:bg-white/[0.07] transition-all',
            isExpanded
              ? 'gap-2.5 px-3 py-2 w-full'
              : 'w-10 h-10 justify-center'
          )}
        >
          {isExpanded
            ? <><PanelLeftClose className="w-[18px] h-[18px] flex-shrink-0" /><span className="text-[12.5px] font-bold" style={{letterSpacing:'0.01em'}}>Collapse</span></>
            : <PanelLeftOpen className="w-[18px] h-[18px]" />
          }
        </button>
      </div>
    </div>
  )
}
