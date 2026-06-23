'use client'

import { useState, useEffect, useCallback } from 'react'
import { FaCalendarAlt, FaCheck, FaExclamationTriangle } from 'react-icons/fa'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AvailabilityRow {
  id?: string
  dayOfWeek: number
  startTime: string
  endTime: string
  slotDuration: number
  isActive: boolean
}

interface DayState extends AvailabilityRow {
  saving: boolean
  saved: boolean
  error: string | null
  dirty: boolean
}

interface Props {
  providerId: string
  readOnly?: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Monday-first order
const DAYS = [
  { label: 'Monday', shortLabel: 'Mon', dayOfWeek: 1 },
  { label: 'Tuesday', shortLabel: 'Tue', dayOfWeek: 2 },
  { label: 'Wednesday', shortLabel: 'Wed', dayOfWeek: 3 },
  { label: 'Thursday', shortLabel: 'Thu', dayOfWeek: 4 },
  { label: 'Friday', shortLabel: 'Fri', dayOfWeek: 5 },
  { label: 'Saturday', shortLabel: 'Sat', dayOfWeek: 6 },
  { label: 'Sunday', shortLabel: 'Sun', dayOfWeek: 0 },
]

const SLOT_DURATION_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
  { label: '90 min', value: 90 },
  { label: '120 min', value: 120 },
]

// 30-minute increments from 06:00 to 22:00
const TIME_OPTIONS: string[] = []
for (let h = 6; h <= 22; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`)
  if (h < 22) TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`)
}

const DEFAULT_START = '09:00'
const DEFAULT_END = '17:00'
const DEFAULT_DURATION = 60

// ─── Helper: compute total slots ─────────────────────────────────────────────

function computeTotalSlots(days: DayState[]): number {
  let total = 0
  for (const d of days) {
    if (!d.isActive) continue
    const [sh, sm = 0] = d.startTime.split(':').map(Number)
    const [eh, em = 0] = d.endTime.split(':').map(Number)
    const startMin = sh * 60 + sm
    const endMin = eh * 60 + em
    if (endMin > startMin && d.slotDuration > 0) {
      total += Math.floor((endMin - startMin) / d.slotDuration)
    }
  }
  return total
}

function formatTime(t: string): string {
  const [h, m = '00'] = t.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${h12}:${m} ${ampm}`
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AvailabilityScheduler({ providerId, readOnly = false }: Props) {
  const [days, setDays] = useState<DayState[]>(
    DAYS.map((d) => ({
      dayOfWeek: d.dayOfWeek,
      startTime: DEFAULT_START,
      endTime: DEFAULT_END,
      slotDuration: DEFAULT_DURATION,
      isActive: false,
      saving: false,
      saved: false,
      error: null,
      dirty: false,
    }))
  )
  const [loading, setLoading] = useState(true)

  // ── Fetch existing availability ─────────────────────────────────────────
  const fetchAvailability = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/providers/${providerId}/availability`, { credentials: 'include' })
      const json = await res.json()
      if (!json.success) return
      const rows: AvailabilityRow[] = json.data ?? []

      setDays((prev) =>
        prev.map((d) => {
          const existing = rows.find((r) => r.dayOfWeek === d.dayOfWeek)
          if (existing) {
            return {
              ...d,
              id: existing.id,
              startTime: existing.startTime,
              endTime: existing.endTime,
              slotDuration: existing.slotDuration,
              isActive: existing.isActive,
              dirty: false,
            }
          }
          return d
        })
      )
    } catch {
      // non-fatal - just show defaults
    } finally {
      setLoading(false)
    }
  }, [providerId])

  useEffect(() => { fetchAvailability() }, [fetchAvailability])

  // ── Update a day's field ────────────────────────────────────────────────
  function updateDay(dayOfWeek: number, patch: Partial<DayState>) {
    setDays((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek ? { ...d, ...patch, dirty: true, saved: false, error: null } : d
      )
    )
  }

  // ── Save a single day ───────────────────────────────────────────────────
  async function saveDay(dayOfWeek: number) {
    const day = days.find((d) => d.dayOfWeek === dayOfWeek)
    if (!day) return

    setDays((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, saving: true, error: null } : d))
    )

    try {
      const res = await fetch(`/api/providers/${providerId}/availability`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayOfWeek: day.dayOfWeek,
          startTime: day.startTime,
          endTime: day.endTime,
          slotDuration: day.slotDuration,
          isActive: day.isActive,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Save failed')

      setDays((prev) =>
        prev.map((d) =>
          d.dayOfWeek === dayOfWeek
            ? { ...d, id: json.data?.id ?? d.id, saving: false, saved: true, dirty: false }
            : d
        )
      )
      // Brief green flash then reset
      setTimeout(() => {
        setDays((prev) =>
          prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, saved: false } : d))
        )
      }, 2000)
    } catch (e) {
      setDays((prev) =>
        prev.map((d) =>
          d.dayOfWeek === dayOfWeek
            ? { ...d, saving: false, error: e instanceof Error ? e.message : 'Save failed' }
            : d
        )
      )
    }
  }

  const totalSlots = computeTotalSlots(days)
  const activeDays = days.filter((d) => d.isActive)

  if (loading) {
    return (
      <div className="space-y-3">
        {DAYS.map((d) => (
          <div key={d.dayOfWeek} className="h-16 bg-subtle rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Hint banner ─────────────────────────────────────────────────── */}
      {!readOnly && (
        <div className="flex items-start gap-3 p-3 bg-[#9AE1FF]/20 border border-[#9AE1FF] rounded-xl text-sm text-fg">
          <FaCalendarAlt className="text-[#0C6780] mt-0.5 flex-shrink-0" />
          <span>
            Set your schedule so patients can book appointments with you. Each time slot will appear in the booking calendar.
          </span>
        </div>
      )}

      {/* ── Day grid ─────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {DAYS.map((dayConfig) => {
          const day = days.find((d) => d.dayOfWeek === dayConfig.dayOfWeek)!
          return (
            <DayRow
              key={dayConfig.dayOfWeek}
              label={dayConfig.label}
              shortLabel={dayConfig.shortLabel}
              day={day}
              readOnly={readOnly}
              onToggle={() => updateDay(dayConfig.dayOfWeek, { isActive: !day.isActive, dirty: true })}
              onStartChange={(v) => updateDay(dayConfig.dayOfWeek, { startTime: v })}
              onEndChange={(v) => updateDay(dayConfig.dayOfWeek, { endTime: v })}
              onDurationChange={(v) => updateDay(dayConfig.dayOfWeek, { slotDuration: v })}
              onSave={() => saveDay(dayConfig.dayOfWeek)}
            />
          )
        })}
      </div>

      {/* ── Summary panel ────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-line bg-subtle p-4 space-y-3">
        <h3 className="text-sm font-semibold text-fg">Your weekly availability</h3>
        {activeDays.length === 0 ? (
          <p className="text-sm text-soft">
            No days enabled yet. Toggle a day above to mark yourself as available.
          </p>
        ) : (
          <ul className="space-y-1">
            {activeDays.map((d) => {
              const dayLabel = DAYS.find((x) => x.dayOfWeek === d.dayOfWeek)?.label ?? ''
              return (
                <li key={d.dayOfWeek} className="flex items-center gap-2 text-sm">
                  <span className="w-24 font-medium text-soft">{dayLabel}</span>
                  <span className="text-soft">
                    {formatTime(d.startTime)} – {formatTime(d.endTime)}
                  </span>
                  <span className="text-faint text-xs">
                    ({d.slotDuration} min slots)
                  </span>
                </li>
              )
            })}
          </ul>
        )}
        {activeDays.length > 0 && (
          <p className="text-xs text-[#0C6780] font-medium">
            Patients can book {totalSlots} slot{totalSlots !== 1 ? 's' : ''} across your schedule.
          </p>
        )}
      </div>
    </div>
  )
}

// ─── DayRow ───────────────────────────────────────────────────────────────────

interface DayRowProps {
  label: string
  shortLabel: string
  day: DayState
  readOnly: boolean
  onToggle: () => void
  onStartChange: (v: string) => void
  onEndChange: (v: string) => void
  onDurationChange: (v: number) => void
  onSave: () => void
}

function DayRow({
  label,
  shortLabel,
  day,
  readOnly,
  onToggle,
  onStartChange,
  onEndChange,
  onDurationChange,
  onSave,
}: DayRowProps) {
  const active = day.isActive
  const rowBg = active ? 'bg-surface border-[#0C6780]/30' : 'bg-subtle border-line'
  const savedFlash = day.saved ? 'ring-2 ring-emerald-400' : ''

  return (
    <div
      className={`rounded-xl border p-3 transition-all ${rowBg} ${savedFlash} ${active ? 'shadow-sm' : ''}`}
    >
      {/* ── Main row ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Toggle + Day name */}
        <div className="flex items-center gap-2 w-28 flex-shrink-0">
          {!readOnly && (
            <button
              type="button"
              onClick={onToggle}
              aria-label={active ? `Disable ${label}` : `Enable ${label}`}
              className={`relative w-9 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#0C6780] flex-shrink-0
                ${active ? 'bg-[#0C6780]' : 'bg-gray-300'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-surface rounded-full shadow transition-transform ${active ? 'translate-x-4' : ''}`}
              />
            </button>
          )}
          <span
            className={`text-sm font-semibold ${active ? 'text-fg' : 'text-faint'}`}
          >
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{shortLabel}</span>
          </span>
        </div>

        {/* Time pickers + duration - only shown when active */}
        {active ? (
          <>
            <div className="flex items-center gap-1.5 text-sm">
              <label className="text-xs text-soft sr-only">Start</label>
              <TimeSelect
                value={day.startTime}
                onChange={onStartChange}
                disabled={readOnly}
                label="Start time"
              />
              <span className="text-faint text-xs">to</span>
              <TimeSelect
                value={day.endTime}
                onChange={onEndChange}
                disabled={readOnly}
                label="End time"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-xs text-soft hidden sm:inline">Slots</label>
              <select
                value={day.slotDuration}
                onChange={(e) => onDurationChange(Number(e.target.value))}
                disabled={readOnly}
                aria-label="Slot duration"
                className="text-xs border border-line rounded-lg px-2 py-1.5 bg-surface focus:outline-none focus:ring-2 focus:ring-[#0C6780] disabled:opacity-50 disabled:cursor-default"
              >
                {SLOT_DURATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Save button */}
            {!readOnly && (
              <div className="ml-auto flex items-center gap-2">
                {day.saved && (
                  <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                    <FaCheck className="text-xs" /> Saved
                  </span>
                )}
                <button
                  type="button"
                  onClick={onSave}
                  disabled={day.saving || !day.dirty}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all
                    bg-[#0C6780] text-white hover:bg-[#001E40]
                    disabled:opacity-40 disabled:cursor-default"
                >
                  {day.saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}
          </>
        ) : (
          <span className="text-xs text-faint ml-1">Not available</span>
        )}
      </div>

      {/* Error */}
      {day.error && (
        <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
          <FaExclamationTriangle className="flex-shrink-0" />
          {day.error}
        </div>
      )}
    </div>
  )
}

// ─── TimeSelect ───────────────────────────────────────────────────────────────

function TimeSelect({
  value,
  onChange,
  disabled,
  label,
}: {
  value: string
  onChange: (v: string) => void
  disabled: boolean
  label: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      aria-label={label}
      className="text-xs border border-line rounded-lg px-2 py-1.5 bg-surface focus:outline-none focus:ring-2 focus:ring-[#0C6780] disabled:opacity-50 disabled:cursor-default"
    >
      {TIME_OPTIONS.map((t) => (
        <option key={t} value={t}>{formatTime(t)}</option>
      ))}
    </select>
  )
}
