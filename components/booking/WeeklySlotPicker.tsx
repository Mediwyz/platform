'use client'

import { useState, useEffect, useCallback } from 'react'
import { FaSpinner, FaClock } from 'react-icons/fa'

export interface SelectedSlot {
 date: string
 time: string
}

interface WeeklySlotPickerProps {
 providerId: string
 providerType: 'doctor' | 'nurse' | 'nanny' | 'lab-test'
 onSelect: (date: string, time: string) => void
 selectedDate?: string
 selectedTime?: string
 accentColor?: string
 multiSelect?: boolean
 selectedSlots?: SelectedSlot[]
 onMultiSelect?: (slots: SelectedSlot[]) => void
 /** Service duration in minutes - used to block entire duration, not just the start */
 serviceDuration?: number
}

interface DaySlots {
 dayName: string
 date: string
 dateLabel: string
 slots: string[]
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const SHORT_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatTime(time: string): string {
 const [hours, minutes] = time.split(':')
 const h = parseInt(hours, 10)
 if (isNaN(h)) return time
 const amPm = h >= 12 ? 'PM' : 'AM'
 const displayHour = h % 12 || 12
 return `${displayHour}:${minutes} ${amPm}`
}

function durationLabel(mins: number): string {
 if (mins < 60) return `${mins} min`
 const h = Math.floor(mins / 60)
 const m = mins % 60
 return m === 0 ? `${h}h` : `${h}h ${m}min`
}

function getNextDays(count: number): { date: string; dayOfWeek: number; dayName: string; shortDay: string; dateLabel: string }[] {
 const days = []
 const today = new Date()
 for (let i = 1; i <= count; i++) {
  const d = new Date(today)
  d.setDate(today.getDate() + i)
  const dow = d.getDay()
  days.push({
   date: d.toISOString().split('T')[0],
   dayOfWeek: dow,
   dayName: DAY_NAMES[dow],
   shortDay: SHORT_DAY_NAMES[dow],
   dateLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  })
 }
 return days
}

export default function WeeklySlotPicker({
 providerId,
 providerType,
 onSelect,
 selectedDate,
 selectedTime,
 accentColor = 'blue',
 multiSelect = false,
 selectedSlots = [],
 onMultiSelect,
 serviceDuration = 30,
}: WeeklySlotPickerProps) {
 const [daySlots, setDaySlots] = useState<DaySlots[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState('')

 const colorMap: Record<string, { selected: string; hover: string; tab: string }> = {
  blue:   { selected: 'bg-blue-600 text-white border-blue-600',   hover: 'hover:border-blue-400 hover:bg-blue-50',   tab: 'text-blue-600 border-blue-600 bg-blue-50' },
  pink:   { selected: 'bg-pink-600 text-white border-pink-600',   hover: 'hover:border-pink-400 hover:bg-pink-50',   tab: 'text-pink-600 border-pink-600 bg-pink-50' },
  purple: { selected: 'bg-purple-600 text-white border-purple-600', hover: 'hover:border-purple-400 hover:bg-purple-50', tab: 'text-purple-600 border-purple-600 bg-purple-50' },
  green:  { selected: 'bg-green-600 text-white border-green-600',  hover: 'hover:border-green-400 hover:bg-green-50',  tab: 'text-green-600 border-green-600 bg-green-50' },
  cyan:   { selected: 'bg-cyan-600 text-white border-cyan-600',   hover: 'hover:border-cyan-400 hover:bg-cyan-50',   tab: 'text-cyan-600 border-cyan-600 bg-cyan-50' },
 }
 const colors = colorMap[accentColor] || colorMap.blue

 const fetchAllSlots = useCallback(async () => {
  if (!providerId) return
  setLoading(true)
  setError('')
  try {
   const days = getNextDays(14)
   const results: DaySlots[] = []
   const fetches = days.map(async (day) => {
    try {
     const res = await fetch(
      `/api/bookings/available-slots?providerId=${providerId}&date=${day.date}&providerType=${providerType}&duration=${serviceDuration}`
     )
     const data = await res.json()
     if (data.success && data.slots && data.slots.length > 0) {
      return {
       dayName: day.dayName,
       date: day.date,
       dateLabel: `${day.shortDay}, ${day.dateLabel}`,
       slots: (data.slots as string[]).sort(),
      }
     }
    } catch { /* skip failed day */ }
    return null
   })
   const all = await Promise.all(fetches)
   for (const r of all) if (r) results.push(r)
   setDaySlots(results)
   if (results.length === 0) setError('No available slots in the next 2 weeks.')
  } catch {
   setError('Failed to load available slots')
  } finally {
   setLoading(false)
  }
 }, [providerId, providerType, serviceDuration])

 useEffect(() => { fetchAllSlots() }, [fetchAllSlots])

 if (loading) return (
  <div className="flex items-center gap-2 py-6 text-soft justify-center">
   <FaSpinner className="animate-spin" />
   <span className="text-sm">Loading available time slots...</span>
  </div>
 )

 if (error) return (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">{error}</div>
 )

 if (daySlots.length === 0) return null

 const handleSlotClick = (date: string, time: string) => {
  if (multiSelect && onMultiSelect) {
   const exists = selectedSlots.some(s => s.date === date && s.time === time)
   onMultiSelect(exists ? selectedSlots.filter(s => !(s.date === date && s.time === time)) : [...selectedSlots, { date, time }])
  } else {
   onSelect(date, time)
  }
 }

 const isSlotSelected = (date: string, time: string) =>
  multiSelect ? selectedSlots.some(s => s.date === date && s.time === time) : selectedDate === date && selectedTime === time

 const dayHasSelection = (date: string) =>
  multiSelect ? selectedSlots.some(s => s.date === date) : selectedDate === date

 const durLabel = serviceDuration > 30 ? durationLabel(serviceDuration) : null

 return (
  <div className="space-y-3">
   {durLabel && (
    <div className="flex items-center gap-1.5 text-xs text-soft bg-subtle rounded-lg px-3 py-2 border border-line">
     <FaClock className="text-faint" />
     Each slot reserves <strong className="text-soft">{durLabel}</strong> - only start times with the full block free are shown
    </div>
   )}
   {multiSelect && selectedSlots.length > 0 && (
    <div className="text-xs font-medium text-soft bg-subtle rounded-lg px-3 py-2 border border-line">
     {selectedSlots.length} time slot{selectedSlots.length !== 1 ? 's' : ''} selected
    </div>
   )}
   {daySlots.map((day) => (
    <div key={day.date} className="border border-line rounded-lg overflow-hidden">
     <div className={`px-3 py-2 bg-subtle border-b border-line flex items-center gap-2 ${dayHasSelection(day.date) ? colors.tab : ''}`}>
      <FaClock className="text-xs text-faint" />
      <span className="text-sm font-medium text-soft">{day.dateLabel}</span>
      <span className="text-xs text-faint">({day.slots.length} slot{day.slots.length !== 1 ? 's' : ''} available)</span>
     </div>
     <div className="p-2 flex flex-wrap gap-1.5">
      {day.slots.length === 0 ? (
       <span className="text-xs text-faint italic px-2 py-1">No free slots on this day</span>
      ) : (
       day.slots.map(slot => {
        const selected = isSlotSelected(day.date, slot)
        return (
         <button
          key={`${day.date}-${slot}`}
          type="button"
          onClick={() => handleSlotClick(day.date, slot)}
          className={`px-2.5 py-1.5 border-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${selected ? `${colors.selected} shadow-md` : `border-line text-soft ${colors.hover}`}`}
         >
          <span>{formatTime(slot)}</span>
          {durLabel && selected && <span className={`ml-1 text-[10px] opacity-80`}>+{durLabel}</span>}
         </button>
        )
       })
      )}
     </div>
    </div>
   ))}
  </div>
 )
}
