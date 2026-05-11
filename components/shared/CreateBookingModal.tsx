'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Image from 'next/image'
import { useDashboardUser } from '@/hooks/useDashboardUser'
import { useProviderRoles, ProviderRole } from '@/hooks/useProviderRoles'
import { FaTimes, FaSpinner, FaCalendarAlt, FaChevronLeft } from 'react-icons/fa'

interface Provider {
 id: string
 firstName: string
 lastName: string
 address: string | null
 specializations: string[]
 profileImage: string | null
 verified: boolean
}

interface WorkflowOption {
 id: string
 name: string
 serviceMode: string // 'office' | 'home' | 'video'
}

interface Service {
 id: string
 serviceName: string
 price: number
 category: string
 duration: number | null
 workflows: WorkflowOption[]
}

const MODE_LABELS: Record<string, string> = { office: 'At Office', home: 'At Home', video: 'Video Call' }
const MODE_COLORS: Record<string, string> = {
 office: 'bg-sky-50 text-sky-700 border-sky-200',
 home: 'bg-orange-50 text-orange-700 border-orange-200',
 video: 'bg-purple-50 text-purple-700 border-purple-200',
}

function modeToConsultType(mode: string): 'in_person' | 'home_visit' | 'video' {
 if (mode === 'home') return 'home_visit'
 if (mode === 'video') return 'video'
 return 'in_person'
}

interface CreateBookingModalProps {
 isOpen: boolean
 onClose: () => void
 onCreated: () => void
 /** Pre-select provider type (skip step 1) */
 defaultProviderType?: string
 /** Pre-select a specific provider (skip step 1 + 2) */
 defaultProvider?: { id: string; firstName: string; lastName: string }
}

/** Map UserType to the providerType string used by the available-slots API. */
function getSlotProviderType(role: string): string {
 const map: Record<string, string> = {
 DOCTOR: 'doctor', NURSE: 'nurse', NANNY: 'nanny',
 LAB_TECHNICIAN: 'lab-test', EMERGENCY_WORKER: 'emergency',
 CAREGIVER: 'caregiver', PHYSIOTHERAPIST: 'physiotherapist',
 DENTIST: 'dentist', OPTOMETRIST: 'optometrist', NUTRITIONIST: 'nutritionist',
 }
 return map[role] || role.toLowerCase()
}

/** Generate Mon–Sun dates for a given week offset (0 = this week, 1 = next, etc.) */
function getWeekDates(weekOffset: number): { date: string; dayName: string; dayNum: number; monthShort: string; isToday: boolean; isPast: boolean }[] {
 const now = new Date()
 const dayOfWeek = now.getDay() // 0=Sun, 1=Mon
 const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
 const monday = new Date(now)
 monday.setDate(now.getDate() + diffToMonday + weekOffset * 7)

 const days = []
 const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
 const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
 for (let i = 0; i < 7; i++) {
 const d = new Date(monday)
 d.setDate(monday.getDate() + i)
 const dateStr = d.toISOString().split('T')[0]
 const todayStr = now.toISOString().split('T')[0]
 days.push({
 date: dateStr,
 dayName: dayNames[i],
 dayNum: d.getDate(),
 monthShort: monthNames[d.getMonth()],
 isToday: dateStr === todayStr,
 isPast: d < new Date(now.getFullYear(), now.getMonth(), now.getDate()),
 })
 }
 return days
}

export default function CreateBookingModal({ isOpen, onClose, onCreated, defaultProviderType, defaultProvider }: CreateBookingModalProps) {
 const user = useDashboardUser()
 const { roles } = useProviderRoles()

 // Steps: 1=role, 2=specialty+provider, 3=service+type, 4=date/time, 5=confirm
 const [step, setStep] = useState(1)
 const [selectedRole, setSelectedRole] = useState<ProviderRole | null>(null)
 const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null)
 const [providers, setProviders] = useState<Provider[]>([])
 const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
 const [services, setServices] = useState<Service[]>([])
 const [selectedService, setSelectedService] = useState<Service | null>(null)
 const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null)
 const [selectedDate, setSelectedDate] = useState('')
 const [selectedTime, setSelectedTime] = useState('')
 const [weekOffset, setWeekOffset] = useState(0)
 const [weekSlots, setWeekSlots] = useState<Record<string, string[]>>({}) // { "2026-03-19": ["08:00","08:30",...] }
 const [reason, setReason] = useState('')
 const [loading, setLoading] = useState(false)
 const [slotsLoading, setSlotsLoading] = useState(false)
 const [submitting, setSubmitting] = useState(false)
 const [error, setError] = useState<string | null>(null)

 // Show BOTH this week AND next week on screen at once — 14 days visible
 // so the user doesn't have to navigate with chevrons to find a free slot.
 const twoWeekDates = useMemo(
  () => [...getWeekDates(weekOffset), ...getWeekDates(weekOffset + 1)],
  [weekOffset],
 )

 // Determine initial step based on defaults
 useEffect(() => {
 if (!isOpen) return
 if (defaultProvider && defaultProviderType && roles.length > 0) {
 const role = roles.find(r => r.role === defaultProviderType)
 if (role) {
 setSelectedRole(role)
 setSelectedProvider({
 id: defaultProvider.id,
 firstName: defaultProvider.firstName,
 lastName: defaultProvider.lastName,
 address: null, specializations: [], profileImage: null, verified: true,
 })
 setStep(3)
 }
 } else if (defaultProviderType && roles.length > 0) {
 const role = roles.find(r => r.role === defaultProviderType)
 if (role) {
 setSelectedRole(role)
 setStep(2)
 }
 }
 }, [defaultProviderType, defaultProvider, roles, isOpen])

 // Fetch providers when role selected
 useEffect(() => {
 if (!selectedRole) return
 setLoading(true)
 fetch(`/api/search/providers?type=${selectedRole.role}`)
 .then(r => r.json())
 .then(json => { if (json.success) setProviders(json.data) })
 .catch(() => {})
 .finally(() => setLoading(false))
 }, [selectedRole])

 // Fetch provider-specific services (with workflow info) once the provider is chosen.
 useEffect(() => {
 if (!selectedProvider) return
 fetch(`/api/providers/${selectedProvider.id}/services`, { credentials: 'include' })
   .then(r => r.json())
   .then(json => { if (json.success) setServices(json.data || []) })
   .catch(() => {})
 }, [selectedProvider])

 // Fetch available slots for BOTH visible weeks (14 days total) so the
 // whole picker is pre-loaded before the user taps a day.
 const fetchWeekSlots = useCallback(async () => {
 if (!selectedProvider || !selectedRole) return
 setSlotsLoading(true)
 const providerType = getSlotProviderType(selectedRole.role)
 const slotMap: Record<string, string[]> = {}

 // Fetch all 14 days in parallel (this week + next week)
 const promises = twoWeekDates.filter(d => !d.isPast).map(async (day) => {
 try {
 const res = await fetch(`/api/bookings/available-slots?providerId=${selectedProvider.id}&date=${day.date}&providerType=${providerType}`, { credentials: 'include' })
 const json = await res.json()
 if (json.success && json.slots && json.slots.length > 0) {
 slotMap[day.date] = json.slots
 } else {
 // Default slots for days without configured availability
 const defaultSlots = []
 for (let h = 8; h <= 17; h++) {
 defaultSlots.push(`${h.toString().padStart(2, '0')}:00`)
 defaultSlots.push(`${h.toString().padStart(2, '0')}:30`)
 }
 slotMap[day.date] = defaultSlots
 }
 } catch {
 slotMap[day.date] = []
 }
 })
 await Promise.all(promises)
 setWeekSlots(slotMap)
 setSlotsLoading(false)
 }, [selectedProvider, selectedRole, twoWeekDates])

 useEffect(() => {
 if (step === 4) fetchWeekSlots()
 }, [step, fetchWeekSlots])

 // Filtered providers by selected specialty
 const filteredProviders = useMemo(() => {
 if (!selectedSpecialty) return providers
 return providers.filter(p => p.specializations.some(s => s.toLowerCase() === selectedSpecialty.toLowerCase()))
 }, [providers, selectedSpecialty])

 // All specialties from the selected role (from useProviderRoles hook)
 const roleSpecialties = useMemo(() => {
 if (!selectedRole) return []
 return selectedRole.specialties || []
 }, [selectedRole])

 // Resolve the active workflow — auto-pick when exactly one exists, else use user's choice
 const activeWorkflow = useMemo(() => {
 if (!selectedService) return null
 if (selectedWorkflowId) return selectedService.workflows.find(w => w.id === selectedWorkflowId) ?? null
 if (selectedService.workflows.length === 1) return selectedService.workflows[0]
 return null
 }, [selectedService, selectedWorkflowId])

 // Derive consultType from the selected workflow — no independent state needed
 const consultType = useMemo((): 'in_person' | 'home_visit' | 'video' => {
 if (!activeWorkflow) return 'in_person'
 return modeToConsultType(activeWorkflow.serviceMode)
 }, [activeWorkflow])

 const handleSubmit = async () => {
 if (!user || !selectedProvider || !selectedDate || !selectedTime) return
 setSubmitting(true)
 setError(null)

 try {
 // Universal booking endpoint — no role-specific branching
 const endpoint = '/api/bookings'

 const body = (() => {
 const b: Record<string, unknown> = {
   providerUserId: selectedProvider.id,
   providerType: selectedRole?.role || selectedRole?.code || '',
   scheduledDate: selectedDate,
   scheduledTime: selectedTime,
   type: consultType,
 }
 if (reason) b.reason = reason
 if (selectedService?.id) b.serviceId = selectedService.id
 if (selectedService?.serviceName) b.serviceName = selectedService.serviceName
 if (selectedService?.price != null) b.servicePrice = selectedService.price
 if (activeWorkflow?.id) b.workflowTemplateId = activeWorkflow.id
 if (selectedProvider.specializations?.[0] || selectedSpecialty) b.specialty = selectedProvider.specializations?.[0] || selectedSpecialty
 return b
 })()

 const res = await fetch(endpoint, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(body),
 credentials: 'include',
 })
 const json = await res.json()

 if (json.success || json.booking) {
 onCreated()
 onClose()
 resetForm()
 } else {
 setError(json.message || 'Failed to create booking')
 }
 } catch {
 setError('Network error')
 } finally {
 setSubmitting(false)
 }
 }

 const resetForm = () => {
 setStep(1)
 setSelectedRole(null)
 setSelectedSpecialty(null)
 setSelectedProvider(null)
 setSelectedService(null)
 setSelectedWorkflowId(null)
 setSelectedDate('')
 setSelectedTime('')
 setWeekOffset(0)
 setWeekSlots({})
 setReason('')
 setError(null)
 }

 const handleBack = () => {
 if (step === 2 && defaultProviderType) { onClose(); resetForm(); return }
 if (step === 3 && defaultProvider) { onClose(); resetForm(); return }
 setStep(step - 1)
 }

 // Count total steps dynamically
 const totalSteps = defaultProvider ? 3 : defaultProviderType ? 4 : 5
 const currentStepNum = defaultProvider ? step - 2 : defaultProviderType ? step - 1 : step

 if (!isOpen) return null

 return (
 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
 <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
 {/* Header */}
 <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
 <div className="flex items-center gap-2">
 {step > 1 && (
 <button onClick={handleBack} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
 <FaChevronLeft className="text-xs" />
 </button>
 )}
 <h3 className="text-lg font-bold text-gray-900">Book {selectedRole?.label?.replace(/s$/, '') || 'Appointment'}</h3>
 </div>
 <button onClick={() => { onClose(); resetForm() }} className="p-2 text-gray-400 hover:text-gray-600"><FaTimes /></button>
 </div>

 <div className="p-4 space-y-4">
 {/* Step indicator */}
 <div className="flex items-center gap-1 mb-1">
 {Array.from({ length: totalSteps }, (_, i) => (
 <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${currentStepNum >= i + 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
 ))}
 </div>

 {/* Step 1: Choose provider type (skipped if defaultProviderType) */}
 {step === 1 && (
 <div>
 <h4 className="text-sm font-semibold text-gray-800 mb-3">What type of provider?</h4>
 <div className="grid grid-cols-2 gap-2">
 {roles.map(r => (
 <button key={r.role} onClick={() => { setSelectedRole(r); setStep(2) }}
 className="p-3 border rounded-xl text-left hover:border-blue-300 hover:bg-blue-50 transition">
 <p className="font-medium text-sm text-gray-900">{r.label}</p>
 <p className="text-[10px] text-gray-400">{r.providerCount} available</p>
 </button>
 ))}
 </div>
 </div>
 )}

 {/* Step 2: Choose specialty + provider */}
 {step === 2 && (
 <div>
 {/* Specialty filter */}
 {roleSpecialties.length > 0 && (
 <div className="mb-3">
 <h4 className="text-sm font-semibold text-gray-800 mb-2">Specialty</h4>
 <div className="flex flex-wrap gap-1.5">
 <button onClick={() => setSelectedSpecialty(null)}
 className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${!selectedSpecialty ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
 All
 </button>
 {roleSpecialties.map(s => (
 <button key={s.name} onClick={() => setSelectedSpecialty(s.name)}
 className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${selectedSpecialty === s.name ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
 {s.name}
 </button>
 ))}
 </div>
 </div>
 )}

 <h4 className="text-sm font-semibold text-gray-800 mb-2">
 Choose a {selectedRole?.label?.replace(/s$/, '') || 'provider'}
 {filteredProviders.length > 0 && <span className="text-gray-400 font-normal ml-1">({filteredProviders.length})</span>}
 </h4>
 {loading ? <div className="flex justify-center py-8"><FaSpinner className="animate-spin text-blue-500" /></div> : (
 <div className="space-y-2 max-h-52 overflow-y-auto">
 {filteredProviders.map(p => (
 <button key={p.id} onClick={() => { setSelectedProvider(p); setStep(3) }}
 className="w-full p-3 border rounded-lg text-left hover:border-blue-300 hover:bg-blue-50 transition flex items-center gap-3">
 {p.profileImage ? (
 <Image src={p.profileImage} alt="" width={40} height={40} className="w-10 h-10 rounded-full object-cover border-2 border-blue-100 flex-shrink-0" />
 ) : (
 <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
 {p.firstName[0]}{p.lastName[0]}
 </div>
 )}
 <div className="flex-1 min-w-0">
 <p className="font-medium text-sm text-gray-900">
 {selectedRole?.role === 'DOCTOR' ? 'Dr. ' : ''}{p.firstName} {p.lastName}
 {p.verified && <span className="ml-1 text-green-500 text-[10px]">✓</span>}
 </p>
 {p.specializations.length > 0 && <p className="text-[10px] text-blue-600 truncate">{p.specializations.join(', ')}</p>}
 {p.address && <p className="text-[10px] text-gray-400 truncate">{p.address}</p>}
 </div>
 </button>
 ))}
 {filteredProviders.length === 0 && <p className="text-center py-4 text-gray-400 text-sm">No providers found{selectedSpecialty ? ` for "${selectedSpecialty}"` : ''}</p>}
 </div>
 )}
 </div>
 )}

 {/* Step 3: Choose service — consultation type derived from service workflows */}
 {step === 3 && (
 <div>
 <h4 className="text-sm font-semibold text-gray-800 mb-3">Select a service</h4>
 {services.length > 0 ? (
 <div className="space-y-2 max-h-52 overflow-y-auto mb-3">
 {services.map(s => {
 const isSelected = selectedService?.id === s.id
 return (
 <button key={s.id || s.serviceName}
 onClick={() => {
 setSelectedService(s)
 setSelectedWorkflowId(null) // will auto-pick when exactly one workflow
 }}
 className={`w-full p-3 border rounded-lg text-left transition ${isSelected ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-gray-50 border-gray-200'}`}>
 <div className="flex justify-between items-start gap-2">
 <div className="min-w-0">
 <span className="font-medium text-sm text-gray-900 block">{s.serviceName}</span>
 {s.duration && <span className="text-[10px] text-gray-400">{s.duration} min</span>}
 {s.workflows.length > 0 && (
 <div className="flex flex-wrap gap-1 mt-1">
 {s.workflows.map(w => (
 <span key={w.id} className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${MODE_COLORS[w.serviceMode] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
 {MODE_LABELS[w.serviceMode] ?? w.name}
 </span>
 ))}
 </div>
 )}
 </div>
 <span className="text-gray-700 font-semibold text-xs whitespace-nowrap">Rs {(s.price ?? 0).toLocaleString()}</span>
 </div>
 </button>
 )
 })}
 </div>
 ) : (
 <p className="text-xs text-gray-400 mb-3">No specific services listed — general consultation will be booked.</p>
 )}

 {/* When there are multiple workflows, user must pick one */}
 {selectedService && selectedService.workflows.length > 1 && (
 <div className="mb-3">
 <p className="text-xs font-medium text-gray-600 mb-2">How would you like this appointment? <span className="text-red-400">*</span></p>
 <div className="flex flex-wrap gap-2">
 {selectedService.workflows.map(w => {
 const isWfSelected = selectedWorkflowId === w.id
 return (
 <button key={w.id} onClick={() => setSelectedWorkflowId(w.id)}
 className={`flex-1 min-w-[100px] p-3 border-2 rounded-lg text-left transition ${isWfSelected ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200' : `border-gray-200 ${MODE_COLORS[w.serviceMode] ?? ''} hover:opacity-90`}`}>
 <span className={`text-[10px] font-bold uppercase tracking-wide block mb-0.5 ${isWfSelected ? 'text-blue-700' : ''}`}>
 {MODE_LABELS[w.serviceMode] ?? w.serviceMode}
 </span>
 <span className="text-xs font-medium text-gray-800 leading-tight">{w.name}</span>
 </button>
 )
 })}
 </div>
 </div>
 )}

 {/* When exactly one workflow, show it as a read-only badge */}
 {selectedService && selectedService.workflows.length === 1 && (
 <div className="mb-3 flex items-center gap-2">
 <span className="text-xs text-gray-500">Format:</span>
 <span className={`text-xs font-medium px-2 py-1 rounded-full border ${MODE_COLORS[selectedService.workflows[0].serviceMode] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
 {MODE_LABELS[selectedService.workflows[0].serviceMode] ?? selectedService.workflows[0].name}
 </span>
 </div>
 )}

 <button onClick={() => setStep(4)}
 disabled={(services.length > 0 && !selectedService) || (selectedService && selectedService.workflows.length > 1 && !selectedWorkflowId) || false}
 className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition">Continue</button>
 </div>
 )}

 {/* Step 4: Weekly calendar with time slots */}
 {step === 4 && (
 <div>
 <h4 className="text-base font-semibold text-gray-800 mb-1">Choose date & time</h4>
 <p className="text-xs text-gray-500 mb-4">
  Showing the next two weeks. Days with a green dot have open slots — already-booked times are hidden.
 </p>

 {/* Two-week day grid — stacked, no chevron navigation needed */}
 <div className="space-y-3 mb-5">
  {[0, 1].map(rowIdx => {
   const rowDays = twoWeekDates.slice(rowIdx * 7, rowIdx * 7 + 7)
   return (
    <div key={rowIdx}>
     <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
      {rowIdx === 0 ? 'This week' : 'Next week'}
     </p>
     <div className="grid grid-cols-7 gap-2">
      {rowDays.map(day => {
       const hasSlots = (weekSlots[day.date] || []).length > 0
       const isSelected = selectedDate === day.date
       return (
        <button
         key={day.date}
         onClick={() => { if (!day.isPast) { setSelectedDate(day.date); setSelectedTime('') } }}
         disabled={day.isPast}
         className={`flex flex-col items-center py-3 rounded-lg text-center transition ${
          isSelected ? 'bg-blue-600 text-white shadow-md' :
          day.isPast ? 'bg-gray-50 text-gray-300 cursor-not-allowed' :
          day.isToday ? 'bg-blue-50 text-blue-700 border border-blue-200' :
          'bg-white border border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
         }`}
        >
         <span className="text-[10px] font-semibold uppercase">{day.dayName}</span>
         <span className="text-lg font-bold">{day.dayNum}</span>
         <span className="text-[9px] text-gray-400">{day.monthShort}</span>
         {!day.isPast && hasSlots && !isSelected && (
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1" />
         )}
        </button>
       )
      })}
     </div>
    </div>
   )
  })}
 </div>

 {/* Time slots for selected day */}
 {slotsLoading && <div className="flex justify-center py-6"><FaSpinner className="animate-spin text-blue-500" /></div>}

 {!slotsLoading && selectedDate && (
 <div className="mb-4">
 {(() => {
 const daySlots = weekSlots[selectedDate] || []
 if (daySlots.length === 0) {
 return <p className="text-center py-4 text-gray-400 text-xs">No available slots for this day</p>
 }
 const morning = daySlots.filter(t => { const h = parseInt(t); return h >= 6 && h < 12 })
 const afternoon = daySlots.filter(t => { const h = parseInt(t); return h >= 12 && h < 17 })
 const evening = daySlots.filter(t => { const h = parseInt(t); return h >= 17 })

 const SlotGroup = ({ label, slots }: { label: string; slots: string[] }) => slots.length === 0 ? null : (
 <div className="mb-3">
 <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">{label} <span className="text-gray-400 font-normal">({slots.length})</span></p>
 <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
 {slots.map(time => (
 <button key={time} onClick={() => setSelectedTime(time)}
 className={`px-2 py-2.5 border rounded-lg text-sm font-medium transition ${
 selectedTime === time ? 'border-blue-500 bg-blue-600 text-white shadow' : 'border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300'
 }`}>
 {time}
 </button>
 ))}
 </div>
 </div>
 )

 return (
 <>
 <SlotGroup label="Morning" slots={morning} />
 <SlotGroup label="Afternoon" slots={afternoon} />
 <SlotGroup label="Evening" slots={evening} />
 </>
 )
 })()}
 </div>
 )}

 {!selectedDate && !slotsLoading && (
 <p className="text-center py-4 text-gray-400 text-xs">Select a day above to see available time slots</p>
 )}

 <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for visit (optional)"
 className="w-full px-3 py-2 border rounded-lg text-sm mb-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none" rows={2} />

 <button onClick={() => setStep(5)} disabled={!selectedDate || !selectedTime}
 className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition">Review Booking</button>
 </div>
 )}

 {/* Step 5: Confirm */}
 {step === 5 && (
 <div>
 <h4 className="text-sm font-semibold text-gray-800 mb-3">Review & Confirm</h4>
 <div className="bg-gray-50 rounded-lg p-4 space-y-2.5 text-sm mb-4">
 <div className="flex justify-between"><span className="text-gray-500">Provider</span><span className="font-medium">{selectedRole?.role === 'DOCTOR' ? 'Dr. ' : ''}{selectedProvider?.firstName || ''} {selectedProvider?.lastName || ''}</span></div>
 <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium text-blue-600">{selectedRole?.label}</span></div>
 <div className="flex justify-between"><span className="text-gray-500">Service</span><span className="font-medium">{selectedService?.serviceName || 'General Consultation'}</span></div>
 <div className="flex justify-between"><span className="text-gray-500">Format</span><span className="font-medium">{consultType === 'in_person' ? 'At Office' : consultType === 'home_visit' ? 'At Home' : 'Video Call'}</span></div>
 <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
 <div className="flex justify-between"><span className="text-gray-500">Time</span><span className="font-medium">{selectedTime}</span></div>
 {reason && <div className="flex justify-between"><span className="text-gray-500">Reason</span><span className="font-medium text-right max-w-[200px] truncate">{reason}</span></div>}
 {selectedService?.price != null && (
 <div className="flex justify-between border-t pt-2 mt-1"><span className="text-gray-600 font-medium">Estimated Price</span><span className="font-bold text-lg">Rs {(selectedService.price ?? 0).toLocaleString()}</span></div>
 )}
 </div>
 {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3"><p className="text-red-600 text-xs">{error}</p></div>}
 <button onClick={handleSubmit} disabled={submitting}
 className="w-full py-3 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 transition">
 {submitting ? <FaSpinner className="animate-spin" /> : <FaCalendarAlt />}
 {submitting ? 'Booking...' : 'Confirm Booking'}
 </button>
 </div>
 )}
 </div>
 </div>
 </div>
 )
}
