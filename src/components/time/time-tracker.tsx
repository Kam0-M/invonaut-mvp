'use client'

import { useCurrency } from '@/lib/context/currency-context'
// src/components/time/time-tracker.tsx
// The live timer widget displayed at the top of /dashboard/time.
// 
// WHAT IT DOES:
//   - Shows a client selector and description field
//   - Start button begins timing, persisted in localStorage via useTimer()
//   - The elapsed time ticks every second in hh:mm:ss
//   - Stop button saves the entry to /api/time/create and refreshes the page
//   - If there's already a running timer (from a previous session), it resumes it
//   - Hourly rate is read from the selected client's hourly_rate column and
//     shown as a live billable amount preview so the user knows what they're earning

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Square, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useTimer } from '@/hooks/use-timer'
import { formatDurationClock, calcBillableAmount } from '@/lib/utils/time-formatting'

type Client = {
  id: string
  name: string
  company: string | null
  hourly_rate: number | null
}

interface TimeTrackerProps {
  clients: Client[]
}

export default function TimeTracker({
  clients }: TimeTrackerProps) {
  const { format: fmt, symbol } = useCurrency()
  const router = useRouter()
  const timer  = useTimer()

  const [selectedClientId,  setSelectedClientId]  = useState(timer.clientId)
  const [description,       setDescription]        = useState(timer.description)
  const [isSaving,          setIsSaving]           = useState(false)

  // Keep local state in sync with timer state when resuming a session
  useEffect(() => {
    if (timer.isRunning) {
      setSelectedClientId(timer.clientId)
      setDescription(timer.description)
    }
  }, [timer.isRunning, timer.clientId, timer.description])

  const selectedClient = clients.find(c => c.id === selectedClientId) ?? null
  const hourlyRate     = selectedClient?.hourly_rate ?? null
  const liveAmount     = hourlyRate ? calcBillableAmount(timer.elapsed, hourlyRate) : null

  const handleStart = () => {
    if (!description.trim()) {
      toast.error('Enter a description before starting the timer.')
      return
    }
    timer.start(selectedClientId, description.trim())
    toast.success('Timer started.')
  }

  const handleStop = async () => {
    setIsSaving(true)
    const { startedAt, endedAt, durationSeconds } = timer.stop()

    if (durationSeconds < 1) {
      toast.error('Timer stopped too quickly — no entry saved.')
      setIsSaving(false)
      return
    }

    try {
      const res = await fetch('/api/time/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          description: description.trim() || 'Untitled session',
          clientId:    selectedClientId || null,
          startedAt,
          endedAt,
          durationSeconds,
          hourlyRate:  hourlyRate ?? null,
          billable:    true,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Could not save time entry.')
        return
      }
      toast.success('Time entry saved.')
      setDescription('')
      setSelectedClientId('')
      router.refresh()
    } catch {
      toast.error('Could not save time entry. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={`rounded-2xl border p-6 transition-all ${
      timer.isRunning
        ? 'bg-[#F8FAFF] border-blue-200'
        : 'bg-white border-gray-100'
    }`}>
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          timer.isRunning ? 'bg-blue-600' : 'bg-gray-100'
        }`}>
          <Clock className={`w-5 h-5 ${timer.isRunning ? 'text-white' : 'text-gray-500'}`} />
        </div>
        <div>
          <h2 className="font-black text-gray-900 tracking-tight">
            {timer.isRunning ? 'Timer Running' : 'Start Timer'}
          </h2>
          <p className="text-sm text-gray-500 font-medium">
            {timer.isRunning ? 'Click Stop to save this session' : 'Track billable time for a client'}
          </p>
        </div>
        {/* Live clock */}
        {timer.isRunning && (
          <div className="ml-auto text-right">
            <div className="text-3xl font-black text-blue-700 tabular-nums tracking-tight">
              {formatDurationClock(timer.elapsed)}
            </div>
            {liveAmount !== null && (
              <div className="text-sm font-bold text-blue-500 mt-0.5">
                {fmt(liveAmount)} @ {symbol}{hourlyRate}/hr
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Client selector */}
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
            Client (optional)
          </label>
          <select
            value={selectedClientId}
            onChange={e => setSelectedClientId(e.target.value)}
            disabled={timer.isRunning || isSaving}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm font-medium
                       focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all
                       bg-white disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="">No client</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}{c.company ? ` — ${c.company}` : ''}{c.hourly_rate ? ` (${symbol}${c.hourly_rate}/hr)` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
            What are you working on? <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !timer.isRunning) handleStart() }}
            disabled={timer.isRunning || isSaving}
            placeholder="e.g. Homepage redesign, Client call..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm
                       focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all
                       disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>
      </div>

      {/* Start / Stop button */}
      {!timer.isRunning ? (
        <button
          onClick={handleStart}
          disabled={isSaving}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white
                     px-6 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800
                     hover: transition-all disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
          Start Timer
        </button>
      ) : (
        <button
          onClick={handleStop}
          disabled={isSaving}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white
                     px-6 py-3 rounded-xl font-bold hover:from-red-600 hover:to-red-700
                     hover: transition-all disabled:opacity-50"
        >
          <Square className="w-4 h-4 fill-current" />
          {isSaving ? 'Saving...' : 'Stop & Save'}
        </button>
      )}
    </div>
  )
}