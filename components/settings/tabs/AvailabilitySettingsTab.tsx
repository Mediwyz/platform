'use client'

import { useState, useEffect, useCallback } from 'react'
import { FaPlus, FaTrash, FaClock, FaSave, FaSpinner } from 'react-icons/fa'

interface AvailabilitySettingsTabProps {
 userId: string
}

interface TimeSlot {
 startTime: string
 endTime: string
}

interface DaySchedule {
 isWorking: boolean
 slots: TimeSlot[]
}

type WeekSchedule = Record<number, DaySchedule>

const DAY_NAMES: Record<number, string> = {
 0: 'Sunday',
 1: 'Monday',
 2: 'Tuesday',
 3: 'Wednesday',
 4: 'Thursday',
 5: 'Friday',
 6: 'Saturday',
}

// Display order: Monday (1) first, Sunday (0) last
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

const START_TIMES = Array.from({ length: 16 }, (_, i) => {
 const hour = i + 6
 return `${hour.toString().padStart(2, '0')}:00`
})

const END_TIMES = Array.from({ length: 16 }, (_, i) => {
 const hour = i + 7
 return `${hour.toString().padStart(2, '0')}:00`
})

const DEFAULT_SCHEDULE: WeekSchedule = Object.fromEntries(
 Array.from({ length: 7 }, (_, i) => [
 i,
 { isWorking: false, slots: [] },
 ])
)

export default function AvailabilitySettingsTab({ userId }: AvailabilitySettingsTabProps) {
 const [schedule, setSchedule] = useState<WeekSchedule>(DEFAULT_SCHEDULE)
 const [loading, setLoading] = useState(true)
 const [saving, setSaving] = useState(false)
 const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

 const fetchAvailability = useCallback(async () => {
 try {
 setLoading(true)
 const res = await fetch(`/api/users/${userId}/availability`, { credentials: 'include' })
 const data = await res.json()

 if (data.success && data.data) {
 const newSchedule: WeekSchedule = { ...DEFAULT_SCHEDULE }
 // Re-initialize all days
 for (let i = 0; i < 7; i++) {
 newSchedule[i] = { isWorking: false, slots: [] }
 }

 for (const slot of data.data) {
 const day = slot.dayOfWeek as number
 if (!newSchedule[day]) {
 newSchedule[day] = { isWorking: false, slots: [] }
 }
 newSchedule[day].isWorking = true
 newSchedule[day].slots.push({
 startTime: slot.startTime,
 endTime: slot.endTime,
 })
 }

 setSchedule(newSchedule)
 }
 } catch {
 setFeedback({ type: 'error', message: 'Failed to load availability schedule.' })
 } finally {
 setLoading(false)
 }
 }, [userId])

 useEffect(() => {
 fetchAvailability()
 }, [fetchAvailability])

 const toggleWorkingDay = (dayOfWeek: number) => {
 setSchedule((prev) => {
 const day = prev[dayOfWeek]
 const isWorking = !day.isWorking
 return {
 ...prev,
 [dayOfWeek]: {
 isWorking,
 slots: isWorking && day.slots.length === 0 ? [{ startTime: '09:00', endTime: '17:00' }] : day.slots,
 },
 }
 })
 }

 const addSlot = (dayOfWeek: number) => {
 setSchedule((prev) => {
 const day = prev[dayOfWeek]
 const lastSlot = day.slots[day.slots.length - 1]
 const newStart = lastSlot ? lastSlot.endTime : '09:00'
 const newStartHour = parseInt(newStart.split(':')[0], 10)
 const newEnd = `${Math.min(newStartHour + 1, 22).toString().padStart(2, '0')}:00`

 if (newStartHour >= 22) return prev

 return {
 ...prev,
 [dayOfWeek]: {
 ...day,
 slots: [...day.slots, { startTime: newStart, endTime: newEnd }],
 },
 }
 })
 }

 const removeSlot = (dayOfWeek: number, slotIndex: number) => {
 setSchedule((prev) => {
 const day = prev[dayOfWeek]
 const newSlots = day.slots.filter((_, i) => i !== slotIndex)
 return {
 ...prev,
 [dayOfWeek]: {
 ...day,
 slots: newSlots,
 isWorking: newSlots.length > 0 ? day.isWorking : false,
 },
 }
 })
 }

 const updateSlotTime = (dayOfWeek: number, slotIndex: number, field: 'startTime' | 'endTime', value: string) => {
 setSchedule((prev) => {
 const day = prev[dayOfWeek]
 const newSlots = [...day.slots]
 newSlots[slotIndex] = { ...newSlots[slotIndex], [field]: value }
 return {
 ...prev,
 [dayOfWeek]: { ...day, slots: newSlots },
 }
 })
 }

 const handleSave = async () => {
 setFeedback(null)
 setSaving(true)

 try {
 // Convert local state to flat array of slots
 const slots: Array<{ dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }> = []

 for (const [dayStr, day] of Object.entries(schedule)) {
 const dayOfWeek = parseInt(dayStr, 10)
 if (day.isWorking) {
 for (const slot of day.slots) {
 if (slot.startTime >= slot.endTime) {
 setFeedback({
 type: 'error',
 message: `Invalid time range on ${DAY_NAMES[dayOfWeek]}: start time must be before end time.`,
 })
 setSaving(false)
 return
 }
 slots.push({
 dayOfWeek,
 startTime: slot.startTime,
 endTime: slot.endTime,
 isActive: true,
 })
 }
 }
 }

 const res = await fetch(`/api/users/${userId}/availability`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ slots }),
 credentials: 'include',
 })

 const data = await res.json()

 if (data.success) {
 setFeedback({ type: 'success', message: 'Availability schedule saved successfully.' })
 } else {
 setFeedback({ type: 'error', message: data.message || 'Failed to save availability.' })
 }
 } catch {
 setFeedback({ type: 'error', message: 'Network error. Please try again.' })
 } finally {
 setSaving(false)
 }
 }

 if (loading) {
 return (
 <div className="flex items-center justify-center py-16">
 <FaSpinner className="animate-spin text-3xl text-blue-500" />
 <span className="ml-3 text-soft">Loading availability schedule...</span>
 </div>
 )
 }

 return (
 <div>
 <div className="mb-6">
 <h2 className="text-2xl font-bold text-fg flex items-center gap-2">
 <FaClock className="text-blue-500" />
 Weekly Availability Schedule
 </h2>
 <p className="text-sm text-soft mt-1">
 Set your recurring weekly availability. Patients will only be able to book during these times.
 </p>
 </div>

 {feedback && (
 <div
 className={`mb-6 p-4 rounded-lg border ${
 feedback.type === 'success'
 ? 'bg-green-50 border-green-200 text-green-800'
 : 'bg-red-50 border-red-200 text-red-800'
 }`}
 >
 {feedback.message}
 </div>
 )}

 <div className="space-y-4">
 {DAY_ORDER.map((dayOfWeek) => {
 const day = schedule[dayOfWeek]
 return (
 <div
 key={dayOfWeek}
 className={`border rounded-lg overflow-hidden transition-colors ${
 day.isWorking ? 'border-blue-200 bg-surface' : 'border-line bg-subtle'
 }`}
 >
 {/* Day header */}
 <div className="flex items-center justify-between px-4 py-3 border-b border-line">
 <span className={`font-semibold text-lg ${day.isWorking ? 'text-fg' : 'text-faint'}`}>
 {DAY_NAMES[dayOfWeek]}
 </span>
 <label className="flex items-center gap-2 cursor-pointer">
 <span className={`text-sm font-medium ${day.isWorking ? 'text-blue-600' : 'text-faint'}`}>
 Working Day
 </span>
 <button
 type="button"
 role="switch"
 aria-checked={day.isWorking}
 onClick={() => toggleWorkingDay(dayOfWeek)}
 className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
 day.isWorking ? 'bg-blue-500' : 'bg-gray-300'
 }`}
 >
 <span
 className={`inline-block h-4 w-4 transform rounded-full bg-surface transition-transform ${
 day.isWorking ? 'translate-x-6' : 'translate-x-1'
 }`}
 />
 </button>
 </label>
 </div>

 {/* Slots */}
 {day.isWorking && (
 <div className="px-4 py-3 space-y-3">
 {day.slots.map((slot, slotIndex) => (
 <div key={slotIndex} className="flex items-center gap-3 flex-wrap">
 <select
 value={slot.startTime}
 onChange={(e) => updateSlotTime(dayOfWeek, slotIndex, 'startTime', e.target.value)}
 className="border border-line rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
 >
 {START_TIMES.map((t) => (
 <option key={t} value={t}>
 {t}
 </option>
 ))}
 </select>
 <span className="text-faint text-sm font-medium">to</span>
 <select
 value={slot.endTime}
 onChange={(e) => updateSlotTime(dayOfWeek, slotIndex, 'endTime', e.target.value)}
 className="border border-line rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
 >
 {END_TIMES.map((t) => (
 <option key={t} value={t}>
 {t}
 </option>
 ))}
 </select>
 <button
 type="button"
 onClick={() => removeSlot(dayOfWeek, slotIndex)}
 className="text-red-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors"
 title="Remove time slot"
 >
 <FaTrash size={14} />
 </button>
 </div>
 ))}
 <button
 type="button"
 onClick={() => addSlot(dayOfWeek)}
 className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:text-blue-700 mt-1"
 >
 <FaPlus size={12} />
 Add Time Slot
 </button>
 </div>
 )}
 </div>
 )
 })}
 </div>

 <div className="mt-8 flex justify-end">
 <button
 type="button"
 onClick={handleSave}
 disabled={saving}
 className="bg-brand-navy text-white px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
 {saving ? 'Saving...' : 'Save Schedule'}
 </button>
 </div>
 </div>
 )
}
