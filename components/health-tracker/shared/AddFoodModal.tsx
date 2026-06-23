'use client'

import { useState } from 'react'
import { FaTimes, FaCamera, FaSearch, FaUtensils } from 'react-icons/fa'
import FoodSearchPanel, { FoodSearchResult } from './FoodSearchPanel'
import FoodScanPanel from './FoodScanPanel'

export interface AddFoodPayload {
 name: string
 calories: number
 protein: number
 carbs: number
 fat: number
 fiber: number
 quantity: number
 unit: string
 servingSize: string
 foodDbId?: string
}

export interface AddFoodModalProps {
 isOpen: boolean
 onClose: () => void
 onAdd: (food: AddFoodPayload) => void
 mealType: string
}

export default function AddFoodModal({
 isOpen,
 onClose,
 onAdd,
 mealType,
}: AddFoodModalProps) {
 const [tab, setTab] = useState<'search' | 'ai'>('search')
 const [manualName, setManualName] = useState('')
 const [manualCalories, setManualCalories] = useState('')
 const [manualProtein, setManualProtein] = useState('')
 const [manualCarbs, setManualCarbs] = useState('')
 const [manualFat, setManualFat] = useState('')

 if (!isOpen) return null

 const handleSelectFood = (food: FoodSearchResult) => {
 onAdd({
 name: food.name,
 calories: food.calories,
 protein: food.protein,
 carbs: food.carbs,
 fat: food.fat,
 fiber: food.fiber ?? 0,
 quantity: 1,
 unit: food.unit || 'serving',
 servingSize: food.servingSize || '1 serving',
 foodDbId: food.id,
 })
 onClose()
 }

 const handleManualAdd = () => {
 if (!manualName.trim() || !manualCalories) return
 onAdd({
 name: manualName.trim(),
 calories: Number(manualCalories) || 0,
 protein: Number(manualProtein) || 0,
 carbs: Number(manualCarbs) || 0,
 fat: Number(manualFat) || 0,
 fiber: 0,
 quantity: 1,
 unit: 'serving',
 servingSize: '1 serving',
 })
 setManualName('')
 setManualCalories('')
 setManualProtein('')
 setManualCarbs('')
 setManualFat('')
 onClose()
 }

 const mealLabel = mealType.charAt(0).toUpperCase() + mealType.slice(1).toLowerCase()

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 {/* Overlay */}
 <div
 className="absolute inset-0 bg-black/50"
 onClick={onClose}
 />

 {/* Modal */}
 <div className="relative bg-surface rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
 {/* Header */}
 <div className="flex items-center justify-between p-4 border-b border-line">
 <h2 className="text-lg font-bold text-fg flex items-center gap-2">
 <FaUtensils className="text-blue-500" />
 Add {mealLabel}
 </h2>
 <button
 onClick={onClose}
 className="p-2 text-faint hover:text-soft transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 rounded"
 aria-label="Close modal"
 >
 <FaTimes />
 </button>
 </div>

 {/* Tabs */}
 <div className="flex border-b border-line">
 <button
 onClick={() => setTab('search')}
 className={`flex-1 py-2.5 text-sm font-medium transition-colors focus:outline-none ${
 tab === 'search'
 ? 'text-blue-600 border-b-2 border-blue-600'
 : 'text-soft hover:text-soft'
 }`}
 >
 <FaSearch className="inline mr-1.5" />
 Search
 </button>
 <button
 onClick={() => setTab('ai')}
 className={`flex-1 py-2.5 text-sm font-medium transition-colors focus:outline-none ${
 tab === 'ai'
 ? 'text-blue-600 border-b-2 border-blue-600'
 : 'text-soft hover:text-soft'
 }`}
 >
 <FaCamera className="inline mr-1.5" />
 AI Scan
 </button>
 </div>

 {/* Tab content */}
 <div className="p-4">
 {tab === 'search' && (
 <FoodSearchPanel onSelect={handleSelectFood} />
 )}

 {tab === 'ai' && (
 <FoodScanPanel
 onResult={(food) => {
 onAdd({
 name: food.name,
 calories: food.calories,
 protein: food.protein,
 carbs: food.carbs,
 fat: food.fat,
 fiber: 0,
 quantity: 1,
 unit: 'serving',
 servingSize: '1 serving',
 })
 onClose()
 }}
 />
 )}
 </div>

 {/* Manual entry */}
 <div className="border-t border-line p-4">
 <h3 className="text-sm font-semibold text-soft mb-3">Manual Entry</h3>
 <div className="space-y-2">
 <input
 type="text"
 placeholder="Food name"
 value={manualName}
 onChange={(e) => setManualName(e.target.value)}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
 />
 <div className="grid grid-cols-4 gap-2">
 <input
 type="number"
 placeholder="Calories"
 value={manualCalories}
 onChange={(e) => setManualCalories(e.target.value)}
 className="px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
 />
 <input
 type="number"
 placeholder="Protein"
 value={manualProtein}
 onChange={(e) => setManualProtein(e.target.value)}
 className="px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
 />
 <input
 type="number"
 placeholder="Carbs"
 value={manualCarbs}
 onChange={(e) => setManualCarbs(e.target.value)}
 className="px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
 />
 <input
 type="number"
 placeholder="Fat"
 value={manualFat}
 onChange={(e) => setManualFat(e.target.value)}
 className="px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
 />
 </div>
 <button
 onClick={handleManualAdd}
 disabled={!manualName.trim() || !manualCalories}
 className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
 >
 Add
 </button>
 </div>
 </div>
 </div>
 </div>
 )
}
