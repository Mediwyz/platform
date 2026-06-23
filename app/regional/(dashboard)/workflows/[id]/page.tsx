'use client'

import { use, useState, useEffect } from 'react'
import WorkflowBuilder from '@/components/workflow/builder/WorkflowBuilder'
import { DashboardLoadingState } from '@/components/dashboard'

export default function EditWorkflowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [template, setTemplate] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/workflow/templates/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.success) setTemplate(data.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return <DashboardLoadingState />
  if (!template) return <div className="p-8 text-center text-soft">Template not found</div>

  // Normalise steps defensively - old seeded templates can have missing
  // action arrays / flags, which used to crash the builder with
  // "Cannot read properties of undefined (reading 'map')".
  const rawSteps = Array.isArray(template.steps) ? template.steps as any[] : []
  const normalisedSteps = rawSteps.map((s, i) => ({
    order: typeof s?.order === 'number' ? s.order : i + 1,
    statusCode: s?.statusCode ?? `step_${i + 1}`,
    label: s?.label ?? s?.statusCode ?? `Step ${i + 1}`,
    description: s?.description ?? '',
    actionsForPatient: Array.isArray(s?.actionsForPatient) ? s.actionsForPatient : [],
    actionsForProvider: Array.isArray(s?.actionsForProvider) ? s.actionsForProvider : [],
    flags: (s?.flags && typeof s.flags === 'object') ? s.flags : {},
    notifyPatient: s?.notifyPatient ?? null,
    notifyProvider: s?.notifyProvider ?? null,
  }))
  const rawTransitions = Array.isArray(template.transitions) ? template.transitions as any[] : []

  return (
    <WorkflowBuilder
      backHref="/regional/workflows"
      initialData={{
        id: template.id as string,
        name: template.name as string,
        slug: template.slug as string,
        description: (template.description as string) || '',
        providerType: template.providerType as string,
        serviceMode: template.serviceMode as string,
        steps: normalisedSteps as never[],
        transitions: rawTransitions as never[],
      }}
    />
  )
}
