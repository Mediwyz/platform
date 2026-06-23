// app/patient/doctor-consultations/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { getUserId } from '@/hooks/useUser'
import Link from "next/link"
import {
 FaCalendarAlt,
 FaVideo,
 FaUser,
 FaClock,
 FaMapMarkerAlt,
 FaSearch,
 FaArrowLeft,
 FaEye,
 FaTimes,
 FaRedo,
 FaPlus,
 FaCheckCircle,
 FaExclamationTriangle,
 FaPrescriptionBottle,
 FaStar,
 FaSpinner
} from "react-icons/fa"

interface Doctor {
 id: string;
 name: string;
 specialty: string;
 avatar: string;
 rating: number;
 hospital: string;
}

interface Appointment {
 id: string;
 doctor: Doctor;
 date: string;
 time: string;
 endTime: string;
 type: "video" | "in-person";
 status: "upcoming" | "completed" | "cancelled" | "no-show" | "rescheduled";
 location: string;
 reason: string;
 notes: string;
 prescription: boolean;
 followUpRequired: boolean;
 amount: number;
 isPaid: boolean;
 rating: number | null;
 canCancel: boolean;
 canReschedule: boolean;
 meetingLink?: string;
}

interface FilterOptions {
 status: string;
 type: string;
 dateRange: string;
 doctor: string;
 sortBy: string;
}

interface Stats {
 total: number;
 upcoming: number;
 completed: number;
 cancelled: number;
}

function formatTime(dateStr: string): string {
 return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function addMinutes(dateStr: string, mins: number): string {
 const d = new Date(dateStr)
 d.setMinutes(d.getMinutes() + mins)
 return formatTime(d.toISOString())
}

 
function mapApiAppointment(apt: any): Appointment {
 // Support both legacy Appointment (apt.doctor.user) and ServiceBooking (apt.providerName)
 const doc = apt.doctor
 const docUser = doc?.user
 const doctorName = docUser ? `Dr. ${docUser.firstName} ${docUser.lastName}` : (apt.providerName || 'Doctor')
 const scheduledDate = apt.scheduledAt ? new Date(apt.scheduledAt) : new Date(apt.createdAt || Date.now())
 const isUpcoming = apt.status === 'upcoming' || apt.status === 'scheduled' || apt.status === 'accepted' || apt.status === 'confirmed'
 const isCompleted = apt.status === 'completed'

 return {
 id: apt.id,
 doctor: {
 id: doc?.id || apt.providerUserId || '',
 name: doctorName,
 specialty: Array.isArray(doc?.specialty) ? doc.specialty[0] : (apt.specialty || apt.serviceName || 'General'),
 avatar: docUser?.profileImage || '',
 rating: 4.8,
 hospital: doc?.clinicAffiliation || '',
 },
 date: scheduledDate.toISOString().split('T')[0],
 time: formatTime(apt.scheduledAt || apt.createdAt),
 endTime: addMinutes(apt.scheduledAt || apt.createdAt, apt.duration || 30),
 type: apt.type === 'video' ? 'video' : 'in-person',
 status: isUpcoming ? 'upcoming' : (apt.status as Appointment['status']),
 location: apt.location || (apt.type === 'video' ? 'Virtual Consultation' : ''),
 reason: apt.reason || apt.serviceName || '',
 notes: apt.notes || '',
 prescription: false,
 followUpRequired: false,
 amount: 0,
 isPaid: isCompleted,
 rating: null,
 canCancel: isUpcoming,
 canReschedule: isUpcoming,
 meetingLink: apt.type === 'video' && isUpcoming ? `/patient/video` : undefined,
 }
}

export default function DoctorConsultationsPage() {
 const [appointments, setAppointments] = useState<Appointment[]>([])
 const [loading, setLoading] = useState(true)

 const fetchAppointments = useCallback(async () => {
 const userId = getUserId()
 if (!userId) { setLoading(false); return }
 try {
 const res = await fetch('/api/bookings/unified?role=patient', { credentials: 'include' })
 const data = await res.json()
 if (data.success && data.data) {
 // Filter for doctor-type bookings
 const doctorBookings = data.data.filter((b: any) =>
  b.bookingType === 'appointment' || b.type === 'doctor' ||
  (b.bookingType === 'service_booking' && b.providerType === 'DOCTOR')
 )
 setAppointments(doctorBookings.map(mapApiAppointment))
 }
 } catch {
 // silent
 } finally {
 setLoading(false)
 }
 }, [])

 useEffect(() => { fetchAppointments() }, [fetchAppointments])

 const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
 const [showDetailModal, setShowDetailModal] = useState(false)
 const [showCancelModal, setShowCancelModal] = useState(false)
 const [showRescheduleModal, setShowRescheduleModal] = useState(false)
 const [searchQuery, setSearchQuery] = useState("")
 const [filters, setFilters] = useState<FilterOptions>({
 status: "all",
 type: "all",
 dateRange: "all",
 doctor: "all",
 sortBy: "date-desc"
 })

 // Calculate stats
 const stats: Stats = {
 total: appointments.length,
 upcoming: appointments.filter(apt => apt.status === "upcoming").length,
 completed: appointments.filter(apt => apt.status === "completed").length,
 cancelled: appointments.filter(apt => apt.status === "cancelled").length
 }

 // Get unique doctors for filter
 const uniqueDoctors = Array.from(new Set(appointments.map(apt => apt.doctor.name)))

 // Filter appointments
 const filteredAppointments = appointments.filter(apt => {
 const matchesSearch = 
 apt.doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
 apt.doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
 apt.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
 apt.location.toLowerCase().includes(searchQuery.toLowerCase())
 
 const matchesStatus = filters.status === "all" || apt.status === filters.status
 const matchesType = filters.type === "all" || apt.type === filters.type
 const matchesDoctor = filters.doctor === "all" || apt.doctor.name === filters.doctor
 
 // Date range filter
 let matchesDate = true
 if (filters.dateRange !== "all") {
 const aptDate = new Date(apt.date)
 const today = new Date()
 
 switch (filters.dateRange) {
 case "today":
 matchesDate = aptDate.toDateString() === today.toDateString()
 break
 case "week":
 const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
 matchesDate = aptDate >= weekAgo && aptDate <= today
 break
 case "month":
 const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
 matchesDate = aptDate >= monthAgo && aptDate <= today
 break
 }
 }
 
 return matchesSearch && matchesStatus && matchesType && matchesDoctor && matchesDate
 })

 // Sort appointments
 const sortedAppointments = [...filteredAppointments].sort((a, b) => {
 switch (filters.sortBy) {
 case "date-desc":
 return new Date(b.date).getTime() - new Date(a.date).getTime()
 case "date-asc":
 return new Date(a.date).getTime() - new Date(b.date).getTime()
 case "doctor":
 return a.doctor.name.localeCompare(b.doctor.name)
 default:
 return 0
 }
 })

 const getStatusColor = (status: string) => {
 switch (status) {
 case "upcoming": return "bg-blue-100 text-blue-800"
 case "completed": return "bg-green-100 text-green-800"
 case "cancelled": return "bg-red-100 text-red-800"
 case "no-show": return "bg-subtle text-fg"
 case "rescheduled": return "bg-yellow-100 text-yellow-800"
 default: return "bg-subtle text-fg"
 }
 }

 const getStatusIcon = (status: string) => {
 switch (status) {
 case "upcoming": return <FaClock className="text-blue-500" />
 case "completed": return <FaCheckCircle className="text-green-500" />
 case "cancelled": return <FaTimes className="text-red-500" />
 case "no-show": return <FaExclamationTriangle className="text-soft" />
 case "rescheduled": return <FaRedo className="text-yellow-500" />
 default: return null
 }
 }

 const handleViewDetails = (appointment: Appointment) => {
 setSelectedAppointment(appointment)
 setShowDetailModal(true)
 }

 const handleCancelAppointment = (appointment: Appointment) => {
 setSelectedAppointment(appointment)
 setShowCancelModal(true)
 }

 const handleReschedule = (appointment: Appointment) => {
 setSelectedAppointment(appointment)
 setShowRescheduleModal(true)
 }

 const confirmCancel = async () => {
 if (!selectedAppointment) return
 try {
 await fetch('/api/bookings/cancel', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ bookingId: selectedAppointment.id, bookingType: 'doctor' }),
 credentials: 'include',
 })
 setAppointments(prev =>
 prev.map(apt =>
 apt.id === selectedAppointment.id
 ? { ...apt, status: "cancelled" as const, canCancel: false, canReschedule: false }
 : apt
 )
 )
 } catch {
 // silent
 }
 setShowCancelModal(false)
 setSelectedAppointment(null)
 }

 const handleRateAppointment = (appointment: Appointment, rating: number) => {
 setAppointments(prev => 
 prev.map(apt => 
 apt.id === appointment.id 
 ? { ...apt, rating }
 : apt
 )
 )
 }

 return (
 <div className="min-h-screen bg-subtle">
 {/* Header */}
 <div className="bg-surface shadow-sm border-b">
 <div className="container mx-auto px-4 py-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <Link href="/patient" className="text-soft hover:text-primary-blue">
 <FaArrowLeft className="text-xl" />
 </Link>
 <div>
 <h1 className="text-2xl font-bold text-fg">My Consultations</h1>
 <p className="text-soft">Manage all your doctor appointments</p>
 </div>
 </div>
 <Link href="/patient/doctor-consultations/book" className="btn-gradient px-6 py-2 flex items-center gap-2">
 <FaPlus />
 Book New Consultation
 </Link>
 </div>
 </div>
 </div>

 <div className="container mx-auto px-4 py-8">
 {/* Stats Cards */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
 <div className="bg-surface rounded-lg p-4 shadow">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-soft text-sm">Total</p>
 <p className="text-2xl font-bold">{stats.total}</p>
 </div>
 <FaCalendarAlt className="text-faint text-2xl" />
 </div>
 </div>
 <div className="bg-surface rounded-lg p-4 shadow">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-soft text-sm">Upcoming</p>
 <p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p>
 </div>
 <FaClock className="text-blue-500 text-2xl" />
 </div>
 </div>
 <div className="bg-surface rounded-lg p-4 shadow">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-soft text-sm">Completed</p>
 <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
 </div>
 <FaCheckCircle className="text-green-500 text-2xl" />
 </div>
 </div>
 <div className="bg-surface rounded-lg p-4 shadow">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-soft text-sm">Cancelled</p>
 <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
 </div>
 <FaTimes className="text-red-500 text-2xl" />
 </div>
 </div>
 </div>

 {/* Filters */}
 <div className="bg-surface rounded-lg p-4 shadow mb-6">
 <div className="flex flex-col lg:flex-row gap-4">
 <div className="flex-1 relative">
 <input
 type="text"
 placeholder="Search by doctor, specialty, or reason..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:border-primary-blue"
 />
 <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-faint" />
 </div>
 
 <select
 value={filters.status}
 onChange={(e) => setFilters({ ...filters, status: e.target.value })}
 className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary-blue"
 >
 <option value="all">All Status</option>
 <option value="upcoming">Upcoming</option>
 <option value="completed">Completed</option>
 <option value="cancelled">Cancelled</option>
 <option value="rescheduled">Rescheduled</option>
 </select>
 
 <select
 value={filters.type}
 onChange={(e) => setFilters({ ...filters, type: e.target.value })}
 className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary-blue"
 >
 <option value="all">All Types</option>
 <option value="video">Video Call</option>
 <option value="in-person">In-Person</option>
 </select>
 
 <select
 value={filters.dateRange}
 onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
 className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary-blue"
 >
 <option value="all">All Time</option>
 <option value="today">Today</option>
 <option value="week">This Week</option>
 <option value="month">This Month</option>
 </select>
 
 <select
 value={filters.doctor}
 onChange={(e) => setFilters({ ...filters, doctor: e.target.value })}
 className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary-blue"
 >
 <option value="all">All Doctors</option>
 {uniqueDoctors.map(doctor => (
 <option key={doctor} value={doctor}>{doctor}</option>
 ))}
 </select>
 
 <select
 value={filters.sortBy}
 onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
 className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary-blue"
 >
 <option value="date-desc">Latest First</option>
 <option value="date-asc">Oldest First</option>
 <option value="doctor">By Doctor</option>
 </select>
 </div>
 </div>

 {/* Appointments List */}
 <div className="space-y-4">
 {loading ? (
 <div className="bg-surface rounded-lg p-12 text-center">
 <FaSpinner className="animate-spin text-blue-500 text-3xl mx-auto mb-4" />
 <p className="text-soft">Loading appointments...</p>
 </div>
 ) : sortedAppointments.length > 0 ? (
 sortedAppointments.map((appointment) => (
 <div key={appointment.id} className="bg-surface rounded-lg shadow hover:shadow-lg transition">
 <div className="p-6">
 <div className="flex items-start justify-between">
 <div className="flex items-start gap-4 flex-1">
 {/* Doctor Avatar */}
 <div className="text-4xl">{appointment.doctor.avatar}</div>
 
 {/* Appointment Details */}
 <div className="flex-1">
 <div className="flex items-center gap-3 mb-2">
 <h3 className="text-lg font-semibold">{appointment.doctor.name}</h3>
 <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
 {getStatusIcon(appointment.status)}
 <span className="ml-1">{appointment.status}</span>
 </span>
 {appointment.type === "video" ? (
 <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
 <FaVideo className="inline mr-1" />
 Video Call
 </span>
 ) : (
 <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
 <FaUser className="inline mr-1" />
 In-Person
 </span>
 )}
 </div>
 
 <p className="text-soft mb-2">{appointment.doctor.specialty}  {appointment.doctor.hospital}</p>
 
 <div className="grid md:grid-cols-2 gap-2 text-sm text-soft mb-3">
 <div className="flex items-center gap-2">
 <FaCalendarAlt className="text-faint" />
 <span>{new Date(appointment.date).toLocaleDateString("en-GB", { 
 weekday: "short", 
 day: "numeric", 
 month: "short", 
 year: "numeric" 
 })}</span>
 </div>
 <div className="flex items-center gap-2">
 <FaClock className="text-faint" />
 <span>{appointment.time} - {appointment.endTime}</span>
 </div>
 <div className="flex items-center gap-2">
 <FaMapMarkerAlt className="text-faint" />
 <span>{appointment.location}</span>
 </div>
 <div className="flex items-center gap-2">
 <span className="font-medium">Reason:</span>
 <span>{appointment.reason}</span>
 </div>
 </div>
 
 {appointment.notes && (
 <p className="text-sm text-soft italic mb-3">Note: {appointment.notes}</p>
 )}
 
 {/* Additional Info Badges */}
 <div className="flex flex-wrap gap-2">
 {appointment.prescription && (
 <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
 <FaPrescriptionBottle className="inline mr-1" />
 Prescription Available
 </span>
 )}
 {appointment.followUpRequired && (
 <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
 Follow-up Required
 </span>
 )}
 {appointment.isPaid ? (
 <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
 Paid: Rs {appointment.amount}
 </span>
 ) : (
 <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
 Payment Pending: Rs {appointment.amount}
 </span>
 )}
 </div>
 </div>
 </div>
 
 {/* Action Buttons */}
 <div className="flex flex-col gap-2 ml-4">
 <button
 onClick={() => handleViewDetails(appointment)}
 className="px-4 py-2 border border-line text-soft rounded-lg hover:bg-subtle text-sm"
 >
 <FaEye className="inline mr-1" />
 View
 </button>
 
 {appointment.status === "upcoming" && (
 <>
 {appointment.type === "video" && appointment.meetingLink && (
 <a
 href={appointment.meetingLink}
 className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm text-center"
 >
 <FaVideo className="inline mr-1" />
 Join
 </a>
 )}
 {appointment.canReschedule && (
 <button
 onClick={() => handleReschedule(appointment)}
 className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm"
 >
 <FaRedo className="inline mr-1" />
 Reschedule
 </button>
 )}
 {appointment.canCancel && (
 <button
 onClick={() => handleCancelAppointment(appointment)}
 className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
 >
 <FaTimes className="inline mr-1" />
 Cancel
 </button>
 )}
 </>
 )}
 
 {appointment.status === "completed" && (
 <>
 {appointment.prescription && (
 <button className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-600 text-sm">
 <FaPrescriptionBottle className="inline mr-1" />
 Prescription
 </button>
 )}
 {!appointment.rating && (
 <div className="flex items-center gap-1 p-2 border rounded-lg">
 {[1, 2, 3, 4, 5].map((star) => (
 <button
 key={star}
 onClick={() => handleRateAppointment(appointment, star)}
 className="text-faint hover:text-yellow-500"
 >
 <FaStar />
 </button>
 ))}
 </div>
 )}
 {appointment.rating && (
 <div className="flex items-center gap-1 p-2">
 {[1, 2, 3, 4, 5].map((star) => (
 <FaStar
 key={star}
 className={star <= (appointment.rating ?? 0) ? "text-yellow-500" : "text-faint"}
 />
 ))}
 </div>
 )}
 </>
 )}
 </div>
 </div>
 </div>
 </div>
 ))
 ) : (
 <div className="bg-surface rounded-lg p-12 text-center">
 <FaCalendarAlt className="text-faint text-5xl mx-auto mb-4" />
 <h3 className="text-xl font-semibold text-soft mb-2">No appointments found</h3>
 <p className="text-soft mb-6">
 {searchQuery || filters.status !== "all" 
 ? "Try adjusting your search or filters" 
 : "You have no appointments scheduled"}
 </p>
 <Link href="/patient/doctor-consultations/book" className="btn-gradient px-6 py-3 inline-block">
 <FaPlus className="inline mr-2" />
 Book Your First Consultation
 </Link>
 </div>
 )}
 </div>
 </div>

 {/* Detail Modal */}
 {showDetailModal && selectedAppointment && (
 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
 <div className="bg-surface rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
 <div className="flex items-center justify-between mb-6">
 <h2 className="text-xl font-bold">Appointment Details</h2>
 <button
 onClick={() => setShowDetailModal(false)}
 className="text-soft hover:text-soft text-2xl"
 >
 
 </button>
 </div>
 
 <div className="space-y-4">
 <div className="flex items-center gap-4 p-4 bg-subtle rounded-lg">
 <div className="text-4xl">{selectedAppointment.doctor.avatar}</div>
 <div>
 <h3 className="font-semibold">{selectedAppointment.doctor.name}</h3>
 <p className="text-soft">{selectedAppointment.doctor.specialty}</p>
 <p className="text-sm text-soft">{selectedAppointment.doctor.hospital}</p>
 </div>
 </div>
 
 <div className="grid md:grid-cols-2 gap-4">
 <div>
 <p className="text-sm text-soft">Date & Time</p>
 <p className="font-medium">{new Date(selectedAppointment.date).toLocaleDateString()}  {selectedAppointment.time}</p>
 </div>
 <div>
 <p className="text-sm text-soft">Type</p>
 <p className="font-medium capitalize">{selectedAppointment.type.replace("-", " ")}</p>
 </div>
 <div>
 <p className="text-sm text-soft">Location</p>
 <p className="font-medium">{selectedAppointment.location}</p>
 </div>
 <div>
 <p className="text-sm text-soft">Status</p>
 <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAppointment.status)}`}>
 {selectedAppointment.status}
 </span>
 </div>
 <div>
 <p className="text-sm text-soft">Reason</p>
 <p className="font-medium">{selectedAppointment.reason}</p>
 </div>
 <div>
 <p className="text-sm text-soft">Amount</p>
 <p className="font-medium">Rs {selectedAppointment.amount}</p>
 </div>
 </div>
 
 {selectedAppointment.notes && (
 <div>
 <p className="text-sm text-soft">Notes</p>
 <p className="font-medium">{selectedAppointment.notes}</p>
 </div>
 )}
 
 <div className="flex gap-3 mt-6">
 <button
 onClick={() => setShowDetailModal(false)}
 className="flex-1 px-4 py-2 border border-line text-soft rounded-lg hover:bg-subtle"
 >
 Close
 </button>
 {selectedAppointment.status === "upcoming" && selectedAppointment.type === "video" && selectedAppointment.meetingLink && (
 <a
 href={selectedAppointment.meetingLink}
 target="_blank"
 rel="noopener noreferrer"
 className="flex-1 btn-gradient py-2 text-center"
 >
 Join Video Call
 </a>
 )}
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Cancel Modal */}
 {showCancelModal && selectedAppointment && (
 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
 <div className="bg-surface rounded-2xl p-6 max-w-md w-full">
 <div className="flex items-center gap-3 mb-4">
 <FaExclamationTriangle className="text-yellow-500 text-xl" />
 <h3 className="text-lg font-semibold">Cancel Appointment?</h3>
 </div>
 <p className="text-soft mb-4">
 Are you sure you want to cancel your appointment with {selectedAppointment.doctor.name} on {new Date(selectedAppointment.date).toLocaleDateString()}?
 </p>
 <p className="text-sm text-soft mb-6">
 Note: Cancellation fees may apply if cancelled within 24 hours of the appointment.
 </p>
 <div className="flex gap-3">
 <button
 onClick={() => setShowCancelModal(false)}
 className="flex-1 px-4 py-2 border border-line text-soft rounded-lg hover:bg-subtle"
 >
 Keep Appointment
 </button>
 <button
 onClick={confirmCancel}
 className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
 >
 Yes, Cancel
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Reschedule Modal */}
 {showRescheduleModal && selectedAppointment && (
 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
 <div className="bg-surface rounded-2xl p-6 max-w-md w-full">
 <h3 className="text-lg font-semibold mb-4">Reschedule Appointment</h3>
 <p className="text-soft mb-6">
 Select a new date and time for your appointment with {selectedAppointment.doctor.name}
 </p>
 <div className="space-y-4">
 <div>
 <label className="block text-soft text-sm font-medium mb-2">New Date</label>
 <input
 type="date"
 min={new Date().toISOString().split("T")[0]}
 className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary-blue"
 />
 </div>
 <div>
 <label className="block text-soft text-sm font-medium mb-2">New Time</label>
 <select className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary-blue">
 <option>09:00 AM</option>
 <option>09:30 AM</option>
 <option>10:00 AM</option>
 <option>10:30 AM</option>
 <option>11:00 AM</option>
 <option>02:00 PM</option>
 <option>02:30 PM</option>
 <option>03:00 PM</option>
 <option>03:30 PM</option>
 <option>04:00 PM</option>
 </select>
 </div>
 </div>
 <div className="flex gap-3 mt-6">
 <button
 onClick={() => setShowRescheduleModal(false)}
 className="flex-1 px-4 py-2 border border-line text-soft rounded-lg hover:bg-subtle"
 >
 Cancel
 </button>
 <button
 onClick={() => {
 setShowRescheduleModal(false)
 // Handle reschedule logic
 }}
 className="flex-1 btn-gradient py-2"
 >
 Confirm Reschedule
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 )
}