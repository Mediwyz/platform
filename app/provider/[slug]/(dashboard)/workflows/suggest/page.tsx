'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { FiSend, FiPlus, FiTrash2, FiCheckCircle } from 'react-icons/fi'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import DashboardPageHeader from '@/components/shared/DashboardPageHeader'

interface StepType {
  code: string
  label: string
  description: string
  category: string
  defaultActionsProvider: { action: string; label: string; targetStatus: string; style: string }[]
  defaultActionsPatient: { action: string; label: string; targetStatus: string; style: string }[]
}

interface SuggestedStep {
  order: number
  statusCode: string
  label: string
  stepType?: string
  actionsForProvider: { action: string; label: string; targetStatus: string; style: string }[]
  actionsForPatient: { action: string; label: string; targetStatus: string; style: string }[]
  flags: Record<string, unknown>
  notifyPatient?: { title: string; message: string }
  notifyProvider?: { title: string; message: string }
}

export default function SuggestWorkflowPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()

  const [stepTypes, setStepTypes] = useState<StepType[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [serviceMode, setServiceMode] = useState('office')
  const [steps, setSteps] = useState<SuggestedStep[]>([
    { order: 1, statusCode: 'pending', label: 'Pending', stepType: 'PENDING', actionsForProvider: [{ action: 'accept', label: 'Accept', targetStatus: 'completed', style: 'primary' }], actionsForPatient: [], flags: {} },
  ])
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/workflow/step-types', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.success) setStepTypes(d.data) })
      .catch(() => {})
  }, [])

  const addStep = () => {
    setSteps(prev => [
      ...prev,
      {
        order: prev.length + 1,
        statusCode: `step_${prev.length + 1}`,
        label: `Step ${prev.length + 1}`,
        actionsForProvider: [],
        actionsForPatient: [],
        flags: {},
      },
    ])
  }

  const removeStep = (idx: number) => setSteps(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 })))

  const applyStepType = (idx: number, code: string) => {
    const type = stepTypes.find(t => t.code === code)
    if (!type) return
    setSteps(prev => prev.map((s, i) => i !== idx ? s : {
      ...s,
      stepType: code,
      label: type.label,
      statusCode: code.toLowerCase(),
      actionsForProvider: [...type.defaultActionsProvider],
      actionsForPatient: [...type.defaultActionsPatient],
    }))
  }

  const updateStep = (idx: number, field: keyof SuggestedStep, value: unknown) => {
    setSteps(prev => prev.map((s, i) => i !== idx ? s : { ...s, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Please enter a workflow name.'); return }
    if (steps.length < 2) { setError('A workflow needs at least 2 steps.'); return }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/workflow/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          description,
          serviceMode,
          steps,
          transitions: [],
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'Failed to submit')
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <FiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-fg mb-2">Suggestion submitted!</h2>
        <p className="text-soft mb-6">Your regional admin will review your workflow and notify you when it is approved.</p>
        <Link href={`/provider/${slug}/workflows`} className="inline-flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90">
          Back to Workflows
        </Link>
      </div>
    )
  }

  const grouped = stepTypes.reduce<Record<string, StepType[]>>((acc, t) => {
    (acc[t.category] = acc[t.category] || []).push(t)
    return acc
  }, {})

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <DashboardPageHeader
        icon={FiSend}
        title="Suggest a Workflow"
        description="Describe a custom booking flow. Your regional admin will review and activate it."
        back={{ label: 'Back to Workflows', onClick: () => router.push(`/provider/${slug}/workflows`) }}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Meta */}
      <div className="bg-surface rounded-xl border border-line p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-soft mb-1">Workflow name *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Home Visit with Lab Sample"
            className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-soft mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            placeholder="Briefly explain when this workflow is used"
            className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-soft mb-1">Service mode</label>
          <select
            value={serviceMode}
            onChange={e => setServiceMode(e.target.value)}
            className="rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
          >
            <option value="office">Office</option>
            <option value="home">Home visit</option>
            <option value="video">Video call</option>
            <option value="delivery">Delivery</option>
            <option value="emergency">Emergency</option>
            <option value="recurrent">Recurrent (Programme)</option>
          </select>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-soft">Steps ({steps.length})</h2>
          <button onClick={addStep} className="flex items-center gap-1.5 text-sm text-brand-teal hover:text-brand-teal/80 font-medium">
            <FiPlus className="w-4 h-4" /> Add step
          </button>
        </div>

        {steps.map((step, idx) => (
          <div key={idx} className="bg-surface rounded-xl border border-line p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-faint uppercase tracking-wide">Step {step.order}</span>
              {steps.length > 1 && (
                <button onClick={() => removeStep(idx)} className="text-faint hover:text-red-500">
                  <FiTrash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-soft mb-1">Use a preset step type</label>
                <select
                  value={step.stepType || ''}
                  onChange={e => applyStepType(idx, e.target.value)}
                  className="w-full rounded-lg border border-line px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                >
                  <option value=""> - Custom - </option>
                  {Object.entries(grouped).map(([cat, types]) => (
                    <optgroup key={cat} label={cat.replace(/_/g, ' ')}>
                      {types.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-soft mb-1">Step label</label>
                <input
                  value={step.label}
                  onChange={e => updateStep(idx, 'label', e.target.value)}
                  className="w-full rounded-lg border border-line px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>
            </div>

            {step.stepType && stepTypes.find(t => t.code === step.stepType)?.description && (
              <p className="text-xs text-faint italic">{stepTypes.find(t => t.code === step.stepType)?.description}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-teal text-white rounded-lg font-medium hover:bg-brand-teal/90 disabled:opacity-50"
        >
          <FiSend className="w-4 h-4" />
          {submitting ? 'Submitting…' : 'Submit suggestion'}
        </button>
      </div>
    </div>
  )
}
