'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FaCalendarAlt, FaArrowRight } from 'react-icons/fa'

interface AvailabilityRow {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  slotDuration: number
  isActive: boolean
}

interface Props {
  providerId: string
  roleSlug?: string  // e.g. "doctor", "nurse" - used for the booking CTA link
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Monday-first sort order
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

function formatTime(t: string): string {
  const [h, m = '00'] = t.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${h12}:${m} ${ampm}`
}

export default function AvailabilityPreview({ providerId, roleSlug }: Props) {
  const [rows, setRows] = useState<AvailabilityRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/providers/${providerId}/availability`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          const active = (json.data as AvailabilityRow[]).filter((r) => r.isActive)
          // Sort Monday-first
          active.sort((a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek))
          setRows(active)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [providerId])

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-6 bg-subtle rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (rows.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-fg">
        <FaCalendarAlt className="text-[#0C6780]" />
        Weekly availability
      </div>

      <ul className="space-y-1.5">
        {rows.map((r) => (
          <li key={r.dayOfWeek} className="flex items-center gap-3 text-sm">
            <span className="w-24 font-medium text-soft">{DAY_NAMES[r.dayOfWeek]}</span>
            <span className="text-soft">
              {formatTime(r.startTime)} – {formatTime(r.endTime)}
            </span>
          </li>
        ))}
      </ul>

      {roleSlug && (
        <Link
          href={`/search/${roleSlug}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0C6780] hover:text-fg transition-colors mt-1"
        >
          Book an appointment <FaArrowRight className="text-xs" />
        </Link>
      )}
    </div>
  )
}
