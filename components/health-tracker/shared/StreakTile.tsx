'use client'

import { useEffect, useState } from 'react'
import { FaFire, FaTrophy } from 'react-icons/fa'

interface Streak {
  currentStreak: number
  longestStreak: number
  lastCheckInDate: string | null
  checkedInToday: boolean
  alreadyCheckedIn?: boolean
}

/**
 * Streak tile for the health tracker Dashboard tab. One-tap check-in - 
 * idempotent per day, backend extends streak if yesterday was logged.
 */
export default function StreakTile() {
  const [streak, setStreak] = useState<Streak | null>(null)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      const res = await fetch('/api/health-streak', { credentials: 'include' })
      const json = await res.json()
      if (json?.success) setStreak(json.data)
    } catch { /* ignore */ }
  }

  useEffect(() => { load() }, [])

  const checkIn = async () => {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/health-streak/check-in', { method: 'POST', credentials: 'include' })
      const json = await res.json()
      if (json?.success) setStreak(json.data)
    } catch { /* ignore */ }
    finally { setBusy(false) }
  }

  if (!streak) return null
  const { currentStreak, longestStreak, checkedInToday } = streak

  return (
    <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-amber-100 rounded-xl p-4 flex items-center gap-4">
      <div className="p-3 rounded-full bg-surface shadow-sm">
        <FaFire className="text-3xl text-amber-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-fg">{currentStreak}</span>
          <span className="text-sm text-soft">day streak</span>
        </div>
        <p className="text-xs text-soft flex items-center gap-1">
          <FaTrophy className="text-amber-400 text-[10px]" />
          Longest: {longestStreak} days
        </p>
      </div>
      {checkedInToday ? (
        <span className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
          ✓ Today done
        </span>
      ) : (
        <button
          onClick={checkIn}
          disabled={busy}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 disabled:opacity-50"
        >
          {busy ? '…' : 'Check in'}
        </button>
      )}
    </div>
  )
}
