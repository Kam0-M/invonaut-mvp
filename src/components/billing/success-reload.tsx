'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SuccessReload({ shouldReload }: { shouldReload: boolean }) {
  const router = useRouter()
  
  useEffect(() => {
    if (shouldReload) {
      const timer = setTimeout(() => {
        router.push('/dashboard/billing')
        router.refresh()
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [shouldReload, router])
  
  return null
}