'use client'

import { useMemo, useState } from 'react'
import WorkflowActionButton, { type StepAction, type StepFlags } from './WorkflowActionButton'
import {
  CATEGORY_BADGE, categoryFromLegacyStatus,
  type StepCategory,
} from './stepCategoryStyles'

interface WorkflowCurrentStepProps {
  instanceId: string
  currentStatus: string
  stepLabel: string
  stepFlags?: StepFlags
  actionsForPatient: StepAction[]
  actionsForProvider: StepAction[]
  userRole: 'patient' | 'provider'
  isCompleted: boolean
  isCancelled: boolean
  /** Compact list of every status on the template - drives next-step labels
   *  and per-status categorisation without a second round-trip. */
  allSteps?: Array<{ statusCode: string; label: string; category?: StepCategory }>
  /** Category of the current step, set by the engine. Falls back to a
   *  client-derived value when absent (legacy instances). */
  currentStepCategory?: StepCategory
  /** Pre-formatted amount for confirmation copy (e.g. "Rs 500"). */
  amountLabel?: string
  /** Booking service mode - passed to WorkflowActionButton for consequence copy
   *  ('video'  video room warning, 'audio'  audio room warning). */
  serviceMode?: string
  /** Session tracking - populated for recurrent/multi-session services */
  sessionNumber?: number
  maxSessions?: number
  onTransition?: (result: unknown) => void
}

export default function WorkflowCurrentStep({
  instanceId, currentStatus, stepLabel, stepFlags,
  actionsForPatient, actionsForProvider, userRole,
  isCompleted, isCancelled, allSteps, currentStepCategory,
  amountLabel, serviceMode, sessionNumber, maxSessions, onTransition,
}: WorkflowCurrentStepProps) {
  const actions = userRole === 'patient' ? actionsForPatient : actionsForProvider

  // Optimistic status flip: while a transition is in flight, show the target
  // badge so the UI feels instant. Rolls back on failure via the button's
  // onOptimisticRollback callback.
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null)
  const displayStatus = optimisticStatus ?? currentStatus
  const displayLabel = useMemo(() => {
    if (!optimisticStatus) return stepLabel
    return allSteps?.find(s => s.statusCode === optimisticStatus)?.label ?? optimisticStatus
  }, [optimisticStatus, stepLabel, allSteps])

  // Category-driven badge - never pattern-matches on the status code.
  // During an optimistic flip, borrow the target step's category so the pill
  // colour tracks the flip too.
  const displayCategory: StepCategory = useMemo(() => {
    if (optimisticStatus) {
      const target = allSteps?.find(s => s.statusCode === optimisticStatus)
      if (target?.category) return target.category
    }
    if (currentStepCategory) return currentStepCategory
    return categoryFromLegacyStatus(displayStatus, {
      isCancelled, isCompleted, hasActions: actions.length > 0,
    })
  }, [optimisticStatus, allSteps, currentStepCategory, displayStatus, isCancelled, isCompleted, actions.length])

  const badge = CATEGORY_BADGE[displayCategory]

  const nextLabelFor = (targetStatus: string): string | undefined =>
    allSteps?.find(s => s.statusCode === targetStatus)?.label

  return (
    <div className="bg-surface rounded-xl border border-line p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-medium text-soft uppercase tracking-wider">Current Status</p>
          <h3 className="text-lg font-semibold text-fg mt-1">{displayLabel}</h3>
        </div>
        <span className={`${badge.bg} ${badge.text} px-3 py-1 rounded-full text-sm font-medium`}>
          {displayStatus.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Session counter for recurrent/multi-session services */}
      {sessionNumber !== undefined && sessionNumber > 0 && (
        <div className="flex items-center gap-2 p-3 bg-brand-teal/5 border border-brand-teal/20 rounded-lg mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-teal text-white rounded-full flex items-center justify-center text-xs font-bold">
              {sessionNumber}
            </div>
            <span className="text-sm text-brand-teal font-medium">
              Session {sessionNumber}{maxSessions ? ` of ${maxSessions}` : ''}
            </span>
          </div>
          {maxSessions && (
            <div className="ml-auto flex-shrink-0">
              <div className="w-24 h-1.5 bg-line rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-teal rounded-full transition-all"
                  style={{ width: `${Math.min(100, (sessionNumber / maxSessions) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {isCompleted && (
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg mb-4">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm text-green-700 font-medium">This workflow is complete</span>
        </div>
      )}

      {isCancelled && (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg mb-4">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-sm text-red-700 font-medium">This booking has been cancelled</span>
        </div>
      )}

      {actions.length > 0 && !isCompleted && !isCancelled && (
        <div className="flex flex-wrap gap-3">
          {actions.map((action) => (
            <WorkflowActionButton
              key={action.action}
              action={action}
              instanceId={instanceId}
              stepFlags={stepFlags}
              nextStepLabel={nextLabelFor(action.targetStatus)}
              amountLabel={amountLabel}
              serviceMode={serviceMode}
              onTransition={onTransition}
              onOptimisticStart={(t) => setOptimisticStatus(t)}
              onOptimisticRollback={() => setOptimisticStatus(null)}
            />
          ))}
        </div>
      )}

      {actions.length === 0 && !isCompleted && !isCancelled && (
        <p className="text-sm text-faint">Waiting for the other party to take action...</p>
      )}
    </div>
  )
}
