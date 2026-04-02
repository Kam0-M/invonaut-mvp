'use client'

// SuccessReload — polls /api/check-subscription-status every 3s after Stripe checkout.
//
// WHY THIS EXISTS:
//   Stripe redirects to /dashboard/billing?success=true immediately after checkout,
//   but the checkout.session.completed webhook fires asynchronously (5–30s later).
//   Without polling, the page loads with hasActiveSubscription=false because the DB
//   hasn't been updated yet. The user sees "no subscription" even after paying.
//
// HOW IT WORKS:
//   1. shouldReload is true when ?success=true AND hasActiveSubscription is still false
//   2. We poll /api/check-subscription-status every 3s (lightweight — single DB read)
//   3. Once active === true, we call router.refresh() — re-fetches server data in place
//   4. After 10 attempts (30s) we stop — edge case for webhook failures
//   5. The ?success=true param stays in the URL during polling so the banner stays visible

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function SuccessReload({ shouldReload }: { shouldReload: boolean }) {
  const router = useRouter()
  const attemptsRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!shouldReload) return

    const poll = async () => {
      try {
        const res = await fetch('/api/check-subscription-status')
        const data = await res.json()

        if (data.active) {
          // Webhook has landed — refresh server data in place (keeps ?success=true URL)
          router.refresh()
          return
        }
      } catch {
        // Network error — keep polling
      }

      attemptsRef.current += 1

      if (attemptsRef.current < 10) {
        timerRef.current = setTimeout(poll, 3000)
      }
      // After 10 attempts (~30s) we stop silently — Stripe webhook likely delayed/failed
    }

    // Start first poll after 3s — give Stripe time to fire the webhook
    timerRef.current = setTimeout(poll, 3000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [shouldReload, router])

  return null
}