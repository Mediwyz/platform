'use client'

import { useState, useMemo } from 'react'
import { FaTimes, FaDumbbell } from 'react-icons/fa'
import {
 FaPersonWalking,
 FaPersonRunning,
 FaPersonSwimming,
 FaPersonBiking,
} from 'react-icons/fa6'
import { GiMeditation, GiWeightLiftingUp, GiHighKick } from 'react-icons/gi'
import { IoMusicalNotes } from 'react-icons/io5'
import { MdSportsTennis, MdMoreHoriz } from 'react-icons/md'
import { IconType } from 'react-icons'

export interface AddExercisePayload {
 exerciseType: string
 durationMin: number
 caloriesBurned: number
 intensity: string
 notes?: string
}

export interface AddExerciseModalProps {
 isOpen: boolean
 onClose: () => void
 onAdd: (exercise: AddExercisePayload) => void
}

interface ExerciseOption {
 name: string
 icon: IconType
 metLight: number
 metModerate: number
 metVigorous: number
}

const EXERCISES: ExerciseOption[] = [
 { name: 'Walking', icon: FaPersonWalking, metLight: 2.5, metModerate: 3.5, metVigorous: 5.0 },
 { name: 'Running', icon: FaPersonRunning, metLight: 6.0, metModerate: 8.0, metVigorous: 11.0 },
 { name: 'Cycling', icon: FaPersonBiking, metLight: 4.0, metModerate: 6.8, metVigorous: 10.0 },
 { name: 'Swimming', icon: FaPersonSwimming, metLight: 4.5, metModerate: 7.0, metVigorous: 10.0 },
 { name: 'Yoga', icon: GiMeditation, metLight: 2.0, metModerate: 3.0, metVigorous: 4.0 },
 { name: 'Weight Training', icon: GiWeightLiftingUp, metLight: 3.0, metModerate: 5.0, metVigorous: 6.0 },
 { name: 'HIIT', icon: GiHighKick, metLight: 6.0, metModerate: 8.0, metVigorous: 12.0 },
 { name: 'Dancing', icon: IoMusicalNotes, metLight: 3.0, metModerate: 5.0, metVigorous: 7.5 },
 { name: 'Sports', icon: MdSportsTennis, metLight: 4.0, metModerate: 6.0, metVigorous: 8.0 },
 { name: 'Other', icon: MdMoreHoriz, metLight: 3.0, metModerate: 5.0, metVigorous: 7.0 },
]

const INTENSITIES = ['light', 'moderate', 'vigorous'] as const

const ASSUMED_WEIGHT_KG = 70

export default function AddExerciseModal({
 isOpen,
 onClose,
 onAdd,
}: AddExerciseModalProps) {
 const [selectedExercise, setSelectedExercise] = useState<ExerciseOption | null>(null)
 const [duration, setDuration] = useState('')
 const [intensity, setIntensity] = useState<string>('moderate')
 const [notes, setNotes] = useState('')

 const estimatedCalories = useMemo(() => {
 if (!selectedExercise || !duration) return 0
 const durationHours = Number(duration) / 60
 const metKey = `met${intensity.charAt(0).toUpperCase() + intensity.slice(1)}` as keyof ExerciseOption
 const met = (selectedExercise[metKey] as number) || 5.0
 return Math.round(met * ASSUMED_WEIGHT_KG * durationHours)
 }, [selectedExercise, duration, intensity])

 if (!isOpen) return null

 const handleSubmit = () => {
 if (!selectedExercise || !duration) return
 onAdd({
 exerciseType: selectedExercise.name,
 durationMin: Number(duration),
 caloriesBurned: estimatedCalories,
 intensity,
 notes: notes.trim() || undefined,
 })
 setSelectedExercise(null)
 setDuration('')
 setIntensity('moderate')
 setNotes('')
 onClose()
 }

 const intensityColors: Record<string, string> = {
 light: 'bg-green-100 text-green-700 border-green-300',
 moderate: 'bg-yellow-100 text-yellow-700 border-yellow-300',
 vigorous: 'bg-red-100 text-red-700 border-red-300',
 }

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 {/* Overlay */}
 <div className="absolute inset-0 bg-black/50" onClick={onClose} />

 {/* Modal */}
 <div className="relative bg-surface rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
 {/* Header */}
 <div className="flex items-center justify-between p-4 border-b border-line">
 <h2 className="text-lg font-bold text-fg flex items-center gap-2">
 <FaDumbbell className="text-purple-500" />
 Log Exercise
 </h2>
 <button
 onClick={onClose}
 className="p-2 text-faint hover:text-soft transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 rounded"
 aria-label="Close modal"
 >
 <FaTimes />
 </button>
 </div>

 <div className="p-4 space-y-4">
 {/* Exercise type grid */}
 <div>
 <label className="text-sm font-semibold text-soft mb-2 block">Exercise Type</label>
 <div className="grid grid-cols-5 gap-2">
 {EXERCISES.map((ex) => {
 const Icon = ex.icon
 const isSelected = selectedExercise?.name === ex.name
 return (
 <button
 key={ex.name}
 onClick={() => setSelectedExercise(ex)}
 className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-300 ${
 isSelected
 ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-400'
 : 'bg-subtle text-soft hover:bg-subtle'
 }`}
 >
 <Icon className="text-lg" />
 <span className="truncate w-full text-center">{ex.name}</span>
 </button>
 )
 })}
 </div>
 </div>

 {/* Duration */}
 <div>
 <label className="text-sm font-semibold text-soft mb-1 block">
 Duration (minutes)
 </label>
 <input
 type="number"
 placeholder="e.g., 30"
 value={duration}
 onChange={(e) => setDuration(e.target.value)}
 min={1}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
 />
 </div>

 {/* Intensity */}
 <div>
 <label className="text-sm font-semibold text-soft mb-2 block">Intensity</label>
 <div className="flex gap-2">
 {INTENSITIES.map((level) => (
 <button
 key={level}
 onClick={() => setIntensity(level)}
 className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-blue-300 capitalize ${
 intensity === level
 ? intensityColors[level]
 : 'bg-surface text-soft border-line hover:bg-subtle'
 }`}
 >
 {level}
 </button>
 ))}
 </div>
 </div>

 {/* Estimated calories */}
 {estimatedCalories > 0 && (
 <div className="bg-orange-50 rounded-lg p-3 text-center">
 <span className="text-sm text-soft">Estimated burn: </span>
 <span className="text-lg font-bold text-orange-600">{estimatedCalories} cal</span>
 </div>
 )}

 {/* Notes */}
 <div>
 <label className="text-sm font-semibold text-soft mb-1 block">
 Notes (optional)
 </label>
 <textarea
 placeholder="Any additional notes..."
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 rows={2}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
 />
 </div>

 {/* Submit */}
 <button
 onClick={handleSubmit}
 disabled={!selectedExercise || !duration}
 className="w-full py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-purple-300"
 >
 Log Exercise
 </button>
 </div>
 </div>
 </div>
 )
}
