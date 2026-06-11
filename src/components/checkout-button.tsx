'use client'

import { useState } from 'react'

type CheckoutButtonProps = {
  priceId: string
  planId: string
  buttonText: string
  className?: string
  disabled?: boolean
}

export default function CheckoutButton({ 
  priceId, 
  planId, 
  buttonText,
  className = "w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all",
  disabled = false
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckout = async () => {
    setIsLoading(true)
    
    try {
      const formData = new FormData()
      formData.append('priceId', priceId)
      formData.append('planId', planId)

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.error) {
        console.error('Checkout error:', data.error)
        window.location.href = '/dashboard/billing?error=checkout_failed'
        return
      }

      if (data.url) {
        // Redirect to Stripe or success page
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      window.location.href = '/dashboard/billing?error=checkout_failed'
    } finally {
      // Don't set loading to false because we're redirecting
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={disabled || isLoading}
      className={className}
    >
      {isLoading ? 'Loading...' : buttonText}
    </button>
  )
}