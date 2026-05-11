import React, { useState, useEffect, useCallback } from 'react'
import { Patient } from '@/lib/data/patients'
import WeeklySlotPicker from '@/components/booking/WeeklySlotPicker'
import BookingsList, { BookingItem } from '@/components/booking/BookingsList'
import ProviderPageHeader from '@/components/booking/ProviderPageHeader'
import ProviderSearchSelect, { ProviderOption } from '@/components/booking/ProviderSearchSelect'
import {
 FaUserNurse,
 FaHome,
 FaHospital,
 FaVideo,
 FaCheckCircle,
 FaTimes,
 FaSpinner,
} from 'react-icons/fa'

interface Props {
 patientData: Patient
 onVideoCall: () => void
}

interface AvailableNurse {
 id: string
 userId: string
 name: string
 profileImage: string | null
 experience: string
 specializations: string[]
}

interface NurseBookingData {
 id: string
 nurseId: string
 nurseName: string
 date: string
 time: string
 type: string
 service: string
 status: string
 notes?: string
}

const NurseServices: React.FC<Props> = ({ onVideoCall }) => {
 const [showBookingForm, setShowBookingForm] = useState(false)
 const [bookings, setBookings] = useState<NurseBookingData[]>([])
 const [loadingBookings, setLoadingBookings] = useState(true)

 // Booking form state
 const [availableNurses, setAvailableNurses] = useState<AvailableNurse[]>([])
 const [selectedNurseId, setSelectedNurseId] = useState('')
 const [selectedService, setSelectedService] = useState('')
 const [consultationType, setConsultationType] = useState<'home_visit' | 'in_person' | 'video'>('home_visit')
 const [selectedSlots, setSelectedSlots] = useState<{ date: string; time: string }[]>([])
 const [notes, setNotes] = useState('')
 const [isSubmitting, setIsSubmitting] = useState(false)
 const [submitError, setSubmitError] = useState('')
 const [submitSuccess, setSubmitSuccess] = useState(false)
 const [loadingNurses, setLoadingNurses] = useState(false)
 const [nurseServices, setNurseServices] = useState<{ id: string; serviceName: string; category: string; description: string; price: number; currency: string; duration: string }[]>([])
 const [loadingServices, setLoadingServices] = useState(false)

 // Fetch nurse bookings for this patient
 const fetchBookings = useCallback(async () => {
 try {
 const res = await fetch('/api/bookings/unified?role=patient', { credentials: 'include' })
 if (res.ok) {
 const json = await res.json()
 if (json.success && json.data) {
  
 const nurseItems = json.data.filter((b: any) => b.type === 'nurse').map((b: any) => ({
 id: b.id,
 nurseId: '',
 nurseName: b.providerName,
 date: new Date(b.scheduledAt).toISOString().split('T')[0],
 time: new Date(b.scheduledAt).toTimeString().slice(0, 5),
 type: b.consultationType || 'home_visit',
 service: b.detail || 'Nursing Service',
 status: b.status,
 }))
 setBookings(nurseItems)
 }
 }
 } catch (error) {
 console.error('Failed to fetch nurse bookings:', error)
 } finally {
 setLoadingBookings(false)
 }
 }, [])

 useEffect(() => {
 fetchBookings()
 }, [fetchBookings])

 // Fetch available nurses
 useEffect(() => {
 if (!showBookingForm) return
 const fetchNurses = async () => {
 setLoadingNurses(true)
 try {
 const res = await fetch('/api/search/providers?type=NURSE')
 if (res.ok) {
 const json = await res.json()
 if (json.success && json.data) {
  
 setAvailableNurses(json.data.map((n: any) => ({
 id: n.id,
 userId: n.id,
 name: `${n.firstName} ${n.lastName}`,
 profileImage: n.profileImage || null,
 experience: n.experience || '',
 specializations: n.specializations || [],
 })))
 }
 }
 } catch (error) {
 console.error('Failed to fetch available nurses:', error)
 } finally {
 setLoadingNurses(false)
 }
 }
 fetchNurses()
 }, [showBookingForm])

 // Fetch services for selected nurse
 useEffect(() => {
 if (!selectedNurseId) {
 setNurseServices([])
 setSelectedService('')
 return
 }
 setSelectedService('')
 const fetchServices = async () => {
 setLoadingServices(true)
 try {
 const res = await fetch(`/api/providers/${selectedNurseId}/services`, { credentials: 'include' })
 if (res.ok) {
 const json = await res.json()
 if (json.success && json.data) {
 setNurseServices(json.data)
 }
 }
 } catch (error) {
 console.error('Failed to fetch nurse services:', error)
 } finally {
 setLoadingServices(false)
 }
 }
 fetchServices()
 }, [selectedNurseId])

 const resetBookingForm = () => {
 setSelectedNurseId('')
 setSelectedService('')
 setConsultationType('home_visit')
 setSelectedSlots([])
 setNotes('')
 setSubmitError('')
 setSubmitSuccess(false)
 }

 const handleBookingSubmit = async () => {
 if (!selectedNurseId || !selectedService || selectedSlots.length === 0) return
 setIsSubmitting(true)
 setSubmitError('')
 try {
 const chosenService = nurseServices.find(s => s.serviceName === selectedService)
 const errors: string[] = []
 let successCount = 0

 for (const slot of selectedSlots) {
 const res = await fetch('/api/bookings', {
 method: 'POST',
 credentials: 'include',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 providerType: 'NURSE',
 nurseId: selectedNurseId,
 consultationType,
 scheduledDate: slot.date,
 scheduledTime: slot.time,
 reason: selectedService,
 ...(notes ? { notes } : {}),
 serviceName: chosenService?.serviceName,
 servicePrice: chosenService?.price,
 }),
 })
 const data = await res.json()
 if (data.success) {
 successCount++
 } else {
 errors.push(`${slot.date} ${slot.time}: ${data.message}`)
 }
 }

 if (successCount > 0) {
 setSubmitSuccess(true)
 if (errors.length > 0) {
 setSubmitError(`${successCount} booking(s) created. Some failed: ${errors.join('; ')}`)
 }
 setTimeout(() => {
 setShowBookingForm(false)
 resetBookingForm()
 fetchBookings()
 }, 1500)
 } else {
 setSubmitError(errors[0] || 'Booking failed. Please try again.')
 }
 } catch {
 setSubmitError('Network error. Please try again.')
 } finally {
 setIsSubmitting(false)
 }
 }

 const selectedNurse = availableNurses.find(n => n.id === selectedNurseId || n.userId === selectedNurseId)
 const canSubmit = selectedNurseId && selectedService && selectedSlots.length > 0 && !isSubmitting

 // Map nurse bookings to BookingItem format
 const bookingItems: BookingItem[] = bookings.map((b) => ({
 id: b.id,
 providerName: b.nurseName,
 date: b.date,
 time: b.time,
 status: b.status,
 type: b.type,
 service: b.service,
 notes: b.notes,
 details: [
 { label: 'Service', value: b.service },
 { label: 'Visit Type', value: (b.type || '').replace('_', ' ') },
 ],
 }))

 const renderBookingForm = () => (
 <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
 <div className="bg-white rounded-xl sm:rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
 <div className="p-4 sm:p-5 md:p-6 border-b border-pink-200">
 <div className="flex items-center justify-between">
 <h3 className="text-lg sm:text-xl font-bold text-gray-900">Book Nurse Service</h3>
 <button
 onClick={() => { setShowBookingForm(false); resetBookingForm() }}
 className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
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
 <h4 className="text-lg font-semibold text-gray-900 mb-2">Booking Submitted!</h4>
 <p className="text-gray-600 text-sm">Your nurse booking request has been sent. You will be notified once the nurse confirms.</p>
 </div>
 ) : (
 <>
 {/* Step 1: Select Nurse */}
 <ProviderSearchSelect
 providers={availableNurses.map((n): ProviderOption => ({
 id: n.id,
 userId: n.userId,
 name: n.name,
 subtitle: `${n.experience} experience`,
 tags: n.specializations.slice(0, 3),
 }))}
 selectedId={selectedNurseId}
 onSelect={setSelectedNurseId}
 loading={loadingNurses}
 label="Select Nurse"
 placeholder="Search nurses by name, specialization..."
 accentColor="pink"
 avatarGradient=" "
 />

 {/* Step 2: Service Selection */}
 <div>
 <h4 className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">
 Select Service <span className="text-red-500">*</span>
 </h4>
 {!selectedNurseId ? (
 <p className="text-sm text-gray-400 py-3">Select a nurse first to see available services</p>
 ) : loadingServices ? (
 <div className="flex items-center gap-2 py-3">
 <FaSpinner className="animate-spin text-pink-500" />
 <span className="text-sm text-gray-500">Loading services...</span>
 </div>
 ) : nurseServices.length === 0 ? (
 <p className="text-sm text-gray-400 py-3">No services available from this nurse</p>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
 {nurseServices.map((service) => (
 <button
 key={service.id}
 onClick={() => setSelectedService(service.serviceName)}
 className={`p-2.5 sm:p-3 border rounded-lg text-left transition ${
 selectedService === service.serviceName
 ? 'bg-pink-100 border-pink-500 ring-2 ring-pink-300'
 : 'bg-white'
 }`}
 >
 <p className="font-medium text-gray-900 text-xs sm:text-sm">{service.serviceName}</p>
 {service.description && <p className="text-xs text-gray-500 mt-0.5">{service.description}</p>}
 <div className="flex items-center gap-2 mt-1">
 <span className="text-xs text-pink-600 font-medium">{service.currency} {service.price}</span>
 <span className="text-xs text-gray-400">{service.duration}</span>
 </div>
 </button>
 ))}
 </div>
 )}
 </div>

 {/* Step 3: Consultation Type */}
 <div>
 <h4 className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">Service Type</h4>
 <div className="grid grid-cols-3 gap-2 sm:gap-3">
 {[
 { value: 'home_visit' as const, label: 'Home Visit', icon: FaHome },
 { value: 'in_person' as const, label: 'Clinic', icon: FaHospital },
 { value: 'video' as const, label: 'Video Call', icon: FaVideo },
 ].map((type) => (
 <button
 key={type.value}
 onClick={() => setConsultationType(type.value)}
 className={`p-3 border rounded-lg text-center transition ${
 consultationType === type.value
 ? 'bg-pink-100 border-pink-500 ring-2 ring-pink-300'
 : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50'
 }`}
 >
 <type.icon className={`mx-auto text-lg mb-1 ${consultationType === type.value ? 'text-pink-600' : 'text-gray-400'}`} />
 <p className="text-xs sm:text-sm font-medium">{type.label}</p>
 </button>
 ))}
 </div>
 </div>

 {/* Step 4: Weekly Time Slot Selection */}
 <div>
 <h4 className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">
 Select Time Slot <span className="text-red-500">*</span>
 </h4>
 {!selectedNurseId ? (
 <p className="text-sm text-gray-400 py-3">Select a nurse first to see available times</p>
 ) : (
 <WeeklySlotPicker
 providerId={selectedNurseId}
 providerType="nurse"
 onSelect={() => {}}
 multiSelect
 selectedSlots={selectedSlots}
 onMultiSelect={setSelectedSlots}
 accentColor="pink"
 />
 )}
 </div>

 {/* Notes */}
 <div>
 <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Special Instructions (optional)</label>
 <textarea
 rows={3}
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500 text-sm"
 placeholder="Any specific requirements or notes for the nurse..."
 />
 </div>

 {/* Summary */}
 {canSubmit && (
 <div className="bg-white rounded-lg p-4 border border-pink-200">
 <h4 className="font-semibold text-gray-800 mb-2 text-sm">Booking Summary</h4>
 <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
 <div><span className="text-gray-500">Nurse:</span> <span className="font-medium">{selectedNurse?.name}</span></div>
 <div><span className="text-gray-500">Service:</span> <span className="font-medium">{selectedService}{nurseServices.find(s => s.serviceName === selectedService)?.price ? ` — ${nurseServices.find(s => s.serviceName === selectedService)?.currency} ${nurseServices.find(s => s.serviceName === selectedService)?.price}` : ''}</span></div>
 <div className="col-span-2"><span className="text-gray-500">Slots ({selectedSlots.length}):</span>{' '}
 <span className="font-medium">{selectedSlots.map(s => `${new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${s.time}`).join(' • ')}</span>
 </div>
 <div><span className="text-gray-500">Type:</span> <span className="font-medium capitalize">{consultationType.replace('_', ' ')}</span></div>
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
 className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-sky-50 text-gray-700 rounded-lg transition text-sm sm:text-base"
 >
 Cancel
 </button>
 <button
 onClick={handleBookingSubmit}
 disabled={!canSubmit}
 className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-white transition text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
 >
 {isSubmitting ? (
 <>
 <FaSpinner className="animate-spin" />
 Booking...
 </>
 ) : (
 'Book Appointment'
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
 <FaSpinner className="animate-spin text-pink-500 text-2xl" />
 </div>
 )
 }

 return (
 <div className="space-y-4 sm:space-y-5 md:space-y-6">
 <ProviderPageHeader
 icon={FaUserNurse}
 title="Nurse Services"
 subtitle="Professional nursing care and health support"
 gradient=" "
 onBook={() => setShowBookingForm(true)}
 bookLabel="Book Service"
 />

 <BookingsList
 bookings={bookingItems}
 providerLabel="Nurse"
 accentColor="pink"
 onVideoCall={() => onVideoCall()}
 emptyMessage="No nurse bookings yet."
 />

 {showBookingForm && renderBookingForm()}
 </div>
 )
}

export default NurseServices
