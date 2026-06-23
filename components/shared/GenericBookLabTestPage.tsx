'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FaArrowLeft } from 'react-icons/fa'
import BookingForm from '@/components/booking/BookingForm'
import BookingSuccessTicket from '@/components/booking/BookingSuccessTicket'
import type { BookingSubmitData } from '@/components/booking/BookingForm'
import { getUserId } from '@/hooks/useUser'

interface LabTestInfo {
 id: string
 testName: string
 category: string
 description: string
 price: number
 currency: string
 turnaroundTime: string
 sampleType: string
 preparation: string
 lab: string
 labTechnician: {
 id: string
 name: string
 profileImage: string | null
 verified: boolean
 }
}

interface BookingResult {
 ticketId: string
 type: string
 scheduledAt: string
 status: string
}

export default function GenericBookLabTestPage({ params }: { params: Promise<{ id: string }> }) {
 const { id } = use(params)
 const pathname = usePathname()
 const baseSlug = pathname.split('/')[1]

 const [labTest, setLabTest] = useState<LabTestInfo | null>(null)
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

 const testsRes = await fetch('/api/search/providers?type=LAB_TECHNICIAN')
 const testsData = await testsRes.json()

 if (testsData.success && testsData.data) {
 const found = testsData.data.find((t: LabTestInfo) => t.id === id)
 if (found) {
 setLabTest(found)
 } else {
 setError('Lab test not found')
 }
 } else {
 setError('Failed to load lab test information')
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
 providerType: 'LAB_TECHNICIAN',
 labTechId: labTest?.labTechnician.id,
 testName: labTest?.testName,
 scheduledDate: data.scheduledDate,
 scheduledTime: data.scheduledTime,
 sampleType: labTest?.sampleType || data.sampleType,
 notes: data.notes,
 price: labTest?.price,
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
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4" />
 <p className="text-soft">Loading lab test information...</p>
 </div>
 </div>
 )
 }

 if (error || !labTest) {
 return (
 <div className="max-w-lg mx-auto mt-12">
 <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
 <p className="text-red-700 font-medium mb-4">{error || 'Lab test not found'}</p>
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
 providerType="lab-test"
 providerName={labTest.testName}
 providerDetail={labTest.lab}
 ticketId={bookingResult.ticketId}
 submitData={submitData}
 walletBalance={walletBalance}
 viewLabel="View Bookings"
 dashboardPath={`/${baseSlug}/feed`}
 />
 )
 }

 return (
 <div className="max-w-3xl mx-auto">
 <div className="mb-6">
 <Link
 href={`/${baseSlug}/find-lab`}
 className="inline-flex items-center gap-2 text-soft hover:text-cyan-600 transition-colors"
 >
 <FaArrowLeft /> Back to Find Lab Tests
 </Link>
 </div>

 <h1 className="text-2xl font-bold text-fg mb-2">
 Book Lab Test: {labTest.testName}
 </h1>
 <div className="flex flex-wrap gap-3 text-sm text-soft mb-6">
 <span>Lab: {labTest.lab}</span>
 <span>|</span>
 <span>Category: {labTest.category}</span>
 <span>|</span>
 <span>Sample: {labTest.sampleType}</span>
 <span>|</span>
 <span>Results in: {labTest.turnaroundTime}</span>
 </div>

 {labTest.preparation && (
 <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
 <p className="text-amber-800 text-sm font-medium mb-1">Preparation Required</p>
 <p className="text-amber-700 text-sm">{labTest.preparation}</p>
 </div>
 )}

 <BookingForm
 providerType="lab-test"
 providerId={labTest.labTechnician.id}
 providerName={labTest.lab}
 providerSpecialty={labTest.category}
 providerImage={labTest.labTechnician.profileImage || undefined}
 price={labTest.price}
 onSubmit={handleSubmit}
 isSubmitting={isSubmitting}
 walletBalance={walletBalance}
 />
 </div>
 )
}
