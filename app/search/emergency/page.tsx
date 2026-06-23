'use client'

import { useState, useEffect, useCallback } from 'react'
import { FaSearch, FaAmbulance, FaStar, FaMapMarkerAlt, FaClock, FaExclamationTriangle, FaHospital, FaFireExtinguisher, FaHeartbeat, FaShieldAlt, FaCheckCircle, FaBell, FaHelicopter, FaTruck, FaWifi } from 'react-icons/fa'
import { initialsAvatar } from '@/lib/utils/avatar'

import { IconType } from 'react-icons'
import AuthBookingLink from '@/components/booking/AuthBookingLink'
import ConnectButton from '@/components/search/ConnectButton'
import CallButton from '@/components/search/CallButton'

// Category icons mapping
const categoryIcons: { [key: string]: IconType } = {
 "Medical Emergency": FaAmbulance,
 "Fire & Rescue": FaFireExtinguisher,
 "Hospital Emergency": FaHospital,
 "Water Emergency": FaHelicopter,
 "Critical Care Transport": FaHelicopter,
 "Poison & Chemical": FaExclamationTriangle,
 "Mental Health": FaHeartbeat,
 "Disaster Management": FaTruck
}

// Emergency Service interface (mapped from API response)
interface EmergencyService {
 id: string
 name: string
 type: string
 category: string
 responseTime: string
 availability: string
 rating: number
 reviews: number
 location: string
 coverage: string
 phone: string
 alternatePhone: string
 email: string
 services: string[]
 equipment: string[]
 certifications: string[]
 vehicleTypes: string[]
 languages: string[]
 gpsTracking: boolean
 verified: boolean
 governmentApproved: boolean
 bio: string
 avatar: string
}

// Emergency Service Card Component
const EmergencyCard = ({ service }: { service: EmergencyService }) => {
 const CategoryIcon = categoryIcons[service.category] || FaAmbulance

 return (
 <div className="bg-surface rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-line overflow-hidden">
 <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-3">
 {/* Left: Avatar + Info */}
 <div className="flex items-start gap-3 flex-1 min-w-0">
 <div className="relative flex-shrink-0">
 <div
 className="w-12 h-12 rounded-full border-2 border-blue-100 flex items-center justify-center"
 style={{ backgroundImage: `url(${service.avatar})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
 >
 <CategoryIcon className="text-xl text-blue-500 opacity-0" />
 </div>
 {service.verified && (
 <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 text-white rounded-full p-0.5">
 <FaCheckCircle className="text-[10px]" />
 </div>
 )}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-0.5 flex-wrap">
 <h3 className="text-sm font-bold text-fg truncate">{service.name}</h3>
 <span className="text-[10px] px-2 py-0.5 rounded-full font-medium border whitespace-nowrap bg-blue-50 text-blue-700 border-blue-200">
 {service.type}
 </span>
 {service.governmentApproved && (
 <span className="text-[10px] px-2 py-0.5 rounded-full font-medium border whitespace-nowrap bg-green-50 text-green-700 border-green-200">
 <FaShieldAlt className="inline text-[8px] mr-0.5" /> Govt. Approved
 </span>
 )}
 </div>
 <p className="text-xs text-blue-600 font-medium truncate mb-1">
 {service.category} &middot; {service.coverage}
 </p>

 {/* Meta row */}
 <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-soft mb-1.5">
 <span className="flex items-center gap-1">
 <FaStar className="text-yellow-500 text-[10px]" />
 <span className="font-semibold text-soft">{service.rating}</span>
 <span className="text-faint">({service.reviews})</span>
 </span>
 <span className="flex items-center gap-1">
 <FaMapMarkerAlt className="text-[10px] text-faint" />
 <span className="truncate max-w-[120px]">{service.location}</span>
 </span>
 <span className="flex items-center gap-1 font-semibold text-blue-600">
 <FaClock className="text-[10px]" /> {service.responseTime}
 </span>
 </div>

 {/* Tags */}
 <div className="flex flex-wrap items-center gap-1.5">
 <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
 <FaBell className="text-[8px]" /> {service.availability}
 </span>
 {service.gpsTracking && (
 <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
 <FaWifi className="text-[8px]" /> GPS
 </span>
 )}
 {service.services.slice(0, 2).map((s, i) => (
 <span key={i} className="inline-flex items-center text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-200">
 {s}
 </span>
 ))}
 </div>
 </div>
 </div>

 {/* Right: Phone + Buttons */}
 <div className="flex flex-col items-stretch sm:items-end gap-2 flex-shrink-0 sm:border-l sm:border-line sm:pl-4 border-t sm:border-t-0 border-line pt-3 sm:pt-0">
 <div className="sm:text-right">
 <a href={`tel:${service.phone}`} className="text-sm font-bold text-blue-600 whitespace-nowrap hover:underline">
 {service.phone}
 </a>
 </div>
 <div className="flex items-center gap-2">
 <CallButton providerId={service.id} className="flex-1 sm:flex-none !px-4 !py-2.5 !text-sm" />
 <AuthBookingLink
 type="emergency"
 className="flex-1 sm:flex-none bg-teal-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors text-center"
 >
 Book
 </AuthBookingLink>
 <ConnectButton providerId={service.id} className="flex-1 sm:flex-none !px-4 !py-2.5 !text-sm" />
 </div>
 </div>
 </div>
 </div>
 )
}

// Loading Animation Component
const LoadingAnimation = () => {
 return (
 <div className="flex flex-col items-center justify-center py-12">
 <div className="relative">
 <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-pulse"></div>
 <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
 <FaAmbulance className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-600 text-2xl animate-pulse" />
 </div>
 <p className="mt-4 text-soft font-medium animate-pulse">Locating emergency services...</p>
 <div className="flex gap-1 mt-2">
 <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
 <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
 <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
 </div>
 </div>
 )
}

// Empty State Component
const EmptyState = ({ onClear }: { onClear: () => void }) => {
 return (
 <div className="text-center py-12">
 <FaExclamationTriangle className="text-6xl text-faint mx-auto mb-4" />
 <h3 className="text-xl font-semibold text-soft mb-2">No emergency services found</h3>
 <p className="text-soft mb-6">Try adjusting your search criteria or browse all services</p>
 <button
 onClick={onClear}
 className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
 >
 Clear Filters
 </button>
 </div>
 )
}

// Main Component
export default function EmergencyPage() {
 const [searchQuery, setSearchQuery] = useState('')
 const [category, setCategory] = useState('all')
 const [isSearching, setIsSearching] = useState(false)
 const [allServices, setAllServices] = useState<EmergencyService[]>([])
 const [searchResults, setSearchResults] = useState<EmergencyService[]>([])
 const [hasSearched, setHasSearched] = useState(false)
 const [isLoading, setIsLoading] = useState(true)

 const fetchServices = useCallback(async () => {
 try {
 setIsLoading(true)
 const res = await fetch('/api/search/providers?type=EMERGENCY_WORKER')
 if (!res.ok) throw new Error('Failed to fetch emergency services')
 const json = await res.json()
 // Generic provider shape (same across all roles): { id, name, firstName, lastName,
 // profileImage, address, phone, verified, certifications, vehicleType, responseZone,
 // emtLevel, specializations, rating, bio }
 interface ProviderResponse {
 id: string
 name?: string
 firstName?: string
 lastName?: string
 profileImage?: string | null
 address?: string | null
 phone?: string | null
 verified?: boolean
 certifications?: string[]
 vehicleType?: string | null
 responseZone?: string | null
 emtLevel?: string | null
 specializations?: string[]
 rating?: number
 bio?: string
 }
 const mapped = ((json.data || []) as ProviderResponse[]).map((s) => {
 const displayName = s.name || `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || 'Emergency Service'
 return {
 id: s.id,
 name: displayName,
 type: s.emtLevel || 'Emergency Service',
 category: s.emtLevel || 'Medical Emergency',
 responseTime: s.responseZone || 'N/A',
 availability: '24/7',
 rating: s.rating || 0,
 reviews: 0,
 location: s.address || s.responseZone || 'Mauritius',
 coverage: s.responseZone || 'Local Area',
 phone: s.phone || '114',
 alternatePhone: '',
 email: '',
 services: s.specializations || s.certifications || [],
 equipment: [],
 certifications: s.certifications || [],
 vehicleTypes: s.vehicleType ? [s.vehicleType] : [],
 languages: ['English', 'French', 'Creole'],
 gpsTracking: true,
 verified: !!s.verified,
 governmentApproved: !!s.verified,
 bio: s.bio || '',
 avatar: s.profileImage || initialsAvatar(s.firstName ?? displayName, s.lastName ?? ''),
 }
 })
 setAllServices(mapped)
 setSearchResults(mapped)
 } catch (err) {
 console.error('Error fetching emergency services:', err)
 setAllServices([])
 setSearchResults([])
 } finally {
 setIsLoading(false)
 }
 }, [])

 useEffect(() => {
 fetchServices()
 }, [fetchServices])

 const handleSearch = async () => {
 setIsSearching(true)
 setHasSearched(true)

 let results = [...allServices]

 if (category !== 'all') {
 results = results.filter(service =>
 service.category.toLowerCase().includes(category.toLowerCase()) ||
 service.type.toLowerCase().includes(category.toLowerCase())
 )
 }

 if (searchQuery) {
 const lowerQuery = searchQuery.toLowerCase()
 results = results.filter(service =>
 service.name.toLowerCase().includes(lowerQuery) ||
 service.type.toLowerCase().includes(lowerQuery) ||
 service.category.toLowerCase().includes(lowerQuery) ||
 (service.services || []).some((s: string) => s.toLowerCase().includes(lowerQuery)) ||
 service.location.toLowerCase().includes(lowerQuery) ||
 service.bio.toLowerCase().includes(lowerQuery)
 )
 }

 setSearchResults(results)
 setIsSearching(false)
 }

 const handleClearFilters = () => {
 setSearchQuery('')
 setCategory('all')
 setSearchResults(allServices)
 setHasSearched(false)
 }

 return (
 <div className="min-h-screen to-white">

 <div className="container mx-auto px-4 py-8">
 {/* Search Section */}
 <div className="relative z-10">
 <div className="bg-surface rounded-xl shadow-xl p-4 border-2 border-blue-200">
 <div className="flex flex-col gap-4">
 <div className="relative">
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Search emergency services (e.g., 'ambulance', 'fire rescue', 'medical transport')"
 className="w-full px-4 py-3 pr-12 border-2 border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-base"
 />
 <FaSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-400" />
 </div>

 <div className="flex flex-col md:flex-row gap-4">
 <select
 value={category}
 onChange={(e) => setCategory(e.target.value)}
 className="flex-1 px-4 py-2.5 border-2 border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
 >
 <option value="all">All Emergency Services</option>
 <option value="medical">Medical Emergency</option>
 <option value="fire">Fire & Rescue</option>
 <option value="water">Water Emergency</option>
 <option value="poison">Poison Control</option>
 <option value="mental">Mental Health Crisis</option>
 <option value="disaster">Natural Disaster</option>
 </select>

 <button
 type="button"
 onClick={handleSearch}
 className="bg-brand-navy text-white px-8 py-2.5 rounded-xl transition-all duration-200 font-medium flex items-center justify-center gap-2 min-w-[150px] shadow-lg"
 >
 <FaSearch />
 Find Service
 </button>
 </div>
 </div>
 </div>
 </div>

 {/* Results Section */}
 <div className="mt-8">
 {isLoading || isSearching ? (
 <LoadingAnimation />
 ) : searchResults.length > 0 ? (
 <>
 {hasSearched && (
 <div className="mb-6 flex items-center justify-between">
 <p className="text-soft">
 Found <span className="font-semibold text-fg">{searchResults.length}</span> emergency services
 </p>
 <button
 onClick={handleClearFilters}
 className="text-blue-600 hover:text-blue-700 font-medium"
 >
 Clear filters
 </button>
 </div>
 )}

 <div className="flex flex-col gap-4">
 {searchResults.map((service) => (
 <EmergencyCard key={service.id} service={service} />
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
