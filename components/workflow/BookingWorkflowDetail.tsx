'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { FiArrowLeft, FiCalendar, FiUser, FiClock } from 'react-icons/fi'
import Link from 'next/link'
import { useSocket } from '@/hooks/useSocket'
import WorkflowTimeline from './WorkflowTimeline'
import WorkflowCurrentStep from './WorkflowCurrentStep'
import WorkflowVideoCallBanner from './WorkflowVideoCallBanner'
import WorkflowContentViewer from './WorkflowContentViewer'
import SessionProgress from './SessionProgress'
import type { SessionEntry } from './SessionProgress'

interface BookingWorkflowDetailProps {
 bookingType: string
 bookingId: string
 userRole: 'patient' | 'provider'
 backHref: string
}

interface WorkflowState {
 instanceId: string
 templateName: string
 bookingId: string
 bookingType: string
 serviceMode: string
 currentStatus: string
 currentStepLabel: string
 currentStepFlags: Record<string, unknown>
 actionsForPatient: Array<{ action: string; label: string; targetStatus: string; style?: 'primary' | 'danger' | 'secondary' }>
 actionsForProvider: Array<{ action: string; label: string; targetStatus: string; style?: 'primary' | 'danger' | 'secondary' }>
 isCompleted: boolean
 isCancelled: boolean
 startedAt: string
 completedAt: string | null
 allSteps?: Array<{ statusCode: string; label: string; category?: 'pending' | 'active' | 'success' | 'danger' | 'waiting' }>
 currentStepCategory?: 'pending' | 'active' | 'success' | 'danger' | 'waiting'
 metadata?: {
   servicePrice?: number
   currency?: string
   sessionNumber?: number
   maxSessions?: number
   programId?: string
   nextSessionAt?: string
 } | null
}

interface StepLog {
 id: string
 fromStatus: string | null
 toStatus: string
 action: string
 actionByRole: string
 label: string
 message: string | null
 contentType: string | null
 contentData: Record<string, unknown> | null
 triggeredVideoCallId: string | null
 createdAt: string
}

export default function BookingWorkflowDetail({ bookingType, bookingId, userRole, backHref }: BookingWorkflowDetailProps) {
 const [state, setState] = useState<WorkflowState | null>(null)
 const [timeline, setTimeline] = useState<StepLog[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)
 const { socket, connected } = useSocket()
 const lastStatusRef = useRef<string | null>(null)

 const fetchData = useCallback(async () => {
 try {
 // Find workflow instance by booking
 const instanceRes = await fetch(`/api/workflow/instances?role=${userRole}&bookingType=${bookingType}`, { credentials: 'include' })
 const instanceData = await instanceRes.json()

 if (!instanceData.success) {
 setError('Could not load workflow data')
 setLoading(false)
 return
 }

 const instance = (instanceData.data as Array<{ bookingId: string; id: string }>)?.find(
 (i) => i.bookingId === bookingId
 )

 if (!instance) {
 setError('No workflow found for this booking')
 setLoading(false)
 return
 }

 // Fetch state and timeline in parallel
 const [stateRes, timelineRes] = await Promise.all([
 fetch(`/api/workflow/instances/${instance.id}`, { credentials: 'include' }),
 fetch(`/api/workflow/instances/${instance.id}/timeline`, { credentials: 'include' }),
 ])

 const [stateData, timelineData] = await Promise.all([stateRes.json(), timelineRes.json()])

 if (stateData.success) setState(stateData.data)
 if (timelineData.success) setTimeline(timelineData.data)
 } catch {
 setError('Failed to load booking details')
 } finally {
 setLoading(false)
 }
 }, [bookingType, bookingId, userRole])

 useEffect(() => {
 fetchData()
 }, [fetchData])

 // Real-time resync: listen for workflow-related notifications on the user's
 // socket room and refetch. When the OTHER party drives a transition
 // (patient cancels, provider accepts on another tab) we receive a
 // `notification:new` on `user:{userId}` and can reconcile local state
 // without a page reload. Status changes not driven by this tab also
 // surface a toast so the badge never jumps silently.
 useEffect(() => {
 if (!socket || !connected) return

 ;(async () => {
  try {
  const meRes = await fetch('/api/auth/me', { credentials: 'include' })
  const meJson = await meRes.json()
  // `/api/auth/me` returns `{ success, user: {...} }` - joining the
  // `user:{userId}` room is what actually wires up real-time updates.
  const uid = meJson?.user?.id ?? meJson?.data?.id
  if (meJson?.success && uid) {
   socket.emit('chat:join', { userId: uid })
  }
  } catch {
  // non-fatal
  }
 })()

 const onNotification = (notif: { relatedType?: string; relatedId?: string }) => {
  if (!state) return
  const isWorkflow = notif?.relatedType === 'workflow' || notif?.relatedType === 'booking'
  const mentionsThisBooking =
   notif?.relatedId === state.bookingId || notif?.relatedId === state.instanceId
  if (isWorkflow && mentionsThisBooking) fetchData()
 }

 socket.on('notification:new', onNotification)
 return () => { socket.off('notification:new', onNotification) }
 }, [socket, connected, state, fetchData])

 // `DashboardLayout` already toasts every incoming `notification:new`
 // globally. Firing another toast here on state change would duplicate
 // that, so we just silently track the last status for future use
 // (optimistic-flip rollback + diff-based animations if needed).
 useEffect(() => {
 if (!state) return
 lastStatusRef.current = state.currentStatus
 }, [state])

 function handleTransition() {
 // Refresh data after a transition
 fetchData()
 }

 if (loading) {
 return (
 <div className="flex items-center justify-center py-20">
 <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-teal" />
 </div>
 )
 }

 if (error || !state) {
 return (
 <div className="max-w-2xl mx-auto py-10 px-4">
 <Link href={backHref} className="flex items-center gap-2 text-brand-teal hover:text-brand-navy mb-4 text-sm">
 <FiArrowLeft className="w-4 h-4" /> Back
 </Link>
 <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
 <p className="text-yellow-800 font-medium">{error || 'Booking not found'}</p>
 <p className="text-yellow-600 text-sm mt-1">This booking may not have a workflow attached yet.</p>
 </div>
 </div>
 )
 }

 // Find the latest video call ID from timeline
 const latestVideoCallId = [...timeline].reverse().find(s => s.triggeredVideoCallId)?.triggeredVideoCallId

 // Derive call mode from booking service mode - the engine fires video or audio
 // rooms automatically based on this; no per-step flag needed.
 const callMode: 'video' | 'audio' = state.serviceMode === 'video' ? 'video' : 'audio'

 // Collect content attachments from timeline
 const contentSteps = timeline.filter(s => s.contentType && s.contentData)

 // Build session progress for recurrent programmes
 const isRecurrent = state.serviceMode === 'recurrent'
 const maxSessions = state.metadata?.maxSessions ?? 0
 const currentSession = state.metadata?.sessionNumber ?? 0
 const sessionEntries: SessionEntry[] = isRecurrent && maxSessions > 0
  ? Array.from({ length: maxSessions }, (_, i) => {
    const n = i + 1
    const completedLog = timeline.filter(l =>
     l.toStatus === 'session_scheduled' || l.toStatus === 'discharge_assessment' || l.toStatus === 'discharged'
    )[i]
    if (n < currentSession) return { sessionNumber: n, status: 'completed' as const, completedAt: completedLog?.createdAt }
    if (n === currentSession) {
     const inProgress = ['session_in_progress', 'session_notes_pending', 'therapy_session_active'].includes(state.currentStatus)
     return { sessionNumber: n, status: inProgress ? 'in_progress' as const : 'scheduled' as const }
    }
    return { sessionNumber: n, status: 'pending' as const }
   })
  : []

 return (
 <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
 {/* Header */}
 <div>
 <Link href={backHref} className="flex items-center gap-2 text-brand-teal hover:text-brand-navy mb-4 text-sm">
 <FiArrowLeft className="w-4 h-4" /> Back to bookings
 </Link>
 <div className="flex items-start justify-between">
 <div>
 <h1 className="text-xl font-bold text-fg">{state.templateName}</h1>
 <div className="flex items-center gap-4 mt-2 text-sm text-soft">
 <span className="flex items-center gap-1"><FiCalendar className="w-4 h-4" /> {new Date(state.startedAt).toLocaleDateString('fr-FR')}</span>
 <span className="flex items-center gap-1"><FiUser className="w-4 h-4" /> {state.serviceMode}</span>
 <span className="flex items-center gap-1"><FiClock className="w-4 h-4" /> {bookingType.replace(/_/g, ' ')}</span>
 </div>
 </div>
 </div>
 </div>

 {/* Video / Audio Call Banner */}
 <WorkflowVideoCallBanner videoCallId={latestVideoCallId} currentStatus={state.currentStatus} callMode={callMode} isTerminal={state.isCompleted || state.isCancelled} />

 {/* Session Progress - recurrent programmes (physio, mental health, nutrition) */}
 {isRecurrent && maxSessions > 0 && (
  <SessionProgress
   programName={state.templateName}
   totalSessions={maxSessions}
   sessions={sessionEntries}
   nextSessionAt={state.metadata?.nextSessionAt}
  />
 )}

 {/* Current Step + Actions */}
 <WorkflowCurrentStep
 instanceId={state.instanceId}
 currentStatus={state.currentStatus}
 stepLabel={state.currentStepLabel}
 stepFlags={state.currentStepFlags}
 allSteps={state.allSteps}
 currentStepCategory={state.currentStepCategory}
 amountLabel={
  state.metadata?.servicePrice
  ? `${state.metadata.currency || 'Rs'} ${state.metadata.servicePrice}`
  : undefined
 }
 serviceMode={state.serviceMode}
 sessionNumber={state.metadata?.sessionNumber}
 maxSessions={state.metadata?.maxSessions}
 actionsForPatient={state.actionsForPatient}
 actionsForProvider={state.actionsForProvider}
 userRole={userRole}
 isCompleted={state.isCompleted}
 isCancelled={state.isCancelled}
 onTransition={handleTransition}
 />

 {/* Content Attachments */}
 {contentSteps.length > 0 && (
 <div className="space-y-3">
 <h2 className="text-sm font-semibold text-soft uppercase tracking-wider">Documents & Content</h2>
 {contentSteps.map((step) => (
 <WorkflowContentViewer
 key={step.id}
 contentType={step.contentType!}
 contentData={step.contentData as Record<string, unknown>}
 />
 ))}
 </div>
 )}

 {/* Timeline */}
 <div>
 <h2 className="text-sm font-semibold text-soft uppercase tracking-wider mb-4">Workflow History</h2>
 <WorkflowTimeline
 steps={timeline}
 currentStatus={state.currentStatus}
 categoryByStatus={
  state.allSteps
  ? Object.fromEntries(
   state.allSteps
   .filter(s => s.category)
   .map(s => [s.statusCode, s.category!])
  )
  : undefined
 }
 />
 </div>
 </div>
 )
}
