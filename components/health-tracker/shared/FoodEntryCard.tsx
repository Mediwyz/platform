'use client'

import { FaTrash } from 'react-icons/fa'

export interface FoodEntryCardProps {
 id: string
 name: string
 calories: number
 protein: number
 carbs: number
 fat: number
 time: string
 onDelete: (id: string) => void
}

export default function FoodEntryCard({
 id,
 name,
 calories,
 protein,
 carbs,
 fat,
 time,
 onDelete,
}: FoodEntryCardProps) {
 return (
 <div className="bg-surface rounded-lg shadow-sm p-3 border-l-4 border-blue-400 flex items-center justify-between gap-3 hover:shadow-md transition-shadow duration-200">
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between">
 <h4 className="text-sm font-bold text-fg truncate">{name}</h4>
 <span className="text-sm font-semibold text-soft whitespace-nowrap ml-2">
 {calories} cal
 </span>
 </div>
 <div className="flex items-center gap-3 mt-1">
 <span className="text-xs text-soft">
 P: {protein}g
 </span>
 <span className="text-xs text-soft">
 C: {carbs}g
 </span>
 <span className="text-xs text-soft">
 F: {fat}g
 </span>
 </div>
 <span className="text-xs text-faint mt-0.5 block">{time}</span>
 </div>
 <button
 onClick={() => onDelete(id)}
 className="p-2 text-faint hover:text-red-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-300 rounded"
 aria-label={`Delete ${name}`}
 >
 <FaTrash className="text-sm" />
 </button>
 </div>
 )
}
