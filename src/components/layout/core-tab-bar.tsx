'use client'
// src/components/layout/core-tab-bar.tsx
//
// The pill tab bar that sits at the top of the 4 core pages
// (Invoices, Payments, Cash Flow, Contracts) — matching the demo exactly.
// Clicking a tab navigates to that page while keeping scroll position.

import Link      from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Banknote, TrendingUp, FileCheck } from 'lucide-react'

const TABS = [
  { id: 'invoices',  label: 'Invoices',   href: '/dashboard/invoices', icon: FileText  },
  { id: 'payments',  label: 'Payments',   href: '/dashboard/payments', icon: Banknote  },
  { id: 'cashflow',  label: 'Cash Flow',  href: '/dashboard/cash',     icon: TrendingUp},
  { id: 'contracts', label: 'Contracts',  href: '/dashboard/contracts',icon: FileCheck },
]

export default function CoreTabBar() {
  const pathname = usePathname()

  return (
    <div className="overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0 sm:overflow-visible">
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6 min-w-fit">
        {TABS.map(tab => {
          const isActive = pathname?.startsWith(tab.href)
          const Icon = tab.icon
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`
                flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 whitespace-nowrap flex-shrink-0
                ${isActive
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }
              `}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              {tab.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
