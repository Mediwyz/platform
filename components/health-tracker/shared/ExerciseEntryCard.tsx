'use client'

import { FaTrash } from 'react-icons/fa'

export interface ExerciseEntryCardProps {
 id: string
 exerciseType: string
 durationMin: number
 caloriesBurned: number
 intensity: string
 notes?: string
 onDelete: (id: string) => void
}

const intensityColors: Record<string, string> = {
 light: 'bg-green-100 text-green-700',
 moderate: 'bg-yellow-100 text-yellow-700',
 vigorous: 'bg-red-100 text-red-700',
}

export default function ExerciseEntryCard({
 id,
 exerciseType,
 durationMin,
 caloriesBurned,
 intensity,
 notes,
 onDelete,
}: ExerciseEntryCardProps) {
 const badgeClass = intensityColors[intensity.toLowerCase()] || 'bg-subtle text-soft'

 return (
 <div className="bg-surface rounded-lg shadow-sm p-3 border-l-4 border-purple-400 flex items-center justify-between gap-3 hover:shadow-md transition-shadow duration-200">
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 flex-wrap">
 <h4 className="text-sm font-bold text-fg">{exerciseType}</h4>
 <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${badgeClass}`}>
 {intensity}
 </span>
 </div>
 <div className="flex items-center gap-3 mt-1">
 <span className="text-xs text-soft">{durationMin} min</span>
 <span className="text-xs text-orange-500 font-medium">{caloriesBurned} cal burned</span>
 </div>
 {notes && (
 <p className="text-xs text-faint mt-1 truncate">{notes}</p>
 )}
 </div>
 <button
 onClick={() => onDelete(id)}
 className="p-2 text-faint hover:text-red-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-300 rounded"
 aria-label={`Delete ${exerciseType}`}
 >
 <FaTrash className="text-sm" />
 </button>
 </div>
 )
}
