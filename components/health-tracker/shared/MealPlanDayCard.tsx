'use client'

export interface MealPlanDayCardProps {
 id: string
 mealType: string
 name: string
 description?: string
 calories: number
 protein: number
 carbs: number
 fat: number
 onAddToDiary?: (id: string) => void
 onDelete?: (id: string) => void
}

const mealTypeColors: Record<string, string> = {
 BREAKFAST: 'bg-red-100 text-red-700',
 LUNCH: 'bg-green-100 text-green-700',
 SNACK: 'bg-orange-100 text-orange-700',
 DINNER: 'bg-blue-100 text-blue-700',
}

export default function MealPlanDayCard({
 id,
 mealType,
 name,
 description,
 calories,
 protein,
 carbs,
 fat,
 onAddToDiary,
 onDelete,
}: MealPlanDayCardProps) {
 const badgeColor = mealTypeColors[mealType.toUpperCase()] || 'bg-subtle text-soft'

 return (
 <div className="bg-surface rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-200">
 <div className="flex items-start gap-3">
 {/* Decorative circle */}
 <div className="mt-1 w-5 h-5 rounded-full border-2 border-line flex-shrink-0" />

 <div className="flex-1 min-w-0">
 {/* Header row */}
 <div className="flex items-center justify-between flex-wrap gap-2">
 <div className="flex items-center gap-2">
 <span className={`text-xs px-2 py-0.5 rounded-full font-medium uppercase ${badgeColor}`}>
 {mealType}
 </span>
 <h4 className="text-sm font-bold text-fg">{name}</h4>
 </div>
 <span className="text-sm font-semibold text-soft">{calories} cal</span>
 </div>

 {/* Description */}
 {description && (
 <p className="text-xs text-soft mt-1">{description}</p>
 )}

 {/* Macros */}
 <div className="flex items-center gap-3 mt-2">
 <span className="text-xs text-soft">P: {protein}g</span>
 <span className="text-xs text-soft">C: {carbs}g</span>
 <span className="text-xs text-soft">F: {fat}g</span>
 </div>

 {/* Buttons */}
 <div className="flex items-center gap-2 mt-3">
 {onDelete && (
 <button
 onClick={() => onDelete(id)}
 className="px-3 py-1.5 text-xs font-medium text-soft border border-line rounded-lg hover:bg-subtle transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
 >
 View Recipe
 </button>
 )}
 {onAddToDiary && (
 <button
 onClick={() => onAddToDiary(id)}
 className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-300"
 >
 Add to Diary
 </button>
 )}
 </div>
 </div>
 </div>
 </div>
 )
}
