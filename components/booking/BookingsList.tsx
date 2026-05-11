'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
 FaCalendarAlt,
 FaClock,
 FaCheckCircle,
 FaTimes,
 FaExclamationCircle,
 FaSearch,
 FaFilter,
 FaEye,
 FaVideo,
 FaChevronDown,
 FaChevronUp,
 FaHome,
 FaHospital,
} from 'react-icons/fa'

export interface BookingItem {
 id: string
 providerName: string
 providerInitials?: string
 date: string
 time: string
 status: string
 type?: string // home_visit, in_person, video, etc.
 service?: string
 notes?: string
 details?: { label: string; value: string }[]
}

interface BookingsListProps {
 bookings: BookingItem[]
 providerLabel: string // "Nurse", "Nanny", "Doctor", etc.
 accentColor?: string // pink, purple, blue, cyan, green
 onVideoCall?: (booking: BookingItem) => void
 emptyMessage?: string
}

const STATUS_STYLES: Record<string, string> = {
 upcoming: 'bg-blue-100 text-blue-800 border-blue-200',
 pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
 confirmed: 'bg-green-100 text-green-800 border-green-200',
 completed: 'bg-green-100 text-green-800 border-green-200',
 cancelled: 'bg-red-100 text-red-800 border-red-200',
}

const ACCENT_GRADIENT: Record<string, { from: string; to: string; avatar: string }> = {
 pink: { from: '', to: 'to-rose-600', avatar: ' to-rose-600' },
 purple: { from: '', to: '', avatar: ' ' },
 blue: { from: '', to: '', avatar: ' ' },
 cyan: { from: '', to: '', avatar: ' ' },
 green: { from: '', to: '', avatar: ' ' },
}

function getStatusIcon(status: string) {
 switch (status) {
 case 'upcoming':
 case 'pending':
 return <FaClock className="text-xs" />
 case 'completed':
 case 'confirmed':
 return <FaCheckCircle className="text-xs" />
 case 'cancelled':
 return <FaTimes className="text-xs" />
 default:
 return <FaExclamationCircle className="text-xs" />
 }
}

export default function BookingsList({
 bookings,
 providerLabel,
 accentColor = 'blue',
 onVideoCall,
 emptyMessage,
}: BookingsListProps) {
 const [searchQuery, setSearchQuery] = useState('')
 const [statusFilter, setStatusFilter] = useState<string>('all')
 const [showFilters, setShowFilters] = useState(false)
 const [expandedId, setExpandedId] = useState<string | null>(null)

 const accent = ACCENT_GRADIENT[accentColor] || ACCENT_GRADIENT.blue

 const filtered = bookings.filter((b) => {
 const matchesSearch =
 (b.providerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
 (b.service || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
 b.notes?.toLowerCase().includes(searchQuery.toLowerCase())
 const matchesStatus = statusFilter === 'all' || b.status === statusFilter
 return matchesSearch && matchesStatus
 })

 const stats = {
 total: bookings.length,
 upcoming: bookings.filter((b) => b.status === 'upcoming' || b.status === 'pending' || b.status === 'confirmed').length,
 completed: bookings.filter((b) => b.status === 'completed').length,
 }

 if (bookings.length === 0) {
 return (
 <div className="bg-gray-50 rounded-xl p-6 sm:p-8 text-center border border-gray-200">
 <FaCalendarAlt className="text-3xl text-gray-300 mx-auto mb-3" />
 <p className="text-gray-500 text-sm sm:text-base">{emptyMessage || `No ${providerLabel.toLowerCase()} bookings yet.`}</p>
 <Link
 href={`/search/${providerLabel.toLowerCase()}`}
 className={`inline-flex items-center gap-2 mt-4 px-5 py-2.5 ${accent.from} ${accent.to} text-white text-sm font-medium rounded-lg hover:opacity-90 transition`}
 >
 Book a {providerLabel}
 </Link>
 </div>
 )
 }

 return (
 <div className="space-y-4">
 {/* Stats */}
 <div className={` ${accent.from} ${accent.to} rounded-xl p-4 text-white`}>
 <div className="grid grid-cols-3 gap-3 text-center">
 <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
 <p className="text-lg sm:text-xl font-bold">{stats.total}</p>
 <p className="text-xs opacity-90">Total</p>
 </div>
 <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
 <p className="text-lg sm:text-xl font-bold">{stats.upcoming}</p>
 <p className="text-xs opacity-90">Upcoming</p>
 </div>
 <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
 <p className="text-lg sm:text-xl font-bold">{stats.completed}</p>
 <p className="text-xs opacity-90">Completed</p>
 </div>
 </div>
 </div>

 {/* Search & Filter */}
 <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
 <div className="flex gap-3">
 <div className="flex-1 relative">
 <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
 <input
 type="text"
 placeholder={`Search ${providerLabel.toLowerCase()}s, services...`}
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
 />
 </div>
 <button
 onClick={() => setShowFilters(!showFilters)}
 className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-1.5 text-sm"
 >
 <FaFilter />
 {showFilters ? <FaChevronUp /> : <FaChevronDown />}
 </button>
 </div>
 {showFilters && (
 <div className="mt-3 pt-3 border-t">
 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
 >
 <option value="all">All Status</option>
 <option value="upcoming">Upcoming</option>
 <option value="pending">Pending</option>
 <option value="confirmed">Confirmed</option>
 <option value="completed">Completed</option>
 <option value="cancelled">Cancelled</option>
 </select>
 </div>
 )}
 </div>

 {/* Bookings */}
 <div className="space-y-3">
 {filtered.map((booking) => (
 <div
 key={booking.id}
 className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all"
 >
 <div className="p-4">
 <div className="flex items-start gap-3">
 {/* Avatar */}
 <div className={`w-11 h-11 sm:w-12 sm:h-12 ${accent.avatar} rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
 {booking.providerInitials || (booking.providerName || 'U').split(' ').map(n => n[0]).join('').slice(0, 2)}
 </div>

 {/* Info */}
 <div className="flex-1 min-w-0">
 <div className="flex flex-wrap items-center gap-2 mb-1.5">
 <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{booking.providerName}</h4>
 <span className={`px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 ${STATUS_STYLES[booking.status] || STATUS_STYLES.upcoming}`}>
 {getStatusIcon(booking.status)}
 <span className="capitalize">{booking.status}</span>
 </span>
 </div>

 <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
 <span className="flex items-center gap-1">
 <FaCalendarAlt className="text-gray-400" />
 {new Date(booking.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
 </span>
 <span className="flex items-center gap-1">
 <FaClock className="text-gray-400" />
 {booking.time}
 </span>
 {booking.type && (
 <span className="flex items-center gap-1">
 {booking.type === 'home_visit' ? <FaHome className="text-green-500" /> : <FaHospital className="text-blue-500" />}
 <span className="capitalize">{booking.type.replace('_', ' ')}</span>
 </span>
 )}
 </div>

 {booking.service && (
 <p className="text-xs text-gray-500 mt-1.5 bg-gray-50 rounded px-2 py-1 inline-block">{booking.service}</p>
 )}
 </div>

 {/* Actions */}
 <div className="flex gap-1.5 flex-shrink-0">
 {(booking.status === 'upcoming' || booking.status === 'confirmed') && onVideoCall && (
 <button
 onClick={() => onVideoCall(booking)}
 className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
 aria-label="Start video call"
 >
 <FaVideo className="text-sm" />
 </button>
 )}
 <button
 onClick={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
 className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition"
 aria-label="View booking details"
 >
 <FaEye className="text-sm" />
 </button>
 </div>
 </div>

 {/* Expanded Details */}
 {expandedId === booking.id && (
 <div className="mt-3 pt-3 border-t border-gray-100">
 {booking.notes && (
 <p className="text-xs text-gray-600 mb-2"><span className="font-medium">Notes:</span> {booking.notes}</p>
 )}
 {booking.details && booking.details.length > 0 && (
 <div className="grid grid-cols-2 gap-2 text-xs">
 {booking.details.map((d, i) => (
 <div key={i}>
 <span className="text-gray-500">{d.label}:</span>{' '}
 <span className="font-medium text-gray-800">{d.value}</span>
 </div>
 ))}
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 ))}

 {filtered.length === 0 && (
 <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-200">
 <FaSearch className="text-gray-400 text-xl mx-auto mb-2" />
 <p className="text-gray-500 text-sm">No bookings match your criteria.</p>
 <button
 onClick={() => { setSearchQuery(''); setStatusFilter('all') }}
 className="mt-2 text-blue-600 hover:underline text-sm"
 >
 Clear filters
 </button>
 </div>
 )}
 </div>
 </div>
 )
}
