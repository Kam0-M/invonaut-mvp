'use client'
// src/components/time/timer-sidebar-badge.tsx
//
// WHAT IT DOES:
//   Renders a live green pulsing dot + elapsed time string next to "Time" in the sidebar.
//   Only visible when a timer is actively running.
//   Reads from useTimer() which hydrates from localStorage — so if the user started a
//   timer, left the page, and came back, the indicator resumes immediately on mount.
//
// WHY IT'S A SEPARATE COMPONENT:
//   The sidebar is rendered on every dashboard page. If we imported useTimer() directly
//   into the main Sidebar component, the 1-second tick interval would cause the entire
//   sidebar to re-render every second — unnecessarily touching all nav items.
//   By isolating the live state here, only this tiny component re-renders each second.
//   The rest of the sidebar stays completely static.
//
// USAGE in sidebar.tsx:
//   import TimerSidebarBadge from '@/components/time/timer-sidebar-badge'
//   ...
//   {item.name === 'Time' && <TimerSidebarBadge isNavActive={isActive} />}

import { useTimer } from '@/hooks/use-timer'
import { formatDurationClock } from '@/lib/utils/time-formatting'

interface TimerSidebarBadgeProps {
  isNavActive: boolean  // passed so badge can invert its colors when the nav item is highlighted
}

export default function TimerSidebarBadge({ isNavActive }: TimerSidebarBadgeProps) {
  const { isRunning, elapsed } = useTimer()

  if (!isRunning) return null

  return (
    <span className="ml-auto flex items-center gap-1.5 flex-shrink-0">
      {/* Pulsing green dot */}
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      {/* Elapsed time */}
      <span className={`text-xs font-black tabular-nums tracking-tight ${
        isNavActive ? 'text-white/90' : 'text-green-700'
      }`}>
        {formatDurationClock(elapsed)}
      </span>
    </span>
  )
}