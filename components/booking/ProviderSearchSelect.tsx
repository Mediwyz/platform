'use client'

import { useState, useRef, useEffect } from 'react'
import { FaSearch, FaCheckCircle, FaTimes } from 'react-icons/fa'

export interface ProviderOption {
 id: string
 userId: string
 name: string
 subtitle?: string
 tags?: string[]
 extra?: string
}

interface ProviderSearchSelectProps {
 providers: ProviderOption[]
 selectedId: string
 onSelect: (userId: string) => void
 loading?: boolean
 label: string
 placeholder?: string
 accentColor?: string
 avatarGradient?: string
 renderExtra?: (provider: ProviderOption) => React.ReactNode
}

const ACCENT_CLASSES: Record<string, { selected: string; tag: string; check: string; focus: string; bg: string }> = {
 blue: { selected: 'bg-blue-100 border-blue-500 ring-2 ring-blue-300', tag: 'bg-blue-100 text-blue-700', check: 'text-blue-500', focus: 'focus:border-blue-500', bg: ' ' },
 pink: { selected: 'bg-pink-100 border-pink-500 ring-2 ring-pink-300', tag: 'bg-pink-100 text-pink-700', check: 'text-pink-500', focus: 'focus:border-pink-500', bg: ' ' },
 purple: { selected: 'bg-purple-100 border-purple-500 ring-2 ring-purple-300', tag: 'bg-green-100 text-green-700', check: 'text-purple-500', focus: 'focus:border-purple-500', bg: ' ' },
 cyan: { selected: 'bg-cyan-100 border-cyan-500 ring-2 ring-cyan-300', tag: 'bg-cyan-100 text-cyan-700', check: 'text-cyan-500', focus: 'focus:border-cyan-500', bg: ' ' },
}

export default function ProviderSearchSelect({
 providers,
 selectedId,
 onSelect,
 loading,
 label,
 placeholder = 'Search by name...',
 accentColor = 'blue',
 avatarGradient = ' ',
 renderExtra,
}: ProviderSearchSelectProps) {
 const [search, setSearch] = useState('')
 const [isOpen, setIsOpen] = useState(false)
 const wrapperRef = useRef<HTMLDivElement>(null)
 const accent = ACCENT_CLASSES[accentColor] || ACCENT_CLASSES.blue

 const filtered = providers.filter(p =>
 p.name.toLowerCase().includes(search.toLowerCase()) ||
 (p.subtitle || '').toLowerCase().includes(search.toLowerCase()) ||
 (p.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))
 )

 const selected = providers.find(p => p.userId === selectedId)

 // Close dropdown on outside click
 useEffect(() => {
 const handleClick = (e: MouseEvent) => {
 if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
 setIsOpen(false)
 }
 }
 document.addEventListener('mousedown', handleClick)
 return () => document.removeEventListener('mousedown', handleClick)
 }, [])

 if (loading) {
 return (
 <div>
 <h4 className="font-semibold text-fg mb-3 text-sm sm:text-base">
 {label} <span className="text-red-500">*</span>
 </h4>
 <div className="flex items-center gap-2 py-4 text-soft">
 <div className="w-4 h-4 border-2 border-line border-t-gray-600 rounded-full animate-spin" />
 <span className="text-sm">Loading...</span>
 </div>
 </div>
 )
 }

 if (providers.length === 0) {
 return (
 <div>
 <h4 className="font-semibold text-fg mb-3 text-sm sm:text-base">
 {label} <span className="text-red-500">*</span>
 </h4>
 <p className="text-soft text-sm py-4">No providers available at the moment.</p>
 </div>
 )
 }

 return (
 <div ref={wrapperRef}>
 <h4 className="font-semibold text-fg mb-3 text-sm sm:text-base">
 {label} <span className="text-red-500">*</span>
 </h4>

 {/* Selected provider chip */}
 {selected && !isOpen && (
 <div className={`p-3 border rounded-lg ${accent.selected} mb-2`}>
 <div className="flex items-center gap-3">
 <div className={`w-10 h-10 ${avatarGradient} rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
 {selected.name.replace('Dr. ', '').split(' ').map(n => n[0]).join('').slice(0, 2)}
 </div>
 <div className="flex-1 min-w-0">
 <h5 className="font-semibold text-fg text-sm">{selected.name}</h5>
 {selected.subtitle && <p className="text-xs text-soft">{selected.subtitle}</p>}
 </div>
 <button
 onClick={() => { setIsOpen(true); setSearch('') }}
 className="text-xs text-soft hover:text-soft px-2 py-1 bg-white/60 rounded"
 >
 Change
 </button>
 </div>
 </div>
 )}

 {/* Search input */}
 {(!selected || isOpen) && (
 <div className="relative">
 <div className="relative">
 <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-faint text-sm" />
 <input
 type="text"
 value={search}
 onChange={(e) => { setSearch(e.target.value); setIsOpen(true) }}
 onFocus={() => setIsOpen(true)}
 placeholder={placeholder}
 className={`w-full pl-9 pr-8 py-2.5 border border-line rounded-lg ${accent.focus} focus:outline-none text-sm`}
 />
 {search && (
 <button
 onClick={() => setSearch('')}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-soft"
 >
 <FaTimes className="text-xs" />
 </button>
 )}
 </div>

 {/* Dropdown */}
 {isOpen && (
 <div className="absolute z-10 w-full mt-1 bg-surface border border-line rounded-lg shadow-lg max-h-56 overflow-y-auto">
 {filtered.length === 0 ? (
 <div className="p-3 text-center text-soft text-sm">No results found</div>
 ) : (
 filtered.map((provider) => (
 <button
 key={provider.id}
 onClick={() => {
 onSelect(provider.userId)
 setIsOpen(false)
 setSearch('')
 }}
 className={`w-full p-3 text-left hover:bg-subtle transition border-b border-line last:border-0 ${
 selectedId === provider.userId ? ` ${accent.bg}` : ''
 }`}
 >
 <div className="flex items-center gap-3">
 <div className={`w-10 h-10 ${avatarGradient} rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
 {provider.name.replace('Dr. ', '').split(' ').map(n => n[0]).join('').slice(0, 2)}
 </div>
 <div className="flex-1 min-w-0">
 <h5 className="font-semibold text-fg text-sm">{provider.name}</h5>
 {provider.subtitle && <p className="text-xs text-soft">{provider.subtitle}</p>}
 {provider.tags && provider.tags.length > 0 && (
 <div className="mt-1 flex flex-wrap gap-1">
 {provider.tags.slice(0, 3).map((tag, i) => (
 <span key={i} className={`px-1.5 py-0.5 ${accent.tag} rounded text-xs`}>
 {tag}
 </span>
 ))}
 </div>
 )}
 {renderExtra && renderExtra(provider)}
 </div>
 {selectedId === provider.userId && (
 <FaCheckCircle className={`${accent.check} text-lg flex-shrink-0`} />
 )}
 </div>
 </button>
 ))
 )}
 </div>
 )}
 </div>
 )}
 </div>
 )
}
