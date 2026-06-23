'use client'

import { useState, useEffect, useCallback, ReactNode } from 'react'
import {
 FaCheck, FaTimes, FaSpinner, FaCalendarAlt, FaClock, FaPhone,
 FaSearch, FaCheckCircle, FaTimesCircle, FaFileAlt, FaBan, FaMapMarkerAlt,
 FaTruck, FaExclamationCircle,
} from 'react-icons/fa'
import { getUserId } from '@/hooks/useUser'

//  Types 

export interface StatusOption {
 value: string
 label: string
 color: string // tailwind bg + text classes, e.g. 'bg-yellow-100 text-yellow-800'
}

export interface ActionButton {
 /** Action value sent to the API */
 action: string
 label: string
 icon?: ReactNode
 /** Tailwind classes for the button */
 className: string
 /** Which statuses this action is available for */
 visibleForStatuses: string[]
 /** Optional confirmation message */
 confirmMessage?: string
}

export interface ServiceBookingConfig {
 /** Page title */
 title: string
 /** Subtitle description */
 subtitle?: string
 /** API path to fetch bookings, with {userId} placeholder */
 fetchPath: string
 /** API path to update a booking status, with {bookingId} placeholder */
 actionPath: string
 /** Booking type identifier */
 bookingType: string
 /** Accent color name (blue, teal, red, purple, cyan) */
 accentColor: string
 /** Available status filters */
 statuses: StatusOption[]
 /** Default status filter value (empty string = all) */
 defaultStatus?: string
 /** Category filter options (optional) */
 categories?: { value: string; label: string }[]
 /** Action buttons config - determines what actions appear per row */
 actions: ActionButton[]
 /** Map booking data to display columns */
 columns: ColumnDef[]
 /** Custom renderer for extra booking details in expanded view */
 renderDetails?: (booking: Record<string, unknown>) => ReactNode
 /** Result/outcome button config (e.g. prescription, lab results) */
 resultButton?: {
 label: string
 icon?: ReactNode
 /** Route with {bookingId} placeholder */
 href: string
 visibleForStatuses: string[]
 }
}

export interface ColumnDef {
 key: string
 label: string
 /** How to extract the value from booking data. Dot notation supported. */
 accessor: string | ((booking: Record<string, unknown>) => ReactNode)
 /** Optional width class */
 className?: string
}

//  Helpers 

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
 return path.split('.').reduce((acc: unknown, key) => {
 if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
 return undefined
 }, obj)
}

function formatDate(dateStr: string) {
 return new Date(dateStr).toLocaleDateString('en-US', {
 year: 'numeric', month: 'short', day: 'numeric',
 })
}

function formatTime(dateStr: string) {
 return new Date(dateStr).toLocaleTimeString('en-US', {
 hour: '2-digit', minute: '2-digit',
 })
}

//  Component 

export default function ServiceBookingManager({ config }: { config: ServiceBookingConfig }) {
 const [bookings, setBookings] = useState<Record<string, unknown>[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)
 const [actionLoading, setActionLoading] = useState<{ id: string; action: string } | null>(null)
 const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
 const [statusFilter, setStatusFilter] = useState(config.defaultStatus ?? '')
 const [categoryFilter, setCategoryFilter] = useState('')
 const [searchTerm, setSearchTerm] = useState('')

 const fetchBookings = useCallback(async () => {
 try {
 setLoading(true)
 const uid = getUserId()
 if (!uid) return

 let url = config.fetchPath.replace('{userId}', uid)
 if (statusFilter) {
 url += (url.includes('?') ? '&' : '?') + `status=${statusFilter}`
 }

 const res = await fetch(url)
 if (!res.ok) {
 if (res.status === 404) {
 setBookings([])
 return
 }
 throw new Error('Failed to fetch bookings')
 }
 const data = await res.json()
 const items = data.data ?? data.calls ?? (Array.isArray(data) ? data : [])
 setBookings(items)
 } catch (err) {
 console.error('Failed to fetch bookings:', err)
 setError(err instanceof Error ? err.message : 'Failed to load bookings')
 } finally {
 setLoading(false)
 }
 }, [config.fetchPath, statusFilter])

 useEffect(() => {
 fetchBookings()
 }, [fetchBookings])

 // Clear message after 5s
 useEffect(() => {
 if (message) {
 const t = setTimeout(() => setMessage(null), 5000)
 return () => clearTimeout(t)
 }
 }, [message])

 const handleAction = async (bookingId: string, action: string, confirmMsg?: string) => {
 if (confirmMsg && !window.confirm(confirmMsg)) return

 setActionLoading({ id: bookingId, action })
 setMessage(null)

 try {
 const res = await fetch(config.actionPath.replace('{bookingId}', bookingId), {
 method: config.actionPath.includes('/api/bookings/action') ? 'POST' : 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(
 config.actionPath.includes('/api/bookings/action')
 ? { bookingId, bookingType: config.bookingType, action }
 : { action }
 ),
 })

 const data = await res.json()
 if (data.success) {
 // Refresh the list after action
 await fetchBookings()
 setMessage({
 type: 'success',
 text: `Booking ${action === 'accept' ? 'accepted' : action === 'deny' ? 'declined' : action === 'complete' ? 'completed' : action === 'cancel' ? 'cancelled' : action.replace(/_/g, ' ')} successfully`,
 })
 } else {
 setMessage({ type: 'error', text: data.message || 'Action failed' })
 }
 } catch {
 setMessage({ type: 'error', text: 'Something went wrong' })
 } finally {
 setActionLoading(null)
 }
 }

 // Filter bookings by search term and category
 const filteredBookings = bookings.filter((booking) => {
 // Search filter
 if (searchTerm) {
 const lower = searchTerm.toLowerCase()
 const searchable = JSON.stringify(booking).toLowerCase()
 if (!searchable.includes(lower)) return false
 }
 // Category filter
 if (categoryFilter && config.categories) {
 const cat = (booking.category || booking.incidentType || booking.type || booking.serviceType || '') as string
 if (!cat.toLowerCase().includes(categoryFilter.toLowerCase())) return false
 }
 return true
 })

 // Get status badge
 const getStatusBadge = (status: string) => {
 const found = config.statuses.find((s) => s.value === status)
 if (found) return found
 return { value: status, label: status, color: 'bg-subtle text-fg' }
 }

 const getStatusIcon = (status: string) => {
 switch (status) {
 case 'pending': return <FaClock className="text-[10px]" />
 case 'upcoming':
 case 'dispatched': return <FaTruck className="text-[10px]" />
 case 'en_route':
 case 'on-scene': return <FaMapMarkerAlt className="text-[10px]" />
 case 'completed':
 case 'resolved': return <FaCheckCircle className="text-[10px]" />
 case 'cancelled': return <FaTimesCircle className="text-[10px]" />
 default: return <FaExclamationCircle className="text-[10px]" />
 }
 }

 // Get available actions for a booking based on its status
 const getAvailableActions = (status: string) => {
 return config.actions.filter((a) => a.visibleForStatuses.includes(status))
 }

 // Stats
 const stats = config.statuses.reduce((acc, s) => {
 acc[s.value] = bookings.filter((b) => (b.status as string) === s.value).length
 return acc
 }, {} as Record<string, number>)

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-[400px]">
 <FaSpinner className="animate-spin text-3xl text-blue-600" />
 </div>
 )
 }

 return (
 <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
 {/* Header */}
 <div>
 <h1 className="text-2xl font-bold text-fg">{config.title}</h1>
 {config.subtitle && <p className="text-sm text-soft mt-1">{config.subtitle}</p>}
 </div>

 {/* Stats Bar */}
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
 <div className="bg-surface rounded-lg border border-line p-3 text-center">
 <p className="text-2xl font-bold text-fg">{bookings.length}</p>
 <p className="text-xs text-soft">Total</p>
 </div>
 {config.statuses.slice(0, 4).map((s) => (
 <div key={s.value} className="bg-surface rounded-lg border border-line p-3 text-center">
 <p className="text-2xl font-bold text-fg">{stats[s.value] || 0}</p>
 <p className="text-xs text-soft">{s.label}</p>
 </div>
 ))}
 </div>

 {/* Alerts */}
 {error && (
 <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
 <span>{error}</span>
 <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600"><FaTimes /></button>
 </div>
 )}
 {message && (
 <div className={`rounded-lg p-4 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
 {message.text}
 </div>
 )}

 {/* Filters */}
 <div className="flex flex-col sm:flex-row gap-3">
 <div className="relative flex-1">
 <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
 <input
 type="text"
 placeholder="Search bookings..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full pl-10 pr-4 py-2.5 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
 />
 </div>
 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 className="px-4 py-2.5 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-surface"
 >
 <option value="">All Statuses</option>
 {config.statuses.map((s) => (
 <option key={s.value} value={s.value}>{s.label}</option>
 ))}
 </select>
 {config.categories && config.categories.length > 0 && (
 <select
 value={categoryFilter}
 onChange={(e) => setCategoryFilter(e.target.value)}
 className="px-4 py-2.5 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-surface"
 >
 <option value="">All Categories</option>
 {config.categories.map((c) => (
 <option key={c.value} value={c.value}>{c.label}</option>
 ))}
 </select>
 )}
 </div>

 {/* Status Filter Tabs */}
 <div className="flex flex-wrap gap-2">
 <button
 onClick={() => setStatusFilter('')}
 className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
 !statusFilter ? 'bg-blue-600 text-white' : 'bg-subtle text-soft hover:bg-line'
 }`}
 >
 All ({bookings.length})
 </button>
 {config.statuses.map((s) => (
 <button
 key={s.value}
 onClick={() => setStatusFilter(s.value)}
 className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
 statusFilter === s.value ? 'bg-blue-600 text-white' : `${s.color} hover:opacity-80`
 }`}
 >
 {s.label} ({stats[s.value] || 0})
 </button>
 ))}
 </div>

 {/* Table */}
 {filteredBookings.length === 0 ? (
 <div className="text-center py-16 bg-subtle rounded-xl border border-dashed border-line">
 <FaCalendarAlt className="mx-auto text-4xl text-faint mb-4" />
 <h3 className="text-lg font-medium text-soft mb-1">No bookings found</h3>
 <p className="text-sm text-faint">
 {searchTerm || statusFilter || categoryFilter
 ? 'Try adjusting your search or filters.'
 : 'Bookings will appear here.'}
 </p>
 </div>
 ) : (
 <div className="bg-surface rounded-xl shadow-sm border border-line overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead>
 <tr className="bg-subtle border-b border-line">
 {config.columns.map((col) => (
 <th key={col.key} className={`text-left px-4 py-3 text-xs font-semibold text-soft uppercase tracking-wider ${col.className || ''}`}>
 {col.label}
 </th>
 ))}
 <th className="text-left px-4 py-3 text-xs font-semibold text-soft uppercase tracking-wider">
 Status
 </th>
 <th className="text-left px-4 py-3 text-xs font-semibold text-soft uppercase tracking-wider">
 Actions
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-line">
 {filteredBookings.map((booking) => {
 const id = booking.id as string
 const status = (booking.status as string) || 'pending'
 const badge = getStatusBadge(status)
 const availableActions = getAvailableActions(status)
 const showResult = config.resultButton && config.resultButton.visibleForStatuses.includes(status)

 return (
 <tr key={id} className="hover:bg-subtle transition-colors">
 {config.columns.map((col) => (
 <td key={col.key} className={`px-4 py-4 ${col.className || ''}`}>
 {typeof col.accessor === 'function'
 ? col.accessor(booking)
 : (() => {
 const val = getNestedValue(booking, col.accessor)
 if (col.accessor.includes('At') || col.accessor.includes('timestamp') || col.accessor.includes('date') || col.accessor === 'createdAt' || col.accessor === 'scheduledAt') {
 return val ? (
 <div>
 <div className="text-sm text-fg">{formatDate(val as string)}</div>
 <div className="text-xs text-soft">{formatTime(val as string)}</div>
 </div>
 ) : <span className="text-faint">-</span>
 }
 return <span className="text-sm text-soft">{val != null ? String(val) : '-'}</span>
 })()
 }
 </td>
 ))}
 {/* Status column */}
 <td className="px-4 py-4">
 <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
 {getStatusIcon(status)}
 {badge.label}
 </span>
 </td>
 {/* Actions column */}
 <td className="px-4 py-4">
 <div className="flex flex-wrap gap-1.5">
 {availableActions.map((act) => (
 <button
 key={act.action}
 onClick={() => handleAction(id, act.action, act.confirmMessage)}
 disabled={actionLoading?.id === id}
 className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${act.className}`}
 >
 {actionLoading?.id === id && actionLoading.action === act.action
 ? <FaSpinner className="animate-spin text-[10px]" />
 : act.icon
 }
 {act.label}
 </button>
 ))}
 {showResult && config.resultButton && (
 <a
 href={config.resultButton.href.replace('{bookingId}', id)}
 className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors"
 >
 {config.resultButton.icon || <FaFileAlt className="text-[10px]" />}
 {config.resultButton.label}
 </a>
 )}
 </div>
 </td>
 </tr>
 )
 })}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </div>
 )
}

//  Preset Configs 

const COMMON_STATUSES: StatusOption[] = [
 { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
 { value: 'upcoming', label: 'Upcoming', color: 'bg-blue-100 text-blue-800' },
 { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
 { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
]

const ACCEPT_DENY_ACTIONS: ActionButton[] = [
 {
 action: 'accept', label: 'Accept',
 icon: <FaCheck className="text-[10px]" />,
 className: 'bg-green-600 text-white hover:bg-green-700',
 visibleForStatuses: ['pending'],
 },
 {
 action: 'deny', label: 'Deny',
 icon: <FaTimes className="text-[10px]" />,
 className: 'bg-red-600 text-white hover:bg-red-700',
 visibleForStatuses: ['pending'],
 },
 {
 action: 'complete', label: 'Complete',
 icon: <FaCheckCircle className="text-[10px]" />,
 className: 'bg-blue-600 text-white hover:bg-blue-700',
 visibleForStatuses: ['upcoming'],
 },
 {
 action: 'cancel', label: 'Cancel',
 icon: <FaBan className="text-[10px]" />,
 className: 'bg-line text-soft hover:bg-gray-300',
 visibleForStatuses: ['pending', 'upcoming'],
 confirmMessage: 'Are you sure you want to cancel this booking?',
 },
]

function patientColumn(): ColumnDef {
 return {
 key: 'patient',
 label: 'Patient',
 accessor: (booking) => {
 const patient = booking.patient as { user?: { firstName?: string; lastName?: string; phone?: string; email?: string }; userId?: string } | undefined
 if (!patient?.user) return <span className="text-faint">-</span>
 return (
 <div>
 <div className="font-medium text-fg">{patient.user.firstName} {patient.user.lastName}</div>
 <div className="text-xs text-soft flex items-center gap-1">
 <FaPhone className="text-[9px]" /> {patient.user.phone || patient.user.email || '-'}
 </div>
 </div>
 )
 },
 }
}

export function doctorBookingConfig(): ServiceBookingConfig {
 return {
 title: 'Appointments',
 subtitle: 'Manage your patient appointments',
 fetchPath: '/api/providers/{userId}/appointments',
 actionPath: '/api/bookings/doctor/{bookingId}',
 bookingType: 'doctor',
 accentColor: 'blue',
 statuses: COMMON_STATUSES,
 actions: [
 ...ACCEPT_DENY_ACTIONS,
 ],
 columns: [
 patientColumn(),
 { key: 'type', label: 'Type', accessor: (b) => {
 const type = (b.type as string) || '-'
 const styles: Record<string, string> = { video: 'bg-blue-100 text-blue-800', in_person: 'bg-green-100 text-green-800' }
 return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${styles[type] || 'bg-subtle text-fg'}`}>{type.replace(/_/g, ' ')}</span>
 }},
 { key: 'reason', label: 'Reason', accessor: (b) => <span className="text-sm text-soft line-clamp-1">{(b.reason as string) || '-'}</span> },
 { key: 'scheduledAt', label: 'Date', accessor: 'scheduledAt' },
 ],
 resultButton: {
 label: 'Prescription',
 icon: <FaFileAlt className="text-[10px]" />,
 href: '/doctor/prescriptions?booking={bookingId}',
 visibleForStatuses: ['upcoming', 'completed'],
 },
 }
}

export function nurseBookingConfig(): ServiceBookingConfig {
 return {
 title: 'Nurse Bookings',
 subtitle: 'Manage your patient bookings',
 fetchPath: '/api/providers/{userId}/booking-requests',
 actionPath: '/api/bookings/nurse/{bookingId}',
 bookingType: 'nurse',
 accentColor: 'teal',
 statuses: COMMON_STATUSES,
 actions: ACCEPT_DENY_ACTIONS,
 columns: [
 patientColumn(),
 { key: 'type', label: 'Type', accessor: (b) => {
 const type = (b.type as string) || '-'
 const styles: Record<string, string> = { video: 'bg-blue-100 text-blue-800', in_person: 'bg-green-100 text-green-800', home_visit: 'bg-purple-100 text-purple-800' }
 return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${styles[type] || 'bg-subtle text-fg'}`}>{type.replace(/_/g, ' ')}</span>
 }},
 { key: 'reason', label: 'Reason', accessor: (b) => <span className="text-sm text-soft line-clamp-1">{(b.reason as string) || '-'}</span> },
 { key: 'scheduledAt', label: 'Date', accessor: 'scheduledAt' },
 ],
 }
}

export function nannyBookingConfig(): ServiceBookingConfig {
 return {
 title: 'Childcare Bookings',
 subtitle: 'Manage your childcare bookings',
 fetchPath: '/api/providers/{userId}/booking-requests',
 actionPath: '/api/bookings/nanny/{bookingId}',
 bookingType: 'nanny',
 accentColor: 'purple',
 statuses: COMMON_STATUSES,
 actions: ACCEPT_DENY_ACTIONS,
 columns: [
 patientColumn(),
 { key: 'type', label: 'Type', accessor: (b) => {
 const type = (b.type as string) || '-'
 return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">{type.replace(/_/g, ' ')}</span>
 }},
 { key: 'children', label: 'Children', accessor: (b) => {
 const names = (b.children ?? b.childrenNames) as string[] | undefined
 return <span className="text-sm text-soft">{names?.join(', ') || '-'}</span>
 }},
 { key: 'scheduledAt', label: 'Date', accessor: 'scheduledAt' },
 ],
 }
}

export function labTestBookingConfig(): ServiceBookingConfig {
 return {
 title: 'Lab Test Bookings',
 subtitle: 'Manage lab test requests',
 fetchPath: '/api/providers/{userId}/booking-requests',
 actionPath: '/api/bookings/lab-test/{bookingId}',
 bookingType: 'lab_test',
 accentColor: 'cyan',
 statuses: COMMON_STATUSES,
 actions: ACCEPT_DENY_ACTIONS,
 columns: [
 patientColumn(),
 { key: 'testName', label: 'Test', accessor: (b) => <span className="text-sm font-medium text-fg">{(b.testName as string) || '-'}</span> },
 { key: 'sampleType', label: 'Sample', accessor: (b) => <span className="text-sm text-soft">{(b.sampleType as string) || '-'}</span> },
 { key: 'scheduledAt', label: 'Date', accessor: 'scheduledAt' },
 ],
 resultButton: {
 label: 'Results',
 icon: <FaFileAlt className="text-[10px]" />,
 href: '/lab-technician/results?booking={bookingId}',
 visibleForStatuses: ['upcoming', 'completed'],
 },
 }
}

export function emergencyBookingConfig(): ServiceBookingConfig {
 return {
 title: 'Emergency Bookings',
 subtitle: 'Manage emergency service requests',
 fetchPath: '/api/providers/{userId}/calls',
 actionPath: '/api/bookings/emergency/{bookingId}',
 bookingType: 'emergency',
 accentColor: 'red',
 statuses: [
 { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
 { value: 'dispatched', label: 'Dispatched', color: 'bg-blue-100 text-blue-800' },
 { value: 'on-scene', label: 'On Scene', color: 'bg-orange-100 text-orange-800' },
 { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
 { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
 ],
 actions: [
 {
 action: 'accept', label: 'Accept',
 icon: <FaCheck className="text-[10px]" />,
 className: 'bg-green-600 text-white hover:bg-green-700',
 visibleForStatuses: ['pending'],
 },
 {
 action: 'deny', label: 'Deny',
 icon: <FaTimes className="text-[10px]" />,
 className: 'bg-red-600 text-white hover:bg-red-700',
 visibleForStatuses: ['pending'],
 },
 {
 action: 'en_route', label: 'En Route',
 icon: <FaTruck className="text-[10px]" />,
 className: 'bg-orange-500 text-white hover:bg-orange-600',
 visibleForStatuses: ['dispatched'],
 },
 {
 action: 'complete', label: 'Complete',
 icon: <FaCheckCircle className="text-[10px]" />,
 className: 'bg-blue-600 text-white hover:bg-blue-700',
 visibleForStatuses: ['dispatched', 'on-scene'],
 },
 {
 action: 'cancel', label: 'Cancel',
 icon: <FaBan className="text-[10px]" />,
 className: 'bg-line text-soft hover:bg-gray-300',
 visibleForStatuses: ['pending', 'dispatched'],
 confirmMessage: 'Are you sure you want to cancel this emergency booking?',
 },
 ],
 categories: [
 { value: 'medical', label: 'Medical Emergency' },
 { value: 'fire', label: 'Fire & Rescue' },
 { value: 'water', label: 'Water Emergency' },
 { value: 'mental', label: 'Mental Health' },
 ],
 columns: [
 {
 key: 'incident', label: 'Incident',
 accessor: (b) => (
 <div>
 <div className="font-medium text-fg">{(b.incidentType as string) || (b.emergencyType as string) || '-'}</div>
 {b.patientName ? <div className="text-xs text-soft">{String(b.patientName)}</div> : null}
 </div>
 ),
 },
 {
 key: 'location', label: 'Location',
 accessor: (b) => (
 <span className="inline-flex items-center gap-1.5 text-sm text-soft">
 <FaMapMarkerAlt className="text-faint text-xs" />
 {(b.location as string) || '-'}
 </span>
 ),
 },
 { key: 'urgency', label: 'Urgency', accessor: (b) => {
 const urgency = (b.urgency as string) || '-'
 const styles: Record<string, string> = { critical: 'bg-red-100 text-red-800', high: 'bg-orange-100 text-orange-800', medium: 'bg-yellow-100 text-yellow-800', low: 'bg-green-100 text-green-800' }
 return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${styles[urgency.toLowerCase()] || 'bg-subtle text-fg'}`}>{urgency}</span>
 }},
 { key: 'timestamp', label: 'Date', accessor: 'timestamp' },
 ],
 }
}
