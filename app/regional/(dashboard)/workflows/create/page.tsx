'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import WorkflowBuilder from '@/components/workflow/builder/WorkflowBuilder'
import WorkflowWizard, { type GeneratedTemplate } from '@/components/workflow/builder/WorkflowWizard'

type WizardData = {
  name: string
  description: string
  serviceMode: string
  steps: unknown[]
  transitions: unknown[]
  serviceConfig: Record<string, unknown>
  paymentTiming: string
}

export default function CreateWorkflowPage() {
  const router = useRouter()
  const [showWizard, setShowWizard] = useState(true)
  const [wizardData, setWizardData] = useState<WizardData | null>(null)

  function handleWizardComplete(generated: GeneratedTemplate) {
    setWizardData({
      name: generated.name,
      description: generated.description,
      serviceMode: generated.serviceMode,
      steps: generated.steps,
      transitions: generated.transitions,
      serviceConfig: generated.serviceConfig,
      paymentTiming: generated.paymentTiming,
    })
    setShowWizard(false)
  }

  async function handleSaveDirectly(generated: GeneratedTemplate) {
    const res = await fetch('/api/workflow/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: generated.name,
        slug: generated.slug,
        description: generated.description,
        serviceMode: generated.serviceMode,
        providerType: generated.providerType,
        paymentTiming: generated.paymentTiming,
        steps: generated.steps,
        transitions: generated.transitions,
        serviceConfig: generated.serviceConfig,
        isPublished: true,
      }),
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.message || 'Failed to save template')
    router.push('/regional/workflows')
  }

  if (showWizard) {
    return (
      <WorkflowWizard
        onComplete={handleWizardComplete}
        onSave={handleSaveDirectly}
        onCancel={() => router.push('/regional/workflows')}
      />
    )
  }

  return (
    <WorkflowBuilder
      backHref="/regional/workflows"
      showAdminFields
      wizardData={wizardData}
      onRequestWizard={() => setShowWizard(true)}
    />
  )
}
