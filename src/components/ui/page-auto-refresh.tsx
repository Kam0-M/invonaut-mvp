'use client'
// Silently calls router.refresh() on an interval so server-rendered pages
// stay current without a full page reload.
// Default: 30s. Pass interval={5000} for faster refresh.

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PageAutoRefresh({ interval = 30_000 }: { interval?: number }) {
  const router = useRouter()
  useEffect(() => {
    const t = setInterval(() => router.refresh(), interval)
    return () => clearInterval(t)
  }, [router, interval])
  return null
}
