'use client'

import Link from 'next/link'
import { FaCheckCircle, FaCalendarAlt, FaClock, FaWallet } from 'react-icons/fa'
import { PROVIDER_BOOKING_COLORS } from '@/lib/constants/userTypeStyles'
import type { BookingSubmitData } from './BookingForm'

interface BookingSuccessTicketProps {
 providerType: 'doctor' | 'nurse' | 'nanny' | 'lab-test' | 'emergency'
 providerName: string
 providerDetail?: string
 ticketId: string
 submitData: BookingSubmitData | null
 walletBalance?: number
 dashboardPath?: string
 viewPath?: string
 viewLabel?: string
}

export default function BookingSuccessTicket({
 providerType,
 providerName,
 providerDetail,
 ticketId,
 submitData,
 walletBalance,
 dashboardPath = '/feed',
 viewPath,
 viewLabel = 'View Appointments',
}: BookingSuccessTicketProps) {
 const colors = PROVIDER_BOOKING_COLORS[providerType] || PROVIDER_BOOKING_COLORS.doctor
 const resolvedViewPath = viewPath || colors.backLink

 const typeLabels: Record<string, string> = {
 doctor: 'Doctor Consultation',
 nurse: 'Nurse Service',
 nanny: 'Childcare Service',
 'lab-test': 'Lab Test',
 emergency: 'Emergency Service',
 }

 return (
 <div className="max-w-2xl mx-auto">
 <div className="bg-surface rounded-2xl p-8 shadow-lg text-center">
 <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
 <FaCheckCircle className="text-green-600 text-4xl" />
 </div>

 <h2 className="text-2xl font-bold text-fg mb-2">Booking Confirmed!</h2>
 <p className="text-soft mb-8">
 Your {typeLabels[providerType] || 'appointment'} has been successfully booked.
 </p>

 {/* Ticket Card */}
 <div className={` ${colors.ticketGradient} rounded-2xl p-6 text-white mb-8 text-left`}>
 <div className="flex items-center justify-between mb-6">
 <div>
 <h3 className="text-lg font-bold">{typeLabels[providerType]} Ticket</h3>
 <p className="text-white/70 text-sm">Keep this for your records</p>
 </div>
 <div className="text-right">
 <p className="text-white/70 text-xs">Ticket ID</p>
 <p className="font-bold text-lg">{ticketId}</p>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4 text-sm">
 <div>
 <p className="text-white/70 mb-1">Provider</p>
 <p className="font-semibold">{providerName}</p>
 </div>
 {providerDetail && (
 <div>
 <p className="text-white/70 mb-1">Details</p>
 <p className="font-semibold">{providerDetail}</p>
 </div>
 )}
 <div className="flex items-center gap-2">
 <FaCalendarAlt className="text-white/70" />
 <div>
 <p className="text-white/70 text-xs">Date</p>
 <p className="font-semibold">
 {submitData?.scheduledDate
 ? new Date(submitData.scheduledDate).toLocaleDateString('en-US', {
 weekday: 'short',
 month: 'long',
 day: 'numeric',
 year: 'numeric',
 })
 : ''}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <FaClock className="text-white/70" />
 <div>
 <p className="text-white/70 text-xs">Time</p>
 <p className="font-semibold">{submitData?.scheduledTime || ''}</p>
 </div>
 </div>
 {walletBalance !== undefined && (
 <div className="flex items-center gap-2">
 <FaWallet className="text-white/70" />
 <div>
 <p className="text-white/70 text-xs">Wallet Balance</p>
 <p className="font-semibold">Rs {walletBalance.toLocaleString()}</p>
 </div>
 </div>
 )}
 </div>

 {submitData?.reason && (
 <div className="mt-4 pt-4 border-t border-white/20">
 <p className="text-white/70 text-xs">Reason</p>
 <p className="text-sm">{submitData.reason}</p>
 </div>
 )}
 </div>

 <div className="flex flex-col sm:flex-row gap-3">
 <Link
 href={dashboardPath}
 className={`flex-1 ${colors.gradient} text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition-all text-center`}
 >
 Back to Dashboard
 </Link>
 <Link
 href={resolvedViewPath}
 className="flex-1 border-2 border-line text-soft py-3 px-6 rounded-lg font-semibold hover:bg-subtle transition-all text-center"
 >
 {viewLabel}
 </Link>
 </div>
 </div>
 </div>
 )
}
