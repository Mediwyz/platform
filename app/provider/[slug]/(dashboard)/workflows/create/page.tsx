'use client'

import { useEffect, useState } from 'react'
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

/**
 * Provider-side create page. We lock the providerType to the current user's
 * role so they can only create workflows for themselves - no surprise when a
 * nurse saves a template tagged as DOCTOR.
 *
 * Reads the canonical ProviderRole.code from `/api/auth/me.user.userTypeCode`
 * (resolved server-side via the DB-driven RolesResolverService). We NEVER
 * hardcode cookie→code maps on the frontend - provider roles are authored
 * dynamically by regional admins, so any hardcoded list goes stale the
 * moment a new role is created.
 */
export default function CreateWorkflowPage() {
  const [userType, setUserType] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(false)
  const [wizardData, setWizardData] = useState<WizardData | null>(null)

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(j => {
        const canonical: string | undefined = j?.user?.userTypeCode
        // Only lock the dropdown for real provider roles; leave it free for
        // REGIONAL_ADMIN / MEMBER so those accounts can author on behalf of
        // any type. Whether a role is a provider is DB-driven - here we
        // just exclude the two system user types.
        if (canonical && canonical !== 'REGIONAL_ADMIN' && canonical !== 'MEMBER') {
          setUserType(canonical)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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

  if (loading) {
    return <div className="p-6 text-sm text-soft">Loading...</div>
  }

  if (showWizard) {
    return (
      <div className="p-6">
        <WorkflowWizard
          onComplete={handleWizardComplete}
          onCancel={() => setShowWizard(false)}
          providerType={userType || undefined}
        />
      </div>
    )
  }

  return (
    <WorkflowBuilder
      backHref="../workflows"
      lockedProviderType={userType || undefined}
      wizardData={wizardData}
      onRequestWizard={() => setShowWizard(true)}
    />
  )
}
