'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { FaSearch } from 'react-icons/fa'

export interface FoodSearchResult {
 id: string
 name: string
 category: string
 calories: number
 protein: number
 carbs: number
 fat: number
 fiber: number
 servingSize: string
 unit: string
}

export interface FoodSearchPanelProps {
 onSelect: (food: FoodSearchResult) => void
}

const CATEGORIES = [
 'All',
 'Fruits',
 'Vegetables',
 'Grains',
 'Protein',
 'Dairy',
 'Mauritian',
 'Beverages',
 'Snacks',
]

export default function FoodSearchPanel({ onSelect }: FoodSearchPanelProps) {
 const [query, setQuery] = useState('')
 const [category, setCategory] = useState('All')
 const [results, setResults] = useState<FoodSearchResult[]>([])
 const [loading, setLoading] = useState(false)
 const [searched, setSearched] = useState(false)
 const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

 const fetchResults = useCallback(async (q: string, cat: string) => {
 if (!q.trim() && cat === 'All') {
 setResults([])
 setSearched(false)
 return
 }
 setLoading(true)
 setSearched(true)
 try {
 const params = new URLSearchParams()
 if (q.trim()) params.set('q', q.trim())
 if (cat !== 'All') params.set('category', cat)
 const res = await fetch(`/api/ai/health-tracker/food-db?${params.toString()}`, { credentials: 'include' })
 if (res.ok) {
 const json = await res.json()
 setResults(Array.isArray(json.data) ? json.data : [])
 } else {
 setResults([])
 }
 } catch {
 setResults([])
 } finally {
 setLoading(false)
 }
 }, [])

 useEffect(() => {
 if (debounceRef.current) clearTimeout(debounceRef.current)
 debounceRef.current = setTimeout(() => {
 fetchResults(query, category)
 }, 300)
 return () => {
 if (debounceRef.current) clearTimeout(debounceRef.current)
 }
 }, [query, category, fetchResults])

 const categoryBadgeColor = (cat: string) => {
 const colors: Record<string, string> = {
 Fruits: 'bg-pink-100 text-pink-700',
 Vegetables: 'bg-green-100 text-green-700',
 Grains: 'bg-amber-100 text-amber-700',
 Protein: 'bg-red-100 text-red-700',
 Dairy: 'bg-blue-100 text-blue-700',
 Mauritian: 'bg-purple-100 text-purple-700',
 Beverages: 'bg-cyan-100 text-cyan-700',
 Snacks: 'bg-orange-100 text-orange-700',
 }
 return colors[cat] || 'bg-subtle text-soft'
 }

 return (
 <div className="space-y-3">
 {/* Search input */}
 <div className="relative">
 <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-faint text-sm" />
 <input
 type="text"
 placeholder="Search foods..."
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 className="w-full pl-9 pr-4 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-colors"
 />
 </div>

 {/* Category filter pills */}
 <div className="flex flex-wrap gap-1.5">
 {CATEGORIES.map((cat) => (
 <button
 key={cat}
 onClick={() => setCategory(cat)}
 className={`px-3 py-1 text-xs rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 ${
 category === cat
 ? 'bg-blue-600 text-white'
 : 'bg-subtle text-soft hover:bg-line'
 }`}
 >
 {cat}
 </button>
 ))}
 </div>

 {/* Results */}
 <div className="max-h-64 overflow-y-auto space-y-2">
 {loading && (
 <div className="text-center py-4 text-sm text-faint">Searching...</div>
 )}
 {!loading && searched && results.length === 0 && (
 <div className="text-center py-4 text-sm text-faint">No results found</div>
 )}
 {!loading &&
 results.map((food, idx) => (
 <button
 key={`${food.id ?? 'f'}-${idx}`}
 onClick={() => onSelect(food)}
 className="w-full text-left p-3 bg-subtle rounded-lg hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
 >
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <span className="text-sm font-medium text-fg">{food.name}</span>
 <span className={`text-xs px-1.5 py-0.5 rounded-full ${categoryBadgeColor(food.category)}`}>
 {food.category}
 </span>
 </div>
 <span className="text-sm font-semibold text-soft">{food.calories} cal</span>
 </div>
 <div className="flex gap-3 mt-1 text-xs text-soft">
 <span>P: {food.protein}g</span>
 <span>C: {food.carbs}g</span>
 <span>F: {food.fat}g</span>
 </div>
 </button>
 ))}
 </div>
 </div>
 )
}
