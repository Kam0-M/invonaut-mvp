// src/lib/utils/time-formatting.ts
// Pure utility functions for displaying and calculating time values.
// Used by time-tracker, time-entry-list, weekly-summary, and unbilled-entries-picker.

/**
 * Format a duration in seconds as a clock string: "2:30:00"
 * Used in the live timer display while the timer is running.
 */
export function formatDurationClock(seconds: number): string {
    const s = Math.max(0, Math.floor(seconds))
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }
  
  /**
   * Format a duration in seconds as a human-readable string: "2h 30m" or "45m" or "30s"
   * Used in the time entry list and weekly summary.
   */
  export function formatDuration(seconds: number): string {
    const s = Math.max(0, Math.floor(seconds))
    if (s === 0) return '0m'
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    if (h > 0 && m > 0) return `${h}h ${m}m`
    if (h > 0) return `${h}h`
    return `${m}m`
  }
  
  /**
   * Convert seconds to decimal hours, rounded to 2 decimal places.
   * e.g. 5400 → 1.5 (used to display "1.50 hrs" on invoice line items)
   */
  export function toDecimalHours(seconds: number): number {
    return Math.round((seconds / 3600) * 100) / 100
  }
  
  /**
   * Calculate the billable dollar amount for a time entry.
   * Returns 0 if either argument is falsy or zero.
   */
  export function calcBillableAmount(seconds: number, hourlyRate: number): number {
    if (!seconds || !hourlyRate) return 0
    return Math.round(toDecimalHours(seconds) * hourlyRate * 100) / 100
  }
  
  /**
   * Format a dollar amount as USD currency string.
   */
  export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }
  
  /**
   * Convert a Date to a local datetime-local input value: "2026-03-31T14:30"
   * Used to pre-fill start/end time inputs in the manual entry form.
   */
  export function toLocalDateTimeInput(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
  }
  
  /**
   * Parse a datetime-local input value to a UTC ISO string for storage.
   */
  export function fromLocalDateTimeInput(value: string): string {
    return new Date(value).toISOString()
  }
  
  /**
   * Calculate duration in seconds between two ISO timestamps.
   */
  export function calcDurationSeconds(startedAt: string, endedAt: string): number {
    const start = new Date(startedAt).getTime()
    const end   = new Date(endedAt).getTime()
    return Math.max(0, Math.floor((end - start) / 1000))
  }