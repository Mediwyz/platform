'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FiCalendar, FiClock, FiUser, FiExternalLink, FiChevronDown, FiChevronUp, FiVideo } from 'react-icons/fi'
import WorkflowActionButton, { type StepAction, type StepFlags } from '@/components/workflow/WorkflowActionButton'
import { CATEGORY_BADGE, type StepCategory } from '@/components/workflow/stepCategoryStyles'

export interface BookingCardData {
  /** Workflow instance ID */
  id: string
  bookingId: string
  bookingType: string
  serviceMode: string
  currentStatus: string
  currentStepLabel: string
  currentStepFlags: StepFlags
  currentStepCategory: StepCategory
  actionsForPatient: StepAction[]
  actionsForProvider: StepAction[]
  allSteps: Array<{ statusCode: string; label: string }>
  isCompleted: boolean
  isCancelled: boolean
  startedAt: string
  completedAt: string | null
  cancelledAt: string | null
  templateName: string
  template: { name: string; providerType: string; serviceMode: string }
  /** Patient-side enrichment */
  patientUserId?: string
  /** Provider-side enrichment (pre-fetched in list view) */
  patientName?: string
  patientImage?: string | null
  scheduledAt?: string | null
  serviceName?: string
  reason?: string
  price?: number
  metadata?: { servicePrice?: number; currency?: string } | null
}

interface BookingCardProps {
  data: BookingCardData
  /** Which side of the booking this user is on */
  role: 'patient' | 'provider'
  /** Base path for the "View details" link, e.g. /patient or /provider/doctors */
  basePath: string
  onTransition: () => void
}

function formatScheduledAt(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const todayStr = now.toDateString()
  const tomorrowStr = new Date(now.getTime() + 86400e3).toDateString()
  const dateStr = d.toDateString()
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  if (dateStr === todayStr) return `Today at ${time}`
  if (dateStr === tomorrowStr) return `Tomorrow at ${time}`
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + ` at ${time}`
}

/** Left bar colour by category */
const CATEGORY_BAR: Record<StepCategory, string> = {
  pending: 'bg-amber-400',
  active:  'bg-brand-teal',
  success: 'bg-green-500',
  danger:  'bg-red-400',
  waiting: 'bg-gray-300',
}

export default function BookingCard({ data, role, basePath, onTransition }: BookingCardProps) {
  const [expanded, setExpanded] = useState(false)

  const badge  = CATEGORY_BADGE[data.currentStepCategory]
  const bar    = CATEGORY_BAR[data.currentStepCategory]
  const detailHref = `${basePath}/bookings/${data.bookingType}/${data.bookingId}`

  const actions = role === 'patient' ? data.actionsForPatient : data.actionsForProvider
  const waitingForOtherSide = actions.length === 0 && !data.isCompleted && !data.isCancelled

  const amountLabel = (data.metadata?.servicePrice ?? data.price)
    ? `${data.metadata?.currency ?? 'Rs'} ${data.metadata?.servicePrice ?? data.price}`
    : undefined

  const hasVideoCall = data.currentStepFlags?.triggers_video_call || data.serviceMode === 'video'

  /** Avatar initials - other party */
  const initials = data.patientName
    ? data.patientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-brand-teal/40 hover:shadow-sm transition-all">
      <div className="flex">
        {/* Status bar */}
        <div className={`w-1 flex-shrink-0 ${bar}`} aria-hidden="true" />

        {/* Content */}
        <div className="flex-1 p-4">
          {/* Top row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-brand-teal/10 flex items-center justify-center text-brand-teal font-semibold text-xs flex-shrink-0">
                {data.patientImage
                  ? <Image src={data.patientImage} alt="" width={36} height={36} className="w-9 h-9 rounded-full object-cover" />
                  : initials !== '?' ? initials : <FiUser className="w-4 h-4" />
                }
              </div>

              {/* Meta */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {data.templateName || data.serviceName || data.bookingType.replace(/_/g, ' ')}
                  </h3>
                  {data.patientName && (
                    <span className="text-xs text-gray-500 truncate">{data.patientName}</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <span className={`${badge.bg} ${badge.text} px-2 py-0.5 rounded-full text-xs font-medium`}>
                    {data.currentStepLabel}
                  </span>
                  {data.scheduledAt && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <FiCalendar className="w-3 h-3" />
                      {formatScheduledAt(data.scheduledAt)}
                    </span>
                  )}
                  {amountLabel && (
                    <span className="text-xs text-gray-500">{amountLabel}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {hasVideoCall && !data.isCompleted && !data.isCancelled && (
                <span className="hidden sm:flex items-center gap-1 text-xs text-brand-teal font-medium">
                  <FiVideo className="w-3 h-3" /> Video
                </span>
              )}
              <Link
                href={detailHref}
                className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-brand-teal"
                aria-label="View booking details"
              >
                <FiExternalLink className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setExpanded(v => !v)}
                className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600"
                aria-label={expanded ? 'Collapse' : 'Expand'}
                aria-expanded={expanded}
              >
                {expanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          {actions.length > 0 && !data.isCompleted && !data.isCancelled && (
            <div className="mt-3 pt-3 border-t border-gray-50 flex flex-wrap gap-2">
              {actions.map(action => (
                <WorkflowActionButton
                  key={action.action}
                  action={action}
                  instanceId={data.id}
                  stepFlags={data.currentStepFlags}
                  nextStepLabel={data.allSteps.find(s => s.statusCode === action.targetStatus)?.label}
                  amountLabel={amountLabel}
                  serviceMode={data.serviceMode}
                  onTransition={onTransition}
                />
              ))}
            </div>
          )}

          {waitingForOtherSide && (
            <p className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
              {role === 'patient'
                ? 'Waiting for the provider to take action…'
                : 'Waiting for the member to take action…'}
            </p>
          )}

          {/* Expanded: dates + booking type */}
          {expanded && (
            <div className="mt-3 pt-3 border-t border-gray-50 space-y-1.5 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <FiClock className="w-3.5 h-3.5 text-gray-300" />
                <span>Started {new Date(data.startedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              {data.completedAt && (
                <div className="flex items-center gap-1.5 text-green-600">
                  <FiClock className="w-3.5 h-3.5" />
                  <span>Completed {new Date(data.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              )}
              <div>
                <span className="text-gray-400">Type:</span>{' '}
                <span className="font-medium capitalize">{data.bookingType.replace(/_/g, ' ')} · {data.serviceMode}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
