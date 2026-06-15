'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { FaShieldAlt, FaTimes, FaUser, FaChevronRight, FaPlus, FaFlask, FaPills, FaSearch, FaExternalLinkAlt } from 'react-icons/fa'
import { useProviderRoles } from '@/hooks/useProviderRoles'
import { useDashboardUser } from '@/hooks/useDashboardUser'

const InsuranceContent = dynamic(() => import('@/components/health/MyInsurance'), { ssr: false, loading: () => <Loading /> })
const CreateBookingModal = dynamic(() => import('@/components/shared/CreateBookingModal'), { ssr: false })

function Loading() {
 return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
}

// ─── Lab Results Modal ──────────────────────────────────────────────────────
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
 <div className="bg-white rounded-xl w-full max-w-md max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
 <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
 <h3 className="text-base font-bold text-gray-900 flex items-center gap-2"><FaFlask className="text-blue-500" /> Lab Results</h3>
 <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600"><FaTimes /></button>
 </div>
 <div className="p-4">
 <p className="text-sm font-medium text-gray-700 mb-3">{testName}</p>
 {loading ? <Loading /> : results.length === 0 ? (
 <p className="text-center py-6 text-gray-400 text-sm">Results not yet available. The lab technician will upload results once ready.</p>
 ) : (
 <div className="space-y-2">
 {results.map((r, i) => (
 <div key={r.id || i} className="bg-gray-50 rounded-lg p-3">
 <div className="flex justify-between items-start">
 <p className="font-medium text-sm text-gray-900">{r.testName || 'Test'}</p>
 <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${r.status === 'normal' ? 'bg-green-100 text-green-700' : r.status === 'abnormal' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
 {r.status || 'pending'}
 </span>
 </div>
 {r.result && <p className="text-lg font-bold text-gray-900 mt-1">{r.result} {r.unit}</p>}
 {r.referenceRange && <p className="text-[10px] text-gray-400">Ref: {r.referenceRange}</p>}
 {r.notes && <p className="text-xs text-gray-500 mt-1">{r.notes}</p>}
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 )
}

// ─── Prescriptions Modal ────────────────────────────────────────────────────
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
 <div className="bg-white rounded-xl w-full max-w-md max-h-[75vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
 <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
 <h3 className="text-base font-bold text-gray-900 flex items-center gap-2"><FaPills className="text-purple-500" /> Prescriptions</h3>
 <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600"><FaTimes /></button>
 </div>
 <div className="p-4">
 <p className="text-sm text-gray-500 mb-3">From {doctorName}</p>
 {loading ? <Loading /> : prescriptions.length === 0 ? (
 <p className="text-center py-6 text-gray-400 text-sm">No prescriptions found.</p>
 ) : (
 <div className="space-y-3">
 {prescriptions.map(rx => (
 <div key={rx.id} className="bg-gray-50 rounded-lg p-3">
 <div className="flex justify-between items-start mb-2">
 <p className="font-medium text-sm text-gray-900">{rx.diagnosis || 'Prescription'}</p>
 <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${rx.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
 {rx.isActive ? 'Active' : 'Completed'}
 </span>
 </div>
 <p className="text-[10px] text-gray-400 mb-2">{new Date(rx.createdAt).toLocaleDateString()}</p>
 {rx.notes && <p className="text-xs text-gray-500 mb-2">{rx.notes}</p>}
 {rx.medicines?.length > 0 && (
 <div className="space-y-1.5">
 {rx.medicines.map(m => (
 <div key={m.id} className="flex items-center justify-between bg-white rounded p-2 border border-gray-200">
 <div className="flex-1 min-w-0">
 <p className="text-xs font-medium text-gray-900">{m.medicine?.name || 'Medicine'}</p>
 {m.medicine?.genericName && <p className="text-[10px] text-gray-400">{m.medicine.genericName}</p>}
 <p className="text-[10px] text-blue-600">{m.dosage} · {m.frequency} · {m.duration}</p>
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

// ─── Enhanced Bookings List with View Results / View Prescriptions ───────────
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
 <p className="text-center py-8 text-gray-400 text-sm">No {title.toLowerCase()} bookings yet.</p>
 ) : (
 bookings.map(b => (
 <div key={b.id} className="bg-white rounded-lg border border-gray-200 p-3">
 <div className="flex items-center justify-between">
 <div className="min-w-0 flex-1">
 <p className="font-medium text-gray-900 text-sm truncate">{b.providerName}</p>
 <p className="text-xs text-gray-500">{b.serviceName || title}</p>
 <p className="text-xs text-gray-400">{new Date(b.scheduledAt).toLocaleDateString()}</p>
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

// ─── Sidebar ────────────────────────────────────────────────────────────────

const FIXED_SECTIONS = [
 { id: 'insurance', label: 'Insurance', icon: FaShieldAlt, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
]

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
 gray: { text: 'text-gray-600', bg: 'bg-gray-50' },
}

export default function MyHealthSidebar() {
 const [activeSection, setActiveSection] = useState<string | null>(null)
 const [sidebarOpen, setSidebarOpen] = useState(false)
 const [showBookingModal, setShowBookingModal] = useState(false)
 const { roles } = useProviderRoles()

 // Auto-select first provider role when loaded
 useEffect(() => {
 if (!activeSection && roles.length > 0) {
 setActiveSection(`role:${roles[0].role}`)
 }
 }, [roles, activeSection])

 const allSections = useMemo(() => {
 const dynamic = roles.map(r => ({
 id: `role:${r.role}`,
 label: r.label,
 icon: FaUser,
 color: COLOR_MAP[r.color]?.text || 'text-gray-600',
 bgColor: COLOR_MAP[r.color]?.bg || 'bg-gray-50',
 providerType: r.role,
 }))
 return [
 ...dynamic,
 ...FIXED_SECTIONS.map(s => ({ ...s, providerType: undefined as string | undefined })),
 ]
 }, [roles])

 const activeItem = allSections.find(s => s.id === activeSection) || allSections[0]
 const isProviderSection = (activeSection || '').startsWith('role:')
 const activeProviderType = isProviderSection ? (activeSection || '').replace('role:', '') : null

 return (
 <div className="flex h-full flex-row-reverse">
 {/* Mobile: floating button to open sidebar */}
 <button
 onClick={() => setSidebarOpen(true)}
 className={`sm:hidden fixed bottom-20 right-3 z-40 flex items-center gap-2 px-3 py-2.5 rounded-full shadow-lg text-sm font-medium ${activeItem?.bgColor} ${activeItem?.color} border border-gray-200`}
 >
 <FaUser className="text-xs" />
 <span className="max-w-[120px] truncate">{activeItem?.label}</span>
 <FaChevronRight className="text-[8px] opacity-60" />
 </button>

 {/* Backdrop */}
 {sidebarOpen && <div className="sm:hidden fixed inset-0 bg-black/30 z-50" onClick={() => setSidebarOpen(false)} />}

 {/* Sidebar - right side */}
 <div className={`
 fixed sm:sticky top-0 right-0 z-50 sm:z-auto
 h-full w-64 sm:w-52 lg:w-60
 bg-white border-l border-gray-200 overflow-y-auto
 transform transition-transform duration-150 sm:transform-none
 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full sm:translate-x-0'}
 `}>
 <div className="flex items-center justify-between p-3 sm:hidden">
 <span className="text-sm font-bold text-gray-900">My Health</span>
 <button onClick={() => setSidebarOpen(false)} className="p-1 text-gray-400"><FaTimes /></button>
 </div>

 {/* Provider Services (all roles) */}
 <div className="px-2 pt-2">
 <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1">Provider Services</p>
 <nav className="space-y-0.5">
 {roles.map(r => {
 const sectionId = `role:${r.role}`
 const colors = COLOR_MAP[r.color] || COLOR_MAP.gray
 return (
 <button key={sectionId} onClick={() => { setActiveSection(sectionId); setSidebarOpen(false) }}
 className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs transition ${
 activeSection === sectionId ? `${colors.bg} ${colors.text} font-semibold` : 'text-gray-600 hover:bg-gray-50'
 }`}>
 <FaUser className="text-xs flex-shrink-0" /> {r.label}
 {r.providerCount > 0 && <span className="ml-auto text-[9px] text-gray-400">{r.providerCount}</span>}
 </button>
 )
 })}
 </nav>
 </div>

 {/* Other sections */}
 <div className="px-2 pt-3">
 <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1">Other</p>
 <nav className="space-y-0.5 pb-20">
 {FIXED_SECTIONS.map(s => (
 <button key={s.id} onClick={() => { setActiveSection(s.id); setSidebarOpen(false) }}
 className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs transition ${
 activeSection === s.id ? `${s.bgColor} ${s.color} font-semibold` : 'text-gray-600 hover:bg-gray-50'
 }`}>
 <s.icon className="text-xs flex-shrink-0" /> {s.label}
 </button>
 ))}
 </nav>
 </div>
 </div>

 {/* Content area */}
 <div className="flex-1 min-w-0 pb-24 sm:pb-0">
 {/* Header with Book button (for provider role sections) */}
 {isProviderSection && (
 <div className="flex items-center justify-between p-4 pb-0">
 <h2 className="text-lg font-bold text-gray-900">{activeItem?.label || 'Services'}</h2>
 <button
 onClick={() => setShowBookingModal(true)}
 className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
 >
 <FaPlus className="text-xs" /> Book
 </button>
 </div>
 )}

 <div className="p-4">
 {activeSection === 'insurance' && <InsuranceContent />}
 {/* Provider role sections with enhanced action buttons */}
 {isProviderSection && activeProviderType && (
 <ProviderBookingsList
 providerType={activeProviderType}
 title={activeItem?.label || 'Services'}
 />
 )}
 </div>
 </div>

 {/* Booking modal */}
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
