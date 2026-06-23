'use client'

import { useState, useEffect, useCallback } from 'react'
import { FaFire, FaDumbbell, FaTint, FaBalanceScale, FaTimes, FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa'

interface WeeklyEntry {
 day: string
 calories: number
 exerciseMinutes: number
}

interface ProgressData {
 todayCalories: number
 todayBurned: number
 todayWater: number
 todayNetCalories: number
 weeklyData: WeeklyEntry[]
 weeklyAvgCalories: number
 weeklyTotalBurned: number
 weeklyNetCalories: number
 weeklyAvgWater: number
}

function WeeklyBarChart({
 data,
 dataKey,
 color,
 label,
 unit,
}: {
 data: WeeklyEntry[]
 dataKey: 'calories' | 'exerciseMinutes'
 color: string
 bgColor: string
 label: string
 unit: string
}) {
 const values = data.map((d) => d[dataKey])
 const max = Math.max(...values, 1)
 const avg = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0

 return (
  <div className="bg-surface rounded-xl shadow-sm p-4">
   <div className="flex items-center justify-between mb-4">
    <h3 className="text-sm font-semibold text-[#001E40]">{label}</h3>
    <span className="text-xs text-faint">avg {avg} {unit}</span>
   </div>
   <div className="flex items-end gap-1.5 h-28">
    {data.map((entry, i) => {
     const height = max > 0 ? (entry[dataKey] / max) * 100 : 0
     const isToday = i === data.length - 1
     return (
      <div key={i} className="flex-1 flex flex-col items-center gap-1">
       {entry[dataKey] > 0 && (
        <span className="text-[9px] text-soft font-medium">{entry[dataKey]}</span>
       )}
       <div className="w-full bg-subtle rounded-t-lg relative" style={{ height: '90px' }}>
        <div
         className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-700 ${isToday ? color : color + '/60'}`}
         style={{ height: `${Math.max(height, entry[dataKey] > 0 ? 4 : 0)}%` }}
        />
        {isToday && (
         <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-current" style={{ color: 'transparent', borderTop: '3px solid #0C6780' }} />
        )}
       </div>
       <span className={`text-[9px] font-medium ${isToday ? 'text-[#001E40]' : 'text-faint'}`}>{entry.day}</span>
      </div>
     )
    })}
   </div>
  </div>
 )
}

function generateProgressInsight(data: ProgressData): { text: string; emoji: string } | null {
 if (data.weeklyData.every(d => d.calories === 0)) return null
 const activeDays = data.weeklyData.filter(d => d.exerciseMinutes > 0).length
 const totalDays = data.weeklyData.length
 if (activeDays === totalDays) return { emoji: '', text: "You've been active every day this week. Consistency is the most powerful health habit you can build." }
 if (activeDays === 0) return { emoji: '', text: "No exercise logged this week. Even a 15-minute walk each day would make a meaningful difference." }
 if (data.weeklyNetCalories < -1000) return { emoji: '', text: "Your net calories are very low this week. Make sure you're eating enough to sustain your energy and muscle mass." }
 if (activeDays >= 4) return { emoji: '', text: `${activeDays} active days this week - well done! Aim for one more session to hit your full weekly target.` }
 return { emoji: '', text: `You've been active ${activeDays} days this week. Building a consistent routine is the key to lasting results.` }
}

function TrendBadge({ value, positive = true }: { value: number; positive?: boolean }) {
 if (value === 0) return <FaMinus className="text-faint text-xs" />
 const isGood = positive ? value > 0 : value < 0
 return value > 0
  ? <FaArrowUp className={`text-xs ${isGood ? 'text-emerald-500' : 'text-red-500'}`} />
  : <FaArrowDown className={`text-xs ${isGood ? 'text-emerald-500' : 'text-red-500'}`} />
}

export default function ProgressTab() {
 const [data, setData] = useState<ProgressData | null>(null)
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState('')
 const [period, setPeriod] = useState<'week' | 'month'>('week')
 const [insight, setInsight] = useState<{ text: string; emoji: string } | null>(null)
 const [insightDismissed, setInsightDismissed] = useState(false)

 const fetchData = useCallback(async () => {
  try {
   setLoading(true)
   setError('')
   const res = await fetch(`/api/ai/health-tracker/progress?period=${period}`, { credentials: 'include' })
   if (!res.ok) throw new Error('Failed to load progress')
   const json = await res.json()
   if (!json.success) throw new Error(json.message || 'Failed to load progress')
   const d = json.data ?? {}
   const safeDays: Array<{ date: string; caloriesConsumed: number; caloriesBurned: number; waterMl: number; exerciseMinutes: number }> = Array.isArray(d.days) ? d.days : []
   const weeklyData: WeeklyEntry[] = safeDays.map((day) => ({
    day: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
    calories: day.caloriesConsumed ?? 0,
    exerciseMinutes: day.exerciseMinutes ?? 0,
   }))
   const today = safeDays[safeDays.length - 1] ?? { caloriesConsumed: 0, caloriesBurned: 0, waterMl: 0 }
   const averages = d.averages ?? {}
   const totals = d.totals ?? {}
   const newData = {
    todayCalories: today.caloriesConsumed ?? 0,
    todayBurned: today.caloriesBurned ?? 0,
    todayWater: today.waterMl ?? 0,
    todayNetCalories: (today.caloriesConsumed ?? 0) - (today.caloriesBurned ?? 0),
    weeklyData,
    weeklyAvgCalories: averages.calories ?? 0,
    weeklyTotalBurned: totals.burned ?? 0,
    weeklyNetCalories: (totals.calories ?? 0) - (totals.burned ?? 0),
    weeklyAvgWater: averages.water ?? 0,
   }
   setData(newData)
   const ins = generateProgressInsight(newData)
   if (ins) { setInsight(ins); setInsightDismissed(false) }
  } catch (err) {
   setError(err instanceof Error ? err.message : 'Something went wrong')
  } finally {
   setLoading(false)
  }
 }, [period])

 useEffect(() => {
  fetchData()
 }, [fetchData])

 if (loading) {
  return (
   <div className="p-4 space-y-4">
    <div className="h-10 bg-line rounded-xl animate-pulse" />
    <div className="grid grid-cols-2 gap-3">
     {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-line rounded-xl animate-pulse" />)}
    </div>
    <div className="h-48 bg-line rounded-xl animate-pulse" />
    <div className="h-48 bg-line rounded-xl animate-pulse" />
   </div>
  )
 }

 if (error) {
  return (
   <div className="p-4 text-center">
    <p className="text-red-500 mb-3">{error}</p>
    <button onClick={fetchData} className="px-4 py-2 bg-[#0C6780] text-white rounded-lg text-sm hover:bg-[#001E40]">Retry</button>
   </div>
  )
 }

 if (!data) return null

 return (
  <div className="p-4 space-y-4">
   {/* Period Toggle */}
   <div className="flex bg-surface rounded-xl shadow-sm p-1 gap-1">
    {(['week', 'month'] as const).map((p) => (
     <button
      key={p}
      onClick={() => setPeriod(p)}
      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${
       period === p ? 'bg-[#001E40] text-white' : 'text-soft hover:bg-subtle'
      }`}
     >
      This {p}
     </button>
    ))}
   </div>

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

   {/* Today's Stats */}
   <div className="grid grid-cols-2 gap-3">
    {[
     { icon: FaFire, label: "Calories today", value: `${data.todayCalories}`, sub: "cal consumed", color: 'text-[#0C6780]', border: 'border-l-[#0C6780]' },
     { icon: FaDumbbell, label: "Burned", value: `${data.todayBurned}`, sub: "cal burned", color: 'text-orange-500', border: 'border-l-orange-400' },
     { icon: FaTint, label: "Water", value: `${data.todayWater}`, sub: "ml drank", color: 'text-sky-500', border: 'border-l-sky-400' },
     { icon: FaBalanceScale, label: "Net calories", value: `${data.todayNetCalories}`, sub: "net today", color: 'text-emerald-500', border: 'border-l-emerald-400' },
    ].map(({ icon: Icon, label, value, sub, color, border }) => (
     <div key={label} className={`bg-surface rounded-xl shadow-sm p-3 border-l-4 ${border}`}>
      <div className="flex items-center gap-1.5 mb-1">
       <Icon className={`w-3.5 h-3.5 ${color}`} />
       <span className="text-xs text-soft">{label}</span>
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-faint">{sub}</p>
     </div>
    ))}
   </div>

   {/* Charts */}
   <WeeklyBarChart
    data={data.weeklyData}
    dataKey="calories"
    color="bg-[#0C6780]"
    bgColor="bg-[#0C6780]/10"
    label={`${period === 'week' ? 'Weekly' : 'Monthly'} Calorie Intake`}
    unit="cal"
   />
   <WeeklyBarChart
    data={data.weeklyData}
    dataKey="exerciseMinutes"
    color="bg-emerald-500"
    bgColor="bg-emerald-50"
    label={`${period === 'week' ? 'Weekly' : 'Monthly'} Activity`}
    unit="min"
   />

   {/* Weekly Insights table */}
   <div className="bg-surface rounded-xl shadow-sm p-4">
    <h3 className="text-sm font-semibold text-[#001E40] mb-3">Summary</h3>
    <div className="space-y-3 divide-y divide-line">
     {[
      { label: `Avg. daily calories`, value: `${data.weeklyAvgCalories} cal`, icon: FaFire, color: 'text-[#0C6780]', trend: 0, positiveUp: false },
      { label: `Total burned`, value: `${data.weeklyTotalBurned} cal`, icon: FaDumbbell, color: 'text-orange-500', trend: 1, positiveUp: true },
      { label: `Net calorie balance`, value: `${data.weeklyNetCalories > 0 ? '+' : ''}${data.weeklyNetCalories} cal`, icon: FaBalanceScale, color: data.weeklyNetCalories > 0 ? 'text-red-500' : 'text-emerald-500', trend: data.weeklyNetCalories, positiveUp: false },
      { label: `Avg. daily water`, value: `${data.weeklyAvgWater} ml`, icon: FaTint, color: 'text-sky-500', trend: 0, positiveUp: true },
     ].map(({ label, value, icon: Icon, color, trend, positiveUp }) => (
      <div key={label} className="flex items-center justify-between pt-2.5 first:pt-0">
       <div className="flex items-center gap-2">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-sm text-soft">{label}</span>
       </div>
       <div className="flex items-center gap-1.5">
        <span className={`text-sm font-semibold ${color}`}>{value}</span>
        <TrendBadge value={trend} positive={positiveUp} />
       </div>
      </div>
     ))}
    </div>
   </div>
  </div>
 )
}
