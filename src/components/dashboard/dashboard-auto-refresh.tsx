'use client'
// src/components/dashboard/dashboard-auto-refresh.tsx
//
// Silently calls router.refresh() every 30 seconds so the server-rendered
// dashboard re-fetches all data — keeping the activity feed, revenue cards,
// and recent invoices up to date without a full page reload.
//
// 30 seconds is a reasonable interval: responsive enough to feel "live",
// light enough to not hammer the DB.

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardAutoRefresh() {
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 30_000) // 30 seconds

    return () => clearInterval(interval)
  }, [router])

  return null // renders nothing — purely behavioural
}
