'use client'

import { useState } from 'react'

interface MetricCardValueProps {
  compact: string
  full: string
  colorClass: string
}

/**
 * Displays a compact metric value. If compact !== full (i.e. the number was
 * abbreviated), hovering or clicking reveals the exact full value in a tooltip.
 */
export default function MetricCardValue({ compact, full, colorClass }: MetricCardValueProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const isAbbreviated = compact !== full

  return (
    <div className="relative inline-block w-full">
      <p
        className={`text-3xl font-black truncate ${colorClass} ${isAbbreviated ? 'cursor-help underline decoration-dotted underline-offset-4 decoration-current/30' : ''}`}
        onMouseEnter={() => isAbbreviated && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => isAbbreviated && setShowTooltip(prev => !prev)}
      >
        {compact}
      </p>

      {isAbbreviated && showTooltip && (
        <div className="absolute bottom-full left-0 mb-2 z-50 pointer-events-none">
          <div className="bg-gray-900 text-white text-sm font-bold px-3 py-2 rounded-xl whitespace-nowrap shadow-xl">
            {full}
            <div className="absolute top-full left-4 w-0 h-0"
              style={{
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid #111827',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}