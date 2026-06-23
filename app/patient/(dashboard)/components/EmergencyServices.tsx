import React, { useState, useEffect } from 'react'
import { Patient } from '@/lib/data/patients'
import { 
 FaAmbulance, 
 FaPhone, 
 FaClock, 
 FaExclamationTriangle, 
 FaCheckCircle, 
 FaHospital, 
 FaCalendarAlt,
 FaMapMarkerAlt,
 FaHeartbeat,
 FaFirstAid,
 FaTimes,
 FaLocationArrow,
 FaHistory,
 FaComments,
 FaVideo,
 FaUserNurse,
 FaBell,
 FaShieldAlt,
 FaEdit,
 FaDownload,
 FaShare,
 FaPrint,
 FaUsers,
 FaRoute,
 FaStopwatch,
 FaClipboardList,
 FaMedkit,
 FaHardHat,
 FaLifeRing,
} from 'react-icons/fa'
import { toast } from 'react-toastify'

interface Props {
 patientData: Patient
}

interface EmergencyContact {
 id: string
 name: string
 service: string
 phone: string
 available24h: boolean
 responseTime: string
 specialization: string[]
 location: string
 distance: string
}

const EmergencyServices: React.FC<Props> = ({ patientData }) => {
 const [activeTab, setActiveTab] = useState<'emergency' | 'contacts' | 'history' | 'chat'>('emergency')
 const [showMedicalInfo, setShowMedicalInfo] = useState(false)
 const [isEmergencyCall, setIsEmergencyCall] = useState(false)

 const hasEmergencyContacts = patientData.emergencyServiceContacts && patientData.emergencyServiceContacts.length > 0
 const hasEmergencyChat = patientData.chatHistory?.emergencyServices && patientData.chatHistory.emergencyServices.length > 0

 const [emergencyServices, setEmergencyServices] = useState<EmergencyContact[]>([])
  
 const [activeMedications, setActiveMedications] = useState<any[]>([])

 // Self-fetch active prescriptions for medical info display
 useEffect(() => {
 const fetchMedications = async () => {
 try {
 const res = await fetch(`/api/patients/${patientData.id}/prescriptions?active=true`, { credentials: 'include' })
 if (res.ok) {
 const json = await res.json()
 if (json.success && json.data) {
 setActiveMedications(json.data.map((p: any) => ({
 medicines: (p.medicines ?? []).map((m: any) => ({
 name: m.medicine?.name ?? m.name ?? '',
 dosage: m.dosage ?? '',
 frequency: m.frequency ?? '',
 })),
 })))
 }
 }
 } catch { /* silent */ }
 }
 fetchMedications()
 }, [patientData.id])

 useEffect(() => {
 const fetchResponders = async () => {
 try {
 const res = await fetch('/api/search/providers?type=EMERGENCY_WORKER')
 if (res.ok) {
 const json = await res.json()
 if (json.success && json.data) {
  
 setEmergencyServices(json.data.map((r: any) => ({
 id: r.id,
 name: `${r.firstName} ${r.lastName}`,
 service: r.service || 'Emergency Service',
 phone: r.phone || '',
 available24h: r.available24h ?? true,
 responseTime: r.responseTime || 'N/A',
 specialization: r.specialization || [],
 location: r.address || '',
 distance: 'N/A',
 })))
 }
 }
 } catch (error) {
 console.error('Failed to fetch emergency services:', error)
 }
 }
 fetchResponders()
 }, [])

 const initiateEmergencyCall = (service: EmergencyContact) => {
 if (service.phone) {
   window.location.href = `tel:${service.phone.replace(/\s/g, '')}`
   return
 }
 setIsEmergencyCall(true)
 toast.info(`Connecting to ${service.name}`, { autoClose: 3000 })
 setTimeout(() => setIsEmergencyCall(false), 3000)
 }

 const shareLocation = () => {
 if (!navigator.geolocation) {
   toast.error('Geolocation is not supported by your browser.')
   return
 }
 navigator.geolocation.getCurrentPosition(
   (position) => {
   const { latitude, longitude } = position.coords
   const mapsUrl = `https://maps.google.com?q=${latitude},${longitude}`
   navigator.clipboard?.writeText(mapsUrl).catch(() => {})
   toast.success('Location copied to clipboard. Share it with emergency services.')
   },
   () => toast.error('Unable to get location. Please check your permissions.')
 )
 }

 const sections = [
 { id: 'emergency', label: 'Emergency', icon: FaAmbulance, color: 'red' },
 { id: 'contacts', label: 'Contacts', icon: FaUsers, color: 'blue' },
 { id: 'history', label: 'History', icon: FaHistory, color: 'purple' },
 { id: 'chat', label: 'Communications', icon: FaComments, color: 'green' }
 ]

 const renderEmergencyPanel = () => (
 <div className="space-y-4 sm:space-y-5 md:space-y-6">
 {/* Emergency Alert Banner */}
 <div className="bg-brand-navy rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-8 text-white shadow-2xl">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div className="flex items-center space-x-3 sm:space-x-4">
 <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-surface bg-opacity-20 rounded-full flex items-center justify-center animate-pulse">
 <FaBell className="text-xl sm:text-2xl md:text-3xl" />
 </div>
 <div>
 <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-1">Emergency Services</h3>
 <p className="text-red-100 text-xs sm:text-sm md:text-base">For immediate medical attention</p>
 </div>
 </div>
 <button 
 onClick={() => emergencyServices[0] && initiateEmergencyCall(emergencyServices[0])}
 disabled={isEmergencyCall || emergencyServices.length === 0}
 className="bg-surface text-red-600 px-4 sm:px-6 md:px-8 py-3 sm:py-3.5 md:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base md:text-lg hover:bg-red-50 transition-all transform hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2"
 >
 <FaPhone className={isEmergencyCall ? 'animate-bounce' : ''} />
 {isEmergencyCall ? 'Calling...' : 'Emergency: 999'}
 </button>
 </div>
 </div>

 {/* Quick Actions - Vertical on Mobile */}
 <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-3 md:gap-4">
 <button 
 onClick={shareLocation}
 className="w-full bg-surface transition-all group flex sm:block items-center gap-3"
 >
 <FaLocationArrow className="text-xl sm:text-2xl text-blue-500 sm:mx-auto sm:mb-2 group-hover:animate-bounce" />
 <div className="text-left sm:text-center">
 <p className="font-medium text-blue-700 text-sm sm:text-base">Share Location</p>
 <p className="text-xs text-blue-600">GPS coordinates</p>
 </div>
 </button>

 <button 
 onClick={() => setShowMedicalInfo(!showMedicalInfo)}
 className="w-full bg-surface transition-all group flex sm:block items-center gap-3"
 >
 <FaMedkit className="text-xl sm:text-2xl text-green-500 sm:mx-auto sm:mb-2 group-hover:animate-bounce" />
 <div className="text-left sm:text-center">
 <p className="font-medium text-green-700 text-sm sm:text-base">Medical Info</p>
 <p className="text-xs text-green-600">Emergency details</p>
 </div>
 </button>

 <button className="w-full bg-surface transition-all group flex sm:block items-center gap-3">
 <FaVideo className="text-xl sm:text-2xl text-purple-500 sm:mx-auto sm:mb-2 group-hover:animate-bounce" />
 <div className="text-left sm:text-center">
 <p className="font-medium text-purple-700 text-sm sm:text-base">Video Call</p>
 <p className="text-xs text-purple-600">Emergency video</p>
 </div>
 </button>

 <button className="w-full bg-surface transition-all group flex sm:block items-center gap-3">
 <FaComments className="text-xl sm:text-2xl text-orange-500 sm:mx-auto sm:mb-2 group-hover:animate-bounce" />
 <div className="text-left sm:text-center">
 <p className="font-medium text-orange-700 text-sm sm:text-base">Text Support</p>
 <p className="text-xs text-orange-600">Emergency chat</p>
 </div>
 </button>
 </div>

 {/* Medical Information Panel */}
 {showMedicalInfo && (
 <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border-2 border-red-200">
 <div className="flex items-center justify-between mb-3 sm:mb-4">
 <h3 className="text-base sm:text-lg font-semibold text-red-800 flex items-center">
 <FaFirstAid className="mr-2" />
 Emergency Medical Information
 </h3>
 <button 
 onClick={() => setShowMedicalInfo(false)}
 className="text-red-600 hover:text-red-800 p-1"
 >
 <FaTimes />
 </button>
 </div>
 
 <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4 md:gap-6">
 <div className="space-y-3">
 <div className="bg-red-100 bg-opacity-70 rounded-lg p-3">
 <p className="text-xs sm:text-sm font-medium text-red-700">Blood Type</p>
 <p className="text-base sm:text-lg font-bold text-red-900 flex items-center">
 <FaHeartbeat className="mr-2" />
 {patientData.bloodType}
 </p>
 </div>
 
 <div className="bg-yellow-100 bg-opacity-70 rounded-lg p-3">
 <p className="text-xs sm:text-sm font-medium text-yellow-700">Allergies</p>
 <div className="flex flex-wrap gap-1 mt-1">
 {(patientData.allergies || []).map((allergy, index) => (
 <span key={index} className="px-2 py-0.5 sm:py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-medium">
  {allergy}
 </span>
 ))}
 </div>
 </div>
 </div>
 
 <div className="space-y-3">
 <div className="bg-blue-100 bg-opacity-70 rounded-lg p-3">
 <p className="text-xs sm:text-sm font-medium text-blue-700">Chronic Conditions</p>
 <div className="space-y-1 mt-1">
 {(patientData.chronicConditions || []).map((condition, index) => (
 <p key={index} className="text-xs sm:text-sm text-blue-800 flex items-center">
 <FaHeartbeat className="mr-2 text-xs" />
 {condition}
 </p>
 ))}
 </div>
 </div>
 
 <div className="bg-green-100 bg-opacity-70 rounded-lg p-3">
 <p className="text-xs sm:text-sm font-medium text-green-700">Current Medications</p>
 <div className="space-y-1 mt-1">
 {activeMedications?.slice(0, 3).map((prescription, index) => (
 <p key={index} className="text-xs text-green-800">
  {prescription.medicines[0]?.name} - {prescription.medicines[0]?.dosage}
 </p>
 ))}
 </div>
 </div>
 </div>
 </div>

 <div className="mt-4 pt-4 border-t border-red-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
 <p className="text-xs sm:text-sm text-soft">Emergency Contact: {patientData.emergencyContact?.name || 'Not set'}</p>
 <div className="flex gap-2">
 <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs sm:text-sm hover:bg-blue-200 transition">
 <FaShare className="inline mr-1" />
 Share
 </button>
 <button className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs sm:text-sm hover:bg-green-200 transition">
 <FaPrint className="inline mr-1" />
 Print
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Emergency Services List */}
 <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-line">
 <h3 className="text-base sm:text-lg font-semibold text-fg mb-4 sm:mb-5 md:mb-6 flex items-center">
 <FaLifeRing className="mr-2 text-blue-500" />
 Available Emergency Services
 </h3>
 
 <div className="space-y-3 sm:space-y-4">
 {emergencyServices.map((service) => (
 <div key={service.id} className="bg-surface bg-opacity-80 border border-line rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-md transition-all">
 <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
 <div className="flex items-start gap-3 sm:gap-4 flex-1">
 <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${
 service.service.includes('Mental') ? 'bg-sky-50 text-purple-600' :
 service.service.includes('Premium') ? 'bg-sky-50 text-yellow-600' :
 service.service.includes('Medical') ? 'bg-sky-50 text-green-600' :
 'bg-sky-50 text-red-600'
 }`}>
 {service.service.includes('Mental') ? <FaHardHat className="text-base sm:text-lg" /> : <FaAmbulance className="text-base sm:text-lg" />}
 </div>
 
 <div className="flex-1 min-w-0">
 <div className="flex flex-wrap items-center gap-2 mb-2">
 <h4 className="font-semibold text-fg text-sm sm:text-base">{service.name}</h4>
 {service.available24h && (
 <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
 24/7
 </span>
 )}
 </div>
 
 <p className="text-xs sm:text-sm text-soft mb-2">{service.service}</p>
 
 <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-2">
 <div className="flex items-center gap-1 text-soft">
 <FaStopwatch className="text-orange-500" />
 <span className="truncate">{service.responseTime}</span>
 </div>
 <div className="flex items-center gap-1 text-soft">
 <FaMapMarkerAlt className="text-blue-500" />
 <span className="truncate">{service.distance}</span>
 </div>
 <div className="flex items-center gap-1 text-soft">
 <FaHospital className="text-green-500" />
 <span className="truncate">{service.location}</span>
 </div>
 <div className="flex items-center gap-1 text-soft">
 <FaPhone className="text-purple-500" />
 <span className="truncate">{service.phone}</span>
 </div>
 </div>
 
 <div className="flex flex-wrap gap-1">
 {service.specialization.map((spec, index) => (
 <span key={index} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
 {spec}
 </span>
 ))}
 </div>
 </div>
 </div>
 
 <div className="flex sm:flex-col gap-2 sm:ml-4">
 <button 
 onClick={() => initiateEmergencyCall(service)}
 className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center justify-center gap-2 font-medium text-xs sm:text-sm"
 >
 <FaPhone />
 Call
 </button>
 <button className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2 text-xs sm:text-sm">
 <FaComments />
 Chat
 </button>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )

 const renderEmergencyHistory = () => (
 <div className="space-y-4 sm:space-y-5 md:space-y-6">
 {/* Stats Overview - Vertical on Mobile */}
 <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-3 md:gap-4">
 <div className="bg-surface rounded-lg sm:rounded-xl p-3 sm:p-4 border border-red-200">
 <FaAmbulance className="text-red-500 text-xl sm:text-2xl mb-2" />
 <p className="text-soft text-xs sm:text-sm">Total Incidents</p>
 <p className="text-xl sm:text-2xl font-bold text-red-600">
 {hasEmergencyContacts ? patientData.emergencyServiceContacts!.length : 0}
 </p>
 </div>
 
 <div className="bg-surface rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-200">
 <FaCheckCircle className="text-green-500 text-xl sm:text-2xl mb-2" />
 <p className="text-soft text-xs sm:text-sm">Resolved</p>
 <p className="text-xl sm:text-2xl font-bold text-green-600">
 {hasEmergencyContacts ? patientData.emergencyServiceContacts!.filter(e => e.status === 'resolved').length : 0}
 </p>
 </div>
 
 <div className="bg-surface rounded-lg sm:rounded-xl p-3 sm:p-4 border border-yellow-200">
 <FaClock className="text-yellow-500 text-xl sm:text-2xl mb-2" />
 <p className="text-soft text-xs sm:text-sm">Avg Response</p>
 <p className="text-xl sm:text-2xl font-bold text-yellow-600">
 {hasEmergencyContacts ? 
 Math.round(patientData.emergencyServiceContacts!.reduce((sum, e) => sum + e.responseTime, 0) / 
 patientData.emergencyServiceContacts!.length) : 0} min
 </p>
 </div>
 
 <div className="bg-surface rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200">
 <FaUsers className="text-blue-500 text-xl sm:text-2xl mb-2" />
 <p className="text-soft text-xs sm:text-sm">Services Used</p>
 <p className="text-xl sm:text-2xl font-bold text-blue-600">
 {hasEmergencyContacts ? 
 new Set(patientData.emergencyServiceContacts!.map(e => e.serviceName)).size : 0}
 </p>
 </div>
 </div>

 {/* Emergency History */}
 {hasEmergencyContacts ? (
 <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-purple-200">
 <h3 className="text-base sm:text-lg font-semibold text-fg mb-4 sm:mb-5 md:mb-6 flex items-center">
 <FaHistory className="mr-2 text-purple-500" />
 Emergency Service History
 </h3>
 
 <div className="space-y-3 sm:space-y-4">
 {patientData.emergencyServiceContacts!.map((contact) => (
 <div key={contact.id} className="bg-surface bg-opacity-80 border border-line rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-md transition">
 <div className="flex items-start justify-between">
 <div className="flex-1">
 <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
 <div className="w-8 h-8 sm:w-10 sm:h-10 bg-sky-50 rounded-lg flex items-center justify-center">
 <FaAmbulance className="text-red-600 text-sm sm:text-base" />
 </div>
 <div className="flex-1 min-w-0">
 <h4 className="font-semibold text-fg text-sm sm:text-base">Incident #{contact.id}</h4>
 <p className="text-xs sm:text-sm text-soft">{contact.serviceName}</p>
 </div>
 <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
 contact.status === 'resolved' ? 'bg-green-100 text-green-800' :
 'bg-yellow-100 text-yellow-800'
 }`}>
 {contact.status}
 </span>
 </div>
 
 <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4 text-xs sm:text-sm mb-3 sm:mb-4">
 <div className="space-y-1 sm:space-y-2">
 <div className="flex items-center gap-2 text-soft">
 <FaCalendarAlt className="text-blue-500" />
 <span>{new Date(contact.date).toLocaleDateString()}</span>
 </div>
 <div className="flex items-center gap-2 text-soft">
 <FaClock className="text-green-500" />
 <span>{contact.time}</span>
 </div>
 </div>
 <div className="space-y-1 sm:space-y-2">
 <div className="flex items-center gap-2 text-soft">
 <FaStopwatch className="text-orange-500" />
 <span>Response: {contact.responseTime} minutes</span>
 </div>
 <div className="flex items-center gap-2 text-soft">
 <FaHospital className="text-purple-500" />
 <span>{contact.serviceName}</span>
 </div>
 </div>
 </div>

 <div className="bg-surface rounded-lg sm:rounded-xl p-3 sm:p-4 border border-red-200">
 <h5 className="font-medium text-red-800 mb-2 flex items-center text-sm sm:text-base">
 <FaExclamationTriangle className="mr-2" />
 Reason for Emergency
 </h5>
 <p className="text-red-700 mb-3 text-xs sm:text-sm">{contact.reason}</p>
 
 {contact.notes && (
 <div className="pt-3 border-t border-red-200">
 <h6 className="font-medium text-red-800 mb-1 text-xs sm:text-sm">Response Notes:</h6>
 <p className="text-red-700 text-xs sm:text-sm">{contact.notes}</p>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 ) : (
 <div className="bg-surface rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center shadow-lg border border-line">
 <FaHistory className="text-faint text-3xl sm:text-4xl mx-auto mb-4" />
 <h3 className="text-base sm:text-lg font-semibold text-soft mb-2">No Emergency History</h3>
 <p className="text-soft text-sm">You have not used emergency services yet. We hope it stays that way!</p>
 </div>
 )}
 </div>
 )

 const renderEmergencyContacts = () => (
 <div className="space-y-4 sm:space-y-5 md:space-y-6">
 {/* Personal Emergency Contact */}
 <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-pink-200">
 <h3 className="text-base sm:text-lg font-semibold text-fg mb-4 sm:mb-5 md:mb-6 flex items-center">
 <FaUserNurse className="mr-2 text-pink-500" />
 Personal Emergency Contact
 </h3>

 {patientData.emergencyContact ? (
 <div className="bg-pink-100 bg-opacity-70 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-pink-200">
 <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
 <div className="flex items-start gap-3 sm:gap-4">
 <div className="w-10 h-10 sm:w-12 sm:h-12 bg-sky-50 rounded-lg sm:rounded-xl flex items-center justify-center">
 <FaUsers className="text-pink-600 text-base sm:text-xl" />
 </div>
 <div className="flex-1">
 <h4 className="font-semibold text-pink-900 text-sm sm:text-base">{patientData.emergencyContact.name}</h4>
 <p className="text-pink-700 capitalize text-xs sm:text-sm">{patientData.emergencyContact.relationship}</p>
 <div className="mt-2 space-y-1 text-xs sm:text-sm">
 <div className="flex items-center gap-2 text-pink-600">
 <FaPhone />
 <span>{patientData.emergencyContact.phone}</span>
 </div>
 <div className="flex items-center gap-2 text-pink-600">
 <FaMapMarkerAlt />
 <span className="truncate">{patientData.emergencyContact.address}</span>
 </div>
 </div>
 </div>
 </div>
 <div className="flex sm:flex-col gap-2">
 <button className="p-2 bg-pink-100 text-pink-600 rounded-lg hover:bg-pink-200 transition">
 <FaPhone className="text-sm sm:text-base" />
 </button>
 <button className="p-2 bg-pink-100 text-pink-600 rounded-lg hover:bg-pink-200 transition">
 <FaComments className="text-sm sm:text-base" />
 </button>
 <button className="p-2 bg-pink-100 text-pink-600 rounded-lg hover:bg-pink-200 transition">
 <FaEdit className="text-sm sm:text-base" />
 </button>
 </div>
 </div>
 </div>
 ) : (
 <div className="bg-pink-100 bg-opacity-70 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-pink-200 text-center">
 <p className="text-pink-700 text-sm">No emergency contact set. Please update your profile.</p>
 </div>
 )}
 </div>

 {/* Medical Information for Emergencies */}
 <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-red-200">
 <h3 className="text-base sm:text-lg font-semibold text-fg mb-4 sm:mb-5 md:mb-6 flex items-center">
 <FaMedkit className="mr-2 text-red-500" />
 Critical Medical Information
 </h3>
 
 <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4 md:gap-6">
 <div className="space-y-3 sm:space-y-4">
 <div className="bg-red-100 bg-opacity-70 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-red-200">
 <h4 className="font-medium text-red-800 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
 <FaHeartbeat className="mr-2" />
 Vital Information
 </h4>
 <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
 <div className="flex justify-between">
 <span className="text-red-700">Blood Type:</span>
 <span className="font-semibold text-red-900">{patientData.bloodType}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-red-700">Age:</span>
 <span className="font-semibold text-red-900">{patientData.age} years</span>
 </div>
 <div className="flex justify-between">
 <span className="text-red-700">Weight:</span>
 <span className="font-semibold text-red-900">
 {patientData.vitalSigns?.[0]?.weight || 'N/A'} kg
 </span>
 </div>
 <div className="flex justify-between">
 <span className="text-red-700">Height:</span>
 <span className="font-semibold text-red-900">
 {patientData.vitalSigns?.[0]?.height || 'N/A'} cm
 </span>
 </div>
 </div>
 </div>

 <div className="bg-yellow-100 bg-opacity-70 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-yellow-200">
 <h4 className="font-medium text-yellow-800 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
 <FaExclamationTriangle className="mr-2" />
 Allergies & Warnings
 </h4>
 <div className="space-y-1.5 sm:space-y-2">
 {(patientData.allergies || []).map((allergy, index) => (
 <div key={index} className="flex items-center gap-2 text-yellow-800 bg-yellow-200 bg-opacity-70 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2">
 <FaExclamationTriangle className="text-yellow-600 text-xs sm:text-sm" />
 <span className="font-medium text-xs sm:text-sm">{allergy}</span>
 </div>
 ))}
 </div>
 </div>
 </div>

 <div className="space-y-3 sm:space-y-4">
 <div className="bg-blue-100 bg-opacity-70 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200">
 <h4 className="font-medium text-blue-800 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
 <FaClipboardList className="mr-2" />
 Chronic Conditions
 </h4>
 <div className="space-y-1.5 sm:space-y-2">
 {(patientData.chronicConditions || []).map((condition, index) => (
 <div key={index} className="flex items-center gap-2 text-blue-800 bg-blue-200 bg-opacity-70 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2">
 <FaHeartbeat className="text-blue-600 text-xs sm:text-sm" />
 <span className="text-xs sm:text-sm">{condition}</span>
 </div>
 ))}
 </div>
 </div>

 <div className="bg-green-100 bg-opacity-70 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-200">
 <h4 className="font-medium text-green-800 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
 <FaMedkit className="mr-2" />
 Current Medications
 </h4>
 <div className="space-y-1.5 sm:space-y-2">
 {activeMedications?.slice(0, 3).map((prescription, index) => (
 <div key={index} className="text-green-800 bg-green-200 bg-opacity-70 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2">
 <p className="font-medium text-xs sm:text-sm">{prescription.medicines[0]?.name}</p>
 <p className="text-xs text-green-600">{prescription.medicines[0]?.dosage} - {prescription.medicines[0]?.frequency}</p>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>

 <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-red-200 flex justify-center">
 <button className="px-4 sm:px-6 py-2.5 sm:py-3 bg-red-500 text-white rounded-lg sm:rounded-xl font-semibold hover:bg-red-600 transition flex items-center gap-2 text-sm sm:text-base">
 <FaDownload />
 Download Emergency Card
 </button>
 </div>
 </div>

 {/* Additional Emergency Services */}
 <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-blue-200">
 <h3 className="text-base sm:text-lg font-semibold text-fg mb-4 sm:mb-5 md:mb-6 flex items-center">
 <FaShieldAlt className="mr-2 text-blue-500" />
 Emergency Service Contacts
 </h3>
 
 <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-3 md:gap-4">
 {[
 { name: 'Police Emergency', number: '999', icon: FaShieldAlt, color: 'blue', gradient: ' ' },
 { name: 'Fire Department', number: '995', icon: FaExclamationTriangle, color: 'orange', gradient: ' ' },
 { name: 'Medical Emergency', number: '999', icon: FaHeartbeat, color: 'red', gradient: ' ' },
 { name: 'Poison Control', number: '+230 800-POISON', icon: FaMedkit, color: 'purple', gradient: ' ' },
 { name: 'Crisis Hotline', number: '+230 800-HELP', icon: FaHardHat, color: 'pink', gradient: ' ' },
 { name: 'Road Emergency', number: '999', icon: FaRoute, color: 'green', gradient: ' ' }
 ].map((contact, index) => (
 <div key={index} className={` ${contact.gradient} border border-${contact.color}-200 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-md transition`}>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2 sm:gap-3">
 <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-${contact.color}-100 rounded-lg flex items-center justify-center`}>
 <contact.icon className={`text-${contact.color}-600 text-sm sm:text-base`} />
 </div>
 <div>
 <h4 className={`font-medium text-${contact.color}-900 text-xs sm:text-sm md:text-base`}>{contact.name}</h4>
 <p className={`text-xs sm:text-sm text-${contact.color}-700`}>{contact.number}</p>
 </div>
 </div>
 <button className={`p-1.5 sm:p-2 bg-${contact.color}-100 text-${contact.color}-600 rounded-lg hover:bg-${contact.color}-200 transition`}>
 <FaPhone className="text-xs sm:text-sm" />
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )

 const renderEmergencyChat = () => (
 <div className="space-y-4 sm:space-y-5 md:space-y-6">
 {hasEmergencyChat ? (
 <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-green-200">
 <h3 className="text-base sm:text-lg font-semibold text-fg mb-4 sm:mb-5 md:mb-6 flex items-center">
 <FaComments className="mr-2 text-green-500" />
 Emergency Service Communications
 </h3>
 
 <div className="space-y-3 sm:space-y-4">
 {patientData.chatHistory!.emergencyServices!.map((emergencyChat) => (
 <div key={emergencyChat.serviceId} className="border border-red-200 rounded-lg sm:rounded-xl p-3 sm:p-4 bg-surface">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
 <div className="flex items-center gap-2 sm:gap-3">
 <div className="w-8 h-8 sm:w-10 sm:h-10 bg-sky-50 rounded-lg flex items-center justify-center">
 <FaAmbulance className="text-red-600 text-sm sm:text-base" />
 </div>
 <div>
 <h4 className="font-medium text-red-900 text-sm sm:text-base">{emergencyChat.serviceName}</h4>
 <p className="text-xs sm:text-sm text-red-700">Emergency Communication</p>
 </div>
 </div>
 <div className="flex gap-2">
 <button className="p-1.5 sm:p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition">
 <FaPhone className="text-sm sm:text-base" />
 </button>
 <button className="p-1.5 sm:p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition">
 <FaVideo className="text-sm sm:text-base" />
 </button>
 </div>
 </div>
 
 <div className="bg-surface bg-opacity-80 rounded-lg p-2.5 sm:p-3 mb-3">
 <p className="text-xs sm:text-sm font-medium text-fg">Last Message:</p>
 <p className="text-soft text-xs sm:text-sm">{emergencyChat.lastMessage}</p>
 <p className="text-xs text-soft mt-1">{emergencyChat.lastMessageTime}</p>
 </div>
 
 {emergencyChat.messages && emergencyChat.messages.length > 0 && (
 <div className="space-y-1.5 sm:space-y-2">
 <p className="text-xs sm:text-sm font-medium text-red-800">Recent Messages:</p>
 {emergencyChat.messages.slice(0, 3).map((msg) => (
 <div key={msg.id} className="bg-surface bg-opacity-80 rounded-lg p-2.5 sm:p-3 border border-red-200">
 <div className="flex items-start justify-between">
 <div className="flex-1">
 <p className="text-xs sm:text-sm text-fg">{msg.message}</p>
 <div className="flex items-center gap-2 mt-1">
 <span className="text-xs text-soft">{msg.senderName}</span>
 <span className="text-xs text-soft">{msg.timestamp}</span>
 </div>
 </div>
 {msg.senderType === 'emergency' && (
 <div className="w-5 h-5 sm:w-6 sm:h-6 bg-red-100 rounded-full flex items-center justify-center ml-2">
 <FaAmbulance className="text-red-600 text-xs" />
 </div>
 )}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 ) : (
 <div className="bg-surface rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center shadow-lg border border-line">
 <FaComments className="text-faint text-3xl sm:text-4xl mx-auto mb-4" />
 <h3 className="text-base sm:text-lg font-semibold text-soft mb-2">No Emergency Communications</h3>
 <p className="text-soft text-sm">No emergency service communications found</p>
 </div>
 )}
 </div>
 )

 if (!hasEmergencyContacts && !hasEmergencyChat && activeTab === 'history') {
 return (
 <div className="bg-surface rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg text-center border border-line">
 <div className="bg-surface rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4">
 <FaAmbulance className="text-green-500 text-2xl sm:text-3xl" />
 </div>
 <h3 className="text-lg sm:text-xl font-semibold text-soft mb-2">Emergency Services</h3>
 <p className="text-soft mb-6 text-sm sm:text-base">No emergency service history - That is good news!</p>
 
 <div className="bg-surface border border-red-200 rounded-xl p-4 sm:p-6 mt-6">
 <FaExclamationTriangle className="text-red-500 text-2xl sm:text-3xl mx-auto mb-3" />
 <h4 className="font-semibold text-red-800 mb-2 text-sm sm:text-base">In Case of Emergency</h4>
 <p className="text-red-700 mb-4 text-xs sm:text-sm">Call emergency services immediately</p>
 <button 
 onClick={() => initiateEmergencyCall(emergencyServices[0])}
 className="bg-red-500 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:bg-red-600 font-semibold flex items-center gap-2 mx-auto text-sm sm:text-base"
 >
 <FaPhone />
 Emergency: 999
 </button>
 </div>
 </div>
 )
 }

 return (
 <div className="space-y-4 sm:space-y-5 md:space-y-6">
 {/* Emergency Services Header */}
 <div className="bg-brand-navy rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
 <div>
 <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 flex items-center">
 <FaAmbulance className="mr-2 sm:mr-3" />
 Emergency Services
 </h2>
 <p className="opacity-90 text-xs sm:text-sm md:text-base">Quick access to emergency help and medical support</p>
 </div>
 <div className="sm:text-right">
 <p className="text-xs sm:text-sm opacity-80">Emergency Number</p>
 <p className="text-2xl sm:text-3xl font-bold">999</p>
 </div>
 </div>
 </div>

 {/* Desktop/Mobile Tabs + Content */}
 <div className="bg-surface rounded-xl sm:rounded-2xl shadow-lg border border-line overflow-hidden pb-20 sm:pb-0">
 {/* Desktop Tab Navigation */}
 <div className="hidden sm:block border-b">
 <div className="flex overflow-x-auto">
 {sections.map((tab) => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id as typeof activeTab)}
 className={`flex-shrink-0 px-4 md:px-6 py-3 md:py-4 text-center font-medium transition-all ${
 activeTab === tab.id
 ? `text-${tab.color}-600 border-b-2 border-current bg-${tab.color}-50`
 : 'text-soft hover:text-fg hover:bg-subtle'
 }`}
 >
 <tab.icon className="inline mr-2 text-sm md:text-base" />
 <span className="whitespace-nowrap text-sm md:text-base">{tab.label}</span>
 </button>
 ))}
 </div>
 </div>

 {/* Content */}
 <div className="p-4 md:p-6">
 {activeTab === 'emergency' && renderEmergencyPanel()}
 {activeTab === 'contacts' && renderEmergencyContacts()}
 {activeTab === 'history' && renderEmergencyHistory()}
 {activeTab === 'chat' && renderEmergencyChat()}
 </div>
 </div>

 {/* Mobile Bottom Tab Bar */}
 <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-surface border-t flex justify-around items-center py-2 px-1 z-50">
 {sections.map((section) => {
 const Icon = section.icon
 const isActive = activeTab === section.id
 return (
 <button
 key={section.id}
 onClick={() => setActiveTab(section.id as typeof activeTab)}
 className={`flex flex-col items-center justify-center p-1 min-w-[40px] ${
 isActive ? 'text-blue-600' : 'text-faint'
 }`}
 >
 <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-faint'}`} />
 {isActive && <div className="w-1 h-1 bg-blue-600 rounded-full mt-1" />}
 </button>
 )
 })}
 </div>
 </div>
 )
}

export default EmergencyServices