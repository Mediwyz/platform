'use client'

import { useState, useEffect, useRef } from 'react'
import { FiPlus, FiSave, FiArrowLeft, FiZap, FiX, FiRefreshCw, FiTrash2, FiMenu } from 'react-icons/fi'
import Link from 'next/link'
import { type WorkflowStep, type StepAction } from './StepEditor'
import WorkflowPreview from './WorkflowPreview'
import { STEP_ICON_EMOJI, inferStepIcon } from '../stepIconRegistry'
export type { WorkflowStep, StepAction }

const FALLBACK_PROVIDER_TYPES = [
  'DOCTOR', 'NURSE', 'NANNY', 'LAB_TECHNICIAN', 'EMERGENCY_WORKER',
  'PHARMACIST', 'CAREGIVER', 'PHYSIOTHERAPIST',
  'DENTIST', 'OPTOMETRIST', 'NUTRITIONIST',
]

const SERVICE_MODES = [
  { value: 'office',    label: 'In-office visit' },
  { value: 'home',      label: 'Home visit' },
  { value: 'video',     label: 'Video call' },
  { value: 'audio',     label: 'Audio / phone call' },
  { value: 'delivery',  label: 'Delivery / dispensing' },
  { value: 'emergency', label: 'Emergency response' },
  { value: 'recurrent', label: 'Recurrent programme' },
  { value: 'async',     label: 'Async / remote review' },
]

const PAYMENT_TIMING_OPTIONS = [
  { value: 'ON_ACCEPTANCE', label: 'On Acceptance (standard)' },
  { value: 'IMMEDIATE',     label: 'Immediate (on order)' },
  { value: 'ON_COMPLETION', label: 'On Completion (per session)' },
  { value: 'PAY_LATER',     label: 'Pay Later (invoice)' },
]

const SAMPLE_OPTIONS = [
  { value: 'none',     label: 'None - no sample needed' },
  { value: 'home',     label: 'Home collection (provider brings kit)' },
  { value: 'office',   label: 'Office collection (patient attends)' },
  { value: 'self_kit', label: 'Self-collection kit (patient mails sample)' },
]

const OUTPUT_OPTIONS = [
  { value: 'none',           label: 'None - advice / procedure only' },
  { value: 'prescription',   label: 'Prescription (medication)' },
  { value: 'lab_result',     label: 'Lab result' },
  { value: 'exam_report',    label: 'Examination report' },
  { value: 'care_notes',     label: 'Care / visit notes' },
  { value: 'eye_prescription', label: 'Eye prescription' },
  { value: 'exercise_plan',  label: 'Exercise / rehab plan' },
  { value: 'meal_plan',      label: 'Nutrition / meal plan' },
  { value: 'dental_chart',   label: 'Dental chart / treatment plan' },
]

const CUSTOM_STEP_EMOJIS = [
  '📋','✅','⏳','🔍','📝','💬','📞','🚗',
  '🏥','🩺','💊','🩹','🧪','🔬','📄','🤝',
  '💪','🌡️','🫀','🧠','👁️','🦷','🩻','🧬',
  '🏃','🛏️','📦','🔑','🌟','🎯','📱','✍️',
]

// Status codes that the engine auto-generates - used to classify legacy steps on load.
const KNOWN_SYSTEM_CODES = new Set([
  'pending','submitted','confirmed','in_progress','session_active','session_notes_pending',
  'video_call_active','audio_call_active','at_location','travelling','en_route','on_scene',
  'dispatched','transporting','preparing','out_for_delivery','under_review','intake_assessment',
  'sample_collected','processing','results_ready','prescription_issued','exam_complete',
  'prescription_written','care_notes_written','plan_delivered','meal_plan_created',
  'treatment_planned','completed','cancelled',
])

function classifyInitialSteps(steps: WorkflowStep[]): WorkflowStep[] {
  return steps.map(s => ({
    ...s,
    kind: s.kind ?? (KNOWN_SYSTEM_CODES.has(s.statusCode) ? 'system' : 'custom'),
  }))
}

function makeUniqueCode(label: string, existingCodes: string[]): string {
  const base = 'custom_' + (label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'step')
  if (!existingCodes.includes(base)) return base
  let i = 2
  while (existingCodes.includes(`${base}_${i}`)) i++
  return `${base}_${i}`
}

function derivePaymentTiming(mode: string): string {
  if (mode === 'delivery')  return 'IMMEDIATE'
  if (mode === 'emergency') return 'PAY_LATER'
  if (mode === 'recurrent') return 'ON_COMPLETION'
  return 'ON_ACCEPTANCE'
}

// ─── Step template library ────────────────────────────────────────────────

type PartialStep = Omit<WorkflowStep, 'order'>

// All template-defined steps are system steps - locked in the builder UI.
const T = (s: PartialStep): PartialStep => ({ kind: 'system', ...s })

const PENDING = T({ statusCode: 'pending', label: 'Request sent', flags: {},
  actionsForPatient: [{ action: 'cancel', label: 'Cancel', targetStatus: 'cancelled', style: 'danger' }],
  actionsForProvider: [
    { action: 'accept', label: 'Accept', targetStatus: 'confirmed', style: 'primary' },
    { action: 'deny',   label: 'Decline', targetStatus: 'cancelled', style: 'danger' },
  ],
  notifyProvider: { title: 'New booking request', message: '{{patientName}} booked {{serviceName}}.' },
  notifyPatient: null,
})

const CONFIRMED = (nextStatus: string, nextLabel: string): PartialStep => T({
  statusCode: 'confirmed', label: 'Confirmed', flags: {},
  actionsForPatient: [{ action: 'cancel', label: 'Cancel', targetStatus: 'cancelled', style: 'danger' }],
  actionsForProvider: [{ action: 'start', label: nextLabel, targetStatus: nextStatus, style: 'primary' }],
  notifyPatient: { title: 'Booking confirmed', message: 'Your appointment with {{providerName}} is confirmed.' },
  notifyProvider: null,
})

const COMPLETED = T({ statusCode: 'completed', label: 'Completed', flags: {},
  actionsForPatient: [], actionsForProvider: [],
  notifyPatient: { title: 'Completed', message: 'Your session is complete. Please leave a review.' },
  notifyProvider: null,
})

const CANCELLED = T({ statusCode: 'cancelled', label: 'Cancelled', flags: {},
  actionsForPatient: [], actionsForProvider: [],
  notifyPatient: { title: 'Cancelled', message: 'Your booking was cancelled. A refund will be processed if applicable.' },
  notifyProvider: null,
})

const BASE_STEPS: Record<string, PartialStep[]> = {
  office: [
    PENDING,
    CONFIRMED('in_progress', 'Start session'),
    T({ statusCode: 'in_progress', label: 'In session', flags: {},
      actionsForPatient: [], actionsForProvider: [{ action: 'complete', label: 'Complete', targetStatus: 'completed', style: 'primary' }],
      notifyPatient: { title: 'Session started', message: 'Your session with {{providerName}} has started.' }, notifyProvider: null }),
  ],
  home: [
    PENDING,
    CONFIRMED('travelling', 'On my way'),
    T({ statusCode: 'travelling', label: 'Provider en route', flags: {},
      actionsForPatient: [], actionsForProvider: [{ action: 'arrive', label: 'Arrived', targetStatus: 'at_location', style: 'primary' }],
      notifyPatient: { title: 'Provider on the way', message: '{{providerName}} is heading to you. ETA: {{eta}}' }, notifyProvider: null }),
    T({ statusCode: 'at_location', label: 'Provider arrived', flags: {},
      actionsForPatient: [], actionsForProvider: [{ action: 'start', label: 'Start', targetStatus: 'in_progress', style: 'primary' }],
      notifyPatient: { title: 'Arrived', message: '{{providerName}} has arrived at your location.' }, notifyProvider: null }),
    T({ statusCode: 'in_progress', label: 'In progress', flags: {},
      actionsForPatient: [], actionsForProvider: [{ action: 'complete', label: 'Complete', targetStatus: 'completed', style: 'primary' }],
      notifyPatient: null, notifyProvider: null }),
  ],
  video: [
    PENDING,
    CONFIRMED('video_call_active', 'Start video call'),
    T({ statusCode: 'video_call_active', label: 'Video call', flags: { triggers_video_call: true },
      actionsForPatient: [], actionsForProvider: [{ action: 'complete', label: 'End & complete', targetStatus: 'completed', style: 'primary' }],
      notifyPatient: { title: 'Video call ready', message: 'Join your video consultation with {{providerName}} now.' }, notifyProvider: null }),
  ],
  audio: [
    PENDING,
    CONFIRMED('audio_call_active', 'Start call'),
    T({ statusCode: 'audio_call_active', label: 'Audio call', flags: { triggers_audio_call: true },
      actionsForPatient: [], actionsForProvider: [{ action: 'complete', label: 'End & complete', targetStatus: 'completed', style: 'primary' }],
      notifyPatient: { title: 'Call ready', message: 'Your audio consultation with {{providerName}} has started.' }, notifyProvider: null }),
  ],
  delivery: [
    T({ statusCode: 'pending', label: 'Order placed', flags: {},
      actionsForPatient: [{ action: 'cancel', label: 'Cancel', targetStatus: 'cancelled', style: 'danger' }],
      actionsForProvider: [
        { action: 'confirm', label: 'Confirm order', targetStatus: 'confirmed', style: 'primary' },
        { action: 'cancel',  label: 'Decline', targetStatus: 'cancelled', style: 'danger' },
      ],
      notifyProvider: { title: 'New order', message: '{{patientName}} placed an order for {{serviceName}}.' }, notifyPatient: null }),
    T({ statusCode: 'confirmed', label: 'Order confirmed', flags: {},
      actionsForPatient: [], actionsForProvider: [{ action: 'prepare', label: 'Start preparing', targetStatus: 'preparing', style: 'primary' }],
      notifyPatient: { title: 'Order confirmed', message: 'Your order is confirmed and being prepared.' }, notifyProvider: null }),
    T({ statusCode: 'preparing', label: 'Preparing', flags: {},
      actionsForPatient: [], actionsForProvider: [{ action: 'dispatch', label: 'Dispatched', targetStatus: 'out_for_delivery', style: 'primary' }],
      notifyPatient: null, notifyProvider: null }),
    T({ statusCode: 'out_for_delivery', label: 'Out for delivery', flags: {},
      actionsForPatient: [], actionsForProvider: [{ action: 'delivered', label: 'Mark delivered', targetStatus: 'completed', style: 'primary' }],
      notifyPatient: { title: 'On the way', message: 'Your order is out for delivery.' }, notifyProvider: null }),
  ],
  emergency: [
    T({ statusCode: 'dispatched', label: 'Dispatched', flags: {},
      actionsForPatient: [], actionsForProvider: [{ action: 'en_route', label: 'En route', targetStatus: 'en_route', style: 'primary' }],
      notifyPatient: { title: 'Help dispatched', message: 'Emergency responder is on the way to you.' }, notifyProvider: null }),
    T({ statusCode: 'en_route', label: 'En route', flags: {},
      actionsForPatient: [], actionsForProvider: [{ action: 'on_scene', label: 'On scene', targetStatus: 'on_scene', style: 'primary' }],
      notifyPatient: { title: 'Responder approaching', message: 'Estimated arrival: {{eta}}' }, notifyProvider: null }),
    T({ statusCode: 'on_scene', label: 'On scene', flags: {},
      actionsForPatient: [],
      actionsForProvider: [
        { action: 'resolve',   label: 'Resolved on scene', targetStatus: 'completed', style: 'primary' },
        { action: 'transport', label: 'Transporting to facility', targetStatus: 'transporting', style: 'secondary' },
      ],
      notifyPatient: { title: 'Responder on scene', message: 'Emergency responder has arrived.' }, notifyProvider: null }),
    T({ statusCode: 'transporting', label: 'Transporting', flags: {},
      actionsForPatient: [], actionsForProvider: [{ action: 'handoff', label: 'Facility handoff', targetStatus: 'completed', style: 'primary' }],
      notifyPatient: null, notifyProvider: null }),
  ],
  recurrent: [
    PENDING,
    T({ statusCode: 'intake_assessment', label: 'Intake assessment', flags: { requires_content: 'care_notes' },
      actionsForPatient: [], actionsForProvider: [{ action: 'create_protocol', label: 'Create protocol', targetStatus: 'confirmed', style: 'primary' }],
      notifyPatient: { title: 'Assessment scheduled', message: 'Your intake assessment with {{providerName}} is scheduled.' }, notifyProvider: null }),
    T({ statusCode: 'confirmed', label: 'Programme active', flags: {},
      actionsForPatient: [], actionsForProvider: [{ action: 'start_session', label: 'Start session', targetStatus: 'session_active', style: 'primary' }],
      notifyPatient: { title: 'Programme confirmed', message: 'Your treatment programme has been created by {{providerName}}.' }, notifyProvider: null }),
    T({ statusCode: 'session_active', label: 'Session active', flags: {},
      actionsForPatient: [], actionsForProvider: [{ action: 'end_session', label: 'End session', targetStatus: 'session_notes_pending', style: 'primary' }],
      notifyPatient: null, notifyProvider: null }),
    T({ statusCode: 'session_notes_pending', label: 'Session notes', flags: { requires_content: 'care_notes' },
      actionsForPatient: [],
      actionsForProvider: [
        { action: 'next_session', label: 'Schedule next session', targetStatus: 'confirmed', style: 'primary' },
        { action: 'discharge',    label: 'Discharge patient',     targetStatus: 'completed', style: 'secondary' },
      ],
      notifyPatient: { title: 'Session complete', message: 'Session notes are being prepared by {{providerName}}.' }, notifyProvider: null }),
  ],
  async: [
    T({ statusCode: 'pending', label: 'Submitted', flags: {},
      actionsForPatient: [{ action: 'cancel', label: 'Cancel', targetStatus: 'cancelled', style: 'danger' }],
      actionsForProvider: [
        { action: 'review', label: 'Start review', targetStatus: 'under_review', style: 'primary' },
        { action: 'deny',   label: 'Decline',      targetStatus: 'cancelled', style: 'danger' },
      ],
      notifyProvider: { title: 'New request', message: '{{patientName}} submitted a request for {{serviceName}}.' }, notifyPatient: null }),
    T({ statusCode: 'under_review', label: 'Under review', flags: {},
      actionsForPatient: [], actionsForProvider: [{ action: 'complete', label: 'Send response', targetStatus: 'completed', style: 'primary' }],
      notifyPatient: { title: 'Request under review', message: 'Your request is being reviewed by {{providerName}}.' }, notifyProvider: null }),
  ],
}

const SAMPLE_STEPS: PartialStep[] = [
  T({ statusCode: 'sample_collected', label: 'Sample collected', flags: {},
    actionsForPatient: [], actionsForProvider: [{ action: 'process', label: 'Send to lab', targetStatus: 'processing', style: 'primary' }],
    notifyPatient: { title: 'Sample collected', message: 'Your sample has been collected and sent for analysis.' }, notifyProvider: null }),
  T({ statusCode: 'processing', label: 'Processing', flags: {},
    actionsForPatient: [], actionsForProvider: [{ action: 'results_ready', label: 'Results ready', targetStatus: 'results_ready', style: 'primary' }],
    notifyPatient: null, notifyProvider: null }),
  T({ statusCode: 'results_ready', label: 'Results ready', flags: { requires_content: 'lab_result' },
    actionsForPatient: [], actionsForProvider: [{ action: 'complete', label: 'Complete', targetStatus: 'completed', style: 'primary' }],
    notifyPatient: { title: 'Results available', message: 'Your lab results are ready to view.' }, notifyProvider: null }),
]

const OUTPUT_STEPS: Record<string, PartialStep> = {
  prescription:     T({ statusCode: 'prescription_issued', label: 'Prescription', flags: { requires_content: 'prescription' },
    actionsForPatient: [], actionsForProvider: [{ action: 'complete', label: 'Complete', targetStatus: 'completed', style: 'primary' }],
    notifyPatient: { title: 'Prescription ready', message: 'Your prescription is ready.' }, notifyProvider: null }),
  exam_report:      T({ statusCode: 'exam_complete', label: 'Exam report', flags: { requires_content: 'report' },
    actionsForPatient: [], actionsForProvider: [{ action: 'complete', label: 'Complete', targetStatus: 'completed', style: 'primary' }],
    notifyPatient: { title: 'Report ready', message: 'Your examination report is ready.' }, notifyProvider: null }),
  eye_prescription:  T({ statusCode: 'prescription_written', label: 'Eye prescription', flags: { requires_content: 'eye_prescription' },
    actionsForPatient: [], actionsForProvider: [{ action: 'complete', label: 'Complete', targetStatus: 'completed', style: 'primary' }],
    notifyPatient: { title: 'Prescription ready', message: 'Your eye prescription is ready.' }, notifyProvider: null }),
  care_notes:        T({ statusCode: 'care_notes_written', label: 'Care notes', flags: { requires_content: 'care_notes' },
    actionsForPatient: [], actionsForProvider: [{ action: 'complete', label: 'Complete', targetStatus: 'completed', style: 'primary' }],
    notifyPatient: { title: 'Notes ready', message: 'Your care notes are ready.' }, notifyProvider: null }),
  exercise_plan:     T({ statusCode: 'plan_delivered', label: 'Exercise plan', flags: { requires_content: 'exercise_plan' },
    actionsForPatient: [], actionsForProvider: [{ action: 'complete', label: 'Complete', targetStatus: 'completed', style: 'primary' }],
    notifyPatient: { title: 'Plan ready', message: 'Your exercise plan is ready.' }, notifyProvider: null }),
  meal_plan:         T({ statusCode: 'meal_plan_created', label: 'Meal plan', flags: { requires_content: 'meal_plan' },
    actionsForPatient: [], actionsForProvider: [{ action: 'complete', label: 'Complete', targetStatus: 'completed', style: 'primary' }],
    notifyPatient: { title: 'Plan ready', message: 'Your meal plan is ready.' }, notifyProvider: null }),
  dental_chart:      T({ statusCode: 'treatment_planned', label: 'Treatment plan', flags: { requires_content: 'dental_chart' },
    actionsForPatient: [], actionsForProvider: [{ action: 'complete', label: 'Complete', targetStatus: 'completed', style: 'primary' }],
    notifyPatient: { title: 'Treatment plan ready', message: 'Your dental treatment plan is ready.' }, notifyProvider: null }),
}

function deriveStepsFromConfig(mode: string, sample: string, output: string): WorkflowStep[] {
  const base: PartialStep[] = [...(BASE_STEPS[mode] ?? BASE_STEPS.office).map(s => ({ ...s }))]

  // Sample collection inserted before terminal steps
  if (sample !== 'none') {
    // For lab_result output, sample steps already include results_ready - skip separate output
    SAMPLE_STEPS.forEach(s => base.push({ ...s }))
  }

  // Clinical output step (skip lab_result if sample already added it)
  if (output && output !== 'none') {
    const skipLab = sample !== 'none' && output === 'lab_result'
    if (!skipLab && OUTPUT_STEPS[output]) {
      base.push({ ...OUTPUT_STEPS[output] })
    }
  }

  // Terminal steps always last
  base.push({ ...COMPLETED })
  base.push({ ...CANCELLED })

  return base.map((s, i) => ({ ...s, order: i + 1 })) as WorkflowStep[]
}

// ─── Horizontal step illustration ────────────────────────────────────────

const STEP_CATEGORY_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  pending:   { bg: 'bg-gray-50',    border: 'border-gray-300',   text: 'text-gray-600' },
  completed: { bg: 'bg-green-50',   border: 'border-green-300',  text: 'text-green-700' },
  cancelled: { bg: 'bg-red-50',     border: 'border-red-200',    text: 'text-red-600' },
  video:     { bg: 'bg-blue-50',    border: 'border-blue-300',   text: 'text-blue-700' },
  audio:     { bg: 'bg-cyan-50',    border: 'border-cyan-300',   text: 'text-cyan-700' },
  transport: { bg: 'bg-amber-50',   border: 'border-amber-300',  text: 'text-amber-700' },
  sample:    { bg: 'bg-purple-50',  border: 'border-purple-300', text: 'text-purple-700' },
  content:   { bg: 'bg-indigo-50',  border: 'border-indigo-300', text: 'text-indigo-700' },
  default:   { bg: 'bg-[#0C6780]/5', border: 'border-[#0C6780]/25', text: 'text-[#001E40]' },
}

function stepStyle(step: WorkflowStep) {
  const code = step.statusCode
  const flags = step.flags ?? {}
  if (code === 'completed') return STEP_CATEGORY_STYLES.completed
  if (code === 'cancelled') return STEP_CATEGORY_STYLES.cancelled
  if (code === 'pending' || code === 'submitted') return STEP_CATEGORY_STYLES.pending
  if (flags.triggers_video_call) return STEP_CATEGORY_STYLES.video
  if (flags.triggers_audio_call) return STEP_CATEGORY_STYLES.audio
  if (code.includes('travel') || code.includes('route') || code.includes('dispatch') || code.includes('transport')) return STEP_CATEGORY_STYLES.transport
  if (code.includes('sample') || code.includes('collect') || code.includes('process') || code.includes('analysis') || code.includes('result')) return STEP_CATEGORY_STYLES.sample
  if (flags.requires_content) return STEP_CATEGORY_STYLES.content
  return STEP_CATEGORY_STYLES.default
}

function StepFlowIllustration({ steps }: { steps: WorkflowStep[] }) {
  if (steps.length === 0) return null

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex items-start py-2 min-w-max">
        {steps.map((step, idx) => {
          const isCustom = step.kind === 'custom'
          const { bg, border, text } = isCustom
            ? { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-800' }
            : stepStyle(step)
          const emoji = isCustom
            ? (step.customEmoji || '📋')
            : STEP_ICON_EMOJI[inferStepIcon({
                statusCode: step.statusCode,
                label: step.label,
                flags: step.flags as Record<string, unknown>,
                hasActions: (step.actionsForPatient?.length ?? 0) + (step.actionsForProvider?.length ?? 0) > 0,
              })]
          const isLast = idx === steps.length - 1

          return (
            <div key={`${step.statusCode}-${idx}`} className="flex items-center">
              {/* Step pill */}
              <div className={`relative flex flex-col items-center text-center rounded-xl border-2 px-2.5 py-2 w-[90px] shrink-0 ${bg} ${border}`}>
                {/* System indicator */}
                {!isCustom && (
                  <span className="absolute top-1 right-1 text-[9px] leading-none text-gray-300" title="System step - auto-generated, locked">⚙️</span>
                )}
                {/* Custom milestone indicator */}
                {isCustom && (
                  <span className="absolute top-1 right-1 text-[9px] leading-none text-emerald-400 font-bold" title="Custom milestone">✦</span>
                )}
                <span className="text-2xl leading-tight">{emoji}</span>
                <span className={`text-[11px] font-semibold mt-1 leading-tight line-clamp-2 ${text}`}>
                  {step.label || step.statusCode}
                </span>
                {!isCustom && (
                  <code className="text-[9px] text-gray-400 mt-0.5 font-mono truncate max-w-full px-0.5">
                    {step.statusCode}
                  </code>
                )}
                {/* System step trigger badges */}
                {!isCustom && !!step.flags?.triggers_video_call && (
                  <span className="mt-1 text-[9px] bg-blue-100 text-blue-600 rounded px-1">📹 call</span>
                )}
                {!isCustom && !!step.flags?.triggers_audio_call && (
                  <span className="mt-1 text-[9px] bg-cyan-100 text-cyan-600 rounded px-1">📞 call</span>
                )}
                {!isCustom && !!step.flags?.requires_content && (
                  <span className="mt-1 text-[9px] bg-indigo-100 text-indigo-600 rounded px-1">📎 attach</span>
                )}
              </div>
              {/* Arrow connector */}
              {!isLast && (
                <div className="flex items-center shrink-0 text-gray-300 mx-0.5">
                  <div className="w-3 h-0.5 bg-gray-300" />
                  <svg width="8" height="10" viewBox="0 0 8 10" fill="none" className="text-gray-300">
                    <path d="M1 1L7 5L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div className="w-3 h-0.5 bg-gray-300" />
                </div>
              )}
            </div>
          )
        })}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 mt-1 text-[10px] text-gray-400">
        <span className="flex items-center gap-1">⚙️ System step <span className="text-gray-300">(auto-generated, locked)</span></span>
        <span className="flex items-center gap-1 text-emerald-600">✦ Custom milestone <span className="text-emerald-300">(editable)</span></span>
      </div>
    </div>
  )
}

// ─── Builder component ────────────────────────────────────────────────────

interface WorkflowBuilderProps {
  backHref: string
  initialData?: {
    id?: string
    name: string
    slug: string
    description: string
    providerType: string
    serviceMode: string
    paymentTiming?: string | null
    platformServiceId?: string | null
    expectedDurationHours?: number | null
    slaNote?: string | null
    isShared?: boolean
    steps: WorkflowStep[]
    transitions: Array<{ from: string; to: string; action: string; allowedRoles: string[] }>
  }
  lockedProviderType?: string
  showAdminFields?: boolean
  onSave?: (data: unknown) => void
  wizardData?: {
    name: string
    description: string
    serviceMode: string
    steps: unknown[]
    transitions: unknown[]
    serviceConfig: Record<string, unknown>
    paymentTiming: string
  } | null
  onRequestWizard?: () => void
}

interface PlatformServiceOption {
  id: string
  name: string
  providerType: string
  serviceMode?: string | null
  defaultPrice?: number | null
}


export default function WorkflowBuilder({
  backHref, initialData, lockedProviderType, showAdminFields,
  onSave, wizardData, onRequestWizard,
}: WorkflowBuilderProps) {
  const isEdit = !!initialData?.id

  const [name,               setName]               = useState(initialData?.name || '')
  const [slug,               setSlug]               = useState(initialData?.slug || '')
  const [description,        setDescription]        = useState(initialData?.description || '')
  const [providerType,       setProviderType]       = useState(lockedProviderType || initialData?.providerType || '')
  const [serviceMode,        setServiceMode]        = useState(initialData?.serviceMode || 'office')
  const [paymentTiming,      setPaymentTiming]      = useState(initialData?.paymentTiming || derivePaymentTiming(initialData?.serviceMode || 'office'))
  const [platformServiceId,  setPlatformServiceId]  = useState<string>(initialData?.platformServiceId || '')
  const [expectedDurationHours, setExpectedDurationHours] = useState<string>(initialData?.expectedDurationHours != null ? String(initialData.expectedDurationHours) : '')
  const [slaNote,            setSlaNote]            = useState(initialData?.slaNote || '')
  const [isShared,           setIsShared]           = useState(initialData?.isShared ?? false)
  const [services,           setServices]           = useState<PlatformServiceOption[]>([])
  const [servicesLoading,    setServicesLoading]    = useState(false)

  // Smart-config axes
  const [configSample,      setConfigSample]      = useState('none')
  const [configOutput,      setConfigOutput]      = useState('none')

  // Steps - if initialData provided, classify legacy steps; otherwise derive from mode
  const [steps, setSteps] = useState<WorkflowStep[]>(() => {
    if (initialData?.steps?.length) return classifyInitialSteps(initialData.steps)
    return deriveStepsFromConfig('office', 'none', 'none')
  })
  // True when the admin has added custom milestones (disables auto-rederive of system steps)
  const [stepsCustomized, setStepsCustomized] = useState(!!initialData)

  // Custom milestone insertion state
  const [addingCustom,    setAddingCustom]    = useState(false)
  const [newStepAfterIdx, setNewStepAfterIdx] = useState('0')
  const [newStepLabel,    setNewStepLabel]    = useState('')
  const [newStepEmoji,    setNewStepEmoji]    = useState('📋')

  const [saving,          setSaving]          = useState(false)
  const [publishing,      setPublishing]      = useState(false)
  const [error,           setError]           = useState<string | null>(null)
  const [success,         setSuccess]         = useState(false)
  const [isDraft,         setIsDraft]         = useState<boolean>((initialData as any)?.isDraft ?? true)
  const [inFlightCount,   setInFlightCount]   = useState<number>(0)
  const [providerTypes,   setProviderTypes]   = useState<string[]>(FALLBACK_PROVIDER_TYPES)
  const [view,            setView]            = useState<'builder' | 'preview'>('builder')
  const [aiOpen,          setAiOpen]          = useState(false)
  const [aiPrompt,        setAiPrompt]        = useState('')
  const [aiBusy,          setAiBusy]          = useState(false)
  const [aiError,         setAiError]         = useState<string | null>(null)

  const wizardApplied = useRef(false)

  // Apply wizard data once
  useEffect(() => {
    if (!wizardData || wizardApplied.current) return
    wizardApplied.current = true
    if (wizardData.name)        setName(wizardData.name)
    if (wizardData.description) setDescription(wizardData.description)
    if (wizardData.serviceMode) setServiceMode(wizardData.serviceMode)
    if (wizardData.paymentTiming) setPaymentTiming(wizardData.paymentTiming)
    if (Array.isArray(wizardData.steps) && wizardData.steps.length > 0) {
      setSteps(wizardData.steps as WorkflowStep[])
      setStepsCustomized(false)
    }
   
  }, [wizardData])

  // Auto-derive steps when mode or axes change (only if not manually edited)
  useEffect(() => {
    if (stepsCustomized) return
    setSteps(deriveStepsFromConfig(serviceMode, configSample, configOutput))
   
  }, [serviceMode, configSample, configOutput, stepsCustomized])

  // Auto-derive paymentTiming when serviceMode changes
  useEffect(() => {
    setPaymentTiming(derivePaymentTiming(serviceMode))
   
  }, [serviceMode])

  // Fetch in-flight count for existing published templates
  useEffect(() => {
    if (!initialData?.id || isDraft) return
    fetch(`/api/workflow/templates/${initialData.id}/in-flight-count`, { credentials: 'include' })
      .then(r => r.json())
      .then(json => { if (json.success) setInFlightCount(json.data.count ?? 0) })
      .catch(() => {})
   
  }, [initialData?.id, isDraft])

  useEffect(() => {
    fetch('/api/roles?isProvider=true')
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          const codes = json.data.map((r: { code: string }) => r.code)
          if (codes.length > 0) setProviderTypes(codes)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!providerType) { setServices([]); return }
    setServicesLoading(true)
    fetch(`/api/services/catalog?providerType=${encodeURIComponent(providerType)}`, { credentials: 'include' })
      .then(r => r.json())
      .then(json => {
        const groups = Array.isArray(json?.data) ? json.data as Array<{ category: string; services: Array<{ id: string; serviceName: string; defaultPrice?: number }> }> : []
        const list: PlatformServiceOption[] = []
        for (const g of groups) {
          if (!Array.isArray(g?.services)) continue
          for (const r of g.services) {
            list.push({ id: r.id, name: r.serviceName, providerType: (g.category?.split(' - ')[0]) || providerType, defaultPrice: r.defaultPrice ?? null })
          }
        }
        setServices(list)
        if (platformServiceId && !list.some(s => s.id === platformServiceId)) setPlatformServiceId('')
      })
      .catch(() => setServices([]))
      .finally(() => setServicesLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerType])

  async function draftWithAi() {
    setAiBusy(true); setAiError(null)
    try {
      const res = await fetch('/api/workflow/ai-draft', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt.trim(), providerType, serviceMode }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'AI draft failed')
      const draftSteps = json.data?.steps
      if (!Array.isArray(draftSteps) || draftSteps.length === 0) throw new Error('AI returned no steps.')
      setSteps(draftSteps as WorkflowStep[])
      setStepsCustomized(true)
      setAiOpen(false); setAiPrompt('')
    } catch (e) { setAiError(e instanceof Error ? e.message : 'AI draft failed') }
    finally { setAiBusy(false) }
  }

  const issues = (() => {
    const out: Array<{ key: string; message: string; stepIdx?: number }> = []
    if (!name.trim()) out.push({ key: 'name', message: 'Workflow needs a name.' })
    if (!serviceMode) out.push({ key: 'mode', message: 'Pick a service mode.' })
    if (steps.length < 2) out.push({ key: 'steps', message: 'At least 2 steps are required.' })
    const codes = new Set<string>()
    steps.forEach((s, i) => {
      if (!s.statusCode) out.push({ key: `s-${i}-code`, message: `Step ${i + 1}: missing status code.`, stepIdx: i })
      if (codes.has(s.statusCode)) out.push({ key: `s-${i}-dup`, message: `Duplicate status code "${s.statusCode}".`, stepIdx: i })
      codes.add(s.statusCode)
      if (!s.label) out.push({ key: `s-${i}-label`, message: `Step ${i + 1}: missing label.`, stepIdx: i })
      const isTerminal = s.statusCode === 'completed' || s.statusCode === 'cancelled'
      const hasAction = (s.actionsForPatient ?? []).length + (s.actionsForProvider ?? []).length > 0
      // Custom milestones get auto-generated proceed actions before save - skip stuck check
      if (!isTerminal && !hasAction && s.kind !== 'custom') {
        out.push({ key: `s-${i}-stuck`, message: `Step ${i + 1} ("${s.label || s.statusCode}") has no actions - bookings will get stuck here.`, stepIdx: i })
      }
      const allActions = [...(s.actionsForPatient ?? []), ...(s.actionsForProvider ?? [])]
      for (const a of allActions) {
        if (!a.targetStatus) out.push({ key: `s-${i}-a-${a.action}-target`, message: `Step ${i + 1} action "${a.action || 'unnamed'}" has no target status.`, stepIdx: i })
        else if (!steps.some(t => t.statusCode === a.targetStatus)) {
          out.push({ key: `s-${i}-a-${a.action}-unknown`, message: `Step ${i + 1} action "${a.action}" points to "${a.targetStatus}" - no such step.`, stepIdx: i })
        }
      }
    })
    return out
  })()

  function generateTransitions() {
    const transitions: Array<{ from: string; to: string; action: string; allowedRoles: string[] }> = []
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      if (step.kind === 'custom') {
        // Auto pass-through: provider presses "Continue" → next step
        const next = steps[i + 1]
        if (next) transitions.push({ from: step.statusCode, to: next.statusCode, action: 'proceed', allowedRoles: ['provider'] })
        continue
      }
      for (const action of step.actionsForProvider) {
        if (action.action && action.targetStatus) transitions.push({ from: step.statusCode, to: action.targetStatus, action: action.action, allowedRoles: ['provider'] })
      }
      for (const action of step.actionsForPatient) {
        if (action.action && action.targetStatus) {
          const ex = transitions.find(t => t.from === step.statusCode && t.to === action.targetStatus && t.action === action.action)
          if (ex) { if (!ex.allowedRoles.includes('patient')) ex.allowedRoles.push('patient') }
          else transitions.push({ from: step.statusCode, to: action.targetStatus, action: action.action, allowedRoles: ['patient'] })
        }
      }
    }
    return transitions
  }

  function autoSlug(val: string) { return val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }

  function openAddCustomForm() {
    const completedIdx = steps.findIndex(s => s.statusCode === 'completed')
    const defaultIdx = completedIdx > 0 ? completedIdx - 1 : Math.max(0, steps.length - 2)
    setNewStepAfterIdx(String(defaultIdx))
    setNewStepLabel('')
    setNewStepEmoji('📋')
    setAddingCustom(true)
  }

  function confirmAddCustomStep() {
    if (!newStepLabel.trim()) return
    const code = makeUniqueCode(newStepLabel.trim(), steps.map(s => s.statusCode))
    const newStep: WorkflowStep = {
      kind: 'custom',
      customEmoji: newStepEmoji,
      order: 0,
      statusCode: code,
      label: newStepLabel.trim(),
      actionsForPatient: [],
      actionsForProvider: [],
      flags: {},
      notifyPatient: null,
      notifyProvider: null,
    }
    const insertAfter = parseInt(newStepAfterIdx, 10)
    const updated = [...steps]
    updated.splice(insertAfter + 1, 0, newStep)
    setSteps(updated.map((s, i) => ({ ...s, order: i + 1 })))
    setStepsCustomized(true)
    setAddingCustom(false)
    setNewStepLabel('')
    setNewStepEmoji('📋')
  }

  function removeCustomStep(idx: number) {
    if (steps[idx]?.kind !== 'custom') return
    setSteps(steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 })))
  }

  const dragSourceIdx = useRef<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  function handleDragStart(idx: number) {
    dragSourceIdx.current = idx
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    if (dragSourceIdx.current !== null && dragSourceIdx.current !== idx) {
      setDragOverIdx(idx)
    }
  }

  function handleDrop(idx: number) {
    const from = dragSourceIdx.current
    if (from === null || from === idx) { dragSourceIdx.current = null; setDragOverIdx(null); return }
    const updated = [...steps]
    const [moved] = updated.splice(from, 1)
    updated.splice(idx, 0, moved)
    setSteps(updated.map((s, i) => ({ ...s, order: i + 1 })))
    setStepsCustomized(true)
    dragSourceIdx.current = null
    setDragOverIdx(null)
  }

  function handleDragEnd() {
    dragSourceIdx.current = null
    setDragOverIdx(null)
  }

  function handleRegenerate() {
    const newSteps = deriveStepsFromConfig(serviceMode, configSample, configOutput)
    setSteps(newSteps)
    setStepsCustomized(false)
  }

  async function handleSave() {
    if (!name || !serviceMode) { setError('Name and service mode are required'); return }
    if (steps.length < 2) { setError('At least 2 steps are required'); return }
    setSaving(true); setError(null); setSuccess(false)
    const transitions = generateTransitions()
    const finalSlug = slug || autoSlug(`${providerType}-${name}`)

    // Build serviceConfig based on axes
    const serviceConfig: Record<string, unknown> = {}
    if (configSample !== 'none') {
      serviceConfig.stock = { checkOnAcceptance: true, subtractOnCompletion: true }
    }

    try {
      const url    = isEdit ? `/api/workflow/templates/${initialData!.id}` : '/api/workflow/templates'
      const method = isEdit ? 'PATCH' : 'POST'
      // Auto-fill custom step actions based on position before persisting
      const stepsToSave = steps.map((s, i) => {
        if (s.kind !== 'custom') return s
        const next = steps[i + 1]
        return {
          ...s,
          actionsForProvider: next
            ? [{ action: 'proceed', label: 'Continue', targetStatus: next.statusCode, style: 'primary' as const }]
            : [],
        }
      })
      const payload: Record<string, unknown> = {
        name, slug: finalSlug, description, providerType, serviceMode, paymentTiming,
        platformServiceId: platformServiceId || null,
        steps: stepsToSave, transitions, serviceConfig,
      }
      if (showAdminFields) {
        payload.expectedDurationHours = expectedDurationHours ? parseInt(expectedDurationHours, 10) : null
        payload.slaNote  = slaNote || null
        payload.isShared = isShared
      }
      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) })
      const data = await res.json()
      if (data.success) {
        setSuccess(true); setSlug(finalSlug)
        if (data.data?.isDraft !== undefined) setIsDraft(data.data.isDraft)
        onSave?.(data.data)
      }
      else setError(data.message || 'Failed to save')
    } catch { setError('Network error') }
    finally { setSaving(false) }
  }

  async function handlePublish() {
    // First save the latest state as a draft, then publish
    if (!name || !serviceMode) { setError('Name and service mode are required'); return }
    if (steps.length < 2) { setError('At least 2 steps are required'); return }
    setPublishing(true); setError(null); setSuccess(false)
    try {
      await handleSave()
      const id = initialData?.id
      if (!id) { setPublishing(false); return } // new template - handleSave created it, user can publish after
      const res  = await fetch(`/api/workflow/templates/${id}/publish`, {
        method: 'POST', credentials: 'include',
      })
      const data = await res.json()
      if (data.success) { setIsDraft(false); setSuccess(true) }
      else setError(data.message || 'Failed to publish')
    } catch { setError('Network error') }
    finally { setPublishing(false) }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link href={backHref} className="flex items-center gap-1 text-[#0C6780] hover:text-[#001E40] text-sm mb-2">
            <FiArrowLeft className="w-4 h-4" /> Back to workflows
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Workflow' : 'Create Workflow'}</h1>
            {isEdit && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                isDraft ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
              }`}>
                {isDraft ? '● Draft' : '✓ Published'}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setAiOpen(true)}
            className="bg-white border border-[#0C6780] hover:bg-[#0C6780]/5 text-[#0C6780] px-4 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition">
            <FiZap className="w-4 h-4" /> AI draft
          </button>
          <button
            onClick={handleSave}
            disabled={saving || publishing || issues.length > 0}
            title={issues.length > 0 ? `Fix ${issues.length} issue${issues.length === 1 ? '' : 's'} first` : 'Save as draft'}
            className="bg-white border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition disabled:opacity-50">
            <FiSave className="w-4 h-4" />
            {saving ? 'Saving…' : issues.length > 0 ? `Save (${issues.length} issue${issues.length === 1 ? '' : 's'})` : 'Save Draft'}
          </button>
          {isEdit && (
            <button
              onClick={handlePublish}
              disabled={saving || publishing || issues.length > 0}
              title={isDraft ? 'Publish - makes this template active for new bookings' : 'Re-publish with latest changes'}
              className="bg-[#0C6780] hover:bg-[#001E40] text-white px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition disabled:opacity-50">
              {publishing ? 'Publishing…' : isDraft ? 'Publish' : 'Update & Publish'}
            </button>
          )}
          {!isEdit && (
            <button
              onClick={handleSave}
              disabled={saving || issues.length > 0}
              title="Create workflow as draft"
              className="bg-[#001E40] hover:bg-[#0C6780] text-white px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition disabled:opacity-50">
              {saving ? 'Creating…' : 'Create Draft'}
            </button>
          )}
        </div>
      </div>

      {error   && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
        {isDraft ? 'Draft saved successfully.' : 'Workflow published - it is now active for new bookings.'}
      </div>}

      {/* In-flight warning: editing a published template that has active bookings */}
      {!isDraft && inFlightCount > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-amber-600 text-lg leading-none flex-shrink-0">⚠</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {inFlightCount} active booking{inFlightCount === 1 ? '' : 's'} are running this template
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Changes you publish will only apply to new bookings. In-flight bookings continue on the version that was active when they were created.
            </p>
          </div>
        </div>
      )}

      {/* Builder / Preview tab */}
      <div className="bg-white border border-gray-200 rounded-xl p-1 flex gap-1 max-w-xs text-sm font-medium">
        <button onClick={() => setView('builder')} className={`flex-1 px-3 py-1.5 rounded-lg transition-colors ${view === 'builder' ? 'bg-[#0C6780] text-white' : 'text-gray-700 hover:bg-gray-100'}`}>Builder</button>
        <button onClick={() => setView('preview')} className={`flex-1 px-3 py-1.5 rounded-lg transition-colors ${view === 'preview' ? 'bg-[#0C6780] text-white' : 'text-gray-700 hover:bg-gray-100'}`}>Preview</button>
      </div>

      {/* ─── Basic Info ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Basic Information</h2>
          {onRequestWizard && (
            <button type="button" onClick={onRequestWizard}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0C6780] hover:text-[#001E40] border border-[#0C6780]/30 hover:border-[#0C6780] bg-[#0C6780]/5 hover:bg-[#0C6780]/10 px-3 py-1.5 rounded-lg transition">
              🪄 Configure with Wizard
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Workflow Name *</label>
            <input type="text" value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(autoSlug(`${providerType}-${e.target.value}`)) }}
              placeholder="e.g. Doctor Video Consultation"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780]" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Slug (auto-generated)</label>
            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generated"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780]" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Provider Type</label>
            {lockedProviderType ? (
              <div className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700">
                {lockedProviderType.replace(/_/g, ' ')} <span className="text-[11px] text-gray-400 ml-1">(from your role)</span>
              </div>
            ) : (
              <select value={providerType} onChange={(e) => setProviderType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780]">
                <option value="">Global (All Providers)</option>
                {providerTypes.map(pt => <option key={pt} value={pt}>{pt.replace(/_/g, ' ')}</option>)}
              </select>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Service Mode *</label>
            <select value={serviceMode} onChange={(e) => setServiceMode(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780]">
              {SERVICE_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Payment Timing
              <span className="ml-1 text-gray-400 font-normal">(auto-derived)</span>
            </label>
            <select value={paymentTiming} onChange={(e) => setPaymentTiming(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780]">
              {PAYMENT_TIMING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Service picker */}
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">
            Applies to Service
            <span className="ml-1 text-gray-400 font-normal">(leave empty to apply as default for this provider type)</span>
          </label>
          {providerType ? (
            services.length > 0 ? (
              <select value={platformServiceId} onChange={(e) => setPlatformServiceId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780]">
                <option value=""> - All {providerType.replace(/_/g, ' ')} services (default) - </option>
                {services.filter(s => !s.serviceMode || s.serviceMode === serviceMode).map(s => (
                  <option key={s.id} value={s.id}>{s.name}{s.defaultPrice != null ? ` · Rs ${s.defaultPrice}` : ''}</option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg px-3 py-2">
                {servicesLoading ? 'Loading services…' : `No services yet for ${providerType.replace(/_/g, ' ')}.`}
              </p>
            )
          ) : (
            <p className="text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg px-3 py-2">
              Pick a provider type first to see available services.
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Description</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780]" />
        </div>

        {/* ─── Clinical Configuration (axis-based step generation) ── */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Clinical Configuration</h3>
              <p className="text-xs text-gray-400 mt-0.5">Steps are auto-generated from these options - no manual step editing needed.</p>
            </div>
            {stepsCustomized && (
              <button
                type="button"
                onClick={handleRegenerate}
                className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition"
                title="Discard manual edits and regenerate from config"
              >
                <FiRefreshCw className="w-3 h-3" /> Reset to config
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Sample Collection</label>
              <select value={configSample} onChange={(e) => { setConfigSample(e.target.value); setStepsCustomized(false) }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780]">
                {SAMPLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Clinical Output</label>
              <select value={configOutput} onChange={(e) => { setConfigOutput(e.target.value); setStepsCustomized(false) }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780]">
                {OUTPUT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <div className="w-full">
                <label className="text-xs font-medium text-gray-500 block mb-1">
                  {stepsCustomized ? 'Steps manually edited' : `${steps.length} steps auto-derived`}
                </label>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#0C6780] hover:bg-[#001E40] text-white rounded-lg text-sm font-medium transition"
                >
                  <FiRefreshCw className="w-3.5 h-3.5" /> Regenerate steps
                </button>
              </div>
            </div>
          </div>
        </div>

        {showAdminFields && (
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">SLA &amp; Sharing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Expected duration (hours)</label>
                <input type="number" min={1} value={expectedDurationHours} onChange={e => setExpectedDurationHours(e.target.value)}
                  placeholder="e.g. 24" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780]/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">SLA note</label>
                <input type="text" value={slaNote} onChange={e => setSlaNote(e.target.value)}
                  placeholder="e.g. Results within 24h guaranteed" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780]/30" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <input id="isShared" type="checkbox" checked={isShared} onChange={e => setIsShared(e.target.checked)} className="w-4 h-4 accent-[#0C6780]" />
              <label htmlFor="isShared" className="text-sm text-gray-700 cursor-pointer">
                Share this template across regions
                <span className="ml-1 text-xs text-gray-400">(other regional admins can clone it)</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {view === 'preview' ? (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <WorkflowPreview steps={steps} />
        </div>
      ) : (
      <>
        {/* ─── Step Flow Illustration ─────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3 gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Step Flow</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {stepsCustomized
                  ? 'Manually customised - click "Reset to config" to regenerate'
                  : 'Auto-generated from your configuration above'}
              </p>
            </div>
            <span className="text-xs font-medium text-gray-500 shrink-0">{steps.length} steps</span>
          </div>
          <StepFlowIllustration steps={steps} />
        </div>

        {/* ─── Custom Milestones ──────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Custom Milestones</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Add named checkpoints between system steps. Choose an emoji icon and a position.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddCustomForm}
              disabled={addingCustom}
              className="text-sm text-[#0C6780] hover:text-[#001E40] flex items-center gap-1 font-medium disabled:opacity-40"
            >
              <FiPlus className="w-4 h-4" /> Add milestone
            </button>
          </div>

          {/* Inline add form */}
          {addingCustom && (
            <div className="bg-white border border-[#0C6780]/30 rounded-xl p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Insert after</label>
                  <select
                    value={newStepAfterIdx}
                    onChange={e => setNewStepAfterIdx(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780]"
                  >
                    {steps.map((s, i) => (
                      <option key={i} value={i}>{s.label || s.statusCode}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Step name *</label>
                  <input
                    autoFocus
                    type="text"
                    value={newStepLabel}
                    onChange={e => setNewStepLabel(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') confirmAddCustomStep() }}
                    placeholder="e.g. Patient preparation"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780]"
                  />
                </div>
              </div>

              {/* Emoji picker */}
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-2">
                  Icon <span className="font-normal text-gray-400"> - click to choose</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CUSTOM_STEP_EMOJIS.map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setNewStepEmoji(em)}
                      className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center border-2 transition ${
                        newStepEmoji === em
                          ? 'border-[#0C6780] bg-[#0C6780]/10 scale-110'
                          : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => { setAddingCustom(false); setNewStepLabel(''); setNewStepEmoji('📋') }}
                  className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmAddCustomStep}
                  disabled={!newStepLabel.trim()}
                  className="text-sm font-medium bg-[#0C6780] hover:bg-[#001E40] text-white px-4 py-1.5 rounded-lg disabled:opacity-40 transition"
                >
                  Add milestone
                </button>
              </div>
            </div>
          )}

          {/* Existing custom steps list */}
          {steps.filter(s => s.kind === 'custom').length === 0 && !addingCustom && (
            <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
              <p className="text-sm text-gray-500">No custom milestones yet.</p>
              <p className="text-xs text-gray-400 mt-1">
                System steps cover the full flow - add milestones to create named checkpoints visible to provider and member.
              </p>
            </div>
          )}

          {steps.map((step, idx) => {
            if (step.kind !== 'custom') return null
            const prev = idx > 0 ? steps[idx - 1] : null
            const next = idx < steps.length - 1 ? steps[idx + 1] : null
            const isDragOver = dragOverIdx === idx
            return (
              <div
                key={step.statusCode}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={handleDragEnd}
                className={`bg-white border rounded-xl p-3 flex items-center gap-3 transition cursor-grab active:cursor-grabbing select-none ${
                  isDragOver
                    ? 'border-[#0C6780] bg-[#0C6780]/5 shadow-md scale-[1.01]'
                    : 'border-emerald-200 hover:border-emerald-300 hover:shadow-sm'
                }`}
              >
                {/* Drag handle */}
                <FiMenu className="text-gray-300 hover:text-gray-500 flex-shrink-0 w-4 h-4" title="Drag to reorder" />
                <span className="text-2xl leading-none flex-shrink-0">{step.customEmoji || '📋'}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900">{step.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    <span>After: <span className="text-gray-600">{prev?.label || ' - '}</span></span>
                    {next && (
                      <> · <span>Before: <span className="text-gray-600">{next.label}</span></span></>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex-shrink-0">
                  custom milestone
                </span>
                <button
                  type="button"
                  onClick={() => removeCustomStep(idx)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded flex-shrink-0"
                  title="Remove milestone"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>

        {/* ─── Auto-Generated Transitions ─────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Auto-Generated Transitions</h2>
          <div className="flex flex-wrap gap-2">
            {generateTransitions().map((tr, i) => (
              <span key={i} className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-600">
                {tr.from} <span className="text-[#0C6780] font-bold mx-1">→</span> {tr.to}
                <span className="text-gray-400 ml-1">({tr.action})</span>
                <span className="text-gray-300 ml-1">[{tr.allowedRoles.join(', ')}]</span>
              </span>
            ))}
            {generateTransitions().length === 0 && <span className="text-xs text-gray-400">Add actions to steps to see transitions</span>}
          </div>
        </div>

        {/* ─── Template Variables ──────────────────────────────────── */}
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-[#001E40] mb-2">Notification Template Variables</h3>
          <div className="flex flex-wrap gap-2">
            {['{{patientName}}','{{providerName}}','{{providerType}}','{{serviceName}}','{{scheduledAt}}','{{amount}}','{{status}}','{{bookingId}}','{{actionBy}}','{{eta}}'].map(v => (
              <code key={v} className="text-xs bg-white border border-sky-200 rounded px-2 py-1 text-[#0C6780] font-mono">{v}</code>
            ))}
          </div>
        </div>
      </>
      )}

      {/* ─── Pinned validation panel ─────────────────────────────── */}
      {issues.length > 0 && (
        <div className="sticky bottom-4 z-30 bg-amber-50 border border-amber-200 rounded-xl shadow-lg p-3">
          <div className="flex items-center gap-2 font-semibold text-amber-900 text-sm mb-1.5">
            <span className="inline-flex items-center justify-center w-5 h-5 bg-amber-200 text-amber-900 rounded-full text-xs font-bold">{issues.length}</span>
            {issues.length === 1 ? 'Issue to fix' : 'Issues to fix before saving'}
          </div>
          <ul className="text-xs text-amber-900 space-y-0.5 max-h-32 overflow-y-auto">
            {issues.slice(0, 8).map((i) => <li key={i.key}>• {i.message}</li>)}
            {issues.length > 8 && <li className="text-amber-700">…and {issues.length - 8} more</li>}
          </ul>
        </div>
      )}

      {/* ─── AI-assist modal ─────────────────────────────────────── */}
      {aiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setAiOpen(false)}>
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2"><FiZap className="text-[#0C6780]" /><h3 className="text-base font-bold text-gray-900">Draft with AI</h3></div>
                <p className="text-xs text-gray-500 mt-1">Describe the workflow in plain words. We&apos;ll draft the steps, actions, and notifications - you review before saving. This <strong>replaces</strong> your current steps.</p>
              </div>
              <button onClick={() => setAiOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><FiX /></button>
            </div>
            <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
              placeholder={`e.g. "Patient books teleconsultation. Doctor accepts, video call opens, we charge the patient. Doctor can send prescription after the call."`}
              rows={6} maxLength={1000}
              className="w-full text-sm border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#0C6780] focus:border-transparent outline-none resize-none" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">{aiPrompt.length}/1000 · {providerType || 'no provider type'} · {serviceMode}</span>
              {aiError && <span className="text-red-600">{aiError}</span>}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => { setAiOpen(false); setAiError(null) }} disabled={aiBusy} className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={draftWithAi} disabled={aiBusy || aiPrompt.trim().length < 20}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold bg-[#0C6780] hover:bg-[#001E40] text-white rounded-lg disabled:opacity-50">
                <FiZap /> {aiBusy ? 'Drafting…' : 'Draft steps'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
