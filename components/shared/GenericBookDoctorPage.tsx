'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FaArrowLeft } from 'react-icons/fa'
import BookingForm from '@/components/booking/BookingForm'
import type { BookingSubmitData, ServiceOption } from '@/components/booking/BookingForm'
import BookingSuccessTicket from '@/components/booking/BookingSuccessTicket'
import { getUserId } from '@/hooks/useUser'

interface DoctorInfo {
 id: string
 firstName: string
 lastName: string
 profileImage: string
 specialty: string[]
 location: string
 consultationFee: number
 videoConsultationFee: number
 homeVisitAvailable?: boolean
 telemedicineAvailable?: boolean
}

interface BookingResult {
 ticketId: string
 type: string
 scheduledAt: string
 status: string
}

export default function GenericBookDoctorPage({ params }: { params: Promise<{ id: string }> }) {
 const { id } = use(params)
 const pathname = usePathname()
 const baseSlug = pathname.split('/')[1]

 const [doctor, setDoctor] = useState<DoctorInfo | null>(null)
 const [services, setServices] = useState<ServiceOption[]>([])
 const [walletBalance, setWalletBalance] = useState<number | undefined>(undefined)
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)
 const [isSubmitting, setIsSubmitting] = useState(false)
 const [bookingResult, setBookingResult] = useState<BookingResult | null>(null)
 const [submitData, setSubmitData] = useState<BookingSubmitData | null>(null)

 useEffect(() => {
 const fetchData = async () => {
 try {
 setLoading(true)

 const doctorsRes = await fetch('/api/search/providers?type=DOCTOR')
 const doctorsData = await doctorsRes.json()

 if (doctorsData.success && doctorsData.data) {
 const found = doctorsData.data.find((d: DoctorInfo) => d.id === id)
 if (found) {
 setDoctor(found)
 } else {
 setError('Doctor not found')
 }
 } else {
 setError('Failed to load doctor information')
 }

 try {
 const servicesRes = await fetch(`/api/providers/${id}/services`, { credentials: 'include' })
 const servicesData = await servicesRes.json()
 if (servicesData.success && servicesData.data) {
 setServices(servicesData.data)
 }
 } catch {
 // Services are optional
 }

 const userId = getUserId()
 if (userId) {
 const walletRes = await fetch(`/api/users/${userId}/wallet`, { credentials: 'include' })
 const walletData = await walletRes.json()
 if (walletData.success && walletData.data) {
 setWalletBalance(walletData.data.balance)
 }
 }
 } catch {
 setError('Failed to load booking information')
 } finally {
 setLoading(false)
 }
 }

 fetchData()
 }, [id])

 const handleSubmit = async (data: BookingSubmitData) => {
 setIsSubmitting(true)
 setSubmitData(data)

 try {
 const res = await fetch('/api/bookings', {
 method: 'POST',
 credentials: 'include',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
      providerType: 'DOCTOR',
      doctorId: id,
      platformServiceId: data.serviceId,
      workflowTemplateId: data.workflowTemplateId,
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime,
      reason: data.reason,
      notes: data.notes,
      duration: data.duration,
 }),
 })

 const result = await res.json()

 if (!result.success) {
 throw new Error(result.message || 'Booking failed')
 }

 setBookingResult(result.booking)
 if (result.newBalance !== undefined) {
 setWalletBalance(result.newBalance)
 }
 } catch (err) {
 throw err
 } finally {
 setIsSubmitting(false)
 }
 }

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-[400px]">
 <div className="text-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
 <p className="text-soft">Loading doctor information...</p>
 </div>
 </div>
 )
 }

 if (error || !doctor) {
 return (
 <div className="max-w-lg mx-auto mt-12">
 <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
 <p className="text-red-700 font-medium mb-4">{error || 'Doctor not found'}</p>
 <Link
 href={`/${baseSlug}/feed`}
 className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
 >
 <FaArrowLeft /> Back to Dashboard
 </Link>
 </div>
 </div>
 )
 }

 if (bookingResult) {
 return (
 <BookingSuccessTicket
 providerType="doctor"
 providerName={`Dr. ${doctor.firstName} ${doctor.lastName}`}
 providerDetail={doctor.specialty[0] || 'General'}
 ticketId={bookingResult.ticketId}
 submitData={submitData}
 walletBalance={walletBalance}
 viewLabel="View Appointments"
 dashboardPath={`/${baseSlug}/feed`}
 />
 )
 }

 return (
 <div className="max-w-3xl mx-auto">
 <div className="mb-6">
 <Link
 href={`/${baseSlug}/find-doctor`}
 className="inline-flex items-center gap-2 text-soft hover:text-blue-600 transition-colors"
 >
 <FaArrowLeft /> Back to Find Doctor
 </Link>
 </div>

 <h1 className="text-2xl font-bold text-fg mb-6">
 Book Consultation with Dr. {doctor.firstName} {doctor.lastName}
 </h1>

 <BookingForm
 providerType="doctor"
 providerId={id}
 providerName={`Dr. ${doctor.firstName} ${doctor.lastName}`}
 providerSpecialty={doctor.specialty.join(', ')}
 providerImage={doctor.profileImage}
 providerLocation={doctor.location}
 services={services}
 onSubmit={handleSubmit}
 isSubmitting={isSubmitting}
 walletBalance={walletBalance}
 />
 </div>
 )
}
