'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { FaCalendarCheck, FaSpinner, FaVideo, FaPhoneAlt, FaClinicMedical, FaCheckCircle, FaArrowLeft } from 'react-icons/fa'

interface Service { id: string; serviceName: string; category: string; duration: number; emoji?: string }
interface Entity { id: string; name: string; type: string; logoUrl?: string | null }
interface SlotProvider { id: string; name: string; userType: string; profileImage: string | null; slots: string[] }

const MODES = [
  { key: 'in_person', label: 'In office', icon: <FaClinicMedical /> },
  { key: 'video', label: 'Video call', icon: <FaVideo /> },
  { key: 'audio', label: 'Audio call', icon: <FaPhoneAlt /> },
]

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Patient flow: pick a service → date → available provider/slot → mode → book. */
export default function OrgBookingFlow({ orgId }: { orgId: string }) {
  const [entity, setEntity] = useState<Entity | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  const [serviceId, setServiceId] = useState<string>('')
  const [date, setDate] = useState<string>(todayISO())
  const [options, setOptions] = useState<{ providers: SlotProvider[] } | null>(null)
  const [optLoading, setOptLoading] = useState(false)
  const [slot, setSlot] = useState<string>('')
  const [providerUserId, setProviderUserId] = useState<string>('') // '' = any available
  const [mode, setMode] = useState<string>('in_person')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<{ provider: string; when: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load org + its services.
  useEffect(() => {
    fetch(`/api/organizations/${orgId}/providers-services`, { credentials: 'include' })
      .then(r => r.json())
      .then(j => {
        if (j.success) {
          setEntity(j.data.entity)
          const byId = new Map<string, Service>()
          for (const p of j.data.providers || []) for (const s of p.services || []) {
            if (!byId.has(s.id)) byId.set(s.id, { id: s.id, serviceName: s.serviceName, category: s.category, duration: s.duration, emoji: s.emoji })
          }
          setServices([...byId.values()])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [orgId])

  const loadOptions = useCallback(async () => {
    if (!serviceId || !date) return
    setOptLoading(true); setSlot(''); setProviderUserId(''); setError(null)
    try {
      const res = await fetch(`/api/organizations/${orgId}/booking-options?serviceId=${serviceId}&date=${date}`, { credentials: 'include' })
      const j = await res.json()
      setOptions(j.success ? { providers: j.data.providers || [] } : { providers: [] })
    } catch { setOptions({ providers: [] }) } finally { setOptLoading(false) }
  }, [orgId, serviceId, date])
  useEffect(() => { if (serviceId) loadOptions() }, [serviceId, date, loadOptions])

  // Union of available slot times across providers.
  const allSlots = useMemo(() => {
    const set = new Set<string>()
    for (const p of options?.providers || []) for (const s of p.slots) set.add(s)
    return [...set].sort()
  }, [options])

  // Providers free at the selected slot (for optional explicit pick).
  const providersAtSlot = useMemo(
    () => (options?.providers || []).filter(p => slot && p.slots.includes(slot)),
    [options, slot],
  )

  async function submit() {
    if (!serviceId || !slot) return
    setSubmitting(true); setError(null)
    try {
      const res = await fetch(`/api/organizations/${orgId}/bookings`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ serviceId, providerUserId: providerUserId || undefined, scheduledDate: date, scheduledTime: slot, type: mode, reason }),
      })
      const j = await res.json()
      if (!j.success) throw new Error(j.message || 'Could not book that slot')
      setDone({ provider: j.data?.assignedProvider?.name || 'a provider', when: `${date} at ${slot}` })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Booking failed. Please sign in and try again.')
    } finally { setSubmitting(false) }
  }

  if (loading) return <div className="py-20 flex justify-center"><FaSpinner className="text-[#0C6780] text-2xl animate-spin" /></div>

  if (done) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-6">
        <FaCheckCircle className="text-5xl text-green-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-fg mb-2">Booking confirmed</h1>
        <p className="text-soft">You&apos;re booked with <strong>{done.provider}</strong> on <strong>{done.when}</strong> at {entity?.name}.</p>
        <Link href="/bookings" className="inline-block mt-6 px-5 py-2.5 bg-[#0C6780] text-white rounded-xl font-semibold text-sm hover:bg-[#0a5568]">View my bookings</Link>
      </div>
    )
  }

  const selectedService = services.find(s => s.id === serviceId)

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <header className="flex items-center gap-3">
        {entity?.logoUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={entity.logoUrl} alt="" className="w-12 h-12 rounded-xl object-cover" />
          : <div className="w-12 h-12 rounded-xl bg-[#0C6780]/10 flex items-center justify-center text-[#0C6780]"><FaCalendarCheck /></div>}
        <div>
          <h1 className="text-xl font-bold text-fg">Book at {entity?.name ?? 'this organisation'}</h1>
          <p className="text-sm text-soft capitalize">{entity?.type?.replace(/_/g, ' ')}</p>
        </div>
      </header>

      {/* 1 · Service / category */}
      <section className="bg-surface rounded-2xl border border-line p-5">
        <h2 className="text-sm font-semibold text-fg mb-3">1 · What do you need?</h2>
        {services.length === 0 ? (
          <p className="text-sm text-faint">This organisation hasn&apos;t published bookable services yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {services.map(s => (
              <button key={s.id} onClick={() => setServiceId(s.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-left transition
                  ${serviceId === s.id ? 'border-[#0C6780] bg-[#0C6780]/10 text-[#0C6780]' : 'border-line bg-canvas text-soft hover:border-[#0C6780]/40'}`}>
                <span>{s.emoji || '🩺'}</span>
                <span className="min-w-0"><span className="block font-medium truncate">{s.serviceName}</span><span className="block text-[11px] text-faint truncate">{s.category} · {s.duration} min</span></span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 2 · Date + slot */}
      {serviceId && (
        <section className="bg-surface rounded-2xl border border-line p-5">
          <h2 className="text-sm font-semibold text-fg mb-3">2 · Pick a time for {selectedService?.serviceName}</h2>
          <input type="date" value={date} min={todayISO()} onChange={e => setDate(e.target.value)}
            className="px-3 py-2 border border-line rounded-xl text-sm bg-canvas mb-4 focus:ring-2 focus:ring-[#0C6780] outline-none" />
          {optLoading ? (
            <div className="py-4 flex justify-center"><FaSpinner className="text-[#0C6780] animate-spin" /></div>
          ) : allSlots.length === 0 ? (
            <p className="text-sm text-faint">No availability on this day. Try another date.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allSlots.map(t => (
                <button key={t} onClick={() => { setSlot(t); setProviderUserId('') }}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition
                    ${slot === t ? 'border-[#0C6780] bg-[#0C6780] text-white' : 'border-line bg-canvas text-soft hover:border-[#0C6780]/50'}`}>
                  {t}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 3 · Provider (optional) + mode */}
      {slot && (
        <section className="bg-surface rounded-2xl border border-line p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-fg mb-2">3 · Provider</h2>
            <select value={providerUserId} onChange={e => setProviderUserId(e.target.value)}
              className="w-full px-3 py-2 border border-line rounded-xl text-sm bg-canvas focus:ring-2 focus:ring-[#0C6780] outline-none">
              <option value="">Any available provider</option>
              {providersAtSlot.map(p => <option key={p.id} value={p.id}>{p.name} · {p.userType.toLowerCase().replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-fg mb-2">How?</h2>
            <div className="flex flex-wrap gap-2">
              {MODES.map(m => (
                <button key={m.key} onClick={() => setMode(m.key)}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition
                    ${mode === m.key ? 'border-[#0C6780] bg-[#0C6780]/10 text-[#0C6780]' : 'border-line bg-canvas text-soft hover:border-[#0C6780]/40'}`}>
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
          </div>
          <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for visit (optional)"
            className="w-full px-3 py-2 border border-line rounded-xl text-sm bg-canvas focus:ring-2 focus:ring-[#0C6780] outline-none" />

          {error && <p className="text-sm px-3 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200">{error}</p>}

          <button onClick={submit} disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#0C6780] text-white rounded-xl font-semibold text-sm hover:bg-[#0a5568] disabled:opacity-50">
            {submitting ? <FaSpinner className="animate-spin" /> : <FaCalendarCheck />} Confirm booking · {date} at {slot}
          </button>
        </section>
      )}

      {serviceId && (
        <button onClick={() => { setServiceId(''); setSlot(''); setOptions(null) }} className="text-xs text-soft hover:text-[#0C6780] inline-flex items-center gap-1.5">
          <FaArrowLeft /> Start over
        </button>
      )}
    </div>
  )
}
