import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Patient } from '@/lib/data/patients'
import { 
 FaFileAlt, 
 FaDownload, 
 FaHeart, 
 FaThermometerHalf, 
 FaWeight,
 FaRuler,
 FaLungs,
 FaEye,
 FaFilter,
 FaSearch,
 FaCalendarAlt,
 FaClock,
 FaUserMd,
 FaUserNurse,
 FaChartLine,
 FaPills,
 FaFlask,
 FaStethoscope,
 FaNutritionix,
 FaPlus,
 FaShare,
 FaInfoCircle,
 FaChevronDown,
 FaChevronUp,
 FaHistory,
 FaMinus
} from 'react-icons/fa'
import { MdTrendingUp, MdTrendingDown } from 'react-icons/md'

interface Props {
 patientData: Patient
}

interface FilterOptions {
 type: 'all' | 'consultation' | 'prescription' | 'lab_result' | 'imaging' | 'vaccination' | 'surgery'
 dateRange: 'all' | 'last_week' | 'last_month' | 'last_3_months' | 'last_year'
 doctor: 'all' | string
}

const HealthRecords: React.FC<Props> = ({ patientData }) => {
 const [searchQuery, setSearchQuery] = useState('')
 const [filters, setFilters] = useState<FilterOptions>({
 type: 'all',
 dateRange: 'all',
 doctor: 'all'
 })
 const [expandedRecord, setExpandedRecord] = useState<string | null>(null)
 const [showFilters, setShowFilters] = useState(false)
 const [activeTab, setActiveTab] = useState<'records' | 'vitals' | 'metrics' | 'timeline'>('records')

 // Self-fetch medical records
  
 const [medicalRecords, setMedicalRecords] = useState<any[]>([])
 const [activePrescriptions, setActivePrescriptions] = useState<any[]>([])
 const [loadingRecords, setLoadingRecords] = useState(true)

 const fetchRecords = useCallback(async () => {
 try {
 const [recordsRes, prescriptionsRes] = await Promise.all([
 fetch(`/api/patients/${patientData.id}/medical-records`, { credentials: 'include' }).catch(() => null),
 fetch(`/api/patients/${patientData.id}/prescriptions?active=true`, { credentials: 'include' }).catch(() => null),
 ])
 const [recordsData, prescriptionsData] = await Promise.all([
 recordsRes?.ok ? recordsRes.json() : null,
 prescriptionsRes?.ok ? prescriptionsRes.json() : null,
 ])
 if (recordsData?.data) setMedicalRecords(recordsData.data)
 if (prescriptionsData?.data) {
 setActivePrescriptions(prescriptionsData.data.map((p: any) => ({
 id: p.id,
 date: p.date,
 time: '',
 doctorName: p.doctor ? `${p.doctor.user.firstName} ${p.doctor.user.lastName}` : 'Unknown',
 diagnosis: p.diagnosis,
 })))
 }
 } catch (error) {
 console.error('Failed to fetch health records:', error)
 } finally {
 setLoadingRecords(false)
 }
 }, [patientData.id])

 useEffect(() => { fetchRecords() }, [fetchRecords])

 // Get unique doctors from medical records
 const doctors = Array.from(new Set(
 medicalRecords.map(record => record.doctorResponsible)
 ))

 // Filter records based on search and filters
 const filteredRecords = medicalRecords.filter(record => {
 const matchesSearch = 
 record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
 record.doctorResponsible.toLowerCase().includes(searchQuery.toLowerCase()) ||
 (record.diagnosis && record.diagnosis.toLowerCase().includes(searchQuery.toLowerCase())) ||
 (record.treatment && record.treatment.toLowerCase().includes(searchQuery.toLowerCase()))
 
 const matchesType = filters.type === 'all' || record.type === filters.type
 const matchesDoctor = filters.doctor === 'all' || record.doctorResponsible === filters.doctor

 // Date range filter
 let matchesDate = true
 if (filters.dateRange !== 'all') {
 const recordDate = new Date(record.date)
 const now = new Date()
 const daysDiff = Math.floor((now.getTime() - recordDate.getTime()) / (1000 * 3600 * 24))
 
 switch (filters.dateRange) {
 case 'last_week':
 matchesDate = daysDiff <= 7
 break
 case 'last_month':
 matchesDate = daysDiff <= 30
 break
 case 'last_3_months':
 matchesDate = daysDiff <= 90
 break
 case 'last_year':
 matchesDate = daysDiff <= 365
 break
 }
 }

 return matchesSearch && matchesType && matchesDoctor && matchesDate
 })

 const getRecordTypeColor = (type: string) => {
 switch (type) {
 case 'consultation': return 'bg-sky-50 text-blue-800 border-blue-200'
 case 'prescription': return 'bg-sky-50 text-green-800 border-green-200'
 case 'lab_result': return 'bg-sky-50 text-purple-800 border-purple-200'
 case 'imaging': return 'bg-sky-50 text-orange-800 border-orange-200'
 case 'vaccination': return 'bg-sky-50 text-cyan-800 border-cyan-200'
 case 'surgery': return 'bg-sky-50 text-red-800 border-red-200'
 default: return 'bg-sky-50 text-gray-800 border-gray-200'
 }
 }

 const getRecordTypeIcon = (type: string) => {
 switch (type) {
 case 'consultation': return <FaStethoscope />
 case 'prescription': return <FaPills />
 case 'lab_result': return <FaFlask />
 case 'imaging': return <FaEye />
 case 'vaccination': return <FaHeart />
 case 'surgery': return <FaUserMd />
 default: return <FaFileAlt />
 }
 }

 const getVitalTrend = (current: number, previous: number) => {
 if (current > previous) return { icon: MdTrendingUp, color: 'text-red-500' }
 if (current < previous) return { icon: MdTrendingDown, color: 'text-green-500' }
 return { icon: FaMinus, color: 'text-gray-500' }
 }

 const sections = [
 { id: 'records', label: 'Medical Records', icon: FaFileAlt, color: 'blue' },
 { id: 'vitals', label: 'Vital Signs', icon: FaThermometerHalf, color: 'red' },
 { id: 'metrics', label: 'Health Metrics', icon: FaChartLine, color: 'green' },
 { id: 'timeline', label: 'Timeline', icon: FaHistory, color: 'purple' }
 ]

 const renderRecords = () => (
 <div className="space-y-3 sm:space-y-4">
 {filteredRecords.length === 0 ? (
 <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center shadow-lg border border-gray-200">
 <FaFileAlt className="text-gray-400 text-3xl sm:text-4xl mx-auto mb-4" />
 <h3 className="text-base sm:text-lg font-semibold text-gray-600 mb-2">No Health Records Found</h3>
 <p className="text-gray-500 text-sm sm:text-base">
 {searchQuery || filters.type !== 'all' || filters.doctor !== 'all' || filters.dateRange !== 'all'
 ? 'No records match your current filters.'
 : 'Your health records will appear here once they are added.'}
 </p>
 {(searchQuery || filters.type !== 'all' || filters.doctor !== 'all' || filters.dateRange !== 'all') && (
 <button 
 onClick={() => {
 setSearchQuery('')
 setFilters({ type: 'all', dateRange: 'all', doctor: 'all' })
 }}
 className="mt-3 text-blue-600 hover:underline text-sm sm:text-base"
 >
 Clear all filters
 </button>
 )}
 </div>
 ) : (
 filteredRecords.map((record) => (
 <div 
 key={record.id} 
 className="bg-white/30 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all"
 >
 <div className="p-4 sm:p-5 md:p-6">
 <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
 {/* Record Header */}
 <div className="flex items-start gap-3 sm:gap-4 flex-1">
 <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${getRecordTypeColor(record.type)}`}>
 {getRecordTypeIcon(record.type)}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
 <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{record.title}</h3>
 <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium border ${getRecordTypeColor(record.type)}`}>
 {record.type.replace('_', ' ')}
 </span>
 </div>
 
 <div className="space-y-1 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-3 md:gap-4 text-xs sm:text-sm text-gray-600 mb-3">
 <div className="flex items-center gap-1">
 <FaUserMd className="text-blue-500" />
 <span className="truncate">{record.doctorResponsible}</span>
 </div>
 {record.nurseResponsible && (
 <div className="flex items-center gap-1">
 <FaUserNurse className="text-pink-500" />
 <span className="truncate">{record.nurseResponsible}</span>
 </div>
 )}
 <div className="flex items-center gap-1">
 <FaCalendarAlt className="text-purple-500" />
 <span>{new Date(record.date).toLocaleDateString('en-US', { 
 month: 'short', 
 day: 'numeric' 
 })}</span>
 </div>
 <div className="flex items-center gap-1">
 <FaClock className="text-orange-500" />
 <span>{record.time}</span>
 </div>
 </div>

 <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4">
 <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Summary:</p>
 <p className="text-gray-600 text-xs sm:text-sm">{record.summary}</p>
 </div>
 </div>
 </div>

 {/* Action Buttons */}
 <div className="flex gap-2 sm:flex-shrink-0">
 <button 
 onClick={() => setExpandedRecord(
 expandedRecord === record.id ? null : record.id
 )}
 className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white transition flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
 >
 <FaEye />
 <span className="hidden sm:inline">{expandedRecord === record.id ? 'Less' : 'Details'}</span>
 </button>
 
 <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white transition flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
 <FaDownload />
 <span className="hidden sm:inline">Download</span>
 </button>
 
 <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white transition flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
 <FaShare />
 <span className="hidden sm:inline">Share</span>
 </button>
 </div>
 </div>

 {/* Expanded Details */}
 {expandedRecord === record.id && (
 <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 space-y-3 sm:space-y-4">
 <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4 md:gap-6">
 {/* Medical Details */}
 <div className="space-y-3 sm:space-y-4">
 {record.diagnosis && (
 <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4">
 <h4 className="font-semibold text-blue-800 mb-2 flex items-center text-sm sm:text-base">
 <FaStethoscope className="mr-2" />
 Diagnosis
 </h4>
 <p className="text-blue-700 text-xs sm:text-sm">{record.diagnosis}</p>
 </div>
 )}

 {record.treatment && (
 <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4">
 <h4 className="font-semibold text-green-800 mb-2 flex items-center text-sm sm:text-base">
 <FaPills className="mr-2" />
 Treatment
 </h4>
 <p className="text-green-700 text-xs sm:text-sm">{record.treatment}</p>
 </div>
 )}
 </div>

 {/* Additional Info */}
 <div className="space-y-3 sm:space-y-4">
 {record.notes && (
 <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4">
 <h4 className="font-semibold text-yellow-800 mb-2 flex items-center text-sm sm:text-base">
 <FaFileAlt className="mr-2" />
 Notes
 </h4>
 <p className="text-yellow-700 text-xs sm:text-sm">{record.notes}</p>
 </div>
 )}

 <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4">
 <h4 className="font-semibold text-gray-800 mb-2 flex items-center text-sm sm:text-base">
 <FaInfoCircle className="mr-2" />
 Record Details
 </h4>
 <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
 <div className="flex justify-between">
 <span className="text-gray-600">Record ID:</span>
 <span className="font-medium truncate ml-2">{record.id}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-gray-600">Type:</span>
 <span className="font-medium capitalize">{record.type.replace('_', ' ')}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-gray-600">Date & Time:</span>
 <span className="font-medium">{new Date(record.date).toLocaleDateString()} {record.time}</span>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Attachments */}
 {record.attachments && record.attachments.length > 0 && (
 <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4">
 <h4 className="font-semibold text-indigo-800 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
 <FaFileAlt className="mr-2" />
 Attachments ({record.attachments.length})
 </h4>
 <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-2 md:gap-3">
 { }
 {record.attachments.map((attachment: any, index: number) => (
 <button
 key={index}
 className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white transition text-left"
 >
 <div className="w-8 h-8 sm:w-10 sm:h-10 bg-sky-50 rounded-lg flex items-center justify-center flex-shrink-0">
 <FaDownload className="text-indigo-600 text-xs sm:text-sm" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-medium text-indigo-900 text-xs sm:text-sm truncate">{attachment}</p>
 <p className="text-xs text-indigo-600">Click to download</p>
 </div>
 </button>
 ))}
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 ))
 )}
 </div>
 )

 const renderVitals = () => {
 if (!patientData.vitalSigns || patientData.vitalSigns.length === 0) {
 return (
 <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center shadow-lg border border-red-200">
 <FaThermometerHalf className="text-gray-400 text-3xl sm:text-4xl mx-auto mb-4" />
 <h3 className="text-base sm:text-lg font-semibold text-gray-600 mb-2">No Vital Signs Data</h3>
 <p className="text-gray-500 text-sm sm:text-base">Your vital signs will be recorded during medical visits</p>
 </div>
 )
 }

 const latestVitals = patientData.vitalSigns[0]
 const previousVitals = patientData.vitalSigns[1]

 return (
 <div className="space-y-4 sm:space-y-5 md:space-y-6">
 {/* Latest Vitals Overview */}
 <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-red-200">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
 <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
 <FaThermometerHalf className="mr-2 text-orange-500" />
 Latest Vital Signs
 </h3>
 <div className="text-left sm:text-right">
 <p className="text-xs sm:text-sm text-gray-600">Recorded by {latestVitals.labTechnician}</p>
 <p className="text-xs text-gray-500">{latestVitals.facility}</p>
 </div>
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
 <div className="bg-sky-50 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 text-center">
 <div className="flex items-center justify-center mb-1 sm:mb-2">
 <FaHeart className="text-red-500 text-base sm:text-lg md:text-xl mr-1 sm:mr-2" />
 {previousVitals && (() => {
 const trend = getVitalTrend(
 latestVitals.bloodPressure.systolic, 
 previousVitals.bloodPressure.systolic
 )
 return <trend.icon className={`text-xs sm:text-sm ${trend.color}`} />
 })()}
 </div>
 <p className="text-xs text-gray-600 mb-0.5 sm:mb-1">Blood Pressure</p>
 <p className="text-sm sm:text-base md:text-lg font-bold text-red-600">
 {latestVitals.bloodPressure.systolic}/{latestVitals.bloodPressure.diastolic}
 </p>
 <p className="text-xs text-gray-500">mmHg</p>
 </div>

 <div className="bg-sky-50 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 text-center">
 <div className="flex items-center justify-center mb-1 sm:mb-2">
 <FaWeight className="text-blue-500 text-base sm:text-lg md:text-xl mr-1 sm:mr-2" />
 {previousVitals && (() => {
 const trend = getVitalTrend(latestVitals.weight, previousVitals.weight)
 return <trend.icon className={`text-xs sm:text-sm ${trend.color}`} />
 })()}
 </div>
 <p className="text-xs text-gray-600 mb-0.5 sm:mb-1">Weight</p>
 <p className="text-sm sm:text-base md:text-lg font-bold text-blue-600">{latestVitals.weight}</p>
 <p className="text-xs text-gray-500">kg</p>
 </div>

 <div className="bg-sky-50 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 text-center">
 <div className="flex items-center justify-center mb-1 sm:mb-2">
 <FaRuler className="text-green-500 text-base sm:text-lg md:text-xl mr-1 sm:mr-2" />
 </div>
 <p className="text-xs text-gray-600 mb-0.5 sm:mb-1">Height</p>
 <p className="text-sm sm:text-base md:text-lg font-bold text-green-600">{latestVitals.height}</p>
 <p className="text-xs text-gray-500">cm</p>
 </div>

 <div className="bg-sky-50 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 text-center">
 <div className="flex items-center justify-center mb-1 sm:mb-2">
 <FaThermometerHalf className="text-orange-500 text-base sm:text-lg md:text-xl mr-1 sm:mr-2" />
 {previousVitals && (() => {
 const trend = getVitalTrend(latestVitals.temperature, previousVitals.temperature)
 return <trend.icon className={`text-xs sm:text-sm ${trend.color}`} />
 })()}
 </div>
 <p className="text-xs text-gray-600 mb-0.5 sm:mb-1">Temperature</p>
 <p className="text-sm sm:text-base md:text-lg font-bold text-orange-600">{latestVitals.temperature}</p>
 <p className="text-xs text-gray-500">°C</p>
 </div>

 <div className="bg-sky-50 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 text-center">
 <div className="flex items-center justify-center mb-1 sm:mb-2">
 <FaLungs className="text-purple-500 text-base sm:text-lg md:text-xl mr-1 sm:mr-2" />
 {previousVitals && (() => {
 const trend = getVitalTrend(latestVitals.oxygenSaturation, previousVitals.oxygenSaturation)
 return <trend.icon className={`text-xs sm:text-sm ${trend.color}`} />
 })()}
 </div>
 <p className="text-xs text-gray-600 mb-0.5 sm:mb-1">O2 Saturation</p>
 <p className="text-sm sm:text-base md:text-lg font-bold text-purple-600">{latestVitals.oxygenSaturation}</p>
 <p className="text-xs text-gray-500">%</p>
 </div>

 <div className="bg-sky-50 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 text-center">
 <div className="flex items-center justify-center mb-1 sm:mb-2">
 <FaHeart className="text-pink-500 text-base sm:text-lg md:text-xl mr-1 sm:mr-2" />
 {previousVitals && (() => {
 const trend = getVitalTrend(latestVitals.heartRate, previousVitals.heartRate)
 return <trend.icon className={`text-xs sm:text-sm ${trend.color}`} />
 })()}
 </div>
 <p className="text-xs text-gray-600 mb-0.5 sm:mb-1">Heart Rate</p>
 <p className="text-sm sm:text-base md:text-lg font-bold text-pink-600">{latestVitals.heartRate}</p>
 <p className="text-xs text-gray-500">bpm</p>
 </div>
 </div>

 <div className="text-center">
 <p className="text-xs sm:text-sm text-gray-600">
 Recorded on {new Date(latestVitals.date).toLocaleDateString()} at {latestVitals.time}
 </p>
 </div>
 </div>

 {/* Vitals History */}
 <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-blue-200">
 <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
 <FaHistory className="mr-2 text-blue-500" />
 Vitals History
 </h3>
 
 <div className="space-y-3 sm:space-y-4">
 {patientData.vitalSigns.map((vital, index) => (
 <div key={vital.id} className="bg-white/70 border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-md transition">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
 <div>
 <p className="font-medium text-gray-900 text-sm sm:text-base">
 {new Date(vital.date).toLocaleDateString('en-US', { 
 weekday: 'short', 
 month: 'short', 
 day: 'numeric' 
 })}
 </p>
 <p className="text-xs sm:text-sm text-gray-600">
 {vital.time} • {vital.labTechnician} • {vital.facility}
 </p>
 </div>
 {index === 0 && (
 <span className="self-start sm:self-auto px-2 sm:px-3 py-0.5 sm:py-1 bg-sky-50 text-green-800 rounded-full text-xs font-medium">
 Latest
 </span>
 )}
 </div>

 <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 text-xs sm:text-sm">
 <div className="text-center">
 <p className="text-gray-600">BP</p>
 <p className="font-medium">{vital.bloodPressure.systolic}/{vital.bloodPressure.diastolic}</p>
 </div>
 <div className="text-center">
 <p className="text-gray-600">HR</p>
 <p className="font-medium">{vital.heartRate} bpm</p>
 </div>
 <div className="text-center">
 <p className="text-gray-600">Temp</p>
 <p className="font-medium">{vital.temperature}°C</p>
 </div>
 <div className="text-center">
 <p className="text-gray-600">Weight</p>
 <p className="font-medium">{vital.weight} kg</p>
 </div>
 <div className="text-center">
 <p className="text-gray-600">O2 Sat</p>
 <p className="font-medium">{vital.oxygenSaturation}%</p>
 </div>
 <div className="text-center">
 <p className="text-gray-600">Height</p>
 <p className="font-medium">{vital.height} cm</p>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )
 }

 const renderMetrics = () => {
 if (!patientData.healthMetrics) {
 return (
 <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center shadow-lg border border-green-200">
 <FaChartLine className="text-gray-400 text-3xl sm:text-4xl mx-auto mb-4" />
 <h3 className="text-base sm:text-lg font-semibold text-gray-600 mb-2">No Health Metrics Available</h3>
 <p className="text-gray-500 text-sm sm:text-base">Health metrics will be available after your first comprehensive checkup</p>
 </div>
 )
 }

 const metrics = patientData.healthMetrics

 return (
 <div className="space-y-4 sm:space-y-5 md:space-y-6">
 {/* Health Score Overview */}
 <div className="bg-brand-navy rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
 <div>
 <h3 className="text-lg sm:text-xl font-bold mb-2">Health Score Overview</h3>
 <p className="opacity-90 text-xs sm:text-sm">Based on your latest health assessments</p>
 </div>
 <div className="text-left sm:text-right">
 <p className="text-3xl sm:text-4xl font-bold">{patientData.healthScore}%</p>
 <p className="opacity-80 text-sm">Overall Health</p>
 </div>
 </div>
 </div>

 {/* Detailed Metrics */}
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
 {/* Cardiovascular Health */}
 <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-red-200">
 <h4 className="font-semibold text-red-800 mb-3 sm:mb-4 flex items-center text-sm sm:text-base">
 <FaHeart className="mr-2 text-red-500" />
 Cardiovascular Health
 </h4>
 <div className="space-y-2 sm:space-y-3">
 <div className="flex justify-between items-center">
 <span className="text-xs sm:text-sm text-gray-600">Blood Pressure</span>
 <span className="font-medium text-red-600 text-xs sm:text-sm">
 {metrics.bloodPressure.systolic}/{metrics.bloodPressure.diastolic} mmHg
 </span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-xs sm:text-sm text-gray-600">Heart Rate Variability</span>
 <span className="font-medium text-xs sm:text-sm">{metrics.heartRateVariability} ms</span>
 </div>
 <div className="text-xs text-gray-500">
 Last updated: {metrics.bloodPressure.date}
 </div>
 </div>
 </div>

 {/* Cholesterol Profile */}
 <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-purple-200">
 <h4 className="font-semibold text-purple-800 mb-3 sm:mb-4 flex items-center text-sm sm:text-base">
 <FaNutritionix className="mr-2 text-purple-500" />
 Cholesterol Profile
 </h4>
 <div className="space-y-2 sm:space-y-3">
 <div className="flex justify-between items-center">
 <span className="text-xs sm:text-sm text-gray-600">Total</span>
 <span className="font-medium text-xs sm:text-sm">{metrics.cholesterol.total} mg/dL</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-xs sm:text-sm text-gray-600">LDL</span>
 <span className="font-medium text-red-600 text-xs sm:text-sm">{metrics.cholesterol.ldl} mg/dL</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-xs sm:text-sm text-gray-600">HDL</span>
 <span className="font-medium text-green-600 text-xs sm:text-sm">{metrics.cholesterol.hdl} mg/dL</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-xs sm:text-sm text-gray-600">Triglycerides</span>
 <span className="font-medium text-xs sm:text-sm">{metrics.cholesterol.triglycerides} mg/dL</span>
 </div>
 </div>
 </div>

 {/* Body Composition */}
 <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-blue-200">
 <h4 className="font-semibold text-blue-800 mb-3 sm:mb-4 flex items-center text-sm sm:text-base">
 <FaWeight className="mr-2 text-blue-500" />
 Body Composition
 </h4>
 <div className="space-y-2 sm:space-y-3">
 <div className="flex justify-between items-center">
 <span className="text-xs sm:text-sm text-gray-600">BMI</span>
 <span className="font-medium text-xs sm:text-sm">{metrics.bmi.value}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-xs sm:text-sm text-gray-600">Category</span>
 <span className="font-medium text-blue-600 text-xs sm:text-sm">{metrics.bmi.category}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-xs sm:text-sm text-gray-600">Muscle Mass</span>
 <span className="font-medium text-xs sm:text-sm">{metrics.muscleMass} kg</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-xs sm:text-sm text-gray-600">Visceral Fat</span>
 <span className="font-medium text-xs sm:text-sm">{metrics.visceralFat}</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 )
 }

 const renderTimeline = () => {
 // Combine all health events for timeline
 const timelineEvents = [
 ...(medicalRecords || []).map(record => ({
 id: record.id,
 date: record.date,
 time: record.time,
 type: 'medical_record',
 title: record.title,
 description: record.summary,
 provider: record.doctorResponsible,
 category: record.type
 })),
 ...(activePrescriptions || []).map(rx => ({
 id: rx.id,
 date: rx.date,
 time: rx.time,
 type: 'prescription',
 title: `Prescription from ${rx.doctorName}`,
 description: rx.diagnosis,
 provider: rx.doctorName,
 category: 'prescription'
 })),
 ...(patientData.vitalSigns || []).map(vital => ({
 id: vital.id,
 date: vital.date,
 time: vital.time,
 type: 'vitals',
 title: 'Vital Signs Check',
 description: `BP: ${vital.bloodPressure.systolic}/${vital.bloodPressure.diastolic}, Weight: ${vital.weight}kg`,
 provider: vital.labTechnician,
 category: 'vitals'
 }))
 ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

 return (
 <div className="space-y-4 sm:space-y-5 md:space-y-6">
 <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-purple-200">
 <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center">
 <FaHistory className="mr-2 text-blue-500" />
 Health Timeline
 </h3>
 
 <div className="relative">
 {/* Timeline line */}
 <div className="absolute left-3 sm:left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
 
 <div className="space-y-4 sm:space-y-6">
 {timelineEvents.map((event, _index) => (
 <div key={event.id} className="relative flex items-start gap-3 sm:gap-4">
 {/* Timeline dot */}
 <div className={`relative z-10 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
 event.type === 'medical_record' ? 'bg-sky-50' :
 event.type === 'prescription' ? 'bg-sky-50' :
 'bg-sky-50'
 }`}>
 {event.type === 'medical_record' && <FaStethoscope className="text-blue-600 text-xs sm:text-sm" />}
 {event.type === 'prescription' && <FaPills className="text-green-600 text-xs sm:text-sm" />}
 {event.type === 'vitals' && <FaThermometerHalf className="text-purple-600 text-xs sm:text-sm" />}
 </div>
 
 {/* Event content */}
 <div className="flex-1 bg-white rounded-lg sm:rounded-xl p-3 sm:p-4">
 <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
 <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{event.title}</h4>
 <div className="text-left sm:text-right">
 <p className="text-xs sm:text-sm font-medium text-gray-700">
 {new Date(event.date).toLocaleDateString()}
 </p>
 <p className="text-xs text-gray-500">{event.time}</p>
 </div>
 </div>
 <p className="text-xs sm:text-sm text-gray-600 mb-2">{event.description}</p>
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
 <p className="text-xs text-gray-500">
 <FaUserMd className="inline mr-1" />
 {event.provider}
 </p>
 <span className={`self-start sm:self-auto px-2 py-0.5 rounded-full text-xs font-medium ${getRecordTypeColor(event.category)}`}>
 {event.category.replace('_', ' ')}
 </span>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 )
 }

 if (loadingRecords) {
 return (
 <div className="flex items-center justify-center py-12">
 <FaFileAlt className="animate-pulse text-blue-500 text-2xl mr-3" />
 <span className="text-gray-500">Loading health records...</span>
 </div>
 )
 }

 if (medicalRecords.length === 0 && !patientData.vitalSigns && !patientData.healthMetrics) {
 return (
 <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg text-center border border-blue-200">
 <div className="bg-sky-50 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4">
 <FaFileAlt className="text-blue-500 text-2xl sm:text-3xl" />
 </div>
 <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">No Health Records</h3>
 <p className="text-gray-500 mb-6 text-sm sm:text-base">Your health records will appear here once they are added</p>
 <Link href="/search/doctors" className="bg-white transition-all transform hover:scale-105 flex items-center gap-2 mx-auto text-sm sm:text-base w-fit">
 <FaPlus />
 Request Medical Records
 </Link>
 </div>
 )
 }

 return (
 <div className="space-y-4 sm:space-y-5 md:space-y-6">
 {/* Header with Stats */}
 <div className="bg-brand-navy rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white">
 <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
 <div>
 <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 flex items-center">
 <FaFileAlt className="mr-2 sm:mr-3" />
 Health Records & Analytics
 </h2>
 <p className="opacity-90 text-xs sm:text-sm md:text-base">Comprehensive view of your health journey</p>
 </div>
 <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 text-center">
 <div className="bg-sky-100/20 backdrop-blur-sm rounded-lg p-2 sm:p-3">
 <p className="text-lg sm:text-xl md:text-2xl font-bold">{medicalRecords?.length || 0}</p>
 <p className="text-xs opacity-90">Medical Records</p>
 </div>
 <div className="bg-sky-100/20 backdrop-blur-sm rounded-lg p-2 sm:p-3">
 <p className="text-lg sm:text-xl md:text-2xl font-bold">{patientData.vitalSigns?.length || 0}</p>
 <p className="text-xs opacity-90">Vital Signs</p>
 </div>
 </div>
 </div>
 </div>

 {/* Search and Filters */}
 <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-gray-200">
 <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
 <div className="flex-1 relative">
 <FaSearch className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-base" />
 <input
 type="text"
 placeholder="Search records, diagnoses..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-sm sm:text-base"
 />
 </div>

 <button
 onClick={() => setShowFilters(!showFilters)}
 className="px-4 sm:px-6 py-2.5 sm:py-3 bg-sky-50 text-gray-700 rounded-lg sm:rounded-xl transition flex items-center justify-center gap-2 text-sm sm:text-base"
 >
 <FaFilter />
 <span className="hidden sm:inline">Filters</span>
 {showFilters ? <FaChevronUp /> : <FaChevronDown />}
 </button>
 </div>

 {showFilters && (
 <div className="mt-4 pt-4 border-t border-gray-200 space-y-3 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-3 md:gap-4">
 <select
 value={filters.type}
 onChange={(e) => setFilters({ ...filters, type: e.target.value as FilterOptions['type'] })}
 className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm sm:text-base"
 >
 <option value="all">All Types</option>
 <option value="consultation">Consultations</option>
 <option value="prescription">Prescriptions</option>
 <option value="lab_result">Lab Results</option>
 <option value="imaging">Imaging</option>
 <option value="vaccination">Vaccinations</option>
 <option value="surgery">Surgery</option>
 </select>

 <select
 value={filters.dateRange}
 onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as FilterOptions['dateRange'] })}
 className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm sm:text-base"
 >
 <option value="all">All Time</option>
 <option value="last_week">Last Week</option>
 <option value="last_month">Last Month</option>
 <option value="last_3_months">Last 3 Months</option>
 <option value="last_year">Last Year</option>
 </select>

 <select
 value={filters.doctor}
 onChange={(e) => setFilters({ ...filters, doctor: e.target.value })}
 className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm sm:text-base"
 >
 <option value="all">All Doctors</option>
 {doctors.map(doctor => (
 <option key={doctor} value={doctor}>{doctor}</option>
 ))}
 </select>
 </div>
 )}
 </div>

 {/* Mobile Accordion / Desktop Tabs */}
 <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
 {/* Desktop Tab Navigation */}
 <div className="hidden sm:block border-b border-gray-200">
 <div className="flex overflow-x-auto">
 {sections.map((tab) => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id as typeof activeTab)}
 className={`flex-shrink-0 px-3 md:px-6 py-3 md:py-4 text-center font-medium transition-all flex items-center gap-1.5 md:gap-2 ${
 activeTab === tab.id
 ? `text-${tab.color}-600 border-b-2 border-current from-${tab.color}-50 to-transparent`
 : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
 }`}
 title={tab.label}
 >
 <tab.icon className="text-base md:text-base" />
 <span className="hidden md:inline whitespace-nowrap text-sm md:text-base">{tab.label}</span>
 </button>
 ))}
 </div>
 </div>

 {/* Content — always visible */}
 <div className="p-4 md:p-6 pb-20 sm:pb-6">
 {activeTab === 'records' && renderRecords()}
 {activeTab === 'vitals' && renderVitals()}
 {activeTab === 'metrics' && renderMetrics()}
 {activeTab === 'timeline' && renderTimeline()}
 </div>
 </div>

 {/* Mobile fixed bottom tab bar */}
 <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-2 px-1 z-50 shadow-lg">
 {sections.map((section) => {
 const Icon = section.icon
 const isActive = activeTab === section.id
 return (
 <button
 key={section.id}
 onClick={() => setActiveTab(section.id as typeof activeTab)}
 className={`flex flex-col items-center justify-center p-1 min-w-[40px] ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
 >
 <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
 {isActive && <div className="w-1 h-1 bg-blue-600 rounded-full mt-1" />}
 </button>
 )
 })}
 </div>

 </div>
 )
}

export default HealthRecords