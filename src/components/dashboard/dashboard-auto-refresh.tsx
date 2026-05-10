'use client'
// Calls router.refresh() every 10s so server-rendered dashboard data
// (charts, metrics, activity feed) stays current without a full page reload.

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  interval?: number  // ms, default 10000
}

export default function DashboardAutoRefresh({ interval = 10_000 }: Props) {
  const router = useRouter()

  useEffect(() => {
    const t = setInterval(() => router.refresh(), interval)
    return () => clearInterval(t)
  }, [router, interval])

  return null
}