"use client"

import { useState, useEffect, useCallback } from "react"
import { getUserId } from '@/hooks/useUser'
import Link from "next/link"
import { 
 FaPrescriptionBottle,
 FaFileDownload,
 FaPrint,
 FaShare,
 FaEye,
 FaSearch,
 FaFilter,
 FaClock,
 FaCheckCircle,
 FaExclamationTriangle,
 FaArrowLeft,
 FaCalendarAlt,
 FaPills,
 FaShoppingCart,
 FaHistory,
 FaBell
} from "react-icons/fa"

interface Medication {
 name: string;
 dosage: string;
 frequency: string;
 duration: string;
 instructions: string;
 quantity: number;
}

interface Prescription {
 id: string;
 doctor: {
 name: string;
 specialty: string;
 avatar: string;
 regNumber: string;
 };
 date: string;
 diagnosis: string;
 medications: Medication[];
 status: "active" | "expired" | "completed";
 validUntil: string;
 refillsRemaining: number;
 notes: string;
}

 
function mapApiPrescription(p: any): Prescription {
 const doc = p.doctor
 const docUser = doc?.user
 return {
 id: p.id,
 doctor: {
 name: docUser ? `Dr. ${docUser.firstName} ${docUser.lastName}` : 'Unknown',
 specialty: '',
 avatar: '👨‍⚕️',
 regNumber: '',
 },
 date: new Date(p.date).toISOString().split('T')[0],
 diagnosis: p.diagnosis || '',
 medications: (p.medicines || []).map((m: { dosage: string; frequency: string; duration: string; instructions: string; medicine?: { name: string } }) => ({
 name: m.medicine?.name || 'Medicine',
 dosage: m.dosage || '',
 frequency: m.frequency || '',
 duration: m.duration || '',
 instructions: m.instructions || '',
 quantity: 0,
 })),
 status: p.isActive ? 'active' : 'completed',
 validUntil: p.nextRefill ? new Date(p.nextRefill).toISOString().split('T')[0] : '',
 refillsRemaining: 0,
 notes: p.notes || '',
 }
}

export default function PrescriptionManagementPage() {
 const [prescriptions, setPrescriptions] = useState<Prescription[]>([])

 const fetchPrescriptions = useCallback(async () => {
 const userId = getUserId()
 if (!userId) return
 try {
 const res = await fetch(`/api/patients/${userId}/prescriptions?limit=50`, { credentials: 'include' })
 const data = await res.json()
 if (data.data) {
 setPrescriptions(data.data.map(mapApiPrescription))
 }
 } catch { /* silent */ }
 }, [])

 useEffect(() => { fetchPrescriptions() }, [fetchPrescriptions])
 const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
 const [filterStatus, setFilterStatus] = useState("all")
 const [searchQuery, setSearchQuery] = useState("")
 const [showRefillModal, setShowRefillModal] = useState(false)
 const [selectedRefillPrescription, setSelectedRefillPrescription] = useState<Prescription | null>(null)

 const getStatusColor = (status: string) => {
 switch (status) {
 case "active": return "bg-green-100 text-green-800"
 case "expired": return "bg-red-100 text-red-800"
 case "completed": return "bg-gray-100 text-gray-800"
 default: return "bg-gray-100 text-gray-800"
 }
 }

 const getStatusIcon = (status: string) => {
 switch (status) {
 case "active": return <FaCheckCircle className="text-green-500" />
 case "expired": return <FaExclamationTriangle className="text-red-500" />
 case "completed": return <FaClock className="text-gray-500" />
 default: return null
 }
 }

 const filteredPrescriptions = prescriptions.filter(rx => {
 const matchesStatus = filterStatus === "all" || rx.status === filterStatus
 const matchesSearch = rx.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
 rx.doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
 rx.medications.some(med => med.name.toLowerCase().includes(searchQuery.toLowerCase()))
 return matchesStatus && matchesSearch
 })

 const handleRefillRequest = (prescription: Prescription) => {
 setSelectedRefillPrescription(prescription)
 setShowRefillModal(true)
 }

 const confirmRefill = () => {
 setShowRefillModal(false)
 setSelectedRefillPrescription(null)
 }

 return (
 <div className="min-h-screen bg-gray-50">
 {/* Header */}
 <div className="bg-white shadow-sm border-b">
 <div className="container mx-auto px-4 py-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <Link href="/patient" className="text-gray-600 hover:text-primary-blue">
 <FaArrowLeft className="text-xl" />
 </Link>
 <div>
 <h1 className="text-2xl font-bold text-gray-900">My Prescriptions</h1>
 <p className="text-gray-600">Manage and refill your prescriptions</p>
 </div>
 </div>
 <div className="flex items-center gap-4">
 <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2">
 <FaHistory />
 History
 </button>
 <Link href="/medicines" className="btn-gradient px-6 py-2 flex items-center gap-2">
 <FaShoppingCart />
 Order Medicines
 </Link>
 </div>
 </div>
 </div>
 </div>

 <div className="container mx-auto px-4 py-8">
 {/* Summary Cards */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
 <div className="bg-white rounded-2xl p-6 shadow-lg">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-gray-600 text-sm">Active Prescriptions</p>
 <p className="text-2xl font-bold text-green-600">
 {prescriptions.filter(rx => rx.status === "active").length}
 </p>
 </div>
 <FaPrescriptionBottle className="text-green-500 text-2xl" />
 </div>
 </div>
 
 <div className="bg-white rounded-2xl p-6 shadow-lg">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-gray-600 text-sm">Refills Available</p>
 <p className="text-2xl font-bold text-blue-600">
 {prescriptions.reduce((sum, rx) => sum + rx.refillsRemaining, 0)}
 </p>
 </div>
 <FaPills className="text-blue-500 text-2xl" />
 </div>
 </div>
 
 <div className="bg-white rounded-2xl p-6 shadow-lg">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-gray-600 text-sm">Expiring Soon</p>
 <p className="text-2xl font-bold text-yellow-600">1</p>
 </div>
 <FaExclamationTriangle className="text-yellow-500 text-2xl" />
 </div>
 </div>
 
 <div className="bg-white rounded-2xl p-6 shadow-lg">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-gray-600 text-sm">Total Medications</p>
 <p className="text-2xl font-bold text-purple-600">
 {prescriptions.reduce((sum, rx) => sum + rx.medications.length, 0)}
 </p>
 </div>
 <FaPills className="text-purple-500 text-2xl" />
 </div>
 </div>
 </div>

 {/* Filters and Search */}
 <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
 <div className="flex flex-col md:flex-row gap-4">
 <div className="flex-1">
 <div className="relative">
 <input
 type="text"
 placeholder="Search prescriptions, medications, or doctors..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full px-4 py-3 pl-10 border rounded-lg focus:outline-none focus:border-primary-blue"
 />
 <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
 </div>
 </div>
 <select
 value={filterStatus}
 onChange={(e) => setFilterStatus(e.target.value)}
 className="px-4 py-3 border rounded-lg focus:outline-none focus:border-primary-blue"
 >
 <option value="all">All Status</option>
 <option value="active">Active</option>
 <option value="expired">Expired</option>
 <option value="completed">Completed</option>
 </select>
 <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2">
 <FaFilter />
 More Filters
 </button>
 </div>
 </div>

 {/* Prescriptions List */}
 <div className="space-y-6">
 {filteredPrescriptions.map((prescription) => (
 <div key={prescription.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
 <div className="p-6">
 <div className="flex items-start justify-between mb-4">
 <div className="flex items-start gap-4">
 <div className="text-3xl">{prescription.doctor.avatar}</div>
 <div>
 <div className="flex items-center gap-3 mb-1">
 <h3 className="text-lg font-semibold text-gray-900">
 Prescription #{prescription.id}
 </h3>
 <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(prescription.status)}`}>
 {getStatusIcon(prescription.status)}
 <span className="ml-1">{prescription.status}</span>
 </span>
 </div>
 <p className="text-gray-600">
 {prescription.doctor.name} • {prescription.doctor.specialty}
 </p>
 <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
 <div className="flex items-center gap-1">
 <FaCalendarAlt />
 <span>Prescribed: {prescription.date}</span>
 </div>
 <div className="flex items-center gap-1">
 <FaClock />
 <span>Valid until: {prescription.validUntil}</span>
 </div>
 </div>
 </div>
 </div>
 
 <div className="flex items-center gap-2">
 <button className="p-2 text-gray-600 hover:text-primary-blue">
 <FaEye />
 </button>
 <button className="p-2 text-gray-600 hover:text-primary-blue">
 <FaFileDownload />
 </button>
 <button className="p-2 text-gray-600 hover:text-primary-blue">
 <FaPrint />
 </button>
 <button className="p-2 text-gray-600 hover:text-primary-blue">
 <FaShare />
 </button>
 </div>
 </div>

 {/* Diagnosis */}
 <div className="mb-4">
 <p className="text-sm text-gray-600">Diagnosis</p>
 <p className="font-medium text-gray-900">{prescription.diagnosis}</p>
 </div>

 {/* Medications */}
 <div className="mb-4">
 <h4 className="font-semibold text-gray-900 mb-3">Medications</h4>
 <div className="space-y-3">
 {prescription.medications.map((med, index) => (
 <div key={index} className="bg-gray-50 rounded-lg p-4">
 <div className="flex items-start justify-between">
 <div className="flex items-start gap-3">
 <FaPills className="text-primary-blue mt-1" />
 <div>
 <h5 className="font-medium text-gray-900">
 {med.name} {med.dosage}
 </h5>
 <p className="text-sm text-gray-600">
 {med.frequency} • {med.duration} • Qty: {med.quantity}
 </p>
 <p className="text-sm text-gray-500 mt-1">
 Instructions: {med.instructions}
 </p>
 </div>
 </div>
 {prescription.status === "active" && (
 <Link
 href="/medicines"
 className="px-3 py-1 bg-primary-blue text-white rounded-lg text-sm hover:bg-blue-600"
 >
 Order
 </Link>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Notes */}
 {prescription.notes && (
 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
 <p className="text-sm text-blue-800">
 <strong>Doctor Notes:</strong> {prescription.notes}
 </p>
 </div>
 )}

 {/* Actions */}
 <div className="flex items-center justify-between pt-4 border-t">
 <div className="flex items-center gap-2 text-sm text-gray-600">
 <FaBell />
 <span>Refills remaining: {prescription.refillsRemaining}</span>
 </div>
 
 <div className="flex gap-3">
 {prescription.status === "active" && prescription.refillsRemaining > 0 && (
 <button
 onClick={() => handleRefillRequest(prescription)}
 className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
 >
 Request Refill
 </button>
 )}
 <button
 onClick={() => setSelectedPrescription(prescription)}
 className="px-4 py-2 border border-primary-blue text-primary-blue rounded-lg hover:bg-blue-50"
 >
 View Details
 </button>
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Prescription Detail Modal */}
 {selectedPrescription && (
 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
 <div className="flex items-center justify-between mb-6">
 <h2 className="text-xl font-bold">Prescription Details</h2>
 <button
 onClick={() => setSelectedPrescription(null)}
 className="text-gray-500 hover:text-gray-700 text-2xl"
 >
 ×
 </button>
 </div>
 
 <div className="space-y-6">
 {/* Doctor Info */}
 <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
 <div className="text-4xl">{selectedPrescription.doctor.avatar}</div>
 <div>
 <h3 className="font-semibold">{selectedPrescription.doctor.name}</h3>
 <p className="text-gray-600">{selectedPrescription.doctor.specialty}</p>
 <p className="text-sm text-gray-500">Reg. No: {selectedPrescription.doctor.regNumber}</p>
 </div>
 </div>

 {/* Prescription Info */}
 <div>
 <h3 className="font-semibold mb-3">Prescription Information</h3>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <p className="text-sm text-gray-600">Prescription ID</p>
 <p className="font-medium">{selectedPrescription.id}</p>
 </div>
 <div>
 <p className="text-sm text-gray-600">Date Issued</p>
 <p className="font-medium">{selectedPrescription.date}</p>
 </div>
 <div>
 <p className="text-sm text-gray-600">Valid Until</p>
 <p className="font-medium">{selectedPrescription.validUntil}</p>
 </div>
 <div>
 <p className="text-sm text-gray-600">Status</p>
 <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPrescription.status)}`}>
 {selectedPrescription.status}
 </span>
 </div>
 </div>
 </div>

 {/* Actions */}
 <div className="flex gap-3">
 <button className="flex-1 btn-gradient py-2 flex items-center justify-center gap-2">
 <FaFileDownload />
 Download PDF
 </button>
 <button className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2">
 <FaPrint />
 Print
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Refill Request Modal */}
 {showRefillModal && selectedRefillPrescription && (
 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-2xl p-6 max-w-md w-full">
 <h3 className="text-lg font-semibold mb-4">Request Prescription Refill</h3>
 <p className="text-gray-600 mb-4">
 You are requesting a refill for prescription #{selectedRefillPrescription.id}
 </p>
 <div className="bg-gray-50 rounded-lg p-4 mb-6">
 <p className="text-sm text-gray-600">Doctor</p>
 <p className="font-medium">{selectedRefillPrescription.doctor.name}</p>
 <p className="text-sm text-gray-600 mt-2">Refills Remaining</p>
 <p className="font-medium">{selectedRefillPrescription.refillsRemaining}</p>
 </div>
 <div className="flex gap-3">
 <button
 onClick={() => setShowRefillModal(false)}
 className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
 >
 Cancel
 </button>
 <button
 onClick={confirmRefill}
 className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
 >
 Confirm Request
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 )
}