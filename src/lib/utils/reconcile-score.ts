/**
 * Scores how likely a bank transaction is to match a given invoice.
 * Returns a score 0–100 and a confidence label.
 */

export interface ScoredInvoice {
  id: string
  invoice_number: string
  total_amount: number
  client_name: string
  due_date?: string
  score: number
  confidence: 'high' | 'medium' | 'low'
  reasons: string[]
}

export function scoreInvoiceMatch(
  txAmount: number,       // Plaid amount — positive = outflow, negative = inflow
  txDate: string,         // YYYY-MM-DD
  txDescription: string,  // raw Plaid description / merchant name
  invoice: {
    id: string
    invoice_number: string
    total_amount: number
    client_name: string
    due_date?: string
  }
): ScoredInvoice {
  const absAmount = Math.abs(txAmount)  // inflow amount is negative in Plaid
  const invoiceAmount = invoice.total_amount
  let score = 0
  const reasons: string[] = []

  // ── 1. Amount match (0–50 pts) ─────────────────────────────────────────
  const amountDiff = Math.abs(absAmount - invoiceAmount)
  const amountPct  = invoiceAmount > 0 ? amountDiff / invoiceAmount : 1

  if (amountDiff === 0) {
    score += 50
    reasons.push('Exact amount match')
  } else if (amountPct <= 0.01) {
    score += 45
    reasons.push('Amount within 1%')
  } else if (amountPct <= 0.05) {
    score += 35
    reasons.push('Amount within 5%')
  } else if (amountPct <= 0.15) {
    score += 15
    reasons.push('Amount within 15%')
  }
  // >15% difference gets 0 — unlikely match

  // ── 2. Date proximity (0–30 pts) ──────────────────────────────────────
  if (invoice.due_date) {
    const txMs  = new Date(txDate + 'T12:00:00').getTime()
    const dueMs = new Date(invoice.due_date + 'T12:00:00').getTime()
    const daysDiff = Math.abs((txMs - dueMs) / (1000 * 60 * 60 * 24))

    if (daysDiff <= 1) {
      score += 30
      reasons.push('Paid on due date')
    } else if (daysDiff <= 3) {
      score += 25
      reasons.push('Paid within 3 days of due date')
    } else if (daysDiff <= 7) {
      score += 20
      reasons.push('Paid within a week of due date')
    } else if (daysDiff <= 14) {
      score += 12
      reasons.push('Paid within 2 weeks of due date')
    } else if (daysDiff <= 30) {
      score += 5
      reasons.push('Paid within 30 days of due date')
    }
  }

  // ── 3. Client name in description (0–20 pts) ──────────────────────────
  const desc        = (txDescription ?? '').toLowerCase()
  const clientWords = invoice.client_name
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2)  // skip short words like "the", "co"

  const matchedWords = clientWords.filter(w => desc.includes(w))

  if (clientWords.length > 0) {
    const nameMatchRatio = matchedWords.length / clientWords.length
    if (nameMatchRatio >= 1) {
      score += 20
      reasons.push(`Full client name match — "${invoice.client_name}"`)
    } else if (nameMatchRatio >= 0.5) {
      score += 12
      reasons.push(`Partial client name match`)
    } else if (nameMatchRatio > 0) {
      score += 5
      reasons.push(`Possible client name in description`)
    }
  }

  // ── Confidence label ──────────────────────────────────────────────────
  const confidence: ScoredInvoice['confidence'] =
    score >= 75 ? 'high' :
    score >= 45 ? 'medium' : 'low'

  return {
    ...invoice,
    score,
    confidence,
    reasons,
  }
}

export function rankInvoiceMatches(
  txAmount: number,
  txDate: string,
  txDescription: string,
  invoices: Array<{ id: string; invoice_number: string; total_amount: number; client_name: string; due_date?: string }>
): ScoredInvoice[] {
  return invoices
    .map(inv => scoreInvoiceMatch(txAmount, txDate, txDescription, inv))
    .sort((a, b) => b.score - a.score)
}
