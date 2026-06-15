'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { toast } from 'react-toastify'
import { FiPaperclip, FiAlertTriangle } from 'react-icons/fi'

export interface StepAction {
  action: string
  label: string
  targetStatus: string
  style?: 'primary' | 'danger' | 'secondary'
  confirmationRequired?: boolean
}

/** Only the flags that are still meaningful per-step - set by step-type defaultFlags, never placed manually. */
export interface StepFlags {
  requires_content?: string
  requires_prescription?: boolean
  triggers_video_call?: boolean
  triggers_audio_call?: boolean
  [key: string]: unknown
}

interface WorkflowActionButtonProps {
  action: StepAction
  instanceId: string
  onTransition?: (result: unknown) => void
  disabled?: boolean
  stepFlags?: StepFlags
  /** Status-code → label on this template, used to render "→ next: X". */
  nextStepLabel?: string
  /** Pre-formatted price string, e.g. "Rs 500" - used in confirmation copy. */
  amountLabel?: string
  /** Booking service mode - drives "video room will be opened" copy. */
  serviceMode?: string
  onOptimisticStart?: (targetStatus: string) => void
  onOptimisticRollback?: () => void
}

const STYLE_MAP = {
  primary: 'bg-brand-navy hover:bg-brand-teal text-white',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
}

/**
 * Build consequence-aware confirmation copy from the action + booking context.
 * All side-effects are now systematic (no per-step flags), so we derive them
 * from the action name and the booking's service mode / price.
 */
function buildConfirmCopy(
  action: StepAction,
  stepFlags: StepFlags,
  amountLabel?: string,
  serviceMode?: string,
): string {
  const parts: string[] = []
  const isAccept = ['accept', 'confirm', 'approve'].includes(action.action)
  const isCancel = action.style === 'danger'

  if (isAccept && amountLabel) {
    parts.push(`${amountLabel} will be debited from the patient's wallet.`)
  }
  if (isAccept && serviceMode === 'video') {
    parts.push('A video room will be opened for this booking.')
  }
  if (isAccept && serviceMode === 'audio') {
    parts.push('An audio call room will be opened.')
  }
  if (stepFlags.triggers_video_call) {
    parts.push('A video room will be opened when this step is reached.')
  }
  if (stepFlags.triggers_audio_call) {
    parts.push('An audio call room will be opened when this step is reached.')
  }
  if (isCancel) {
    parts.push('This booking will be cancelled. The time slot will be freed.')
    if (amountLabel) parts.push(`${amountLabel} will be refunded to the patient's wallet.`)
  }

  return parts.length > 0
    ? parts.join(' ')
    : `This will move the booking to "${action.label}". This action cannot be undone.`
}

function buildAriaLabel(action: StepAction, stepFlags: StepFlags, serviceMode?: string): string {
  const effects: string[] = []
  if (['accept', 'confirm', 'approve'].includes(action.action)) {
    if (serviceMode === 'video' || stepFlags.triggers_video_call) effects.push('will open video room')
    if (serviceMode === 'audio' || stepFlags.triggers_audio_call) effects.push('will open audio room')
  }
  if (action.style === 'danger') effects.push('destructive action')
  return effects.length > 0 ? `${action.label} - ${effects.join(', ')}` : action.label
}

export default function WorkflowActionButton({
  action, instanceId, onTransition, disabled,
  stepFlags = {}, nextStepLabel, amountLabel, serviceMode,
  onOptimisticStart, onOptimisticRollback,
}: WorkflowActionButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [contentText, setContentText] = useState('')
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null)
  const [attachedFileData, setAttachedFileData] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLDivElement>(null)

  const style = STYLE_MAP[action.style || 'secondary']
  const isDanger = action.style === 'danger'
  const needsContent = Boolean(stepFlags.requires_content)
  const needsConfirm = isDanger || action.confirmationRequired || needsContent ||
    Boolean(amountLabel) ||
    ['accept', 'confirm', 'approve'].includes(action.action)

  const confirmCopy = useMemo(
    () => buildConfirmCopy(action, stepFlags, amountLabel, serviceMode),
    [action, stepFlags, amountLabel, serviceMode],
  )
  const ariaLabel = useMemo(
    () => buildAriaLabel(action, stepFlags, serviceMode),
    [action, stepFlags, serviceMode],
  )

  // Close modal on Escape
  useEffect(() => {
    if (!showConfirm) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowConfirm(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [showConfirm])

  // Trap focus inside modal
  useEffect(() => {
    if (showConfirm) confirmRef.current?.focus()
  }, [showConfirm])

  async function handleClick() {
    if (needsConfirm) { setShowConfirm(true); return }
    await executeTransition()
  }

  async function executeTransition() {
    if (needsContent && !contentText.trim() && !attachedFileData) {
      toast.error(`A ${String(stepFlags.requires_content).replace(/_/g, ' ')} is required before this step.`)
      return
    }
    setLoading(true)
    onOptimisticStart?.(action.targetStatus)
    try {
      const body: Record<string, unknown> = { instanceId, action: action.action }
      if (needsContent) {
        body.contentType = stepFlags.requires_content
        body.contentData = {
          notes: contentText.trim() || undefined,
          fileName: attachedFileName || undefined,
          fileDataBase64: attachedFileData || undefined,
          submittedAt: new Date().toISOString(),
        }
      }
      const res = await fetch('/api/workflow/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success) {
        toast.success(nextStepLabel ? `Moved to "${nextStepLabel}"` : `${action.label} - done`)
        setShowConfirm(false)
        setContentText('')
        setAttachedFileName(null)
        setAttachedFileData(null)
        onTransition?.(data.data)
      } else {
        onOptimisticRollback?.()
        toast.error(data.message || 'Action failed')
      }
    } catch {
      onOptimisticRollback?.()
      toast.error('Network error - try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5 MB.'); return }
    const reader = new FileReader()
    reader.onload = () => {
      setAttachedFileName(file.name)
      setAttachedFileData(typeof reader.result === 'string' ? reader.result : null)
    }
    reader.readAsDataURL(file)
  }

  return (
    <>
      <div className="flex flex-col gap-0.5">
        <button
          onClick={handleClick}
          disabled={disabled || loading}
          aria-label={ariaLabel}
          className={`${style} px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? 'Processing...' : action.label}
        </button>
        {nextStepLabel && (
          <span className="text-[11px] text-gray-400 pl-1" aria-hidden="true">
            → next: {nextStepLabel}
          </span>
        )}
      </div>

      {showConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wf-confirm-title"
          onClick={(e) => { if (e.target === e.currentTarget) setShowConfirm(false) }}
        >
          <div ref={confirmRef} tabIndex={-1} className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl outline-none">
            <div className="flex items-start gap-3">
              {isDanger && <FiAlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" aria-hidden="true" />}
              <div className="flex-1">
                <h3 id="wf-confirm-title" className="text-lg font-semibold text-gray-900">{action.label}</h3>
                <p className="mt-2 text-sm text-gray-600">{confirmCopy}</p>
              </div>
            </div>

            {needsContent && (
              <div className="mt-4 space-y-2">
                <label className="block text-xs font-medium text-gray-700">
                  {String(stepFlags.requires_content).replace(/_/g, ' ')} - notes
                </label>
                <textarea
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 p-2 text-sm focus:ring-2 focus:ring-brand-teal focus:border-transparent outline-none"
                  placeholder="Type your notes here..."
                />
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFile}
                    className="hidden"
                    aria-label="Attach supporting document"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200"
                  >
                    <FiPaperclip className="w-3.5 h-3.5" />
                    {attachedFileName ? 'Replace file' : 'Attach file'}
                  </button>
                  {attachedFileName && (
                    <span className="text-xs text-gray-500 truncate">{attachedFileName}</span>
                  )}
                </div>
              </div>
            )}

            <div className="mt-5 flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={executeTransition}
                disabled={loading}
                aria-label={`Confirm: ${ariaLabel}`}
                className={`${style} px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50`}
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
