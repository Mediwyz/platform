'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { FiCalendar, FiUser, FiExternalLink, FiRefreshCw, FiInbox } from 'react-icons/fi'
import WorkflowActionButton, { type StepAction, type StepFlags } from './WorkflowActionButton'
import { CATEGORY_BADGE, categoryFromLegacyStatus } from './stepCategoryStyles'

interface BookingInstance {
  id: string
  bookingId: string
  bookingType: string
  serviceMode: string
  currentStatus: string
  currentStepLabel: string
  currentStepFlags: StepFlags
  actionsForProvider: StepAction[]
  actionsForPatient: StepAction[]
  allSteps: Array<{ statusCode: string; label: string }>
  isCompleted: boolean
  isCancelled: boolean
  patientUserId: string
  providerUserId: string
  startedAt: string
  completedAt: string | null
  cancelledAt: string | null
  template: { id: string; name: string; providerType: string; serviceMode: string }
  metadata?: { servicePrice?: number; currency?: string } | null
}

interface PatientInfo {
  id: string
  firstName: string
  lastName: string
  profileImage: string | null
}

interface ProviderBookingsListProps {
  /** Base URL for this provider's dashboard, e.g. /provider/doc-slug */
  basePath: string
  /** Show only non-terminal bookings by default */
  defaultActiveOnly?: boolean
}

export default function ProviderBookingsList({ basePath, defaultActiveOnly = false }: ProviderBookingsListProps) {
  const [instances, setInstances] = useState<BookingInstance[]>([])
  const [patientCache, setPatientCache] = useState<Record<string, PatientInfo>>({})
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(!defaultActiveOnly)

  const fetchInstances = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/workflow/instances?role=provider', { credentials: 'include' })
      const json = await res.json()
      if (json.success) setInstances(json.data as BookingInstance[])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchInstances() }, [fetchInstances])

  // Lazy-fetch patient names for visible instances
  useEffect(() => {
    const missing = instances
      .map(i => i.patientUserId)
      .filter(uid => uid && !patientCache[uid])
    const unique = [...new Set(missing)]
    if (unique.length === 0) return

    unique.forEach(async (uid) => {
      try {
        const res = await fetch(`/api/users/${uid}`, { credentials: 'include' })
        const json = await res.json()
        const u = json.data ?? json.user
        if (u) {
          setPatientCache(prev => ({
            ...prev,
            [uid]: { id: u.id, firstName: u.firstName, lastName: u.lastName, profileImage: u.profileImage },
          }))
        }
      } catch { /* non-fatal */ }
    })
  }, [instances, patientCache])

  function handleTransition() {
    fetchInstances()
  }

  const visible = showAll
    ? instances
    : instances.filter(i => !i.isCompleted && !i.isCancelled)

  const active = visible.filter(i => !i.isCompleted && !i.isCancelled)
  const completed = visible.filter(i => i.isCompleted)
  const cancelled = visible.filter(i => i.isCancelled)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">
            {active.length} active · {completed.length} completed · {cancelled.length} cancelled
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAll(v => !v)}
            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
          >
            {showAll ? 'Hide completed' : 'Show all'}
          </button>
          <button
            onClick={fetchInstances}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500"
            aria-label="Refresh"
          >
            <FiRefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {instances.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FiInbox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No bookings yet</p>
          <p className="text-gray-400 text-sm mt-1">Accepted bookings will appear here with their current status and next actions.</p>
        </div>
      )}

      {active.length > 0 && (
        <Section title="Active" count={active.length}>
          {active.map(inst => (
            <BookingCard
              key={inst.id}
              inst={inst}
              patient={patientCache[inst.patientUserId]}
              basePath={basePath}
              onTransition={handleTransition}
            />
          ))}
        </Section>
      )}

      {showAll && completed.length > 0 && (
        <Section title="Completed" count={completed.length} muted>
          {completed.map(inst => (
            <BookingCard
              key={inst.id}
              inst={inst}
              patient={patientCache[inst.patientUserId]}
              basePath={basePath}
              onTransition={handleTransition}
            />
          ))}
        </Section>
      )}

      {showAll && cancelled.length > 0 && (
        <Section title="Cancelled" count={cancelled.length} muted>
          {cancelled.map(inst => (
            <BookingCard
              key={inst.id}
              inst={inst}
              patient={patientCache[inst.patientUserId]}
              basePath={basePath}
              onTransition={handleTransition}
            />
          ))}
        </Section>
      )}
    </div>
  )
}

function Section({ title, count, muted, children }: {
  title: string; count: number; muted?: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <h2 className={`text-sm font-semibold mb-3 ${muted ? 'text-gray-400' : 'text-brand-navy'}`}>
        {title} <span className="font-normal text-gray-400">({count})</span>
      </h2>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function BookingCard({ inst, patient, basePath, onTransition }: {
  inst: BookingInstance
  patient?: PatientInfo
  basePath: string
  onTransition: () => void
}) {
  const category = categoryFromLegacyStatus(inst.currentStatus, {
    isCancelled: inst.isCancelled,
    isCompleted: inst.isCompleted,
    hasActions: inst.actionsForProvider.length > 0,
  })
  const badge = CATEGORY_BADGE[category]

  const amountLabel = inst.metadata?.servicePrice
    ? `Rs ${inst.metadata.servicePrice}`
    : undefined

  const detailHref = `${basePath}/bookings/${inst.bookingType}/${inst.bookingId}`

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-4">
        {/* Left: patient + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-brand-teal/10 flex items-center justify-center text-brand-teal font-semibold text-xs flex-shrink-0">
              {patient ? `${patient.firstName[0]}${patient.lastName[0]}` : <FiUser className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {patient ? `${patient.firstName} ${patient.lastName}` : 'Loading…'}
              </p>
              <p className="text-xs text-gray-400 truncate">{inst.template.name} · {inst.serviceMode}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className={`${badge.bg} ${badge.text} px-2.5 py-0.5 rounded-full text-xs font-medium`}>
              {inst.currentStepLabel}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <FiCalendar className="w-3 h-3" />
              {new Date(inst.startedAt).toLocaleDateString('fr-FR')}
            </span>
            {amountLabel && (
              <span className="text-xs text-gray-500">{amountLabel}</span>
            )}
          </div>
        </div>

        {/* Right: detail link */}
        <Link
          href={detailHref}
          className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-brand-teal"
          aria-label="View full booking details"
        >
          <FiExternalLink className="w-4 h-4" />
        </Link>
      </div>

      {/* Action buttons - the main point: one-click advance to next status */}
      {inst.actionsForProvider.length > 0 && !inst.isCompleted && !inst.isCancelled && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
          {inst.actionsForProvider.map(action => (
            <WorkflowActionButton
              key={action.action}
              action={action}
              instanceId={inst.id}
              stepFlags={inst.currentStepFlags}
              nextStepLabel={inst.allSteps.find(s => s.statusCode === action.targetStatus)?.label}
              amountLabel={amountLabel}
              onTransition={onTransition}
            />
          ))}
        </div>
      )}

      {inst.actionsForProvider.length === 0 && !inst.isCompleted && !inst.isCancelled && (
        <p className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
          Waiting for the member to take action…
        </p>
      )}
    </div>
  )
}
