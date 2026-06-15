'use client'

import { useState, useEffect, useCallback, ReactNode } from 'react'
import { FaCheck, FaTimes, FaSpinner, FaCalendarAlt, FaClock, FaEnvelope, FaPhone } from 'react-icons/fa'
import { getUserId } from '@/hooks/useUser'

export interface BookingRequestConfig {
 /** API path to fetch pending requests, with {userId} placeholder */
 fetchPath: string
 /** Booking type for the action API (doctor, nurse, nanny, lab_test, emergency) */
 bookingType: 'doctor' | 'nurse' | 'nanny' | 'lab_test' | 'emergency'
 /** Accent color for avatar badge */
 accentColor: string
 /** Custom renderer for extra booking details (below patient info) */
 renderDetails?: (booking: Record<string, unknown>) => ReactNode
}

interface PatientInfo {
 id: string
 userId: string
 user: {
 firstName: string
 lastName: string
 email: string
 phone: string
 profileImage: string | null
 }
}

export default function BookingRequestsManager({ config }: { config: BookingRequestConfig }) {
 const [bookings, setBookings] = useState<Record<string, unknown>[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)
 const [actionLoading, setActionLoading] = useState<{ id: string; action: 'accept' | 'deny' } | null>(null)
 const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

 const fetchBookings = useCallback(async () => {
 try {
 const uid = getUserId()
 if (!uid) return

 const res = await fetch(config.fetchPath.replace('{userId}', uid))
 if (!res.ok) throw new Error('Failed to fetch booking requests')
 const data = await res.json()
 if (data.success) {
 setBookings(data.data)
 }
 } catch (err) {
 console.error('Failed to fetch booking requests:', err)
 setError(err instanceof Error ? err.message : 'Failed to load booking requests')
 } finally {
 setLoading(false)
 }
 }, [config.fetchPath])

 useEffect(() => {
 fetchBookings()
 }, [fetchBookings])

 const handleAction = async (bookingId: string, action: 'accept' | 'deny') => {
 setActionLoading({ id: bookingId, action })
 setMessage(null)

 try {
 // Route through the workflow transition - notifies member automatically.
 // Falls back to legacy /api/bookings/action for bookings without a workflow.
 const wfRes = await fetch('/api/workflow/transition', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ bookingId, bookingType: config.bookingType, action }),
 credentials: 'include',
 })
 const wfData = await wfRes.json()

 if (!wfData.success) {
 const legacyRes = await fetch('/api/bookings/action', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ bookingId, bookingType: config.bookingType, action }),
 credentials: 'include',
 })
 const legacyData = await legacyRes.json()
 if (!legacyData.success) {
 setMessage({ type: 'error', text: legacyData.message || 'Action failed' })
 return
 }
 }

 setBookings((prev) => prev.filter((b) => (b as { id: string }).id !== bookingId))
 setMessage({
 type: 'success',
 text: action === 'accept' ? 'Booking accepted - member notified' : 'Booking declined - member notified',
 })
 } catch {
 setMessage({ type: 'error', text: 'Something went wrong' })
 } finally {
 setActionLoading(null)
 }
 }

 const formatDate = (dateStr: string) => {
 return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
 }

 const formatTime = (dateStr: string) => {
 return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
 }

 const getTypeBadge = (type: string) => {
 const styles: Record<string, string> = {
 video: 'bg-blue-100 text-blue-800',
 in_person: 'bg-green-100 text-green-800',
 home_visit: 'bg-purple-100 text-purple-800',
 }
 return styles[type] || 'bg-gray-100 text-gray-800'
 }

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-[400px]">
 <FaSpinner className={`animate-spin text-3xl text-${config.accentColor}-600`} />
 </div>
 )
 }

 return (
 <div className="space-y-6">
 <h1 className="text-2xl font-bold text-gray-900">Booking Requests</h1>

 {error && (
 <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
 <span>{error}</span>
 <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
 <FaTimes />
 </button>
 </div>
 )}

 {message && (
 <div className={`rounded-lg p-4 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
 {message.text}
 </div>
 )}

 {bookings.length === 0 ? (
 <div className="rounded-lg bg-white p-12 text-center shadow-sm border border-gray-200">
 <FaCalendarAlt className="mx-auto text-4xl text-gray-300 mb-4" />
 <p className="text-gray-500 text-lg">No pending booking requests</p>
 </div>
 ) : (
 <div className="grid gap-4">
 {bookings.map((booking) => {
 const id = booking.id as string
 const patient = booking.patient as PatientInfo
 const type = booking.type as string | undefined
 const scheduledAt = (booking.scheduledAt || booking.createdAt) as string
 const duration = booking.duration as number | undefined
 const reason = booking.reason as string | undefined

 return (
 <div key={id} className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
 <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
 <div className="flex-1 space-y-3">
 <div className="flex items-center gap-3">
 <div className={`h-10 w-10 rounded-full bg-${config.accentColor}-100 flex items-center justify-center text-${config.accentColor}-600 font-semibold`}>
 {patient.user.firstName[0]}{patient.user.lastName[0]}
 </div>
 <div>
 <h3 className="font-semibold text-gray-900">
 {patient.user.firstName} {patient.user.lastName}
 </h3>
 <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
 <span className="flex items-center gap-1">
 <FaEnvelope className="text-xs" /> {patient.user.email}
 </span>
 <span className="flex items-center gap-1">
 <FaPhone className="text-xs" /> {patient.user.phone}
 </span>
 </div>
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-3 text-sm">
 {type && (
 <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeBadge(type)}`}>
 {type.replace(/_/g, ' ')}
 </span>
 )}
 <span className="flex items-center gap-1 text-gray-600">
 <FaCalendarAlt className="text-xs" /> {formatDate(scheduledAt)}
 </span>
 <span className="flex items-center gap-1 text-gray-600">
 <FaClock className="text-xs" /> {formatTime(scheduledAt)}
 </span>
 {duration && <span className="text-gray-500">{duration} min</span>}
 </div>

 {reason && (
 <p className="text-sm text-gray-600">
 <span className="font-medium">Reason:</span> {reason}
 </p>
 )}

 {/* Custom details per provider type */}
 {config.renderDetails?.(booking)}
 </div>

 <div className="flex gap-2 sm:flex-col">
 <button
 onClick={() => handleAction(id, 'accept')}
 disabled={actionLoading?.id === id}
 className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
 >
 {actionLoading?.id === id && actionLoading.action === 'accept' ? <FaSpinner className="animate-spin" /> : <FaCheck />}
 Accept
 </button>
 <button
 onClick={() => handleAction(id, 'deny')}
 disabled={actionLoading?.id === id}
 className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
 >
 {actionLoading?.id === id && actionLoading.action === 'deny' ? <FaSpinner className="animate-spin" /> : <FaTimes />}
 Decline
 </button>
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
