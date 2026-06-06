// src/lib/utils/currency.ts
// ─────────────────────────────────────────────────────────────────────────────
// Server-safe currency utilities.
// NO 'use client' directive — this file can be imported by server components,
// server actions, API routes, email templates, AND client components.
//
// Client components should use useCurrency() from currency-context for
// reactive formatting. Server components use makeCurrencyFormatter() directly.
// ─────────────────────────────────────────────────────────────────────────────

export const CURRENCY_LOCALE: Record<string, string> = {
  USD: 'en-US', GBP: 'en-GB', EUR: 'de-DE', CAD: 'en-CA',
  AUD: 'en-AU', NZD: 'en-NZ', SGD: 'en-SG', CHF: 'de-CH',
  ZAR: 'en-ZA', NGN: 'en-NG', KES: 'sw-KE', INR: 'en-IN',
  JPY: 'ja-JP', BRL: 'pt-BR', MXN: 'es-MX',
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', GBP: '£', EUR: '€', CAD: 'CA$',
  AUD: 'A$', NZD: 'NZ$', SGD: 'S$', CHF: 'CHF ',
  ZAR: 'R', NGN: '₦', KES: 'KSh', INR: '₹',
  JPY: '¥', BRL: 'R$', MXN: 'MX$',
}

/**
 * Returns a full (2dp) currency formatter for the given ISO code.
 * Safe to call on the server.
 */
export function makeCurrencyFormatter(
  currency = 'USD',
  _symbol?: string,
): (n: number) => string {
  const locale = CURRENCY_LOCALE[currency] ?? 'en-US'
  return (n: number) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n)
}

/**
 * Returns a compact formatter that abbreviates large values:
 *   999_500+ → 1.0M, 9_950+ → 10K, else full format.
 * Safe to call on the server.
 */
export function makeCompactFormatter(
  currency = 'USD',
  symbol?: string,
): (n: number) => string {
  const sym = symbol ?? CURRENCY_SYMBOLS[currency] ?? '$'
  const base = makeCurrencyFormatter(currency)
  return (n: number) => {
    const abs  = Math.abs(n)
    const sign = n < 0 ? '-' : ''
    if (abs >= 999_500) return `${sign}${sym}${(abs / 1_000_000).toFixed(1)}M`
    if (abs >= 9_950)   return `${sign}${sym}${(abs / 1_000).toFixed(0)}K`
    return base(n)
  }
}
