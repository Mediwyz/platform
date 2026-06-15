'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
 FaSearch,
 FaUserMd,
 FaUserNurse,
 FaBaby,
 FaPills,
 FaAmbulance,
 FaFlask,
 FaClinicMedical,
 FaTimes,
} from 'react-icons/fa'
import * as FaIcons from 'react-icons/fa'
import Image from 'next/image'
import type { IconType } from 'react-icons'

type SearchCategory = string

interface CategoryTab {
 id: SearchCategory
 label: string
 icon: IconType
}

interface AutocompleteResult {
 id: string
 label: string
 sublabel: string
 category: SearchCategory
 href: string
 image?: string | null
}

interface RoleFromApi {
 code: string
 label: string
 slug: string
 icon: string
}

// Static tabs that aren't provider roles - kept around the dynamic role list.
const STATIC_LEAD_TAB: CategoryTab = { id: 'all', label: 'All', icon: FaSearch }
const STATIC_TAIL_TAB: CategoryTab = { id: 'medicines', label: 'Medicines', icon: FaPills }

function resolveRoleIcon(name: string | null | undefined): IconType {
 if (!name) return FaUserMd
 return (FaIcons as Record<string, IconType>)[name] || FaUserMd
}

const CATEGORY_ICONS: Record<string, IconType> = {
 doctors: FaUserMd,
 nurses: FaUserNurse,
 nannies: FaBaby,
 medicines: FaPills,
 pharmacy: FaClinicMedical,
 emergency: FaAmbulance,
 lab: FaFlask,
}

const CATEGORY_COLORS: Record<string, string> = {
 doctors: 'text-blue-600 bg-blue-50',
 nurses: 'text-teal-600 bg-teal-50',
 nannies: 'text-pink-600 bg-pink-50',
 medicines: 'text-green-600 bg-green-50',
 pharmacy: 'text-purple-600 bg-purple-50',
 emergency: 'text-red-600 bg-red-50',
 lab: 'text-amber-600 bg-amber-50',
}

interface SearchAutocompleteProps {
 variant?: 'hero' | 'navbar'
 placeholder?: string
}

export default function SearchAutocomplete({ variant = 'hero', placeholder }: SearchAutocompleteProps) {
 const [query, setQuery] = useState('')
 const [category, setCategory] = useState<SearchCategory>('all')
 const [results, setResults] = useState<AutocompleteResult[]>([])
 const [isOpen, setIsOpen] = useState(false)
 const [loading, setLoading] = useState(false)
 const [highlightIndex, setHighlightIndex] = useState(-1)
 const [categories, setCategories] = useState<CategoryTab[]>([STATIC_LEAD_TAB, STATIC_TAIL_TAB])
 const containerRef = useRef<HTMLDivElement>(null)
 const inputRef = useRef<HTMLInputElement>(null)
 const router = useRouter()

 // Load provider roles from the DB so the filter chips always reflect the
 // current ProviderRole table - Regional Admins can add roles and they show
 // up here automatically with no code change.
 useEffect(() => {
  let cancelled = false
  fetch('/api/roles?searchEnabled=true')
   .then(r => r.json())
   .then(json => {
    if (cancelled || !json?.success || !Array.isArray(json.data)) return
    const roleTabs: CategoryTab[] = (json.data as RoleFromApi[]).map(role => ({
     id: role.slug,
     label: role.label,
     icon: resolveRoleIcon(role.icon),
    }))
    setCategories([STATIC_LEAD_TAB, ...roleTabs, STATIC_TAIL_TAB])
   })
   .catch(() => { /* fall back to static lead+tail tabs */ })
  return () => { cancelled = true }
 }, [])

 // Debounced search
 const fetchResults = useCallback(async (q: string, cat: SearchCategory) => {
 if (q.length < 2) {
 setResults([])
 return
 }

 setLoading(true)
 try {
 const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(q)}&category=${cat}&limit=8`)
 if (res.ok) {
 const data = await res.json()
 if (data.success) {
 setResults(data.data)
 }
 }
 } catch {
 // Silently fail - user will see empty results
 } finally {
 setLoading(false)
 }
 }, [])

 useEffect(() => {
 const timer = setTimeout(() => {
 fetchResults(query, category)
 }, 300)
 return () => clearTimeout(timer)
 }, [query, category, fetchResults])

 // Close dropdown on outside click
 useEffect(() => {
 const handleClickOutside = (e: MouseEvent) => {
 if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
 setIsOpen(false)
 }
 }
 document.addEventListener('mousedown', handleClickOutside)
 return () => document.removeEventListener('mousedown', handleClickOutside)
 }, [])

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault()
 if (highlightIndex >= 0 && results[highlightIndex]) {
 router.push(results[highlightIndex].href)
 setIsOpen(false)
 return
 }
 if (query.trim()) {
 const catParam = category !== 'all' ? `&category=${category}` : ''
 router.push(`/search/results?q=${encodeURIComponent(query.trim())}${catParam}`)
 setIsOpen(false)
 }
 }

 const handleKeyDown = (e: React.KeyboardEvent) => {
 if (e.key === 'ArrowDown') {
 e.preventDefault()
 setHighlightIndex(prev => Math.min(prev + 1, results.length - 1))
 } else if (e.key === 'ArrowUp') {
 e.preventDefault()
 setHighlightIndex(prev => Math.max(prev - 1, -1))
 } else if (e.key === 'Escape') {
 setIsOpen(false)
 }
 }

 const handleResultClick = (result: AutocompleteResult) => {
 router.push(result.href)
 setIsOpen(false)
 setQuery('')
 }

 const isHero = variant === 'hero'

 return (
 <div ref={containerRef} className={`relative ${isHero ? 'w-full max-w-2xl mx-auto lg:mx-0' : 'w-full'}`}>
 {/* Category Tabs (hero variant only) - populated from /api/roles?searchEnabled=true */}
 {isHero && (
 <div className="flex flex-wrap gap-1.5 mb-3 justify-center lg:justify-start">
 {categories.map((cat) => {
 const Icon = cat.icon
 return (
 <button
 key={cat.id}
 type="button"
 onClick={() => {
 setCategory(cat.id)
 setHighlightIndex(-1)
 inputRef.current?.focus()
 }}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
 category === cat.id
 ? 'bg-white text-blue-700 shadow-md'
 : 'bg-white/15 text-white/90 hover:bg-white/25'
 }`}
 >
 <Icon className="text-[10px]" />
 {cat.label}
 </button>
 )
 })}
 </div>
 )}

 {/* Search Input */}
 <form onSubmit={handleSubmit} className={`relative flex items-center ${
 isHero
 ? 'bg-white/10 backdrop-blur-md rounded-xl p-1.5 sm:p-2 shadow-2xl border border-white/20'
 : ''
 }`}>
 <div className="relative flex-1">
 <input
 ref={inputRef}
 type="text"
 value={query}
 onChange={(e) => {
 setQuery(e.target.value)
 setIsOpen(true)
 setHighlightIndex(-1)
 }}
 onFocus={() => query.length >= 2 && setIsOpen(true)}
 onKeyDown={handleKeyDown}
 placeholder={placeholder || (category === 'all'
 ? 'Search doctors, medicines, nurses, pharmacies...'
 : `Search ${categories.find(c => c.id === category)?.label.toLowerCase() ?? ''}...`)}
 className={
 isHero
 ? 'w-full px-4 py-2.5 sm:py-3 text-gray-700 outline-none rounded-l-xl text-sm sm:text-base bg-white/90 placeholder-gray-400'
 : 'w-full pl-10 pr-8 py-2.5 border-2 border-gray-200 rounded-full focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm'
 }
 autoComplete="off"
 role="combobox"
 aria-expanded={isOpen && results.length > 0}
 aria-haspopup="listbox"
 aria-controls="search-results-list"
 />
 {!isHero && <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />}
 {query && (
 <button
 type="button"
 onClick={() => { setQuery(''); setResults([]); setIsOpen(false) }}
 className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 ${
 isHero ? 'right-2' : 'right-3'
 }`}
 >
 <FaTimes className="text-xs" />
 </button>
 )}
 </div>
 {isHero && (
 <button
 type="submit"
 className="px-4 sm:px-6 py-2.5 sm:py-3 flex items-center gap-2 rounded-r-xl text-sm sm:text-base text-white font-medium transition-transform hover:scale-105 active:scale-95"
 style={{ background: '#001E40' }}
 >
 <FaSearch className="text-xs sm:text-sm" />
 <span className="hidden sm:inline">Search</span>
 </button>
 )}
 </form>

 {/* Dropdown Results */}
 {isOpen && (query.length >= 2) && (
 <div
 id="search-results-list"
 role="listbox"
 className={`absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden ${
 isHero ? 'max-h-96' : 'max-h-80'
 }`}
 >
 {loading ? (
 <div className="p-4 text-center text-gray-500 text-sm">
 <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
 Searching...
 </div>
 ) : results.length === 0 ? (
 <div className="p-4 text-center text-gray-500 text-sm">
 No results found for &quot;{query}&quot;
 {category !== 'all' && (
 <button
 onClick={() => setCategory('all')}
 className="block mx-auto mt-2 text-blue-600 hover:underline text-xs"
 >
 Search in all categories
 </button>
 )}
 </div>
 ) : (
 <div className="max-h-80 overflow-y-auto">
 {results.map((result, index) => {
 const CategoryIcon = CATEGORY_ICONS[result.category] || FaSearch
 const colorClass = CATEGORY_COLORS[result.category] || 'text-gray-600 bg-gray-50'
 return (
 <button
 key={`${result.category}-${result.id}`}
 role="option"
 aria-selected={index === highlightIndex}
 onClick={() => handleResultClick(result)}
 onMouseEnter={() => setHighlightIndex(index)}
 className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
 index === highlightIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
 }`}
 >
 {/* Avatar or icon */}
 <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${
 result.image ? '' : colorClass.split(' ')[1]
 }`}>
 {result.image ? (
 <Image
 src={result.image}
 alt={result.label}
 width={40}
 height={40}
 className="rounded-full object-cover"
 />
 ) : (
 <CategoryIcon className={`text-lg ${colorClass.split(' ')[0]}`} />
 )}
 </div>

 {/* Text */}
 <div className="flex-1 min-w-0">
 <div className="text-sm font-medium text-gray-900 truncate">{result.label}</div>
 <div className="text-xs text-gray-500 truncate">{result.sublabel}</div>
 </div>

 {/* Category badge */}
 <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${colorClass}`}>
 {result.category}
 </span>
 </button>
 )
 })}

 {/* View all results link */}
 <button
 onClick={handleSubmit as unknown as () => void}
 className="w-full px-4 py-3 text-center text-sm text-blue-600 hover:bg-blue-50 font-medium border-t border-gray-100"
 >
 View all results for &quot;{query}&quot;
 </button>
 </div>
 )}
 </div>
 )}
 </div>
 )
}
