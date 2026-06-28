'use client'

import { useState } from 'react'
import { buttonVariants, type ButtonVariant } from '@/components/ui/button'

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
  className,
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

  // Checklist #28 — previously took a raw className with its own gradient/padding/
  // radius baked in by every caller. Now sources its look from the shared
  // buttonVariants() helper (variant inferred from caller's className containing
  // "btn-secondary", default otherwise), with caller className layered on top for
  // one-off width/sizing only.
  const variant: ButtonVariant = className?.includes('btn-secondary') ? 'secondary' : 'primary'

  return (
    <button
      onClick={handleCheckout}
      disabled={disabled || isLoading}
      className={buttonVariants({ variant, size: 'sm', className })}
    >
      {isLoading ? 'Loading...' : buttonText}
    </button>
  )
}