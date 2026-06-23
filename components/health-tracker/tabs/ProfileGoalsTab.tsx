'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { FaSave, FaWeight, FaRulerVertical, FaBell } from 'react-icons/fa'
import { calculateTdee, calculateTargetCalories } from '@/lib/utils/tdee'

interface ProfileData {
 age: number
 gender: string
 heightCm: number
 weightKg: number
 activityLevel: string
 weightGoal: string
 dietaryPreferences: string[]
 allergenSettings: string[]
 targetCalories: number
 targetWaterMl: number
 targetExerciseMin: number
 waterReminders: boolean
}

const ACTIVITY_LEVELS = [
 { value: 'sedentary', label: 'Sedentary' },
 { value: 'lightly_active', label: 'Lightly Active' },
 { value: 'moderately_active', label: 'Moderately Active' },
 { value: 'very_active', label: 'Very Active' },
 { value: 'extra_active', label: 'Extra Active' },
]

const WEIGHT_GOALS = [
 { value: 'lose', label: 'Lose Weight' },
 { value: 'maintain', label: 'Maintain Weight' },
 { value: 'gain', label: 'Gain Weight' },
]

const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Keto', 'Low Carb', 'Mediterranean', 'Halal', 'None']
const ALLERGEN_OPTIONS = ['Nuts', 'Dairy', 'Gluten', 'Shellfish', 'Soy', 'Eggs', 'None']

function getBmiCategory(bmi: number): { label: string; color: string } {
 if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-600' }
 if (bmi < 25) return { label: 'Normal', color: 'text-green-600' }
 if (bmi < 30) return { label: 'Overweight', color: 'text-yellow-600' }
 return { label: 'Obese', color: 'text-red-600' }
}

export default function ProfileGoalsTab() {
 const [loading, setLoading] = useState(true)
 const [saving, setSaving] = useState(false)
 const [error, setError] = useState('')
 const [success, setSuccess] = useState('')

 const [age, setAge] = useState(25)
 const [gender, setGender] = useState('male')
 const [heightCm, setHeightCm] = useState(170)
 const [weightKg, setWeightKg] = useState(70)
 const [activityLevel, setActivityLevel] = useState('moderately_active')
 const [weightGoal, setWeightGoal] = useState('maintain')
 const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([])
 const [allergens, setAllergens] = useState<string[]>([])
 const [targetCalories, setTargetCalories] = useState(2000)
 const [targetWater, setTargetWater] = useState(2000)
 const [targetExerciseMinutes, setTargetExerciseMinutes] = useState(30)
 const [waterReminders, setWaterReminders] = useState(false)

 const tdeeResult = useMemo(() => {
 if (heightCm > 0 && weightKg > 0 && age > 0) {
 return calculateTdee({ heightCm, weightKg, age, gender, activityLevel })
 }
 return null
 }, [heightCm, weightKg, age, gender, activityLevel])

 const suggestedCalories = useMemo(() => {
 if (tdeeResult) {
 return calculateTargetCalories(tdeeResult.tdee, weightGoal)
 }
 return 2000
 }, [tdeeResult, weightGoal])

 const bmiCategory = useMemo(() => {
 if (tdeeResult) return getBmiCategory(tdeeResult.bmi)
 return null
 }, [tdeeResult])

 const fetchProfile = useCallback(async () => {
 try {
 setLoading(true)
 setError('')
 const res = await fetch('/api/ai/health-tracker/profile', { credentials: 'include' })
 if (!res.ok) throw new Error('Failed to load profile')
 const json = await res.json()
 if (!json.success) throw new Error(json.message || 'Failed to load profile')
 const data: ProfileData = json.data
 setAge(data.age || 25)
 setGender(data.gender || 'male')
 setHeightCm(data.heightCm || 170)
 setWeightKg(data.weightKg || 70)
 setActivityLevel(data.activityLevel || 'moderately_active')
 setWeightGoal(data.weightGoal || 'maintain')
 setDietaryPreferences(data.dietaryPreferences || [])
 setAllergens(data.allergenSettings || [])
 setTargetCalories(data.targetCalories || 2000)
 setTargetWater(data.targetWaterMl || 2000)
 setTargetExerciseMinutes(data.targetExerciseMin || 30)
 setWaterReminders(data.waterReminders || false)
 } catch (err) {
 setError(err instanceof Error ? err.message : 'Something went wrong')
 } finally {
 setLoading(false)
 }
 }, [])

 useEffect(() => {
 fetchProfile()
 }, [fetchProfile])

 const handleSave = async () => {
 try {
 setSaving(true)
 setError('')
 setSuccess('')
 const res = await fetch('/api/ai/health-tracker/profile', {
 method: 'PUT',
 credentials: 'include',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 age,
 gender,
 heightCm,
 weightKg,
 activityLevel,
 weightGoal,
 dietaryPreferences,
 allergenSettings: allergens,
 targetCalories,
 targetWaterMl: targetWater,
 targetExerciseMin: targetExerciseMinutes,
 waterReminders,
 }),
 })
 if (!res.ok) throw new Error('Failed to save profile')
 setSuccess('Profile saved successfully!')
 setTimeout(() => setSuccess(''), 3000)
 } catch (err) {
 setError(err instanceof Error ? err.message : 'Failed to save')
 } finally {
 setSaving(false)
 }
 }

 const togglePill = (
 value: string,
 list: string[],
 setList: (v: string[]) => void,
 ) => {
 if (value === 'None') {
 setList(list.includes('None') ? [] : ['None'])
 return
 }
 const filtered = list.filter((v) => v !== 'None')
 if (filtered.includes(value)) {
 setList(filtered.filter((v) => v !== value))
 } else {
 setList([...filtered, value])
 }
 }

 if (loading) {
 return (
 <div className="p-4 space-y-4">
 {[1, 2, 3, 4, 5].map((i) => (
 <div key={i} className="h-16 bg-line rounded-lg animate-pulse" />
 ))}
 </div>
 )
 }

 return (
 <div className="p-4 space-y-6 pb-8">
 <h2 className="text-lg font-bold text-fg">Health Profile &amp; Goals</h2>

 {/* Success / Error Messages */}
 {success && (
 <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
 {success}
 </div>
 )}
 {error && (
 <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
 {error}
 </div>
 )}

 {/* Basic Info */}
 <div className="bg-surface rounded-lg shadow-sm p-4 space-y-4">
 <h3 className="text-sm font-semibold text-soft">Basic Information</h3>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Age</label>
 <input
 type="number"
 value={age}
 onChange={(e) => setAge(Number(e.target.value))}
 min={1}
 max={120}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Gender</label>
 <select
 value={gender}
 onChange={(e) => setGender(e.target.value)}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
 >
 <option value="male">Male</option>
 <option value="female">Female</option>
 <option value="other">Other</option>
 </select>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-soft mb-1">
 <FaRulerVertical className="inline w-3 h-3 mr-1" />
 Height (cm)
 </label>
 <input
 type="number"
 value={heightCm}
 onChange={(e) => setHeightCm(Number(e.target.value))}
 min={50}
 max={300}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-soft mb-1">
 <FaWeight className="inline w-3 h-3 mr-1" />
 Weight (kg)
 </label>
 <input
 type="number"
 value={weightKg}
 onChange={(e) => setWeightKg(Number(e.target.value))}
 min={20}
 max={500}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
 />
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-soft mb-1">Activity Level</label>
 <select
 value={activityLevel}
 onChange={(e) => setActivityLevel(e.target.value)}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
 >
 {ACTIVITY_LEVELS.map((l) => (
 <option key={l.value} value={l.value}>{l.label}</option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-sm font-medium text-soft mb-1">Weight Goal</label>
 <select
 value={weightGoal}
 onChange={(e) => setWeightGoal(e.target.value)}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
 >
 {WEIGHT_GOALS.map((g) => (
 <option key={g.value} value={g.value}>{g.label}</option>
 ))}
 </select>
 </div>
 </div>

 {/* BMI & TDEE Display */}
 {tdeeResult && (
 <div className="grid grid-cols-2 gap-3">
 <div className="bg-surface rounded-lg shadow-sm p-4 text-center">
 <p className="text-xs text-soft mb-1">BMI</p>
 <p className="text-2xl font-bold text-fg">{tdeeResult.bmi}</p>
 {bmiCategory && (
 <p className={`text-xs font-medium ${bmiCategory.color}`}>{bmiCategory.label}</p>
 )}
 </div>
 <div className="bg-surface rounded-lg shadow-sm p-4 text-center">
 <p className="text-xs text-soft mb-1">TDEE</p>
 <p className="text-2xl font-bold text-fg">{tdeeResult.tdee}</p>
 <p className="text-xs text-faint">cal/day maintenance</p>
 </div>
 </div>
 )}

 {/* Dietary Preferences */}
 <div className="bg-surface rounded-lg shadow-sm p-4">
 <h3 className="text-sm font-semibold text-soft mb-3">Dietary Preferences</h3>
 <div className="flex flex-wrap gap-2">
 {DIETARY_OPTIONS.map((option) => {
 const isSelected = dietaryPreferences.includes(option)
 return (
 <button
 key={option}
 onClick={() => togglePill(option, dietaryPreferences, setDietaryPreferences)}
 className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
 isSelected
 ? 'bg-blue-600 text-white'
 : 'bg-subtle text-soft hover:bg-line'
 }`}
 >
 {option}
 </button>
 )
 })}
 </div>
 </div>

 {/* Allergen Settings */}
 <div className="bg-surface rounded-lg shadow-sm p-4">
 <h3 className="text-sm font-semibold text-soft mb-3">Allergen Settings</h3>
 <div className="flex flex-wrap gap-2">
 {ALLERGEN_OPTIONS.map((option) => {
 const isSelected = allergens.includes(option)
 return (
 <button
 key={option}
 onClick={() => togglePill(option, allergens, setAllergens)}
 className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
 isSelected
 ? 'bg-red-600 text-white'
 : 'bg-subtle text-soft hover:bg-line'
 }`}
 >
 {option}
 </button>
 )
 })}
 </div>
 </div>

 {/* Targets */}
 <div className="bg-surface rounded-lg shadow-sm p-4 space-y-4">
 <h3 className="text-sm font-semibold text-soft">Daily Targets</h3>

 <div>
 <div className="flex items-center justify-between mb-1">
 <label className="text-sm font-medium text-soft">Target Calories</label>
 {suggestedCalories !== targetCalories && (
 <button
 onClick={() => setTargetCalories(suggestedCalories)}
 className="text-xs text-blue-600 hover:underline"
 >
 Use suggested ({suggestedCalories})
 </button>
 )}
 </div>
 <input
 type="number"
 value={targetCalories}
 onChange={(e) => setTargetCalories(Number(e.target.value))}
 min={800}
 max={10000}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-soft mb-1">Target Water (ml)</label>
 <input
 type="number"
 value={targetWater}
 onChange={(e) => setTargetWater(Number(e.target.value))}
 min={500}
 max={10000}
 step={250}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-soft mb-1">Target Exercise (minutes)</label>
 <input
 type="number"
 value={targetExerciseMinutes}
 onChange={(e) => setTargetExerciseMinutes(Number(e.target.value))}
 min={0}
 max={480}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
 />
 </div>
 </div>

 {/* Notifications */}
 <div className="bg-surface rounded-lg shadow-sm p-4">
 <h3 className="text-sm font-semibold text-soft mb-3">Notifications</h3>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <FaBell className="w-4 h-4 text-blue-500" />
 <span className="text-sm text-soft">Water Reminders</span>
 </div>
 <button
 onClick={() => setWaterReminders(!waterReminders)}
 className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
 waterReminders ? 'bg-blue-600' : 'bg-line'
 }`}
 role="switch"
 aria-checked={waterReminders}
 >
 <span
 className={`inline-block h-4 w-4 transform rounded-full bg-surface transition-transform ${
 waterReminders ? 'translate-x-6' : 'translate-x-1'
 }`}
 />
 </button>
 </div>
 </div>

 {/* Save Button */}
 <button
 onClick={handleSave}
 disabled={saving}
 className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
 >
 <FaSave className="w-4 h-4" />
 {saving ? 'Saving...' : 'Save Profile'}
 </button>
 </div>
 )
}
