'use client'
// Dropped onto the cash flow page once Pro gate is passed.
// Sets a localStorage flag the onboarding checklist reads to
// mark "Check your 90-day cash flow" as done automatically.
import { useEffect } from 'react'

export default function MarkCashFlowVisited() {
  useEffect(() => {
    localStorage.setItem('inv_cash_visited', 'true')
  }, [])
  return null
}
