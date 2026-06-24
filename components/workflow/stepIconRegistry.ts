/**
 * Canonical icon registry for workflow steps.
 *
 * Icons are a closed set - authors pick from this registry (or let the
 * engine infer one from step shape). Keeping it closed means:
 *   • the library renders consistently across all provider roles
 *   • we don't end up with 40 emojis for "the nurse arrived" because every
 *     author picked a different one
 *   • new status codes authored by regional admins automatically get a
 *     sensible icon with zero admin work
 *
 * Authors override the inference with an explicit `icon` field on the step.
 */

export type StepIcon =
  | 'pending'
  | 'accepted'
  | 'payment'
  | 'paid'
  | 'refund'
  | 'transport'
  | 'at_home'
  | 'at_office'
  | 'at_lab'
  | 'at_hospital'
  | 'video_call'
  | 'audio_call'
  | 'chat'
  | 'sample_collection'
  | 'analysis'
  | 'surgery'
  | 'prescription'
  | 'document'
  | 'review'
  | 'completed'
  | 'cancelled'
  | 'waiting'

import type { IconType } from 'react-icons'
import {
  FiClock, FiCheckCircle, FiCreditCard, FiDollarSign, FiRotateCcw, FiTruck,
  FiHome, FiBriefcase, FiVideo, FiPhone, FiMessageSquare, FiFileText, FiStar,
  FiXCircle, FiPauseCircle,
} from 'react-icons/fi'
import {
  FaFlask, FaHospital, FaVial, FaMicroscope, FaStethoscope,
  FaPrescriptionBottleAlt, FaFlagCheckered,
} from 'react-icons/fa'

/** Real SVG icon component per step type (ui-ux-pro-max: SVG icons, not emoji). */
export const STEP_ICON_COMPONENT: Record<StepIcon, IconType> = {
  pending: FiClock,
  accepted: FiCheckCircle,
  payment: FiCreditCard,
  paid: FiDollarSign,
  refund: FiRotateCcw,
  transport: FiTruck,
  at_home: FiHome,
  at_office: FiBriefcase,
  at_lab: FaFlask,
  at_hospital: FaHospital,
  video_call: FiVideo,
  audio_call: FiPhone,
  chat: FiMessageSquare,
  sample_collection: FaVial,
  analysis: FaMicroscope,
  surgery: FaStethoscope,
  prescription: FaPrescriptionBottleAlt,
  document: FiFileText,
  review: FiStar,
  completed: FaFlagCheckered,
  cancelled: FiXCircle,
  waiting: FiPauseCircle,
}

export const STEP_ICON_EMOJI: Record<StepIcon, string> = {
  pending: '⏳',
  accepted: '✅',
  payment: '💳',
  paid: '💰',
  refund: '💸',
  transport: '🚗',
  at_home: '🏠',
  at_office: '🏥',
  at_lab: '🧪',
  at_hospital: '🏨',
  video_call: '📹',
  audio_call: '📞',
  chat: '💬',
  sample_collection: '🧫',
  analysis: '🔬',
  surgery: '🩺',
  prescription: '💊',
  document: '📄',
  review: '⭐',
  completed: '🏁',
  cancelled: '❌',
  waiting: '🕐',
}

export const STEP_ICON_LABEL: Record<StepIcon, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  payment: 'Payment',
  paid: 'Paid',
  refund: 'Refund',
  transport: 'En route',
  at_home: 'At home',
  at_office: 'At the office',
  at_lab: 'At the lab',
  at_hospital: 'At the hospital',
  video_call: 'Video call',
  audio_call: 'Audio call',
  chat: 'Conversation',
  sample_collection: 'Sample collection',
  analysis: 'Analysis',
  surgery: 'Surgery',
  prescription: 'Prescription',
  document: 'Document',
  review: 'Review',
  completed: 'Completed',
  cancelled: 'Cancelled',
  waiting: 'Waiting',
}

interface IconInferenceInput {
  statusCode?: string
  label?: string
  flags?: Record<string, unknown>
  category?: 'pending' | 'active' | 'success' | 'danger' | 'waiting'
  hasActions?: boolean
}

/**
 * Derive an icon from the step's shape when the author didn't set one.
 * Order matters - most specific signals (flags) win over keyword matches.
 */
export function inferStepIcon(step: IconInferenceInput): StepIcon {
  const flags = step.flags ?? {}
  const text = `${step.statusCode ?? ''} ${step.label ?? ''}`.toLowerCase()

  // Flag-driven (most specific) - only the 4 flags that remain in StepFlags.
  // Payment, refund, conversation, and review-request are now systematic Tier-2
  // triggers; their icons fall back to keyword matching below.
  if (flags.triggers_video_call) return 'video_call'
  if (flags.triggers_audio_call) return 'audio_call'
  if (flags.requires_prescription || flags.requires_content === 'prescription') return 'prescription'
  if (flags.requires_content) return 'document'

  // Keyword matches (catch-all for custom status labels)
  const has = (...words: string[]) => words.some(w => text.includes(w))
  if (has('surgery', 'operation', 'procedure', 'intervention')) return 'surgery'
  if (has('analysis', 'analyse', 'testing', 'quality_check', 'controle', 'qualit')) return 'analysis'
  if (has('sample', 'prelev', 'collect', 'specimen')) return 'sample_collection'
  if (has('refund', 'rembours')) return 'refund'
  if (has('payment', 'paiement', 'paid', 'paye')) return 'paid'
  if (has('review', 'avis', 'rating', 'notation')) return 'review'
  if (has('chat', 'conversation', 'message', 'discussion')) return 'chat'
  if (has('route', 'travelling', 'en_route', 'transit', 'travel', 'dispatched')) return 'transport'
  if (has('arrived', 'arriv', 'domicile', 'at_home', 'at_house')) return 'at_home'
  if (has('hospital', 'hopital', 'hôpital', 'clinic', 'at_hospital')) return 'at_hospital'
  if (has('lab', 'laboratoire')) return 'at_lab'
  if (has('office', 'cabinet', 'at_office', 'clinic')) return 'at_office'
  if (has('accept', 'confirm', 'approved')) return 'accepted'

  // Category fallback
  if (step.category === 'success') return 'completed'
  if (step.category === 'danger') return 'cancelled'
  if (step.category === 'pending') return 'pending'
  if (step.category === 'waiting' || step.hasActions === false) return 'waiting'

  return 'accepted'
}

/** Shortcut for rendering: returns { icon, Icon (SVG component), emoji, label }. */
export function resolveStepVisual(step: IconInferenceInput & { icon?: StepIcon }) {
  const icon = (step.icon && STEP_ICON_EMOJI[step.icon]) ? step.icon : inferStepIcon(step)
  return {
    icon,
    Icon: STEP_ICON_COMPONENT[icon],
    emoji: STEP_ICON_EMOJI[icon],
    label: STEP_ICON_LABEL[icon],
  }
}
