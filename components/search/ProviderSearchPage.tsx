'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import Image from 'next/image'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import ConnectButton from '@/components/search/ConnectButton'
import FavoriteButton from '@/components/shared/FavoriteButton'
import { SearchResultsSkeleton, NoResults } from '@/components/search/SearchResults'
import { useSearchHistory } from '@/hooks/useSearchHistory'
import {
 FaSearch, FaMapMarkerAlt, FaCheckCircle,
 FaVideo, FaHome, FaClock,
 FaHistory, FaTimes, FaTrash,
} from 'react-icons/fa'

const CreateBookingModal = dynamic(() => import('@/components/shared/CreateBookingModal'), { ssr: false })
const NearbyMap = dynamic(() => import('@/components/search/NearbyMap'), { ssr: false })

interface Provider {
 id: string
 firstName: string
 lastName: string
 profileImage: string | null
 address: string | null
 verified: boolean
 specializations: string[]
}

interface ProviderSearchPageConfig {
 providerType: string
 title: string
 singularLabel: string
 slug: string
 accentColor?: string
}

const ProviderCard = ({ provider, slug, accentColor, onBook }: { provider: Provider; slug: string; accentColor: string; onBook: () => void }) => {
 return (
 <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden">
 <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-3">
 <div className="flex items-start gap-3 flex-1 min-w-0">
 <div className="relative flex-shrink-0">
 {provider.profileImage ? (
 <Image src={provider.profileImage} alt={`${provider.firstName} ${provider.lastName}`}
 width={48} height={48}
 className={`rounded-full object-cover border-2 ${accentColor}`} />
 ) : (
 <div className={`w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-brand-teal font-bold border-2 ${accentColor}`}>
 {provider.firstName[0]}{provider.lastName[0]}
 </div>
 )}
 {provider.verified && (
 <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 text-white rounded-full p-0.5">
 <FaCheckCircle className="text-[10px]" />
 </div>
 )}
 </div>
 <div className="flex-1 min-w-0">
 <h3 className="text-sm font-bold text-gray-900 truncate">
 {provider.firstName} {provider.lastName}
 </h3>
 {provider.specializations.length > 0 && (
 <p className="text-xs text-brand-teal font-medium truncate mb-1">
 {provider.specializations.join(', ')}
 </p>
 )}
 <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-1.5">
 {provider.address && (
 <span className="flex items-center gap-1">
 <FaMapMarkerAlt className="text-[10px] text-gray-400" />
 <span className="truncate max-w-[160px]">{provider.address}</span>
 </span>
 )}
 </div>
 <div className="flex flex-wrap items-center gap-1.5">
 <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
 <FaHome className="text-[8px]" /> In-Person
 </span>
 <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
 <FaVideo className="text-[8px]" /> Video
 </span>
 <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
 <FaClock className="text-[8px]" /> Available
 </span>
 </div>
 </div>
 </div>

 <div className="flex flex-col items-stretch sm:items-end gap-2 flex-shrink-0 sm:border-l sm:border-gray-100 sm:pl-4 border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0">
 <div className="flex items-center gap-2">
 <FavoriteButton providerId={provider.id} size="sm" />
 <Link href={`/search/${slug}/${provider.id}`} className="flex-1 sm:flex-none">
 <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
 Details
 </button>
 </Link>
 <button onClick={onBook}
 className="flex-1 sm:flex-none bg-brand-navy text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors text-center">
 Book
 </button>
 <ConnectButton providerId={provider.id} className="flex-1 sm:flex-none !px-4 !py-2.5 !text-sm" />
 </div>
 </div>
 </div>
 </div>
 )
}

function ProviderSearchContent({ config }: { config: ProviderSearchPageConfig }) {
 const searchParams = useSearchParams()
 const router = useRouter()
 const pathname = usePathname()

 const initialQuery = searchParams.get('q') || ''
 const initialSpecialty = searchParams.get('specialty') || ''
 const initialServiceId = searchParams.get('serviceId') || ''
 const initialServiceName = searchParams.get('serviceName') || ''

 const [searchQuery, setSearchQuery] = useState(initialQuery)
 const [serviceId, setServiceId] = useState(initialServiceId)
 const [serviceName, setServiceName] = useState(initialServiceName)
 const [isLoading, setIsLoading] = useState(true)
 const [searchResults, setSearchResults] = useState<Provider[]>([])
 const [allProviders, setAllProviders] = useState<Provider[]>([])
 const [hasSearched, setHasSearched] = useState(!!initialQuery)

 // Re-sync state from URL params after Suspense hydration / back-forward navigation
 useEffect(() => {
   const q = searchParams.get('q') || ''
   setSearchQuery(q)
   setHasSearched(!!q)
   setServiceId(searchParams.get('serviceId') || '')
   setServiceName(searchParams.get('serviceName') || '')
 }, [searchParams])
 const [showHistory, setShowHistory] = useState(false)

 // Booking modal state
 const [bookingModalOpen, setBookingModalOpen] = useState(false)
 const [bookingProvider, setBookingProvider] = useState<Provider | null>(null)

 const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory()

 const fetchProviders = useCallback(async (query = '', svcId = '') => {
 const params = new URLSearchParams({ type: config.providerType })
 if (query) params.set('q', query)
 if (svcId) params.set('serviceId', svcId)
 const res = await fetch(`/api/search/providers?${params.toString()}`)
 const json = await res.json()
 return json.success ? json.data : []
 }, [config.providerType])

 useEffect(() => {
 fetchProviders(initialQuery, initialServiceId).then((data: Provider[]) => {
 setAllProviders(data)
 let filtered = data
 if (initialSpecialty) {
 filtered = filtered.filter(p =>
 p.specializations.some(s => s.toLowerCase().includes(initialSpecialty.toLowerCase()))
 )
 }
 setSearchResults(filtered)
 setIsLoading(false)
 })
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [])

 const applyFilters = useCallback((providers: Provider[], q: string) => {
 if (!q) return providers
 const lq = q.toLowerCase()
 return providers.filter(p =>
 p.firstName.toLowerCase().includes(lq) ||
 p.lastName.toLowerCase().includes(lq) ||
 p.specializations.some(s => s.toLowerCase().includes(lq)) ||
 (p.address || '').toLowerCase().includes(lq)
 )
 }, [])

 const handleSearch = async (e?: React.FormEvent) => {
 e?.preventDefault()
 setIsLoading(true)
 setHasSearched(true)
 setShowHistory(false)

 const data = await fetchProviders(searchQuery, serviceId)
 setAllProviders(data)
 const filtered = applyFilters(data, searchQuery)
 setSearchResults(filtered)
 setIsLoading(false)

 const params = new URLSearchParams()
 if (searchQuery) params.set('q', searchQuery)
 if (serviceId) { params.set('serviceId', serviceId); if (serviceName) params.set('serviceName', serviceName) }
 const qs = params.toString()
 router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })

 if (searchQuery.trim()) {
 addToHistory(searchQuery, config.slug)
 }
 }

 const handleClearFilters = () => {
 setSearchQuery('')
 setSearchResults(allProviders)
 setHasSearched(false)
 router.replace(pathname, { scroll: false })
 }

 // Remove the active service filter and reload the full provider list.
 const clearServiceFilter = async () => {
 setServiceId('')
 setServiceName('')
 setIsLoading(true)
 const data = await fetchProviders(searchQuery)
 setAllProviders(data)
 setSearchResults(applyFilters(data, searchQuery))
 setIsLoading(false)
 const params = new URLSearchParams()
 if (searchQuery) params.set('q', searchQuery)
 const qs = params.toString()
 router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
 }

 const handleHistoryClick = (entry: { query: string }) => {
 setSearchQuery(entry.query)
 setShowHistory(false)
 setTimeout(() => {
 const btn = document.getElementById(`${config.slug}-search-btn`)
 if (btn) btn.click()
 }, 50)
 }

 const handleBook = (provider: Provider) => {
 setBookingProvider(provider)
 setBookingModalOpen(true)
 }

 return (
 <div className="min-h-screen to-white">
 <div className="container mx-auto px-4 py-8">
 {/* Search Form */}
 <div className="relative z-10">
 <div className="bg-white rounded-xl shadow-xl p-4">
 <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
 <div className="relative flex-1">
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => { setSearchQuery(e.target.value); setShowHistory(true) }}
 onFocus={() => !searchQuery && setShowHistory(true)}
 onBlur={() => setTimeout(() => setShowHistory(false), 200)}
 placeholder={`Search ${config.singularLabel.toLowerCase()}s by name, specialty, or location...`}
 className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-teal transition-colors text-base"
 />
 <FaSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />

 {/* Search History Dropdown */}
 {showHistory && history.length > 0 && !searchQuery && (
 <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
 <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
 <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
 <FaHistory className="text-[10px]" /> Recent Searches
 </span>
 <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => clearHistory()}
 className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
 <FaTrash className="text-[10px]" /> Clear
 </button>
 </div>
 {history.map((entry, i) => (
 // Outer div (not button) - HTML forbids button-in-button. Click is
 // still keyboard-accessible via role + tabIndex, and the inner
 // "remove" button no longer causes a hydration error.
 <div
 key={i}
 role="button"
 tabIndex={0}
 onMouseDown={e => e.preventDefault()}
 onClick={() => handleHistoryClick(entry)}
 onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleHistoryClick(entry) } }}
 className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 transition text-sm text-gray-700 group cursor-pointer focus:outline-none focus:bg-gray-100"
 >
 <span className="flex items-center gap-2">
 <FaHistory className="text-xs text-gray-300" /> {entry.query}
 </span>
 <button type="button" onMouseDown={e => e.preventDefault()}
 onClick={e => { e.stopPropagation(); removeFromHistory(entry.query) }}
 aria-label={`Remove ${entry.query} from history`}
 className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
 <FaTimes className="text-xs" />
 </button>
 </div>
 ))}
 </div>
 )}
 </div>

 <button
 id={`${config.slug}-search-btn`}
 type="submit"
 disabled={isLoading}
 className="bg-brand-navy text-white px-6 py-3 rounded-xl transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 whitespace-nowrap"
 >
 {isLoading ? (
 <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Searching...</>
 ) : (
 <><FaSearch /> Search</>
 )}
 </button>
 </form>
 </div>
 </div>

 {/* Active service filter banner - carried over from the Services page */}
 {serviceId && (
 <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#0C6780]/20 bg-[#0C6780]/5 px-4 py-3">
 <p className="text-sm text-gray-700">
 Showing {config.singularLabel.toLowerCase()}s who offer
 {serviceName ? <span className="font-semibold text-[#0C6780]"> {serviceName}</span> : ' the selected service'}
 </p>
 <button
 onClick={clearServiceFilter}
 className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0C6780] hover:text-[#001E40] cursor-pointer"
 >
 <FaTimes className="text-[10px]" /> Clear service filter
 </button>
 </div>
 )}

 {/* Find nearest with geolocation - the final-step map */}
 <div className="mt-6">
 <NearbyMap mode="providers" type={config.providerType} noun={`${config.singularLabel.toLowerCase()}s`} accentColor="#0C6780" />
 </div>

 {/* Results */}
 <div className="flex-1 min-w-0 mt-2">
 {isLoading ? (
 <SearchResultsSkeleton />
 ) : searchResults.length > 0 ? (
 <>
 {hasSearched && (
 <div className="mb-6 flex items-center justify-between">
 <p className="text-gray-600">
 Found <span className="font-semibold text-gray-900">{searchResults.length}</span> {config.singularLabel.toLowerCase()}s matching your criteria
 </p>
 <button onClick={handleClearFilters} className="text-brand-teal hover:text-blue-700 font-medium">
 Clear filters
 </button>
 </div>
 )}
 <div className="flex flex-col gap-4">
 {searchResults.map(provider => (
 <ProviderCard
 key={provider.id}
 provider={provider}
 slug={config.slug}
 accentColor={config.accentColor || 'border-blue-100'}
 onBook={() => handleBook(provider)}
 />
 ))}
 </div>
 </>
 ) : (hasSearched || serviceId) ? (
 <NoResults query={searchQuery || serviceName} onClear={serviceId ? clearServiceFilter : handleClearFilters} />
 ) : null}
 </div>
 </div>

 {/* Booking Modal - opens with provider pre-selected */}
 {bookingModalOpen && bookingProvider && (
 <CreateBookingModal
 isOpen={bookingModalOpen}
 onClose={() => { setBookingModalOpen(false); setBookingProvider(null) }}
 onCreated={() => { setBookingModalOpen(false); setBookingProvider(null) }}
 defaultProviderType={config.providerType}
 defaultProvider={{ id: bookingProvider.id, firstName: bookingProvider.firstName, lastName: bookingProvider.lastName }}
 />
 )}
 </div>
 )
}

export default function ProviderSearchPage({ config }: { config: ProviderSearchPageConfig }) {
 return (
 <Suspense fallback={
 <div className="min-h-screen to-white flex items-center justify-center">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
 </div>
 }>
 <ProviderSearchContent config={config} />
 </Suspense>
 )
}
