'use client'

import { useCallback } from 'react'
import {
 FaUserMd, FaUserNurse, FaBaby, FaPills, FaStar, FaMapMarkerAlt,
 FaTimes, FaCheckCircle, FaFilter,
} from 'react-icons/fa'

export interface SearchFilterValues {
 type: string
 specialty: string
 city: string
 minRating: string
 available: string
}

interface SearchFiltersProps {
 filters: SearchFilterValues
 onFilterChange: (key: keyof SearchFilterValues, value: string) => void
 onClearAll: () => void
 /** Which provider types to show in the type filter. Defaults to all. */
 showTypes?: ('doctors' | 'nurses' | 'nannies' | 'medicines')[]
 /** Specialty options relevant to the current page */
 specialtyOptions?: { value: string; label: string }[]
 /** City options relevant to Mauritius */
 cityOptions?: { value: string; label: string }[]
}

const DEFAULT_TYPES: { value: string; label: string; icon: React.ReactNode; color: string }[] = [
 { value: 'all', label: 'All', icon: <FaFilter className="text-xs" />, color: 'bg-subtle text-soft border-line' },
 { value: 'doctors', label: 'Doctors', icon: <FaUserMd className="text-xs" />, color: 'bg-blue-50 text-blue-700 border-blue-200' },
 { value: 'nurses', label: 'Nurses', icon: <FaUserNurse className="text-xs" />, color: 'bg-teal-50 text-teal-700 border-teal-200' },
 { value: 'nannies', label: 'Childcare', icon: <FaBaby className="text-xs" />, color: 'bg-pink-50 text-pink-700 border-pink-200' },
 { value: 'medicines', label: 'Medicines', icon: <FaPills className="text-xs" />, color: 'bg-green-50 text-green-700 border-green-200' },
]

const DEFAULT_SPECIALTIES = [
 { value: '', label: 'All Specialties' },
 { value: 'cardiology', label: 'Cardiology' },
 { value: 'neurology', label: 'Neurology' },
 { value: 'pediatrics', label: 'Pediatrics' },
 { value: 'orthopedic', label: 'Orthopedic Surgery' },
 { value: 'dermatology', label: 'Dermatology' },
 { value: 'emergency', label: 'Emergency Medicine' },
 { value: 'dentistry', label: 'Dentistry' },
 { value: 'psychiatry', label: 'Psychiatry' },
 { value: 'gastroenterology', label: 'Gastroenterology' },
 { value: 'ophthalmology', label: 'Ophthalmology' },
 { value: 'elderly', label: 'Elderly Care' },
 { value: 'child care', label: 'Child Care' },
]

const DEFAULT_CITIES = [
 { value: '', label: 'All Locations' },
 { value: 'port louis', label: 'Port Louis' },
 { value: 'curepipe', label: 'Curepipe' },
 { value: 'quatre bornes', label: 'Quatre Bornes' },
 { value: 'vacoas', label: 'Vacoas-Phoenix' },
 { value: 'rose hill', label: 'Rose Hill' },
 { value: 'beau bassin', label: 'Beau Bassin' },
 { value: 'mahebourg', label: 'Mahebourg' },
 { value: 'flacq', label: 'Flacq' },
 { value: 'grand baie', label: 'Grand Baie' },
]

const RATING_OPTIONS = [
 { value: '', label: 'Any Rating' },
 { value: '4.5', label: '4.5+ Stars' },
 { value: '4', label: '4+ Stars' },
 { value: '3.5', label: '3.5+ Stars' },
 { value: '3', label: '3+ Stars' },
]

export default function SearchFilters({
 filters,
 onFilterChange,
 onClearAll,
 showTypes,
 specialtyOptions,
 cityOptions,
}: SearchFiltersProps) {
 const types = showTypes
 ? DEFAULT_TYPES.filter(t => t.value === 'all' || showTypes.includes(t.value as 'doctors' | 'nurses' | 'nannies' | 'medicines'))
 : DEFAULT_TYPES
 const specialties = specialtyOptions || DEFAULT_SPECIALTIES
 const cities = cityOptions || DEFAULT_CITIES

 const activeFilterCount = [
 filters.type !== 'all' ? 1 : 0,
 filters.specialty ? 1 : 0,
 filters.city ? 1 : 0,
 filters.minRating ? 1 : 0,
 filters.available === 'true' ? 1 : 0,
 ].reduce((a, b) => a + b, 0)

 const handleChipClick = useCallback((key: keyof SearchFilterValues, value: string) => {
 onFilterChange(key, value)
 }, [onFilterChange])

 return (
 <>
 {/* ---- Mobile: Horizontal scrollable chips ---- */}
 <div className="lg:hidden">
 <div className="flex items-center gap-2 mb-3">
 <FaFilter className="text-faint text-sm flex-shrink-0" />
 <span className="text-sm font-medium text-soft flex-shrink-0">Filters</span>
 {activeFilterCount > 0 && (
 <button
 onClick={onClearAll}
 className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 flex-shrink-0"
 >
 <FaTimes className="text-[10px]" />
 Clear ({activeFilterCount})
 </button>
 )}
 </div>

 {/* Type chips */}
 <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
 {types.map(t => (
 <button
 key={t.value}
 onClick={() => handleChipClick('type', t.value)}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all ${
 filters.type === t.value
 ? `${t.color} border-current shadow-sm`
 : 'bg-surface text-soft border-line hover:border-line'
 }`}
 >
 {t.icon}
 {t.label}
 </button>
 ))}
 </div>

 {/* Filter row 2: specialty + city + rating */}
 <div className="flex gap-2 overflow-x-auto pb-2 mt-2 scrollbar-hide -mx-4 px-4">
 <select
 value={filters.specialty}
 onChange={e => onFilterChange('specialty', e.target.value)}
 className="text-xs border border-line rounded-full px-3 py-1.5 bg-surface text-soft focus:outline-none focus:border-blue-400 appearance-none min-w-[130px]"
 >
 {specialties.map(s => (
 <option key={s.value} value={s.value}>{s.label}</option>
 ))}
 </select>

 <select
 value={filters.city}
 onChange={e => onFilterChange('city', e.target.value)}
 className="text-xs border border-line rounded-full px-3 py-1.5 bg-surface text-soft focus:outline-none focus:border-blue-400 appearance-none min-w-[120px]"
 >
 {cities.map(c => (
 <option key={c.value} value={c.value}>{c.label}</option>
 ))}
 </select>

 <select
 value={filters.minRating}
 onChange={e => onFilterChange('minRating', e.target.value)}
 className="text-xs border border-line rounded-full px-3 py-1.5 bg-surface text-soft focus:outline-none focus:border-blue-400 appearance-none min-w-[100px]"
 >
 {RATING_OPTIONS.map(r => (
 <option key={r.value} value={r.value}>{r.label}</option>
 ))}
 </select>

 <button
 onClick={() => onFilterChange('available', filters.available === 'true' ? '' : 'true')}
 className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all ${
 filters.available === 'true'
 ? 'bg-green-50 text-green-700 border-green-200'
 : 'bg-surface text-soft border-line hover:border-line'
 }`}
 >
 <FaCheckCircle className="text-[10px]" />
 Available Now
 </button>
 </div>
 </div>

 {/* ---- Desktop: Sidebar ---- */}
 <div className="hidden lg:block lg:w-64 flex-shrink-0">
 <div className="bg-surface rounded-xl shadow-sm p-5 sticky top-24 border border-line">
 <div className="flex items-center justify-between mb-4">
 <h3 className="font-semibold text-fg flex items-center gap-2">
 <FaFilter className="text-sm text-faint" />
 Filters
 </h3>
 {activeFilterCount > 0 && (
 <button
 onClick={onClearAll}
 className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
 >
 <FaTimes className="text-[10px]" />
 Clear all
 </button>
 )}
 </div>

 {/* Provider Type */}
 <div className="mb-5">
 <label className="block text-xs font-medium text-soft uppercase tracking-wide mb-2">
 Provider Type
 </label>
 <div className="space-y-1">
 {types.map(t => (
 <button
 key={t.value}
 onClick={() => handleChipClick('type', t.value)}
 className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
 filters.type === t.value
 ? 'bg-blue-50 text-blue-700 font-medium'
 : 'text-soft hover:bg-subtle'
 }`}
 >
 {t.icon}
 {t.label}
 </button>
 ))}
 </div>
 </div>

 {/* Specialty */}
 <div className="mb-5">
 <label className="block text-xs font-medium text-soft uppercase tracking-wide mb-2">
 Specialty
 </label>
 <select
 value={filters.specialty}
 onChange={e => onFilterChange('specialty', e.target.value)}
 className="w-full text-sm border border-line rounded-lg px-3 py-2 bg-surface text-soft focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
 >
 {specialties.map(s => (
 <option key={s.value} value={s.value}>{s.label}</option>
 ))}
 </select>
 </div>

 {/* Location */}
 <div className="mb-5">
 <label className="block text-xs font-medium text-soft uppercase tracking-wide mb-2">
 <FaMapMarkerAlt className="inline text-xs mr-1" />
 Location
 </label>
 <select
 value={filters.city}
 onChange={e => onFilterChange('city', e.target.value)}
 className="w-full text-sm border border-line rounded-lg px-3 py-2 bg-surface text-soft focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
 >
 {cities.map(c => (
 <option key={c.value} value={c.value}>{c.label}</option>
 ))}
 </select>
 </div>

 {/* Rating */}
 <div className="mb-5">
 <label className="block text-xs font-medium text-soft uppercase tracking-wide mb-2">
 <FaStar className="inline text-xs mr-1 text-yellow-500" />
 Minimum Rating
 </label>
 <select
 value={filters.minRating}
 onChange={e => onFilterChange('minRating', e.target.value)}
 className="w-full text-sm border border-line rounded-lg px-3 py-2 bg-surface text-soft focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
 >
 {RATING_OPTIONS.map(r => (
 <option key={r.value} value={r.value}>{r.label}</option>
 ))}
 </select>
 </div>

 {/* Availability Toggle */}
 <div className="mb-2">
 <label className="block text-xs font-medium text-soft uppercase tracking-wide mb-2">
 Availability
 </label>
 <button
 onClick={() => onFilterChange('available', filters.available === 'true' ? '' : 'true')}
 className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm border transition-all ${
 filters.available === 'true'
 ? 'bg-green-50 text-green-700 border-green-200'
 : 'bg-surface text-soft border-line hover:border-line'
 }`}
 >
 <span className="flex items-center gap-2">
 <FaCheckCircle className={`text-sm ${filters.available === 'true' ? 'text-green-500' : 'text-faint'}`} />
 Available Now
 </span>
 <div className={`w-8 h-5 rounded-full transition-colors relative ${
 filters.available === 'true' ? 'bg-green-500' : 'bg-gray-300'
 }`}>
 <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-surface shadow transition-transform ${
 filters.available === 'true' ? 'translate-x-3.5' : 'translate-x-0.5'
 }`} />
 </div>
 </button>
 </div>
 </div>
 </div>
 </>
 )
}
