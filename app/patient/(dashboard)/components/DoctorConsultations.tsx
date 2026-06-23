import React, { useState, useEffect, useCallback } from 'react'
import { Patient } from '@/lib/data/patients'
import BookingsList, { BookingItem } from '@/components/booking/BookingsList'
import WeeklySlotPicker from '@/components/booking/WeeklySlotPicker'
import ProviderPageHeader from '@/components/booking/ProviderPageHeader'
import ProviderSearchSelect, { ProviderOption } from '@/components/booking/ProviderSearchSelect'
import {
 FaVideo,
 FaStethoscope,
 FaCheckCircle,
 FaTimes,
 FaSpinner,
 FaHome,
 FaHospital,
} from 'react-icons/fa'

interface Appointment {
 id: string
 doctorName: string
 doctorId: string
 specialty: string
 date: string
 time: string
 duration: number
 type: string
 status: string
 reason: string
 location?: string
 roomId?: string
 notes?: string
}

interface Props {
 patientData: Patient
 onVideoCall: (appointment?: Appointment) => void
}

interface AvailableDoctor {
 id: string
 userId: string
 name: string
 profileImage: string | null
 specialty: string[]
 consultationFee: number | null
 rating: number | null
 location: string | null
}

 
function normalizeAppointment(a: any): Appointment {
 const dt = a.scheduledAt ? new Date(a.scheduledAt) : null
 // Support both legacy Appointment (a.doctor.user.firstName) and ServiceBooking (a.providerName)
 const doctorName = a.doctor
  ? `Dr. ${a.doctor.user?.firstName || ''} ${a.doctor.user?.lastName || ''}`.trim()
  : a.providerName || 'Doctor'
 return {
 id: a.id,
 date: dt ? dt.toISOString().split('T')[0] : '',
 time: dt ? dt.toTimeString().slice(0, 5) : '',
 type: a.type === 'in_person' ? 'in-person' : a.type,
 status: a.status,
 doctorName,
 doctorId: a.doctor?.id ?? a.providerUserId ?? '',
 specialty: a.specialty || '',
 reason: a.reason || a.serviceName || '',
 duration: a.duration || 30,
 location: a.location || undefined,
 roomId: a.roomId || undefined,
 notes: a.notes || undefined,
 }
}

const DoctorConsultations: React.FC<Props> = ({ onVideoCall }) => {
 const [showBookingForm, setShowBookingForm] = useState(false)
 const [appointments, setAppointments] = useState<Appointment[]>([])
 const [loadingBookings, setLoadingBookings] = useState(true)

 // Booking form state
 const [availableDoctors, setAvailableDoctors] = useState<AvailableDoctor[]>([])
 const [loadingDoctors, setLoadingDoctors] = useState(false)
 const [selectedDoctorId, setSelectedDoctorId] = useState('')
 const [consultationType, setConsultationType] = useState<'in_person' | 'home_visit' | 'video'>('in_person')
 const [scheduledDate, setScheduledDate] = useState('')
 const [scheduledTime, setScheduledTime] = useState('')
 const [reason, setReason] = useState('')
 const [notes, setNotes] = useState('')
 const [isSubmitting, setIsSubmitting] = useState(false)
 const [submitError, setSubmitError] = useState('')
 const [submitSuccess, setSubmitSuccess] = useState(false)

 // Service selection state
 const [doctorServices, setDoctorServices] = useState<{ id: string; serviceName: string; category: string; description: string; price: number; currency: string; duration: number }[]>([])
 const [loadingServices, setLoadingServices] = useState(false)
 const [selectedServiceId, setSelectedServiceId] = useState('')

 // Fetch appointments - unified bookings (ServiceBooking + legacy Appointment)
 const fetchAppointments = useCallback(async () => {
 try {
 // Use unified endpoint which includes both ServiceBooking and legacy Appointment
 const res = await fetch(`/api/bookings/unified?role=patient`, { credentials: 'include' })
 if (res.ok) {
 const json = await res.json()
 if (json.success && json.data) {
 // Filter for doctor-type bookings (both legacy 'appointment' and new 'service_booking' with DOCTOR providerType)
 const doctorBookings = json.data.filter((b: any) =>
  b.bookingType === 'appointment' || b.type === 'doctor' ||
  (b.bookingType === 'service_booking' && b.providerType === 'DOCTOR')
 )
 setAppointments(doctorBookings.map(normalizeAppointment))
 }
 }
 } catch (error) {
 console.error('Failed to fetch appointments:', error)
 } finally {
 setLoadingBookings(false)
 }
 }, [])

 useEffect(() => {
 fetchAppointments()
 }, [fetchAppointments])

 // Fetch available doctors when booking form opens
 useEffect(() => {
 if (!showBookingForm) return
 const fetchDoctors = async () => {
 setLoadingDoctors(true)
 try {
 const res = await fetch('/api/search/providers?type=DOCTOR')
 if (res.ok) {
 const json = await res.json()
 if (json.success && json.data) {
  
 setAvailableDoctors(json.data.map((d: any) => ({
 id: d.id,
 userId: d.id,
 name: `${d.firstName} ${d.lastName}`,
 profileImage: d.profileImage || null,
 specialty: d.specialty || [],
 consultationFee: d.consultationFee || null,
 rating: d.rating || null,
 location: d.address || null,
 })))
 }
 }
 } catch (error) {
 console.error('Failed to fetch available doctors:', error)
 } finally {
 setLoadingDoctors(false)
 }
 }
 fetchDoctors()
 }, [showBookingForm])

 // Fetch doctor's services when a doctor is selected
 useEffect(() => {
 if (!selectedDoctorId) {
 setDoctorServices([])
 setSelectedServiceId('')
 return
 }
 const fetchServices = async () => {
 setLoadingServices(true)
 try {
 const res = await fetch(`/api/providers/${selectedDoctorId}/services`, { credentials: 'include' })
 if (res.ok) {
 const json = await res.json()
 if (json.success && json.data) {
 setDoctorServices(json.data)
 }
 }
 } catch {
 // Services are optional - doctor may not have configured any
 } finally {
 setLoadingServices(false)
 }
 }
 fetchServices()
 }, [selectedDoctorId])

 const selectedService = doctorServices.find(s => s.id === selectedServiceId)

 const resetBookingForm = () => {
 setSelectedDoctorId('')
 setConsultationType('in_person')
 setScheduledDate('')
 setScheduledTime('')
 setReason('')
 setNotes('')
 setSubmitError('')
 setSubmitSuccess(false)
 setDoctorServices([])
 setSelectedServiceId('')
 }

 const handleBookingSubmit = async () => {
 if (!selectedDoctorId || !scheduledDate || !scheduledTime || !reason.trim()) return
 setIsSubmitting(true)
 setSubmitError('')
 try {
 const res = await fetch('/api/bookings', {
 method: 'POST',
 credentials: 'include',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 providerType: 'DOCTOR',
 doctorId: selectedDoctorId,
 consultationType,
 scheduledDate,
 scheduledTime,
 reason: reason.trim(),
 ...(notes.trim() ? { notes: notes.trim() } : {}),
 ...(selectedService ? { serviceName: selectedService.serviceName, servicePrice: selectedService.price } : {}),
 }),
 })
 const data = await res.json()
 if (data.success) {
 setSubmitSuccess(true)
 setTimeout(() => {
 setShowBookingForm(false)
 resetBookingForm()
 fetchAppointments()
 }, 1500)
 } else {
 setSubmitError(data.message || 'Booking failed. Please try again.')
 }
 } catch {
 setSubmitError('Network error. Please try again.')
 } finally {
 setIsSubmitting(false)
 }
 }

 const selectedDoctor = availableDoctors.find(d => d.id === selectedDoctorId || d.userId === selectedDoctorId)
 const canSubmit = selectedDoctorId && scheduledDate && scheduledTime && reason.trim() && !isSubmitting

 // Map appointments to BookingItem format
 const bookingItems: BookingItem[] = appointments.map((apt) => ({
 id: apt.id,
 providerName: apt.doctorName,
 date: apt.date,
 time: apt.time,
 status: apt.status,
 type: apt.type,
 service: apt.specialty,
 notes: apt.reason + (apt.notes ? ` | ${apt.notes}` : ''),
 details: [
 { label: 'Specialty', value: apt.specialty },
 { label: 'Duration', value: `${apt.duration} minutes` },
 { label: 'Type', value: apt.type === 'video' ? 'Video Consultation' : 'In-Person Visit' },
 ...(apt.location ? [{ label: 'Location', value: apt.location }] : []),
 ...(apt.roomId ? [{ label: 'Room ID', value: apt.roomId }] : []),
 ],
 }))

 const handleBookingVideoCall = (booking: BookingItem) => {
 const apt = appointments.find(a => a.id === booking.id)
 if (apt && apt.type === 'video' && apt.roomId) {
 localStorage.setItem('current_video_appointment', JSON.stringify(apt))
 onVideoCall(apt)
 }
 }

 const renderBookingForm = () => (
 <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
 <div className="bg-surface rounded-xl sm:rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
 <div className="p-4 sm:p-5 md:p-6 border-b border-blue-200">
 <div className="flex items-center justify-between">
 <h3 className="text-lg sm:text-xl font-bold text-fg">Book Doctor Consultation</h3>
 <button
 onClick={() => { setShowBookingForm(false); resetBookingForm() }}
 className="p-1.5 sm:p-2 text-faint hover:text-soft rounded-lg hover:bg-subtle"
 >
 <FaTimes className="text-lg sm:text-xl" />
 </button>
 </div>
 </div>

 <div className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
 {submitSuccess ? (
 <div className="text-center py-8">
 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
 <FaCheckCircle className="text-green-500 text-3xl" />
 </div>
 <h4 className="text-lg font-semibold text-fg mb-2">Booking Submitted!</h4>
 <p className="text-soft text-sm">Your consultation request has been sent. You will be notified once the doctor confirms.</p>
 </div>
 ) : (
 <>
 {/* Step 1: Select Doctor */}
 <ProviderSearchSelect
 providers={availableDoctors.map((d): ProviderOption => ({
 id: d.id,
 userId: d.userId,
 name: d.name,
 subtitle: d.specialty.join(', '),
 tags: [
 ...(d.rating ? [`★ ${d.rating}`] : []),
 ...(d.consultationFee ? [`Rs ${d.consultationFee}`] : []),
 ...(d.location ? [d.location] : []),
 ],
 }))}
 selectedId={selectedDoctorId}
 onSelect={setSelectedDoctorId}
 loading={loadingDoctors}
 label="Select Doctor"
 placeholder="Search doctors by name, specialty..."
 accentColor="blue"
 avatarGradient=" "
 />

 {/* Step 2: Select Service (if doctor has services configured) */}
 {selectedDoctorId && (
 <div>
 <h4 className="font-semibold text-fg mb-3 text-sm sm:text-base">
 Select Service {doctorServices.length > 0 && <span className="text-faint font-normal">(optional)</span>}
 </h4>
 {loadingServices ? (
 <div className="flex items-center gap-2 text-sm text-soft py-2">
 <FaSpinner className="animate-spin" /> Loading services...
 </div>
 ) : doctorServices.length > 0 ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
 {doctorServices.map(s => (
 <button
 key={s.id}
 onClick={() => setSelectedServiceId(selectedServiceId === s.id ? '' : s.id)}
 className={`p-3 border rounded-lg text-left transition ${
 selectedServiceId === s.id
 ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200'
 : 'border-line hover:border-blue-300 hover:bg-blue-50/50'
 }`}
 >
 <div className="flex items-center justify-between mb-1">
 <span className="font-medium text-sm text-fg">{s.serviceName}</span>
 <span className="text-sm font-bold text-blue-600">{s.currency} {(s.price ?? 0).toLocaleString()}</span>
 </div>
 <p className="text-xs text-soft line-clamp-1">{s.description}</p>
 <div className="flex items-center gap-2 mt-1">
 <span className="text-[10px] px-1.5 py-0.5 bg-subtle rounded text-soft">{s.category}</span>
 <span className="text-[10px] text-faint">{s.duration} min</span>
 </div>
 </button>
 ))}
 </div>
 ) : (
 <p className="text-sm text-faint py-1">This doctor has not configured specific services. Standard consultation fees apply.</p>
 )}
 </div>
 )}

 {/* Step 3: Consultation Type */}
 <div>
 <h4 className="font-semibold text-fg mb-3 text-sm sm:text-base">Consultation Type</h4>
 <div className="grid grid-cols-3 gap-2 sm:gap-3">
 {[
 { value: 'in_person' as const, label: 'In-Person', icon: FaHospital },
 { value: 'home_visit' as const, label: 'Home Visit', icon: FaHome },
 { value: 'video' as const, label: 'Video Call', icon: FaVideo },
 ].map((type) => (
 <button
 key={type.value}
 onClick={() => setConsultationType(type.value)}
 className={`p-3 border rounded-lg text-center transition ${
 consultationType === type.value
 ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-300'
 : 'border-line hover:border-blue-300 hover:bg-blue-50'
 }`}
 >
 <type.icon className={`mx-auto text-lg mb-1 ${consultationType === type.value ? 'text-blue-600' : 'text-faint'}`} />
 <p className="text-xs sm:text-sm font-medium">{type.label}</p>
 </button>
 ))}
 </div>
 </div>

 {/* Step 3: Weekly Time Slot Selection */}
 <div>
 <h4 className="font-semibold text-fg mb-3 text-sm sm:text-base">
 Select Time Slot <span className="text-red-500">*</span>
 </h4>
 {!selectedDoctorId ? (
 <p className="text-sm text-faint py-3">Select a doctor first to see available times</p>
 ) : (
 <WeeklySlotPicker
 providerId={selectedDoctorId}
 providerType="doctor"
 onSelect={(date, time) => { setScheduledDate(date); setScheduledTime(time) }}
 selectedDate={scheduledDate}
 selectedTime={scheduledTime}
 accentColor="blue"
 />
 )}
 </div>

 {/* Step 4: Reason */}
 <div>
 <label className="block text-xs sm:text-sm font-medium text-soft mb-2">
 Reason for Visit <span className="text-red-500">*</span>
 </label>
 <input
 type="text"
 value={reason}
 onChange={(e) => setReason(e.target.value)}
 className="w-full px-3 sm:px-4 py-2 border border-line rounded-lg focus:outline-none focus:border-blue-500 text-sm"
 placeholder="e.g., Annual checkup, headache, follow-up..."
 />
 </div>

 {/* Notes */}
 <div>
 <label className="block text-xs sm:text-sm font-medium text-soft mb-2">Additional Notes (optional)</label>
 <textarea
 rows={3}
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 className="w-full px-3 sm:px-4 py-2 border border-line rounded-lg focus:outline-none focus:border-blue-500 text-sm"
 placeholder="Any specific symptoms or information for the doctor..."
 />
 </div>

 {/* Summary */}
 {canSubmit && (
 <div className="bg-surface rounded-lg p-4 border border-blue-200">
 <h4 className="font-semibold text-fg mb-2 text-sm">Booking Summary</h4>
 <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
 <div><span className="text-soft">Doctor:</span> <span className="font-medium">{selectedDoctor?.name}</span></div>
 <div><span className="text-soft">Specialty:</span> <span className="font-medium">{selectedDoctor?.specialty.join(', ')}</span></div>
 <div><span className="text-soft">Date:</span> <span className="font-medium">{new Date(scheduledDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span></div>
 <div><span className="text-soft">Time:</span> <span className="font-medium">{scheduledTime}</span></div>
 <div><span className="text-soft">Type:</span> <span className="font-medium capitalize">{consultationType.replace('_', ' ')}</span></div>
 {selectedService && (
 <div><span className="text-soft">Service:</span> <span className="font-medium">{selectedService.serviceName} - {selectedService.currency} {selectedService.price.toLocaleString()}</span></div>
 )}
 <div><span className="text-soft">Reason:</span> <span className="font-medium">{reason}</span></div>
 </div>
 </div>
 )}

 {/* Error */}
 {submitError && (
 <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
 {submitError}
 </div>
 )}

 {/* Actions */}
 <div className="flex gap-3 sm:gap-4">
 <button
 onClick={() => { setShowBookingForm(false); resetBookingForm() }}
 className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-sky-50 text-soft rounded-lg transition text-sm sm:text-base"
 >
 Cancel
 </button>
 <button
 onClick={handleBookingSubmit}
 disabled={!canSubmit}
 className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-surface transition text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
 >
 {isSubmitting ? (
 <>
 <FaSpinner className="animate-spin" />
 Booking...
 </>
 ) : (
 'Book Consultation'
 )}
 </button>
 </div>
 </>
 )}
 </div>
 </div>
 </div>
 )

 if (loadingBookings) {
 return (
 <div className="flex items-center justify-center py-12">
 <FaSpinner className="animate-spin text-blue-500 text-2xl" />
 </div>
 )
 }

 return (
 <div className="space-y-4 sm:space-y-5 md:space-y-6">
 <ProviderPageHeader
 icon={FaStethoscope}
 title="Doctor Consultations"
 subtitle="Manage your appointments and medical consultations"
 gradient=" "
 onBook={() => setShowBookingForm(true)}
 bookLabel="Book Appointment"
 />

 <BookingsList
 bookings={bookingItems}
 providerLabel="Doctor"
 accentColor="blue"
 onVideoCall={handleBookingVideoCall}
 emptyMessage="No doctor consultations yet."
 />

 {showBookingForm && renderBookingForm()}
 </div>
 )
}

export default DoctorConsultations
