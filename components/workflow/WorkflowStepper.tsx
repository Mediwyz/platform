'use client'

import { FiChevronRight, FiXCircle } from 'react-icons/fi'
import { CATEGORY_DOT, categoryFromLegacyStatus, type StepCategory } from './stepCategoryStyles'
import { resolveStepVisual, type StepIcon } from './stepIconRegistry'

export interface StepperStep {
  order: number
  statusCode: string
  label: string
  category?: StepCategory
  icon?: StepIcon
  flags?: Record<string, unknown>
  actionsForPatient?: unknown[]
  actionsForProvider?: unknown[]
}

interface WorkflowStepperProps {
  steps: StepperStep[]
  /** Highlight a specific status as the current position. Optional. */
  currentStatus?: string
  /** Compact mode for list cards. Full mode for detail views. */
  variant?: 'compact' | 'full'
}

/**
 * Numbered stepper with per-step emoji indicating what happens at that step.
 * Works for ANY workflow - custom status codes get a sensible icon inferred
 * from their flags + label keywords (see `stepIconRegistry.inferStepIcon`).
 *
 * Compact variant: single-line horizontal scroll, 28px dots. For list cards.
 * Full variant: vertical list with labels + flag badges. For detail views.
 */
export default function WorkflowStepper({
  steps, currentStatus, variant = 'compact',
}: WorkflowStepperProps) {
  if (!steps || steps.length === 0) {
    return <p className="text-xs text-faint">No steps defined yet.</p>
  }

  // Hide terminal-danger (cancelled) from the happy-path view. It's still
  // reachable via danger actions but clutters the stepper - show as a
  // separate badge on the side.
  const ordered = [...steps].sort((a, b) => a.order - b.order)
  const happyPath = ordered.filter(s => {
    const cat = s.category ?? categoryFromLegacyStatus(s.statusCode, {
      hasActions: (s.actionsForPatient?.length ?? 0) + (s.actionsForProvider?.length ?? 0) > 0,
    })
    return cat !== 'danger'
  })
  const dangerStep = ordered.find(s => {
    const cat = s.category ?? categoryFromLegacyStatus(s.statusCode, {
      hasActions: (s.actionsForPatient?.length ?? 0) + (s.actionsForProvider?.length ?? 0) > 0,
    })
    return cat === 'danger'
  })

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 -mx-1 px-1">
        {happyPath.map((step, idx) => {
          const { Icon, label } = resolveStepVisual({
            statusCode: step.statusCode, label: step.label,
            flags: step.flags, category: step.category,
            icon: step.icon,
            hasActions: (step.actionsForPatient?.length ?? 0) + (step.actionsForProvider?.length ?? 0) > 0,
          })
          const isCurrent = step.statusCode === currentStatus
          const category = step.category ?? categoryFromLegacyStatus(step.statusCode)
          const dotColor = CATEGORY_DOT[category]

          return (
            // Key combines order + status - some seeded/cloned templates
            // duplicate status codes (e.g. two "pending" steps during edit),
            // and a non-unique key triggers a React warning.
            <div key={`${step.order}-${step.statusCode}-${idx}`} className="flex items-center gap-1.5 flex-shrink-0">
              <div
                className={`flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full border ${
                  isCurrent
                    ? 'bg-surface border-brand-teal ring-2 ring-brand-teal/20'
                    : 'bg-subtle border-line'
                }`}
                title={`${idx + 1}. ${step.label} - ${label}`}
              >
                <span className={`w-5 h-5 rounded-full ${dotColor} flex items-center justify-center text-white flex-shrink-0`}>
                  <Icon className="w-3 h-3" aria-hidden="true" />
                </span>
                <span className="text-[11px] font-medium text-soft truncate max-w-[130px]">
                  <span className="text-faint mr-0.5">{idx + 1}.</span>{step.label}
                </span>
              </div>
              {idx < happyPath.length - 1 && (
                <FiChevronRight className="text-faint w-4 h-4 flex-shrink-0" aria-hidden="true" />
              )}
            </div>
          )
        })}
        {dangerStep && (
          <span
            className="flex items-center gap-1 ml-2 px-2 py-1 rounded-full bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 text-[11px] text-red-700 dark:text-red-300 flex-shrink-0"
            title={`Cancel path: ${dangerStep.label}`}
          >
            <FiXCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{dangerStep.label}</span>
          </span>
        )}
      </div>
    )
  }

  // Full variant - vertical list
  return (
    <ol className="space-y-2">
      {ordered.map((step, idx) => {
        const { Icon, label } = resolveStepVisual({
          statusCode: step.statusCode, label: step.label,
          flags: step.flags, category: step.category,
          icon: step.icon,
          hasActions: (step.actionsForPatient?.length ?? 0) + (step.actionsForProvider?.length ?? 0) > 0,
        })
        const isCurrent = step.statusCode === currentStatus
        const category = step.category ?? categoryFromLegacyStatus(step.statusCode)
        const dotColor = CATEGORY_DOT[category]

        return (
          <li key={`${step.order}-${step.statusCode}-${idx}`} className={`flex items-start gap-3 p-2 rounded-lg ${isCurrent ? 'bg-brand-teal/5 ring-1 ring-brand-teal/30' : ''}`}>
            <span className={`relative w-8 h-8 rounded-full ${dotColor} flex items-center justify-center text-white flex-shrink-0`}>
              <Icon className="w-4 h-4" aria-hidden="true" />
              <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-surface text-[9px] font-bold text-fg flex items-center justify-center border border-line">{step.order}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${isCurrent ? 'text-brand-navy' : 'text-fg'}`}>
                {step.label}
              </p>
              <p className="text-[11px] text-soft">
                <span className="font-mono">{step.statusCode}</span>
                <span className="mx-1.5">·</span>
                <span>{label}</span>
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
