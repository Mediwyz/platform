'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import {
 FaSearch,
 FaCalendarAlt,
 FaClock,
 FaUser,
 FaVideo,
 FaMapMarkerAlt,
 FaCheck,
 FaTimes,
 FaFilter,
 FaInbox,
} from 'react-icons/fa'
import { getStatusStyle } from '@/lib/constants/userTypeStyles'

interface BookingRequest {
 id: string
 patient: {
 id: string
 firstName: string
 lastName: string
 email?: string
 phone?: string
 profileImage?: string | null
 }
 type: string
 status: string
 scheduledDate: string
 scheduledTime: string
 duration?: number
 reason?: string
 notes?: string
 createdAt: string
 // Provider-specific fields
 testName?: string
 sampleType?: string
 children?: string[]
 emergencyType?: string
 priority?: string
}

interface ProviderBookingRequestsProps {
 /** API endpoint to fetch booking requests, e.g. `/api/providers/{id}/booking-requests` */
 apiEndpoint: string
 /** API endpoint to accept/decline, e.g. `/api/bookings/doctor` */
 actionEndpoint: string
 /** Display label: "Doctor", "Nurse", "Nanny", "Lab Technician", "Responder" */
 providerLabel: string
 /** Accent color for theming */
 accentColor?: 'blue' | 'pink' | 'purple' | 'cyan' | 'red' | 'teal'
 /** Whether to show test-specific fields (lab tech) */
 showTestFields?: boolean
 /** Whether to show children fields (nanny) */
 showChildrenFields?: boolean
 /** Whether to show emergency fields (responder) */
 showEmergencyFields?: boolean
}

const TYPE_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
 video: { icon: <FaVideo />, color: 'text-green-600 bg-green-100' },
 in_person: { icon: <FaUser />, color: 'text-blue-600 bg-blue-100' },
 home_visit: { icon: <FaMapMarkerAlt />, color: 'text-purple-600 bg-purple-100' },
}

const ACCENT_STYLES: Record<string, { header: string; button: string; statBg: string }> = {
 blue: { header: ' ', button: 'bg-blue-600 hover:bg-blue-700', statBg: 'bg-blue-50' },
 pink: { header: ' to-rose-700', button: 'bg-pink-600 hover:bg-pink-700', statBg: 'bg-pink-50' },
 purple: { header: ' ', button: 'bg-purple-600 hover:bg-purple-700', statBg: 'bg-purple-50' },
 cyan: { header: ' ', button: 'bg-cyan-600 hover:bg-cyan-700', statBg: 'bg-cyan-50' },
 red: { header: ' ', button: 'bg-red-600 hover:bg-red-700', statBg: 'bg-red-50' },
 teal: { header: ' ', button: 'bg-teal-600 hover:bg-teal-700', statBg: 'bg-teal-50' },
}

export default function ProviderBookingRequests({
 apiEndpoint,
 actionEndpoint,
 accentColor = 'blue',
 showTestFields = false,
 showChildrenFields = false,
 showEmergencyFields = false,
}: ProviderBookingRequestsProps) {
 const [bookings, setBookings] = useState<BookingRequest[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState('')
 const [searchQuery, setSearchQuery] = useState('')
 const [statusFilter, setStatusFilter] = useState('all')
 const [actioning, setActioning] = useState<string | null>(null)

 const styles = ACCENT_STYLES[accentColor] || ACCENT_STYLES.blue

 const fetchBookings = useCallback(async () => {
 try {
 setError('')
 const res = await fetch(apiEndpoint)
 const data = await res.json()
 if (data.success) {
 setBookings(data.data || [])
 }
 } catch {
 setError('Failed to load bookings. Please try again.')
 } finally {
 setLoading(false)
 }
 }, [apiEndpoint])

 useEffect(() => {
 fetchBookings()
 }, [fetchBookings])

 const handleAction = async (bookingId: string, action: 'confirmed' | 'cancelled') => {
 setActioning(bookingId)
 try {
 const res = await fetch(`${actionEndpoint}/${bookingId}`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ status: action }),
 })
 const data = await res.json()
 if (data.success) {
 setBookings(prev =>
 prev.map(b => b.id === bookingId ? { ...b, status: action } : b)
 )
 }
 } catch {
 // silent
 } finally {
 setActioning(null)
 }
 }

 const filtered = bookings.filter(b => {
 const matchesSearch =
 !searchQuery ||
 `${b.patient.firstName} ${b.patient.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
 b.reason?.toLowerCase().includes(searchQuery.toLowerCase())
 const matchesStatus = statusFilter === 'all' || b.status === statusFilter
 return matchesSearch && matchesStatus
 })

 const stats = {
 total: bookings.length,
 pending: bookings.filter(b => b.status === 'pending').length,
 confirmed: bookings.filter(b => b.status === 'confirmed').length,
 completed: bookings.filter(b => b.status === 'completed').length,
 }

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-[400px]">
 <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
 </div>
 )
 }

 if (error) {
 return (
 <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
 <p className="text-red-600 text-sm mb-3">{error}</p>
 <button onClick={fetchBookings} className="text-sm text-red-700 font-medium hover:text-red-800 underline">
 Try again
 </button>
 </div>
 )
 }

 return (
 <div>
 {/* Header */}
 <div className={` ${styles.header} rounded-xl p-6 text-white mb-6`}>
 <h1 className="text-2xl font-bold mb-1">Booking Requests</h1>
 <p className="text-white/80 text-sm">Manage your incoming booking requests</p>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
 {[
 { label: 'Total', value: stats.total },
 { label: 'Pending', value: stats.pending },
 { label: 'Confirmed', value: stats.confirmed },
 { label: 'Completed', value: stats.completed },
 ].map(stat => (
 <div key={stat.label} className="bg-white/15 rounded-lg p-3 text-center">
 <p className="text-2xl font-bold">{stat.value}</p>
 <p className="text-xs text-white/80">{stat.label}</p>
 </div>
 ))}
 </div>
 </div>

 {/* Search + Filters */}
 <div className="flex flex-col sm:flex-row gap-3 mb-4">
 <div className="relative flex-1">
 <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
 <input
 type="text"
 placeholder="Search by patient name or reason..."
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
 />
 </div>
 <div className="flex items-center gap-2">
 <FaFilter className="text-gray-400 text-sm" />
 {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
 <button
 key={status}
 onClick={() => setStatusFilter(status)}
 className={`px-3 py-1.5 text-xs font-medium rounded-full border transition ${
 statusFilter === status
 ? `${styles.button} text-white border-transparent`
 : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
 }`}
 >
 {status.charAt(0).toUpperCase() + status.slice(1)}
 </button>
 ))}
 </div>
 </div>

 {/* Booking List */}
 {filtered.length === 0 ? (
 <div className="bg-white rounded-xl border p-8 text-center">
 <FaInbox className="text-4xl text-gray-300 mx-auto mb-3" />
 <p className="font-medium text-gray-600">No booking requests found</p>
 <p className="text-sm text-gray-400 mt-1">
 {searchQuery || statusFilter !== 'all'
 ? 'Try adjusting your search or filters'
 : 'New booking requests will appear here'}
 </p>
 </div>
 ) : (
 <div className="space-y-3">
 {filtered.map(booking => {
 const typeInfo = TYPE_ICONS[booking.type] || TYPE_ICONS.in_person
 return (
 <div key={booking.id} className="bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition">
 <div className="flex items-start gap-4">
 {/* Patient Avatar */}
 {booking.patient.profileImage ? (
 <Image
 src={booking.patient.profileImage}
 alt={`${booking.patient.firstName} ${booking.patient.lastName}`}
 width={48}
 height={48}
 className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
 />
 ) : (
 <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold">
 {booking.patient.firstName[0]}{booking.patient.lastName[0]}
 </div>
 )}

 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between gap-2 mb-1">
 <h3 className="font-semibold text-gray-900">
 {booking.patient.firstName} {booking.patient.lastName}
 </h3>
 <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(booking.status)}`}>
 {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
 </span>
 </div>

 <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-2">
 <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
 {typeInfo.icon} {booking.type.replace('_', ' ')}
 </span>
 <span className="inline-flex items-center gap-1">
 <FaCalendarAlt className="text-xs" />
 {new Date(booking.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
 </span>
 <span className="inline-flex items-center gap-1">
 <FaClock className="text-xs" />
 {booking.scheduledTime}
 </span>
 {booking.duration && (
 <span className="text-xs text-gray-400">{booking.duration} min</span>
 )}
 </div>

 {booking.reason && (
 <p className="text-sm text-gray-600 mb-2">
 <span className="font-medium">Reason:</span> {booking.reason}
 </p>
 )}

 {showTestFields && booking.testName && (
 <p className="text-sm text-gray-600 mb-1">
 <span className="font-medium">Test:</span> {booking.testName}
 {booking.sampleType && ` (${booking.sampleType})`}
 </p>
 )}

 {showChildrenFields && booking.children && booking.children.length > 0 && (
 <p className="text-sm text-gray-600 mb-1">
 <span className="font-medium">Children:</span> {booking.children.join(', ')}
 </p>
 )}

 {showEmergencyFields && booking.emergencyType && (
 <p className="text-sm text-gray-600 mb-1">
 <span className="font-medium">Emergency Type:</span> {booking.emergencyType}
 {booking.priority && (
 <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
 booking.priority === 'critical' ? 'bg-red-100 text-red-700' :
 booking.priority === 'high' ? 'bg-orange-100 text-orange-700' :
 booking.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
 'bg-green-100 text-green-700'
 }`}>
 {booking.priority}
 </span>
 )}
 </p>
 )}

 {/* Actions for pending bookings */}
 {booking.status === 'pending' && (
 <div className="flex items-center gap-2 mt-3">
 <button
 onClick={() => handleAction(booking.id, 'confirmed')}
 disabled={actioning === booking.id}
 className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition disabled:opacity-50"
 >
 <FaCheck className="text-xs" /> Accept
 </button>
 <button
 onClick={() => handleAction(booking.id, 'cancelled')}
 disabled={actioning === booking.id}
 className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition disabled:opacity-50"
 >
 <FaTimes className="text-xs" /> Decline
 </button>
 </div>
 )}
 </div>
 </div>
 </div>
 )
 })}
 </div>
 )}
 </div>
 )
}
