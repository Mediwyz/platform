'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
 FaStar, FaMapMarkerAlt, FaCheckCircle, FaVideo, FaHome,
 FaExclamationCircle, FaLanguage, FaClock, FaSearch,
 FaChevronLeft, FaChevronRight, FaUserMd, FaUserNurse,
 FaBaby, FaPills,
} from 'react-icons/fa'
// UnifiedSearchResult moved out of the legacy /api/search route during the NestJS migration.
// Defaults make the consumer code safe even when the backend omits a field.
export interface UnifiedSearchResult {
  id: string
  type: string
  name: string
  specialty: string[]
  rating: number
  reviewCount: number
  reviews?: number
  city: string
  location?: string
  consultationFee: number
  hourlyRate?: number
  fee?: number
  imageUrl?: string
  profileImage?: string
  experience?: number
  verified?: boolean
  available?: boolean
  nextAvailable: string
  videoEnabled?: boolean
  emergencyAvailable?: boolean
  homeService?: boolean
  languages: string[]
  consultationTypes: string[]
  videoConsultationFee?: number
  detailHref?: string
  bio?: string
  url: string
  searchEnabled?: boolean
}

// ---- Loading Skeleton ----

function ResultCardSkeleton() {
 return (
 <div className="bg-surface rounded-xl shadow-sm border border-line p-4 animate-pulse flex items-center gap-4">
 <div className="w-14 h-14 rounded-full bg-line flex-shrink-0" />
 <div className="flex-1 min-w-0">
 <div className="h-5 bg-line rounded w-1/3 mb-2" />
 <div className="h-4 bg-line rounded w-1/4 mb-2" />
 <div className="h-3 bg-line rounded w-1/2" />
 </div>
 <div className="flex flex-col gap-2 flex-shrink-0">
 <div className="h-8 bg-line rounded w-20" />
 <div className="h-8 bg-line rounded w-20" />
 </div>
 </div>
 )
}

export function SearchResultsSkeleton({ count = 6 }: { count?: number }) {
 return (
 <div className="flex flex-col gap-3">
 {Array.from({ length: count }).map((_, i) => (
 <ResultCardSkeleton key={i} />
 ))}
 </div>
 )
}

// ---- No Results State ----

interface NoResultsProps {
 query: string
 onClear: () => void
}

export function NoResults({ query, onClear }: NoResultsProps) {
 return (
 <div className="text-center py-16">
 <FaSearch className="text-6xl text-gray-200 mx-auto mb-4" />
 <h3 className="text-xl font-semibold text-soft mb-2">No results found</h3>
 <p className="text-soft mb-6 max-w-md mx-auto">
 {query
 ? `We couldn't find anything matching "${query}". Try different keywords or adjust your filters.`
 : 'Use the search bar above to find doctors, nurses, medicines, and more.'}
 </p>
 {query && (
 <button
 onClick={onClear}
 className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
 >
 Clear Filters
 </button>
 )}
 </div>
 )
}

// ---- Result Card ----

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; badge: string; badgeColor: string }> = {
 doctor: {
 icon: <FaUserMd className="text-blue-600" />,
 badge: 'Doctor',
 badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
 },
 nurse: {
 icon: <FaUserNurse className="text-teal-600" />,
 badge: 'Nurse',
 badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
 },
 nanny: {
 icon: <FaBaby className="text-pink-600" />,
 badge: 'Childcare',
 badgeColor: 'bg-pink-50 text-pink-700 border-pink-200',
 },
 medicine: {
 icon: <FaPills className="text-green-600" />,
 badge: 'Medicine',
 badgeColor: 'bg-green-50 text-green-700 border-green-200',
 },
}

function ResultCard({ result }: { result: UnifiedSearchResult }) {
 const config = TYPE_CONFIG[result.type] || TYPE_CONFIG.doctor

 return (
 <div className="bg-surface rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-line overflow-hidden">
 <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
 {/* Left: Avatar + Info */}
 <div className="flex items-start gap-3 flex-1 min-w-0">
 {/* Avatar */}
 <div className="relative flex-shrink-0">
 {result.profileImage ? (
 <Image
 src={result.profileImage}
 alt={result.name}
 width={52}
 height={52}
 className="rounded-full object-cover border-2 border-line"
 />
 ) : (
 <div className="w-13 h-13 rounded-full bg-subtle flex items-center justify-center text-xl text-faint" style={{ width: 52, height: 52 }}>
 {config.icon}
 </div>
 )}
 {result.verified && (
 <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 text-white rounded-full p-0.5">
 <FaCheckCircle className="text-[10px]" />
 </div>
 )}
 </div>

 {/* Info */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-0.5">
 <h3 className="text-sm font-bold text-fg truncate">{result.name}</h3>
 <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border whitespace-nowrap ${config.badgeColor}`}>
 {config.badge}
 </span>
 </div>
 <p className="text-xs text-blue-600 font-medium truncate mb-1">
 {result.specialty.slice(0, 2).join(', ')}
 </p>

 {/* Meta row: rating, location, languages */}
 <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-soft">
 {result.rating > 0 && (
 <span className="flex items-center gap-1">
 <FaStar className="text-yellow-500 text-[10px]" />
 <span className="font-semibold text-soft">{result.rating.toFixed(1)}</span>
 {result.reviewCount > 0 && <span className="text-faint">({result.reviewCount})</span>}
 </span>
 )}
 {result.city && (
 <span className="flex items-center gap-1">
 <FaMapMarkerAlt className="text-[10px] text-faint" />
 <span className="truncate max-w-[120px]">{result.city}</span>
 </span>
 )}
 {result.languages.length > 0 && (
 <span className="flex items-center gap-1">
 <FaLanguage className="text-[10px] text-faint" />
 <span className="truncate max-w-[120px]">{result.languages.slice(0, 3).join(', ')}</span>
 </span>
 )}
 </div>

 {/* Tags row: availability + consultation types */}
 <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
 <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
 result.available
 ? 'bg-green-50 text-green-700 border border-green-200'
 : 'bg-amber-50 text-amber-700 border border-amber-200'
 }`}>
 {result.available ? <FaCheckCircle className="text-[8px]" /> : <FaClock className="text-[8px]" />}
 {result.available
 ? (result.nextAvailable === 'Available Today' || result.nextAvailable === 'In Stock' ? result.nextAvailable : `Next: ${result.nextAvailable}`)
 : `Next: ${result.nextAvailable}`}
 </span>
 {result.type !== 'medicine' && result.consultationTypes.includes('In-Person') && (
 <span className="inline-flex items-center gap-1 text-[10px] bg-subtle text-soft px-2 py-0.5 rounded-full border border-line">
 <FaHome className="text-[8px]" /> In-Person
 </span>
 )}
 {result.type !== 'medicine' && result.consultationTypes.includes('Video Consultation') && (
 <span className="inline-flex items-center gap-1 text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full border border-purple-200">
 <FaVideo className="text-[8px]" /> Video
 </span>
 )}
 {result.emergencyAvailable && (
 <span className="inline-flex items-center gap-1 text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-200">
 <FaExclamationCircle className="text-[8px]" /> Emergency
 </span>
 )}
 </div>
 </div>
 </div>

 {/* Right: Price + Action buttons */}
 <div className="flex flex-col items-stretch sm:items-end gap-2 flex-shrink-0 sm:border-l sm:border-line sm:pl-4 border-t sm:border-t-0 border-line pt-3 sm:pt-0">
 <div className="sm:text-right">
 {result.consultationFee !== null && result.consultationFee > 0 && (
 <p className="text-sm font-bold text-fg whitespace-nowrap">
 Rs {(result.consultationFee ?? 0).toLocaleString()}
 {result.type === 'medicine' ? '' : <span className="text-[10px] font-normal text-faint"> /session</span>}
 </p>
 )}
 {result.videoConsultationFee != null && result.videoConsultationFee > 0 && (
 <p className="text-[10px] text-faint whitespace-nowrap">
 Video: Rs {(result.videoConsultationFee ?? 0).toLocaleString()}
 </p>
 )}
 </div>
 <Link
 href={result.detailHref || result.url || '#'}
 className="px-4 py-2.5 bg-blue-600 text-white text-xs rounded-lg font-medium hover:bg-blue-700 transition-colors whitespace-nowrap text-center"
 >
 {result.type === 'medicine' ? 'View' : 'View Profile'}
 </Link>
 </div>
 </div>
 </div>
 )
}

// ---- Pagination ----

interface PaginationProps {
 page: number
 totalPages: number
 onPageChange: (page: number) => void
}

function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
 if (totalPages <= 1) return null

 // Show up to 5 page numbers around current page
 const pages: number[] = []
 const start = Math.max(1, page - 2)
 const end = Math.min(totalPages, page + 2)
 for (let i = start; i <= end; i++) pages.push(i)

 return (
 <div className="flex items-center justify-center gap-2 mt-8">
 <button
 onClick={() => onPageChange(page - 1)}
 disabled={page <= 1}
 className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg border border-line text-soft hover:bg-subtle disabled:opacity-40 disabled:cursor-not-allowed"
 >
 <FaChevronLeft className="text-xs" />
 Prev
 </button>

 {start > 1 && (
 <>
 <button onClick={() => onPageChange(1)} className="w-9 h-9 text-sm rounded-lg border border-line text-soft hover:bg-subtle">1</button>
 {start > 2 && <span className="text-faint text-sm">...</span>}
 </>
 )}

 {pages.map(p => (
 <button
 key={p}
 onClick={() => onPageChange(p)}
 className={`w-9 h-9 text-sm rounded-lg border transition-colors ${
 p === page
 ? 'bg-blue-600 text-white border-blue-600'
 : 'border-line text-soft hover:bg-subtle'
 }`}
 >
 {p}
 </button>
 ))}

 {end < totalPages && (
 <>
 {end < totalPages - 1 && <span className="text-faint text-sm">...</span>}
 <button onClick={() => onPageChange(totalPages)} className="w-9 h-9 text-sm rounded-lg border border-line text-soft hover:bg-subtle">{totalPages}</button>
 </>
 )}

 <button
 onClick={() => onPageChange(page + 1)}
 disabled={page >= totalPages}
 className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg border border-line text-soft hover:bg-subtle disabled:opacity-40 disabled:cursor-not-allowed"
 >
 Next
 <FaChevronRight className="text-xs" />
 </button>
 </div>
 )
}

// ---- Main Component ----

interface SearchResultsProps {
 results: UnifiedSearchResult[]
 total: number
 page: number
 totalPages: number
 loading: boolean
 query: string
 onPageChange: (page: number) => void
 onClear: () => void
}

export default function SearchResults({
 results,
 total,
 page,
 totalPages,
 loading,
 query,
 onPageChange,
 onClear,
}: SearchResultsProps) {
 if (loading) {
 return <SearchResultsSkeleton />
 }

 if (results.length === 0) {
 return <NoResults query={query} onClear={onClear} />
 }

 return (
 <div>
 {/* Result count */}
 <div className="flex items-center justify-between mb-4">
 <p className="text-sm text-soft">
 Showing <span className="font-semibold text-fg">{results.length}</span> of{' '}
 <span className="font-semibold text-fg">{total}</span> results
 {query && <> for &quot;{query}&quot;</>}
 </p>
 {query && (
 <button onClick={onClear} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
 Clear filters
 </button>
 )}
 </div>

 {/* Results list */}
 <div className="flex flex-col gap-4">
 {results.map(result => (
 <ResultCard key={`${result.type}-${result.id}`} result={result} />
 ))}
 </div>

 {/* Pagination */}
 <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
 </div>
 )
}
