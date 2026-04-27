/**
 * Returns a contextual welcome message based on the user's live business data.
 * Picks from situation-appropriate message pools so the greeting always
 * reflects what's actually happening in their business.
 */

export type DashboardContext = {
  overdueCount:    number
  pendingPayments: number   // dollars
  paidThisMonth:   number   // dollars
  totalRevenue:    number
  unbilledValue:   number
  expiringSoon:    number
  hasClients:      boolean
  isNewUser:       boolean  // no invoices, no payments
}

export function getContextualMessage(ctx: DashboardContext): string {
  const {
    overdueCount, pendingPayments, paidThisMonth,
    totalRevenue, unbilledValue, expiringSoon,
    hasClients, isNewUser,
  } = ctx

  // ── New user — first time experience ───────────────────────────────────
  if (isNewUser) {
    return pick([
      "Your financial OS is ready — let's get started",
      "Everything starts here. Add your first client",
      "From contract to cash — it begins now",
      "Your business command center is live",
      "Ready when you are",
    ])
  }

  // ── Urgent: overdue invoices ───────────────────────────────────────────
  if (overdueCount >= 3) {
    return pick([
      `${overdueCount} invoices need your attention`,
      "Time to chase those payments down",
      "Your pipeline needs a nudge — let's move",
      "Some clients are overdue. Let's fix that",
    ])
  }

  if (overdueCount === 1 || overdueCount === 2) {
    return pick([
      "One follow-up could unlock real cash flow",
      "A quick reminder could close an overdue invoice",
      "Small action, big impact — check those overdue invoices",
    ])
  }

  // ── Expiring contracts ─────────────────────────────────────────────────
  if (expiringSoon > 0) {
    return pick([
      "Contracts expiring soon — stay ahead of it",
      "Renew before it lapses — your contracts are watching",
    ])
  }

  // ── Strong month ───────────────────────────────────────────────────────
  if (paidThisMonth > 0 && overdueCount === 0) {
    return pick([
      "Money is moving — keep the momentum",
      "Solid month. Let's keep building",
      "Revenue is coming in. Stay consistent",
      "You're on track — this is what discipline looks like",
      "Clean pipeline, cash in. Good day",
    ])
  }

  // ── Unbilled time value sitting idle ──────────────────────────────────
  if (unbilledValue > 500) {
    return pick([
      "You have unbilled hours sitting idle — invoice them",
      "Time tracked but not invoiced. That's money waiting",
      "Convert those hours to cash today",
    ])
  }

  // ── Pending money waiting ──────────────────────────────────────────────
  if (pendingPayments > 1000) {
    return pick([
      "Money is in motion — keep watching it",
      "Your pipeline has value. Let's convert it",
      "Invoices are out there. Time to close them",
      "Revenue is in play — stay on top of it",
    ])
  }

  // ── Good general standing ──────────────────────────────────────────────
  if (totalRevenue > 0) {
    return pick([
      "Let's keep the money moving",
      "Everything in one place",
      "Your business, fully visible",
      "Time to make money moves",
      "From contract to cash — let's go",
      "Your numbers, front and center",
    ])
  }

  // ── Has clients but no revenue yet ─────────────────────────────────────
  if (hasClients) {
    return pick([
      "Clients are here. Time to send that first invoice",
      "Ready to get paid?",
      "Your first invoice is one click away",
      "Time to invoice — your clients are waiting",
    ])
  }

  // ── Fallback ───────────────────────────────────────────────────────────
  return pick([
    "Let's build something",
    "Your financial OS is ready",
    "Time to level up",
    "Let's get to work",
    "Your business awaits",
  ])
}

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Legacy random — kept for backward compat */
export function getWelcomeMessage(): string {
  return pick([
    "Let's keep the money moving",
    "Everything in one place",
    "Time to make money moves",
    "Your business, fully visible",
    "From contract to cash — let's go",
    "Ready to get paid?",
    "Time to level up",
    "Your numbers, front and center",
  ])
}
