'use client'

import { useState, useEffect, useCallback } from 'react'
import { FaUtensils, FaDumbbell, FaTint, FaSync, FaTimes, FaFire } from 'react-icons/fa'
import CircularProgress from '../shared/CircularProgress'
import WaterTracker from '../shared/WaterTracker'
import GoalProgressBar from '../shared/GoalProgressBar'
import StreakTile from '../shared/StreakTile'

interface DashboardData {
  calories: { consumed: number; target: number; burned: number }
  water: { consumed: number; target: number }
  exercise: { minutes: number; targetMinutes: number; caloriesBurned: number }
}

interface DashboardTabProps {
  onNavigateToTab?: (tabIndex: number) => void
}

function generateInsight(data: DashboardData): { text: string; emoji: string } {
  const calPct = data.calories.target > 0 ? data.calories.consumed / data.calories.target : 0
  const waterPct = data.water.target > 0 ? data.water.consumed / data.water.target : 0
  const exPct = data.exercise.targetMinutes > 0 ? data.exercise.minutes / data.exercise.targetMinutes : 0

  if (data.calories.consumed === 0 && data.water.consumed === 0 && data.exercise.minutes === 0) {
    return { emoji: '', text: "Start your day right! Log your first meal and a glass of water to get personalised insights." }
  }
  if (waterPct < 0.25) {
    return { emoji: '', text: "You've had very little water today. Dehydration reduces focus - grab a glass now!" }
  }
  if (exPct >= 1 && waterPct >= 0.8) {
    return { emoji: '', text: "Amazing! Exercise and hydration goals both hit. You're crushing it today!" }
  }
  if (calPct > 1.1) {
    return { emoji: '', text: "You've gone over your calorie goal. A light walk can help balance the day." }
  }
  if (exPct < 0.3 && calPct > 0.6) {
    return { emoji: '', text: "You've fuelled up well - time to move! Even 15 minutes of walking counts." }
  }
  if (waterPct >= 1) {
    return { emoji: '', text: "Hydration goal reached! Staying consistent will boost your energy all day." }
  }
  if (calPct < 0.4 && data.calories.consumed > 0) {
    return { emoji: '', text: "You've logged only a fraction of your daily calories. Make sure to eat enough to fuel your body." }
  }
  return { emoji: '', text: "You're on track! Keep logging meals, water, and activity to close out the day strong." }
}

export default function DashboardTab({ onNavigateToTab }: DashboardTabProps) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [insight, setInsight] = useState<{ text: string; emoji: string } | null>(null)
  const [insightDismissed, setInsightDismissed] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch('/api/ai/health-tracker/dashboard', { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load dashboard')
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to load dashboard')
      const d = json.data ?? {}
      const n = (v: unknown) => Number.isFinite(Number(v)) ? Number(v) : 0
      const newData: DashboardData = {
        calories: { consumed: n(d.caloriesConsumed), target: n(d.targetCalories) || 2000, burned: n(d.caloriesBurned) },
        water: { consumed: n(d.waterConsumedMl), target: n(d.waterTargetMl) || 2000 },
        exercise: { minutes: n(d.exerciseMinutes), targetMinutes: n(d.exerciseTargetMin) || 30, caloriesBurned: n(d.caloriesBurned) },
      }
      setData(newData)
      setInsight(generateInsight(newData))
      setInsightDismissed(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddWater = async () => {
    try {
      const res = await fetch('/api/ai/health-tracker/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountMl: 250 }),
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to log water')
      await fetchData()
    } catch {
      setError('Failed to log water')
      setTimeout(() => setError(''), 4000)
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-20 bg-line rounded-xl animate-pulse" />
        <div className="flex justify-center">
          <div className="w-48 h-48 bg-line rounded-full animate-pulse" />
        </div>
        <div className="h-24 bg-line rounded-xl animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-line rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500 mb-3">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-[#0C6780] text-white rounded-lg text-sm hover:bg-[#001E40] transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data) return null

  const netCalories = data.calories.consumed - data.calories.burned
  const remaining = Math.max(0, data.calories.target - netCalories)

  return (
    <div className="p-4 space-y-5">
      <StreakTile />

      {/* AI Insight Banner */}
      {insight && !insightDismissed && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-[#001E40] to-[#0C6780] text-white shadow-md">
          <span className="text-xl flex-shrink-0 mt-0.5">{insight.emoji}</span>
          <p className="text-sm leading-relaxed flex-1">{insight.text}</p>
          <button
            onClick={() => setInsightDismissed(true)}
            className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
            aria-label="Dismiss suggestion"
          >
            <FaTimes className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-fg">Today&apos;s Summary</h2>
        <button
          onClick={fetchData}
          className="p-2 text-faint hover:text-[#0C6780] transition-colors rounded-lg hover:bg-subtle"
          aria-label="Refresh dashboard"
        >
          <FaSync className="w-4 h-4" />
        </button>
      </div>

      {/* Calorie Ring + side stats (desktop two-column) */}
      <div className="flex flex-col sm:flex-row items-center gap-5">
        <div className="flex-shrink-0">
          <CircularProgress
            consumed={data.calories.consumed}
            target={data.calories.target}
            burned={data.calories.burned}
          />
        </div>
        <div className="hidden sm:flex flex-col gap-3 flex-1 w-full">
          <div className="flex items-center gap-3 p-3 bg-surface rounded-xl shadow-sm border-l-4 border-[#0C6780]">
            <FaFire className="text-orange-500 text-xl flex-shrink-0" />
            <div>
              <p className="text-xs text-soft">Net Calories</p>
              <p className="text-lg font-bold text-fg">{netCalories}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-surface rounded-xl shadow-sm border-l-4 border-emerald-500">
            <FaDumbbell className="text-emerald-500 text-xl flex-shrink-0" />
            <div>
              <p className="text-xs text-soft">Exercise</p>
              <p className="text-lg font-bold text-fg">{data.exercise.minutes} min</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-surface rounded-xl shadow-sm border-l-4 border-sky-400">
            <FaTint className="text-sky-500 text-xl flex-shrink-0" />
            <div>
              <p className="text-xs text-soft">Remaining today</p>
              <p className="text-lg font-bold text-fg">{remaining} cal left</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile stat pills */}
      <div className="flex gap-2 sm:hidden overflow-x-auto [&::-webkit-scrollbar]:hidden pb-1">
        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-surface rounded-full shadow-sm border border-line">
          <FaFire className="text-orange-500 text-xs" />
          <span className="text-xs font-semibold text-fg">{netCalories} net cal</span>
        </div>
        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-surface rounded-full shadow-sm border border-line">
          <FaDumbbell className="text-emerald-500 text-xs" />
          <span className="text-xs font-semibold text-fg">{data.exercise.minutes} min</span>
        </div>
        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-surface rounded-full shadow-sm border border-line">
          <FaTint className="text-sky-500 text-xs" />
          <span className="text-xs font-semibold text-fg">{data.water.consumed}ml water</span>
        </div>
      </div>

      {/* Water Tracker */}
      <WaterTracker
        consumed={data.water.consumed}
        target={data.water.target}
        onAddGlass={handleAddWater}
      />

      {/* Goal Progress */}
      <div className="bg-surface rounded-xl shadow-sm p-4 space-y-4">
        <h3 className="text-sm font-semibold text-fg">Goal Progress</h3>
        <GoalProgressBar
          label="Calories"
          current={data.calories.consumed}
          target={data.calories.target}
          unit="cal"
          color="bg-[#0C6780]"
        />
        <GoalProgressBar
          label="Water"
          current={data.water.consumed}
          target={data.water.target}
          unit="ml"
          color="bg-sky-400"
        />
        <GoalProgressBar
          label="Exercise"
          current={data.exercise.minutes}
          target={data.exercise.targetMinutes}
          unit="min"
          color="bg-emerald-500"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-surface rounded-xl shadow-sm p-4">
        <h3 className="text-sm font-semibold text-fg mb-3">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => onNavigateToTab?.(1)}
            className="flex flex-col items-center gap-1.5 p-3 bg-[#001E40]/5 rounded-xl hover:bg-[#001E40]/10 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-[#001E40] flex items-center justify-center">
              <FaUtensils className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-medium text-fg">Log Meal</span>
          </button>
          <button
            onClick={() => onNavigateToTab?.(2)}
            className="flex flex-col items-center gap-1.5 p-3 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center">
              <FaDumbbell className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-medium text-emerald-700">Log Exercise</span>
          </button>
          <button
            onClick={handleAddWater}
            className="flex flex-col items-center gap-1.5 p-3 bg-sky-50 rounded-xl hover:bg-sky-100 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-sky-500 flex items-center justify-center">
              <FaTint className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-medium text-sky-700">+250ml Water</span>
          </button>
        </div>
      </div>
    </div>
  )
}
