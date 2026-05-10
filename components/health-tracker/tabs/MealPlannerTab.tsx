'use client'

import { useState, useEffect, useCallback } from 'react'
import { FaPlus, FaSpinner, FaCalendarDay, FaUtensils, FaRobot, FaTimes } from 'react-icons/fa'

interface MealPlanMeal {
 id: string
 name: string
 mealType: string
 calories: number
 protein: number
 carbs: number
 fat: number
 description?: string
}

interface MealPlanDay {
 day: string
 meals: MealPlanMeal[]
 totalCalories: number
 totalProtein: number
 totalCarbs: number
 totalFat: number
}

interface MealPlanData {
 days: MealPlanDay[]
 targetCalories: number
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const MEAL_TYPE_COLORS: Record<string, string> = {
 breakfast: 'border-l-amber-400',
 lunch: 'border-l-orange-400',
 dinner: 'border-l-indigo-400',
 snack: 'border-l-pink-400',
}

const MEAL_TYPE_BADGES: Record<string, string> = {
 breakfast: 'bg-amber-100 text-amber-700',
 lunch: 'bg-orange-100 text-orange-700',
 dinner: 'bg-indigo-100 text-indigo-700',
 snack: 'bg-pink-100 text-pink-700',
}

function MealCard({
 meal,
 onAddToDiary,
 adding,
}: {
 meal: MealPlanMeal
 onAddToDiary: (meal: MealPlanMeal) => void
 adding: boolean
}) {
 const borderColor = MEAL_TYPE_COLORS[meal.mealType] ?? 'border-l-[#0C6780]'
 const badgeClass = MEAL_TYPE_BADGES[meal.mealType] ?? 'bg-[#0C6780]/10 text-[#0C6780]'

 return (
  <div className={`bg-white rounded-xl shadow-sm p-3.5 border-l-4 ${borderColor}`}>
   <div className="flex items-start justify-between gap-2">
    <div className="flex-1 min-w-0">
     <div className="flex items-center gap-2 flex-wrap">
      <h4 className="text-sm font-bold text-[#001E40] truncate">{meal.name}</h4>
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize whitespace-nowrap ${badgeClass}`}>
       {meal.mealType}
      </span>
     </div>
     {meal.description && (
      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{meal.description}</p>
     )}
     <div className="flex items-center gap-3 mt-2">
      <span className="text-sm font-bold text-[#001E40]">{meal.calories} cal</span>
      <span className="text-xs text-gray-400">P:{meal.protein}g</span>
      <span className="text-xs text-gray-400">C:{meal.carbs}g</span>
      <span className="text-xs text-gray-400">F:{meal.fat}g</span>
     </div>
    </div>
    <button
     onClick={() => onAddToDiary(meal)}
     disabled={adding}
     className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#0C6780] hover:bg-[#0C6780]/10 rounded-lg transition-colors font-medium flex-shrink-0 disabled:opacity-50"
     aria-label={`Add ${meal.name} to diary`}
    >
     {adding ? <FaSpinner className="w-3 h-3 animate-spin" /> : <FaPlus className="w-3 h-3" />}
     {adding ? '' : 'Add'}
    </button>
   </div>
  </div>
 )
}

export default function MealPlannerTab() {
 const [data, setData] = useState<MealPlanData | null>(null)
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState('')
 const [selectedDay, setSelectedDay] = useState(0)
 const [generating, setGenerating] = useState(false)
 const [addingMealId, setAddingMealId] = useState<string | null>(null)
 const [insight, setInsight] = useState<string | null>(null)
 const [insightDismissed, setInsightDismissed] = useState(false)

 const getWeekStart = () => {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  return monday.toISOString().split('T')[0]
 }

 const fetchData = useCallback(async () => {
  try {
   setLoading(true)
   setError('')
   const weekStart = getWeekStart()
   const res = await fetch(`/api/ai/health-tracker/meal-plan?weekStart=${weekStart}`, { credentials: 'include' })
   if (!res.ok) throw new Error('Failed to load meal plan')
   const json = await res.json()
   if (!json.success) throw new Error(json.message || 'Failed to load meal plan')
   const d = json.data
   const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
   const days: MealPlanDay[] = dayNames.map((name, index) => {
    const dayMeals = d.days[index] || {}
    const meals: MealPlanMeal[] = [
     ...(dayMeals.breakfast || []),
     ...(dayMeals.lunch || []),
     ...(dayMeals.dinner || []),
     ...(dayMeals.snack || []),
    ]
    const totals = d.dailyTotals?.[index] || { calories: 0, protein: 0, carbs: 0, fat: 0 }
    return { day: name, meals, totalCalories: totals.calories, totalProtein: totals.protein, totalCarbs: totals.carbs, totalFat: totals.fat }
   })
   setData({ days, targetCalories: 2000 })
   const hasPlan = days.some(d => d.meals.length > 0)
   if (hasPlan) setInsight("Your weekly meal plan is ready. Tap + on any meal to add it to today's food diary.")
  } catch (err) {
   setError(err instanceof Error ? err.message : 'Something went wrong')
  } finally {
   setLoading(false)
  }
 }, [])

 useEffect(() => {
  fetchData()
 }, [fetchData])

 const handleGenerate = async () => {
  try {
   setGenerating(true)
   setError('')
   const res = await fetch('/api/ai/health-tracker/meal-plan/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weekStart: getWeekStart() }),
    credentials: 'include',
   })
   const json = await res.json().catch(() => null)
   if (!res.ok || !json?.success) throw new Error(json?.message || 'Failed to generate meal plan')
   const d = json.data
   const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   const days: MealPlanDay[] = dayNames.map((name, index) => {
    const dayPlan = d?.days?.[index]
    const m = dayPlan?.meals ?? {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toMeal = (mealType: string, meal: any): MealPlanMeal | null =>
     meal ? { id: `${index}-${mealType}`, mealType, name: meal.name, calories: meal.calories ?? 0, protein: meal.protein ?? 0, carbs: meal.carbs ?? 0, fat: meal.fat ?? 0 } : null
    const meals: MealPlanMeal[] = [
     toMeal('breakfast', m.breakfast),
     toMeal('lunch', m.lunch),
     toMeal('dinner', m.dinner),
     toMeal('snack', m.snack),
    ].filter(Boolean) as MealPlanMeal[]
    const totalCalories = dayPlan?.totalCalories ?? meals.reduce((s, x) => s + x.calories, 0)
    return { day: name, meals, totalCalories, totalProtein: meals.reduce((s, x) => s + x.protein, 0), totalCarbs: meals.reduce((s, x) => s + x.carbs, 0), totalFat: meals.reduce((s, x) => s + x.fat, 0) }
   })
   setData({ days, targetCalories: d?.targetCalories ?? 2000 })
   setInsight("✨ AI-generated meal plan ready! Tap + on any meal to log it in your food diary.")
   setInsightDismissed(false)
  } catch (err) {
   setError(err instanceof Error ? err.message : 'Failed to generate')
  } finally {
   setGenerating(false)
  }
 }

 const handleAddToDiary = async (meal: MealPlanMeal) => {
  try {
   setAddingMealId(meal.id)
   const today = new Date().toISOString().split('T')[0]
   const res = await fetch('/api/ai/health-tracker/meal-plan/add-to-diary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mealPlanEntryId: meal.id, date: today }),
    credentials: 'include',
   })
   if (!res.ok) throw new Error('Failed to add to diary')
  } catch {
   setError('Failed to add meal to diary')
   setTimeout(() => setError(''), 4000)
  } finally {
   setAddingMealId(null)
  }
 }

 const currentDay = data?.days?.[selectedDay]

 if (loading) {
  return (
   <div className="p-4 space-y-4">
    <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
    <div className="flex gap-1.5">{DAYS_OF_WEEK.map(d => <div key={d} className="h-10 flex-1 bg-gray-200 rounded-lg animate-pulse" />)}</div>
    <div className="h-20 bg-gray-200 rounded-xl animate-pulse" />
    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}
   </div>
  )
 }

 if (error && !data) {
  return (
   <div className="p-4 text-center">
    <p className="text-red-500 mb-3">{error}</p>
    <button onClick={fetchData} className="px-4 py-2 bg-[#0C6780] text-white rounded-lg text-sm hover:bg-[#001E40]">Retry</button>
   </div>
  )
 }

 const hasPlan = data?.days.some(d => d.meals.length > 0)

 return (
  <div className="p-4 space-y-4">
   {/* Target Calories Banner */}
   {data && (
    <div className="flex items-center justify-between bg-[#001E40]/5 rounded-xl p-3 border border-[#001E40]/10">
     <div className="flex items-center gap-2">
      <FaCalendarDay className="w-4 h-4 text-[#0C6780]" />
      <span className="text-sm font-medium text-[#001E40]">Daily calorie target</span>
     </div>
     <span className="text-sm font-bold text-[#0C6780]">{data.targetCalories} cal</span>
    </div>
   )}

   {/* AI Insight */}
   {insight && !insightDismissed && (
    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-gradient-to-r from-[#001E40] to-[#0C6780] text-white shadow-md">
     <FaRobot className="text-white/80 flex-shrink-0 mt-0.5" />
     <p className="text-sm leading-relaxed flex-1">{insight}</p>
     <button onClick={() => setInsightDismissed(true)} className="flex-shrink-0 text-white/60 hover:text-white"><FaTimes className="w-3.5 h-3.5" /></button>
    </div>
   )}

   {/* Day Tabs */}
   <div className="flex gap-1 bg-white rounded-xl shadow-sm p-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
    {DAYS_OF_WEEK.map((day, index) => {
     const dayData = data?.days?.[index]
     const hasMeals = dayData && dayData.meals.length > 0
     return (
      <button
       key={day}
       onClick={() => setSelectedDay(index)}
       className={`flex-1 flex flex-col items-center py-2 text-xs font-medium rounded-lg transition-colors min-w-[40px] ${
        selectedDay === index ? 'bg-[#001E40] text-white' : 'text-gray-600 hover:bg-gray-100'
       }`}
      >
       {day}
       {hasMeals && (
        <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${selectedDay === index ? 'bg-[#9AE1FF]' : 'bg-[#0C6780]'}`} />
       )}
      </button>
     )
    })}
   </div>

   {/* Selected Day Macros */}
   {currentDay && currentDay.meals.length > 0 && (
    <div className="bg-white rounded-xl shadow-sm p-4">
     <p className="text-xs text-gray-400 mb-2 font-medium">{currentDay.day}&apos;s totals</p>
     <div className="grid grid-cols-4 gap-2 text-center">
      <div>
       <p className="text-lg font-bold text-[#001E40]">{currentDay.totalCalories}</p>
       <p className="text-[10px] text-gray-400">cal</p>
      </div>
      <div>
       <p className="text-lg font-bold text-[#0C6780]">{currentDay.totalProtein}g</p>
       <p className="text-[10px] text-gray-400">protein</p>
      </div>
      <div>
       <p className="text-lg font-bold text-amber-600">{currentDay.totalCarbs}g</p>
       <p className="text-[10px] text-gray-400">carbs</p>
      </div>
      <div>
       <p className="text-lg font-bold text-pink-600">{currentDay.totalFat}g</p>
       <p className="text-[10px] text-gray-400">fat</p>
      </div>
     </div>
    </div>
   )}

   {/* Generate Button */}
   <button
    onClick={handleGenerate}
    disabled={generating}
    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 ${
     hasPlan
     ? 'border-2 border-dashed border-[#0C6780]/40 text-[#0C6780] hover:bg-[#0C6780]/5'
     : 'bg-[#001E40] text-white hover:bg-[#0C6780]'
    }`}
   >
    {generating ? (
     <><FaSpinner className="w-4 h-4 animate-spin" />Generating AI meal plan…</>
    ) : (
     <><FaRobot className="w-4 h-4" />{hasPlan ? 'Regenerate Plan' : 'Generate AI Meal Plan'}</>
    )}
   </button>

   {error && <p className="text-sm text-red-500 text-center">{error}</p>}

   {/* Meals for Selected Day */}
   {!currentDay || currentDay.meals.length === 0 ? (
    <div className="text-center py-10">
     <div className="w-16 h-16 bg-[#001E40]/5 rounded-full flex items-center justify-center mx-auto mb-3">
      <FaUtensils className="w-8 h-8 text-[#0C6780]/40" />
     </div>
     <p className="text-sm font-medium text-gray-500 mb-1">No plan for {DAYS_OF_WEEK[selectedDay]}</p>
     <p className="text-xs text-gray-400">Generate an AI meal plan above or pick a different day.</p>
    </div>
   ) : (
    <div className="space-y-3">
     {currentDay.meals.map((meal) => (
      <MealCard
       key={meal.id}
       meal={meal}
       onAddToDiary={handleAddToDiary}
       adding={addingMealId === meal.id}
      />
     ))}
    </div>
   )}
  </div>
 )
}
