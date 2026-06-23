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
 FaVideo, FaHome, FaHospital, FaPhone, FaAmbulance, FaBoxOpen,
 FaHistory, FaTimes, FaTrash,
} from 'react-icons/fa'
import type { IconType } from 'react-icons'

// How a provider can be seen  derived from the serviceMode of the workflows
// linked to their services (the same source the booking modal reads). Only the
// modes a provider actually offers are shown on their card.
const MODE_META: Record<string, { label: string; Icon: IconType; cls: string }> = {
 office:    { label: 'At Office', Icon: FaHospital,  cls: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30' },
 home:      { label: 'At Home',   Icon: FaHome,      cls: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30' },
 video:     { label: 'Video',     Icon: FaVideo,     cls: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30' },
 audio:     { label: 'Phone',     Icon: FaPhone,     cls: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30' },
 emergency: { label: 'Emergency', Icon: FaAmbulance, cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30' },
 delivery:  { label: 'Delivery',  Icon: FaBoxOpen,   cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30' },
}

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
 serviceModes?: string[]
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
 <div className="bg-surface rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-line overflow-hidden">
 <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-3">
 <div className="flex items-start gap-3 flex-1 min-w-0">
 <div className="relative flex-shrink-0">
 {provider.profileImage ? (
 <Image src={provider.profileImage} alt={`${provider.firstName} ${provider.lastName}`}
 width={48} height={48}
 className={`rounded-full object-cover border-2 ${accentColor}`} />
 ) : (
 <div className={`w-12 h-12 rounded-full bg-[#0C6780]/10 flex items-center justify-center text-brand-teal dark:text-accent font-bold border-2 ${accentColor}`}>
 {provider.firstName[0]}{provider.lastName[0]}
 </div>
 )}
 {provider.verified && (
 <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white rounded-full p-0.5">
 <FaCheckCircle className="text-[10px]" />
 </div>
 )}
 </div>
 <div className="flex-1 min-w-0">
 <h3 className="text-sm font-bold text-fg truncate">
 {provider.firstName} {provider.lastName}
 </h3>
 {provider.specializations.length > 0 && (
 <p className="text-xs text-brand-teal dark:text-accent font-medium truncate mb-1">
 {provider.specializations.join(', ')}
 </p>
 )}
 <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-soft mb-1.5">
 {provider.address && (
 <span className="flex items-center gap-1">
 <FaMapMarkerAlt className="text-[10px] text-faint" />
 <span className="truncate max-w-[160px]">{provider.address}</span>
 </span>
 )}
 </div>
 {/* Real modes this provider offers, derived from their services' workflows */}
 {provider.serviceModes && provider.serviceModes.length > 0 && (
 <div className="flex flex-wrap items-center gap-1.5">
 {provider.serviceModes.map(mode => {
 const meta = MODE_META[mode]
 if (!meta) return null
 const Icon = meta.Icon
 return (
 <span key={mode} className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${meta.cls}`}>
 <Icon className="text-[8px]" /> {meta.label}
 </span>
 )
 })}
 </div>
 )}
 </div>
 </div>

 <div className="flex flex-col items-stretch sm:items-end gap-2 flex-shrink-0 sm:border-l sm:border-line sm:pl-4 border-t sm:border-t-0 border-line pt-3 sm:pt-0">
 <div className="flex items-center gap-2">
 <FavoriteButton providerId={provider.id} size="sm" />
 <Link href={`/search/${slug}/${provider.id}`} className="flex-1 sm:flex-none">
 <button className="w-full bg-subtle hover:bg-line text-soft hover:text-fg px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
 Details
 </button>
 </Link>
 <button onClick={onBook}
 className="flex-1 sm:flex-none bg-brand-navy dark:bg-accent dark:text-[#04121f] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#0C6780] dark:hover:bg-[#5fc7e6] transition-colors text-center">
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
 setHasSearched(true)
 setShowHistory(false)

 // Update the URL FIRST, synchronously  the query must be reflected in the
 // address bar immediately (shareable/back-button correct) and must not be
 // gated behind the results fetch, which can be slow on a cold start.
 const params = new URLSearchParams()
 if (searchQuery) params.set('q', searchQuery)
 if (serviceId) { params.set('serviceId', serviceId); if (serviceName) params.set('serviceName', serviceName) }
 const qs = params.toString()
 router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
 if (searchQuery.trim()) addToHistory(searchQuery, config.slug)

 // Then fetch results  a slow or failing request must not break the URL update.
 setIsLoading(true)
 try {
 const data = await fetchProviders(searchQuery, serviceId)
 setAllProviders(data)
 setSearchResults(applyFilters(data, searchQuery))
 } catch {
 setSearchResults([])
 } finally {
 setIsLoading(false)
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
 <div className="bg-surface border border-line rounded-xl shadow-xl p-4">
 <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
 <div className="relative flex-1">
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => { setSearchQuery(e.target.value); setShowHistory(true) }}
 onFocus={() => !searchQuery && setShowHistory(true)}
 onBlur={() => setTimeout(() => setShowHistory(false), 200)}
 placeholder={`Search ${config.singularLabel.toLowerCase()}s by name, specialty, or location...`}
 className="w-full px-4 py-3 pr-12 bg-surface text-fg border-2 border-line rounded-xl focus:outline-none focus:border-brand-teal transition-colors text-base placeholder:text-faint"
 />
 <FaSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-faint" />

 {/* Search History Dropdown */}
 {showHistory && history.length > 0 && !searchQuery && (
 <div className="absolute z-50 w-full mt-2 bg-surface rounded-xl shadow-xl border border-line overflow-hidden">
 <div className="flex items-center justify-between px-4 py-2 border-b border-line">
 <span className="text-xs font-medium text-soft flex items-center gap-1.5">
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
 className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-subtle transition text-sm text-soft group cursor-pointer focus:outline-none focus:bg-subtle"
 >
 <span className="flex items-center gap-2">
 <FaHistory className="text-xs text-faint" /> {entry.query}
 </span>
 <button type="button" onMouseDown={e => e.preventDefault()}
 onClick={e => { e.stopPropagation(); removeFromHistory(entry.query) }}
 aria-label={`Remove ${entry.query} from history`}
 className="text-faint hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
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
 <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#0C6780]/20 dark:border-accent/30 bg-[#0C6780]/5 dark:bg-accent/10 px-4 py-3">
 <p className="text-sm text-soft">
 Showing {config.singularLabel.toLowerCase()}s who offer
 {serviceName ? <span className="font-semibold text-[#0C6780] dark:text-accent"> {serviceName}</span> : ' the selected service'}
 </p>
 <button
 onClick={clearServiceFilter}
 className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0C6780] dark:text-accent hover:underline cursor-pointer"
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
 <p className="text-soft">
 Found <span className="font-semibold text-fg">{searchResults.length}</span> {config.singularLabel.toLowerCase()}s matching your criteria
 </p>
 <button onClick={handleClearFilters} className="text-brand-teal dark:text-accent hover:underline font-medium">
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
 <div className="min-h-screen flex items-center justify-center">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0C6780] dark:border-accent" />
 </div>
 }>
 <ProviderSearchContent config={config} />
 </Suspense>
 )
}
