'use client'
// src/lib/context/currency-context.tsx
// Provides currency formatting to all dashboard client components.
// Wrap the dashboard layout with <CurrencyProvider>; consume with useCurrency().
//
// Server components should import makeCurrencyFormatter from @/lib/utils/currency
// directly — they cannot use this 'use client' file.

import { createContext, useContext, useMemo } from 'react'
import { CURRENCY_LOCALE, makeCurrencyFormatter as _makeFmt } from '@/lib/utils/currency'

// Re-export so any file that already imports makeCurrencyFormatter from here
// still compiles without changes — but server pages must switch to @/lib/utils/currency.
export { makeCurrencyFormatter } from '@/lib/utils/currency'

export interface CurrencyCtx {
  currency:    string          // ISO code e.g. 'ZAR'
  symbol:      string          // e.g. 'R'
  locale:      string          // e.g. 'en-ZA'
  format:      (n: number, opts?: { compact?: boolean; decimals?: number }) => string
  formatRaw:   (n: number) => string  // symbol + 2dp, no locale grouping oddities
}

const CurrencyContext = createContext<CurrencyCtx>({
  currency:  'USD',
  symbol:    '$',
  locale:    'en-US',
  format:    (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n),
  formatRaw: (n) => `$${n.toFixed(2)}`,
})

export function CurrencyProvider({
  children,
  currency = 'USD',
  symbol   = '$',
}: {
  children: React.ReactNode
  currency?: string
  symbol?:   string
}) {
  const locale = CURRENCY_LOCALE[currency] ?? 'en-US'

  const ctx = useMemo<CurrencyCtx>(() => {
    const fmt = (n: number, opts?: { compact?: boolean; decimals?: number }) => {
      if (opts?.compact) {
        const abs = Math.abs(n)
        const sign = n < 0 ? '-' : ''
        if (abs >= 999_500)  return `${sign}${symbol}${(abs / 1_000_000).toFixed(1)}M`
        if (abs >= 9_950)    return `${sign}${symbol}${(abs / 1_000).toFixed(0)}K`
        return new Intl.NumberFormat(locale, {
          style: 'currency', currency,
          minimumFractionDigits: opts?.decimals ?? 0,
          maximumFractionDigits: opts?.decimals ?? 0,
        }).format(n)
      }
      return new Intl.NumberFormat(locale, {
        style: 'currency', currency,
        minimumFractionDigits: opts?.decimals ?? 2,
        maximumFractionDigits: opts?.decimals ?? 2,
      }).format(n)
    }

    return {
      currency,
      symbol,
      locale,
      format:    fmt,
      formatRaw: (n) => `${symbol}${Math.abs(n).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    }
  }, [currency, symbol, locale])

  return <CurrencyContext.Provider value={ctx}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  return useContext(CurrencyContext)
}


