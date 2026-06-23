'use client'

import { useState, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import {
  FaTimes, FaArrowLeft, FaArrowRight, FaCheckCircle, FaCalendarAlt,
  FaLock, FaStar,
} from 'react-icons/fa'
import { useBookingDrawer, DrawerService, DrawerProvider, DrawerOrganization, DrawerWorkflow } from '@/lib/contexts/booking-drawer-context'

// ─── Types ────────────────────────────────────────────────────────────────────

type DrawerStep = 'service' | 'providers' | 'workflow' | 'slot' | 'auth' | 'confirm'

interface WorkflowStep {
  order: number
  label: string
  statusCode: string
}

interface WorkflowOption {
  id: string
  name: string
  serviceMode: string
  steps: WorkflowStep[]
}

interface TimeSlot {
  time: string    // 'HH:MM'
  label: string   // '9:00 AM'
  taken: boolean
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const MODE_LABEL: Record<string, string> = {
  office: 'In-Person',
  home: 'Home Visit',
  video: 'Video Call',
}
const MODE_EMOJI: Record<string, string> = {
  office: '🏥',
  home: '🏠',
  video: '📹',
}

function toSlotLabel(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${display}:${String(m).padStart(2, '0')} ${period}`
}

function normaliseWorkflows(raw: any[]): WorkflowOption[] {
  if (!Array.isArray(raw)) return []
  return raw.map(wf => ({
    id: wf.id,
    name: wf.name,
    serviceMode: wf.serviceMode ?? 'office',
    steps: (Array.isArray(wf.steps) ? wf.steps : [])
      .sort((a: any, b: any) => (a.order ?? a.stepOrder ?? 0) - (b.order ?? b.stepOrder ?? 0))
      .map((s: any) => ({
        order: s.order ?? s.stepOrder ?? 0,
        label: s.label ?? '',
        statusCode: s.statusCode ?? '',
      }))
      .filter((s: WorkflowStep) => s.label),
  }))
}

function upcomingDays(n: number): Date[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d
  })
}

function isLoggedIn(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.split(';').some(c => c.trim().startsWith('mediwyz_userType='))
}

function avatarUrl(provider: DrawerProvider): string {
  if (provider.profileImage) return provider.profileImage
  const name = encodeURIComponent(provider.name || 'P')
  return `https://ui-avatars.com/api/?name=${name}&background=0C6780&color=fff&size=80`
}

// ─── Step tracker ─────────────────────────────────────────────────────────────

const STEP_LABELS: Record<DrawerStep, string> = {
  service: 'Service',
  providers: 'Provider',
  workflow: 'Appointment type',
  slot: 'Date & time',
  auth: 'Sign in',
  confirm: 'Confirm',
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BookingDrawer() {
  const { isOpen, options, closeDrawer } = useBookingDrawer()

  // ── Wizard state ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<DrawerStep>('service')
  const [stepHistory, setStepHistory] = useState<DrawerStep[]>([])

  const [selectedOrg, setSelectedOrg] = useState<DrawerOrganization | null>(null)
  const [selectedService, setSelectedService] = useState<DrawerService | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<DrawerProvider | null>(null)
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowOption | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  // ── Data lists ────────────────────────────────────────────────────────────
  const [services, setServices] = useState<DrawerService[]>([])
  const [providers, setProviders] = useState<DrawerProvider[]>([])
  const [workflows, setWorkflows] = useState<WorkflowOption[]>([])
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [days] = useState<Date[]>(() => upcomingDays(14))

  // ── Loading / error ───────────────────────────────────────────────────────
  const [servicesLoading, setServicesLoading] = useState(false)
  const [providersLoading, setProvidersLoading] = useState(false)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Auth ──────────────────────────────────────────────────────────────────
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  // ── Reason ────────────────────────────────────────────────────────────────
  const [reason, setReason] = useState('')

  // ── Wallet balance ────────────────────────────────────────────────────────
  const [walletBalance, setWalletBalance] = useState<number | null>(null)

  // ─── Reset when drawer opens/closes ──────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    setError(null)
    setSubmitting(false)
    setAuthError(null)
    setAuthEmail('')
    setAuthPassword('')
    setReason('')
    const loggedInNow = isLoggedIn()
    setLoggedIn(loggedInNow)

    // Fetch wallet balance once when opening, if the user is logged in
    if (loggedInNow) {
      const userId = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('mediwyz_user_id='))
        ?.split('=')?.[1]
      if (userId) {
        fetch(`/api/users/${userId}/wallet`, { credentials: 'include' })
          .then(r => r.json())
          .then(j => { if (j.success) setWalletBalance(j.data?.balance ?? null) })
          .catch(() => { /* non-fatal */ })
      }
    }

    // Pre-populate from entry options
    const { service, provider, role, organization, date, time } = options

    if (service && provider && (date || time)) {
      // Hero widget fast-path: all key fields supplied - skip straight to confirm
      setSelectedOrg(null)
      setSelectedService(service)
      setSelectedProvider(provider)
      const wfRaw: DrawerWorkflow | null | undefined = options.workflow
      setSelectedWorkflow(wfRaw ? { id: wfRaw.id, name: wfRaw.name, serviceMode: wfRaw.serviceMode, steps: [] } : null)
      setSelectedDate(date ? new Date(date + 'T12:00:00') : null)
      setSelectedTime(time ?? null)
      setStep('confirm')
      setStepHistory(['service', 'providers', 'slot', 'confirm'])
      return
    } else if (organization) {
      // Organization-first entry: service → providers (filtered by organization)
      setSelectedOrg(organization)
      setSelectedService(null)
      setSelectedProvider(null)
      setSelectedWorkflow(null)
      setSelectedDate(date ? new Date(date + 'T12:00:00') : null)
      setSelectedTime(time ?? null)
      setStep('service')
      setStepHistory(['service'])
      fetchServicesForOrg(organization.id)
    } else if (service) {
      setSelectedOrg(null)
      setSelectedService(service)
      setSelectedProvider(provider ?? null)
      setSelectedWorkflow(null)
      setSelectedDate(date ? new Date(date + 'T12:00:00') : null)
      setSelectedTime(time ?? null)
      setStep('providers')
      setStepHistory(['service', 'providers'])
      fetchProviders(service, null) // org is null - passed explicitly to avoid stale closure
    } else if (provider) {
      setSelectedOrg(null)
      setSelectedService(null)
      setSelectedProvider(provider)
      setSelectedWorkflow(null)
      setSelectedDate(date ? new Date(date + 'T12:00:00') : null)
      setSelectedTime(time ?? null)
      setStep('service')
      setStepHistory(['service'])
      fetchServicesForProvider(provider)
    } else {
      setSelectedOrg(null)
      setSelectedService(null)
      setSelectedProvider(null)
      setSelectedWorkflow(null)
      setSelectedDate(date ? new Date(date + 'T12:00:00') : null)
      setSelectedTime(time ?? null)
      setStep('service')
      setStepHistory(['service'])
      if (role) fetchServicesForRole(role.code)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // ─── Step navigation ──────────────────────────────────────────────────────

  function goTo(next: DrawerStep) {
    setStepHistory(prev => [...prev, next])
    setStep(next)
  }

  function goBack() {
    setStepHistory(prev => {
      const updated = [...prev]
      updated.pop()                         // remove current
      const previous = updated[updated.length - 1] ?? 'service'
      setStep(previous)
      return updated
    })
  }

  const canGoBack = stepHistory.length > 1

  // ─── Data fetchers ────────────────────────────────────────────────────────

  async function fetchServicesForOrg(entityId: string) {
    setServicesLoading(true)
    setServices([])
    try {
      const res = await fetch(`/api/organizations/${entityId}/providers-services`)
      const j = await res.json()
      if (j.success) {
        // Flatten: collect unique services across all providers
        const svcMap = new Map<string, DrawerService>()
        for (const p of j.data?.providers ?? []) {
          for (const s of p.services ?? []) {
            if (!svcMap.has(s.id)) svcMap.set(s.id, {
              id: s.id, serviceName: s.serviceName, category: s.category,
              description: s.description, defaultPrice: s.defaultPrice ?? 0,
              duration: s.duration, providerType: p.userType,
              iconKey: s.iconKey, emoji: s.emoji,
            })
          }
        }
        setServices(Array.from(svcMap.values()))
        // Store full entity data for provider-filtering later
        ;(window as any).__orgProvidersData = j.data
      }
    } catch { /* non-fatal */ }
    finally { setServicesLoading(false) }
  }

  async function fetchServicesForRole(roleCode: string) {
    setServicesLoading(true)
    setServices([])
    try {
      const res = await fetch(`/api/search/services?providerType=${roleCode}&limit=50`)
      const j = await res.json()
      if (j.success) setServices(j.data ?? [])
    } catch { /* non-fatal */ }
    finally { setServicesLoading(false) }
  }

  async function fetchServicesForProvider(provider: DrawerProvider) {
    setServicesLoading(true)
    setServices([])
    try {
      const res = await fetch(`/api/providers/${provider.id}/services`)
      const j = await res.json()
      if (j.success) {
        setServices((j.data ?? []).map((s: any) => ({
          id: s.id,
          serviceName: s.serviceName,
          category: s.category,
          description: s.description,
          defaultPrice: s.price ?? s.defaultPrice ?? 0,
          duration: s.duration,
          providerType: provider.userType,
          _workflows: normaliseWorkflows(s.workflows),
        } as DrawerService & { _workflows?: WorkflowOption[] })))
      }
    } catch { /* non-fatal */ }
    finally { setServicesLoading(false) }
  }

  // currentOrg is passed explicitly so callers don't rely on a stale closure over
  // selectedOrg - state updates are async so the value may not have settled yet
  // when fetchProviders is called in the same render cycle as setSelectedOrg.
  async function fetchProviders(service: DrawerService, currentOrg: DrawerOrganization | null) {
    setProvidersLoading(true)
    setProviders([])
    try {
      // If an organization was selected, filter providers from that org's data
      if (currentOrg) {
        const orgData = (window as any).__orgProvidersData
        const orgProviders: DrawerProvider[] = (orgData?.providers ?? [])
          .filter((p: any) => p.services?.some((s: any) => s.id === service.id))
          .map((p: any) => ({
            id: p.id, name: p.name, userType: p.userType,
            profileImage: p.profileImage ?? null,
            address: null, rating: 0, specializations: [],
            bio: '',
          }))
        if (orgProviders.length > 0) {
          setProviders(orgProviders)
          return
        }
      }

      const params = new URLSearchParams({ type: service.providerType ?? '', serviceId: service.id, limit: '30' })
      if (currentOrg) params.set('entityId', currentOrg.id)
      const res = await fetch(`/api/search/providers?${params}`)
      const j = await res.json()
      if (j.success) {
        setProviders((j.data ?? []).map((p: any) => ({
          id: p.id,
          name: p.name ?? `${p.firstName} ${p.lastName}`,
          userType: p.userType,
          profileImage: p.profileImage ?? null,
          address: p.address ?? null,
          rating: p.rating ?? 0,
          specializations: p.specializations ?? [],
          bio: p.bio ?? '',
        } as DrawerProvider)))
      }
    } catch { /* non-fatal */ }
    finally { setProvidersLoading(false) }
  }

  async function fetchWorkflowsForProviderService(provider: DrawerProvider, service: DrawerService) {
    try {
      const res = await fetch(`/api/providers/${provider.id}/services`)
      const j = await res.json()
      if (!j.success) return []
      const match = (j.data ?? []).find((s: any) => s.id === service.id)
      return normaliseWorkflows(match?.workflows ?? [])
    } catch { return [] }
  }

  async function fetchSlots(provider: DrawerProvider, date: Date) {
    setSlotsLoading(true)
    setSlots([])
    const dateStr = date.toISOString().slice(0, 10)
    try {
      const res = await fetch(
        `/api/bookings/available-slots?providerId=${provider.id}&providerUserId=${provider.id}&date=${dateStr}&providerType=${provider.userType}`
      )
      const j = await res.json()
      if (j.success && j.slots?.length) {
        setSlots(j.slots.map((s: any) => ({ time: s.time, label: toSlotLabel(s.time), taken: s.taken })))
      } else {
        setSlots(generateFallbackSlots(date))
      }
    } catch { setSlots(generateFallbackSlots(date)) }
    finally { setSlotsLoading(false) }
  }

  function generateFallbackSlots(date: Date): TimeSlot[] {
    if (date.getDay() === 0) return []
    const slots: TimeSlot[] = []
    const endH = date.getDay() === 6 ? 13 : 17
    for (let h = 9; h < endH; h++) {
      if (h === 12) continue
      for (const m of [0, 30]) {
        const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
        slots.push({ time, label: toSlotLabel(time), taken: false })
      }
    }
    return slots
  }

  // ─── Selection handlers ────────────────────────────────────────────────────

  async function handleSelectService(service: DrawerService) {
    setSelectedService(service)
    setError(null)

    if (selectedProvider) {
      // Provider already known → get workflows for this service
      const wfs = ((service as any)._workflows as WorkflowOption[] | undefined) ??
        await fetchWorkflowsForProviderService(selectedProvider, service)
      setWorkflows(wfs)
      if (wfs.length === 0) {
        setError(`${selectedProvider.name} has not configured booking for ${service.serviceName} yet. Please choose a different provider.`)
        // Stay on the providers step - don't advance
        goTo('providers')
        return
      }
      if (wfs.length > 1) {
        goTo('workflow')
      } else {
        if (wfs.length === 1) setSelectedWorkflow(wfs[0])
        // Slot already pre-filled from hero widget?
        if (selectedTime && selectedDate) {
          goTo('confirm')
        } else {
          goTo('slot')
          fetchSlots(selectedProvider, selectedDate ?? new Date())
        }
      }
    } else {
      // No provider yet → go to providers step
      goTo('providers')
      fetchProviders(service, selectedOrg)
    }
  }

  async function handleSelectProvider(provider: DrawerProvider) {
    setSelectedProvider(provider)
    setError(null)

    if (selectedService) {
      const wfs = await fetchWorkflowsForProviderService(provider, selectedService)
      setWorkflows(wfs)
      if (wfs.length === 0) {
        setError(`${provider.name} has not configured booking for ${selectedService.serviceName} yet. Please choose a different provider.`)
        // Stay on the providers step - don't advance
        return
      }
      if (wfs.length > 1) {
        goTo('workflow')
      } else {
        if (wfs.length === 1) setSelectedWorkflow(wfs[0])
        if (selectedTime && selectedDate) {
          goTo('confirm')
        } else {
          goTo('slot')
          fetchSlots(provider, selectedDate ?? new Date())
        }
      }
    }
  }

  function handleSelectWorkflow(wf: WorkflowOption) {
    setSelectedWorkflow(wf)
    if (selectedTime && selectedDate) {
      goTo('confirm')
    } else {
      goTo('slot')
      if (selectedProvider) fetchSlots(selectedProvider, selectedDate ?? new Date())
    }
  }

  function handleSelectDate(date: Date) {
    setSelectedDate(date)
    setSelectedTime(null)
    if (selectedProvider) fetchSlots(selectedProvider, date)
  }

  function handleSelectTime(time: string) {
    setSelectedTime(time)
  }

  function handleSlotNext() {
    if (!selectedDate || !selectedTime) return
    if (loggedIn) {
      goTo('confirm')
    } else {
      goTo('auth')
    }
  }

  // ─── Auth ──────────────────────────────────────────────────────────────────

  async function handleLogin() {
    if (!authEmail || !authPassword) {
      setAuthError('Email and password are required')
      return
    }
    setAuthLoading(true)
    setAuthError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      })
      const j = await res.json()
      if (!j.success) {
        setAuthError(j.message ?? 'Invalid credentials')
        return
      }
      setLoggedIn(true)
      goTo('confirm')
    } catch {
      setAuthError('Login failed. Please try again.')
    } finally {
      setAuthLoading(false)
    }
  }

  // ─── Submit booking ───────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!selectedService || !selectedProvider || !selectedDate || !selectedTime) return
    setSubmitting(true)
    setError(null)
    try {
      const dateStr = selectedDate.toISOString().slice(0, 10)
      const body: Record<string, unknown> = {
        providerUserId: selectedProvider.id,
        providerType: selectedProvider.userType,
        platformServiceId: selectedService.id,
        serviceName: selectedService.serviceName,
        servicePrice: selectedService.defaultPrice,
        scheduledDate: dateStr,
        scheduledTime: selectedTime,
        duration: selectedService.duration ?? 30,
        reason: reason || undefined,
        consultationType: selectedWorkflow?.serviceMode ?? 'office',
        workflowTemplateId: selectedWorkflow?.id ?? undefined,
      }
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const j = await res.json()
      if (!j.success) {
        setError(j.message ?? 'Booking failed')
        return
      }
      // Booking created - close drawer and optionally navigate
      closeDrawer()
      // Navigate to the booking confirmation page
      const userType = document.cookie.split(';')
        .find(c => c.trim().startsWith('mediwyz_userType='))
        ?.split('=')?.[1] ?? 'patient'
      window.location.href = `/${userType}/bookings`
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Derived labels ────────────────────────────────────────────────────────

  const dateLabel = useMemo(() => {
    if (!selectedDate) return ''
    return `${DOW[selectedDate.getDay()]}, ${MONTHS[selectedDate.getMonth()]} ${selectedDate.getDate()}`
  }, [selectedDate])

  const timeLabel = useMemo(() => {
    if (!selectedTime) return ''
    return options.timeLabel ?? toSlotLabel(selectedTime)
  }, [selectedTime, options.timeLabel])

  const roleColor = options.role?.color ?? '#0C6780'

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm"
            onClick={closeDrawer}
          />

          {/* Panel - bottom sheet on mobile, right panel on ≥640px */}
          <motion.div
            key="panel"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-[301] bg-surface rounded-t-3xl shadow-2xl
              flex flex-col max-h-[92vh]
              sm:top-0 sm:bottom-0 sm:left-auto sm:right-0 sm:rounded-none sm:rounded-l-3xl sm:max-h-full sm:w-[420px]"
            style={{}}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-line flex-shrink-0">
              <div className="flex items-center gap-3">
                {canGoBack && (
                  <button
                    onClick={goBack}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-subtle hover:bg-line transition-colors"
                    aria-label="Go back"
                  >
                    <FaArrowLeft className="text-soft text-xs" />
                  </button>
                )}
                <div>
                  <h2 className="text-sm font-bold text-fg">{STEP_LABELS[step]}</h2>
                  <p className="text-[11px] text-faint mt-0.5">{buildBreadcrumb()}</p>
                </div>
              </div>
              <button
                onClick={closeDrawer}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-subtle hover:bg-line transition-colors"
                aria-label="Close"
              >
                <FaTimes className="text-soft text-xs" />
              </button>
            </div>

            {/* ── Step progress dots ── */}
            <StepDots step={step} skippedSlot={!!(selectedTime && selectedDate && step !== 'slot')} />

            {/* ── Organization context banner (when booking via an organization) ── */}
            {selectedOrg && (
              <div className="mx-5 mt-3 px-3 py-2 rounded-xl bg-[#0C6780]/8 border border-[#0C6780]/20 flex items-center gap-2">
                <span className="text-base">🏥</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#0C6780] truncate">{selectedOrg.name}</p>
                  <p className="text-[10px] text-faint capitalize">{selectedOrg.type?.replace('_', ' ')}</p>
                </div>
              </div>
            )}

            {/* ── Body ── */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.18 }}
                >
                  {step === 'service'    && <ServiceStep services={services} loading={servicesLoading} onSelect={handleSelectService} selectedId={selectedService?.id} roleColor={roleColor} />}
                  {step === 'providers'  && <ProviderStep providers={providers} loading={providersLoading} onSelect={handleSelectProvider} selectedId={selectedProvider?.id} service={selectedService} roleColor={roleColor} error={error} />}
                  {step === 'workflow'   && <WorkflowStep workflows={workflows} onSelect={handleSelectWorkflow} selectedId={selectedWorkflow?.id} roleColor={roleColor} />}
                  {step === 'slot'       && <SlotStep days={days} selectedDate={selectedDate} selectedTime={selectedTime} slots={slots} loading={slotsLoading} onSelectDate={handleSelectDate} onSelectTime={handleSelectTime} onNext={handleSlotNext} roleColor={roleColor} />}
                  {step === 'auth'       && <AuthStep email={authEmail} password={authPassword} onEmailChange={setAuthEmail} onPasswordChange={setAuthPassword} onSubmit={handleLogin} loading={authLoading} error={authError} />}
                  {step === 'confirm'    && <ConfirmStep service={selectedService} provider={selectedProvider} workflow={selectedWorkflow} dateLabel={dateLabel} timeLabel={timeLabel} reason={reason} onReasonChange={setReason} onSubmit={handleSubmit} submitting={submitting} error={error} roleColor={roleColor} walletBalance={walletBalance} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  function buildBreadcrumb() {
    const parts: string[] = []
    if (selectedService) parts.push(selectedService.serviceName)
    if (selectedProvider) parts.push(selectedProvider.name)
    if (selectedWorkflow) parts.push(MODE_LABEL[selectedWorkflow.serviceMode] ?? selectedWorkflow.name)
    return parts.join(' · ') || 'Book an appointment'
  }
}

// ─── Step progress dots ────────────────────────────────────────────────────────

const STEP_ORDER: DrawerStep[] = ['service', 'providers', 'workflow', 'slot', 'auth', 'confirm']

function StepDots({ step, skippedSlot }: { step: DrawerStep; skippedSlot: boolean }) {
  const visible = STEP_ORDER.filter(s => !(s === 'auth') && !(s === 'workflow') && !(skippedSlot && s === 'slot'))
  const current = visible.indexOf(step)
  return (
    <div className="flex items-center justify-center gap-1.5 py-2 flex-shrink-0">
      {visible.map((s, i) => (
        <div
          key={s}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === current ? 20 : 6,
            height: 6,
            backgroundColor: i <= current ? '#0C6780' : '#E5E7EB',
          }}
        />
      ))}
    </div>
  )
}

// ─── SERVICE STEP ──────────────────────────────────────────────────────────────

function ServiceStep({
  services, loading, onSelect, selectedId, roleColor,
}: {
  services: DrawerService[]
  loading: boolean
  onSelect: (s: DrawerService) => void
  selectedId?: string
  roleColor: string
}) {
  const [q, setQ] = useState('')
  const filtered = services.filter(s =>
    !q || s.serviceName.toLowerCase().includes(q.toLowerCase()) || s.category.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div className="px-4 pt-3 pb-6">
      <input
        type="text"
        placeholder="Search services…"
        value={q}
        onChange={e => setQ(e.target.value)}
        className="w-full mb-3 px-3 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-[#0C6780]/30"
      />
      {loading ? (
        <LoadingList />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🩺" text={q ? 'No services match your search' : 'No services available'} />
      ) : (
        <div className="space-y-2">
          {filtered.map(svc => (
            <button
              key={svc.id}
              onClick={() => onSelect(svc)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all
                ${svc.id === selectedId
                  ? 'border-[#0C6780] bg-[#0C6780]/5'
                  : 'border-line hover:border-[#0C6780]/40 hover:bg-subtle'
                }`}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                style={{ backgroundColor: `${roleColor}18` }}>
                {svc.emoji ?? '⚕️'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-fg leading-tight truncate">{svc.serviceName}</p>
                <p className="text-[11px] text-faint mt-0.5">{svc.category}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-sm font-bold" style={{ color: roleColor }}>Rs {(svc.defaultPrice ?? 0).toLocaleString()}</p>
                {svc.duration && <p className="text-[10px] text-faint">{svc.duration} min</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── PROVIDER STEP ─────────────────────────────────────────────────────────────

function ProviderStep({
  providers, loading, onSelect, selectedId, service, roleColor: _roleColor, error,
}: {
  providers: DrawerProvider[]
  loading: boolean
  onSelect: (p: DrawerProvider) => void
  selectedId?: string
  service: DrawerService | null
  roleColor: string
  error?: string | null
}) {
  const [q, setQ] = useState('')
  const filtered = providers.filter(p =>
    !q || p.name.toLowerCase().includes(q.toLowerCase()) || (p.address ?? '').toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div className="px-4 pt-3 pb-6">
      {error && (
        <div className="mb-3 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}
      {service && (
        <div className="mb-3 px-3 py-2 bg-[#0C6780]/8 rounded-xl flex items-center gap-2">
          <span className="text-base">{service.emoji ?? '⚕️'}</span>
          <p className="text-xs font-medium text-[#0C6780] truncate">{service.serviceName}</p>
        </div>
      )}
      <input
        type="text"
        placeholder="Search providers…"
        value={q}
        onChange={e => setQ(e.target.value)}
        className="w-full mb-3 px-3 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-[#0C6780]/30"
      />
      {loading ? (
        <LoadingList />
      ) : filtered.length === 0 ? (
        <EmptyState icon="👨‍⚕️" text={q ? 'No providers match your search' : 'No providers available for this service'} />
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all
                ${p.id === selectedId
                  ? 'border-[#0C6780] bg-[#0C6780]/5'
                  : 'border-line hover:border-[#0C6780]/40 hover:bg-subtle'
                }`}
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-subtle">
                <Image
                  src={avatarUrl(p)}
                  alt={p.name}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=0C6780&color=fff&size=80` }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-fg leading-tight">{p.name}</p>
                {p.specializations?.length ? (
                  <p className="text-[11px] text-faint truncate">{p.specializations.slice(0, 2).join(', ')}</p>
                ) : p.address ? (
                  <p className="text-[11px] text-faint truncate">{p.address}</p>
                ) : null}
              </div>
              {(p.rating ?? 0) > 0 && (
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <FaStar className="text-amber-400 text-[10px]" />
                  <span className="text-[11px] font-semibold text-soft">{(p.rating ?? 0).toFixed(1)}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── WORKFLOW STEP ─────────────────────────────────────────────────────────────

const STEP_STATUS_EMOJI: Record<string, string> = {
  pending: '⏳', confirmed: '✅', scheduled: '📅',
  in_progress: '▶️', completed: '🏁', cancelled: '❌',
  video_call: '📹', payment: '💳', prescription: '📋',
  sample_collected: '🧪', results_ready: '📊', delivered: '📦',
  home_visit: '🏠', on_the_way: '🚗', arrived: '📍',
}

function stepEmoji(statusCode: string): string {
  const lc = statusCode.toLowerCase()
  for (const [key, val] of Object.entries(STEP_STATUS_EMOJI)) {
    if (lc.includes(key)) return val
  }
  return '•'
}

function WorkflowStep({
  workflows, onSelect, selectedId, roleColor,
}: {
  workflows: WorkflowOption[]
  onSelect: (wf: WorkflowOption) => void
  selectedId?: string
  roleColor: string
}) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (workflows.length === 0) {
    return <EmptyState icon="📋" text="No appointment types available" />
  }

  return (
    <div className="px-4 pt-3 pb-6 space-y-3">
      <p className="text-xs text-faint">Choose how you&apos;d like this appointment - tap to see what happens at each step.</p>
      {workflows.map(wf => {
        const modeLabel = MODE_LABEL[wf.serviceMode] ?? wf.serviceMode
        const modeEmoji = MODE_EMOJI[wf.serviceMode] ?? '📋'
        const selected = wf.id === selectedId
        const isExpanded = expanded === wf.id || selected

        return (
          <div
            key={wf.id}
            className={`rounded-2xl border-2 overflow-hidden transition-all duration-200
              ${selected
                ? 'border-[#0C6780] shadow-md shadow-[#0C6780]/10'
                : 'border-line hover:border-line'}`}
          >
            {/* Header row - always visible */}
            <button
              onClick={() => {
                setExpanded(prev => (prev === wf.id ? null : wf.id))
                onSelect(wf)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors
                ${selected ? 'bg-[#0C6780]/5' : 'bg-surface hover:bg-subtle'}`}
            >
              {/* Mode badge */}
              <div
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ backgroundColor: selected ? `${roleColor}20` : '#F3F4F6' }}
              >
                {modeEmoji}
              </div>

              <div className="flex-1 min-w-0">
                {/* Mode type */}
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                    style={{
                      backgroundColor: selected ? `${roleColor}18` : '#F3F4F6',
                      color: selected ? roleColor : '#6B7280',
                    }}
                  >
                    {modeLabel}
                  </span>
                </div>
                {/* Template name */}
                <p className={`text-sm font-semibold leading-tight truncate ${selected ? 'text-[#0C6780]' : 'text-fg'}`}>
                  {wf.name}
                </p>
                {wf.steps.length > 0 && (
                  <p className="text-[10px] text-faint mt-0.5">{wf.steps.length} steps</p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {selected && <FaCheckCircle style={{ color: roleColor }} className="text-base" />}
                <span
                  className={`text-[10px] text-faint transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  style={{ display: 'inline-block' }}
                >
                  ▾
                </span>
              </div>
            </button>

            {/* Steps timeline - visible when expanded */}
            {isExpanded && wf.steps.length > 0 && (
              <div className="px-4 pb-4 pt-1 bg-subtle border-t border-line">
                <p className="text-[10px] font-semibold text-faint uppercase tracking-wider mb-2.5">What happens</p>
                <div className="relative">
                  {/* Vertical connector line */}
                  <div className="absolute left-[14px] top-2 bottom-2 w-px bg-line" />

                  <div className="space-y-2">
                    {wf.steps.map((step, idx) => {
                      const isFirst = idx === 0
                      const isLast = idx === wf.steps.length - 1
                      return (
                        <div key={step.statusCode || idx} className="flex items-start gap-3 relative">
                          {/* Step dot */}
                          <div
                            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] border-2 relative z-10"
                            style={
                              isFirst
                                ? { backgroundColor: roleColor, borderColor: roleColor, color: '#fff' }
                                : isLast
                                  ? { backgroundColor: '#fff', borderColor: '#10B981', color: '#10B981' }
                                  : { backgroundColor: '#fff', borderColor: '#D1D5DB', color: '#6B7280' }
                            }
                          >
                            {isFirst ? '1' : isLast ? '✓' : String(idx + 1)}
                          </div>

                          {/* Step content */}
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className={`text-xs font-semibold leading-tight ${isFirst ? 'text-fg' : 'text-soft'}`}>
                              {step.label}
                            </p>
                            <p className="text-[10px] text-faint mt-0.5 font-mono">{step.statusCode}</p>
                          </div>

                          {/* Step emoji hint */}
                          <span className="text-sm flex-shrink-0 pt-0.5">{stepEmoji(step.statusCode)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* No steps yet message */}
            {isExpanded && wf.steps.length === 0 && (
              <div className="px-4 py-3 bg-subtle border-t border-line">
                <p className="text-xs text-faint italic">Standard booking flow applies.</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── SLOT STEP ─────────────────────────────────────────────────────────────────

function SlotStep({
  days, selectedDate, selectedTime, slots, loading,
  onSelectDate, onSelectTime, onNext, roleColor,
}: {
  days: Date[]
  selectedDate: Date | null
  selectedTime: string | null
  slots: TimeSlot[]
  loading: boolean
  onSelectDate: (d: Date) => void
  onSelectTime: (t: string) => void
  onNext: () => void
  roleColor: string
}) {
  const availableSlots = slots.filter(s => !s.taken)

  return (
    <div className="px-4 pt-3 pb-6">
      {/* Date strip */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 [&::-webkit-scrollbar]:hidden">
        {days.map(d => {
          const isSel = selectedDate?.toDateString() === d.toDateString()
          const isToday = d.toDateString() === new Date().toDateString()
          const closed = d.getDay() === 0
          return (
            <button
              key={d.toDateString()}
              onClick={() => !closed && onSelectDate(d)}
              disabled={closed}
              className={`flex-shrink-0 flex flex-col items-center px-3 py-2.5 rounded-xl min-w-[50px] transition-all
                ${closed ? 'opacity-25 cursor-not-allowed' : ''}
                ${isSel ? 'bg-[#001E40] text-white shadow-lg' : 'bg-subtle hover:bg-subtle text-soft'}`}
            >
              <span className="text-[9px] font-bold uppercase tracking-wider">{DOW[d.getDay()]}</span>
              <span className={`text-sm font-black mt-0.5 ${isToday && !isSel ? 'text-[#0C6780]' : ''}`}>{d.getDate()}</span>
            </button>
          )
        })}
      </div>

      {/* Time slots */}
      {loading ? (
        <div className="py-8 flex justify-center gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      ) : !selectedDate ? (
        <p className="text-xs text-faint text-center py-8">Select a date above</p>
      ) : availableSlots.length === 0 ? (
        <EmptyState icon="📅" text="No slots available for this day" />
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2 max-h-52 overflow-y-auto mb-4">
            {slots.map(slot => {
              const isSel = selectedTime === slot.time
              return (
                <button
                  key={slot.time}
                  onClick={() => !slot.taken && onSelectTime(slot.time)}
                  disabled={slot.taken}
                  className={`py-2.5 rounded-xl text-[11px] font-semibold transition-all text-center
                    ${slot.taken
                      ? 'bg-subtle text-faint cursor-not-allowed line-through'
                      : isSel
                        ? 'bg-[#001E40] text-white shadow-md ring-2 ring-[#0C6780]/40'
                        : 'bg-subtle text-soft hover:bg-line'
                    }`}
                >
                  {slot.label}
                </button>
              )
            })}
          </div>
          <button
            onClick={onNext}
            disabled={!selectedTime}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all
              disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: roleColor }}
          >
            Continue <FaArrowRight className="inline ml-1 text-xs" />
          </button>
        </>
      )}
    </div>
  )
}

// ─── AUTH STEP ────────────────────────────────────────────────────────────────

function AuthStep({
  email, password, onEmailChange, onPasswordChange, onSubmit, loading, error,
}: {
  email: string
  password: string
  onEmailChange: (v: string) => void
  onPasswordChange: (v: string) => void
  onSubmit: () => void
  loading: boolean
  error: string | null
}) {
  return (
    <div className="px-5 pt-4 pb-8">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-9 h-9 rounded-xl bg-[#0C6780]/10 flex items-center justify-center">
          <FaLock className="text-[#0C6780] text-sm" />
        </div>
        <div>
          <p className="text-sm font-semibold text-fg">Sign in to complete booking</p>
          <p className="text-[11px] text-faint">Your appointment is ready - just log in</p>
        </div>
      </div>

      {error && (
        <div className="mb-3 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="text-[11px] font-semibold text-soft uppercase tracking-wide mb-1.5 block">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => onEmailChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSubmit()}
            placeholder="you@example.com"
            className="w-full px-4 py-3 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-[#0C6780]/30"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-soft uppercase tracking-wide mb-1.5 block">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => onPasswordChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSubmit()}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-[#0C6780]/30"
          />
        </div>
        <button
          onClick={onSubmit}
          disabled={loading || !email || !password}
          className="w-full py-3.5 bg-[#0C6780] text-white rounded-xl text-sm font-bold
            hover:bg-[#0a5a6e] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="flex gap-1.5">
              {[0, 1, 2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </span>
          ) : 'Sign in & confirm booking'}
        </button>
        <p className="text-center text-xs text-faint">
          No account?{' '}
          <Link href="/signup" className="text-[#0C6780] font-medium hover:underline">Create one here →</Link>
        </p>
      </div>
    </div>
  )
}

// ─── CONFIRM STEP ─────────────────────────────────────────────────────────────

function ConfirmStep({
  service, provider, workflow, dateLabel, timeLabel,
  reason, onReasonChange, onSubmit, submitting, error, roleColor, walletBalance,
}: {
  service: DrawerService | null
  provider: DrawerProvider | null
  workflow: WorkflowOption | null
  dateLabel: string
  timeLabel: string
  reason: string
  onReasonChange: (v: string) => void
  onSubmit: () => void
  submitting: boolean
  error: string | null
  roleColor: string
  walletBalance: number | null
}) {
  const canAfford = walletBalance === null || walletBalance >= (service?.defaultPrice ?? 0)

  return (
    <div className="px-4 pt-3 pb-8 space-y-3">
      {error && (
        <div className="px-3 py-2.5 rounded-xl bg-red-50 border border-red-100">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Service card */}
      {service && (
        <SummaryRow
          icon={<span className="text-xl">{service.emoji ?? '⚕️'}</span>}
          label="Service"
          primary={service.serviceName}
          secondary={service.category}
          right={<span className="text-sm font-black" style={{ color: roleColor }}>Rs {(service.defaultPrice ?? 0).toLocaleString()}</span>}
          color={roleColor}
        />
      )}

      {/* Provider card */}
      {provider && (
        <SummaryRow
          icon={
            <Image
              src={avatarUrl(provider)}
              alt={provider.name}
              width={40}
              height={40}
              className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.name)}&background=0C6780&color=fff&size=80` }}
            />
          }
          label="Provider"
          primary={provider.name}
          secondary={provider.address ?? undefined}
          color={roleColor}
        />
      )}

      {/* Workflow */}
      {workflow && (
        <SummaryRow
          icon={<span className="text-xl">{MODE_EMOJI[workflow.serviceMode] ?? '📋'}</span>}
          label="Appointment type"
          primary={workflow.name}
          secondary={MODE_LABEL[workflow.serviceMode] ?? workflow.serviceMode}
          color={roleColor}
        />
      )}

      {/* Date + time */}
      {dateLabel && timeLabel && (
        <SummaryRow
          icon={<FaCalendarAlt style={{ color: roleColor }} className="text-base" />}
          label="Date & time"
          primary={dateLabel}
          secondary={timeLabel}
          right={<FaCheckCircle className="text-emerald-500 text-base flex-shrink-0" />}
          color={roleColor}
        />
      )}

      {/* Wallet balance */}
      {walletBalance !== null && service && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2
          ${canAfford
            ? 'bg-green-50 border-green-100'
            : 'bg-red-50 border-red-100'}`}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
            style={{ backgroundColor: canAfford ? '#10b98118' : '#ef444418' }}>
            💳
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-faint uppercase tracking-wide font-medium">Wallet balance</p>
            <p className={`text-sm font-semibold leading-tight ${canAfford ? 'text-green-700' : 'text-red-600'}`}>
              Rs {walletBalance.toLocaleString()}
              {!canAfford && (
                <span className="text-[11px] font-normal ml-1 text-red-500">
 - need Rs {(service.defaultPrice - walletBalance).toLocaleString()} more
                </span>
              )}
            </p>
          </div>
          {canAfford
            ? <span className="text-green-500 text-base flex-shrink-0">✓</span>
            : <Link href="/patient/billing" className="text-[11px] text-[#0C6780] font-medium hover:underline flex-shrink-0 whitespace-nowrap">Top up →</Link>}
        </div>
      )}

      {/* Optional reason */}
      <div>
        <label className="text-[11px] font-semibold text-faint uppercase tracking-wide mb-1.5 block">
          Reason for visit <span className="text-faint font-normal normal-case">(optional)</span>
        </label>
        <textarea
          value={reason}
          onChange={e => onReasonChange(e.target.value)}
          rows={2}
          placeholder="e.g. Annual check-up, chest pain…"
          className="w-full px-3 py-2.5 rounded-xl border border-line text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0C6780]/30"
        />
      </div>

      <button
        onClick={onSubmit}
        disabled={submitting || !service || !provider || !dateLabel || !timeLabel || !canAfford}
        className="w-full py-4 rounded-xl text-sm font-bold text-white transition-all
          hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg"
        style={{ backgroundColor: roleColor }}
      >
        {submitting ? (
          <span className="flex gap-1.5">
            {[0, 1, 2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
          </span>
        ) : (
          <>Confirm Booking <FaArrowRight className="text-xs" /></>
        )}
      </button>
    </div>
  )
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function SummaryRow({ icon, label, primary, secondary, right, color }: {
  icon: React.ReactNode
  label: string
  primary: string
  secondary?: string
  right?: React.ReactNode
  color: string
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-subtle rounded-2xl border border-line">
      <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}12` }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-faint uppercase tracking-wide font-medium">{label}</p>
        <p className="text-sm font-semibold text-fg leading-tight truncate">{primary}</p>
        {secondary && <p className="text-[11px] text-faint truncate">{secondary}</p>}
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  )
}

function LoadingList() {
  return (
    <div className="space-y-2">
      {[0, 1, 2, 4].map(i => (
        <div key={i} className="animate-pulse h-[68px] bg-subtle rounded-2xl" />
      ))}
    </div>
  )
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="py-12 text-center">
      <span className="text-4xl">{icon}</span>
      <p className="text-sm text-faint mt-3">{text}</p>
    </div>
  )
}
