'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { type Nanny } from '@/lib/data'
import AuthBookingLink from '@/components/booking/AuthBookingLink'
import ConnectButton from '@/components/search/ConnectButton'
import {
 FaSearch, FaBaby, FaStar, FaMapMarkerAlt, FaClock, FaCalendarAlt,
 FaHome, FaLanguage, FaCheckCircle, FaExclamationCircle,
} from 'react-icons/fa'

interface NannyProps {
 nanny: Nanny
}

const NannyCard = ({ nanny }: NannyProps) => {
 // Defensive defaults - API may omit fields for nannies coming from the generic provider search
 const ageGroups = Array.isArray(nanny.ageGroups) ? nanny.ageGroups : []
 const languages = Array.isArray(nanny.languages) ? nanny.languages : []
 const specialization = Array.isArray(nanny.specialization)
  ? nanny.specialization
  : Array.isArray((nanny as unknown as { specializations?: string[] }).specializations)
  ? (nanny as unknown as { specializations: string[] }).specializations
  : []
 const careTypes = Array.isArray(nanny.careTypes) ? nanny.careTypes : []
 const location = nanny.location || (nanny as unknown as { address?: string }).address || ''
 const nextAvailable = nanny.nextAvailable || 'Available'
 const reviews = nanny.reviews ?? 0
 const rating = nanny.rating ?? 0

 return (
 <div className="bg-surface rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-line overflow-hidden">
 <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-3">
 {/* Left: Avatar + Info */}
 <div className="flex items-start gap-3 flex-1 min-w-0">
 <div className="relative flex-shrink-0">
 <Image
 src={nanny.profileImage}
 alt={`${nanny.firstName} ${nanny.lastName}`}
 width={48}
 height={48}
 className="rounded-full object-cover border-2 border-pink-100"
 onError={(e) => {
 const target = e.target as HTMLImageElement;
 target.src = `https://ui-avatars.com/api/?name=${nanny.firstName}+${nanny.lastName}&background=random&color=fff&size=48`;
 }}
 />
 {nanny.verified && (
 <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 text-white rounded-full p-0.5">
 <FaCheckCircle className="text-[10px]" />
 </div>
 )}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-0.5 flex-wrap">
 <h3 className="text-sm font-bold text-fg truncate">
 {nanny.firstName} {nanny.lastName}
 </h3>
 <span className="text-[10px] px-2 py-0.5 rounded-full font-medium border whitespace-nowrap bg-pink-50 text-pink-700 border-pink-200">
 {ageGroups.slice(0, 2).join(', ') || 'All ages'}
 {ageGroups.length > 2 && ` +${ageGroups.length - 2}`}
 </span>
 </div>
 <p className="text-xs text-purple-600 font-medium truncate mb-1">
 {specialization.join(', ') || 'Childcare'}
 </p>

 {/* Meta row */}
 <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-soft mb-1.5">
 <span className="flex items-center gap-1">
 <FaStar className="text-yellow-500 text-[10px]" />
 <span className="font-semibold text-soft">{rating}</span>
 <span className="text-faint">({reviews})</span>
 </span>
 {location && (
 <span className="flex items-center gap-1">
 <FaMapMarkerAlt className="text-[10px] text-faint" />
 <span className="truncate max-w-[120px]">{location}</span>
 </span>
 )}
 {languages.length > 0 && (
 <span className="flex items-center gap-1">
 <FaLanguage className="text-[10px] text-faint" />
 <span>{languages.slice(0, 2).join(', ')}</span>
 {languages.length > 2 && <span className="text-faint">+{languages.length - 2}</span>}
 </span>
 )}
 </div>

 {/* Tags */}
 <div className="flex flex-wrap items-center gap-1.5">
 <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
 <FaClock className="text-[8px]" /> {nextAvailable}
 </span>
 {careTypes.includes('Full-time Care') && (
 <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
 <FaHome className="text-[8px]" /> Full-time
 </span>
 )}
 {careTypes.includes('Part-time Care') && (
 <span className="inline-flex items-center gap-1 text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
 <FaClock className="text-[8px]" /> Part-time
 </span>
 )}
 {careTypes.includes('Date Night Sitting') && (
 <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
 <FaCalendarAlt className="text-[8px]" /> Date Night
 </span>
 )}
 {nanny.emergencyAvailable && (
 <span className="inline-flex items-center gap-1 text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
 <FaExclamationCircle className="text-[8px]" /> Emergency
 </span>
 )}
 </div>
 </div>
 </div>

 {/* Right: Price + Buttons */}
 <div className="flex flex-col items-stretch sm:items-end gap-2 flex-shrink-0 sm:border-l sm:border-line sm:pl-4 border-t sm:border-t-0 border-line pt-3 sm:pt-0">
 <div className="sm:text-right">
 <p className="text-sm font-bold text-fg whitespace-nowrap">
 Rs {(nanny.hourlyRate ?? 0).toLocaleString()}/hr
 </p>
 {(nanny.overnightRate ?? 0) > 0 && (
 <p className="text-[10px] text-faint whitespace-nowrap">
 Overnight: Rs {(nanny.overnightRate ?? 0).toLocaleString()}
 </p>
 )}
 </div>
 <div className="flex items-center gap-2">
 <Link href={`/search/childcare/${nanny.id}`} className="flex-1 sm:flex-none">
 <button className="w-full bg-subtle hover:bg-line text-soft px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
 Details
 </button>
 </Link>
 <AuthBookingLink type="nanny" providerId={nanny.id} className="flex-1 sm:flex-none bg-purple-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors text-center">
 Book
 </AuthBookingLink>
 <ConnectButton providerId={nanny.id} className="flex-1 sm:flex-none !px-4 !py-2.5 !text-sm" />
 </div>
 </div>
 </div>
 </div>
 )
}

const LoadingAnimation = () => (
 <div className="flex justify-center items-center py-12">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
 <span className="ml-3 text-soft">Finding the best nannies for you...</span>
 </div>
)

const EmptyState = ({ onClear }: { onClear: () => void }) => (
 <div className="text-center py-12">
 <FaBaby className="text-6xl text-faint mx-auto mb-4" />
 <h3 className="text-xl font-semibold text-soft mb-2">No nannies found</h3>
 <p className="text-soft mb-6">Try adjusting your search criteria or browse all available nannies</p>
 <button 
 onClick={onClear}
 className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
 >
 View All Nannies
 </button>
 </div>
)

export default function NanniesSearchPage() {
 const [searchQuery, setSearchQuery] = useState('')
 const [specialization, setSpecialization] = useState('all')
 const [isSearching, setIsSearching] = useState(false)
 const [searchResults, setSearchResults] = useState<Nanny[]>([])
 const [allNannies, setAllNannies] = useState<Nanny[]>([])
 const [hasSearched, setHasSearched] = useState(false)
 const [isLoading, setIsLoading] = useState(true)
 const fetchNannies = useCallback(async (query = '', spec = '') => {
 const params = new URLSearchParams()
 if (query) params.set('q', query)
 if (spec && spec !== 'all') params.set('specialization', spec)
 const res = await fetch(`/api/search/nannies?${params.toString()}`)
 const json = await res.json()
 return json.success ? json.data : []
 }, [])

 useEffect(() => {
 fetchNannies().then((data) => {
 setAllNannies(data)
 setSearchResults(data)
 setIsLoading(false)
 })
 }, [fetchNannies])

 const handleSearch = async () => {
 setIsSearching(true)
 setHasSearched(true)
 const results = await fetchNannies(searchQuery, specialization)
 setSearchResults(results)
 setIsSearching(false)
 }

 const handleClearFilters = () => {
 setSearchQuery('')
 setSpecialization('all')
 setSearchResults(allNannies)
 setHasSearched(false)
 }

 return (
 <div className="min-h-screen to-white">
 <div className="container mx-auto px-4 py-8">
 {/* Search Form */}
 <div className="relative z-10">
 <div className="bg-surface rounded-xl shadow-xl p-4">
 <div className="flex flex-col gap-4">
 <div className="relative">
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Describe what you are looking for (e.g., 'infant care specialist', 'bilingual nanny', 'after school care')"
 className="w-full px-4 py-3 pr-12 border-2 border-line rounded-xl focus:outline-none focus:border-purple-500 transition-colors text-base"
 onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
 />
 <FaSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-faint" />
 </div>
 
 <div className="flex flex-col md:flex-row gap-4">
 <select
 value={specialization}
 onChange={(e) => setSpecialization(e.target.value)}
 className="flex-1 px-4 py-2.5 border-2 border-line rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
 >
 <option value="all">All Specializations</option>
 <option value="infant">Infant Care</option>
 <option value="toddler">Toddler Development</option>
 <option value="school">School Age Care</option>
 <option value="special">Special Needs Care</option>
 <option value="newborn">Newborn Care</option>
 <option value="bilingual">Bilingual Education</option>
 <option value="overnight">Overnight Care</option>
 <option value="active">Active Play</option>
 <option value="arts">Arts & Crafts</option>
 <option value="emergency">Emergency Care</option>
 </select>
 
 <button 
 type="button"
 onClick={handleSearch}
 disabled={isSearching}
 className="bg-brand-navy text-white px-8 py-2.5 rounded-xl transition-all duration-200 font-medium flex items-center justify-center gap-2 min-w-[150px] shadow-lg disabled:opacity-50"
 >
 {isSearching ? (
 <>
 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
 Searching...
 </>
 ) : (
 <>
 <FaSearch />
 Find Nannies
 </>
 )}
 </button>
 </div>
 </div>
 
 </div>
 </div>

 {/* Results */}
 <div className="mt-12">
 {isLoading || isSearching ? (
 <LoadingAnimation />
 ) : searchResults.length > 0 ? (
 <>
 {hasSearched && (
 <div className="mb-6 flex items-center justify-between">
 <p className="text-soft">
 Found <span className="font-semibold text-fg">{searchResults.length}</span> nannies matching your criteria
 </p>
 <button
 onClick={handleClearFilters}
 className="text-purple-600 hover:text-purple-700 font-medium"
 >
 Clear filters
 </button>
 </div>
 )}
 
 <div className="flex flex-col gap-4">
 {searchResults.map((nanny) => (
 <NannyCard key={nanny.id} nanny={nanny} />
 ))}
 </div>
 </>
 ) : hasSearched ? (
 <EmptyState onClear={handleClearFilters} />
 ) : null}
 </div>
 
 </div>
 </div>
 )
}