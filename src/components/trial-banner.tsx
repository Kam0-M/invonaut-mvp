'use client'

import { useState, useEffect } from 'react'

interface TrialBannerProps {
  trialEndDate: Date
  planName: string
  planPrice: number
}

export default function TrialBanner({ trialEndDate, planName, planPrice }: TrialBannerProps) {
  const [daysLeft, setDaysLeft] = useState(0)
  const [hoursLeft, setHoursLeft] = useState(0)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const end = trialEndDate.getTime()
      const difference = end - now

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        setDaysLeft(days)
        setHoursLeft(hours)
      }
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000 * 60) // Update every minute

    return () => clearInterval(interval)
  }, [trialEndDate])

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 border-2 border-blue-500 rounded-xl p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-white mb-1">
            🎁 {planName} Free Trial Active
          </h3>
          <p className="text-sm text-blue-100 font-semibold">
            {daysLeft} {daysLeft === 1 ? 'day' : 'days'} and {hoursLeft} {hoursLeft === 1 ? 'hour' : 'hours'} remaining
          </p>
          <p className="text-xs text-blue-200 mt-2">
            Your trial ends on <span className="font-bold">{trialEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>. After that, you'll be charged <span className="font-bold">${planPrice}/month</span>.
          </p>
          <p className="text-xs text-blue-100 mt-1 italic">
            Cancel anytime before then with no charge.
          </p>
        </div>
      </div>
    </div>
  )
}