'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDashboardUser } from '@/hooks/useDashboardUser'
import { FaSpinner, FaCalendarAlt, FaCheck, FaTimes, FaCheckCircle, FaPlay } from 'react-icons/fa'

interface Booking {
 id: string
 providerName: string | null
 providerType: string
 scheduledAt: string
 status: string
 serviceName: string | null
 servicePrice: number | null
 patientId: string
 type: string
 specialty: string | null
}

interface ProviderPracticePageProps {
 /** 'service' for new roles, 'doctor'/'nurse'/'nanny'/'lab_test'/'emergency' for old roles */
 bookingType: string
 /** API to fetch bookings. Use {userId} placeholder. */
 fetchUrl?: string
 title?: string
 defaultServiceLabel?: string
}

export default function ProviderPracticePage({
 bookingType,
 fetchUrl,
 title = 'My Practice',
 defaultServiceLabel = 'Service',
}: ProviderPracticePageProps) {
 const user = useDashboardUser()
 const [bookings, setBookings] = useState<Booking[]>([])
 const [loading, setLoading] = useState(true)
 const [actionLoading, setActionLoading] = useState<string | null>(null)

 const fetchBookings = useCallback(async () => {
 if (!user) return
 const url = fetchUrl
 ? fetchUrl.replace('{userId}', user.id)
 : '/api/bookings/service?role=provider'
 try {
 const res = await fetch(url)
 const json = await res.json()
 if (json.success && json.data) setBookings(json.data)
 } catch {}
 setLoading(false)
 }, [user, fetchUrl])

 useEffect(() => { fetchBookings() }, [fetchBookings])

 const handleAction = async (bookingId: string, action: 'accept' | 'deny' | 'complete') => {
 if (!user) return
 setActionLoading(bookingId)
 try {
 if (action === 'complete') {
 // For service bookings, update status directly
 await fetch('/api/bookings/service', {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ bookingId, status: 'completed' }),
 credentials: 'include',
 })
 } else {
 await fetch('/api/bookings/action', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ bookingId, bookingType, action }),
 credentials: 'include',
 })
 }
 fetchBookings()
 } catch {}
 setActionLoading(null)
 }

 if (!user) return null
 if (loading) return <div className="flex justify-center py-20"><FaSpinner className="animate-spin text-blue-500 text-2xl" /></div>

 const statusColor = (s: string) =>
 s === 'pending' ? 'bg-yellow-100 text-yellow-700' :
 s === 'accepted' || s === 'upcoming' ? 'bg-green-100 text-green-700' :
 s === 'in_progress' ? 'bg-blue-100 text-blue-700' :
 s === 'completed' ? 'bg-subtle text-soft' :
 s === 'cancelled' ? 'bg-red-100 text-red-700' :
 'bg-subtle text-soft'

 const pendingBookings = bookings.filter(b => b.status === 'pending')
 const activeBookings = bookings.filter(b => ['accepted', 'upcoming', 'in_progress'].includes(b.status))
 const pastBookings = bookings.filter(b => ['completed', 'cancelled'].includes(b.status))

 const renderBooking = (b: Booking) => {
 const isLoading = actionLoading === b.id
 return (
 <div key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div className="min-w-0 flex-1">
 <p className="font-medium text-fg text-sm">{b.serviceName || defaultServiceLabel}</p>
 {b.specialty && <p className="text-xs text-soft">{b.specialty}</p>}
 <p className="text-xs text-faint">
 {new Date(b.scheduledAt).toLocaleDateString()} at {new Date(b.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 </p>
 </div>
 <div className="flex items-center gap-2 flex-shrink-0">
 <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor(b.status)}`}>{b.status}</span>
 {b.servicePrice != null && b.servicePrice > 0 && (
 <span className="text-xs font-medium text-soft">Rs {(b.servicePrice ?? 0).toLocaleString()}</span>
 )}

 {/* Action buttons based on status */}
 {b.status === 'pending' && (
 <>
 <button
 onClick={() => handleAction(b.id, 'accept')}
 disabled={isLoading}
 className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50"
 >
 {isLoading ? <FaSpinner className="animate-spin text-[10px]" /> : <FaCheck className="text-[10px]" />}
 Accept
 </button>
 <button
 onClick={() => handleAction(b.id, 'deny')}
 disabled={isLoading}
 className="flex items-center gap-1 px-2.5 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 disabled:opacity-50"
 >
 <FaTimes className="text-[10px]" /> Deny
 </button>
 </>
 )}
 {(b.status === 'accepted' || b.status === 'upcoming') && (
 <button
 onClick={() => handleAction(b.id, 'complete')}
 disabled={isLoading}
 className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
 >
 {isLoading ? <FaSpinner className="animate-spin text-[10px]" /> : <FaCheckCircle className="text-[10px]" />}
 Complete
 </button>
 )}
 {b.status === 'in_progress' && (
 <button
 onClick={() => handleAction(b.id, 'complete')}
 disabled={isLoading}
 className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
 >
 <FaPlay className="text-[10px]" /> Finish
 </button>
 )}
 </div>
 </div>
 )
 }

 return (
 <div className="space-y-6">
 <h1 className="text-2xl font-bold text-fg">{title}</h1>

 {bookings.length === 0 ? (
 <div className="bg-surface rounded-xl border border-line p-8 text-center text-soft">
 <FaCalendarAlt className="text-4xl text-faint mx-auto mb-3" />
 <p className="font-medium">No booking requests yet</p>
 <p className="text-sm mt-1">When patients book your services, they will appear here.</p>
 </div>
 ) : (
 <>
 {pendingBookings.length > 0 && (
 <div>
 <h2 className="text-sm font-semibold text-yellow-700 mb-2">Pending Requests ({pendingBookings.length})</h2>
 <div className="bg-surface rounded-xl border border-yellow-200 divide-y divide-yellow-100">
 {pendingBookings.map(renderBooking)}
 </div>
 </div>
 )}

 {activeBookings.length > 0 && (
 <div>
 <h2 className="text-sm font-semibold text-green-700 mb-2">Active ({activeBookings.length})</h2>
 <div className="bg-surface rounded-xl border border-green-200 divide-y divide-green-100">
 {activeBookings.map(renderBooking)}
 </div>
 </div>
 )}

 {pastBookings.length > 0 && (
 <div>
 <h2 className="text-sm font-semibold text-soft mb-2">Past ({pastBookings.length})</h2>
 <div className="bg-surface rounded-xl border border-line divide-y">
 {pastBookings.map(renderBooking)}
 </div>
 </div>
 )}
 </>
 )}
 </div>
 )
}
