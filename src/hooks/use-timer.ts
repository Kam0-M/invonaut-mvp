'use client'
// src/hooks/use-timer.ts
// Persists a running timer across page navigation using localStorage.
// The timer is global — only one can run at a time per browser session.
//
// WHY THE ORIGINAL BROKE THE SIDEBAR INDICATOR:
//   React state is instance-local. When TimeTracker called timer.start(), only
//   THAT component's useTimer instance got setIsRunning(true). The sidebar's
//   separate useTimer instance had already run its mount useEffect (with []),
//   found nothing running, and was permanently stuck at isRunning=false.
//   The sidebar never unmounts during navigation, so the effect never re-ran.
//
// THE FIX — custom DOM events:
//   Any call to start(), stop(), or reset() now dispatches 'invonaut_timer_change'
//   on window. Every mounted useTimer instance listens for that event and re-syncs
//   from localStorage. This gives shared, reactive state without a context provider.
//   Cost: one tiny event dispatch per user action — negligible.

import { useState, useEffect, useRef, useCallback } from 'react'

const LS_RUNNING     = 'invonaut_timer_running'
const LS_START       = 'invonaut_timer_start_ts'
const LS_CLIENT_ID   = 'invonaut_timer_client_id'
const LS_DESCRIPTION = 'invonaut_timer_description'

// Custom event name shared across all hook instances in this tab
const TIMER_EVENT = 'invonaut_timer_change'

function broadcast() {
  window.dispatchEvent(new CustomEvent(TIMER_EVENT))
}

export interface TimerState {
  isRunning:   boolean
  elapsed:     number
  clientId:    string
  description: string
  start:       (clientId: string, description: string) => void
  stop:        () => { startedAt: string; endedAt: string; durationSeconds: number }
  reset:       () => void
}

export function useTimer(): TimerState {
  const [isRunning,    setIsRunning]    = useState(false)
  const [elapsed,      setElapsed]      = useState(0)
  const [clientId,     setClientId]     = useState('')
  const [description,  setDescription]  = useState('')
  const [startTs,      setStartTs]      = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Sync from localStorage ──────────────────────────────────────────────
  // Called on mount AND whenever another useTimer instance broadcasts a change.
  const syncFromStorage = useCallback(() => {
    const running = localStorage.getItem(LS_RUNNING) === 'true'
    const ts      = localStorage.getItem(LS_START)
    const cid     = localStorage.getItem(LS_CLIENT_ID) ?? ''
    const dsc     = localStorage.getItem(LS_DESCRIPTION) ?? ''

    if (running && ts) {
      setIsRunning(true)
      setStartTs(ts)
      setClientId(cid)
      setDescription(dsc)
      setElapsed(Math.floor((Date.now() - new Date(ts).getTime()) / 1000))
    } else {
      setIsRunning(false)
      setStartTs(null)
      setClientId('')
      setDescription('')
      setElapsed(0)
    }
  }, [])

  useEffect(() => {
    syncFromStorage()                               // hydrate on mount
    window.addEventListener(TIMER_EVENT, syncFromStorage)
    return () => window.removeEventListener(TIMER_EVENT, syncFromStorage)
  }, [syncFromStorage])

  // ── Tick interval ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRunning || !startTs) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(startTs).getTime()) / 1000))
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning, startTs])

  // ── Actions ─────────────────────────────────────────────────────────────
  const start = useCallback((cid: string, dsc: string) => {
    const ts = new Date().toISOString()
    localStorage.setItem(LS_RUNNING,     'true')
    localStorage.setItem(LS_START,       ts)
    localStorage.setItem(LS_CLIENT_ID,   cid)
    localStorage.setItem(LS_DESCRIPTION, dsc)
    setIsRunning(true)
    setStartTs(ts)
    setClientId(cid)
    setDescription(dsc)
    setElapsed(0)
    broadcast()   // ← notify sidebar badge and any other mounted useTimer instances
  }, [])

  const stop = useCallback((): { startedAt: string; endedAt: string; durationSeconds: number } => {
    const ts      = localStorage.getItem(LS_START) ?? new Date().toISOString()
    const endedAt = new Date().toISOString()
    const durationSeconds = Math.floor(
      (new Date(endedAt).getTime() - new Date(ts).getTime()) / 1000
    )
    localStorage.removeItem(LS_RUNNING)
    localStorage.removeItem(LS_START)
    localStorage.removeItem(LS_CLIENT_ID)
    localStorage.removeItem(LS_DESCRIPTION)
    setIsRunning(false)
    setElapsed(0)
    setClientId('')
    setDescription('')
    setStartTs(null)
    broadcast()   // ← notify sidebar badge
    return { startedAt: ts, endedAt, durationSeconds }
  }, [])

  const reset = useCallback(() => {
    localStorage.removeItem(LS_RUNNING)
    localStorage.removeItem(LS_START)
    localStorage.removeItem(LS_CLIENT_ID)
    localStorage.removeItem(LS_DESCRIPTION)
    setIsRunning(false)
    setElapsed(0)
    setClientId('')
    setDescription('')
    setStartTs(null)
    broadcast()   // ← notify sidebar badge
  }, [])

  return { isRunning, elapsed, clientId, description, start, stop, reset }
}