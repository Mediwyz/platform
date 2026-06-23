'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FaArrowLeft, FaAmbulance, FaExclamationTriangle } from 'react-icons/fa'
import BookingForm from '@/components/booking/BookingForm'
import BookingSuccessTicket from '@/components/booking/BookingSuccessTicket'
import type { BookingSubmitData } from '@/components/booking/BookingForm'

interface BookingResult {
 ticketId: string
 type: string
 status: string
 priority: string
 createdAt: string
}

export default function GenericBookEmergencyPage() {
 const pathname = usePathname()
 const baseSlug = pathname.split('/')[1]

 const [isSubmitting, setIsSubmitting] = useState(false)
 const [bookingResult, setBookingResult] = useState<BookingResult | null>(null)
 const [submitData, setSubmitData] = useState<BookingSubmitData | null>(null)

 const handleSubmit = async (data: BookingSubmitData) => {
 setIsSubmitting(true)
 setSubmitData(data)

 try {
 const res = await fetch('/api/bookings', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 providerType: 'EMERGENCY_WORKER',
 emergencyType: data.emergencyType,
 location: data.location,
 contactNumber: data.contactNumber,
 scheduledDate: data.scheduledDate,
 responseWindow: data.scheduledTime,
 notes: data.notes,
 priority: data.priority,
 }),
 credentials: 'include',
 })

 const result = await res.json()

 if (!result.success) {
 throw new Error(result.message || 'Emergency request failed')
 }

 setBookingResult(result.booking)
 } catch (err) {
 throw err
 } finally {
 setIsSubmitting(false)
 }
 }

 if (bookingResult) {
 return (
 <BookingSuccessTicket
 providerType="emergency"
 providerName="Emergency Services"
 providerDetail={submitData?.emergencyType?.replace('_', ' ') || 'Emergency'}
 ticketId={bookingResult.ticketId}
 submitData={submitData}
 viewLabel="View Bookings"
 dashboardPath={`/${baseSlug}/feed`}
 />
 )
 }

 return (
 <div className="max-w-3xl mx-auto">
 <div className="mb-6">
 <Link
 href={`/${baseSlug}/feed`}
 className="inline-flex items-center gap-2 text-soft hover:text-red-600 transition-colors"
 >
 <FaArrowLeft /> Back to Dashboard
 </Link>
 </div>

 <div className=" rounded-xl p-6 mb-6 text-white">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-white/20 rounded-lg">
 <FaAmbulance className="text-3xl" />
 </div>
 <div>
 <h1 className="text-2xl font-bold">Request Emergency Service</h1>
 <p className="text-red-100 text-sm mt-1">
 For life-threatening emergencies, also call 114 (SAMU) or 999 immediately
 </p>
 </div>
 </div>
 </div>

 <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
 <div className="flex items-start gap-3">
 <FaExclamationTriangle className="text-red-600 mt-0.5" />
 <p className="text-red-700 text-sm">
 Emergency services are provided at <strong>no charge</strong> during the MediWyz trial period.
 A qualified emergency responder will be dispatched to your location.
 </p>
 </div>
 </div>

 <BookingForm
 providerType="emergency"
 onSubmit={handleSubmit}
 isSubmitting={isSubmitting}
 />
 </div>
 )
}
