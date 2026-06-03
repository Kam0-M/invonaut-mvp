'use client'

import { useCurrency } from '@/lib/context/currency-context'
// src/app/dashboard/time/new/page.tsx
//
// WHAT THIS PAGE DOES:
//   Manual time entry — for hours the user worked without running the live timer.
//   Examples: a phone call, a late-remembered work session, offline work.
//
//   Fields:
//     - Client (optional, select from dropdown — pre-fills hourly rate)
//     - Description (required)
//     - Date (required, defaults to today)
//     - Start time + End time (duration auto-calculates in real time)
//     - Hourly rate (pre-filled from client.hourly_rate, user can override)
//     - Billable toggle (defaults to true)
//
//   On save: POSTs to /api/time/create and redirects back to /dashboard/time.

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  ArrowLeft, Loader2, Clock, DollarSign, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  toLocalDateTimeInput,
  calcDurationSeconds,
  formatDuration,
  calcBillableAmount,
  fmt,
} from '@/lib/utils/time-formatting'

type Client = {
  id:          string
  name:        string
  company:     string | null
  hourly_rate: number | null
}

export default function NewTimePage() {
  const { format: fmt } = useCurrency()
  const router = useRouter()

  const [isLoading, setIsLoading]   = useState(true)
  const [isSaving,  setIsSaving]    = useState(false)
  const [clients,   setClients]     = useState<Client[]>([])

  // Form fields
  const [clientId,     setClientId]     = useState('')
  const [description,  setDescription]  = useState('')
  const [startTime,    setStartTime]    = useState('')
  const [endTime,      setEndTime]      = useState('')
  const [hourlyRate,   setHourlyRate]   = useState('')
  const [billable,     setBillable]     = useState(true)

  // Derived
  const durationSeconds =
    startTime && endTime ? calcDurationSeconds(startTime, endTime) : 0

  const billableAmount =
    billable && hourlyRate && durationSeconds
      ? calcBillableAmount(durationSeconds, parseFloat(hourlyRate))
      : null

  // Initialise defaults and load clients
  useEffect(() => {
    const now   = new Date()
    const later = new Date(now)
    later.setHours(later.getHours() + 1)
    setStartTime(toLocalDateTimeInput(now))
    setEndTime(toLocalDateTimeInput(later))

    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('clients')
        .select('id, name, company, hourly_rate')
        .eq('user_id', user.id)
        .order('name', { ascending: true })

      setClients((data ?? []) as Client[])
      setIsLoading(false)
    }
    load()
  }, [router])

  // Auto-fill hourly rate when client is selected
  const handleClientChange = (id: string) => {
    setClientId(id)
    const client = clients.find(c => c.id === id)
    if (client?.hourly_rate) {
      setHourlyRate(String(client.hourly_rate))
    } else {
      setHourlyRate('')
    }
  }

  const handleSave = async () => {
    if (!description.trim()) { toast.error('Description is required.'); return }
    if (!startTime)          { toast.error('Start time is required.'); return }
    if (!endTime)            { toast.error('End time is required.'); return }
    if (durationSeconds <= 0) {
      toast.error('End time must be after start time.')
      return
    }

    setIsSaving(true)
    try {
      const res  = await fetch('/api/time/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          description:     description.trim(),
          clientId:        clientId  || null,
          startedAt:       new Date(startTime).toISOString(),
          endedAt:         new Date(endTime).toISOString(),
          durationSeconds,
          hourlyRate:      hourlyRate ? parseFloat(hourlyRate) : null,
          billable,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Could not save entry.')
        return
      }
      toast.success('Time entry saved.')
      router.push('/dashboard/time')
      router.refresh()
    } catch {
      toast.error('Could not save entry. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Link href="/dashboard/time" className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors mb-2 block">
          ← Time Tracking
        </Link>
        <h1 className="text-2xl font-black text-gray-900">Manual Entry</h1>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">

        {/* Client */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Client (optional)</label>
          <select
            value={clientId}
            onChange={e => handleClientChange(e.target.value)}
            disabled={isSaving}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm font-medium
                       focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white
                       disabled:bg-gray-50"
          >
            <option value="">No client</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}{c.company ? ` — ${c.company}` : ''}{c.hourly_rate ? ` ($${c.hourly_rate}/hr)` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Homepage redesign, Client call, Code review..."
            disabled={isSaving}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900
                       focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all
                       disabled:bg-gray-50"
          />
        </div>

        {/* Start / End times */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Start time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              disabled={isSaving}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all
                         disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              End time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              disabled={isSaving}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all
                         disabled:bg-gray-50"
            />
          </div>
        </div>

        {/* Duration preview */}
        {durationSeconds > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 rounded-xl border border-blue-200">
            <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <p className="text-sm font-bold text-blue-800">
              Duration: {formatDuration(durationSeconds)}
            </p>
          </div>
        )}
        {startTime && endTime && durationSeconds <= 0 && (
          <p className="text-sm font-medium text-red-600 flex items-center gap-1.5">
            ⚠ End time must be after start time
          </p>
        )}

        {/* Hourly rate */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Hourly rate (optional)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
            <input
              type="number"
              value={hourlyRate}
              onChange={e => setHourlyRate(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              disabled={isSaving || !billable}
              className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 text-gray-900
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all
                         disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          {clientId && !clients.find(c => c.id === clientId)?.hourly_rate && (
            <p className="text-xs text-gray-400 mt-1.5 font-medium">
              Set a default rate on the client profile to auto-fill this field.
            </p>
          )}
        </div>

        {/* Billable amount preview */}
        {billableAmount !== null && billableAmount > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 bg-green-50 rounded-xl border border-green-200">
            <DollarSign className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-sm font-bold text-green-800">
              Billable amount: {fmt(billableAmount)}
            </p>
          </div>
        )}

        {/* Billable toggle */}
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-bold text-gray-700">Billable</p>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Non-billable entries are tracked for your records but won&apos;t appear in invoice suggestions
            </p>
          </div>
          <button
            type="button"
            onClick={() => setBillable(prev => !prev)}
            disabled={isSaving}
            className="flex items-center gap-2 text-sm font-bold transition-colors disabled:opacity-50"
          >
            {billable ? (
              <><ToggleRight className="w-8 h-8 text-blue-600" /><span className="text-blue-600">Yes</span></>
            ) : (
              <><ToggleLeft  className="w-8 h-8 text-gray-400" /><span className="text-gray-400">No</span></>
            )}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pb-8">
        <Link
          href="/dashboard/time"
          className="flex-1 inline-flex items-center justify-center px-6 py-3 rounded-xl border border-gray-200
                     bg-white text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all"
        >
          Cancel
        </Link>
        <button
          onClick={handleSave}
          disabled={isSaving || durationSeconds <= 0 || !description.trim()}
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                     bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold
                     hover:from-blue-700 hover:to-blue-800 hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
          {isSaving ? 'Saving...' : 'Save Entry'}
        </button>
      </div>
    </div>
  )
}