'use client'
// Dual-interval auto-refresh:
// - 5s  → fast refresh for AI Command Center cycling insights (data freshness)
// - 30s → full router.refresh() so all server-rendered data updates

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  fastInterval?: number  // ms, default 5000
  slowInterval?: number  // ms, default 30000
}

export default function DashboardAutoRefresh({
  fastInterval = 5_000,
  slowInterval = 30_000,
}: Props) {
  const router      = useRouter()
  const refreshCount = useRef(0)

  useEffect(() => {
    // Fast tick — used by AI Command Center to know data is fresh
    const fast = setInterval(() => {
      refreshCount.current += 1
      // Every 6th fast tick = 30s → do full router.refresh()
      if (refreshCount.current % Math.round(slowInterval / fastInterval) === 0) {
        router.refresh()
      }
    }, fastInterval)

    return () => clearInterval(fast)
  }, [router, fastInterval, slowInterval])

  return null
}
