'use client'
// src/hooks/use-timer.ts
// Persists a running timer across page navigation using localStorage.
// The timer is global — only one can run at a time per browser session.
//
// WHY localStorage:
//   Next.js navigates between pages without a full reload, but React state
//   resets on unmount. localStorage survives navigation so the timer keeps
//   ticking even when the user visits Invoices, Clients, etc.
//
// USAGE:
//   const timer = useTimer()
//   timer.start(clientId, description)   // begins timing
//   timer.stop()                         // stops and returns the elapsed seconds
//   timer.reset()                        // clears without saving
//   timer.elapsed                        // current elapsed seconds (live)
//   timer.isRunning                      // boolean
//   timer.clientId                       // active client UUID or ''
//   timer.description                    // active description

import { useState, useEffect, useRef, useCallback } from 'react'

const LS_RUNNING     = 'invonaut_timer_running'
const LS_START       = 'invonaut_timer_start_ts'   // ISO string
const LS_CLIENT_ID   = 'invonaut_timer_client_id'
const LS_DESCRIPTION = 'invonaut_timer_description'

export interface TimerState {
  isRunning:   boolean
  elapsed:     number      // seconds since start
  clientId:    string
  description: string
  start:       (clientId: string, description: string) => void
  stop:        () => { startedAt: string; endedAt: string; durationSeconds: number }
  reset:       () => void
}

export function useTimer(): TimerState {
  const [isRunning, setIsRunning]     = useState(false)
  const [elapsed, setElapsed]         = useState(0)
  const [clientId, setClientId]       = useState('')
  const [description, setDescription] = useState('')
  const [startTs, setStartTs]         = useState<string | null>(null)
  const intervalRef                   = useRef<ReturnType<typeof setInterval> | null>(null)

  // Hydrate from localStorage on mount (runs only in browser)
  useEffect(() => {
    const running = localStorage.getItem(LS_RUNNING) === 'true'
    if (!running) return
    const ts  = localStorage.getItem(LS_START)
    const cid = localStorage.getItem(LS_CLIENT_ID) ?? ''
    const dsc = localStorage.getItem(LS_DESCRIPTION) ?? ''
    if (!ts) return
    setIsRunning(true)
    setStartTs(ts)
    setClientId(cid)
    setDescription(dsc)
    const elapsed = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
    setElapsed(elapsed)
  }, [])

  // Tick
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
  }, [])

  const stop = useCallback((): { startedAt: string; endedAt: string; durationSeconds: number } => {
    const ts      = localStorage.getItem(LS_START) ?? new Date().toISOString()
    const endedAt = new Date().toISOString()
    const durationSeconds = Math.floor((new Date(endedAt).getTime() - new Date(ts).getTime()) / 1000)
    localStorage.removeItem(LS_RUNNING)
    localStorage.removeItem(LS_START)
    localStorage.removeItem(LS_CLIENT_ID)
    localStorage.removeItem(LS_DESCRIPTION)
    setIsRunning(false)
    setElapsed(0)
    setClientId('')
    setDescription('')
    setStartTs(null)
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
  }, [])

  return { isRunning, elapsed, clientId, description, start, stop, reset }
}