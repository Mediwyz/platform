'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
 FaShieldAlt, FaTimes, FaUser, FaPlus, FaFlask, FaPills, FaSearch, FaExternalLinkAlt,
 FaHeartbeat, FaArrowLeft, FaUserMd, FaUserNurse, FaBaby, FaAmbulance,
 FaHandHoldingHeart, FaWalking, FaTooth, FaEye, FaAppleAlt, FaCapsules, FaCalendarAlt,
} from 'react-icons/fa'
import type { IconType } from 'react-icons'
import { useProviderRoles } from '@/hooks/useProviderRoles'
import { useDashboardUser } from '@/hooks/useDashboardUser'
import DashboardPageHeader from '@/components/shared/DashboardPageHeader'

// Icon per provider role code  falls back to a generic user icon.
const ROLE_ICON: Record<string, IconType> = {
 DOCTOR: FaUserMd, NURSE: FaUserNurse, NANNY: FaBaby, PHARMACIST: FaCapsules,
 LAB_TECHNICIAN: FaFlask, EMERGENCY_WORKER: FaAmbulance, CAREGIVER: FaHandHoldingHeart,
 PHYSIOTHERAPIST: FaWalking, DENTIST: FaTooth, OPTOMETRIST: FaEye, NUTRITIONIST: FaAppleAlt,
}

const InsuranceContent = dynamic(() => import('@/components/health/MyInsurance'), { ssr: false, loading: () => <Loading /> })
const CreateBookingModal = dynamic(() => import('@/components/shared/CreateBookingModal'), { ssr: false })

function Loading() {
 return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
}

//  Lab Results Modal 
function LabResultsModal({ bookingId, testName, onClose }: { bookingId: string; testName: string; onClose: () => void }) {
 const user = useDashboardUser()
 const [results, setResults] = useState<{ id: string; testName: string; result: string; unit: string; referenceRange: string; status: string; notes: string | null }[]>([])
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 if (!user) return
 fetch(`/api/patients/${user.id}/lab-tests?bookingId=${bookingId}`, { credentials: 'include' })
 .then(r => r.json())
 .then(json => {
 if (json.success && json.data) {
 // Lab tests may have nested results or be the results themselves
 const allResults = Array.isArray(json.data) ? json.data : []
 setResults(allResults.flatMap((t: { results?: unknown[] }) => t.results || [t]))
 }
 })
 .catch(() => {})
 .finally(() => setLoading(false))
 }, [user, bookingId])

 return (
 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
 <div className="bg-surface rounded-xl w-full max-w-md max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
 <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-surface">
 <h3 className="text-base font-bold text-fg flex items-center gap-2"><FaFlask className="text-blue-500" /> Lab Results</h3>
 <button onClick={onClose} className="p-1.5 text-faint hover:text-soft"><FaTimes /></button>
 </div>
 <div className="p-4">
 <p className="text-sm font-medium text-soft mb-3">{testName}</p>
 {loading ? <Loading /> : results.length === 0 ? (
 <p className="text-center py-6 text-faint text-sm">Results not yet available. The lab technician will upload results once ready.</p>
 ) : (
 <div className="space-y-2">
 {results.map((r, i) => (
 <div key={r.id || i} className="bg-subtle rounded-lg p-3">
 <div className="flex justify-between items-start">
 <p className="font-medium text-sm text-fg">{r.testName || 'Test'}</p>
 <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${r.status === 'normal' ? 'bg-green-100 text-green-700' : r.status === 'abnormal' ? 'bg-red-100 text-red-700' : 'bg-subtle text-soft'}`}>
 {r.status || 'pending'}
 </span>
 </div>
 {r.result && <p className="text-lg font-bold text-fg mt-1">{r.result} {r.unit}</p>}
 {r.referenceRange && <p className="text-[10px] text-faint">Ref: {r.referenceRange}</p>}
 {r.notes && <p className="text-xs text-soft mt-1">{r.notes}</p>}
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 )
}

//  Prescriptions Modal 
function PrescriptionsModal({ appointmentId, doctorName, onClose }: { appointmentId: string; doctorName: string; onClose: () => void }) {
 const user = useDashboardUser()
 const [prescriptions, setPrescriptions] = useState<{
 id: string; diagnosis: string; isActive: boolean; createdAt: string; notes: string | null
 medicines: { id: string; medicine: { name: string; genericName: string | null }; dosage: string; frequency: string; duration: string }[]
 }[]>([])
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 if (!user) return
 fetch(`/api/patients/${user.id}/prescriptions`, { credentials: 'include' })
 .then(r => r.json())
 .then(json => {
 if (json.success && json.data) {
 // Filter by the appointment's doctor if possible, or show all
 setPrescriptions(json.data)
 }
 })
 .catch(() => {})
 .finally(() => setLoading(false))
 }, [user, appointmentId])

 return (
 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
 <div className="bg-surface rounded-xl w-full max-w-md max-h-[75vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
 <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-surface">
 <h3 className="text-base font-bold text-fg flex items-center gap-2"><FaPills className="text-purple-500" /> Prescriptions</h3>
 <button onClick={onClose} className="p-1.5 text-faint hover:text-soft"><FaTimes /></button>
 </div>
 <div className="p-4">
 <p className="text-sm text-soft mb-3">From {doctorName}</p>
 {loading ? <Loading /> : prescriptions.length === 0 ? (
 <p className="text-center py-6 text-faint text-sm">No prescriptions found.</p>
 ) : (
 <div className="space-y-3">
 {prescriptions.map(rx => (
 <div key={rx.id} className="bg-subtle rounded-lg p-3">
 <div className="flex justify-between items-start mb-2">
 <p className="font-medium text-sm text-fg">{rx.diagnosis || 'Prescription'}</p>
 <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${rx.isActive ? 'bg-green-100 text-green-700' : 'bg-subtle text-soft'}`}>
 {rx.isActive ? 'Active' : 'Completed'}
 </span>
 </div>
 <p className="text-[10px] text-faint mb-2">{new Date(rx.createdAt).toLocaleDateString()}</p>
 {rx.notes && <p className="text-xs text-soft mb-2">{rx.notes}</p>}
 {rx.medicines?.length > 0 && (
 <div className="space-y-1.5">
 {rx.medicines.map(m => (
 <div key={m.id} className="flex items-center justify-between bg-surface rounded p-2 border border-line">
 <div className="flex-1 min-w-0">
 <p className="text-xs font-medium text-fg">{m.medicine?.name || 'Medicine'}</p>
 {m.medicine?.genericName && <p className="text-[10px] text-faint">{m.medicine.genericName}</p>}
 <p className="text-[10px] text-blue-600">{m.dosage}  {m.frequency}  {m.duration}</p>
 </div>
 <Link href={`/search/medicines?q=${encodeURIComponent(m.medicine?.name || '')}`}
 className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-medium hover:bg-blue-100 flex-shrink-0 ml-2">
 <FaSearch className="text-[8px]" /> Find
 </Link>
 </div>
 ))}
 </div>
 )}
 {/* Button to search all medicines from this prescription */}
 {rx.medicines?.length > 0 && (
 <Link
 href={`/search/medicines?q=${encodeURIComponent(rx.medicines.map(m => m.medicine?.name).filter(Boolean).join(' '))}`}
 className="mt-2 flex items-center justify-center gap-1.5 w-full py-2 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-100 transition"
 >
 <FaExternalLinkAlt className="text-[10px]" /> Find All Medicines on Pharmacy
 </Link>
 )}
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 )
}

//  Enhanced Bookings List with View Results / View Prescriptions 
interface BookingItem {
 id: string
 bookingType: string
 providerName: string
 providerRole: string
 serviceName?: string
 scheduledAt: string
 status: string
 price: number | null
}

function ProviderBookingsList({ providerType, title }: { providerType: string; title: string }) {
 const [bookings, setBookings] = useState<BookingItem[]>([])
 const [loading, setLoading] = useState(true)
 const [labResultsModal, setLabResultsModal] = useState<{ bookingId: string; testName: string } | null>(null)
 const [prescriptionsModal, setPrescriptionsModal] = useState<{ appointmentId: string; doctorName: string } | null>(null)

 useEffect(() => {
 fetch('/api/bookings/unified?role=patient', { credentials: 'include' })
 .then(r => r.json())
 .then(json => {
 if (json.success && json.data) {
 setBookings(json.data.filter((b: Record<string, unknown>) => b.providerRole === providerType || b.providerType === providerType))
 }
 })
 .catch(() => {})
 .finally(() => setLoading(false))
 }, [providerType])

 if (loading) return <Loading />

 // Dynamic-roles principle: any provider may produce lab results or prescriptions.
 // Action buttons are surfaced for every completed booking; modals show empty
 // state when no content exists for that booking.

 return (
 <>
 <div className="space-y-2">
 {bookings.length === 0 ? (
 <p className="text-center py-8 text-faint text-sm">No {title.toLowerCase()} bookings yet.</p>
 ) : (
 bookings.map(b => (
 <div key={b.id} className="bg-surface rounded-lg border border-line p-3">
 <div className="flex items-center justify-between">
 <div className="min-w-0 flex-1">
 <p className="font-medium text-fg text-sm truncate">{b.providerName}</p>
 <p className="text-xs text-soft">{b.serviceName || title}</p>
 <p className="text-xs text-faint">{new Date(b.scheduledAt).toLocaleDateString()}</p>
 </div>
 <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
 <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
 b.status === 'completed' ? 'bg-green-100 text-green-700' :
 b.status === 'cancelled' ? 'bg-red-100 text-red-700' :
 b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
 'bg-blue-100 text-blue-700'
 }`}>{b.status}</span>
 </div>
 </div>

 {/* Action buttons for completed bookings - available to every provider role */}
 {b.status === 'completed' && (
 <div className="mt-2 flex flex-wrap gap-2">
 <button
 onClick={() => setLabResultsModal({ bookingId: b.id, testName: b.serviceName || title })}
 className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition"
 >
 <FaFlask className="text-[10px]" /> View Results
 </button>
 <button
 onClick={() => setPrescriptionsModal({ appointmentId: b.id, doctorName: b.providerName })}
 className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-100 transition"
 >
 <FaPills className="text-[10px]" /> View Prescriptions
 </button>
 </div>
 )}
 </div>
 ))
 )}
 </div>

 {/* Lab Results Modal */}
 {labResultsModal && (
 <LabResultsModal
 bookingId={labResultsModal.bookingId}
 testName={labResultsModal.testName}
 onClose={() => setLabResultsModal(null)}
 />
 )}

 {/* Prescriptions Modal */}
 {prescriptionsModal && (
 <PrescriptionsModal
 appointmentId={prescriptionsModal.appointmentId}
 doctorName={prescriptionsModal.doctorName}
 onClose={() => setPrescriptionsModal(null)}
 />
 )}
 </>
 )
}

//  My Health (card grid  detail) 

const COLOR_MAP: Record<string, { text: string; bg: string }> = {
 blue: { text: 'text-blue-600', bg: 'bg-blue-50' },
 purple: { text: 'text-purple-600', bg: 'bg-purple-50' },
 pink: { text: 'text-pink-600', bg: 'bg-pink-50' },
 teal: { text: 'text-teal-600', bg: 'bg-teal-50' },
 lime: { text: 'text-lime-600', bg: 'bg-lime-50' },
 sky: { text: 'text-sky-600', bg: 'bg-sky-50' },
 violet: { text: 'text-violet-600', bg: 'bg-violet-50' },
 yellow: { text: 'text-yellow-600', bg: 'bg-yellow-50' },
 orange: { text: 'text-orange-600', bg: 'bg-orange-50' },
 cyan: { text: 'text-cyan-600', bg: 'bg-cyan-50' },
 red: { text: 'text-red-600', bg: 'bg-red-50' },
 gray: { text: 'text-soft', bg: 'bg-subtle' },
}

export default function MyHealthSidebar() {
 // null = show the card grid; otherwise the selected section's detail view.
 const [activeSection, setActiveSection] = useState<string | null>(null)
 const [showBookingModal, setShowBookingModal] = useState(false)
 const { roles } = useProviderRoles()

 // Booking counts per role, so the cards show real activity (not an empty page).
 const [countByRole, setCountByRole] = useState<Record<string, number>>({})
 useEffect(() => {
 fetch('/api/bookings/unified?role=patient', { credentials: 'include' })
 .then(r => r.json())
 .then(json => {
 if (json.success && Array.isArray(json.data)) {
 const counts: Record<string, number> = {}
 for (const b of json.data as Record<string, unknown>[]) {
 const key = (b.providerRole || b.providerType) as string
 if (key) counts[key] = (counts[key] || 0) + 1
 }
 setCountByRole(counts)
 }
 })
 .catch(() => {})
 }, [])

 const activeItem = useMemo(() => {
 if (!activeSection) return null
 if (activeSection === 'insurance') return { label: 'Insurance', providerType: undefined as string | undefined }
 const code = activeSection.replace('role:', '')
 const r = roles.find(x => x.role === code)
 return { label: r?.label || 'Provider', providerType: code }
 }, [activeSection, roles])

 const activeProviderType = activeItem?.providerType ?? null
 const isProviderSection = !!activeProviderType

 //  DETAIL VIEW 
 if (activeSection) {
 const Icon = activeProviderType ? (ROLE_ICON[activeProviderType] || FaUser) : FaShieldAlt
 return (
 <div className="max-w-3xl mx-auto">
 <DashboardPageHeader
 icon={Icon}
 title={activeItem?.label || 'My Health'}
 description={isProviderSection ? 'Your visits, results and prescriptions with this provider type.' : 'Your insurance cover, contributions and claims.'}
 back={{ label: 'All of my health', onClick: () => setActiveSection(null) }}
 actions={isProviderSection ? (
 <button
 onClick={() => setShowBookingModal(true)}
 className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0C6780] text-white rounded-lg text-sm font-semibold hover:bg-[#0a5568] transition"
 >
 <FaPlus className="text-xs" /> Book new
 </button>
 ) : undefined}
 />

 {activeSection === 'insurance' && <InsuranceContent />}
 {isProviderSection && activeProviderType && (
 <ProviderBookingsList providerType={activeProviderType} title={activeItem?.label || 'Services'} />
 )}

 {showBookingModal && activeProviderType && (
 <CreateBookingModal
 isOpen={showBookingModal}
 onClose={() => setShowBookingModal(false)}
 onCreated={() => { setShowBookingModal(false); window.location.reload() }}
 defaultProviderType={activeProviderType}
 />
 )}
 </div>
 )
 }

 //  GRID VIEW (default) 
 return (
 <div className="max-w-5xl mx-auto">
 <DashboardPageHeader
 icon={FaHeartbeat}
 title="My Health"
 description="Your care across every provider  pick a category to see your visits, results and prescriptions, or book a new appointment."
 />

 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
 {roles.map(r => {
 const colors = COLOR_MAP[r.color] || COLOR_MAP.gray
 const Icon = ROLE_ICON[r.role] || FaUser
 const visits = countByRole[r.role] || 0
 return (
 <button
 key={r.role}
 onClick={() => setActiveSection(`role:${r.role}`)}
 className="group flex flex-col items-start text-left p-4 sm:p-5 rounded-2xl bg-surface border border-line shadow-sm
 hover:shadow-lg hover:-translate-y-0.5 hover:border-[#0C6780]/30 transition-all duration-200
 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C6780]"
 >
 <span className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${colors.bg} ${colors.text}`}>
 <Icon className="text-xl" />
 </span>
 <span className="text-sm font-bold text-fg leading-tight">{r.label}</span>
 <span className="text-[11px] text-faint mt-0.5">{r.providerCount} available</span>
 <span className={`mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold ${visits > 0 ? colors.text : 'text-faint'}`}>
 {visits > 0 ? `${visits} visit${visits !== 1 ? 's' : ''}` : 'No visits yet'}
 <FaCalendarAlt className="text-[9px]" />
 </span>
 </button>
 )
 })}

 {/* Insurance card */}
 <button
 onClick={() => setActiveSection('insurance')}
 className="group flex flex-col items-start text-left p-4 sm:p-5 rounded-2xl bg-surface border border-line shadow-sm
 hover:shadow-lg hover:-translate-y-0.5 hover:border-indigo-300 transition-all duration-200
 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
 >
 <span className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 bg-indigo-50 text-indigo-600">
 <FaShieldAlt className="text-xl" />
 </span>
 <span className="text-sm font-bold text-fg leading-tight">Insurance</span>
 <span className="text-[11px] text-faint mt-0.5">Cover & claims</span>
 <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600">
 Manage <FaArrowLeft className="text-[9px] rotate-180" />
 </span>
 </button>
 </div>
 </div>
 )
}
