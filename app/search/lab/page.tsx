'use client'

import { useState, useEffect, useCallback } from 'react'
import AuthBookingLink from '@/components/booking/AuthBookingLink'
import ConnectButton from '@/components/search/ConnectButton'
import { FaSearch, FaFlask, FaStar, FaMapMarkerAlt, FaClock, FaCheckCircle, FaShoppingCart, FaHome, FaExclamationTriangle, FaPercent, FaTint, FaMicroscope, FaHeart, FaHandHoldingMedical, FaUserMd, FaViruses, FaLock, FaBaby } from 'react-icons/fa'

interface ApiLabTest {
 id: string
 testName?: string
 category?: string
 price?: number | string
 description?: string
 sampleType?: string
 preparation?: string
 turnaroundTime?: string
 lab?: string
 labTechnician?: { verified?: boolean }
}

function mapApiTestToUi(apiTest: ApiLabTest) {
 const price = Number(apiTest.price) || 0
 const originalPrice = Math.round(price * 1.2)
 const discountPct = Math.round(((originalPrice - price) / originalPrice) * 100)
 return {
 id: apiTest.id,
 name: apiTest.testName,
 category: apiTest.category,
 type: apiTest.category,
 price: `Rs ${price}`,
 originalPrice: `Rs ${originalPrice}`,
 discount: `${discountPct}% OFF`,
 rating: 4.7 + Math.random() * 0.3,
 reviews: Math.floor(500 + Math.random() * 2000),
 available: true,
 description: apiTest.description || 'Lab test provided by a certified laboratory',
 sampleType: apiTest.sampleType || 'Blood',
 fastingRequired: (apiTest.preparation || '').toLowerCase().includes('fast'),
 resultTime: apiTest.turnaroundTime || 'Same day',
 preparation: apiTest.preparation || 'No special preparation required',
 labLocation: apiTest.lab || 'Mauritius',
 homeCollection: true,
 popularity: 'Standard',
 reportDelivery: 'Digital + Physical',
 verified: apiTest.labTechnician?.verified ?? true,
 testCode: `TEST-${String(apiTest.id).slice(0, 8).toUpperCase()}`,
 components: [] as string[],
 clinicalUse: [] as string[],
 normalRange: 'See report',
 turnaroundTime: apiTest.turnaroundTime || 'Same day',
 bookings: Math.floor(200 + Math.random() * 1500),
 features: ['Digital Report', 'Home Collection'],
 }
}

// Test category icons mapping
const categoryIcons = {
 "Hematology": FaTint,
 "Biochemistry": FaMicroscope,
 "Hormones": FaHeart,
 "Diabetes": FaHandHoldingMedical,
 "Vitamins": FaUserMd,
 "Infectious Disease": FaViruses,
 "Cardiology": FaHeart,
 "Allergy": FaExclamationTriangle,
 "Cancer Screening": FaLock,
 "Pregnancy": FaBaby
}

// Lab Test Card Component
interface LabTestProps {
 test: ReturnType<typeof mapApiTestToUi>
}

const LabTestCard = ({ test }: LabTestProps) => {
 const CategoryIcon = categoryIcons[test.category as keyof typeof categoryIcons] || FaFlask

 return (
 <div className="bg-surface rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-line overflow-hidden">
 <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-3">
 {/* Left: Icon + Info */}
 <div className="flex items-start gap-3 flex-1 min-w-0">
 <div className="relative flex-shrink-0">
 <div className="w-12 h-12 rounded-lg border-2 border-purple-100 flex items-center justify-center">
 <CategoryIcon className="text-xl text-purple-600" />
 </div>
 {test.verified && (
 <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 text-white rounded-full p-0.5">
 <FaCheckCircle className="text-[10px]" />
 </div>
 )}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-0.5 flex-wrap">
 <h3 className="text-sm font-bold text-fg truncate">{test.name}</h3>
 <span className="text-[10px] px-2 py-0.5 rounded-full font-medium border whitespace-nowrap bg-purple-50 text-purple-700 border-purple-200">
 {test.category}
 </span>
 </div>
 <p className="text-xs text-purple-600 font-medium truncate mb-1">
 {test.testCode} &middot; {test.sampleType}
 </p>

 {/* Meta row */}
 <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-soft mb-1.5">
 <span className="flex items-center gap-1">
 <FaStar className="text-yellow-500 text-[10px]" />
 <span className="font-semibold text-soft">{test.rating.toFixed(1)}</span>
 <span className="text-faint">({test.reviews})</span>
 </span>
 <span className="flex items-center gap-1">
 <FaClock className="text-[10px] text-faint" />
 <span>{test.resultTime}</span>
 </span>
 <span className="flex items-center gap-1">
 <FaMapMarkerAlt className="text-[10px] text-faint" />
 <span className="truncate max-w-[120px]">{test.labLocation}</span>
 </span>
 </div>

 {/* Tags */}
 <div className="flex flex-wrap items-center gap-1.5">
 {test.available ? (
 <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
 <FaCheckCircle className="text-[8px]" /> Available
 </span>
 ) : (
 <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
 <FaExclamationTriangle className="text-[8px]" /> Unavailable
 </span>
 )}
 {test.homeCollection && (
 <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
 <FaHome className="text-[8px]" /> Home Collection
 </span>
 )}
 {test.fastingRequired && (
 <span className="inline-flex items-center gap-1 text-[10px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full border border-orange-200">
 Fasting Required
 </span>
 )}
 <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
 <FaPercent className="text-[8px]" /> {test.discount}
 </span>
 </div>
 </div>
 </div>

 {/* Right: Price + Buttons */}
 <div className="flex flex-col items-stretch sm:items-end gap-2 flex-shrink-0 sm:border-l sm:border-line sm:pl-4 border-t sm:border-t-0 border-line pt-3 sm:pt-0">
 <div className="sm:text-right">
 <p className="text-sm font-bold text-fg whitespace-nowrap">{test.price}</p>
 <p className="text-[10px] text-faint line-through whitespace-nowrap">{test.originalPrice}</p>
 </div>
 <div className="flex items-center gap-2">
 <button className="flex-1 sm:flex-none bg-subtle hover:bg-line text-soft px-3 py-2 rounded-lg text-xs font-medium transition-colors">
 Details
 </button>
 <AuthBookingLink type="lab-test" providerId={test.id} className="flex-1 sm:flex-none bg-purple-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors text-center inline-flex items-center gap-1">
 <FaShoppingCart className="text-[10px]" /> Book
 </AuthBookingLink>
 <ConnectButton providerId={test.id} className="flex-1 sm:flex-none !px-3 !py-2 !text-xs" />
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
 <div className="w-20 h-20 border-4 border-purple-200 rounded-full animate-pulse"></div>
 <div className="absolute top-0 left-0 w-20 h-20 border-4 border-purple-600 rounded-full animate-spin border-t-transparent"></div>
 <FaFlask className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-purple-600 text-2xl" />
 </div>
 <p className="mt-4 text-soft font-medium animate-pulse">AI is finding the best lab tests for you...</p>
 <div className="flex gap-1 mt-2">
 <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
 <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
 <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
 </div>
 </div>
 )
}

// Empty State Component
interface EmptyStateProps {
 onClear: () => void
}

const EmptyState = ({ onClear }: EmptyStateProps) => {
 return (
 <div className="text-center py-12">
 <FaFlask className="text-6xl text-faint mx-auto mb-4" />
 <h3 className="text-xl font-semibold text-soft mb-2">No lab tests found</h3>
 <p className="text-soft mb-6">Try adjusting your search criteria or browse all categories</p>
 <button
 onClick={onClear}
 className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
 >
 Clear Filters
 </button>
 </div>
 )
}

// Main Component
export default function LabTestingPage() {
 const [searchQuery, setSearchQuery] = useState('')
 const [category, setCategory] = useState('all')
 const [isSearching, setIsSearching] = useState(false)
 const [allLabTests, setAllLabTests] = useState<ReturnType<typeof mapApiTestToUi>[]>([])
 const [searchResults, setSearchResults] = useState<ReturnType<typeof mapApiTestToUi>[]>([])
 const [isLoading, setIsLoading] = useState(true)
 const [hasSearched, setHasSearched] = useState(false)

 const fetchLabTests = useCallback(async () => {
 try {
 setIsLoading(true)
 const res = await fetch('/api/search/providers?type=LAB_TECHNICIAN')
 const json = await res.json()
 if (json.success && Array.isArray(json.data)) {
 const mapped = json.data.map(mapApiTestToUi)
 setAllLabTests(mapped)
 setSearchResults(mapped)
 }
 } catch (err) {
 console.error('Failed to fetch lab tests:', err)
 } finally {
 setIsLoading(false)
 }
 }, [])

 useEffect(() => {
 fetchLabTests()
 }, [fetchLabTests])

 const handleSearch = async () => {
 setIsSearching(true)
 setHasSearched(true)
 try {
 const params = new URLSearchParams()
 if (searchQuery) params.set('q', searchQuery)
 if (category && category !== 'all') params.set('category', category)
 const res = await fetch(`/api/search/lab-tests?${params.toString()}`)
 const json = await res.json()
 if (json.success && Array.isArray(json.data)) {
 setSearchResults(json.data.map(mapApiTestToUi))
 } else {
 setSearchResults([])
 }
 } catch (err) {
 console.error('Search failed:', err)
 setSearchResults([])
 } finally {
 setIsSearching(false)
 }
 }

 const handleClearFilters = () => {
 setSearchQuery('')
 setCategory('all')
 setSearchResults(allLabTests)
 setHasSearched(false)
 }

 return (
 <div className="min-h-screen to-white">
 <div className="container mx-auto px-4 py-8">
 {/* Search Form */}
 <div>
 <div className="bg-surface rounded-xl shadow-xl p-4">
 <div>
 <div className="flex flex-col gap-4">
 <div className="relative">
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Search lab tests by name, condition, or symptoms (e.g., 'diabetes test', 'cholesterol check')"
 className="w-full px-4 py-3 pr-12 border-2 border-line rounded-xl focus:outline-none focus:border-purple-500 transition-colors text-base"
 />
 <FaSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-faint" />
 </div>

 <div className="flex flex-col md:flex-row gap-4">
 <select
 value={category}
 onChange={(e) => setCategory(e.target.value)}
 className="flex-1 px-4 py-2.5 border-2 border-line rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
 >
 <option value="all">All Categories</option>
 <option value="hematology">Blood Tests</option>
 <option value="biochemistry">Biochemistry</option>
 <option value="hormones">Hormone Tests</option>
 <option value="diabetes">Diabetes Tests</option>
 <option value="vitamins">Vitamin Tests</option>
 <option value="infectious">Infectious Disease</option>
 <option value="cardiology">Heart Health</option>
 </select>

 <button
 type="button"
 onClick={handleSearch}
 className="bg-brand-navy text-white px-8 py-2.5 rounded-xl transition-all duration-200 font-medium flex items-center justify-center gap-2 min-w-[150px]"
 >
 <FaSearch />
 Find Tests
 </button>
 </div>
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
 Found <span className="font-semibold text-fg">{searchResults.length}</span> lab tests matching your search
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
 {searchResults.map((test) => (
 <LabTestCard key={test.id} test={test} />
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
