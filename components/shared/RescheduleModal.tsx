'use client'

import { useState } from 'react'
import { FaCalendarAlt, FaClock, FaTimes } from 'react-icons/fa'

interface Props {
  bookingId: string
  bookingType: string
  onClose: () => void
  onRescheduled?: () => void
}

/**
 * Date + time picker modal. Calls POST /api/bookings/reschedule which
 * returns { success, data: { scheduledDate, scheduledTime } } on success.
 */
export default function RescheduleModal({ bookingId, bookingType, onClose, onRescheduled }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [time, setTime] = useState('09:00')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/bookings/reschedule', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, bookingType, newDate: date, newTime: time }),
      })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.message || 'Failed')
      onRescheduled?.()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error')
    } finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-surface rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-fg">Reschedule booking</h2>
            <p className="text-xs text-soft">Your provider will be notified of the change.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1 text-faint hover:text-soft">
            <FaTimes />
          </button>
        </div>

        <label className="block">
          <span className="text-xs font-medium text-soft flex items-center gap-1.5 mb-1">
            <FaCalendarAlt /> New date
          </span>
          <input
            type="date" min={today}
            value={date} onChange={e => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-[#0C6780] outline-none"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-soft flex items-center gap-1.5 mb-1">
            <FaClock /> New time
          </span>
          <input
            type="time"
            value={time} onChange={e => setTime(e.target.value)}
            className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-[#0C6780] outline-none"
          />
        </label>

        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-soft bg-subtle rounded-lg hover:bg-line"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#0C6780] rounded-lg hover:bg-[#0a5568] disabled:opacity-50"
          >
            {busy ? 'Rescheduling…' : 'Reschedule'}
          </button>
        </div>
      </div>
    </div>
  )
}
