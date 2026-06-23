'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import WeeklySlotPicker from '@/components/booking/WeeklySlotPicker'
import { useUser } from '@/hooks/useUser'
import {
 FaCalendarAlt,
 FaClock,
 FaWallet,
 FaArrowLeft,
 FaArrowRight,
 FaCheck,
 FaLock,
} from 'react-icons/fa'
import { FiArrowRight } from 'react-icons/fi'

//  Types 

export interface BookingSubmitData {
 scheduledDate: string
 scheduledTime: string
 reason: string
 notes?: string
 duration?: number
 serviceId?: string           // platformServiceId of the selected service
 workflowTemplateId?: string  // specific workflow template chosen by the patient
 // Lab-specific
 testName?: string
 sampleType?: string
 // Emergency-specific
 emergencyType?: string
 location?: string
 contactNumber?: string
 priority?: string
 // Childcare
 children?: string[]
}

interface WorkflowStep {
 order: number
 label: string
 statusCode: string
}

interface WorkflowOption {
 id: string
 name: string
 serviceMode: string // 'office' | 'home' | 'video'
 steps: WorkflowStep[]
}

export interface ServiceOption {
 id: string
 serviceName: string
 category: string
 description: string
 price: number
 duration?: number
 /** All linked workflow templates - patient picks one when there are multiple */
 workflows: WorkflowOption[]
}

interface BookingFormProps {
 providerType: 'doctor' | 'nurse' | 'nanny' | 'lab-test' | 'emergency'
 providerId?: string
 providerName?: string
 providerSpecialty?: string
 providerImage?: string
 providerLocation?: string
 price?: number
 services?: ServiceOption[]
 onSubmit: (data: BookingSubmitData) => Promise<void>
 isSubmitting?: boolean
 walletBalance?: number
}

//  Helpers 

const MODE_LABELS: Record<string, string> = { office: 'In-Person', home: 'Home Visit', video: 'Video' }
const MODE_COLORS: Record<string, string> = {
 office: 'bg-sky-100 text-sky-700',
 home: 'bg-orange-100 text-orange-700',
 video: 'bg-purple-100 text-purple-700',
}

// Intentionally static - standard emergency classification categories
const EMERGENCY_TYPES = [
 'Medical',
 'Accident',
 'Fire',
 'Natural Disaster',
 'Other',
]

// Intentionally static - standard triage priority levels used across all emergency services
const PRIORITY_OPTIONS = [
 { value: 'low', label: 'Low', color: 'text-green-600 bg-green-50 border-green-200' },
 { value: 'medium', label: 'Medium', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
 { value: 'high', label: 'High', color: 'text-orange-600 bg-orange-50 border-orange-200' },
 { value: 'critical', label: 'Critical', color: 'text-red-600 bg-red-50 border-red-200' },
]

const DURATION_OPTIONS = [
 { value: 30, label: '30 minutes' },
 { value: 60, label: '1 hour' },
 { value: 90, label: '1 hour 30 min' },
 { value: 120, label: '2 hours' },
]

// Pre-set time slots shown for emergency bookings (no provider ID / slot API)
const EMERGENCY_TIME_SLOTS = [
 { value: 'next_available', label: 'Next Available', description: 'Dispatch immediately' },
 { value: 'within_30min', label: 'Within 30 min', description: 'Arrive in ~30 minutes' },
 { value: 'within_1hr', label: 'Within 1 hour', description: 'Arrive in ~1 hour' },
 { value: 'within_2hrs', label: 'Within 2 hours', description: 'Arrive in ~2 hours' },
]

// Quick lookup map used by formatTime to pretty-print emergency slot values
const EMERGENCY_TIME_SLOTS_MAP: Record<string, string> = Object.fromEntries(
 EMERGENCY_TIME_SLOTS.map((s) => [s.value, s.label])
)

function getInitials(name: string): string {
 return name
 .split(' ')
 .map((n) => n[0])
 .join('')
 .toUpperCase()
 .slice(0, 2)
}

function todayISO(): string {
 return new Date().toISOString().split('T')[0]
}

function formatDate(dateString: string): string {
 if (!dateString) return 'Not selected'
 return new Date(dateString).toLocaleDateString('en-US', {
 weekday: 'long',
 year: 'numeric',
 month: 'long',
 day: 'numeric',
 })
}

function formatTime(timeString: string): string {
 if (!timeString) return 'Not selected'
 // Emergency preset slot labels
 const emergencySlot = EMERGENCY_TIME_SLOTS_MAP[timeString]
 if (emergencySlot) return emergencySlot
 // Standard HH:MM time
 const [hours, minutes] = timeString.split(':')
 const h = parseInt(hours, 10)
 if (isNaN(h)) return timeString
 const amPm = h >= 12 ? 'PM' : 'AM'
 const displayHour = h % 12 || 12
 return `${displayHour}:${minutes} ${amPm}`
}

function getProviderLabel(type: BookingFormProps['providerType']): string {
 switch (type) {
 case 'doctor':
 return 'Doctor'
 case 'nurse':
 return 'Nurse'
 case 'nanny':
 return 'Nanny / Childcare'
 case 'lab-test':
 return 'Lab Test'
 case 'emergency':
 return 'Emergency Service'
 }
}

function getStepLabels(providerType: BookingFormProps['providerType']): string[] {
 switch (providerType) {
 case 'doctor':
 case 'nurse':
 case 'nanny':
 return ['Select a Service', 'Schedule', 'Review & Submit']
 case 'lab-test':
 return ['Test Details', 'Schedule', 'Review & Submit']
 case 'emergency':
 return ['Emergency Details', 'Schedule', 'Review & Submit']
 }
}

//  Component 

export default function BookingForm({
 providerType,
 providerId,
 providerName,
 providerSpecialty,
 providerImage,
 providerLocation,
 price,
 services,
 onSubmit,
 isSubmitting = false,
 walletBalance,
}: BookingFormProps) {
 const { user, loading: authLoading } = useUser()
 const pathname = usePathname()
 const loginUrl = `/login?redirect=${encodeURIComponent(pathname)}`

 const [step, setStep] = useState(1)

 // Form state
 const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(undefined)
 const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | undefined>(undefined)

 const selectedService = services?.find(s => s.id === selectedServiceId)
 // The active workflow: explicitly chosen by user, or the only one available, or default
 const activeWorkflow = useMemo(() => {
  if (!selectedService) return undefined
  if (selectedWorkflowId) return selectedService.workflows.find(w => w.id === selectedWorkflowId)
  if (selectedService.workflows.length === 1) return selectedService.workflows[0]
  return selectedService.workflows.find(w => w.id === (selectedService as any).defaultWorkflowId) ?? selectedService.workflows[0]
 }, [selectedService, selectedWorkflowId])

 const displayPrice = selectedService?.price ?? price
 const serviceDuration = selectedService?.duration ?? 30

 const [scheduledDate, setScheduledDate] = useState(providerType === 'emergency' ? todayISO() : '')
 const [scheduledTime, setScheduledTime] = useState('')
 const [reason, setReason] = useState('')
 const [notes, setNotes] = useState('')
 const [duration] = useState(30)

 // Lab-specific
 const [testName, setTestName] = useState('')
 const [sampleType, setSampleType] = useState('')

 // Emergency-specific
 const [emergencyType, setEmergencyType] = useState('')
 const [location, setLocation] = useState('')
 const [contactNumber, setContactNumber] = useState('')
 const [priority, setPriority] = useState('medium')

 const useSlotPicker = providerType !== 'emergency' && !!providerId
 const useEmergencySlots = providerType === 'emergency'

 const totalSteps = 3
 const stepLabels = getStepLabels(providerType)

 const isReasonRequired = providerType === 'doctor' || providerType === 'nurse'

 //  Validation 

 const canAdvanceStep1 = useMemo(() => {
 switch (providerType) {
 case 'doctor':
 case 'nurse':
 case 'nanny': {
 if (!selectedServiceId) return false
 // If the selected service has multiple workflows, the user must also pick one
 const svc = services?.find(s => s.id === selectedServiceId)
 if (svc && svc.workflows.length > 1 && !selectedWorkflowId) return false
 return true
 }
 case 'lab-test':
 return testName.trim().length > 0 && sampleType.trim().length > 0
 case 'emergency':
 return (
 emergencyType.trim().length > 0 &&
 location.trim().length > 0 &&
 contactNumber.trim().length > 0
 )
 }
 }, [providerType, selectedServiceId, selectedWorkflowId, services, testName, sampleType, emergencyType, location, contactNumber])

 const canAdvanceStep2 = useMemo(() => {
 const hasDate = scheduledDate.length > 0
 const hasTime = scheduledTime.length > 0
 const hasReason = !isReasonRequired || reason.trim().length > 0
 return hasDate && hasTime && hasReason
 }, [scheduledDate, scheduledTime, reason, isReasonRequired])

 // Helper text shown below the "Next" button when it is disabled
 const stepHint = useMemo(() => {
 if (step === 1 && !canAdvanceStep1) {
 switch (providerType) {
 case 'doctor':
 case 'nurse':
 case 'nanny':
 return 'Please select a service'
 case 'lab-test': {
 const missing: string[] = []
 if (!testName.trim()) missing.push('test name')
 if (!sampleType.trim()) missing.push('sample type')
 return `Please enter ${missing.join(' and ')}`
 }
 case 'emergency': {
 const missing: string[] = []
 if (!emergencyType.trim()) missing.push('emergency type')
 if (!location.trim()) missing.push('location')
 if (!contactNumber.trim()) missing.push('contact number')
 return `Please provide ${missing.join(', ')}`
 }
 }
 }
 if (step === 2 && !canAdvanceStep2) {
 const missing: string[] = []
 if (!scheduledDate) missing.push('a date')
 if (!scheduledTime) missing.push('a time')
 if (isReasonRequired && !reason.trim()) missing.push('a reason for visit')
 return `Please select ${missing.join(' and ')}`
 }
 return null
 }, [step, canAdvanceStep1, canAdvanceStep2, providerType, testName, sampleType, emergencyType, location, contactNumber, scheduledDate, scheduledTime, reason, isReasonRequired])

 //  Build submit data 

 function buildSubmitData(): BookingSubmitData {
 const data: BookingSubmitData = {
 scheduledDate,
 scheduledTime,
 reason,
 ...(notes ? { notes } : {}),
 duration: selectedService?.duration ?? duration,
 serviceId: selectedServiceId,
 workflowTemplateId: activeWorkflow?.id,
 }
 if (providerType === 'lab-test') {
 data.testName = testName
 data.sampleType = sampleType
 }
 if (providerType === 'emergency') {
 data.emergencyType = emergencyType
 data.location = location
 data.contactNumber = contactNumber
 data.priority = priority
 }
 return data
 }

 const [submitError, setSubmitError] = useState('')

 async function handleSubmit() {
 setSubmitError('')
 try {
 await onSubmit(buildSubmitData())
 } catch (err) {
 setSubmitError(err instanceof Error ? err.message : 'Booking failed. Please try again.')
 }
 }

 //  Navigation 

 function goNext() {
 if (step < totalSteps) setStep(step + 1)
 }

 function goBack() {
 if (step > 1) setStep(step - 1)
 }

 //  JSX 

 // Auth gate - show sign-in prompt if not authenticated
 if (!authLoading && !user) {
  return (
   <div className="bg-surface rounded-2xl p-8 shadow-lg border border-line max-w-md mx-auto text-center space-y-5">
    <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
     <FaLock className="text-blue-600 text-xl" />
    </div>
    <div>
     <h2 className="text-xl font-bold text-fg mb-2">Sign in to book</h2>
     <p className="text-soft text-sm">
      You need to be signed in to book an appointment with {providerName || 'this provider'}.
     </p>
    </div>
    <Link
     href={loginUrl}
     className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
    >
     Sign in to continue <FiArrowRight />
    </Link>
    <p className="text-xs text-faint">
     Don&apos;t have an account?{' '}
     <Link href="/signup" className="text-blue-600 hover:underline">Sign up free</Link>
    </p>
   </div>
  )
 }

 return (
 <div className="space-y-6">
 {/*  Provider Info Card  */}
 {providerName && (
 <div className="bg-surface rounded-2xl p-6 shadow-lg border border-line">
 <div className="flex items-center gap-4">
 {/* Avatar / initials */}
 {providerImage ? (
 <Image
 src={providerImage}
 alt={providerName}
 width={64}
 height={64}
 className="w-16 h-16 rounded-full object-cover border-2 border-blue-100"
 />
 ) : (
 <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold">
 {getInitials(providerName)}
 </div>
 )}

 <div className="flex-1 min-w-0">
 <h3 className="text-lg font-bold text-fg truncate">{providerName}</h3>
 {providerSpecialty && (
 <p className="text-sm text-blue-600 font-medium">{providerSpecialty}</p>
 )}
 {providerLocation && (
 <p className="text-sm text-soft truncate">{providerLocation}</p>
 )}
 </div>

 {displayPrice !== undefined && displayPrice > 0 && (
 <div className="text-right flex-shrink-0">
 <p className="text-xs text-soft uppercase tracking-wide">Fee</p>
 <p className="text-lg font-bold text-green-600">Rs {displayPrice.toLocaleString()}</p>
 {selectedService && (
 <p className="text-xs text-faint">{selectedService.serviceName}</p>
 )}
 </div>
 )}
 </div>
 </div>
 )}

 {/*  Step Indicator  */}
 <div className="bg-surface rounded-2xl p-5 shadow-lg border border-line">
 <div className="flex items-center justify-between max-w-lg mx-auto">
 {stepLabels.map((label, index) => {
 const stepNum = index + 1
 const isCompleted = step > stepNum
 const isCurrent = step === stepNum
 return (
 <div key={label} className="flex items-center">
 <div className="flex flex-col items-center">
 <div
 className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
 isCompleted
 ? 'bg-green-500 text-white'
 : isCurrent
 ? 'bg-blue-600 text-white'
 : 'bg-line text-soft'
 }`}
 >
 {isCompleted ? <FaCheck className="text-sm" /> : stepNum}
 </div>
 <span
 className={`text-xs mt-1.5 text-center whitespace-nowrap ${
 isCurrent ? 'text-blue-600 font-semibold' : isCompleted ? 'text-green-600 font-medium' : 'text-faint'
 }`}
 >
 {label}
 </span>
 </div>
 {index < stepLabels.length - 1 && (
 <div
 className={`w-12 sm:w-20 h-0.5 mx-2 transition-colors ${
 isCompleted ? 'bg-green-500' : 'bg-line'
 }`}
 />
 )}
 </div>
 )
 })}
 </div>
 </div>

 {/*  Step 1  */}
 {step === 1 && (
 <div className="bg-surface rounded-2xl p-6 sm:p-8 shadow-lg border border-line">
 <h2 className="text-xl font-bold text-fg mb-6">
 {providerType === 'lab-test'
 ? 'Test Details'
 : providerType === 'emergency'
 ? 'Emergency Details'
 : 'Select a Service'}
 </h2>

 {/* Doctor / Nurse / Nanny - service selection (required) */}
 {(providerType === 'doctor' || providerType === 'nurse' || providerType === 'nanny') && (
 <div className="space-y-5">
  {!services || services.length === 0 ? (
   <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-center">
    <p className="text-sm font-medium text-amber-800">No services available</p>
    <p className="text-xs text-amber-600 mt-1">This provider has no services with a configured workflow. Please try another provider.</p>
   </div>
  ) : (
   <div className="space-y-3">
    {services.map((svc) => {
     const isSelected = selectedServiceId === svc.id
     const primaryWorkflow = svc.workflows[0]
     return (
      <div
       key={svc.id}
       className={`rounded-xl border-2 transition-all ${
        isSelected
         ? 'border-[#0C6780] bg-sky-50 ring-2 ring-[#0C6780]/20'
         : 'border-line hover:border-line hover:bg-subtle'
       }`}
      >
       {/* Service header row - clickable to select */}
       <button
        type="button"
        onClick={() => {
         setSelectedServiceId(svc.id)
         // Reset workflow selection when changing service
         setSelectedWorkflowId(undefined)
        }}
        className="w-full text-left p-4"
       >
        <div className="flex justify-between items-start gap-2">
         <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
           <p className={`font-semibold text-sm ${isSelected ? 'text-[#0C6780]' : 'text-fg'}`}>
            {svc.serviceName}
           </p>
           {/* Mode badges - one per workflow */}
           {svc.workflows.map(wf => (
            <span key={wf.id} className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${MODE_COLORS[wf.serviceMode] || 'bg-subtle text-soft'}`}>
             {MODE_LABELS[wf.serviceMode] || wf.serviceMode}
            </span>
           ))}
          </div>
          <p className="text-xs text-soft">{svc.category}</p>
          {svc.description && <p className="text-xs text-faint mt-0.5 line-clamp-2">{svc.description}</p>}
         </div>
         <div className="flex-shrink-0 text-right">
          <p className={`font-bold text-sm ${isSelected ? 'text-green-600' : 'text-soft'}`}>
           Rs {(svc.price ?? 0).toLocaleString()}
          </p>
          {svc.duration && <p className="text-xs text-faint">{svc.duration} min</p>}
         </div>
        </div>
       </button>

       {/* Expanded details when selected */}
       {isSelected && (
        <div className="px-4 pb-4 space-y-3 border-t border-[#0C6780]/10 pt-3">

         {/* Workflow step timeline - show for the active / first workflow */}
         {primaryWorkflow && primaryWorkflow.steps.length > 0 && (
          <div>
           <p className="text-[11px] font-semibold text-soft uppercase tracking-wide mb-2">
            How this works
           </p>
           <div className="flex flex-wrap items-center gap-1">
            {[...primaryWorkflow.steps]
             .sort((a, b) => a.order - b.order)
             .map((s, i, arr) => (
              <div key={s.statusCode} className="flex items-center">
               <span className="px-2 py-1 bg-surface border border-line rounded-lg text-[10px] text-soft whitespace-nowrap shadow-sm">
                {s.label}
               </span>
               {i < arr.length - 1 && (
                <FiArrowRight className="w-3 h-3 text-[#0C6780] mx-0.5 flex-shrink-0" />
               )}
              </div>
            ))}
           </div>
          </div>
         )}

         {/* Multiple-workflow delivery-mode picker */}
         {svc.workflows.length > 1 && (
          <div>
           <p className="text-[11px] font-semibold text-soft uppercase tracking-wide mb-2">
            Choose delivery mode <span className="text-red-400">*</span>
           </p>
           <div className="flex flex-wrap gap-2">
            {svc.workflows.map(wf => {
             const isWfSelected = selectedWorkflowId === wf.id || (svc.workflows.length === 1 && !selectedWorkflowId)
             return (
              <button
               key={wf.id}
               type="button"
               onClick={() => setSelectedWorkflowId(wf.id)}
               className={`flex items-start gap-2 px-3 py-2 rounded-lg border-2 text-left transition-all ${
                isWfSelected
                 ? 'border-[#0C6780] bg-surface shadow-sm'
                 : 'border-line hover:border-line'
               }`}
              >
               <div>
                <div className="flex items-center gap-1.5">
                 <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${MODE_COLORS[wf.serviceMode] || 'bg-subtle text-soft'}`}>
                  {MODE_LABELS[wf.serviceMode] || wf.serviceMode}
                 </span>
                 {isWfSelected && <FaCheck className="w-2.5 h-2.5 text-[#0C6780]" />}
                </div>
                <p className="text-xs text-soft font-medium mt-0.5">{wf.name}</p>
                {/* Mini step list for this specific workflow */}
                {wf.steps.length > 0 && (
                 <p className="text-[9px] text-faint mt-0.5 max-w-[160px]">
                  {[...wf.steps].sort((a,b)=>a.order-b.order).map(s=>s.label).join('  ')}
                 </p>
                )}
               </div>
              </button>
             )
            })}
           </div>
          </div>
         )}
        </div>
       )}
      </div>
     )
    })}
   </div>
  )}
 </div>
 )}

 {/* Lab-test - test name and sample type inputs */}
 {providerType === 'lab-test' && (
 <div className="space-y-5">
 <div>
 <label className="block text-sm font-medium text-soft mb-2">
 Test Name <span className="text-red-500">*</span>
 </label>
 <input
 type="text"
 value={testName}
 onChange={(e) => setTestName(e.target.value)}
 placeholder="e.g. Complete Blood Count, Lipid Panel"
 className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition-colors"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-soft mb-2">
 Sample Type <span className="text-red-500">*</span>
 </label>
 <input
 type="text"
 value={sampleType}
 onChange={(e) => setSampleType(e.target.value)}
 placeholder="e.g. Blood, Urine, Saliva"
 className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition-colors"
 />
 </div>
 </div>
 )}

 {/* Emergency - emergency type, location, contact, priority */}
 {providerType === 'emergency' && (
 <div className="space-y-5">
 <div>
 <label className="block text-sm font-medium text-soft mb-2">
 Emergency Type <span className="text-red-500">*</span>
 </label>
 <select
 value={emergencyType}
 onChange={(e) => setEmergencyType(e.target.value)}
 className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition-colors bg-surface"
 >
 <option value="">Select emergency type</option>
 {EMERGENCY_TYPES.map((type) => (
 <option key={type} value={type}>
 {type}
 </option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-sm font-medium text-soft mb-2">
 Location <span className="text-red-500">*</span>
 </label>
 <input
 type="text"
 value={location}
 onChange={(e) => setLocation(e.target.value)}
 placeholder="Full address or landmark"
 className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition-colors"
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-soft mb-2">
 Contact Number <span className="text-red-500">*</span>
 </label>
 <input
 type="tel"
 value={contactNumber}
 onChange={(e) => setContactNumber(e.target.value)}
 placeholder="+230 5XXX XXXX"
 className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition-colors"
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-soft mb-3">Priority</label>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 {PRIORITY_OPTIONS.map((opt) => (
 <button
 key={opt.value}
 type="button"
 onClick={() => setPriority(opt.value)}
 className={`px-4 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all ${
 priority === opt.value
 ? opt.color + ' ring-2 ring-offset-1'
 : 'border-line text-soft hover:bg-subtle'
 }`}
 >
 {opt.label}
 </button>
 ))}
 </div>
 </div>
 </div>
 )}
 </div>
 )}

 {/*  Step 2 - Schedule  */}
 {step === 2 && (
 <div className="bg-surface rounded-2xl p-6 sm:p-8 shadow-lg border border-line">
 <h2 className="text-xl font-bold text-fg mb-6">Schedule Appointment</h2>

 <div className="space-y-6">
 {/* Weekly Slot Picker or Emergency Slots */}
 <div>
 <label className="flex items-center gap-2 text-sm font-medium text-soft mb-3">
 <FaClock className="text-teal-600" />
 {useEmergencySlots ? 'Response Time' : 'Select a Time Slot'} <span className="text-red-500">*</span>
 </label>

 {useSlotPicker && providerId ? (
 <WeeklySlotPicker
 providerId={providerId}
 providerType={providerType as 'doctor' | 'nurse' | 'nanny' | 'lab-test'}
 onSelect={(date, time) => { setScheduledDate(date); setScheduledTime(time) }}
 selectedDate={scheduledDate}
 selectedTime={scheduledTime}
 accentColor="blue"
 serviceDuration={serviceDuration}
 />
 ) : useEmergencySlots ? (
 <>
 <div className="mb-4">
 <label className="flex items-center gap-2 text-sm font-medium text-soft mb-2">
 <FaCalendarAlt className="text-blue-600" />
 Date
 </label>
 <input
 type="date"
 value={scheduledDate}
 onChange={(e) => setScheduledDate(e.target.value)}
 min={todayISO()}
 className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition-colors"
 />
 </div>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 {EMERGENCY_TIME_SLOTS.map((slot) => (
 <button
 key={slot.value}
 type="button"
 onClick={() => setScheduledTime(slot.value)}
 className={`flex flex-col items-center p-4 border-2 rounded-xl text-sm font-medium transition-all ${
 scheduledTime === slot.value
 ? 'bg-red-600 text-white border-red-600 shadow-md'
 : 'border-line text-soft hover:border-red-400 hover:bg-red-50'
 }`}
 >
 <span className="font-semibold">{slot.label}</span>
 <span className={`text-xs mt-0.5 ${scheduledTime === slot.value ? 'text-red-100' : 'text-faint'}`}>
 {slot.description}
 </span>
 </button>
 ))}
 </div>
 </>
 ) : (
 <div className="grid sm:grid-cols-2 gap-4">
 <div>
 <label className="flex items-center gap-2 text-sm font-medium text-soft mb-2">
 <FaCalendarAlt className="text-blue-600" />
 Date
 </label>
 <input
 type="date"
 value={scheduledDate}
 onChange={(e) => setScheduledDate(e.target.value)}
 min={todayISO()}
 className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition-colors"
 />
 </div>
 <div>
 <label className="flex items-center gap-2 text-sm font-medium text-soft mb-2">
 <FaClock className="text-teal-600" />
 Time
 </label>
 <input
 type="time"
 value={scheduledTime}
 onChange={(e) => setScheduledTime(e.target.value)}
 className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition-colors"
 />
 </div>
 </div>
 )}
 </div>

 {/* Reason */}
 <div>
 <label className="block text-sm font-medium text-soft mb-2">
 Reason for Visit{isReasonRequired && <span className="text-red-500"> *</span>}
 </label>
 <textarea
 value={reason}
 onChange={(e) => setReason(e.target.value)}
 rows={3}
 placeholder={
 providerType === 'doctor'
 ? 'Describe your symptoms or reason for consultation...'
 : providerType === 'nurse'
 ? 'Describe the care you need...'
 : providerType === 'nanny'
 ? 'Describe childcare requirements (optional)...'
 : providerType === 'lab-test'
 ? 'Any additional context for the lab test (optional)...'
 : 'Describe the situation (optional)...'
 }
 className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition-colors resize-none"
 />
 </div>
 </div>
 </div>
 )}

 {/*  Step 3 - Review & Submit  */}
 {step === 3 && (
 <div className="space-y-6">
 {/* Summary card */}
 <div className="bg-surface rounded-2xl p-6 sm:p-8 shadow-lg border border-line">
 <h2 className="text-xl font-bold text-fg mb-6">Review Booking</h2>

 <div className=" rounded-xl p-5 border border-blue-100">
 <div className="grid sm:grid-cols-2 gap-4 text-sm">
 {/* Provider */}
 {providerName && (
 <div>
 <span className="text-soft">{getProviderLabel(providerType)}</span>
 <p className="font-semibold text-fg">{providerName}</p>
 </div>
 )}

 {/* Selected service + delivery mode */}
 {selectedService && (
 <div>
 <span className="text-soft">Service</span>
 <p className="font-semibold text-fg flex flex-wrap items-center gap-2">
 {selectedService.serviceName}
 {activeWorkflow && (
 <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${MODE_COLORS[activeWorkflow.serviceMode] || 'bg-subtle text-soft'}`}>
  {MODE_LABELS[activeWorkflow.serviceMode] || activeWorkflow.serviceMode}
 </span>
 )}
 </p>
 {activeWorkflow && activeWorkflow.steps.length > 0 && (
 <div className="flex flex-wrap items-center gap-0.5 mt-1">
  {[...activeWorkflow.steps].sort((a,b)=>a.order-b.order).map((s,i,arr)=>(
   <span key={s.statusCode} className="flex items-center gap-0.5">
    <span className="text-[9px] text-faint bg-subtle px-1.5 py-0.5 rounded">{s.label}</span>
    {i < arr.length-1 && <FiArrowRight className="w-2 h-2 text-faint" />}
   </span>
  ))}
 </div>
 )}
 </div>
 )}

 {/* Lab details */}
 {providerType === 'lab-test' && (
 <>
 <div>
 <span className="text-soft">Test Name</span>
 <p className="font-semibold text-fg">{testName}</p>
 </div>
 <div>
 <span className="text-soft">Sample Type</span>
 <p className="font-semibold text-fg">{sampleType}</p>
 </div>
 </>
 )}

 {/* Emergency details */}
 {providerType === 'emergency' && (
 <>
 <div>
 <span className="text-soft">Emergency Type</span>
 <p className="font-semibold text-fg">{emergencyType}</p>
 </div>
 <div>
 <span className="text-soft">Location</span>
 <p className="font-semibold text-fg">{location}</p>
 </div>
 <div>
 <span className="text-soft">Contact Number</span>
 <p className="font-semibold text-fg">{contactNumber}</p>
 </div>
 <div>
 <span className="text-soft">Priority</span>
 <p className="font-semibold text-fg capitalize">{priority}</p>
 </div>
 </>
 )}

 {/* Schedule */}
 <div>
 <span className="text-soft">Date</span>
 <p className="font-semibold text-fg">{formatDate(scheduledDate)}</p>
 </div>
 <div>
 <span className="text-soft">Time</span>
 <p className="font-semibold text-fg">{formatTime(scheduledTime)}</p>
 </div>
 <div>
 <span className="text-soft">Duration</span>
 <p className="font-semibold text-fg">
 {DURATION_OPTIONS.find((d) => d.value === duration)?.label ?? `${duration} min`}
 </p>
 </div>

 {/* Reason */}
 {reason && (
 <div className="sm:col-span-2">
 <span className="text-soft">Reason</span>
 <p className="font-semibold text-fg">{reason}</p>
 </div>
 )}

 {/* Service */}
 {selectedService && (
 <div>
 <span className="text-soft">Service</span>
 <p className="font-semibold text-fg">{selectedService.serviceName}</p>
 </div>
 )}

 {/* Fee */}
 {displayPrice !== undefined && displayPrice > 0 && (
 <div>
 <span className="text-soft">Consultation Fee</span>
 <p className="font-bold text-green-600 text-base">
 Rs {displayPrice.toLocaleString()}
 </p>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Wallet balance */}
 {walletBalance !== undefined && (
 <div className="bg-surface rounded-2xl p-6 shadow-lg border border-line">
 <div className="flex items-center gap-3 mb-3">
 <FaWallet className="text-blue-600 text-lg" />
 <h3 className="font-semibold text-fg">Wallet</h3>
 </div>
 <p className="text-soft">
 Your trial balance:{' '}
 <span className="font-bold text-blue-600">Rs {walletBalance.toLocaleString()}</span>
 </p>
 {displayPrice !== undefined && displayPrice > 0 && walletBalance < displayPrice && (
 <div className="mt-3 flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
 <span className="text-yellow-600 font-bold text-lg leading-none">!</span>
 <p className="text-sm text-yellow-800">
 Your wallet balance (Rs {walletBalance.toLocaleString()}) is less than the
 consultation fee (Rs {displayPrice.toLocaleString()}). You may not be able to complete
 this booking.
 </p>
 </div>
 )}
 </div>
 )}

 {/* Notes */}
 <div className="bg-surface rounded-2xl p-6 shadow-lg border border-line">
 <label className="block text-sm font-medium text-soft mb-2">
 Additional Notes (optional)
 </label>
 <textarea
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 rows={3}
 placeholder="Any additional information for the provider..."
 className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition-colors resize-none"
 />
 </div>
 </div>
 )}

 {/*  Submission Error  */}
 {submitError && (
 <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
 <span className="text-red-500 text-lg font-bold leading-none mt-0.5">!</span>
 <div>
 <p className="text-red-800 font-medium text-sm">Booking Failed</p>
 <p className="text-red-700 text-sm mt-0.5">{submitError}</p>
 </div>
 </div>
 )}

 {/*  Navigation Buttons  */}
 <div className="flex justify-between items-center">
 {step > 1 ? (
 <button
 type="button"
 onClick={goBack}
 className="flex items-center gap-2 px-6 py-3 border border-line text-soft rounded-lg hover:bg-subtle transition-colors font-medium"
 >
 <FaArrowLeft className="text-sm" />
 Back
 </button>
 ) : (
 <div />
 )}

 {step < totalSteps ? (
 <div className="flex flex-col items-end">
 <button
 type="button"
 onClick={goNext}
 disabled={step === 1 ? !canAdvanceStep1 : !canAdvanceStep2}
 className="flex items-center gap-2 text-white px-8 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
 >
 Next
 <FaArrowRight className="text-sm" />
 </button>
 {stepHint && (
 <p className="text-xs text-amber-600 mt-1">{stepHint}</p>
 )}
 </div>
 ) : (
 <button
 type="button"
 onClick={handleSubmit}
 disabled={isSubmitting}
 className="flex items-center gap-2 text-white px-8 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {isSubmitting ? (
 <>
 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
 Submitting...
 </>
 ) : (
 <>
 <FaCheck className="text-sm" />
 Confirm Booking
 </>
 )}
 </button>
 )}
 </div>
 </div>
 )
}
