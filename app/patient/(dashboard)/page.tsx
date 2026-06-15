'use client'

import { useState, useEffect } from 'react'
import {
 FaCalendarAlt,
 FaPills,
 FaFileAlt,
 FaHeart,
 FaClock,
 FaEdit,
 FaChartLine,
 FaSpinner,
} from 'react-icons/fa'
import { usePatientData } from './context'
import WalletBalanceCard from '@/components/shared/WalletBalanceCard'
import OnboardingChecklist from '@/components/shared/OnboardingChecklist'
import ReferralPillarCard from '@/components/shared/ReferralPillarCard'

interface MedicalRecord {
 id: string
 title: string
 doctorResponsible: string
 date: string
}

export default function PatientOverviewPage() {
 const patientData = usePatientData()
 const [upcomingCount, setUpcomingCount] = useState(0)
 const [prescriptionCount, setPrescriptionCount] = useState(0)
 const [recordCount, setRecordCount] = useState(0)
 const [recentRecords, setRecentRecords] = useState<MedicalRecord[]>([])
 const [nextAppointment, setNextAppointment] = useState<{ date: string } | null>(null)
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 const fetchOverviewData = async () => {
 try {
 const [appointmentsRes, prescriptionsRes, recordsRes] = await Promise.all([
 fetch('/api/bookings/unified?role=patient&status=upcoming', { credentials: 'include' }).catch(() => null),
 fetch(`/api/patients/${patientData.id}/prescriptions?active=true`, { credentials: 'include' }).catch(() => null),
 fetch(`/api/patients/${patientData.id}/medical-records`, { credentials: 'include' }).catch(() => null),
 ])

 const [appointments, prescriptions, records] = await Promise.all([
 appointmentsRes?.ok ? appointmentsRes.json() : null,
 prescriptionsRes?.ok ? prescriptionsRes.json() : null,
 recordsRes?.ok ? recordsRes.json() : null,
 ])

 if (appointments?.data) {
 setUpcomingCount(appointments.data.length)
 if (appointments.data[0]?.scheduledAt) {
 setNextAppointment({ date: appointments.data[0].scheduledAt })
 }
 }
 if (prescriptions?.data) {
 setPrescriptionCount(prescriptions.data.length)
 }
 if (records?.data) {
 setRecordCount(records.data.length)
 setRecentRecords(records.data.slice(0, 3))
 }
 } catch (error) {
 console.error('Failed to fetch overview data:', error)
 } finally {
 setLoading(false)
 }
 }
 fetchOverviewData()
 }, [patientData.id])

 if (loading) {
 return (
 <div className="flex items-center justify-center py-12">
 <FaSpinner className="animate-spin text-blue-500 text-2xl" />
 </div>
 )
 }

 return (
 <div className="space-y-4 sm:space-y-5 md:space-y-6">
 {/* Welcome Banner */}
 <div className="bg-brand-navy rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-8 text-white">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
 <div>
 <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">
 Welcome back, {patientData.firstName}!
 </h2>
 <p className="opacity-90 text-xs sm:text-sm md:text-base lg:text-lg">
 Take charge of your health journey today
 </p>
 </div>
 <div className="hidden lg:block">
 <FaHeart className="text-4xl xl:text-5xl opacity-20" />
 </div>
 </div>
 </div>

 {/* Activation checklist - hidden once all steps are done or the user dismisses */}
 <OnboardingChecklist userId={patientData.id} />

 {/* Wallet Balance */}
 <WalletBalanceCard userId={patientData.id} />

 {/* Refer + earn pillar - every member is a "money provider" via referrals */}
 <ReferralPillarCard userId={patientData.id} />

 {/* Health Score Card */}
 <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-8 shadow-lg border border-green-100">
 <div className="flex items-center justify-between mb-3 sm:mb-4">
 <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-gray-800">Your Health Score</h3>
 <FaChartLine className="text-green-500 text-base sm:text-lg md:text-xl lg:text-2xl" />
 </div>
 <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-4">
 <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-green-600">
 {patientData.healthScore ?? 0}%
 </div>
 <div className="text-xs sm:text-sm md:text-base text-gray-700 mt-1 sm:mb-2">
 Body Age: {patientData.bodyAge ?? 'N/A'} years
 </div>
 </div>
 <div className="w-full bg-gray-200 rounded-full h-2 sm:h-2.5 mt-3 sm:mt-4">
 <div
 className="bg-sky-100 h-2 sm:h-2.5 rounded-full transition-all duration-500"
 style={{ width: `${patientData.healthScore ?? 0}%` }}
 />
 </div>
 </div>

 {/* Quick Stats */}
 <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-3 md:gap-4 lg:gap-5">
 <div className="bg-white rounded-xl p-4 md:p-5 lg:p-6 shadow-lg border border-blue-100">
 <div className="flex items-center justify-between">
 <div className="flex-1">
 <p className="text-gray-700 text-xs md:text-sm font-medium">Upcoming Appointments</p>
 <p className="text-xl md:text-2xl lg:text-3xl font-bold text-blue-600 mt-1">{upcomingCount}</p>
 {nextAppointment && (
 <p className="text-xs md:text-sm text-gray-600 mt-1">
 Next: {new Date(nextAppointment.date).toLocaleDateString()}
 </p>
 )}
 </div>
 <div className="p-2 md:p-3 bg-blue-100 rounded-lg">
 <FaCalendarAlt className="text-blue-600 text-base md:text-xl lg:text-2xl" />
 </div>
 </div>
 </div>

 <div className="bg-white rounded-xl p-4 md:p-5 lg:p-6 shadow-lg border border-green-100">
 <div className="flex items-center justify-between">
 <div className="flex-1">
 <p className="text-gray-700 text-xs md:text-sm font-medium">Active Prescriptions</p>
 <p className="text-xl md:text-2xl lg:text-3xl font-bold text-green-600 mt-1">{prescriptionCount}</p>
 <p className="text-xs md:text-sm text-green-600 mt-1">All active</p>
 </div>
 <div className="p-2 md:p-3 bg-green-100 rounded-lg">
 <FaPills className="text-green-600 text-base md:text-xl lg:text-2xl" />
 </div>
 </div>
 </div>

 <div className="bg-white rounded-xl p-4 md:p-5 lg:p-6 shadow-lg border border-purple-100">
 <div className="flex items-center justify-between">
 <div className="flex-1">
 <p className="text-gray-700 text-xs md:text-sm font-medium">Health Records</p>
 <p className="text-xl md:text-2xl lg:text-3xl font-bold text-purple-600 mt-1">{recordCount}</p>
 <p className="text-xs md:text-sm text-purple-600 mt-1">Documents</p>
 </div>
 <div className="p-2 md:p-3 bg-purple-100 rounded-lg">
 <FaFileAlt className="text-purple-600 text-base md:text-xl lg:text-2xl" />
 </div>
 </div>
 </div>

 <div className="bg-white rounded-xl p-4 md:p-5 lg:p-6 shadow-lg border border-red-100">
 <div className="flex items-center justify-between">
 <div className="flex-1">
 <p className="text-gray-700 text-xs md:text-sm font-medium">Last Checkup</p>
 <p className="text-sm md:text-lg lg:text-xl font-bold text-red-600 mt-1">
 {patientData.lastCheckupDate
 ? new Date(patientData.lastCheckupDate).toLocaleDateString()
 : 'N/A'}
 </p>
 <p className="text-xs md:text-sm text-red-600 mt-1">Regular checkup</p>
 </div>
 <div className="p-2 md:p-3 bg-red-100 rounded-lg">
 <FaClock className="text-red-600 text-base md:text-xl lg:text-2xl" />
 </div>
 </div>
 </div>
 </div>

 {/* Recent Activities */}
 <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-8 shadow-lg border border-indigo-100">
 <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
 Recent Activities
 </h3>
 <div className="space-y-2 sm:space-y-3">
 {recentRecords.length > 0 ? recentRecords.map((record) => (
 <div
 key={record.id}
 className="flex items-center gap-3 md:gap-4 p-3 md:p-4 lg:p-5 bg-white bg-opacity-70 rounded-lg sm:rounded-xl hover:bg-opacity-90 transition"
 >
 <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
 <FaFileAlt className="text-blue-600 text-sm sm:text-base md:text-lg" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-medium text-gray-900 text-xs sm:text-sm md:text-base lg:text-lg truncate">
 {record.title}
 </p>
 <p className="text-xs md:text-sm text-gray-600 truncate">
 {record.doctorResponsible} &bull; {new Date(record.date).toLocaleDateString()}
 </p>
 </div>
 <FaEdit className="text-gray-400 hover:text-blue-500 cursor-pointer text-sm sm:text-base md:text-lg flex-shrink-0" />
 </div>
 )) : (
 <p className="text-sm text-gray-500 py-2">No recent activities</p>
 )}
 </div>
 </div>
 </div>
 )
}
