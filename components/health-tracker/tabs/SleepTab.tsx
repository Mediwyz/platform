'use client'

import { useState, useEffect, useCallback } from 'react'
import {
 FaBed, FaMoon, FaClock, FaStar, FaChevronLeft, FaChevronRight, FaPlus, FaTrash, FaTimes,
} from 'react-icons/fa'

interface SleepEntry {
 id: string
 durationMin: number
 quality: string
 bedtime?: string
 wakeTime?: string
 notes?: string
}

interface SleepDayData {
 entry: SleepEntry | null
 targetSleepMin: number
}

const QUALITIES = [
 { value: 'terrible', label: 'ðŸ˜« Terrible', activeClass: 'bg-red-500 text-white' },
 { value: 'poor', label: 'ðŸ˜• Poor', activeClass: 'bg-orange-500 text-white' },
 { value: 'fair', label: 'ðŸ˜ Fair', activeClass: 'bg-yellow-500 text-white' },
 { value: 'good', label: 'ðŸ˜Š Good', activeClass: 'bg-green-500 text-white' },
 { value: 'excellent', label: 'ðŸ˜„ Excellent', activeClass: 'bg-emerald-500 text-white' },
]

const qualityBgMap: Record<string, string> = {
 terrible: 'bg-red-100 text-red-700',
 poor: 'bg-orange-100 text-orange-700',
 fair: 'bg-yellow-100 text-yellow-700',
 good: 'bg-green-100 text-green-700',
 excellent: 'bg-emerald-100 text-emerald-700',
}

const qualityEmoji: Record<string, string> = {
 terrible: 'ðŸ˜«', poor: 'ðŸ˜•', fair: 'ðŸ˜', good: 'ðŸ˜Š', excellent: 'ðŸ˜„',
}

function formatDuration(totalMin: number): string {
 const h = Math.floor(totalMin / 60)
 const m = totalMin % 60
 return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function parseMinsFromTime(time: string): number | null {
 if (!time) return null
 const [h, m] = time.split(':').map(Number)
 if (Number.isNaN(h) || Number.isNaN(m)) return null
 return h * 60 + m
}

function calcDuration(bedtime: string, wakeTime: string): number | null {
 const bed = parseMinsFromTime(bedtime)
 const wake = parseMinsFromTime(wakeTime)
 if (bed === null || wake === null) return null
 let diff = wake - bed
 if (diff <= 0) diff += 24 * 60
 return diff
}

function formatTime12h(time24: string): string {
 const [h, m] = time24.split(':').map(Number)
 const period = h >= 12 ? 'PM' : 'AM'
 const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
 return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

function getSleepScoreColor(durationMin: number, targetMin: number): string {
 const ratio = durationMin / targetMin
 if (ratio >= 0.9) return 'text-emerald-500'
 if (ratio >= 0.7) return 'text-yellow-500'
 return 'text-red-500'
}

function generateSleepInsight(entry: SleepEntry, targetMin: number): { text: string; emoji: string } {
 const ratio = entry.durationMin / targetMin
 if (entry.quality === 'excellent' && ratio >= 0.9) {
  return { emoji: 'ðŸŒŸ', text: "Excellent night! Quality sleep like this supports memory consolidation, immune function, and mental clarity." }
 }
 if (ratio < 0.6) {
  return { emoji: 'ðŸ˜´', text: `You slept ${formatDuration(entry.durationMin)} - well below your target. Consistent sleep deprivation affects mood, weight, and focus.` }
 }
 if (entry.quality === 'terrible' || entry.quality === 'poor') {
  return { emoji: 'ðŸ’¤', text: "Poor sleep quality? Try reducing screen time an hour before bed, keeping your room cool, and going to bed at a consistent time." }
 }
 if (ratio >= 0.9) {
  return { emoji: 'âœ…', text: `You hit your sleep target (${formatDuration(entry.durationMin)}). Consistent sleep timing is one of the best things for your health.` }
 }
 return { emoji: 'ðŸŒ™', text: "Good effort! Aim to go to bed 30 minutes earlier tonight to reach your full sleep target." }
}

export default function SleepTab() {
 const [selectedDate, setSelectedDate] = useState(new Date())
 const [data, setData] = useState<SleepDayData | null>(null)
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState('')
 const [showAddModal, setShowAddModal] = useState(false)
 const [actionError, setActionError] = useState('')
 const [insight, setInsight] = useState<{ text: string; emoji: string } | null>(null)
 const [insightDismissed, setInsightDismissed] = useState(false)

 // Form state - bedtime/wake are the primary inputs
 const [formBedtime, setFormBedtime] = useState('22:30')
 const [formWakeTime, setFormWakeTime] = useState('06:30')
 const [formQuality, setFormQuality] = useState('good')
 const [formNotes, setFormNotes] = useState('')
 const [submitting, setSubmitting] = useState(false)

 const derivedDuration = calcDuration(formBedtime, formWakeTime)

 const dateStr = selectedDate.toISOString().split('T')[0]

 const fetchData = useCallback(async () => {
  try {
   setLoading(true)
   setError('')
   const res = await fetch(`/api/ai/health-tracker/sleep?date=${dateStr}`, { credentials: 'include' })
   if (!res.ok) throw new Error('Failed to load sleep data')
   const json = await res.json()
   if (!json.success) throw new Error(json.message || 'Failed to load sleep data')
   const d = json.data
   setData({ entry: d.entry, targetSleepMin: d.targetSleepMin })
   if (d.entry) {
    setInsight(generateSleepInsight(d.entry, d.targetSleepMin ?? 480))
    setInsightDismissed(false)
   }
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
   const res = await fetch(`/api/ai/health-tracker/sleep/${id}`, { method: 'DELETE', credentials: 'include' })
   if (!res.ok) throw new Error('Failed to delete')
   await fetchData()
  } catch {
   setActionError('Failed to delete sleep entry')
   setTimeout(() => setActionError(''), 4000)
   await fetchData()
  }
 }

 const handleAdd = async () => {
  try {
   setSubmitting(true)
   const durationMin = derivedDuration ?? 480
   const res = await fetch('/api/ai/health-tracker/sleep', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
     durationMin,
     quality: formQuality,
     bedtime: formBedtime || undefined,
     wakeTime: formWakeTime || undefined,
     notes: formNotes || undefined,
     date: dateStr,
    }),
    credentials: 'include',
   })
   if (!res.ok) throw new Error('Failed to log sleep')
   setShowAddModal(false)
   resetForm()
   await fetchData()
  } catch {
   setActionError('Failed to log sleep')
   setTimeout(() => setActionError(''), 4000)
  } finally {
   setSubmitting(false)
  }
 }

 const resetForm = () => {
  setFormBedtime('22:30')
  setFormWakeTime('06:30')
  setFormQuality('good')
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

 const entry = data?.entry
 const targetMin = data?.targetSleepMin ?? 480

 return (
  <div className="p-4 space-y-4">
   {actionError && (
    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex justify-between items-center">
     <span>{actionError}</span>
     <button onClick={() => setActionError('')} className="text-red-500 ml-2">&#10005;</button>
    </div>
   )}

   {/* Date Selector */}
   <div className="flex items-center justify-between bg-surface rounded-xl shadow-sm p-3">
    <button onClick={() => changeDate(-1)} className="p-2 text-soft hover:text-[#0C6780] rounded-lg hover:bg-subtle" aria-label="Previous day">
     <FaChevronLeft className="w-4 h-4" />
    </button>
    <span className="text-sm font-semibold text-[#001E40]">{formatDate(selectedDate)}</span>
    <button onClick={() => changeDate(1)} className="p-2 text-soft hover:text-[#0C6780] rounded-lg hover:bg-subtle" aria-label="Next day">
     <FaChevronRight className="w-4 h-4" />
    </button>
   </div>

   {/* Log Sleep CTA */}
   {!entry && !loading && !error && (
    <button
     onClick={() => setShowAddModal(true)}
     className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#001E40] text-white rounded-xl font-medium hover:bg-[#0C6780] transition-colors"
    >
     <FaPlus className="w-4 h-4" />
     Log Last Night&apos;s Sleep
    </button>
   )}

   {loading && (
    <div className="space-y-3">
     {[1, 2].map((i) => <div key={i} className="h-24 bg-line rounded-xl animate-pulse" />)}
    </div>
   )}
   {error && (
    <div className="text-center p-4">
     <p className="text-red-500 mb-3">{error}</p>
     <button onClick={fetchData} className="px-4 py-2 bg-[#0C6780] text-white rounded-lg text-sm hover:bg-[#001E40]">Retry</button>
    </div>
   )}

   {/* Sleep Entry Display */}
   {!loading && !error && (
    <div className="space-y-4">
     {!entry ? (
      <div className="text-center py-10">
       <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <FaMoon className="w-10 h-10 text-indigo-300" />
       </div>
       <p className="text-sm font-medium text-soft mb-1">No sleep logged</p>
       <p className="text-xs text-faint">Track your bedtime and wake time for personalised insights.</p>
      </div>
     ) : (
      <>
       {/* Sleep summary card */}
       <div className="bg-gradient-to-br from-[#001E40] to-indigo-800 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between mb-4">
         <div>
          <p className="text-white/60 text-xs font-medium uppercase tracking-wide">Sleep Duration</p>
          <p className={`text-4xl font-black mt-0.5 ${getSleepScoreColor(entry.durationMin, targetMin).replace('text-', 'text-')}`}>
           {formatDuration(entry.durationMin)}
          </p>
          <p className="text-white/50 text-xs mt-0.5">Target: {formatDuration(targetMin)}</p>
         </div>
         <div className="flex flex-col items-end gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${qualityBgMap[entry.quality] ?? 'bg-white/20 text-white'}`}>
           {qualityEmoji[entry.quality]} {entry.quality}
          </span>
          <button
           onClick={() => entry && handleDelete(entry.id)}
           className="p-1.5 text-white/30 hover:text-red-400 transition-colors"
           aria-label="Delete entry"
          >
           <FaTrash className="w-3.5 h-3.5" />
          </button>
         </div>
        </div>

        {/* Sleep arc progress bar */}
        <div className="mb-3">
         <div className="h-2 bg-surface/10 rounded-full overflow-hidden">
          <div
           className={`h-full rounded-full transition-all duration-700 ${
            entry.durationMin / targetMin >= 0.9 ? 'bg-emerald-400' :
            entry.durationMin / targetMin >= 0.7 ? 'bg-yellow-400' : 'bg-red-400'
           }`}
           style={{ width: `${Math.min((entry.durationMin / targetMin) * 100, 100)}%` }}
          />
         </div>
         <p className="text-white/40 text-xs mt-1 text-right">
          {Math.round((entry.durationMin / targetMin) * 100)}% of target
         </p>
        </div>

        {/* Bedtime/wake row */}
        {(entry.bedtime || entry.wakeTime) && (
         <div className="flex gap-4 pt-3 border-t border-white/10">
          {entry.bedtime && (
           <div className="flex items-center gap-1.5">
            <FaMoon className="w-3.5 h-3.5 text-indigo-300" />
            <div>
             <p className="text-white/40 text-[10px]">Bedtime</p>
             <p className="text-white font-semibold text-sm">{formatTime12h(entry.bedtime)}</p>
            </div>
           </div>
          )}
          {entry.wakeTime && (
           <div className="flex items-center gap-1.5">
            <FaClock className="w-3.5 h-3.5 text-amber-300" />
            <div>
             <p className="text-white/40 text-[10px]">Wake up</p>
             <p className="text-white font-semibold text-sm">{formatTime12h(entry.wakeTime)}</p>
            </div>
           </div>
          )}
         </div>
        )}
        {entry.notes && (
         <p className="mt-3 pt-3 border-t border-white/10 text-white/50 text-xs">{entry.notes}</p>
        )}
       </div>

       {/* Log new (replace) */}
       <button
        onClick={() => setShowAddModal(true)}
        className="w-full py-2.5 border-2 border-dashed border-indigo-200 rounded-xl text-sm text-indigo-500 hover:bg-indigo-50 transition-colors font-medium"
       >
        Update sleep log
       </button>
      </>
     )}
    </div>
   )}

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

   {/* Sleep tips when no entry */}
   {!loading && !entry && (
    <div className="bg-surface rounded-xl p-4 shadow-sm">
     <p className="text-xs font-semibold text-[#001E40] mb-3 flex items-center gap-1.5">
      <FaStar className="text-amber-400" /> Sleep tips
     </p>
     <ul className="space-y-2">
      {[
       "Keep a consistent bedtime - even on weekends",
       "Stop screens 45 min before bed for deeper sleep",
       "A cool, dark room helps you fall asleep faster",
       "Avoid caffeine after 2 PM",
      ].map((tip, i) => (
       <li key={i} className="text-xs text-soft flex items-start gap-2">
        <span className="text-indigo-300 mt-0.5">â€¢</span>{tip}
       </li>
      ))}
     </ul>
    </div>
   )}

   {/* Add Sleep Modal - bedtime/wake as primary */}
   {showAddModal && (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-[60]">
     <div className="bg-surface w-full md:max-w-lg md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto pb-8">
      <div className="flex items-center justify-between p-4 border-b">
       <div>
        <h3 className="text-base font-bold text-[#001E40]">Log Sleep</h3>
        <p className="text-xs text-faint">Enter bedtime & wake time - duration is calculated automatically</p>
       </div>
       <button onClick={() => { setShowAddModal(false); resetForm() }} className="p-2 text-faint hover:text-soft">&times;</button>
      </div>
      <div className="p-4 space-y-5">
       {/* Bedtime + Wake time - side by side */}
       <div className="grid grid-cols-2 gap-4">
        <div>
         <label className="block text-sm font-medium text-[#001E40] mb-1.5 flex items-center gap-1.5">
          <FaMoon className="text-indigo-400 text-xs" /> Bedtime
         </label>
         <input
          type="time"
          value={formBedtime}
          onChange={(e) => setFormBedtime(e.target.value)}
          className="w-full px-3 py-3 border-2 border-line rounded-xl text-sm font-semibold text-[#001E40] focus:outline-none focus:border-[#0C6780] text-center"
         />
        </div>
        <div>
         <label className="block text-sm font-medium text-[#001E40] mb-1.5 flex items-center gap-1.5">
          <FaClock className="text-amber-400 text-xs" /> Wake up
         </label>
         <input
          type="time"
          value={formWakeTime}
          onChange={(e) => setFormWakeTime(e.target.value)}
          className="w-full px-3 py-3 border-2 border-line rounded-xl text-sm font-semibold text-[#001E40] focus:outline-none focus:border-[#0C6780] text-center"
         />
        </div>
       </div>

       {/* Derived duration preview */}
       {derivedDuration !== null && (
        <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl">
         <FaBed className="text-indigo-500 text-lg flex-shrink-0" />
         <div>
          <p className="text-xs text-soft">Sleep duration</p>
          <p className="text-2xl font-black text-[#001E40]">{formatDuration(derivedDuration)}</p>
         </div>
         {derivedDuration < 360 && (
          <p className="text-xs text-amber-600 ml-auto text-right">Less than 6 hours<br/>Consider an earlier bedtime</p>
         )}
         {derivedDuration >= 420 && (
          <p className="text-xs text-emerald-600 ml-auto text-right">âœ“ Good duration</p>
         )}
        </div>
       )}

       {/* Quality */}
       <div>
        <label className="block text-sm font-medium text-[#001E40] mb-2">How did you sleep?</label>
        <div className="grid grid-cols-5 gap-1.5">
         {QUALITIES.map((q) => (
          <button
           key={q.value}
           onClick={() => setFormQuality(q.value)}
           className={`py-2 text-[11px] rounded-xl font-medium text-center transition-all leading-tight ${
            formQuality === q.value ? q.activeClass : 'bg-subtle text-soft hover:bg-line'
           }`}
          >
           {q.label}
          </button>
         ))}
        </div>
       </div>

       {/* Notes */}
       <div>
        <label className="block text-sm font-medium text-[#001E40] mb-1">Notes (optional)</label>
        <textarea
         value={formNotes}
         onChange={(e) => setFormNotes(e.target.value)}
         placeholder="Vivid dreams? Woke up during the night? Note anything unusual."
         rows={2}
         className="w-full px-3 py-2 border border-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0C6780]/40 resize-none"
        />
       </div>

       <button
        onClick={handleAdd}
        disabled={submitting || derivedDuration === null}
        className="w-full py-3 bg-[#001E40] text-white rounded-xl font-medium hover:bg-[#0C6780] transition-colors disabled:opacity-50"
       >
        {submitting ? 'Saving...' : derivedDuration ? `Log ${formatDuration(derivedDuration)} of sleep` : 'Set bedtime & wake time above'}
       </button>
      </div>
     </div>
    </div>
   )}
  </div>
 )
}
