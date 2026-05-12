'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

/**
 * Appears as a fixed pill on the bottom-right once the user scrolls
 * past a threshold. Smooth-scrolls back to the top on click.
 * Used on long data pages: invoices, clients, cash flow, analytics.
 */
export default function BackToTop({ threshold = 400 }: { threshold?: number }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  if (!visible) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className="
        fixed bottom-6 right-6 z-50
        flex items-center gap-1.5
        px-3 py-2 rounded-xl
        bg-white border border-gray-200
        text-xs font-bold text-gray-600
        shadow-md hover:shadow-lg
        hover:-translate-y-0.5
        transition-all duration-200
      "
      style={{ animation: 'inv-fade-up 0.2s ease both' }}
    >
      <ArrowUp className="w-3.5 h-3.5" />
      Top
    </button>
  )
}
