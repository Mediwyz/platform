'use client'

import { useState, useEffect, useCallback } from 'react'
import {
 FaChevronLeft, FaChevronRight, FaPlus, FaCamera,
 FaCoffee, FaSun, FaMoon, FaCookieBite, FaTimes,
} from 'react-icons/fa'
import FoodEntryCard from '../shared/FoodEntryCard'
import FoodSearchPanel, { FoodSearchResult } from '../shared/FoodSearchPanel'
import FoodScanPanel from '../shared/FoodScanPanel'

interface FoodEntry {
 id: string
 name: string
 calories: number
 protein: number
 carbs: number
 fat: number
 mealType: string
 time: string
}

interface FoodDayData {
 entries: FoodEntry[]
 totalCalories: number
 targetCalories: number
}

const MEAL_TYPES = [
 { key: 'breakfast', label: 'Breakfast', icon: FaCoffee, color: 'text-amber-500', bgColor: 'bg-amber-50', borderColor: 'border-l-amber-400' },
 { key: 'lunch', label: 'Lunch', icon: FaSun, color: 'text-orange-500', bgColor: 'bg-orange-50', borderColor: 'border-l-orange-400' },
 { key: 'dinner', label: 'Dinner', icon: FaMoon, color: 'text-indigo-500', bgColor: 'bg-indigo-50', borderColor: 'border-l-indigo-400' },
 { key: 'snack', label: 'Snack', icon: FaCookieBite, color: 'text-pink-500', bgColor: 'bg-pink-50', borderColor: 'border-l-pink-400' },
]

function generateFoodInsight(data: FoodDayData): { text: string; emoji: string } | null {
 const pct = data.targetCalories > 0 ? data.totalCalories / data.targetCalories : 0
 const totalProtein = data.entries.reduce((s, e) => s + (e.protein ?? 0), 0)
 if (data.entries.length === 0) return null
 if (pct > 1.15) return { emoji: '', text: `You've exceeded your calorie target by ${Math.round((pct - 1) * 100)}%. Consider a lighter dinner or an extra workout.` }
 if (pct > 0.85) return { emoji: '', text: "You're close to your calorie goal for today. Great balance - finish with a nutritious dinner!" }
 if (totalProtein < 30 && data.entries.length >= 2) return { emoji: '', text: "Your protein intake looks low. Add a high-protein snack like eggs, Greek yogurt, or legumes." }
 if (pct < 0.4) return { emoji: '', text: "You're well under your calorie target. Make sure you're eating enough to fuel your body." }
 return { emoji: '', text: "Keep logging your meals to get a complete picture of your nutrition today." }
}

export default function FoodDiaryTab() {
 const [selectedDate, setSelectedDate] = useState(new Date())
 const [data, setData] = useState<FoodDayData | null>(null)
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState('')
 const [showAddModal, setShowAddModal] = useState(false)
 const [addMealType, setAddMealType] = useState('breakfast')
 const [addTab, setAddTab] = useState<'search' | 'scan'>('search')
 const [actionError, setActionError] = useState('')
 const [insight, setInsight] = useState<{ text: string; emoji: string } | null>(null)
 const [insightDismissed, setInsightDismissed] = useState(false)

 const dateStr = selectedDate.toISOString().split('T')[0]

 const fetchData = useCallback(async () => {
  try {
   setLoading(true)
   setError('')
   const res = await fetch(`/api/ai/health-tracker/food?date=${dateStr}`, { credentials: 'include' })
   if (!res.ok) throw new Error('Failed to load food diary')
   const json = await res.json()
   if (!json.success) throw new Error(json.message || 'Failed to load food diary')
   const d = json.data
   const entries: FoodEntry[] = [
    ...(d.breakfast || []),
    ...(d.lunch || []),
    ...(d.dinner || []),
    ...(d.snack || []),
   ]
   const newData = {
    entries,
    totalCalories: d.totalCalories ?? 0,
    targetCalories: d.targetCalories ?? 2000,
   }
   setData(newData)
   const ins = generateFoodInsight(newData)
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
   const res = await fetch(`/api/ai/health-tracker/food/${id}`, { method: 'DELETE', credentials: 'include' })
   if (!res.ok) throw new Error('Failed to delete')
   await fetchData()
  } catch {
   setActionError('Failed to delete food entry')
   setTimeout(() => setActionError(''), 4000)
   await fetchData()
  }
 }

 const handleAddFood = async (food: FoodSearchResult) => {
  try {
   const res = await fetch('/api/ai/health-tracker/food', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
     foodDbId: food.id,
     name: food.name,
     calories: food.calories,
     protein: food.protein,
     carbs: food.carbs,
     fat: food.fat,
     mealType: addMealType,
     date: dateStr,
    }),
   })
   if (!res.ok) throw new Error('Failed to add food')
   setShowAddModal(false)
   await fetchData()
  } catch {
   setActionError('Failed to add food entry')
   setTimeout(() => setActionError(''), 4000)
  }
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

 const getEntriesForMeal = (mealType: string) =>
  data?.entries.filter((e) => e.mealType === mealType) || []

 const getMealCalories = (mealType: string) =>
  getEntriesForMeal(mealType).reduce((sum, e) => sum + e.calories, 0)

 const openAddModal = (mealType: string) => {
  setAddMealType(mealType)
  setShowAddModal(true)
 }

 const totalProtein = data?.entries.reduce((s, e) => s + (e.protein ?? 0), 0) ?? 0
 const totalCarbs = data?.entries.reduce((s, e) => s + (e.carbs ?? 0), 0) ?? 0
 const totalFat = data?.entries.reduce((s, e) => s + (e.fat ?? 0), 0) ?? 0
 const calPct = data ? Math.min((data.totalCalories / data.targetCalories) * 100, 100) : 0

 return (
  <div className="p-4 space-y-4">
   {actionError && (
    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex justify-between items-center">
     <span>{actionError}</span>
     <button onClick={() => setActionError('')} className="text-red-500 hover:text-red-700 ml-2">&#10005;</button>
    </div>
   )}

   {/* Date Selector */}
   <div className="flex items-center justify-between bg-surface rounded-xl shadow-sm p-3">
    <button
     onClick={() => changeDate(-1)}
     className="p-2 text-soft hover:text-[#0C6780] transition-colors rounded-lg hover:bg-subtle"
     aria-label="Previous day"
    >
     <FaChevronLeft className="w-4 h-4" />
    </button>
    <span className="text-sm font-semibold text-fg">{formatDate(selectedDate)}</span>
    <button
     onClick={() => changeDate(1)}
     className="p-2 text-soft hover:text-[#0C6780] transition-colors rounded-lg hover:bg-subtle"
     aria-label="Next day"
    >
     <FaChevronRight className="w-4 h-4" />
    </button>
   </div>

   {/* Calorie summary */}
   {data && (
    <div className="bg-surface rounded-xl shadow-sm p-4">
     <div className="flex items-end justify-between mb-2">
      <div>
       <p className="text-xs text-soft">Calories today</p>
       <p className="text-2xl font-bold text-fg">
        {data.totalCalories}
        <span className="text-sm font-normal text-faint"> / {data.targetCalories}</span>
       </p>
      </div>
      <div className="text-right">
       <p className="text-xs text-faint">{Math.round(calPct)}% of goal</p>
      </div>
     </div>
     {/* Progress bar */}
     <div className="h-2 bg-subtle rounded-full overflow-hidden mb-3">
      <div
       className={`h-full rounded-full transition-all duration-500 ${calPct > 100 ? 'bg-red-500' : 'bg-[#0C6780]'}`}
       style={{ width: `${calPct}%` }}
      />
     </div>
     {/* Macro pills */}
     <div className="flex gap-2">
      <span className="flex-1 text-center text-xs py-1.5 bg-blue-50 rounded-lg">
       <span className="font-bold text-fg">{totalProtein}g</span>
       <span className="text-faint ml-1">Protein</span>
      </span>
      <span className="flex-1 text-center text-xs py-1.5 bg-amber-50 rounded-lg">
       <span className="font-bold text-fg">{totalCarbs}g</span>
       <span className="text-faint ml-1">Carbs</span>
      </span>
      <span className="flex-1 text-center text-xs py-1.5 bg-pink-50 rounded-lg">
       <span className="font-bold text-fg">{totalFat}g</span>
       <span className="text-faint ml-1">Fat</span>
      </span>
     </div>
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

   {loading && (
    <div className="space-y-4">
     {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-surface rounded-xl p-4 animate-pulse">
       <div className="h-5 bg-line rounded w-1/3 mb-3" />
       <div className="h-12 bg-line rounded" />
      </div>
     ))}
    </div>
   )}

   {error && (
    <div className="text-center p-4">
     <p className="text-red-500 mb-3">{error}</p>
     <button onClick={fetchData} className="px-4 py-2 bg-[#0C6780] text-white rounded-lg text-sm hover:bg-[#001E40] transition-colors">
      Retry
     </button>
    </div>
   )}

   {/* Meal Sections */}
   {!loading && !error && MEAL_TYPES.map((meal) => {
    const entries = getEntriesForMeal(meal.key)
    const mealCals = getMealCalories(meal.key)
    const Icon = meal.icon

    return (
     <div key={meal.key} className={`bg-surface rounded-xl shadow-sm overflow-hidden border-l-4 ${meal.borderColor}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-line">
       <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg ${meal.bgColor} flex items-center justify-center`}>
         <Icon className={`w-4 h-4 ${meal.color}`} />
        </div>
        <div>
         <span className="text-sm font-semibold text-fg">{meal.label}</span>
         {mealCals > 0 && (
          <span className="ml-2 text-xs text-faint">{mealCals} cal</span>
         )}
        </div>
       </div>
       <button
        onClick={() => openAddModal(meal.key)}
        className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#0C6780] hover:bg-[#0C6780]/10 rounded-lg transition-colors font-medium"
        aria-label={`Add ${meal.label}`}
       >
        <FaPlus className="w-3 h-3" /> Add
       </button>
      </div>
      <div className="p-3 space-y-2">
       {entries.length === 0 ? (
        <button
         onClick={() => openAddModal(meal.key)}
         className="w-full py-3 text-sm text-faint text-center hover:text-[#0C6780] transition-colors border border-dashed border-line rounded-lg hover:border-[#0C6780]/40"
        >
         + Log {meal.label.toLowerCase()}
        </button>
       ) : (
        entries.map((entry) => (
         <FoodEntryCard
          key={entry.id}
          id={entry.id}
          name={entry.name}
          calories={entry.calories}
          protein={entry.protein}
          carbs={entry.carbs}
          fat={entry.fat}
          time={entry.time}
          onDelete={handleDelete}
         />
        ))
       )}
      </div>
     </div>
    )
   })}

   {/* Add Food Modal */}
   {showAddModal && (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-[60]">
     <div className="bg-surface w-full md:max-w-lg md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto pb-8">
      <div className="flex items-center justify-between p-4 border-b">
       <h3 className="text-base font-bold text-fg">
        Add {MEAL_TYPES.find((m) => m.key === addMealType)?.label || 'Food'}
       </h3>
       <button onClick={() => setShowAddModal(false)} className="p-2 text-faint hover:text-soft transition-colors">
        &times;
       </button>
      </div>
      <div className="p-4">
       {/* Meal type chips */}
       <div className="flex gap-2 mb-4 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-1">
        {MEAL_TYPES.map((meal) => (
         <button
          key={meal.key}
          onClick={() => setAddMealType(meal.key)}
          className={`px-3 py-1.5 text-xs rounded-full font-medium whitespace-nowrap transition-colors ${
           addMealType === meal.key
           ? 'bg-[#001E40] text-white'
           : 'bg-subtle text-soft hover:bg-line'
          }`}
         >
          {meal.label}
         </button>
        ))}
       </div>

       {/* Search / AI Scan tabs */}
       <div className="flex border-b border-line mb-4">
        <button
         onClick={() => setAddTab('search')}
         className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
          addTab === 'search'
          ? 'text-[#0C6780] border-b-2 border-[#0C6780]'
          : 'text-soft hover:text-soft'
         }`}
        >
         <FaPlus className="inline mr-1.5 text-xs" />
         Search Food
        </button>
        <button
         onClick={() => setAddTab('scan')}
         className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
          addTab === 'scan'
          ? 'text-[#0C6780] border-b-2 border-[#0C6780]'
          : 'text-soft hover:text-soft'
         }`}
        >
         <FaCamera className="inline mr-1.5 text-xs" />
         AI Scan
        </button>
       </div>

       {addTab === 'search' && <FoodSearchPanel onSelect={handleAddFood} />}
       {addTab === 'scan' && (
        <FoodScanPanel
         onResult={(food) => {
          handleAddFood({
           id: '',
           name: food.name,
           calories: food.calories,
           protein: food.protein,
           carbs: food.carbs,
           fat: food.fat,
          } as FoodSearchResult)
         }}
        />
       )}
      </div>
     </div>
    </div>
   )}
  </div>
 )
}
