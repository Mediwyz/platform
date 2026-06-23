import React, { useState, useEffect, useCallback } from 'react'
import { Patient } from '@/lib/data/patients'
import WeeklySlotPicker from '@/components/booking/WeeklySlotPicker'
import BookingsList, { BookingItem } from '@/components/booking/BookingsList'
import ProviderPageHeader from '@/components/booking/ProviderPageHeader'
import ProviderSearchSelect, { ProviderOption } from '@/components/booking/ProviderSearchSelect'
import {
 FaBaby,
 FaMoon,
 FaVideo,
 FaPlus,
 FaCheckCircle,
 FaTimes,
 FaShieldAlt,
 FaFirstAid,
 FaSun,
 FaHome,
 FaUserCheck,
 FaCameraRetro,
 FaSpinner,
 FaHospital,
} from 'react-icons/fa'

interface Props {
 patientData: Patient
 onVideoCall: () => void
}

interface AvailableNanny {
 id: string
 userId: string
 name: string
 profileImage: string | null
 experience: string
 certifications: string[]
}

interface ChildcareBookingData {
 id: string
 nannyId: string
 nannyName: string
 date: string
 time: string
 duration: number
 type: string
 children: string[]
 specialInstructions?: string
 status: string
}

const ChildcareServices: React.FC<Props> = ({ onVideoCall }) => {
 const [showBookingForm, setShowBookingForm] = useState(false)
 const [bookings, setBookings] = useState<ChildcareBookingData[]>([])
 const [loadingBookings, setLoadingBookings] = useState(true)

 // Booking form state
 const [availableNannies, setAvailableNannies] = useState<AvailableNanny[]>([])
 const [loadingNannies, setLoadingNannies] = useState(false)
 const [selectedNannyId, setSelectedNannyId] = useState('')
 const [careType, setCareType] = useState<'regular' | 'overnight'>('regular')
 const [consultationType, setConsultationType] = useState<'home_visit' | 'in_person' | 'video'>('home_visit')
 const [selectedSlots, setSelectedSlots] = useState<{ date: string; time: string }[]>([])
 const [duration, setDuration] = useState(2)
 const [childrenNames, setChildrenNames] = useState<string[]>([''])
 const [specialInstructions, setSpecialInstructions] = useState('')
 const [isSubmitting, setIsSubmitting] = useState(false)
 const [submitError, setSubmitError] = useState('')
 const [submitSuccess, setSubmitSuccess] = useState(false)

 const [nannyServices, setNannyServices] = useState<{ id: string; serviceName: string; category: string; description: string; price: number; currency: string; ageRange: string | null }[]>([])
 const [loadingServices, setLoadingServices] = useState(false)
 const [selectedServiceId, setSelectedServiceId] = useState('')

 // Fetch childcare bookings for this patient
 const fetchBookings = useCallback(async () => {
 try {
 const res = await fetch('/api/bookings/unified?role=patient', { credentials: 'include' })
 if (res.ok) {
 const json = await res.json()
 if (json.success && json.data) {
  
 const nannyItems = json.data.filter((b: any) => b.type === 'nanny').map((b: any) => ({
 id: b.id,
 nannyId: '',
 nannyName: b.providerName,
 date: new Date(b.scheduledAt).toISOString().split('T')[0],
 time: new Date(b.scheduledAt).toTimeString().slice(0, 5),
 duration: 2,
 type: 'regular',
 children: [],
 status: b.status,
 }))
 setBookings(nannyItems)
 }
 }
 } catch (error) {
 console.error('Failed to fetch childcare bookings:', error)
 } finally {
 setLoadingBookings(false)
 }
 }, [])

 useEffect(() => {
 fetchBookings()
 }, [fetchBookings])

 // Fetch available nannies when booking form opens
 useEffect(() => {
 if (!showBookingForm) return
 const fetchNannies = async () => {
 setLoadingNannies(true)
 try {
 const res = await fetch('/api/search/providers?type=NANNY')
 if (res.ok) {
 const json = await res.json()
 if (json.success && json.data) {
  
 setAvailableNannies(json.data.map((n: any) => ({
 id: n.id,
 userId: n.id,
 name: `${n.firstName} ${n.lastName}`,
 profileImage: n.profileImage || null,
 experience: n.experience || '',
 certifications: n.certifications || [],
 })))
 }
 }
 } catch (error) {
 console.error('Failed to fetch available nannies:', error)
 } finally {
 setLoadingNannies(false)
 }
 }
 fetchNannies()
 }, [showBookingForm])

 // Fetch services for selected nanny
 useEffect(() => {
 if (!selectedNannyId) {
 setNannyServices([])
 setSelectedServiceId('')
 return
 }
 setSelectedServiceId('')
 const fetchServices = async () => {
 setLoadingServices(true)
 try {
 const res = await fetch(`/api/providers/${selectedNannyId}/services`, { credentials: 'include' })
 if (res.ok) {
 const json = await res.json()
 if (json.success && json.data) {
 setNannyServices(json.data)
 }
 }
 } catch (error) {
 console.error('Failed to fetch nanny services:', error)
 } finally {
 setLoadingServices(false)
 }
 }
 fetchServices()
 }, [selectedNannyId])

 const resetBookingForm = () => {
 setSelectedNannyId('')
 setCareType('regular')
 setConsultationType('home_visit')
 setSelectedSlots([])
 setDuration(2)
 setChildrenNames([''])
 setSpecialInstructions('')
 setSubmitError('')
 setSubmitSuccess(false)
 }

 const handleBookingSubmit = async () => {
 const validChildren = childrenNames.filter(n => n.trim())
 if (!selectedNannyId || selectedSlots.length === 0 || validChildren.length === 0) return
 setIsSubmitting(true)
 setSubmitError('')
 try {
 const chosenService = nannyServices.find(s => s.id === selectedServiceId)
 const errors: string[] = []
 let successCount = 0

 for (const slot of selectedSlots) {
 const res = await fetch('/api/bookings', {
 method: 'POST',
 credentials: 'include',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 providerType: 'NANNY',
 nannyId: selectedNannyId,
 consultationType,
 scheduledDate: slot.date,
 scheduledTime: slot.time,
 reason: chosenService?.serviceName || `${careType === 'overnight' ? 'Overnight' : 'Regular'} childcare`,
 ...(specialInstructions ? { notes: specialInstructions } : {}),
 duration: careType === 'overnight' ? 720 : duration * 60,
 children: validChildren,
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

 const selectedNanny = availableNannies.find(n => n.id === selectedNannyId || n.userId === selectedNannyId)
 const validChildren = childrenNames.filter(n => n.trim())
 const canSubmit = selectedNannyId && selectedSlots.length > 0 && validChildren.length > 0 && !isSubmitting

 // Map childcare bookings to BookingItem format
 const bookingItems: BookingItem[] = bookings.map((b) => ({
 id: b.id,
 providerName: b.nannyName,
 date: b.date,
 time: b.time,
 status: b.status,
 type: b.type,
 service: `${b.type === 'overnight' ? 'Overnight' : 'Regular'} Care`,
 notes: b.specialInstructions,
 details: [
 ...(b.children.length > 0 ? [{ label: 'Children', value: b.children.join(', ') }] : []),
 { label: 'Duration', value: `${b.duration} hours` },
 { label: 'Care Type', value: b.type === 'overnight' ? 'Overnight' : 'Regular' },
 ],
 }))

 const renderBookingForm = () => (
 <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 sm:p-4">
 <div className="bg-surface rounded-xl sm:rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
 <div className="p-4 sm:p-5 md:p-6 border-b">
 <div className="flex items-center justify-between">
 <h3 className="text-lg sm:text-xl font-bold text-fg">Book Childcare Service</h3>
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
 <p className="text-soft text-sm">Your childcare booking request has been sent. You will be notified once the nanny confirms.</p>
 </div>
 ) : (
 <>
 {/* Service Type Selection */}
 <div>
 <h4 className="font-semibold text-fg mb-2 sm:mb-3 text-sm sm:text-base">
 Select Service Type <span className="text-red-500">*</span>
 </h4>
 <div className="grid grid-cols-2 gap-3 sm:gap-4">
 <button
 onClick={() => setCareType('regular')}
 className={`border-2 rounded-lg sm:rounded-xl p-3 sm:p-4 text-left transition ${
 careType === 'regular'
 ? 'bg-yellow-50 border-yellow-500 ring-2 ring-yellow-300'
 : 'bg-surface border-yellow-200 hover:border-yellow-300'
 }`}
 >
 <div className="flex items-center gap-2 sm:gap-3 mb-2">
 <FaSun className={`text-lg sm:text-xl ${careType === 'regular' ? 'text-yellow-600' : 'text-yellow-500'}`} />
 <h5 className="font-semibold text-fg text-sm sm:text-base">Regular Care</h5>
 </div>
 <p className="text-xs sm:text-sm text-soft">Daytime childcare</p>
 </button>

 <button
 onClick={() => setCareType('overnight')}
 className={`border-2 rounded-lg sm:rounded-xl p-3 sm:p-4 text-left transition ${
 careType === 'overnight'
 ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-300'
 : 'bg-surface border-purple-200 hover:border-purple-300'
 }`}
 >
 <div className="flex items-center gap-2 sm:gap-3 mb-2">
 <FaMoon className={`text-lg sm:text-xl ${careType === 'overnight' ? 'text-purple-600' : 'text-purple-500'}`} />
 <h5 className="font-semibold text-fg text-sm sm:text-base">Overnight Care</h5>
 </div>
 <p className="text-xs sm:text-sm text-soft">12+ hours care</p>
 </button>
 </div>
 </div>

 {/* Choose Nanny */}
 <ProviderSearchSelect
 providers={availableNannies.map((n): ProviderOption => ({
 id: n.id,
 userId: n.userId,
 name: n.name,
 subtitle: `${n.experience} experience`,
 tags: n.certifications.slice(0, 3),
 }))}
 selectedId={selectedNannyId}
 onSelect={setSelectedNannyId}
 loading={loadingNannies}
 label="Choose Your Nanny"
 placeholder="Search nannies by name, certification..."
 accentColor="purple"
 avatarGradient=" "
 />

 {/* Available Services from this Nanny */}
 {selectedNannyId && (
 <div>
 <h4 className="font-semibold text-fg mb-2 sm:mb-3 text-sm sm:text-base">
 Select Service
 </h4>
 {loadingServices ? (
 <div className="flex items-center gap-2 py-3">
 <FaSpinner className="animate-spin text-purple-500" />
 <span className="text-sm text-soft">Loading services...</span>
 </div>
 ) : nannyServices.length === 0 ? (
 <p className="text-sm text-faint py-3">No services listed by this nanny yet</p>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
 {nannyServices.map((service) => (
 <button
 key={service.id}
 onClick={() => setSelectedServiceId(service.id)}
 className={`p-2.5 sm:p-3 border rounded-lg text-left transition ${
 selectedServiceId === service.id
 ? 'bg-purple-100 border-purple-500 ring-2 ring-purple-300'
 : 'bg-surface'
 }`}
 >
 <p className="font-medium text-fg text-xs sm:text-sm">{service.serviceName}</p>
 {service.description && <p className="text-xs text-soft mt-0.5">{service.description}</p>}
 <div className="flex items-center gap-2 mt-1">
 <span className="text-xs text-purple-600 font-medium">{service.currency} {service.price}</span>
 {service.ageRange && <span className="text-xs text-faint">{service.ageRange}</span>}
 </div>
 </button>
 ))}
 </div>
 )}
 </div>
 )}

 {/* Visit Type */}
 <div>
 <h4 className="font-semibold text-fg mb-3 text-sm sm:text-base">Visit Type</h4>
 <div className="grid grid-cols-3 gap-2 sm:gap-3">
 {[
 { value: 'home_visit' as const, label: 'Home Visit', icon: FaHome },
 { value: 'in_person' as const, label: 'Facility', icon: FaHospital },
 { value: 'video' as const, label: 'Video Call', icon: FaVideo },
 ].map((type) => (
 <button
 key={type.value}
 onClick={() => setConsultationType(type.value)}
 className={`p-3 border rounded-lg text-center transition ${
 consultationType === type.value
 ? 'bg-purple-100 border-purple-500 ring-2 ring-purple-300'
 : 'border-line hover:border-purple-300 hover:bg-purple-50'
 }`}
 >
 <type.icon className={`mx-auto text-lg mb-1 ${consultationType === type.value ? 'text-purple-600' : 'text-faint'}`} />
 <p className="text-xs sm:text-sm font-medium">{type.label}</p>
 </button>
 ))}
 </div>
 </div>

 {/* Duration (regular only) */}
 {careType === 'regular' && (
 <div>
 <label className="block text-xs sm:text-sm font-medium text-soft mb-1 sm:mb-2">Duration</label>
 <select
 value={duration}
 onChange={(e) => setDuration(Number(e.target.value))}
 className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-line rounded-lg focus:outline-none focus:border-purple-500 text-xs sm:text-sm"
 >
 <option value="2">2 hours</option>
 <option value="4">4 hours</option>
 <option value="6">6 hours</option>
 <option value="8">8 hours</option>
 </select>
 </div>
 )}

 {/* Weekly Time Slot Selection */}
 <div>
 <h4 className="font-semibold text-fg mb-3 text-sm sm:text-base">
 Select Time Slot <span className="text-red-500">*</span>
 </h4>
 {!selectedNannyId ? (
 <p className="text-sm text-faint py-3">Select a nanny first to see available times</p>
 ) : (
 <WeeklySlotPicker
 providerId={selectedNannyId}
 providerType="nanny"
 onSelect={() => {}}
 multiSelect
 selectedSlots={selectedSlots}
 onMultiSelect={setSelectedSlots}
 accentColor="purple"
 />
 )}
 </div>

 {/* Children Information */}
 <div>
 <label className="block text-xs sm:text-sm font-medium text-soft mb-1 sm:mb-2">
 Children Names <span className="text-red-500">*</span>
 </label>
 <div className="space-y-2">
 {childrenNames.map((name, index) => (
 <div key={index} className="flex gap-2">
 <input
 type="text"
 value={name}
 onChange={(e) => {
 const updated = [...childrenNames]
 updated[index] = e.target.value
 setChildrenNames(updated)
 }}
 placeholder={`Child ${index + 1} name`}
 className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 border border-line rounded-lg focus:outline-none focus:border-purple-500 text-xs sm:text-sm"
 />
 {childrenNames.length > 1 && (
 <button
 onClick={() => setChildrenNames(childrenNames.filter((_, i) => i !== index))}
 className="px-3 text-red-400 hover:text-red-600"
 >
 <FaTimes />
 </button>
 )}
 </div>
 ))}
 <button
 onClick={() => setChildrenNames([...childrenNames, ''])}
 className="text-purple-600 hover:text-purple-800 text-xs sm:text-sm flex items-center gap-1 sm:gap-2"
 >
 <FaPlus />
 Add Another Child
 </button>
 </div>
 </div>

 {/* Special Instructions */}
 <div>
 <label className="block text-xs sm:text-sm font-medium text-soft mb-1 sm:mb-2">Special Instructions (optional)</label>
 <textarea
 rows={3}
 value={specialInstructions}
 onChange={(e) => setSpecialInstructions(e.target.value)}
 className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-line rounded-lg focus:outline-none focus:border-purple-500 text-xs sm:text-sm"
 placeholder="Any allergies, special needs, dietary restrictions, favorite activities, bedtime routines..."
 />
 </div>

 {/* Summary */}
 {canSubmit && (
 <div className="bg-surface rounded-lg p-4 border border-purple-200">
 <h4 className="font-semibold text-fg mb-2 text-sm">Booking Summary</h4>
 <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
 <div><span className="text-soft">Nanny:</span> <span className="font-medium">{selectedNanny?.name}</span></div>
 <div><span className="text-soft">Type:</span> <span className="font-medium capitalize">{careType} Care</span></div>
 {selectedServiceId && nannyServices.find(s => s.id === selectedServiceId) && (
 <div><span className="text-soft">Service:</span> <span className="font-medium">{nannyServices.find(s => s.id === selectedServiceId)?.serviceName} - {nannyServices.find(s => s.id === selectedServiceId)?.currency} {nannyServices.find(s => s.id === selectedServiceId)?.price}</span></div>
 )}
 <div className="col-span-2"><span className="text-soft">Slots ({selectedSlots.length}):</span>{' '}
 <span className="font-medium">{selectedSlots.map(s => `${new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${s.time}`).join('  ')}</span>
 </div>
 <div><span className="text-soft">Duration:</span> <span className="font-medium">{careType === 'overnight' ? '12 hours' : `${duration} hours`}</span></div>
 <div><span className="text-soft">Children:</span> <span className="font-medium">{validChildren.join(', ')}</span></div>
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
 className="flex-1 px-4 sm:px-6 py-2 sm:py-3 border border-line text-soft rounded-lg hover:bg-subtle transition text-xs sm:text-sm"
 >
 Cancel
 </button>
 <button
 onClick={handleBookingSubmit}
 disabled={!canSubmit}
 className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
 >
 {isSubmitting ? (
 <>
 <FaSpinner className="animate-spin" />
 Booking...
 </>
 ) : (
 'Book Childcare'
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
 <FaSpinner className="animate-spin text-purple-500 text-2xl" />
 </div>
 )
 }

 if (bookings.length === 0) {
 return (
 <div className="space-y-4 sm:space-y-5 md:space-y-6">
 {/* Empty State */}
 <div className="bg-surface rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg text-center border border-purple-200">
 <div className="bg-sky-50 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4">
 <FaBaby className="text-purple-500 text-2xl sm:text-3xl" />
 </div>
 <h3 className="text-lg sm:text-xl font-semibold text-soft mb-2">No Childcare Services</h3>
 <p className="text-soft mb-6 text-sm sm:text-base">Professional childcare services for your peace of mind</p>
 <button
 onClick={() => setShowBookingForm(true)}
 className="bg-surface transition-all transform hover:scale-105 flex items-center gap-2 justify-center text-sm sm:text-base"
 >
 <FaPlus />
 Book Childcare Service
 </button>
 </div>

 {/* Safety Features (moved up since activities are now per-nanny) */}

 {/* Safety Features */}
 <div className="bg-brand-navy rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white">
 <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center">
 <FaShieldAlt className="mr-2" />
 Safety & Trust Features
 </h3>
 <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-3 md:gap-4">
 <div className="bg-sky-100/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4">
 <FaUserCheck className="text-xl sm:text-2xl mb-2" />
 <p className="font-medium text-sm sm:text-base">Background Verified</p>
 <p className="text-xs sm:text-sm opacity-90">All nannies thoroughly screened</p>
 </div>
 <div className="bg-sky-100/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4">
 <FaFirstAid className="text-xl sm:text-2xl mb-2" />
 <p className="font-medium text-sm sm:text-base">First Aid Certified</p>
 <p className="text-xs sm:text-sm opacity-90">CPR and emergency training</p>
 </div>
 <div className="bg-sky-100/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4">
 <FaCameraRetro className="text-xl sm:text-2xl mb-2" />
 <p className="font-medium text-sm sm:text-base">Photo Updates</p>
 <p className="text-xs sm:text-sm opacity-90">Regular activity photos</p>
 </div>
 </div>
 </div>

 {showBookingForm && renderBookingForm()}
 </div>
 )
 }

 return (
 <div className="space-y-4 sm:space-y-5 md:space-y-6">
 <ProviderPageHeader
 icon={FaBaby}
 title="Childcare Services"
 subtitle="Professional childcare for your little ones"
 gradient=" "
 onBook={() => setShowBookingForm(true)}
 bookLabel="Book Service"
 />

 <BookingsList
 bookings={bookingItems}
 providerLabel="Nanny"
 accentColor="purple"
 onVideoCall={() => onVideoCall()}
 emptyMessage="No childcare bookings yet."
 />

 {showBookingForm && renderBookingForm()}
 </div>
 )
}

export default ChildcareServices
