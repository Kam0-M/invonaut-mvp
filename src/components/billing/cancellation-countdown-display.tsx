'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface CountdownDisplayProps {
  cancelAt: number // Unix timestamp
  currentTier: string
}

export default function CancellationCountdownDisplay({ cancelAt, currentTier }: CountdownDisplayProps) {
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [hasExpired, setHasExpired] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = Date.now()
      const diff = cancelAt * 1000 - now

      if (diff <= 0) {
        setHasExpired(true)
        // Redirect to pricing page after expiration
        setTimeout(() => {
          router.push('/pricing')
        }, 2000)
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeRemaining({ days, hours, minutes, seconds })
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [cancelAt, router])

  if (hasExpired) {
    return (
      <div className="text-center py-8">
        <h2 className="text-3xl font-black text-gray-900 mb-4">
          Subscription Ended
        </h2>
        <p className="text-gray-600">
          Redirecting you to the pricing page...
        </p>
      </div>
    )
  }

  return (
    <div className="text-center">
      <h2 className="text-2xl font-black text-gray-900 mb-6">
        Time Remaining Until Cancellation
      </h2>
      
      {/* Countdown Timer */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="text-5xl font-black mb-2">{timeRemaining.days}</div>
          <div className="text-sm font-medium uppercase tracking-wide">Days</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="text-5xl font-black mb-2">{timeRemaining.hours}</div>
          <div className="text-sm font-medium uppercase tracking-wide">Hours</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="text-5xl font-black mb-2">{timeRemaining.minutes}</div>
          <div className="text-sm font-medium uppercase tracking-wide">Minutes</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="text-5xl font-black mb-2">{timeRemaining.seconds}</div>
          <div className="text-sm font-medium uppercase tracking-wide">Seconds</div>
        </div>
      </div>

      <p className="text-gray-600 text-lg">
        Your subscription will automatically end and you'll be switched to the{' '}
        <span className="font-bold">Starter</span> plan.
      </p>
    </div>
  )
}