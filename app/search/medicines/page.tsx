'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { FaSearch, FaPills, FaStar, FaMapMarkerAlt, FaTruck, FaCheckCircle, FaShoppingCart, FaLock, FaExclamationTriangle, FaPercent, FaTrash, FaHistory, FaTimes } from 'react-icons/fa'
import { useCart } from '@/app/search/medicines/contexts/CartContext'
import { useSearchHistory } from '@/hooks/useSearchHistory'
import PrescriptionUploadModal from '@/components/shared/PrescriptionUploadModal'

// Medicine UI interface (mapped from API response)
interface MedicineUi {
 id: number
 name: string
 brand: string
 genericName: string
 category: string
 type: string
 price: number
 originalPrice: number
 discount: string
 rating: number
 reviews: number
 inStock: boolean
 quantity: number
 stockQuantity: number
 description: string
 image: string
 manufacturer: string
 expiryDate: string
 prescriptionRequired: boolean
 activeIngredient: string
 sideEffects: string[]
 dosage: string
 maxDailyDose: string
 contraindications: string[]
 storage: string
 deliveryTime: string
 fastDelivery: boolean
 verified: boolean
 pharmacyLocation: string
 features: string[]
 stockStatus: string
 [key: string]: unknown // Allow passing to MedicineInput which requires index signature
}

interface MedicineProps {
 medicine: MedicineUi
 onAddRx: (medicine: MedicineUi) => void
}

const MedicineCard = ({ medicine, onAddRx }: MedicineProps) => {
 const { addToCart, cartItems } = useCart()
 const itemInCart = cartItems.find(item => item.id === medicine.id)
 const quantityInCart = itemInCart?.quantity || 0

 return (
 <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden">
 <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-3">
 {/* Left: Image + Info */}
 <div className="flex items-start gap-3 flex-1 min-w-0">
 <div className="relative flex-shrink-0">
 <div
 className="w-12 h-12 rounded-lg border-2 border-blue-100 flex items-center justify-center"
 style={{ backgroundImage: `url(${medicine.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
 >
 <FaPills className="text-xl text-blue-400 opacity-0" />
 </div>
 {medicine.verified && (
 <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 text-white rounded-full p-0.5">
 <FaCheckCircle className="text-[10px]" />
 </div>
 )}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-0.5 flex-wrap">
 <h3 className="text-sm font-bold text-gray-900 truncate">{medicine.name}</h3>
 <span className="text-[10px] px-2 py-0.5 rounded-full font-medium border whitespace-nowrap bg-blue-50 text-blue-700 border-blue-200">
 {medicine.category}
 </span>
 {medicine.prescriptionRequired && (
 <span className="text-[10px] px-2 py-0.5 rounded-full font-medium border whitespace-nowrap bg-red-50 text-red-700 border-red-200">
 <FaLock className="inline text-[8px] mr-0.5" /> Rx
 </span>
 )}
 </div>
 <p className="text-xs text-blue-600 font-medium truncate mb-1">
 {medicine.brand} &middot; {medicine.genericName}
 </p>

 {/* Meta row */}
 <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-1.5">
 <span className="flex items-center gap-1">
 <FaStar className="text-yellow-500 text-[10px]" />
 <span className="font-semibold text-gray-700">{medicine.rating.toFixed(1)}</span>
 <span className="text-gray-400">({medicine.reviews})</span>
 </span>
 <span className="flex items-center gap-1">
 <FaTruck className="text-[10px] text-gray-400" />
 <span>{medicine.deliveryTime}</span>
 </span>
 <span className="flex items-center gap-1">
 <FaMapMarkerAlt className="text-[10px] text-gray-400" />
 <span className="truncate max-w-[120px]">{medicine.pharmacyLocation}</span>
 </span>
 </div>

 {/* Tags */}
 <div className="flex flex-wrap items-center gap-1.5">
 {medicine.inStock ? (
 <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
 <FaCheckCircle className="text-[8px]" /> In Stock ({medicine.stockQuantity})
 </span>
 ) : (
 <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
 <FaExclamationTriangle className="text-[8px]" /> Out of Stock
 </span>
 )}
 {medicine.fastDelivery && (
 <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
 <FaTruck className="text-[8px]" /> Fast Delivery
 </span>
 )}
 <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
 <FaPercent className="text-[8px]" /> {medicine.discount}
 </span>
 </div>
 </div>
 </div>

 {/* Right: Price + Buttons */}
 <div className="flex flex-col items-stretch sm:items-end gap-2 flex-shrink-0 sm:border-l sm:border-gray-100 sm:pl-4 border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0">
 <div className="sm:text-right">
 <p className="text-sm font-bold text-gray-900 whitespace-nowrap">Rs {medicine.price}</p>
 <p className="text-[10px] text-gray-400 line-through whitespace-nowrap">Rs {medicine.originalPrice}</p>
 </div>
 <div className="flex items-center gap-2">
 <button className="flex-1 sm:flex-none bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-medium transition-colors">
 Details
 </button>
 {quantityInCart > 0 ? (
 <span className="flex-1 sm:flex-none bg-green-100 text-green-700 px-3 py-2 rounded-lg text-xs font-medium text-center">
 In Cart ({quantityInCart})
 </span>
 ) : (
 <button
 onClick={() => medicine.prescriptionRequired ? onAddRx(medicine) : addToCart(medicine)}
 disabled={!medicine.inStock}
 className="flex-1 sm:flex-none bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1"
 >
 <FaShoppingCart className="text-[10px]" /> Add
 </button>
 )}
 </div>
 </div>
 </div>
 </div>
 )
}

// API response shape for medicines
interface ApiMedicine {
 id: number
 name: string
 pharmacy?: string
 genericName?: string
 category: string
 requiresPrescription?: boolean
 price: number | string
 inStock?: boolean
 quantity?: number
 description?: string
 imageUrl?: string
 sideEffects?: string[]
 strength?: string
 dosageForm?: string
 pharmacist?: { verified?: boolean }
}

// Map API response items to the shape the UI expects
const mapApiMedicine = (item: ApiMedicine): MedicineUi => {
 const price = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0
 const qty = item.quantity ?? 0
 return {
 id: item.id,
 name: item.name,
 brand: item.pharmacy || 'Unknown Pharmacy',
 genericName: item.genericName || '',
 category: item.category,
 type: item.requiresPrescription ? 'Prescription' : 'Over-the-counter',
 price,
 originalPrice: price, // No fake markup
 discount: '',
 rating: 0, // No fake rating — should come from reviews API
 reviews: 0,
 inStock: (item.inStock ?? false) && qty > 0,
 quantity: qty,
 stockQuantity: qty,
 description: item.description || '',
 image: item.imageUrl || 'https://via.placeholder.com/150x150/4F46E5/ffffff?text=Pills',
 manufacturer: item.pharmacy || '',
 expiryDate: '',
 prescriptionRequired: item.requiresPrescription ?? false,
 activeIngredient: item.genericName || item.name,
 sideEffects: item.sideEffects || [],
 dosage: item.strength || '',
 maxDailyDose: '',
 contraindications: [] as string[],
 storage: 'Store in cool, dry place',
 deliveryTime: '',
 fastDelivery: false,
 verified: item.pharmacist?.verified ?? false,
 pharmacyLocation: item.pharmacy || 'Mauritius',
 features: [item.dosageForm, item.strength, item.category].filter((v): v is string => Boolean(v)),
 stockStatus: qty > 10 ? 'In Stock' : qty > 0 ? `Only ${qty} left` : 'Out of Stock',
 }
}

// Fetch medicines from API with optional search params
const aiSearchMedicines = async (query: string, category: string) => {
 try {
 const params = new URLSearchParams()
 if (query) params.set('q', query)
 if (category && category !== 'all') params.set('category', category)
 const res = await fetch(`/api/search/medicines?${params.toString()}`)
 const json = await res.json()
 if (json.success && Array.isArray(json.data)) {
 return json.data.map(mapApiMedicine)
 }
 return []
 } catch (error) {
 console.error('Error searching medicines:', error)
 return []
 }
}

// Loading Animation Component
const LoadingAnimation = () => {
 return (
 <div className="flex flex-col items-center justify-center py-12">
 <div className="relative">
 <div className="w-20 h-20 border-4 border-green-200 rounded-full animate-pulse"></div>
 <div className="absolute top-0 left-0 w-20 h-20 border-4 border-green-600 rounded-full animate-spin border-t-transparent"></div>
 <FaPills className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-green-600 text-2xl" />
 </div>
 <p className="mt-4 text-gray-600 font-medium animate-pulse">AI is finding the best medicines for you...</p>
 <div className="flex gap-1 mt-2">
 <span className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
 <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
 <span className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
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
 <FaPills className="text-6xl text-gray-300 mx-auto mb-4" />
 <h3 className="text-xl font-semibold text-gray-700 mb-2">No medicines found</h3>
 <p className="text-gray-500 mb-6">Try adjusting your search criteria or browse all categories</p>
 <button 
 onClick={onClear}
 className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
 >
 Clear Filters
 </button>
 </div>
 )
}

// Main Component
function MedicinesContent() {
 const searchParams = useSearchParams()
 const router = useRouter()
 const pathname = usePathname()

 const initialQuery = searchParams.get('q') || ''
 const initialCategory = searchParams.get('category') || 'all'

 const [searchQuery, setSearchQuery] = useState(initialQuery)
 const [category, setCategory] = useState(initialCategory)
 const [isSearching, setIsSearching] = useState(false)
 const [allMedicines, setAllMedicines] = useState<MedicineUi[]>([])
 const [isLoading, setIsLoading] = useState(true)
 const [searchResults, setSearchResults] = useState<MedicineUi[]>([])
 const [hasSearched, setHasSearched] = useState(!!initialQuery)
 const [showHistory, setShowHistory] = useState(false)

 const [rxMedicine, setRxMedicine] = useState<MedicineUi | null>(null)

 const { addToCart } = useCart()
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory()

 const updateUrl = useCallback((q: string, cat: string) => {
 const params = new URLSearchParams()
 if (q) params.set('q', q)
 if (cat && cat !== 'all') params.set('category', cat)
 const qs = params.toString()
 router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
 }, [router, pathname])

 const fetchMedicines = useCallback(async () => {
 setIsLoading(true)
 try {
 const params = new URLSearchParams()
 if (initialQuery) params.set('q', initialQuery)
 if (initialCategory && initialCategory !== 'all') params.set('category', initialCategory)
 const res = await fetch(`/api/search/medicines?${params.toString()}`)
 const json = await res.json()
 if (json.success && Array.isArray(json.data)) {
 const mapped = json.data.map(mapApiMedicine)
 setAllMedicines(mapped)
 setSearchResults(mapped)
 }
 } catch (error) {
 console.error('Error fetching medicines:', error)
 } finally {
 setIsLoading(false)
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [])

 useEffect(() => {
 fetchMedicines()
 }, [fetchMedicines])

 const handleSearch = async (e?: React.FormEvent) => {
 e?.preventDefault()
 setIsSearching(true)
 setHasSearched(true)
 setShowHistory(false)

 const results = await aiSearchMedicines(searchQuery, category)
 setSearchResults(results)
 setIsSearching(false)
 updateUrl(searchQuery, category)

 if (searchQuery.trim()) {
 addToHistory(searchQuery, 'medicines')
 }
 }

 const handleClearFilters = () => {
 setSearchQuery('')
 setCategory('all')
 setSearchResults(allMedicines)
 setHasSearched(false)
 router.replace(pathname, { scroll: false })
 }

 const handleHistoryClick = (entry: { query: string }) => {
 setSearchQuery(entry.query)
 setShowHistory(false)
 setTimeout(() => {
 const btn = document.getElementById('medicine-search-btn')
 if (btn) btn.click()
 }, 50)
 }

 return (
 <div className="min-h-screen to-white">
 <div className="container mx-auto px-4 py-8">
 <div>
 <div className="bg-white rounded-xl shadow-xl p-4">
 <form onSubmit={handleSearch}>
 <div className="flex flex-col gap-4">
 <div className="relative">
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => { setSearchQuery(e.target.value); setShowHistory(true) }}
 onFocus={() => !searchQuery && setShowHistory(true)}
 onBlur={() => setTimeout(() => setShowHistory(false), 200)}
 placeholder="Search medicines by name, condition, or symptoms (e.g., 'headache medicine', 'diabetes pills')"
 className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors text-base"
 />
 <FaSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />

 {/* Search History Dropdown */}
 {showHistory && history.length > 0 && !searchQuery && (
 <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
 <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
 <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
 <FaHistory className="text-[10px]" />
 Recent Searches
 </span>
 <button
 type="button"
 onMouseDown={e => e.preventDefault()}
 onClick={() => clearHistory()}
 className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
 >
 <FaTrash className="text-[10px]" />
 Clear
 </button>
 </div>
 {history.map((entry, i) => (
 <button
 key={i}
 type="button"
 onMouseDown={e => e.preventDefault()}
 onClick={() => handleHistoryClick(entry)}
 className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 transition text-sm text-gray-700 group"
 >
 <span className="flex items-center gap-2">
 <FaHistory className="text-xs text-gray-300" />
 {entry.query}
 </span>
 <button
 type="button"
 onMouseDown={e => e.preventDefault()}
 onClick={e => { e.stopPropagation(); removeFromHistory(entry.query) }}
 className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
 >
 <FaTimes className="text-xs" />
 </button>
 </button>
 ))}
 </div>
 )}
 </div>

 <div className="flex flex-col md:flex-row gap-4">
 <select
 value={category}
 onChange={(e) => setCategory(e.target.value)}
 className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors"
 >
 <option value="all">All Categories</option>
 <option value="prescription">Prescription Medicines (Rx)</option>
 <option value="otc">OTC Medicines</option>
 <option value="pain relief">Pain Relief</option>
 <option value="antibiotics">Antibiotics</option>
 <option value="diabetes">Diabetes</option>
 <option value="heart">Heart Health</option>
 <option value="children">Children&apos;s Health</option>
 <option value="vitamins">Vitamins & Supplements</option>
 <option value="digestive">Digestive Health</option>
 <option value="skin">Skin & Dermatology</option>
 <option value="eye">Eye Care</option>
 <option value="dental">Dental Care</option>
 <option value="mental">Mental Health</option>
 <option value="fitness">Fitness & Wellness</option>
 </select>

 <button
 id="medicine-search-btn"
 type="submit"
 className="bg-brand-navy text-white px-8 py-2.5 rounded-xl transition-all duration-200 font-medium flex items-center justify-center gap-2 min-w-[150px]"
 >
 <FaSearch />
 Find Medicine
 </button>
 </div>
 </div>
 </form>
 </div>
 </div>
 
 {/* Results Section */}
 <div className="mt-12">
 {isLoading || isSearching ? (
 <LoadingAnimation />
 ) : searchResults.length > 0 ? (
 <>
 {hasSearched && (
 <div className="mb-6 flex items-center justify-between">
 <p className="text-gray-600">
 Found <span className="font-semibold text-gray-900">{searchResults.length}</span> medicines matching your search
 </p>
 <button
 onClick={handleClearFilters}
 className="text-green-600 hover:text-green-700 font-medium"
 >
 Clear filters
 </button>
 </div>
 )}
 
 <div className="flex flex-col gap-4">
 {searchResults.map((medicine) => (
 <MedicineCard key={medicine.id} medicine={medicine} onAddRx={setRxMedicine} />
 ))}
 </div>
 </>
 ) : hasSearched ? (
 <EmptyState onClear={handleClearFilters} />
 ) : null}
 </div>

 {rxMedicine && (
  <PrescriptionUploadModal
   medicineName={rxMedicine.name}
   onConfirm={() => { addToCart(rxMedicine); setRxMedicine(null) }}
   onClose={() => setRxMedicine(null)}
  />
 )}
 </div>
 </div>
 )
}

export default function MedicinesPage() {
 return (
 <Suspense fallback={
 <div className="min-h-screen to-white flex items-center justify-center">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
 </div>
 }>
 <MedicinesContent />
 </Suspense>
 )
}