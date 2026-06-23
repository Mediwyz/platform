import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'react-toastify'
import { Patient } from '@/lib/data/patients'
import { useUser } from '@/hooks/useUser'
import { 
 FaShieldAlt,
 FaCreditCard,
 FaFileInvoice,
 FaHospital,
 FaPills,
 FaTooth,
 FaEye,
 FaAmbulance,
 FaDownload,
 FaPhone,
 FaMoneyBillWave,
 FaUserMd,
 FaStethoscope,
 FaBaby,
 FaHeartbeat,
 FaChartLine,
 FaCheckCircle,
 FaStar,
 FaGift,
 FaPercentage,
 FaReceipt,
 FaFlask,
 FaUserNurse
} from 'react-icons/fa'

interface Props {
 patientData: Patient
}

interface RealClaim {
 id: string
 claimId: string
 policyHolderName: string
 description: string
 policyType: string
 claimAmount: number
 status: string
 submittedDate: string
 resolvedDate: string | null
 plan: { planName: string; planType: string } | null
 insuranceRep: { companyName: string; user: { firstName: string; lastName: string } } | null
}

const InsuranceInfo: React.FC<Props> = ({ patientData }) => {
 const [expandedSection, setExpandedSection] = useState<string>('coverage')
 const [showClaimForm, setShowClaimForm] = useState(false)
 const [, setSelectedBillingMethod] = useState<string>('')
 const [realClaims, setRealClaims] = useState<RealClaim[]>([])
 const [claimsLoading, setClaimsLoading] = useState(true)

 // Load patient data from useUser if not passed as prop
 const { user: hookUser } = useUser()
 const [localPatientData, setLocalPatientData] = useState<Patient | null>(patientData)

 useEffect(() => {
 if (!patientData && hookUser) {
 setLocalPatientData(hookUser as unknown as Patient)
 }
 }, [patientData, hookUser])

 // Fetch real claims from the API
 useEffect(() => {
 async function fetchClaims() {
 try {
 const meRes = await fetch('/api/auth/me', { credentials: 'include' })
 if (!meRes.ok) return
 const meData = await meRes.json()
 const userId = meData.user?.id
 if (!userId) return
 const claimsRes = await fetch(`/api/patients/${userId}/claims`, { credentials: 'include' })
 if (!claimsRes.ok) return
 const claimsData = await claimsRes.json()
 if (claimsData.success && Array.isArray(claimsData.data)) {
 setRealClaims(claimsData.data)
 }
 } catch {
 // Non-critical - show empty state
 } finally {
 setClaimsLoading(false)
 }
 }
 fetchClaims()
 }, [])

 const patient = localPatientData || patientData

 if (!patient || !patient.insuranceCoverage) {
 return (
 <div className="bg-surface rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg text-center border border-line">
 <FaShieldAlt className="text-faint text-3xl sm:text-4xl mx-auto mb-4" />
 <h3 className="text-lg sm:text-xl font-semibold text-soft mb-2">No Insurance Coverage Found</h3>
 <p className="text-soft text-sm sm:text-base">Your insurance information is not yet linked to your profile</p>
 </div>
 )
 }


 const sections = [
 { id: 'coverage', label: 'Coverage Details', icon: FaShieldAlt, color: 'blue' },
 { id: 'billing', label: 'Billing & Payment', icon: FaCreditCard, color: 'green' },
 { id: 'subscription', label: 'Health Plan', icon: FaStar, color: 'purple' },
 { id: 'claims', label: 'Claims History', icon: FaFileInvoice, color: 'orange' },
 { id: 'benefits', label: 'Benefits Usage', icon: FaGift, color: 'pink' }
 ]

 // Calculate coverage percentages
 const calculateCoverageUsage = () => {
 const deductibleUsed = patient.medicineOrders ? 
 patient.medicineOrders.reduce((sum, order) => sum + order.totalAmount, 0) * 0.2 : 0
 const deductiblePercentage = Math.min((deductibleUsed / patient.insuranceCoverage.deductible) * 100, 100)
 
 return {
 deductibleUsed,
 deductiblePercentage,
 remainingDeductible: Math.max(patient.insuranceCoverage.deductible - deductibleUsed, 0)
 }
 }

 const coverageUsage = calculateCoverageUsage()

 // Totals derived from real claims
 const totalClaimsAmount = realClaims.reduce((sum, c) => sum + c.claimAmount, 0)
 // Approved claims represent what the insurer paid (full claim amount when approved)
 const totalCoveredAmount = realClaims
 .filter(c => c.status === 'approved')
 .reduce((sum, c) => sum + c.claimAmount, 0)
 const totalSavings = totalCoveredAmount

 const renderCoverageDetails = () => (
 <div className="space-y-4 sm:space-y-5 md:space-y-6">
 {/* Insurance Card */}
 <div className="bg-brand-navy rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white shadow-xl">
 <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
 <div>
 <div className="flex items-center gap-2 mb-3">
 <FaShieldAlt className="text-2xl sm:text-3xl" />
 <h3 className="text-lg sm:text-xl md:text-2xl font-bold">{patient.insuranceCoverage.provider}</h3>
 </div>
 <div className="space-y-1 text-xs sm:text-sm">
 <p><span className="opacity-80">Policy:</span> {patient.insuranceCoverage.policyNumber}</p>
 <p><span className="opacity-80">Member ID:</span> {patient.insuranceCoverage.subscriberId}</p>
 {patient.insuranceCoverage.groupNumber && (
 <p><span className="opacity-80">Group:</span> {patient.insuranceCoverage.groupNumber}</p>
 )}
 </div>
 </div>
 <div className="text-right">
 <p className="text-xs sm:text-sm opacity-80">Coverage Type</p>
 <p className="text-base sm:text-lg md:text-xl font-bold capitalize">{patient.insuranceCoverage.coverageType}</p>
 <p className="text-xs sm:text-sm mt-2">
 Valid until {new Date(patient.insuranceCoverage.validUntil).toLocaleDateString()}
 </p>
 </div>
 </div>
 </div>

 {/* Coverage Status */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
 <div className="bg-surface rounded-xl p-3 sm:p-4 border border-green-200">
 <div className="flex items-center justify-between mb-2">
 <FaHospital className="text-green-600 text-lg sm:text-xl" />
 <span className={`text-xs font-medium ${patient.insuranceCoverage.emergencyCoverage ? 'text-green-600' : 'text-red-600'}`}>
 {patient.insuranceCoverage.emergencyCoverage ? 'Active' : 'Not Covered'}
 </span>
 </div>
 <p className="text-xs sm:text-sm text-soft">Emergency Care</p>
 <p className="text-base sm:text-lg font-bold text-fg">
 {patient.insuranceCoverage.emergencyCoverage ? '100% Covered' : 'Not Available'}
 </p>
 </div>

 <div className="bg-surface rounded-xl p-3 sm:p-4 border border-purple-200">
 <div className="flex items-center justify-between mb-2">
 <FaPills className="text-purple-600 text-lg sm:text-xl" />
 <span className={`text-xs font-medium ${patient.insuranceCoverage.pharmacyCoverage ? 'text-green-600' : 'text-red-600'}`}>
 {patient.insuranceCoverage.pharmacyCoverage ? 'Active' : 'Not Covered'}
 </span>
 </div>
 <p className="text-xs sm:text-sm text-soft">Pharmacy</p>
 <p className="text-base sm:text-lg font-bold text-fg">
 {patient.insuranceCoverage.pharmacyCoverage ? '80% Covered' : 'Not Available'}
 </p>
 </div>

 <div className="bg-surface rounded-xl p-3 sm:p-4 border border-yellow-200">
 <div className="flex items-center justify-between mb-2">
 <FaTooth className="text-yellow-600 text-lg sm:text-xl" />
 <span className={`text-xs font-medium ${patient.insuranceCoverage.dentalCoverage ? 'text-green-600' : 'text-red-600'}`}>
 {patient.insuranceCoverage.dentalCoverage ? 'Active' : 'Not Covered'}
 </span>
 </div>
 <p className="text-xs sm:text-sm text-soft">Dental</p>
 <p className="text-base sm:text-lg font-bold text-fg">
 {patient.insuranceCoverage.dentalCoverage ? '70% Covered' : 'Not Available'}
 </p>
 </div>

 <div className="bg-surface rounded-xl p-3 sm:p-4 border border-cyan-200">
 <div className="flex items-center justify-between mb-2">
 <FaEye className="text-cyan-600 text-lg sm:text-xl" />
 <span className={`text-xs font-medium ${patient.insuranceCoverage.visionCoverage ? 'text-green-600' : 'text-red-600'}`}>
 {patient.insuranceCoverage.visionCoverage ? 'Active' : 'Not Covered'}
 </span>
 </div>
 <p className="text-xs sm:text-sm text-soft">Vision</p>
 <p className="text-base sm:text-lg font-bold text-fg">
 {patient.insuranceCoverage.visionCoverage ? '60% Covered' : 'Not Available'}
 </p>
 </div>
 </div>

 {/* Deductible and Copay Information */}
 <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-indigo-200">
 <h4 className="text-base sm:text-lg font-semibold text-fg mb-4 flex items-center">
 <FaMoneyBillWave className="mr-2 text-indigo-600" />
 Deductible & Out-of-Pocket
 </h4>
 
 <div className="space-y-4">
 <div>
 <div className="flex justify-between items-center mb-2">
 <span className="text-xs sm:text-sm text-soft">Annual Deductible</span>
 <span className="text-sm sm:text-base font-bold text-fg">
 Rs {coverageUsage.deductibleUsed.toFixed(0)} / Rs {patient.insuranceCoverage.deductible}
 </span>
 </div>
 <div className="w-full bg-line rounded-full h-2 sm:h-2.5">
 <div 
 className="bg-surface h-2 sm:h-2.5 rounded-full transition-all duration-500"
 style={{ width: `${coverageUsage.deductiblePercentage}%` }}
 ></div>
 </div>
 <p className="text-xs text-soft mt-1">
 Rs {coverageUsage.remainingDeductible.toFixed(0)} remaining
 </p>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="bg-surface bg-opacity-70 rounded-lg p-3">
 <p className="text-xs sm:text-sm text-soft">Standard Copay</p>
 <p className="text-lg sm:text-xl font-bold text-indigo-600">Rs {patient.insuranceCoverage.copay}</p>
 <p className="text-xs text-soft">Per visit</p>
 </div>
 <div className="bg-surface bg-opacity-70 rounded-lg p-3">
 <p className="text-xs sm:text-sm text-soft">Out-of-Pocket Max</p>
 <p className="text-lg sm:text-xl font-bold text-purple-600">Rs 50,000</p>
 <p className="text-xs text-soft">Annual limit</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 )

 const renderBillingPayment = () => (
 <div className="space-y-4 sm:space-y-5 md:space-y-6">
 {/* Payment Methods */}
 <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-green-200">
 <h4 className="text-base sm:text-lg font-semibold text-fg mb-4 flex items-center">
 <FaCreditCard className="mr-2 text-green-600" />
 Payment Methods
 </h4>
 
 <div className="space-y-3">
 {patient.billingInformation.map((billing) => (
 <div 
 key={billing.id}
 className={`bg-surface bg-opacity-80 rounded-xl p-3 sm:p-4 border-2 transition-all cursor-pointer hover:shadow-md ${
 billing.isDefault ? 'border-green-400' : 'border-line'
 }`}
 onClick={() => setSelectedBillingMethod(billing.id)}
 >
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${
 billing.type === 'mcb_juice' ? 'bg-orange-100' : 'bg-blue-100'
 }`}>
 <FaCreditCard className={`text-lg sm:text-xl ${
 billing.type === 'mcb_juice' ? 'text-orange-600' : 'text-blue-600'
 }`} />
 </div>
 <div>
 <p className="font-medium text-fg text-sm sm:text-base">
 {billing.type === 'mcb_juice' ? 'MCB Juice' : 'Credit Card'}
 </p>
 <p className="text-xs sm:text-sm text-soft">
 {billing.cardNumber}  Exp: {billing.expiryDate}
 </p>
 <p className="text-xs text-soft">{billing.cardHolder}</p>
 </div>
 </div>
 <div className="text-right">
 {billing.isDefault && (
 <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
 Default
 </span>
 )}
 <p className="text-xs text-soft mt-1">
 Added {new Date(billing.addedDate).toLocaleDateString()}
 </p>
 </div>
 </div>
 </div>
 ))}
 </div>

 <Link href="/patient/settings" className="mt-4 w-full px-4 py-2 bg-surface transition flex items-center justify-center gap-2 text-sm sm:text-base hover:bg-subtle rounded-lg border border-line">
 <FaCreditCard />
 Add New Payment Method
 </Link>
 </div>

 {/* Recent Transactions */}
 <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-blue-200">
 <h4 className="text-base sm:text-lg font-semibold text-fg mb-4 flex items-center">
 <FaReceipt className="mr-2 text-blue-600" />
 Recent Transactions
 </h4>
 
 <div className="space-y-3">
 {patient.medicineOrders && patient.medicineOrders.slice(0, 3).map((order) => (
 <div key={order.id} className="bg-surface bg-opacity-80 rounded-lg p-3 sm:p-4 border border-line">
 <div className="flex items-center justify-between">
 <div>
 <p className="font-medium text-fg text-sm sm:text-base">Medicine Order #{order.id}</p>
 <p className="text-xs sm:text-sm text-soft">
 {new Date(order.orderDate).toLocaleDateString()}
 </p>
 <div className="mt-1">
 {order.medicines.slice(0, 2).map((med, index) => (
 <p key={index} className="text-xs text-soft"> {med.name}</p>
 ))}
 </div>
 </div>
 <div className="text-right">
 <p className="text-base sm:text-lg font-bold text-fg">Rs {order.totalAmount}</p>
 <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
 order.status === 'delivered' ? 'bg-green-100 text-green-700' :
 order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
 'bg-yellow-100 text-yellow-700'
 }`}>
 {order.status}
 </span>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )

 const renderSubscriptionPlan = () => (
 <div className="space-y-4 sm:space-y-5 md:space-y-6">
 {/* Current Plan */}
 <div className="bg-brand-navy rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white shadow-xl">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div>
 <div className="flex items-center gap-2 mb-2">
 <FaStar className="text-2xl sm:text-3xl" />
 <h3 className="text-lg sm:text-xl md:text-2xl font-bold">{patient.subscriptionPlan.planName}</h3>
 </div>
 <p className="text-xs sm:text-sm opacity-90 capitalize">
 {patient.subscriptionPlan.type} Plan  {patient.subscriptionPlan.billingCycle} Billing
 </p>
 {patient.subscriptionPlan.corporateName && (
 <p className="text-xs sm:text-sm mt-1 opacity-80">
 Sponsored by {patient.subscriptionPlan.corporateName}
 </p>
 )}
 </div>
 <div className="text-right">
 <p className="text-2xl sm:text-3xl font-bold">
 Rs {patient.subscriptionPlan.corporateDiscount ? 0 : patient.subscriptionPlan.price}
 </p>
 <p className="text-xs sm:text-sm opacity-80">per {patient.subscriptionPlan.billingCycle}</p>
 {patient.subscriptionPlan.corporateDiscount && (
 <p className="text-xs sm:text-sm mt-1 bg-surface bg-opacity-20 rounded px-2 py-1 inline-block">
 {patient.subscriptionPlan.corporateDiscount}% Corporate Discount
 </p>
 )}
 </div>
 </div>
 
 <div className="mt-4 pt-4 border-t border-white border-opacity-30">
 <p className="text-xs sm:text-sm opacity-80">Valid from {new Date(patient.subscriptionPlan.startDate).toLocaleDateString()} to {patient.subscriptionPlan.endDate ? new Date(patient.subscriptionPlan.endDate).toLocaleDateString() : 'Ongoing'}</p>
 </div>
 </div>

 {/* Plan Features */}
 <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-purple-200">
 <h4 className="text-base sm:text-lg font-semibold text-fg mb-4 flex items-center">
 <FaGift className="mr-2 text-purple-600" />
 Plan Benefits & Features
 </h4>
 
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {patient.subscriptionPlan.features.map((feature, index) => (
 <div key={index} className="flex items-start gap-2">
 <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
 <p className="text-xs sm:text-sm text-soft">{feature}</p>
 </div>
 ))}
 </div>
 </div>

 {/* Usage Stats */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
 <div className="bg-surface rounded-xl p-3 sm:p-4 border border-blue-200">
 <FaUserMd className="text-blue-600 text-lg sm:text-xl mb-2" />
 <p className="text-xs text-soft">Consultations</p>
 <p className="text-lg sm:text-xl font-bold text-fg">
 {patient.pastAppointments ? patient.pastAppointments.length : 0}
 </p>
 <p className="text-xs text-soft">This period</p>
 </div>

 <div className="bg-surface rounded-xl p-3 sm:p-4 border border-green-200">
 <FaPills className="text-green-600 text-lg sm:text-xl mb-2" />
 <p className="text-xs text-soft">Prescriptions</p>
 <p className="text-lg sm:text-xl font-bold text-fg">
 {patient.activePrescriptions ? patient.activePrescriptions.length : 0}
 </p>
 <p className="text-xs text-soft">Active</p>
 </div>

 <div className="bg-surface rounded-xl p-3 sm:p-4 border border-purple-200">
 <FaFlask className="text-purple-600 text-lg sm:text-xl mb-2" />
 <p className="text-xs text-soft">Lab Tests</p>
 <p className="text-lg sm:text-xl font-bold text-fg">
 {patient.labTests ? patient.labTests.length : 0}
 </p>
 <p className="text-xs text-soft">Completed</p>
 </div>

 <div className="bg-surface rounded-xl p-3 sm:p-4 border border-orange-200">
 <FaHeartbeat className="text-orange-600 text-lg sm:text-xl mb-2" />
 <p className="text-xs text-soft">Wellness Score</p>
 <p className="text-lg sm:text-xl font-bold text-fg">{patient.healthScore}%</p>
 <p className="text-xs text-soft">Current</p>
 </div>
 </div>
 </div>
 )

 const renderClaimsHistory = () => (
 <div className="space-y-4 sm:space-y-5 md:space-y-6">
 {/* Claims Summary */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
 <div className="bg-surface rounded-xl p-3 sm:p-4 border border-green-200">
 <FaMoneyBillWave className="text-green-600 text-lg sm:text-xl mb-2" />
 <p className="text-xs sm:text-sm text-soft">Total Claims</p>
 <p className="text-lg sm:text-xl font-bold text-fg">Rs {totalClaimsAmount.toFixed(0)}</p>
 <p className="text-xs text-soft">All time</p>
 </div>

 <div className="bg-surface rounded-xl p-3 sm:p-4 border border-blue-200">
 <FaShieldAlt className="text-blue-600 text-lg sm:text-xl mb-2" />
 <p className="text-xs sm:text-sm text-soft">Insurance Paid</p>
 <p className="text-lg sm:text-xl font-bold text-fg">Rs {totalCoveredAmount.toFixed(0)}</p>
 <p className="text-xs text-soft">Approved claims</p>
 </div>

 <div className="bg-surface rounded-xl p-3 sm:p-4 border border-purple-200">
 <FaPercentage className="text-purple-600 text-lg sm:text-xl mb-2" />
 <p className="text-xs sm:text-sm text-soft">You Saved</p>
 <p className="text-lg sm:text-xl font-bold text-fg">Rs {totalSavings.toFixed(0)}</p>
 <p className="text-xs text-soft">With insurance</p>
 </div>
 </div>

 {/* Claims List */}
 <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-orange-200">
 <div className="flex items-center justify-between mb-4">
 <h4 className="text-base sm:text-lg font-semibold text-fg flex items-center">
 <FaFileInvoice className="mr-2 text-orange-600" />
 Recent Claims
 </h4>
 <button
 onClick={() => setShowClaimForm(!showClaimForm)}
 className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition text-xs sm:text-sm"
 >
 File New Claim
 </button>
 </div>

 {claimsLoading ? (
 <div className="text-center py-8">
 <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
 <p className="text-soft text-sm">Loading claims...</p>
 </div>
 ) : realClaims.length === 0 ? (
 <div className="text-center py-8">
 <FaFileInvoice className="text-faint text-4xl mx-auto mb-3" />
 <p className="text-soft font-medium">No claims yet</p>
 <p className="text-faint text-sm mt-1">Your insurance claims will appear here once submitted.</p>
 </div>
 ) : (
 <div className="space-y-3">
 {realClaims.slice(0, 5).map((claim) => (
 <div key={claim.id} className="bg-surface bg-opacity-80 rounded-lg p-3 sm:p-4 border border-line">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
 <div className="flex-1">
 <div className="flex items-center gap-2 mb-1">
 <p className="font-medium text-fg text-sm sm:text-base">{claim.description}</p>
 <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
 claim.status === 'approved' ? 'bg-green-100 text-green-700' :
 claim.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
 'bg-red-100 text-red-700'
 }`}>
 {claim.status}
 </span>
 </div>
 <p className="text-xs sm:text-sm text-soft">
 {claim.policyType}
 {claim.insuranceRep ? `  ${claim.insuranceRep.companyName}` : ''}
 {'  '}{new Date(claim.submittedDate).toLocaleDateString()}
 </p>
 <p className="text-xs text-soft mt-1">Claim ID: {claim.claimId}</p>
 </div>
 <div className="flex sm:flex-col gap-4 sm:gap-1 sm:text-right">
 <div>
 <p className="text-xs text-soft">Claimed</p>
 <p className="text-sm sm:text-base font-semibold text-fg">Rs {claim.claimAmount.toFixed(0)}</p>
 </div>
 <div>
 <p className="text-xs text-soft">Status</p>
 <p className={`text-sm sm:text-base font-semibold ${
 claim.status === 'approved' ? 'text-green-600' :
 claim.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
 }`}>
 {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
 </p>
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}

 {realClaims.length > 5 && (
 <Link href="/patient/insurance?tab=claims" className="mt-4 block w-full text-center px-4 py-2 bg-sky-50 text-orange-700 rounded-lg transition text-sm hover:bg-sky-100">
 View All Claims History
 </Link>
 )}
 </div>
 </div>
 )

 const renderBenefitsUsage = () => (
 <div className="space-y-4 sm:space-y-5 md:space-y-6">
 {/* Annual Benefits Overview */}
 <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-pink-200">
 <h4 className="text-base sm:text-lg font-semibold text-fg mb-4 flex items-center">
 <FaChartLine className="mr-2 text-pink-600" />
 Annual Benefits Usage
 </h4>
 
 <div className="space-y-4">
 {/* Doctor Visits */}
 <div>
 <div className="flex justify-between items-center mb-2">
 <div className="flex items-center gap-2">
 <FaUserMd className="text-blue-600" />
 <span className="text-xs sm:text-sm text-soft">Doctor Consultations</span>
 </div>
 <span className="text-xs sm:text-sm font-medium text-fg">
 {patient.pastAppointments ? patient.pastAppointments.length : 0} / Unlimited
 </span>
 </div>
 <div className="w-full bg-line rounded-full h-2">
 <div className="bg-surface h-2 rounded-full" style={{ width: '25%' }}></div>
 </div>
 </div>

 {/* Lab Tests */}
 <div>
 <div className="flex justify-between items-center mb-2">
 <div className="flex items-center gap-2">
 <FaFlask className="text-purple-600" />
 <span className="text-xs sm:text-sm text-soft">Free Lab Tests</span>
 </div>
 <span className="text-xs sm:text-sm font-medium text-fg">
 {patient.labTests ? patient.labTests.length : 0} / 4 per year
 </span>
 </div>
 <div className="w-full bg-line rounded-full h-2">
 <div 
 className="bg-surface h-2 rounded-full" 
 style={{ width: `${Math.min((patient.labTests ? patient.labTests.length : 0) / 4 * 100, 100)}%` }}
 ></div>
 </div>
 </div>

 {/* Wellness Programs */}
 <div>
 <div className="flex justify-between items-center mb-2">
 <div className="flex items-center gap-2">
 <FaHeartbeat className="text-green-600" />
 <span className="text-xs sm:text-sm text-soft">Wellness Programs</span>
 </div>
 <span className="text-xs sm:text-sm font-medium text-fg">3 / 12 sessions</span>
 </div>
 <div className="w-full bg-line rounded-full h-2">
 <div className="bg-surface h-2 rounded-full" style={{ width: '25%' }}></div>
 </div>
 </div>

 {/* Home Nurse Visits */}
 <div>
 <div className="flex justify-between items-center mb-2">
 <div className="flex items-center gap-2">
 <FaUserNurse className="text-pink-600" />
 <span className="text-xs sm:text-sm text-soft">Home Nurse Visits</span>
 </div>
 <span className="text-xs sm:text-sm font-medium text-fg">
 {patient.nurseBookings ? patient.nurseBookings.length : 0} / 24 per year
 </span>
 </div>
 <div className="w-full bg-line rounded-full h-2">
 <div 
 className="bg-surface h-2 rounded-full" 
 style={{ width: `${Math.min((patient.nurseBookings ? patient.nurseBookings.length : 0) / 24 * 100, 100)}%` }}
 ></div>
 </div>
 </div>
 </div>
 </div>

 {/* Additional Benefits */}
 <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-cyan-200">
 <h4 className="text-base sm:text-lg font-semibold text-fg mb-4 flex items-center">
 <FaGift className="mr-2 text-cyan-600" />
 Additional Benefits Available
 </h4>
 
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div className="bg-surface bg-opacity-70 rounded-lg p-3 border border-line">
 <div className="flex items-start gap-3">
 <FaStethoscope className="text-blue-600 mt-1" />
 <div>
 <p className="font-medium text-fg text-sm">Annual Health Screening</p>
 <p className="text-xs text-soft">Comprehensive checkup included</p>
 <button className="mt-2 text-xs text-blue-600 hover:underline">Schedule Now </button>
 </div>
 </div>
 </div>

 <div className="bg-surface bg-opacity-70 rounded-lg p-3 border border-line">
 <div className="flex items-start gap-3">
 <FaBaby className="text-pink-600 mt-1" />
 <div>
 <p className="font-medium text-fg text-sm">Childcare Services</p>
 <p className="text-xs text-soft">Nanny services available</p>
 <button className="mt-2 text-xs text-pink-600 hover:underline">Learn More </button>
 </div>
 </div>
 </div>

 <div className="bg-surface bg-opacity-70 rounded-lg p-3 border border-line">
 <div className="flex items-start gap-3">
 <FaTooth className="text-yellow-600 mt-1" />
 <div>
 <p className="font-medium text-fg text-sm">Dental Care</p>
 <p className="text-xs text-soft">70% coverage on treatments</p>
 <button className="mt-2 text-xs text-yellow-600 hover:underline">Find Dentist </button>
 </div>
 </div>
 </div>

 <div className="bg-surface bg-opacity-70 rounded-lg p-3 border border-line">
 <div className="flex items-start gap-3">
 <FaAmbulance className="text-red-600 mt-1" />
 <div>
 <p className="font-medium text-fg text-sm">Emergency Services</p>
 <p className="text-xs text-soft">24/7 ambulance service</p>
 <button className="mt-2 text-xs text-red-600 hover:underline">View Details </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 )

 return (
 <div className="space-y-4 sm:space-y-5 md:space-y-6">
 {/* Header */}
 <div className="bg-brand-navy rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white">
 <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
 <div>
 <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 flex items-center">
 <FaShieldAlt className="mr-2 sm:mr-3" />
 Insurance & Benefits
 </h2>
 <p className="opacity-90 text-xs sm:text-sm md:text-base">Manage your insurance coverage and health benefits</p>
 </div>
 <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
 <div className="bg-sky-100/20 rounded-lg p-2 sm:p-3 backdrop-blur-sm">
 <p className="text-lg sm:text-xl md:text-2xl font-bold">100%</p>
 <p className="text-xs opacity-90">Coverage Active</p>
 </div>
 <div className="bg-sky-100/20 rounded-lg p-2 sm:p-3 backdrop-blur-sm">
 <p className="text-lg sm:text-xl md:text-2xl font-bold">Rs {totalSavings.toFixed(0)}</p>
 <p className="text-xs opacity-90">Total Saved</p>
 </div>
 <div className="bg-sky-100/20 rounded-lg p-2 sm:p-3 backdrop-blur-sm">
 <p className="text-lg sm:text-xl md:text-2xl font-bold">{realClaims.length}</p>
 <p className="text-xs opacity-90">Claims Filed</p>
 </div>
 </div>
 </div>
 </div>

 {/* Mobile Accordion / Desktop Tabs */}
 <div className="bg-surface rounded-xl sm:rounded-2xl shadow-lg border border-line overflow-hidden">
 {/* Desktop Tab Navigation */}
 <div className="hidden sm:block border-b">
 <div className="flex overflow-x-auto">
 {sections.map((section) => (
 <button
 key={section.id}
 onClick={() => setExpandedSection(section.id)}
 className={`flex-shrink-0 px-4 md:px-6 py-3 md:py-4 text-center font-medium transition-all ${
 expandedSection === section.id 
 ? `text-${section.color}-600 border-b-2 border-current bg-${section.color}-50` 
 : 'text-soft hover:text-fg hover:bg-subtle'
 }`}
 >
 <section.icon className="inline mr-2 text-sm md:text-base" />
 <span className="whitespace-nowrap text-sm md:text-base">{section.label}</span>
 </button>
 ))}
 </div>
 </div>

 {/* Content */}
 <div className="p-4 md:p-6 pb-20 sm:pb-0">
 {expandedSection === 'coverage' && renderCoverageDetails()}
 {expandedSection === 'billing' && renderBillingPayment()}
 {expandedSection === 'subscription' && renderSubscriptionPlan()}
 {expandedSection === 'claims' && renderClaimsHistory()}
 {expandedSection === 'benefits' && renderBenefitsUsage()}
 </div>
 </div>

 {/* Quick Actions */}
 <div className="bg-brand-navy rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white">
 <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Actions</h3>
 <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-4 sm:gap-3 md:gap-4">
 <button
   onClick={() => { setExpandedSection('claims'); setShowClaimForm(true) }}
   className="w-full bg-sky-100/30 hover:bg-sky-100/50 transition text-left p-3 rounded-lg">
 <FaFileInvoice className="text-xl sm:text-2xl mb-2" />
 <p className="font-medium text-sm sm:text-base">File a Claim</p>
 <p className="text-xs sm:text-sm opacity-90">Submit new claim</p>
 </button>

 <button
   onClick={() => { window.print(); toast.info('Opening print dialog for insurance card') }}
   className="w-full bg-sky-100/30 hover:bg-sky-100/50 transition text-left p-3 rounded-lg">
 <FaDownload className="text-xl sm:text-2xl mb-2" />
 <p className="font-medium text-sm sm:text-base">Download Card</p>
 <p className="text-xs sm:text-sm opacity-90">Get insurance card</p>
 </button>

 <Link href="/patient/messages" className="w-full bg-sky-100/30 hover:bg-sky-100/50 transition text-left p-3 rounded-lg block">
 <FaPhone className="text-xl sm:text-2xl mb-2" />
 <p className="font-medium text-sm sm:text-base">Contact Support</p>
 <p className="text-xs sm:text-sm opacity-90">Insurance help</p>
 </Link>

 <Link href="/search/providers" className="w-full bg-sky-100/30 hover:bg-sky-100/50 transition text-left p-3 rounded-lg block">
 <FaHospital className="text-xl sm:text-2xl mb-2" />
 <p className="font-medium text-sm sm:text-base">Find Provider</p>
 <p className="text-xs sm:text-sm opacity-90">Network hospitals</p>
 </Link>
 </div>
 </div>

 {/* Fixed Bottom Tab Bar - Mobile */}
 <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-line flex justify-around items-center py-2 px-1 z-50 shadow-lg">
 {sections.map((section) => {
 const Icon = section.icon
 const isActive = expandedSection === section.id
 return (
 <button key={section.id} onClick={() => setExpandedSection(section.id)}
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

export default InsuranceInfo