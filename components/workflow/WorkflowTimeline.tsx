'use client'

import { FiCheck, FiX, FiClock, FiPlay, FiVideo, FiPackage, FiFileText } from 'react-icons/fi'
import { CATEGORY_DOT, categoryFromLegacyStatus, type StepCategory } from './stepCategoryStyles'

interface StepLogEntry {
 id: string
 fromStatus: string | null
 toStatus: string
 action: string
 actionByRole: string
 label: string
 message?: string | null
 contentType?: string | null
 triggeredVideoCallId?: string | null
 createdAt: string
}

interface WorkflowTimelineProps {
 steps: StepLogEntry[]
 currentStatus: string
 /** Status code  category lookup (from engine's allSteps). Optional;
  *  timeline falls back to legacy derivation when absent. */
 categoryByStatus?: Record<string, StepCategory>
}

function getStepIcon(step: StepLogEntry) {
 if (step.toStatus === 'completed' || step.toStatus === 'resolved') return <FiCheck className="w-4 h-4" />
 if (step.toStatus === 'cancelled') return <FiX className="w-4 h-4" />
 if (step.toStatus.includes('call') || step.toStatus.includes('video')) return <FiVideo className="w-4 h-4" />
 if (step.toStatus.includes('stock') || step.toStatus.includes('preparing')) return <FiPackage className="w-4 h-4" />
 if (step.contentType) return <FiFileText className="w-4 h-4" />
 if (step.toStatus.includes('progress') || step.toStatus.includes('consultation')) return <FiPlay className="w-4 h-4" />
 return <FiClock className="w-4 h-4" />
}

function resolveCategory(
 step: StepLogEntry,
 categoryByStatus?: Record<string, StepCategory>,
): StepCategory {
 return categoryByStatus?.[step.toStatus] ?? categoryFromLegacyStatus(step.toStatus)
}

export default function WorkflowTimeline({ steps, currentStatus, categoryByStatus }: WorkflowTimelineProps) {
 if (!steps || steps.length === 0) {
 return <p className="text-soft text-sm">No workflow history yet.</p>
 }

 return (
 <div className="flow-root">
 <ul className="-mb-8">
 {steps.map((step, idx) => {
 const isLast = idx === steps.length - 1
 const isCurrent = step.toStatus === currentStatus
 // Current / latest step gets its real category colour. Earlier steps
 // fade to grey so the eye lands on "where am I now?".
 const category = resolveCategory(step, categoryByStatus)
 const color = (isCurrent || isLast) ? CATEGORY_DOT[category] : 'bg-gray-400'

 return (
 <li key={step.id}>
 <div className="relative pb-8">
 {!isLast && (
 <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-line" aria-hidden="true" />
 )}
 <div className="relative flex space-x-3">
 <div>
 <span className={`${color} h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white text-white`}>
 {getStepIcon(step)}
 </span>
 </div>
 <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1">
 <div>
 <p className={`text-sm font-medium ${isCurrent ? 'text-fg' : 'text-soft'}`}>
 {step.label}
 </p>
 {step.message && (
 <p className="mt-0.5 text-xs text-soft">{step.message}</p>
 )}
 {step.contentType && (
 <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
 <FiFileText className="w-3 h-3" />
 {step.contentType.replace(/_/g, ' ')}
 </span>
 )}
 {step.triggeredVideoCallId && (
 <span className="inline-flex items-center gap-1 mt-1 ml-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
 <FiVideo className="w-3 h-3" />
 Video call
 </span>
 )}
 </div>
 <div className="whitespace-nowrap text-right text-xs text-faint">
 <time dateTime={step.createdAt}>
 {new Date(step.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
 </time>
 <p className="text-faint">
 {step.actionByRole === 'patient' ? 'Patient' : step.actionByRole === 'provider' ? 'Provider' : 'System'}
 </p>
 </div>
 </div>
 </div>
 </div>
 </li>
 )
 })}
 </ul>
 </div>
 )
}
