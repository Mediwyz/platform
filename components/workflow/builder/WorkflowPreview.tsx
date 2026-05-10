'use client'

import { useState } from 'react'
import {
  FaUser, FaUserMd, FaClock, FaCheck, FaBan, FaPlayCircle, FaBell, FaComments,
  FaVideo, FaPhone, FaMoneyBillWave, FaUndo, FaStar, FaFileMedical, FaCamera,
} from 'react-icons/fa'
import type { WorkflowStep } from './WorkflowBuilder'
import WorkflowStepper from '../WorkflowStepper'

/**
 * Renders a workflow template the way each SIDE will actually see it at
 * runtime — not a dev-facing debug view. Patient tab shows the patient's
 * booking card chrome with the action buttons that step surfaces to them;
 * Provider tab shows the provider dashboard card. Placeholders in
 * notifications ({{patientName}}, …) get filled with demo data so admins
 * can sanity-check before publishing.
 *
 * Why this matters: the list view of steps is easy for an author but
 * doesn't communicate the end-user experience. A preview pass catches
 * missing notifications, unreachable states, and jarring button copy
 * before a single booking ever uses the template.
 */

const DEMO = {
  patientName: 'Marie Dupont',
  providerName: 'Dr Sarah Johnson',
  providerType: 'Doctor',
  serviceName: 'General Consultation',
  scheduledAt: 'Tue 22 Apr · 15:00',
  amount: '500 MUR',
  status: 'confirmed',
  bookingId: 'BK-ABC123',
  actionBy: 'Dr Sarah Johnson',
  eta: '25 minutes',
}

function fillPlaceholders(text: string | null | undefined): string {
  if (!text) return ''
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => (DEMO as Record<string, string>)[key] ?? `{{${key}}}`)
}

const FLAG_ICONS: Record<string, { icon: React.ElementType; label: string; tint: string }> = {
  triggers_payment: { icon: FaMoneyBillWave, label: 'Charges Account Balance', tint: 'text-emerald-600 bg-emerald-50' },
  triggers_refund: { icon: FaUndo, label: 'Refunds payment', tint: 'text-amber-600 bg-amber-50' },
  triggers_video_call: { icon: FaVideo, label: 'Opens video room', tint: 'text-blue-600 bg-blue-50' },
  triggers_audio_call: { icon: FaPhone, label: 'Opens audio call', tint: 'text-cyan-600 bg-cyan-50' },
  triggers_conversation: { icon: FaComments, label: 'Starts chat', tint: 'text-pink-600 bg-pink-50' },
  triggers_review_request: { icon: FaStar, label: 'Asks for review', tint: 'text-yellow-600 bg-yellow-50' },
  requires_prescription: { icon: FaFileMedical, label: 'Needs prescription', tint: 'text-red-600 bg-red-50' },
  requires_content: { icon: FaCamera, label: 'Attach content', tint: 'text-indigo-600 bg-indigo-50' },
}

function activeFlags(step: WorkflowStep): Array<{ key: string; icon: React.ElementType; label: string; tint: string }> {
  const flags = step.flags ?? {}
  return Object.entries(flags)
    .filter(([, v]) => !!v)
    .map(([key]) => ({ key, ...(FLAG_ICONS[key] ?? { icon: FaPlayCircle, label: key, tint: 'text-gray-600 bg-gray-50' }) }))
}

function styleButton(style?: string): string {
  switch (style) {
    case 'primary':   return 'bg-[#0C6780] hover:bg-[#001E40] text-white'
    case 'danger':    return 'bg-red-600 hover:bg-red-700 text-white'
    case 'secondary': return 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-300'
    default:          return 'bg-gray-100 hover:bg-gray-200 text-gray-800'
  }
}

export default function WorkflowPreview({ steps }: { steps: WorkflowStep[] }) {
  const [side, setSide] = useState<'patient' | 'provider'>('patient')
  const [currentIdx, setCurrentIdx] = useState(0)
  const clamped = steps.length > 0 ? Math.min(currentIdx, steps.length - 1) : 0
  const step = steps[clamped]

  if (!step) {
    return (
      <div className="text-sm text-gray-500 text-center py-8">
        Add at least one step to preview this workflow.
      </div>
    )
  }

  const actions = side === 'patient' ? (step.actionsForPatient ?? []) : (step.actionsForProvider ?? [])
  const notify = side === 'patient' ? step.notifyPatient : step.notifyProvider
  const flags = activeFlags(step)

  return (
    <div className="space-y-4">
      {/* Visual stepper — the whole happy path at a glance */}
      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">Flow at a glance</p>
        <WorkflowStepper
          steps={steps.map(s => ({
            order: s.order,
            statusCode: s.statusCode,
            label: s.label,
            flags: s.flags as Record<string, unknown>,
            actionsForPatient: s.actionsForPatient,
            actionsForProvider: s.actionsForProvider,
          }))}
          currentStatus={step.statusCode}
          variant="compact"
        />
      </div>

      {/* Side toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="inline-flex rounded-lg bg-gray-100 p-1 text-xs font-medium">
          <button
            onClick={() => setSide('patient')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 ${side === 'patient' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}
          >
            <FaUser /> Patient view
          </button>
          <button
            onClick={() => setSide('provider')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 ${side === 'provider' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}
          >
            <FaUserMd /> Provider view
          </button>
        </div>
        <span className="text-[11px] text-gray-500">Previewing with demo data — <em>{DEMO.patientName}</em>, <em>{DEMO.providerName}</em></span>
      </div>

      {/* Step navigator */}
      <div className="bg-white border border-gray-200 rounded-xl p-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Simulate each step</div>
        <div className="flex gap-1 flex-wrap">
          {steps.map((s, i) => (
            <button
              key={`${s.statusCode}-${i}`}
              onClick={() => setCurrentIdx(i)}
              className={`text-xs px-2 py-1 rounded border transition-colors ${
                i === clamped
                  ? 'bg-[#0C6780] text-white border-[#0C6780]'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
              title={s.statusCode}
            >
              {i + 1}. {s.label || s.statusCode}
            </button>
          ))}
        </div>
      </div>

      {/* Fake booking card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gradient-to-r from-[#001E40] to-[#0C6780] text-white flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-xs text-white/70">{side === 'patient' ? 'Your booking' : 'Patient booking'}</div>
            <div className="font-semibold">{DEMO.serviceName} · {DEMO.providerName}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/70">{DEMO.scheduledAt}</div>
            <div className="text-xs font-mono">{DEMO.bookingId}</div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Current status chip */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#9AE1FF]/30 text-[#001E40] border border-[#9AE1FF] rounded-full px-2.5 py-1">
              <FaClock className="text-[10px]" />
              {step.label || step.statusCode}
            </span>
            {flags.map(({ key, icon: Icon, label, tint }) => (
              <span key={key} className={`inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5 ${tint}`}>
                <Icon className="text-[9px]" /> {label}
              </span>
            ))}
          </div>

          {/* Notification this step emits to the active side */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1">
              <FaBell /> Notification to {side}
            </div>
            {notify ? (
              <>
                <div className="text-sm font-semibold text-gray-900">{fillPlaceholders(notify.title)}</div>
                <div className="text-sm text-gray-700 mt-0.5">{fillPlaceholders(notify.message)}</div>
              </>
            ) : (
              <div className="text-xs text-gray-500 italic">
                No notification to {side} at this step.
                {step.actionsForProvider.length === 0 && step.actionsForPatient.length === 0 && (
                  <> This is a terminal state — that&apos;s fine.</>
                )}
              </div>
            )}
          </div>

          {/* Action buttons this side sees */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-2">
              {side === 'patient' ? 'What the patient can do' : 'What the provider can do'}
            </div>
            {actions.length === 0 ? (
              <div className="text-xs text-gray-500 italic">
                Nothing actionable for {side === 'patient' ? 'the patient' : 'the provider'} at this step.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {actions.map((a, i) => {
                  const Icon = a.style === 'danger' ? FaBan : FaCheck
                  return (
                    <button
                      key={`${a.action}-${i}`}
                      type="button"
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg ${styleButton(a.style)}`}
                      title={`→ ${a.targetStatus}`}
                      onClick={(e) => {
                        e.preventDefault()
                        const next = steps.findIndex((s) => s.statusCode === a.targetStatus)
                        if (next >= 0) setCurrentIdx(next)
                      }}
                    >
                      <Icon className="text-[10px]" />
                      {a.label || a.action}
                      <span className="text-white/70 text-[10px]">→ {a.targetStatus}</span>
                    </button>
                  )
                })}
              </div>
            )}
            <div className="text-[10px] text-gray-400 mt-2">Click a button to simulate the transition.</div>
          </div>
        </div>
      </div>

      {/* Warnings */}
      <StepWarnings step={step} />
    </div>
  )
}

function StepWarnings({ step }: { step: WorkflowStep }) {
  const issues: string[] = []
  if (!step.notifyPatient && !step.notifyProvider && (step.actionsForPatient.length + step.actionsForProvider.length) > 0) {
    issues.push('Silent step — nobody gets a notification on this status change.')
  }
  const allTargets = [...step.actionsForPatient, ...step.actionsForProvider].map((a) => a.targetStatus)
  for (const t of allTargets) {
    if (!t) issues.push(`An action is missing its targetStatus.`)
  }
  if (issues.length === 0) return null
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
      <div className="font-semibold mb-1">Review this step</div>
      <ul className="list-disc ml-4 space-y-0.5">
        {issues.map((i) => <li key={i}>{i}</li>)}
      </ul>
    </div>
  )
}
