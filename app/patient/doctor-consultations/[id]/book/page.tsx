"use client"

import { useState, useEffect, useCallback } from "react"
import { getUserId } from '@/hooks/useUser'
import Link from "next/link"
import { useParams } from "next/navigation"
import { 
 FaArrowLeft,
 FaMapMarkerAlt,
 FaVideo,
 FaUser,
 FaCheck,
 FaInfoCircle,
 FaStar,
 FaPhone,
 FaCalendarAlt,
 FaShieldAlt,
 FaWallet,
 FaTicketAlt,
 FaDownload,
 FaPrint,
 FaCalendarPlus
} from "react-icons/fa"

interface Doctor {
 id: string;
 name: string;
 specialty: string;
 rating: number;
 experience: string;
 consultationFee: number;
 avatar: string;
 availability: string[];
 languages: string[];
 location: string;
 qualifications: string[];
 about: string;
}

interface TimeSlot {
 time: string;
 available: boolean;
 type: "regular" | "urgent" | "priority";
}

interface AppointmentDetails {
 doctor: Doctor;
 date: string;
 time: string;
 type: "video" | "in-person";
 reason: string;
 notes: string;
}

interface PaymentMethod {
 id: string;
 type: "mcb-juice" | "corporate" | "insurance" | "subscription";
 name: string;
 description: string;
 discount?: number;
 icon: string;
 available: boolean;
}

const defaultDoctor: Doctor = {
 id: "", name: "", specialty: "", rating: 0, experience: "",
 consultationFee: 0, avatar: "👨‍⚕️", availability: [], languages: [],
 location: "", qualifications: [], about: ""
}

function generateTimeSlots(): TimeSlot[] {
 const slots: TimeSlot[] = []
 const hours = [9, 9.5, 10, 10.5, 11, 11.5, 14, 14.5, 15, 15.5, 16, 16.5]
 for (const h of hours) {
 const hour = Math.floor(h)
 const min = h % 1 === 0.5 ? '30' : '00'
 const ampm = hour >= 12 ? 'PM' : 'AM'
 const displayHour = hour > 12 ? hour - 12 : hour
 slots.push({ time: `${String(displayHour).padStart(2, '0')}:${min} ${ampm}`, available: true, type: "regular" })
 }
 return slots
}

const paymentMethods: PaymentMethod[] = [
 {
 id: "mcb-juice",
 type: "mcb-juice",
 name: "MCB Juice",
 description: "Pay instantly with MCB Juice mobile payment",
 icon: "📱",
 available: true
 },
 {
 id: "corporate",
 type: "corporate",
 name: "Corporate Health Plan",
 description: "Use your company's health benefits",
 discount: 50,
 icon: "🏢",
 available: true
 },
 {
 id: "insurance",
 type: "insurance",
 name: "Insurance Coverage",
 description: "Apply insurance coverage (80% covered)",
 discount: 80,
 icon: "🛡️",
 available: true
 },
 {
 id: "subscription",
 type: "subscription",
 name: "Monthly Subscription",
 description: "Use your active healthcare subscription",
 discount: 100,
 icon: "💳",
 available: true
 }
]

export default function DoctorConsultationBooking() {
 const { id: doctorId } = useParams<{ id: string }>()
 const [currentStep, setCurrentStep] = useState(1)
 const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(generateTimeSlots())
 const [appointmentDetails, setAppointmentDetails] = useState<AppointmentDetails>({
 doctor: defaultDoctor,
 date: "",
 time: "",
 type: "video",
 reason: "",
 notes: ""
 })
 const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)
 const [isProcessing, setIsProcessing] = useState(false)
 const [bookingConfirmed, setBookingConfirmed] = useState(false)
 const [ticketId, setTicketId] = useState("")

 // Fetch doctor from API
 const fetchDoctor = useCallback(async () => {
 if (!doctorId) return
 try {
 const res = await fetch(`/api/search/doctors?q=`)
 const data = await res.json()
 if (data.data) {
  
 const doc = data.data.find((d: any) => d.id === doctorId)
 if (doc) {
 setAppointmentDetails(prev => ({
 ...prev,
 doctor: {
 id: doc.id,
 name: `Dr. ${doc.firstName} ${doc.lastName}`,
 specialty: Array.isArray(doc.specialty) ? doc.specialty[0] : doc.specialty,
 rating: doc.rating || 4.5,
 experience: doc.experience ? `${doc.experience} years` : 'Experienced',
 consultationFee: doc.consultationFee || 2000,
 avatar: doc.profileImage || '👨‍⚕️',
 availability: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
 languages: doc.languages || ['English', 'French'],
 location: doc.location || '',
 qualifications: doc.education?.map((e: { degree: string }) => e.degree) || [],
 about: doc.bio || '',
 }
 }))
 }
 }
 } catch { /* silent */ }
 }, [doctorId])

 // Fetch schedule slots for selected date
 const fetchSchedule = useCallback(async () => {
 if (!doctorId || !appointmentDetails.date) return
 try {
 const res = await fetch(`/api/providers/${doctorId}/schedule`, { credentials: 'include' })
 const data = await res.json()
 if (data.data?.length > 0) {
 const dayOfWeek = new Date(appointmentDetails.date).getDay()
  
 const daySlots = data.data.filter((s: any) => s.dayOfWeek === dayOfWeek)
 if (daySlots.length > 0) {
  
 setTimeSlots(daySlots.map((s: any) => ({
 time: s.startTime,
 available: s.isAvailable !== false,
 type: 'regular' as const,
 })))
 return
 }
 }
 setTimeSlots(generateTimeSlots())
 } catch {
 setTimeSlots(generateTimeSlots())
 }
 }, [doctorId, appointmentDetails.date])

 useEffect(() => { fetchDoctor() }, [fetchDoctor])
 useEffect(() => { fetchSchedule() }, [fetchSchedule])

 const steps = [
 { number: 1, title: "Doctor Details", icon: FaUser },
 { number: 2, title: "Schedule", icon: FaCalendarAlt },
 { number: 3, title: "Consultation Info", icon: FaInfoCircle },
 { number: 4, title: "Payment", icon: FaWallet },
 { number: 5, title: "Confirmation", icon: FaTicketAlt }
 ]

 const handleTimeSelect = (time: string) => {
 setAppointmentDetails({ ...appointmentDetails, time })
 }

 const handleDateChange = (date: string) => {
 setAppointmentDetails({ ...appointmentDetails, date })
 }

 const handlePayment = async () => {
 setIsProcessing(true)
 try {
 const userId = getUserId()
 if (userId && doctorId) {
 const time24 = convertTo24h(appointmentDetails.time)
 await fetch('/api/bookings', {
 method: 'POST',
 credentials: 'include',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 providerType: 'DOCTOR',
 doctorId,
 consultationType: appointmentDetails.type,
 scheduledDate: appointmentDetails.date,
 scheduledTime: time24,
 reason: appointmentDetails.reason,
 notes: appointmentDetails.notes,
 }),
 })
 }
 setBookingConfirmed(true)
 setTicketId(`TKT-${Date.now()}`)
 setCurrentStep(5)
 } catch {
 setBookingConfirmed(true)
 setTicketId(`TKT-${Date.now()}`)
 setCurrentStep(5)
 } finally {
 setIsProcessing(false)
 }
 }

 function convertTo24h(time12: string): string {
 const [time, period] = time12.split(' ')
 const [h, m] = time.split(':').map(Number)
 const hour = period === 'PM' && h !== 12 ? h + 12 : (period === 'AM' && h === 12 ? 0 : h)
 return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')}`
 }

 const calculateFinalAmount = () => {
 if (!selectedPaymentMethod) return appointmentDetails.doctor.consultationFee + 50
 
 const baseAmount = appointmentDetails.doctor.consultationFee + 50
 if (selectedPaymentMethod.discount) {
 return baseAmount * (1 - selectedPaymentMethod.discount / 100)
 }
 return baseAmount
 }

 const getTimeSlotStyle = (slot: TimeSlot, isSelected: boolean) => {
 if (!slot.available) return "bg-subtle text-faint cursor-not-allowed"
 if (isSelected) return "bg-blue-600 text-white border-blue-600"
 
 switch (slot.type) {
 case "urgent":
 return "border-red-300 text-red-600 hover:bg-red-50 hover:border-red-500"
 case "priority":
 return "border-green-300 text-green-600 hover:bg-green-50 hover:border-green-500"
 default:
 return "border-line hover:border-blue-400 hover:bg-blue-50"
 }
 }

 return (
 <div className="min-h-screen to-white">
 {/* Header */}
 <div className="bg-surface shadow-sm border-b">
 <div className="container mx-auto px-4 py-4">
 <div className="flex items-center gap-4">
 <Link href="/patient" className="text-soft hover:text-blue-600">
 <FaArrowLeft className="text-xl" />
 </Link>
 <div>
 <h1 className="text-2xl font-bold text-fg">Book Consultation</h1>
 <p className="text-soft">Schedule your appointment with Dr. {appointmentDetails.doctor.name}</p>
 </div>
 </div>
 </div>
 </div>

 {/* Progress Steps */}
 <div className="bg-surface border-b">
 <div className="container mx-auto px-4 py-6">
 <div className="flex items-center justify-between max-w-4xl mx-auto">
 {steps.map((step, index) => (
 <div key={step.number} className="flex items-center">
 <div className="flex flex-col items-center">
 <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold ${
 currentStep > step.number ? "bg-green-500 text-white" :
 currentStep === step.number ? "bg-blue-600 text-white" :
 "bg-line text-soft"
 }`}>
 {currentStep > step.number ? <FaCheck /> : <step.icon />}
 </div>
 <span className={`text-xs mt-2 text-center ${
 currentStep >= step.number ? "text-blue-600 font-medium" : "text-soft"
 }`}>
 {step.title}
 </span>
 </div>
 {index < steps.length - 1 && (
 <div className={`w-16 h-1 mx-2 ${
 currentStep > step.number ? "bg-green-500" : "bg-line"
 }`} />
 )}
 </div>
 ))}
 </div>
 </div>
 </div>

 <div className="container mx-auto px-4 py-8">
 {/* Step 1: Doctor Details */}
 {currentStep === 1 && (
 <div className="max-w-4xl mx-auto">
 <div className="bg-surface rounded-2xl p-8 shadow-lg">
 <h2 className="text-2xl font-bold text-fg mb-6">Doctor Information</h2>
 
 <div className="flex flex-col lg:flex-row gap-8">
 <div className="lg:w-1/3">
 <div className="text-center">
 <div className="text-8xl mb-4">{appointmentDetails.doctor.avatar}</div>
 <div className="flex items-center justify-center gap-1 text-yellow-500 mb-2">
 <FaStar />
 <span className="font-bold text-lg">{appointmentDetails.doctor.rating}</span>
 <span className="text-soft text-sm">(248 reviews)</span>
 </div>
 </div>
 </div>
 
 <div className="lg:w-2/3">
 <h3 className="text-2xl font-bold text-fg mb-2">{appointmentDetails.doctor.name}</h3>
 <p className="text-lg text-blue-600 font-semibold mb-3">{appointmentDetails.doctor.specialty}</p>
 
 <div className="grid md:grid-cols-2 gap-4 mb-6">
 <div>
 <h4 className="font-semibold text-fg mb-2">Experience</h4>
 <p className="text-soft">{appointmentDetails.doctor.experience}</p>
 </div>
 <div>
 <h4 className="font-semibold text-fg mb-2">Consultation Fee</h4>
 <p className="text-2xl font-bold text-green-600">Rs {appointmentDetails.doctor.consultationFee}</p>
 </div>
 <div>
 <h4 className="font-semibold text-fg mb-2">Languages</h4>
 <p className="text-soft">{appointmentDetails.doctor.languages.join(", ")}</p>
 </div>
 <div>
 <h4 className="font-semibold text-fg mb-2">Qualifications</h4>
 <p className="text-soft">{appointmentDetails.doctor.qualifications.join(", ")}</p>
 </div>
 </div>
 
 <div className="mb-6">
 <h4 className="font-semibold text-fg mb-2">Location</h4>
 <div className="flex items-center gap-2 text-soft">
 <FaMapMarkerAlt />
 <span>{appointmentDetails.doctor.location}</span>
 </div>
 </div>
 
 <div>
 <h4 className="font-semibold text-fg mb-2">About</h4>
 <p className="text-soft">{appointmentDetails.doctor.about}</p>
 </div>
 </div>
 </div>
 
 <div className="flex justify-end mt-8">
 <button
 onClick={() => setCurrentStep(2)}
 className="bg-brand-navy transition-all"
 >
 Continue to Schedule
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Step 2: Schedule Selection */}
 {currentStep === 2 && (
 <div className="max-w-4xl mx-auto">
 <div className="grid lg:grid-cols-2 gap-6">
 {/* Date & Type Selection */}
 <div className="bg-surface rounded-2xl p-6 shadow-lg">
 <h3 className="text-xl font-bold text-fg mb-6">Select Date & Type</h3>
 
 <div className="mb-6">
 <label className="block text-soft text-sm font-medium mb-2">
 Consultation Date
 </label>
 <input
 type="date"
 value={appointmentDetails.date}
 onChange={(e) => handleDateChange(e.target.value)}
 min={new Date().toISOString().split("T")[0]}
 className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600"
 />
 </div>
 
 </div>

 {/* Time Slots */}
 <div className="bg-surface rounded-2xl p-6 shadow-lg">
 <h3 className="text-xl font-bold text-fg mb-6">Available Time Slots</h3>
 {appointmentDetails.date ? (
 <div>
 <div className="mb-4">
 <div className="flex items-center gap-4 text-xs">
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 border-2 border-line rounded"></div>
 <span>Regular</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 border-2 border-green-300 rounded"></div>
 <span>Priority</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 border-2 border-red-300 rounded"></div>
 <span>Urgent</span>
 </div>
 </div>
 </div>
 
 <div className="grid grid-cols-3 gap-3">
 {timeSlots.map((slot) => (
 <button
 key={slot.time}
 onClick={() => handleTimeSelect(slot.time)}
 disabled={!slot.available}
 className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${getTimeSlotStyle(slot, appointmentDetails.time === slot.time)}`}
 >
 {slot.time}
 </button>
 ))}
 </div>
 </div>
 ) : (
 <div className="text-center py-12">
 <FaCalendarAlt className="text-4xl text-faint mx-auto mb-4" />
 <p className="text-soft">Please select a date to view available times</p>
 </div>
 )}
 </div>
 </div>

 <div className="flex justify-between mt-6">
 <button
 onClick={() => setCurrentStep(1)}
 className="px-6 py-3 border border-line text-soft rounded-lg hover:bg-subtle"
 >
 Back
 </button>
 <button
 onClick={() => setCurrentStep(3)}
 disabled={!appointmentDetails.date || !appointmentDetails.time}
 className="bg-brand-navy text-white px-8 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
 >
 Continue
 </button>
 </div>
 </div>
 )}

 {/* Step 3: Consultation Details */}
 {currentStep === 3 && (
 <div className="max-w-2xl mx-auto">
 <div className="bg-surface rounded-2xl p-8 shadow-lg">
 <h2 className="text-2xl font-bold text-fg mb-6">Consultation Information</h2>
 
 <div className="space-y-6">
 <div>
 <label className="block text-soft text-sm font-medium mb-2">
 Reason for Consultation *
 </label>
 <select
 value={appointmentDetails.reason}
 onChange={(e) => setAppointmentDetails({
 ...appointmentDetails,
 reason: e.target.value
 })}
 className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600"
 required
 >
 <option value="">Select reason</option>
 <option value="routine-checkup">Routine Checkup</option>
 <option value="follow-up">Follow-up Consultation</option>
 <option value="chest-pain">Chest Pain/Discomfort</option>
 <option value="heart-palpitations">Heart Palpitations</option>
 <option value="high-blood-pressure">High Blood Pressure</option>
 <option value="shortness-breath">Shortness of Breath</option>
 <option value="preventive-screening">Preventive Screening</option>
 <option value="second-opinion">Second Opinion</option>
 <option value="other">Other</option>
 </select>
 </div>

 <div>
 <label className="block text-soft text-sm font-medium mb-2">
 Additional Notes (Optional)
 </label>
 <textarea
 value={appointmentDetails.notes}
 onChange={(e) => setAppointmentDetails({
 ...appointmentDetails,
 notes: e.target.value
 })}
 rows={4}
 placeholder="Please describe your symptoms, concerns, or any relevant medical history..."
 className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600"
 />
 </div>

 {/* Appointment Summary */}
 <div className="bg-surface rounded-xl p-6 border border-blue-100">
 <h3 className="font-bold text-fg mb-4 flex items-center gap-2">
 <FaInfoCircle className="text-blue-600" />
 Appointment Summary
 </h3>
 <div className="grid md:grid-cols-2 gap-4 text-sm">
 <div>
 <span className="text-soft">Doctor:</span>
 <p className="font-semibold">{appointmentDetails.doctor.name}</p>
 </div>
 <div>
 <span className="text-soft">Specialty:</span>
 <p className="font-semibold">{appointmentDetails.doctor.specialty}</p>
 </div>
 <div>
 <span className="text-soft">Date:</span>
 <p className="font-semibold">{appointmentDetails.date}</p>
 </div>
 <div>
 <span className="text-soft">Time:</span>
 <p className="font-semibold">{appointmentDetails.time}</p>
 </div>
 <div>
 <span className="text-soft">Type:</span>
 <p className="font-semibold">{appointmentDetails.type === "video" ? "Video Consultation" : "In-Person Visit"}</p>
 </div>
 <div>
 <span className="text-soft">Fee:</span>
 <p className="font-semibold text-green-600">Rs {appointmentDetails.doctor.consultationFee}</p>
 </div>
 </div>
 </div>
 </div>

 <div className="flex justify-between mt-8">
 <button
 onClick={() => setCurrentStep(2)}
 className="px-6 py-3 border border-line text-soft rounded-lg hover:bg-subtle"
 >
 Back
 </button>
 <button
 onClick={() => setCurrentStep(4)}
 disabled={!appointmentDetails.reason}
 className="bg-brand-navy text-white px-8 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
 >
 Proceed to Payment
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Step 4: Payment */}
 {currentStep === 4 && (
 <div className="max-w-2xl mx-auto">
 <div className="bg-surface rounded-2xl p-8 shadow-lg">
 <h2 className="text-2xl font-bold text-fg mb-6">Payment Options</h2>
 
 {/* Payment Methods */}
 <div className="space-y-4 mb-8">
 <h3 className="font-semibold text-fg mb-4">Select Payment Method</h3>
 {paymentMethods.map((method) => (
 <label
 key={method.id}
 className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-subtle ${
 selectedPaymentMethod?.id === method.id 
 ? "border-blue-600 bg-blue-50" 
 : "border-line"
 }`}
 >
 <input
 type="radio"
 name="payment"
 checked={selectedPaymentMethod?.id === method.id}
 onChange={() => setSelectedPaymentMethod(method)}
 className="mr-4"
 />
 <div className="text-3xl mr-4">{method.icon}</div>
 <div className="flex-1">
 <div className="flex items-center gap-2">
 <span className="font-semibold">{method.name}</span>
 {method.discount && (
 <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
 {method.discount}% OFF
 </span>
 )}
 </div>
 <p className="text-sm text-soft mt-1">{method.description}</p>
 </div>
 {!method.available && (
 <span className="text-sm text-red-600 font-medium">Unavailable</span>
 )}
 </label>
 ))}
 </div>

 {/* Payment Summary */}
 <div className="bg-surface rounded-xl p-6 mb-6 border">
 <h3 className="font-bold text-fg mb-4">Payment Summary</h3>
 <div className="space-y-3">
 <div className="flex justify-between">
 <span className="text-soft">Consultation Fee</span>
 <span className="font-medium">Rs {appointmentDetails.doctor.consultationFee}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-soft">Platform Fee</span>
 <span className="font-medium">Rs 50</span>
 </div>
 {selectedPaymentMethod?.discount && (
 <div className="flex justify-between text-green-600">
 <span>Discount ({selectedPaymentMethod.discount}%)</span>
 <span className="font-medium">
 - Rs {Math.round((appointmentDetails.doctor.consultationFee + 50) * selectedPaymentMethod.discount / 100)}
 </span>
 </div>
 )}
 <div className="border-t pt-3 flex justify-between">
 <span className="font-bold text-lg">Total Amount</span>
 <span className="font-bold text-xl text-green-600">
 Rs {Math.round(calculateFinalAmount())}
 </span>
 </div>
 </div>
 </div>

 {/* Security Notice */}
 <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
 <div className="flex items-start gap-3">
 <FaShieldAlt className="text-blue-600 mt-1" />
 <div>
 <h4 className="font-semibold text-blue-800 mb-1">Secure Payment</h4>
 <p className="text-blue-700 text-sm">All payments are encrypted and processed securely. Your financial information is protected.</p>
 </div>
 </div>
 </div>

 <div className="flex justify-between">
 <button
 onClick={() => setCurrentStep(3)}
 className="px-6 py-3 border border-line text-soft rounded-lg hover:bg-subtle"
 >
 Back
 </button>
 <button
 onClick={handlePayment}
 disabled={!selectedPaymentMethod || isProcessing}
 className="bg-brand-teal text-white px-8 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
 >
 {isProcessing ? (
 <>
 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
 Processing...
 </>
 ) : (
 <>
 <FaWallet />
 Confirm & Pay Rs {Math.round(calculateFinalAmount())}
 </>
 )}
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Step 5: Confirmation */}
 {currentStep === 5 && bookingConfirmed && (
 <div className="max-w-2xl mx-auto">
 <div className="bg-surface rounded-2xl p-8 shadow-lg text-center">
 <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
 <FaCheck className="text-green-600 text-3xl" />
 </div>
 
 <h2 className="text-3xl font-bold text-fg mb-3">Consultation Booked!</h2>
 <p className="text-soft mb-8">Your appointment has been successfully confirmed. Here is your digital ticket.</p>
 
 {/* Digital Ticket */}
 <div className="bg-brand-navy rounded-2xl p-6 text-white mb-8 text-left">
 <div className="flex items-center justify-between mb-6">
 <div>
 <h3 className="text-xl font-bold mb-1">Digital Consultation Ticket</h3>
 <p className="text-blue-100 text-sm">Keep this for your records</p>
 </div>
 <div className="text-right">
 <p className="text-blue-100 text-sm">Ticket ID</p>
 <p className="font-bold text-lg">{ticketId}</p>
 </div>
 </div>
 
 <div className="grid md:grid-cols-2 gap-6">
 <div>
 <h4 className="font-semibold mb-3 text-blue-100">Doctor Details</h4>
 <div className="space-y-2 text-sm">
 <p><span className="text-blue-200">Name:</span> {appointmentDetails.doctor.name}</p>
 <p><span className="text-blue-200">Specialty:</span> {appointmentDetails.doctor.specialty}</p>
 <p><span className="text-blue-200">Location:</span> {appointmentDetails.doctor.location}</p>
 </div>
 </div>
 
 <div>
 <h4 className="font-semibold mb-3 text-blue-100">Appointment Details</h4>
 <div className="space-y-2 text-sm">
 <p><span className="text-blue-200">Date:</span> {appointmentDetails.date}</p>
 <p><span className="text-blue-200">Time:</span> {appointmentDetails.time}</p>
 <p><span className="text-blue-200">Type:</span> {appointmentDetails.type === "video" ? "Video Call" : "In-Person"}</p>
 <p><span className="text-blue-200">Amount Paid:</span> Rs {Math.round(calculateFinalAmount())}</p>
 </div>
 </div>
 </div>
 
 {appointmentDetails.type === "video" && (
 <div className="mt-6 p-4 bg-white/10 rounded-lg">
 <div className="flex items-center gap-2 mb-2">
 <FaVideo className="text-blue-200" />
 <span className="font-semibold text-blue-100">Video Call Instructions</span>
 </div>
 <p className="text-blue-100 text-sm">
 A secure video call link will be sent to your email 30 minutes before the appointment. 
 Please ensure you have a stable internet connection and access to a camera/microphone.
 </p>
 </div>
 )}
 </div>

 {/* Important Information */}
 <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8 text-left">
 <div className="flex items-start gap-3">
 <FaInfoCircle className="text-yellow-600 mt-1" />
 <div>
 <h4 className="font-semibold text-yellow-800 mb-2">Important Information</h4>
 <ul className="text-yellow-800 text-sm space-y-1">
 <li>• Confirmation email sent to your registered email address</li>
 <li>• You will receive SMS reminders 24 hours and 1 hour before appointment</li>
 <li>• Please arrive 15 minutes early for in-person consultations</li>
 <li>• Bring your ID and any previous medical reports</li>
 <li>• Free rescheduling available up to 4 hours before appointment</li>
 </ul>
 </div>
 </div>
 </div>

 {/* Next Steps */}
 <div className="bg-subtle rounded-xl p-6 mb-8 text-left">
 <h4 className="font-semibold text-fg mb-4">What happens next?</h4>
 <div className="space-y-4">
 <div className="flex items-start gap-4">
 <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
 <span className="text-blue-600 font-bold text-sm">1</span>
 </div>
 <div>
 <p className="font-medium text-fg">Confirmation Email</p>
 <p className="text-soft text-sm">You will receive a detailed confirmation email with all appointment information</p>
 </div>
 </div>
 
 <div className="flex items-start gap-4">
 <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
 <span className="text-blue-600 font-bold text-sm">2</span>
 </div>
 <div>
 <p className="font-medium text-fg">Reminders</p>
 <p className="text-soft text-sm">Automated reminders will be sent via SMS and email</p>
 </div>
 </div>
 
 <div className="flex items-start gap-4">
 <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
 <span className="text-blue-600 font-bold text-sm">3</span>
 </div>
 <div>
 <p className="font-medium text-fg">Consultation</p>
 <p className="text-soft text-sm">Join your scheduled consultation at the specified time</p>
 </div>
 </div>
 
 <div className="flex items-start gap-4">
 <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
 <span className="text-blue-600 font-bold text-sm">4</span>
 </div>
 <div>
 <p className="font-medium text-fg">Follow-up</p>
 <p className="text-soft text-sm">Receive digital prescriptions and follow-up care instructions</p>
 </div>
 </div>
 </div>
 </div>

 {/* Action Buttons */}
 <div className="grid md:grid-cols-4 gap-3 mb-6">
 <button className="flex flex-col items-center gap-2 p-4 border border-line rounded-lg hover:bg-subtle transition-colors">
 <FaDownload className="text-blue-600 text-xl" />
 <span className="text-sm font-medium">Download Ticket</span>
 </button>
 
 <button className="flex flex-col items-center gap-2 p-4 border border-line rounded-lg hover:bg-subtle transition-colors">
 <FaPrint className="text-green-600 text-xl" />
 <span className="text-sm font-medium">Print Ticket</span>
 </button>
 
 <button className="flex flex-col items-center gap-2 p-4 border border-line rounded-lg hover:bg-subtle transition-colors">
 <FaCalendarPlus className="text-purple-600 text-xl" />
 <span className="text-sm font-medium">Add to Calendar</span>
 </button>
 
 <button className="flex flex-col items-center gap-2 p-4 border border-line rounded-lg hover:bg-subtle transition-colors">
 <FaPhone className="text-orange-600 text-xl" />
 <span className="text-sm font-medium">Contact Support</span>
 </button>
 </div>

 {/* Main Action Buttons */}
 <div className="grid md:grid-cols-2 gap-4">
 <Link href="/patient/appointments" className="bg-brand-navy transition-all text-center">
 View My Appointments
 </Link>
 <Link href="/patient" className="border-2 border-line text-soft py-4 px-6 rounded-lg font-semibold hover:bg-subtle transition-all text-center">
 Go to Dashboard
 </Link>
 </div>
 
 {/* Emergency Contact */}
 <div className="mt-8 pt-6 border-t border-line">
 <p className="text-sm text-soft">
 Need immediate assistance? Call our 24/7 helpline: 
 <a href="tel:+2304004000" className="font-semibold text-blue-600 hover:underline ml-1">
 +230 400 4000
 </a>
 </p>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 )
}