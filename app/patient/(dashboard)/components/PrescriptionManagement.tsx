import React, { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import { getUserId } from '@/hooks/useUser'
import Link from 'next/link'
import { Patient, Prescription } from '@/lib/data/patients'
import { 
 FaPills, 
 FaCalendarAlt, 
 FaClock, 
 FaCheckCircle, 
 FaExclamationTriangle,
 FaUser,
 FaUserMd,
 FaDownload,
 FaPrint,
 FaSyncAlt,
 FaPlus,
 FaBell,
 FaEdit,
 FaEye,
 FaSearch,
 FaShoppingCart,
 FaTruck,
 FaMapMarkerAlt,
 FaPhone,
 FaStar,
 FaExclamationCircle,
 FaInfoCircle,
 FaHistory,
 FaClipboardCheck,
 FaCapsules,
 FaAllergies,
 FaTimesCircle,
 FaStethoscope,
} from 'react-icons/fa'

interface Props {
 patientData: Patient
}

interface MedicineOrder {
 id: string
 medicines: Array<{
 id: string
 name: string
 dosage: string
 quantity: number
 price: number
 inStock: boolean
 }>
 pharmacy: {
 name: string
 address: string
 phone: string
 rating: number
 deliveryTime: string
 }
 totalAmount: number
 deliveryFee: number
 estimatedDelivery: string
 paymentMethod: 'cash' | 'card' | 'insurance'
}

interface PillReminder {
 id: string
 medicineId: string
 medicineName: string
 dosage: string
 times: string[]
 taken: boolean[]
 nextDose: string
 frequency: string
}

 
function normalizePrescription(p: any): Prescription {
 return {
 id: p.id,
 date: p.date,
 time: '',
 doctorName: p.doctor ? `${p.doctor.user.firstName} ${p.doctor.user.lastName}` : 'Unknown',
 doctorId: p.doctor?.id ?? '',
 diagnosis: p.diagnosis,
 isActive: p.isActive,
 nextRefill: p.nextRefill ?? null,
 notes: p.notes ?? '',
 medicines: (p.medicines ?? []).map((m: any) => ({
 name: m.medicine?.name ?? m.name ?? '',
 dosage: m.dosage ?? '',
 quantity: m.quantity ?? 0,
 frequency: m.frequency ?? '',
 duration: m.duration ?? '',
 instructions: m.instructions ?? '',
 beforeFood: false,
 })),
 }
}

const PrescriptionManagement: React.FC<Props> = ({ patientData }) => {
 const [activeTab, setActiveTab] = useState<'active' | 'history' | 'reminders' | 'order'>('active')
 const [searchQuery, setSearchQuery] = useState('')
 const [sortBy, setSortBy] = useState<'date' | 'doctor' | 'medicine'>('date')
 const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired'>('all')
 const [expandedPrescription, setExpandedPrescription] = useState<string | null>(null)
 const [selectedForOrder, setSelectedForOrder] = useState<string[]>([])
 const [showReminders, setShowReminders] = useState(true)

 const [activePrescriptions, setActivePrescriptions] = useState<Prescription[]>([])
 const [prescriptionHistory, setPrescriptionHistory] = useState<Prescription[]>([])
 const [loadingPrescriptions, setLoadingPrescriptions] = useState(true)
 const [reminders, setReminders] = useState<PillReminder[]>([])
 const [currentOrder, setCurrentOrder] = useState<MedicineOrder | null>(null)

 // Self-fetch prescriptions
 const fetchPrescriptions = useCallback(async () => {
 try {
 const [activeRes, allRes] = await Promise.all([
 fetch(`/api/patients/${patientData.id}/prescriptions?active=true`, { credentials: 'include' }).catch(() => null),
 fetch(`/api/patients/${patientData.id}/prescriptions`, { credentials: 'include' }).catch(() => null),
 ])
 const [activeData, allData] = await Promise.all([
 activeRes?.ok ? activeRes.json() : null,
 allRes?.ok ? allRes.json() : null,
 ])
 const activeList = (activeData?.data ?? []).map(normalizePrescription)
 const allList = (allData?.data ?? []).map(normalizePrescription)
 setActivePrescriptions(activeList)
 setPrescriptionHistory(allList.filter((p: Prescription) => !p.isActive))
 } catch (error) {
 console.error('Failed to fetch prescriptions:', error)
 } finally {
 setLoadingPrescriptions(false)
 }
 }, [patientData.id])

 useEffect(() => { fetchPrescriptions() }, [fetchPrescriptions])

 // Fetch pill reminders from API
 const fetchReminders = useCallback(async () => {
 try {
 const userId = getUserId()
 if (!userId) return
 const res = await fetch(`/api/patients/${userId}/pill-reminders`, { credentials: 'include' })
 const data = await res.json()
 if (data.data) {
  
 setReminders(data.data.map((r: any) => ({
 id: r.id,
 medicineId: r.medicineId || r.id,
 medicineName: r.medicineName || 'Medicine',
 dosage: r.dosage || '1 tablet',
 times: r.times || ['08:00'],
 taken: r.taken || [false],
 nextDose: r.nextDose || 'Pending',
 frequency: r.frequency || 'Daily',
 })))
 }
 } catch { /* silent */ }
 }, [])

 // Fetch current orders
 const fetchOrders = useCallback(async () => {
 try {
 const userId = getUserId()
 if (!userId) return
 const res = await fetch('/api/bookings/unified?role=patient&type=pharmacy&limit=1', { credentials: 'include' })
 const data = await res.json()
 if (data.data?.[0]) {
 const order = data.data[0]
 setCurrentOrder({
 id: order.id,
 medicines: (order.items || []).map((i: { id: string; name: string; dosage: string; quantity: number; price: number }) => ({
 id: i.id, name: i.name, dosage: i.dosage || '', quantity: i.quantity || 1, price: i.price || 0, inStock: true,
 })),
 pharmacy: {
 name: order.pharmacyName || 'Pharmacy',
 address: order.pharmacyAddress || '',
 phone: '',
 rating: 4.5,
 deliveryTime: '2-4 hours',
 },
 totalAmount: order.totalAmount || 0,
 deliveryFee: 50,
 estimatedDelivery: 'Pending',
 paymentMethod: 'card',
 })
 }
 } catch { /* silent */ }
 }, [])

 useEffect(() => { fetchReminders() }, [fetchReminders])
 useEffect(() => { fetchOrders() }, [fetchOrders])

 const allPrescriptions = [
 ...activePrescriptions,
 ...prescriptionHistory,
 ]

 // Filter and sort prescriptions
 const filteredPrescriptions = allPrescriptions.filter(prescription => {
 const matchesSearch = 
 prescription.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
 prescription.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
 prescription.medicines.some(med => med.name.toLowerCase().includes(searchQuery.toLowerCase()))
 
 const matchesStatus = 
 filterStatus === 'all' || 
 (filterStatus === 'active' && prescription.isActive) ||
 (filterStatus === 'expired' && !prescription.isActive)

 return matchesSearch && matchesStatus
 }).sort((a, b) => {
 switch (sortBy) {
 case 'date':
 return new Date(b.date).getTime() - new Date(a.date).getTime()
 case 'doctor':
 return a.doctorName.localeCompare(b.doctorName)
 case 'medicine':
 return (a.medicines[0]?.name || '').localeCompare(b.medicines[0]?.name || '') || 0
 default:
 return 0
 }
 })

 const getDaysUntilRefill = (prescription: Prescription): number => {
 if (!prescription.nextRefill) return 0
 const refillDate = new Date(prescription.nextRefill)
 const today = new Date()
 const diffTime = refillDate.getTime() - today.getTime()
 return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
 }

 const getRefillUrgency = (prescription: Prescription): 'urgent' | 'soon' | 'normal' => {
 const days = getDaysUntilRefill(prescription)
 if (days <= 7) return 'urgent'
 if (days <= 14) return 'soon'
 return 'normal'
 }

 const toggleMedicineForOrder = (medicineId: string) => {
 setSelectedForOrder(prev => 
 prev.includes(medicineId) 
 ? prev.filter(id => id !== medicineId)
 : [...prev, medicineId]
 )
 }

 const sections = [
 { id: 'active', label: 'Active Prescriptions', icon: FaCheckCircle, color: 'green', count: activePrescriptions?.length },
 { id: 'reminders', label: 'Reminders', icon: FaBell, color: 'blue', count: reminders.length },
 { id: 'order', label: 'Order Medicines', icon: FaShoppingCart, color: 'purple' },
 { id: 'history', label: 'History', icon: FaHistory, color: 'orange', count: allPrescriptions.length }
 ]


 const renderActivePrescriptions = () => (
 <div className="space-y-4 sm:space-y-5 md:space-y-6">
 {/* Quick Actions - Grid responsive */}
 <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
 <button 
 onClick={() => setActiveTab('reminders')}
 className="bg-surface transition-all transform hover:scale-105 text-center"
 >
 <FaBell className="text-xl sm:text-2xl mx-auto mb-1 sm:mb-2" />
 <p className="font-semibold text-xs sm:text-sm md:text-base">Set Reminders</p>
 <p className="text-xs opacity-80 hidden sm:block">Never miss a dose</p>
 </button>

 <button 
 onClick={() => setActiveTab('order')}
 className="bg-surface transition-all transform hover:scale-105 text-center"
 >
 <FaShoppingCart className="text-xl sm:text-2xl mx-auto mb-1 sm:mb-2" />
 <p className="font-semibold text-xs sm:text-sm md:text-base">Order Medicines</p>
 <p className="text-xs opacity-80 hidden sm:block">Home delivery</p>
 </button>

 <Link href="/search/doctors" className="bg-surface transition-all transform hover:scale-105 text-center">
 <FaUserMd className="text-xl sm:text-2xl mx-auto mb-1 sm:mb-2" />
 <p className="font-semibold text-xs sm:text-sm md:text-base">Consult Doctor</p>
 <p className="text-xs opacity-80 hidden sm:block">Ask questions</p>
 </Link>

 <Link href="/patient/ai-assistant" className="bg-surface transition-all transform hover:scale-105 text-center block">
 <FaAllergies className="text-xl sm:text-2xl mx-auto mb-1 sm:mb-2" />
 <p className="font-semibold text-xs sm:text-sm md:text-base">Drug Interactions</p>
 <p className="text-xs opacity-80 hidden sm:block">Safety check</p>
 </Link>
 </div>

 {/* Refill Alerts */}
 {activePrescriptions && activePrescriptions.filter(p => getRefillUrgency(p) !== 'normal').length > 0 && (
 <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-orange-200">
 <h3 className="text-base sm:text-lg font-semibold text-orange-800 mb-3 sm:mb-4 flex items-center">
 <FaExclamationTriangle className="mr-2" />
 Refill Reminders
 </h3>
 <div className="space-y-2 sm:space-y-3">
 {activePrescriptions.filter(p => getRefillUrgency(p) !== 'normal').map((prescription) => {
 const urgency = getRefillUrgency(prescription)
 const days = getDaysUntilRefill(prescription)
 return (
 <div key={prescription.id} className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-l-4 ${
 urgency === 'urgent' ? 'bg-yellow-50 border-yellow-500' : 'bg-surface border-line'
 }`}>
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
 <div>
 <p className="font-medium text-fg text-sm sm:text-base">{prescription.medicines[0]?.name}</p>
 <p className={`text-xs sm:text-sm ${urgency === 'urgent' ? 'text-red-600' : 'text-yellow-600'}`}>
 Refill needed in {days} days  Next refill: {prescription.nextRefill}
 </p>
 </div>
 <Link href="/search/health-shop" className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-xs sm:text-sm inline-block">
 Refill Now
 </Link>
 </div>
 </div>
 )
 })}
 </div>
 </div>
 )}

 {/* Active Prescriptions List */}
 <div className="space-y-3 sm:space-y-4">
 {filteredPrescriptions.filter(p => p.isActive).map((prescription) => (
 <div key={prescription.id} className="bg-white/30 rounded-xl sm:rounded-2xl shadow-lg border border-line overflow-hidden hover:shadow-xl transition-all">
 <div className="p-4 sm:p-5 md:p-6">
 <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
 <div className="flex-1">
 <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
 <h3 className="text-base sm:text-lg font-semibold text-fg">Prescription #{prescription.id}</h3>
 <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-sky-50 text-green-800 rounded-full text-xs sm:text-sm font-medium">
 <FaCheckCircle className="inline mr-1" />
 Active
 </span>
 {getRefillUrgency(prescription) !== 'normal' && (
 <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${
 getRefillUrgency(prescription) === 'urgent' ? 'bg-sky-50 text-red-800' : 'bg-sky-50 text-yellow-800'
 }`}>
 <FaExclamationTriangle className="inline mr-1" />
 Refill {getRefillUrgency(prescription)}
 </span>
 )}
 </div>
 
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-soft">
 <div className="flex items-center gap-2">
 <FaUserMd className="text-blue-500" />
 <span>{prescription.doctorName}</span>
 </div>
 <div className="flex items-center gap-2">
 <FaCalendarAlt className="text-green-500" />
 <span>{new Date(prescription.date).toLocaleDateString()}</span>
 </div>
 <div className="flex items-center gap-2">
 <FaClock className="text-purple-500" />
 <span>{prescription.time}</span>
 </div>
 <div className="flex items-center gap-2">
 <FaSyncAlt className="text-orange-500" />
 <span>Next refill: {prescription.nextRefill}</span>
 </div>
 </div>
 </div>

 <div className="flex gap-2">
 <button
 onClick={() => setExpandedPrescription(
 expandedPrescription === prescription.id ? null : prescription.id
 )}
 className="px-3 sm:px-4 py-1.5 sm:py-2 bg-surface transition text-xs sm:text-sm"
 >
 <FaEye className="inline mr-1 sm:mr-2" />
 <span className="hidden sm:inline">{expandedPrescription === prescription.id ? 'Less' : 'Details'}</span>
 </button>
 
 <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-surface transition text-xs sm:text-sm">
 <FaShoppingCart className="inline mr-1 sm:mr-2" />
 <span className="hidden sm:inline">Reorder</span>
 </button>
 </div>
 </div>

 {/* Diagnosis */}
 <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-surface rounded-lg sm:rounded-xl">
 <h4 className="font-medium text-blue-800 mb-1 flex items-center text-sm sm:text-base">
 <FaStethoscope className="mr-2" />
 Diagnosis
 </h4>
 <p className="text-blue-700 text-xs sm:text-sm">{prescription.diagnosis}</p>
 </div>

 {/* Medicines Overview */}
 <div className="space-y-2 sm:space-y-3">
 <h4 className="font-medium text-fg flex items-center text-sm sm:text-base">
 <FaPills className="mr-2 text-green-500" />
 Medications ({prescription.medicines.length})
 </h4>
 <div className="grid gap-2 sm:gap-3">
 {prescription.medicines.map((medicine, index) => (
 <div key={index} className="bg-surface rounded-lg sm:rounded-xl p-3 sm:p-4 border border-line">
 <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
 <div className="flex-1">
 <h5 className="font-semibold text-fg mb-2 flex items-center text-sm sm:text-base">
 <FaCapsules className="mr-2 text-purple-500" />
 {medicine.name}
 </h5>
 
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
 <div className="space-y-1">
 <p className="text-soft">
 <span className="font-medium">Dosage:</span> {medicine.dosage}
 </p>
 <p className="text-soft">
 <span className="font-medium">Frequency:</span> {medicine.frequency}
 </p>
 <p className="text-soft">
 <span className="font-medium">Duration:</span> {medicine.duration}
 </p>
 </div>
 <div className="space-y-1">
 <p className="text-soft">
 <span className="font-medium">Quantity:</span> {medicine.quantity}
 </p>
 <p className="text-soft">
 <span className="font-medium">Take:</span> {medicine.beforeFood ? 'Before food' : 'After food'}
 </p>
 </div>
 </div>

 <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-surface rounded-lg">
 <p className="text-xs sm:text-sm text-yellow-800">
 <FaInfoCircle className="inline mr-1 sm:mr-2" />
 <strong>Instructions:</strong> {medicine.instructions}
 </p>
 </div>
 </div>

 <div className="flex sm:flex-col gap-2">
 <button 
 onClick={() => toggleMedicineForOrder(medicine.name)}
 className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition ${
 selectedForOrder.includes(medicine.name)
 ? 'bg-sky-50 text-green-700'
 : 'bg-sky-50 text-soft '
 }`}
 >
 <FaShoppingCart className="inline mr-1" />
 {selectedForOrder.includes(medicine.name) ? 'Added' : 'Add'}
 </button>
 
 <button className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-sky-50 transition text-xs sm:text-sm">
 <FaBell className="inline mr-1" />
 Remind
 </button>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Expanded Details */}
 {expandedPrescription === prescription.id && (
 <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-line space-y-3 sm:space-y-4">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
 <div className="bg-surface rounded-lg sm:rounded-xl p-3 sm:p-4">
 <h5 className="font-semibold text-fg mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
 <FaUser className="mr-2 text-blue-500" />
 Doctor Information
 </h5>
 <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
 <p><strong>Name:</strong> {prescription.doctorName}</p>
 <p><strong>Doctor ID:</strong> {prescription.doctorId}</p>
 <p><strong>Prescribed:</strong> {new Date(prescription.date).toLocaleDateString()} at {prescription.time}</p>
 </div>
 </div>

 <div className="bg-surface rounded-lg sm:rounded-xl p-3 sm:p-4">
 <h5 className="font-semibold text-green-800 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
 <FaCalendarAlt className="mr-2" />
 Prescription Timeline
 </h5>
 <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
 <p><strong>Issued:</strong> {new Date(prescription.date).toLocaleDateString()}</p>
 <p><strong>Next Refill:</strong> {prescription.nextRefill}</p>
 <p><strong>Days Until Refill:</strong> {getDaysUntilRefill(prescription)} days</p>
 </div>
 </div>
 </div>

 {prescription.notes && (
 <div className="bg-surface rounded-lg sm:rounded-xl p-3 sm:p-4">
 <h5 className="font-semibold text-blue-800 mb-2 flex items-center text-sm sm:text-base">
 <FaInfoCircle className="mr-2" />
 Additional Notes
 </h5>
 <p className="text-blue-700 text-xs sm:text-sm">{prescription.notes}</p>
 </div>
 )}

 <div className="flex flex-wrap gap-2 sm:gap-3">
 <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
 <FaDownload />
 Download
 </button>
 <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
 <FaPrint />
 Print
 </button>
 <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
 <FaUserMd />
 Contact
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 ))}
 </div>

 {filteredPrescriptions.filter(p => p.isActive).length === 0 && (
 <div className="bg-surface rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center shadow-lg border border-line">
 <FaPills className="text-faint text-3xl sm:text-4xl lg:text-5xl mx-auto mb-3 sm:mb-4" />
 <h3 className="text-lg sm:text-xl font-semibold text-soft mb-2">No Active Prescriptions</h3>
 <p className="text-soft mb-4 sm:mb-6 text-sm sm:text-base">You don&apos;t have any active prescriptions at the moment</p>
 <button className="bg-surface transition-all text-sm sm:text-base">
 Consult a Doctor
 </button>
 </div>
 )}
 </div>
 )

 const renderReminders = () => (
 <div className="space-y-4 sm:space-y-5 md:space-y-6">
 {/* Today's Medication Schedule */}
 <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-blue-200">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
 <h3 className="text-base sm:text-lg font-semibold text-fg flex items-center">
 <FaBell className="mr-2 text-blue-500" />
 Today&apos;s Medication Schedule
 </h3>
 <div className="flex items-center gap-2">
 <span className="text-xs sm:text-sm text-soft">Reminders</span>
 <button
 onClick={() => setShowReminders(!showReminders)}
 className="relative inline-flex h-5 w-10 sm:h-6 sm:w-11 items-center rounded-full bg-line transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
 >
 <span className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-surface shadow-lg transition-transform ${showReminders ? 'translate-x-5 sm:translate-x-6 bg-blue-500' : 'translate-x-1'}`} />
 </button>
 </div>
 </div>

 <div className="space-y-3 sm:space-y-4">
 {reminders.map((reminder) => (
 <div key={reminder.id} className="bg-white/70 border border-line rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-md transition">
 <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
 <div className="flex items-start gap-3 sm:gap-4">
 <div className="w-10 h-10 sm:w-12 sm:h-12 bg-sky-50 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
 <FaPills className="text-blue-600 text-base sm:text-xl" />
 </div>
 <div className="flex-1">
 <h4 className="font-semibold text-fg mb-1 text-sm sm:text-base">{reminder.medicineName}</h4>
 <p className="text-xs sm:text-sm text-soft mb-2">{reminder.dosage}  {reminder.frequency}</p>
 
 <div className="flex flex-wrap gap-2 sm:gap-3">
 {reminder.times.map((time, index) => (
 <div key={index} className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-lg ${
 reminder.taken[index] 
 ? 'bg-sky-50 text-green-800' 
 : 'bg-sky-50 text-yellow-800'
 }`}>
 <FaClock className="text-xs sm:text-sm" />
 <span className="text-xs sm:text-sm font-medium">{time}</span>
 {reminder.taken[index] ? (
 <FaCheckCircle className="text-green-600 text-xs sm:text-sm" />
 ) : (
 <FaExclamationCircle className="text-yellow-600 text-xs sm:text-sm" />
 )}
 </div>
 ))}
 </div>

 <p className="text-xs text-soft mt-2">
 Next dose: {reminder.nextDose}
 </p>
 </div>
 </div>

 <div className="flex sm:flex-col gap-2">
 <button
   onClick={() => toast.success(`${reminder.medicineName} marked as taken`)}
   className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-sky-50 hover:bg-green-50 text-green-700 rounded-lg transition text-xs sm:text-sm">
 <FaCheckCircle className="inline mr-1" />
 Mark Taken
 </button>
 <button className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-sky-50 transition text-xs sm:text-sm">
 <FaEdit className="inline mr-1" />
 Edit
 </button>
 </div>
 </div>
 </div>
 ))}
 </div>

 <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-blue-200">
 <button className="w-full p-2.5 sm:p-3 border-2 border-dashed border-line rounded-lg sm:rounded-xl text-soft hover:border-blue-400 hover:text-blue-600 transition text-sm sm:text-base">
 <FaPlus className="inline mr-2" />
 Set New Medication Reminder
 </button>
 </div>
 </div>

 {/* Medication Adherence */}
 <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-green-200">
 <h3 className="text-base sm:text-lg font-semibold text-fg mb-4 sm:mb-6 flex items-center">
 <FaClipboardCheck className="mr-2 text-green-500" />
 Medication Adherence
 </h3>
 
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
 <div className="text-center">
 <div className="w-16 h-16 sm:w-20 sm:h-20 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
 <span className="text-xl sm:text-2xl font-bold text-green-600">87%</span>
 </div>
 <p className="font-semibold text-fg text-sm sm:text-base">This Week</p>
 <p className="text-xs sm:text-sm text-soft">6 of 7 days on track</p>
 </div>
 
 <div className="text-center">
 <div className="w-16 h-16 sm:w-20 sm:h-20 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
 <span className="text-xl sm:text-2xl font-bold text-blue-600">92%</span>
 </div>
 <p className="font-semibold text-fg text-sm sm:text-base">This Month</p>
 <p className="text-xs sm:text-sm text-soft">28 of 30 days completed</p>
 </div>
 
 <div className="text-center">
 <div className="w-16 h-16 sm:w-20 sm:h-20 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
 <FaStar className="text-purple-600 text-xl sm:text-2xl" />
 </div>
 <p className="font-semibold text-fg text-sm sm:text-base">Overall Rating</p>
 <p className="text-xs sm:text-sm text-soft">Excellent adherence</p>
 </div>
 </div>

 <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-sky-50 rounded-lg sm:rounded-xl">
 <h4 className="font-semibold text-green-800 mb-2 text-sm sm:text-base">Tips for Better Adherence</h4>
 <ul className="text-xs sm:text-sm text-green-700 space-y-1">
 <li> Set consistent daily routines</li>
 <li> Use pill organizers or reminder apps</li>
 <li> Keep medications visible and accessible</li>
 <li> Track your progress regularly</li>
 </ul>
 </div>
 </div>
 </div>
 )

 const renderOrderMedicines = () => (
 <div className="space-y-4 sm:space-y-5 md:space-y-6">
 {/* Order Summary */}
 {selectedForOrder.length > 0 && (
 <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-green-200">
 <h3 className="text-base sm:text-lg font-semibold text-green-800 mb-3 sm:mb-4 flex items-center">
 <FaShoppingCart className="mr-2" />
 Your Medicine Cart ({selectedForOrder.length} items)
 </h3>
 
 <div className="space-y-2 sm:space-y-3">
 {selectedForOrder.map((medicineName, index) => (
 <div key={index} className="flex items-center justify-between p-2.5 sm:p-3 bg-sky-50 rounded-lg">
 <div className="flex items-center gap-2 sm:gap-3">
 <FaPills className="text-green-600 text-sm sm:text-base" />
 <span className="font-medium text-sm sm:text-base">{medicineName}</span>
 </div>
 <button 
 onClick={() => toggleMedicineForOrder(medicineName)}
 className="text-red-500 hover:text-red-700 text-sm sm:text-base"
 >
 <FaTimesCircle />
 </button>
 </div>
 ))}
 </div>
 
 <button className="w-full mt-3 sm:mt-4 bg-green-500 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:bg-green-600 transition text-sm sm:text-base">
 Proceed to Order
 </button>
 </div>
 )}

 {/* Current Order */}
 {currentOrder && (
 <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-blue-200">
 <h3 className="text-base sm:text-lg font-semibold text-fg mb-4 sm:mb-6 flex items-center">
 <FaTruck className="mr-2 text-blue-500" />
 Current Order
 </h3>

 <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
 {currentOrder.medicines.map((medicine) => (
 <div key={medicine.id} className="flex items-center justify-between p-3 sm:p-4 bg-white/70 border border-line rounded-lg sm:rounded-xl">
 <div className="flex items-center gap-3 sm:gap-4">
 <div className="w-10 h-10 sm:w-12 sm:h-12 bg-sky-50 rounded-lg flex items-center justify-center">
 <FaPills className="text-blue-600 text-sm sm:text-base" />
 </div>
 <div>
 <h4 className="font-semibold text-fg text-sm sm:text-base">{medicine.name}</h4>
 <p className="text-xs sm:text-sm text-soft">{medicine.dosage}</p>
 <div className="flex items-center gap-2 mt-1">
 <span className={`px-2 py-0.5 rounded-full text-xs ${
 medicine.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
 }`}>
 {medicine.inStock ? 'In Stock' : 'Out of Stock'}
 </span>
 </div>
 </div>
 </div>
 <div className="text-right">
 <p className="font-bold text-base sm:text-lg">Rs {medicine.price}</p>
 <p className="text-xs sm:text-sm text-soft">Qty: {medicine.quantity}</p>
 </div>
 </div>
 ))}
 </div>

 {/* Pharmacy Info */}
 <div className="bg-sky-50 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
 <div className="flex items-start justify-between">
 <div>
 <h4 className="font-semibold text-blue-900 mb-2 flex items-center text-sm sm:text-base">
 <FaMapMarkerAlt className="mr-2" />
 {currentOrder.pharmacy.name}
 </h4>
 <div className="text-xs sm:text-sm text-blue-800 space-y-1">
 <p>{currentOrder.pharmacy.address}</p>
 <p className="flex items-center gap-2">
 <FaPhone />
 {currentOrder.pharmacy.phone}
 </p>
 <div className="flex flex-wrap gap-3 sm:gap-4">
 <div className="flex items-center gap-1">
 <FaStar className="text-yellow-500" />
 <span>{currentOrder.pharmacy.rating}</span>
 </div>
 <div className="flex items-center gap-1">
 <FaClock />
 <span>Delivery: {currentOrder.pharmacy.deliveryTime}</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Order Summary */}
 <div className="border-t pt-3 sm:pt-4">
 <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
 <div className="flex justify-between">
 <span>Subtotal:</span>
 <span>Rs {currentOrder.totalAmount}</span>
 </div>
 <div className="flex justify-between">
 <span>Delivery Fee:</span>
 <span>Rs {currentOrder.deliveryFee}</span>
 </div>
 <div className="flex justify-between font-bold text-base sm:text-lg border-t pt-2">
 <span>Total:</span>
 <span>Rs {currentOrder.totalAmount + currentOrder.deliveryFee}</span>
 </div>
 </div>

 <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-surface rounded-lg">
 <p className="text-xs sm:text-sm text-green-800">
 <FaTruck className="inline mr-2" />
 Estimated delivery: {currentOrder.estimatedDelivery}
 </p>
 </div>

 <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
 <Link
   href="/search/health-shop"
   className="block w-full text-center bg-green-500 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:bg-green-600 transition text-sm sm:text-base">
 Confirm Order
 </Link>
 <Link
   href="/patient/insurance"
   className="block w-full text-center bg-blue-500 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:bg-blue-600 transition text-sm sm:text-base">
 Pay with Insurance
 </Link>
 </div>
 </div>
 </div>
 )}
 </div>
 )

 const renderHistory = () => (
 <div className="space-y-4 sm:space-y-5 md:space-y-6">
 {/* History Stats */}
 <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
 <div className="bg-surface rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-lg border border-blue-100 text-center">
 <div className="w-10 h-10 sm:w-12 sm:h-12 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
 <FaHistory className="text-blue-600 text-base sm:text-xl" />
 </div>
 <p className="text-xl sm:text-2xl font-bold text-blue-600">{allPrescriptions.length}</p>
 <p className="text-xs sm:text-sm text-soft">Total Prescriptions</p>
 </div>

 <div className="bg-surface rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-lg border border-green-100 text-center">
 <div className="w-10 h-10 sm:w-12 sm:h-12 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
 <FaCheckCircle className="text-green-600 text-base sm:text-xl" />
 </div>
 <p className="text-xl sm:text-2xl font-bold text-green-600">
 {allPrescriptions.filter(p => p.isActive).length}
 </p>
 <p className="text-xs sm:text-sm text-soft">Currently Active</p>
 </div>

 <div className="bg-surface rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-lg border border-purple-100 text-center">
 <div className="w-10 h-10 sm:w-12 sm:h-12 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
 <FaUserMd className="text-purple-600 text-base sm:text-xl" />
 </div>
 <p className="text-xl sm:text-2xl font-bold text-purple-600">
 {new Set(allPrescriptions.map(p => p.doctorName)).size}
 </p>
 <p className="text-xs sm:text-sm text-soft">Different Doctors</p>
 </div>

 <div className="bg-surface rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-lg border border-orange-100 text-center">
 <div className="w-10 h-10 sm:w-12 sm:h-12 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
 <FaPills className="text-orange-600 text-base sm:text-xl" />
 </div>
 <p className="text-xl sm:text-2xl font-bold text-orange-600">
 {allPrescriptions.reduce((sum, p) => sum + p.medicines.length, 0)}
 </p>
 <p className="text-xs sm:text-sm text-soft">Total Medicines</p>
 </div>
 </div>

 {/* All Prescriptions */}
 <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-line">
 <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
 <h3 className="text-base sm:text-lg font-semibold text-fg">Prescription History</h3>
 
 <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
 <div className="relative">
 <FaSearch className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-faint text-sm" />
 <input
 type="text"
 placeholder="Search prescriptions..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 border border-line rounded-lg focus:outline-none focus:border-blue-500 text-xs sm:text-sm w-full sm:w-auto"
 />
 </div>
 
 <select
 value={sortBy}
 onChange={(e) => setSortBy(e.target.value as 'date' | 'doctor' | 'medicine')}
 className="px-3 sm:px-4 py-1.5 sm:py-2 border border-line rounded-lg focus:outline-none focus:border-blue-500 text-xs sm:text-sm"
 >
 <option value="date">Sort by Date</option>
 <option value="doctor">Sort by Doctor</option>
 <option value="medicine">Sort by Medicine</option>
 </select>
 
 <select
 value={filterStatus}
 onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'expired')}
 className="px-3 sm:px-4 py-1.5 sm:py-2 border border-line rounded-lg focus:outline-none focus:border-blue-500 text-xs sm:text-sm"
 >
 <option value="all">All Status</option>
 <option value="active">Active Only</option>
 <option value="expired">Expired Only</option>
 </select>
 </div>
 </div>

 <div className="space-y-3 sm:space-y-4">
 {filteredPrescriptions.map((prescription) => (
 <div key={prescription.id} className="bg-white/70 border border-line rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-md transition">
 <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
 <div className="flex-1">
 <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
 <h4 className="font-semibold text-fg text-sm sm:text-base">Prescription #{prescription.id}</h4>
 <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
 prescription.isActive 
 ? 'bg-sky-50 text-green-800' 
 : 'bg-sky-50 text-fg'
 }`}>
 {prescription.isActive ? 'Active' : 'Completed'}
 </span>
 </div>
 
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-3">
 <div className="space-y-1">
 <p className="text-xs sm:text-sm text-soft">
 <strong>Doctor:</strong> {prescription.doctorName}
 </p>
 <p className="text-xs sm:text-sm text-soft">
 <strong>Date:</strong> {new Date(prescription.date).toLocaleDateString()}
 </p>
 </div>
 <div className="space-y-1">
 <p className="text-xs sm:text-sm text-soft">
 <strong>Diagnosis:</strong> {prescription.diagnosis}
 </p>
 <p className="text-xs sm:text-sm text-soft">
 <strong>Medicines:</strong> {prescription.medicines.length}
 </p>
 </div>
 </div>

 <div className="flex flex-wrap gap-1.5 sm:gap-2">
 {prescription.medicines.slice(0, 3).map((medicine, index) => (
 <span key={index} className="px-2 sm:px-3 py-0.5 sm:py-1 bg-surface text-blue-700 rounded-full text-xs">
 {medicine.name}
 </span>
 ))}
 {prescription.medicines.length > 3 && (
 <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-sky-50 text-soft rounded-full text-xs">
 +{prescription.medicines.length - 3} more
 </span>
 )}
 </div>
 </div>

 <div className="flex gap-2">
 <button className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-surface transition text-xs sm:text-sm">
 <FaEye className="inline mr-1" />
 View
 </button>
 <button className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-surface transition text-xs sm:text-sm">
 <FaDownload className="inline mr-1" />
 Download
 </button>
 </div>
 </div>
 </div>
 ))}
 </div>

 {filteredPrescriptions.length === 0 && (
 <div className="text-center py-6 sm:py-8">
 <FaSearch className="text-faint text-2xl sm:text-3xl mx-auto mb-3" />
 <p className="text-soft text-sm sm:text-base">No prescriptions found matching your criteria</p>
 </div>
 )}
 </div>
 </div>
 )

 if (loadingPrescriptions) {
 return (
 <div className="flex items-center justify-center py-12">
 <FaPills className="animate-pulse text-purple-500 text-2xl mr-3" />
 <span className="text-soft">Loading prescriptions...</span>
 </div>
 )
 }

 if (allPrescriptions.length === 0) {
 return (
 <div className="bg-surface rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg text-center border border-purple-200">
 <div className="bg-sky-50 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
 <FaPills className="text-purple-500 text-2xl sm:text-3xl" />
 </div>
 <h3 className="text-lg sm:text-xl font-semibold text-soft mb-2 sm:mb-3">No Prescriptions Found</h3>
 <p className="text-soft mb-4 sm:mb-6 text-sm sm:text-base">You don&apos;t have any prescriptions yet. Consult with a doctor to get started.</p>
 <button className="bg-surface transition-all transform hover:scale-105 flex items-center gap-2 mx-auto text-sm sm:text-base">
 <FaUserMd />
 Consult a Doctor
 </button>
 </div>
 )
 }

 return (
 <div className="space-y-4 sm:space-y-5 md:space-y-6">
 {/* Header */}
 <div className="bg-brand-navy rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white">
 <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
 <div>
 <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 flex items-center">
 <FaPills className="mr-2 sm:mr-3" />
 Prescription Management
 </h2>
 <p className="opacity-90 text-xs sm:text-sm md:text-base">Manage your medications, set reminders, and order refills</p>
 </div>
 <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 text-center">
 <div className="bg-sky-100/20 backdrop-blur-sm rounded-lg p-2 sm:p-3">
 <p className="text-lg sm:text-xl md:text-2xl font-bold">{activePrescriptions?.length || 0}</p>
 <p className="text-xs opacity-90">Active</p>
 </div>
 <div className="bg-sky-100/20 backdrop-blur-sm rounded-lg p-2 sm:p-3">
 <p className="text-lg sm:text-xl md:text-2xl font-bold">{allPrescriptions.length}</p>
 <p className="text-xs opacity-90">Total</p>
 </div>
 <div className="bg-sky-100/20 backdrop-blur-sm rounded-lg p-2 sm:p-3">
 <p className="text-lg sm:text-xl md:text-2xl font-bold">{reminders.length}</p>
 <p className="text-xs opacity-90">Reminders</p>
 </div>
 </div>
 </div>
 </div>

 {/* Mobile Accordion / Desktop Tabs */}
 <div className="bg-surface rounded-xl sm:rounded-2xl shadow-lg border border-line overflow-hidden">
 {/* Desktop Tab Navigation */}
 <div className="hidden sm:block border-b border-line">
 <div className="flex overflow-x-auto">
 {sections.map((tab) => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id as typeof activeTab)}
 className={`flex-shrink-0 px-3 md:px-6 py-3 md:py-4 text-center font-medium transition-all flex items-center gap-1.5 md:gap-2 ${
 activeTab === tab.id
 ? `text-${tab.color}-600 border-b-2 border-current from-${tab.color}-50 to-transparent`
 : 'text-soft hover:text-fg hover:bg-subtle'
 }`}
 title={tab.label}
 >
 <tab.icon className="text-base md:text-base" />
 <span className="hidden md:inline whitespace-nowrap text-sm md:text-base">{tab.label}</span>
 {tab.count !== undefined && tab.count > 0 && (
 <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
 {tab.count}
 </span>
 )}
 </button>
 ))}
 </div>
 </div>

 {/* Content */}
 <div className="p-4 md:p-6 pb-20 sm:pb-0">
 {activeTab === 'active' && renderActivePrescriptions()}
 {activeTab === 'reminders' && renderReminders()}
 {activeTab === 'order' && renderOrderMedicines()}
 {activeTab === 'history' && renderHistory()}
 </div>
 </div>

 {/* Fixed Bottom Tab Bar - Mobile */}
 <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-line flex justify-around items-center py-2 px-1 z-50 shadow-lg">
 {sections.map((section) => {
 const Icon = section.icon
 const isActive = activeTab === section.id
 return (
 <button key={section.id} onClick={() => setActiveTab(section.id as typeof activeTab)}
 className={`flex flex-col items-center justify-center p-1 min-w-[40px] ${isActive ? 'text-blue-600' : 'text-faint'}`}>
 <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-faint'}`} />
 {isActive && <div className="w-1 h-1 bg-blue-600 rounded-full mt-1" />}
 </button>
 )
 })}
 </div>
 </div>
 )
}

export default PrescriptionManagement