'use client'

import { useState, useEffect, useCallback } from 'react'
import {
 FaChevronLeft, FaChevronRight, FaPlus, FaFire, FaClock, FaDumbbell, FaTimes, FaRunning,
} from 'react-icons/fa'
import ExerciseEntryCard from '../shared/ExerciseEntryCard'

interface ExerciseEntry {
 id: string
 exerciseType: string
 durationMin: number
 caloriesBurned: number
 intensity: string
 notes?: string
}

interface ExerciseDayData {
 entries: ExerciseEntry[]
 totalBurned: number
 totalMinutes: number
}

const EXERCISE_TYPES = [
 'Walking', 'Running', 'Cycling', 'Swimming', 'Yoga',
 'Weight Training', 'HIIT', 'Dancing', 'Sports', 'Other',
]

// Estimated kcal/min per intensity (rough average for 70 kg person)
const CAL_RATES: Record<string, Record<string, number>> = {
 Walking: { light: 3, moderate: 4, vigorous: 6 },
 Running: { light: 7, moderate: 10, vigorous: 14 },
 Cycling: { light: 5, moderate: 8, vigorous: 12 },
 Swimming: { light: 6, moderate: 8, vigorous: 11 },
 Yoga: { light: 2, moderate: 3, vigorous: 4 },
 'Weight Training': { light: 3, moderate: 5, vigorous: 8 },
 HIIT: { light: 8, moderate: 11, vigorous: 15 },
 Dancing: { light: 4, moderate: 6, vigorous: 9 },
 Sports: { light: 5, moderate: 8, vigorous: 11 },
 Other: { light: 4, moderate: 6, vigorous: 9 },
}

const INTENSITIES = [
 { key: 'light', label: 'Light', activeClass: 'bg-emerald-500 text-white', dotClass: 'bg-emerald-400' },
 { key: 'moderate', label: 'Moderate', activeClass: 'bg-amber-500 text-white', dotClass: 'bg-amber-400' },
 { key: 'vigorous', label: 'Vigorous', activeClass: 'bg-red-500 text-white', dotClass: 'bg-red-400' },
]

function estimateCalories(type: string, durationMin: number, intensity: string): number {
 const rate = CAL_RATES[type]?.[intensity] ?? 6
 return Math.round(rate * durationMin)
}

function generateExerciseInsight(data: ExerciseDayData): { text: string; emoji: string } | null {
 if (data.entries.length === 0) return null
 if (data.totalMinutes >= 60) return { emoji: '🏆', text: "Outstanding! Over an hour of exercise today. Your cardiovascular health and metabolism are loving this." }
 if (data.totalMinutes >= 30) return { emoji: '💪', text: "Great workout session! 30+ minutes of exercise meets the daily recommended activity level." }
 if (data.totalBurned >= 300) return { emoji: '🔥', text: `You've burned ${data.totalBurned} calories. Keep adding short sessions to reach your full goal.` }
 return { emoji: '👟', text: "Good start! Even short bouts of activity add up. Try adding another session or a quick walk." }
}

export default function ExerciseTab() {
 const [selectedDate, setSelectedDate] = useState(new Date())
 const [data, setData] = useState<ExerciseDayData | null>(null)
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState('')
 const [showAddModal, setShowAddModal] = useState(false)
 const [actionError, setActionError] = useState('')
 const [insight, setInsight] = useState<{ text: string; emoji: string } | null>(null)
 const [insightDismissed, setInsightDismissed] = useState(false)

 // Form state
 const [formExerciseType, setFormExerciseType] = useState('Walking')
 const [formDuration, setFormDuration] = useState(30)
 const [formIntensity, setFormIntensity] = useState('moderate')
 const [formNotes, setFormNotes] = useState('')
 const [submitting, setSubmitting] = useState(false)

 const estimatedCal = estimateCalories(formExerciseType, formDuration, formIntensity)

 const dateStr = selectedDate.toISOString().split('T')[0]

 const fetchData = useCallback(async () => {
  try {
   setLoading(true)
   setError('')
   const res = await fetch(`/api/ai/health-tracker/exercise?date=${dateStr}`, { credentials: 'include' })
   if (!res.ok) throw new Error('Failed to load exercises')
   const json = await res.json()
   if (!json.success) throw new Error(json.message || 'Failed to load exercises')
   const d = json.data
   const newData = {
    entries: d.entries,
    totalBurned: d.totalCaloriesBurned,
    totalMinutes: d.totalMinutes,
   }
   setData(newData)
   const ins = generateExerciseInsight(newData)
   if (ins) { setInsight(ins); setInsightDismissed(false) }
  } catch (err) {
   setError(err instanceof Error ? err.message : 'Something went wrong')
  } finally {
   setLoading(false)
  }
 }, [dateStr])

 useEffect(() => {
  fetchData()
 }, [fetchData])

 const handleDelete = async (id: string) => {
  try {
   const res = await fetch(`/api/ai/health-tracker/exercise/${id}`, { method: 'DELETE', credentials: 'include' })
   if (!res.ok) throw new Error('Failed to delete')
   await fetchData()
  } catch {
   setActionError('Failed to delete exercise')
   setTimeout(() => setActionError(''), 4000)
   await fetchData()
  }
 }

 const handleAdd = async () => {
  try {
   setSubmitting(true)
   const res = await fetch('/api/ai/health-tracker/exercise', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
     exerciseType: formExerciseType,
     durationMin: formDuration,
     caloriesBurned: estimatedCal,
     intensity: formIntensity,
     notes: formNotes || undefined,
     date: dateStr,
    }),
    credentials: 'include',
   })
   if (!res.ok) throw new Error('Failed to log exercise')
   setShowAddModal(false)
   resetForm()
   await fetchData()
  } catch {
   setActionError('Failed to log exercise')
   setTimeout(() => setActionError(''), 4000)
  } finally {
   setSubmitting(false)
  }
 }

 const resetForm = () => {
  setFormExerciseType('Walking')
  setFormDuration(30)
  setFormIntensity('moderate')
  setFormNotes('')
 }

 const changeDate = (days: number) => {
  const newDate = new Date(selectedDate)
  newDate.setDate(newDate.getDate() + days)
  setSelectedDate(newDate)
 }

 const formatDate = (date: Date) => {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
 }

 return (
  <div className="p-4 space-y-4">
   {actionError && (
    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex justify-between items-center">
     <span>{actionError}</span>
     <button onClick={() => setActionError('')} className="text-red-500 ml-2">&#10005;</button>
    </div>
   )}

   {/* Date Selector */}
   <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-3">
    <button onClick={() => changeDate(-1)} className="p-2 text-gray-500 hover:text-[#0C6780] rounded-lg hover:bg-gray-100" aria-label="Previous day">
     <FaChevronLeft className="w-4 h-4" />
    </button>
    <span className="text-sm font-semibold text-[#001E40]">{formatDate(selectedDate)}</span>
    <button onClick={() => changeDate(1)} className="p-2 text-gray-500 hover:text-[#0C6780] rounded-lg hover:bg-gray-100" aria-label="Next day">
     <FaChevronRight className="w-4 h-4" />
    </button>
   </div>

   {/* Summary Cards */}
   {data && (
    <div className="grid grid-cols-3 gap-3">
     <div className="bg-white rounded-xl shadow-sm p-3 text-center border-t-4 border-orange-400">
      <FaFire className="w-5 h-5 text-orange-500 mx-auto mb-1" />
      <p className="text-xl font-bold text-[#001E40]">{data.totalBurned}</p>
      <p className="text-xs text-gray-500">Burned</p>
     </div>
     <div className="bg-white rounded-xl shadow-sm p-3 text-center border-t-4 border-[#0C6780]">
      <FaClock className="w-5 h-5 text-[#0C6780] mx-auto mb-1" />
      <p className="text-xl font-bold text-[#001E40]">{data.totalMinutes}</p>
      <p className="text-xs text-gray-500">Minutes</p>
     </div>
     <div className="bg-white rounded-xl shadow-sm p-3 text-center border-t-4 border-emerald-400">
      <FaDumbbell className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
      <p className="text-xl font-bold text-[#001E40]">{data.entries.length}</p>
      <p className="text-xs text-gray-500">Sessions</p>
     </div>
    </div>
   )}

   {/* Log Exercise Button */}
   <button
    onClick={() => setShowAddModal(true)}
    className="w-full flex items-center justify-center gap-2 py-3 bg-[#001E40] text-white rounded-xl font-medium hover:bg-[#0C6780] transition-colors"
   >
    <FaPlus className="w-4 h-4" />
    Log Exercise
   </button>

   {/* AI Insight */}
   {insight && !insightDismissed && (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-[#001E40] to-[#0C6780] text-white shadow-md">
     <span className="text-xl flex-shrink-0 mt-0.5">{insight.emoji}</span>
     <p className="text-sm leading-relaxed flex-1">{insight.text}</p>
     <button onClick={() => setInsightDismissed(true)} className="flex-shrink-0 text-white/60 hover:text-white" aria-label="Dismiss">
      <FaTimes className="w-3.5 h-3.5" />
     </button>
    </div>
   )}

   {loading && (
    <div className="space-y-3">
     {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />)}
    </div>
   )}
   {error && (
    <div className="text-center p-4">
     <p className="text-red-500 mb-3">{error}</p>
     <button onClick={fetchData} className="px-4 py-2 bg-[#0C6780] text-white rounded-lg text-sm hover:bg-[#001E40]">Retry</button>
    </div>
   )}

   {/* Exercise List */}
   {!loading && !error && (
    <div className="space-y-3">
     {data?.entries.length === 0 ? (
      <div className="text-center py-10">
       <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
        <FaRunning className="w-8 h-8 text-emerald-300" />
       </div>
       <p className="text-sm font-medium text-gray-500 mb-1">No exercise logged yet</p>
       <p className="text-xs text-gray-400 mb-4">Even a 10-minute walk counts. Start moving!</p>
       <button
        onClick={() => setShowAddModal(true)}
        className="px-5 py-2.5 bg-[#001E40] text-white rounded-xl text-sm font-medium hover:bg-[#0C6780] transition-colors"
       >
        + Log your first session
       </button>
      </div>
     ) : (
      data?.entries.map((entry) => (
       <ExerciseEntryCard
        key={entry.id}
        id={entry.id}
        exerciseType={entry.exerciseType}
        durationMin={entry.durationMin}
        caloriesBurned={entry.caloriesBurned}
        intensity={entry.intensity}
        notes={entry.notes}
        onDelete={handleDelete}
       />
      ))
     )}
    </div>
   )}

   {/* Add Exercise Modal */}
   {showAddModal && (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-[60]">
     <div className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto pb-8">
      <div className="flex items-center justify-between p-4 border-b">
       <h3 className="text-base font-bold text-[#001E40]">Log Exercise</h3>
       <button onClick={() => { setShowAddModal(false); resetForm() }} className="p-2 text-gray-400 hover:text-gray-600">&times;</button>
      </div>
      <div className="p-4 space-y-5">
       {/* Exercise type grid */}
       <div>
        <label className="block text-sm font-medium text-[#001E40] mb-2">Exercise Type</label>
        <div className="flex flex-wrap gap-2">
         {EXERCISE_TYPES.map((type) => (
          <button
           key={type}
           onClick={() => setFormExerciseType(type)}
           className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
            formExerciseType === type
            ? 'bg-[#001E40] text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
           }`}
          >
           {type}
          </button>
         ))}
        </div>
       </div>

       {/* Intensity */}
       <div>
        <label className="block text-sm font-medium text-[#001E40] mb-2">Intensity</label>
        <div className="grid grid-cols-3 gap-2">
         {INTENSITIES.map((level) => (
          <button
           key={level.key}
           onClick={() => setFormIntensity(level.key)}
           className={`py-2.5 text-sm rounded-xl font-medium capitalize transition-colors flex items-center justify-center gap-1.5 ${
            formIntensity === level.key ? level.activeClass : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
           }`}
          >
           <span className={`w-2 h-2 rounded-full ${formIntensity === level.key ? 'bg-white' : level.dotClass}`} />
           {level.label}
          </button>
         ))}
        </div>
       </div>

       {/* Duration */}
       <div>
        <label className="block text-sm font-medium text-[#001E40] mb-1">Duration (minutes)</label>
        <div className="flex items-center gap-3">
         <button
          onClick={() => setFormDuration(d => Math.max(5, d - 5))}
          className="w-10 h-10 rounded-xl bg-gray-100 font-bold text-gray-600 hover:bg-gray-200 text-lg leading-none"
         >−</button>
         <input
          type="number"
          value={formDuration}
          onChange={(e) => setFormDuration(Math.max(1, Number(e.target.value)))}
          min={1}
          className="flex-1 text-center text-lg font-bold text-[#001E40] px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0C6780]/40"
         />
         <button
          onClick={() => setFormDuration(d => d + 5)}
          className="w-10 h-10 rounded-xl bg-gray-100 font-bold text-gray-600 hover:bg-gray-200 text-lg leading-none"
         >+</button>
        </div>
       </div>

       {/* Calorie estimate */}
       <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl">
        <FaFire className="text-orange-500 text-lg flex-shrink-0" />
        <div>
         <p className="text-xs text-gray-500">Estimated calories burned</p>
         <p className="text-xl font-bold text-orange-600">{estimatedCal} kcal</p>
        </div>
        <p className="text-xs text-gray-400 ml-auto">Auto-calculated</p>
       </div>

       {/* Notes */}
       <div>
        <label className="block text-sm font-medium text-[#001E40] mb-1">Notes (optional)</label>
        <textarea
         value={formNotes}
         onChange={(e) => setFormNotes(e.target.value)}
         placeholder="How did it go?"
         rows={2}
         className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0C6780]/40 resize-none"
        />
       </div>

       <button
        onClick={handleAdd}
        disabled={submitting}
        className="w-full py-3 bg-[#001E40] text-white rounded-xl font-medium hover:bg-[#0C6780] transition-colors disabled:opacity-50"
       >
        {submitting ? 'Saving...' : `Log ${formExerciseType} - ${estimatedCal} kcal`}
       </button>
      </div>
     </div>
    </div>
   )}
  </div>
 )
}
