'use client'

import { useCallback, useEffect, useState } from 'react'
import { FaCalendarAlt, FaClock, FaUsers, FaSpinner, FaCheck, FaExchangeAlt } from 'react-icons/fa'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Member { userId: string; name: string; userType: string }
interface DayRow { enabled: boolean; start: string; end: string }
interface OrgBooking {
  id: string; providerUserId: string; providerName: string | null; patientName: string | null
  serviceName: string | null; scheduledAt: string; duration: number; type: string; status: string
}

/** Admin tab: configure each member's per-org availability + see/reassign org bookings. */
export default function OrgBookingAdmin({ orgId }: { orgId: string }) {
  const [members, setMembers] = useState<Member[]>([])
  const [bookings, setBookings] = useState<OrgBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string>('')
  const [grid, setGrid] = useState<DayRow[]>(() => DAYS.map(() => ({ enabled: false, start: '09:00', end: '17:00' })))
  const [savingAvail, setSavingAvail] = useState(false)
  const [savedAvail, setSavedAvail] = useState(false)
  const [reassigning, setReassigning] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [mRes, bRes] = await Promise.all([
        fetch(`/api/organizations/${orgId}/members`, { credentials: 'include' }),
        fetch(`/api/organizations/${orgId}/bookings`, { credentials: 'include' }),
      ])
      const mJson = await mRes.json()
      if (mJson.success) {
        const list: Member[] = (mJson.data || [])
          .filter((m: { status: string }) => m.status === 'active')
          .map((m: { provider: { id: string; firstName: string; lastName: string; userType: string } }) => ({
            userId: m.provider.id, name: `${m.provider.firstName} ${m.provider.lastName}`.trim(), userType: m.provider.userType,
          }))
        setMembers(list)
        if (list.length && !selected) setSelected(list[0].userId)
      }
      const bJson = await bRes.json()
      if (bJson.success) setBookings(bJson.data || [])
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [orgId, selected])
  useEffect(() => { load() }, [load])

  // Load the selected member's availability into the grid.
  useEffect(() => {
    if (!selected) return
    setSavedAvail(false)
    fetch(`/api/organizations/${orgId}/members/${selected}/availability`, { credentials: 'include' })
      .then(r => r.json())
      .then(j => {
        const next = DAYS.map(() => ({ enabled: false, start: '09:00', end: '17:00' }))
        if (j.success) {
          for (const row of j.data as { dayOfWeek: number; startTime: string; endTime: string }[]) {
            if (row.dayOfWeek >= 0 && row.dayOfWeek <= 6) next[row.dayOfWeek] = { enabled: true, start: row.startTime, end: row.endTime }
          }
        }
        setGrid(next)
      })
      .catch(() => {})
  }, [selected, orgId])

  const setDay = (i: number, patch: Partial<DayRow>) =>
    setGrid(g => g.map((d, idx) => (idx === i ? { ...d, ...patch } : d)))

  async function saveAvailability() {
    if (!selected) return
    setSavingAvail(true); setSavedAvail(false)
    try {
      const slots = grid
        .map((d, day) => ({ dayOfWeek: day, startTime: d.start, endTime: d.end, enabled: d.enabled }))
        .filter(s => s.enabled && s.startTime < s.endTime)
        .map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime }))
      const res = await fetch(`/api/organizations/${orgId}/members/${selected}/availability`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ slots }),
      })
      if ((await res.json()).success) { setSavedAvail(true); setTimeout(() => setSavedAvail(false), 2500) }
    } finally { setSavingAvail(false) }
  }

  async function reassign(bookingId: string, providerUserId: string) {
    if (!providerUserId) return
    setReassigning(bookingId)
    try {
      const res = await fetch(`/api/organizations/${orgId}/bookings/${bookingId}/reassign`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ providerUserId }),
      })
      if ((await res.json()).success) await load()
    } finally { setReassigning(null) }
  }

  if (loading) return <div className="py-10 flex justify-center"><FaSpinner className="text-[#0C6780] text-2xl animate-spin" /></div>

  return (
    <div className="space-y-6">
      {/* Availability editor */}
      <div className="rounded-2xl border border-line bg-canvas p-4 sm:p-5">
        <h4 className="font-semibold text-fg text-sm mb-1 flex items-center gap-2"><FaClock className="text-[#0C6780]" /> Member availability</h4>
        <p className="text-xs text-soft mb-4">Set the weekly hours each provider works at this organisation. Patients can only book within these times.</p>

        {members.length === 0 ? (
          <p className="text-sm text-faint py-2">No active members yet. Invite providers from the Invite tab.</p>
        ) : (
          <>
            <select
              value={selected}
              onChange={e => setSelected(e.target.value)}
              className="w-full sm:w-72 mb-4 px-3 py-2 border border-line rounded-xl text-sm bg-surface focus:ring-2 focus:ring-[#0C6780] outline-none"
            >
              {members.map(m => <option key={m.userId} value={m.userId}>{m.name} · {m.userType.toLowerCase().replace(/_/g, ' ')}</option>)}
            </select>

            <div className="space-y-2">
              {grid.map((d, i) => (
                <div key={i} className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <label className="flex items-center gap-2 w-24 flex-shrink-0">
                    <input type="checkbox" checked={d.enabled} onChange={e => setDay(i, { enabled: e.target.checked })} className="w-4 h-4 accent-[#0C6780]" />
                    <span className="text-sm font-medium text-fg">{DAYS[i]}</span>
                  </label>
                  <input type="time" value={d.start} disabled={!d.enabled} onChange={e => setDay(i, { start: e.target.value })}
                    className="px-2 py-1.5 border border-line rounded-lg text-sm bg-surface disabled:opacity-40" />
                  <span className="text-soft text-sm">to</span>
                  <input type="time" value={d.end} disabled={!d.enabled} onChange={e => setDay(i, { end: e.target.value })}
                    className="px-2 py-1.5 border border-line rounded-lg text-sm bg-surface disabled:opacity-40" />
                </div>
              ))}
            </div>

            <button
              onClick={saveAvailability}
              disabled={savingAvail}
              className="mt-4 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0C6780] text-white rounded-xl font-semibold text-sm hover:bg-[#0a5568] disabled:opacity-50"
            >
              {savingAvail ? <FaSpinner className="animate-spin" /> : savedAvail ? <FaCheck /> : <FaClock className="text-xs" />}
              {savedAvail ? 'Saved' : 'Save availability'}
            </button>
          </>
        )}
      </div>

      {/* Org bookings + reassignment */}
      <div className="rounded-2xl border border-line bg-canvas p-4 sm:p-5">
        <h4 className="font-semibold text-fg text-sm mb-3 flex items-center gap-2"><FaCalendarAlt className="text-[#0C6780]" /> Bookings</h4>
        {bookings.length === 0 ? (
          <p className="text-sm text-faint py-2">No bookings yet. Share your organisation&apos;s booking link with patients.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-subtle border-b border-line">
                <tr>
                  <th className="text-left py-2 px-3 text-xs font-medium text-soft uppercase">When</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-soft uppercase">Service</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-soft uppercase">Patient</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-soft uppercase">Assigned to</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-soft uppercase">Reassign</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-subtle">
                    <td className="py-2 px-3 text-xs text-soft whitespace-nowrap">{new Date(b.scheduledAt).toLocaleString()}</td>
                    <td className="py-2 px-3"><span className="text-fg">{b.serviceName || '—'}</span> <span className="text-[10px] text-faint">· {b.type.replace('_', ' ')}</span></td>
                    <td className="py-2 px-3 text-soft">{b.patientName || '—'}</td>
                    <td className="py-2 px-3 text-fg">{b.providerName || '—'}</td>
                    <td className="py-2 px-3">
                      <select
                        defaultValue=""
                        disabled={reassigning === b.id}
                        onChange={e => reassign(b.id, e.target.value)}
                        className="px-2 py-1 border border-line rounded-lg text-xs bg-surface focus:ring-2 focus:ring-[#0C6780] outline-none"
                      >
                        <option value="">{reassigning === b.id ? 'Saving…' : 'Change…'}</option>
                        {members.filter(m => m.userId !== b.providerUserId).map(m => (
                          <option key={m.userId} value={m.userId}>{m.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[11px] text-faint mt-3 flex items-center gap-1.5"><FaExchangeAlt /> Reassigning moves the held time slot to the new member.</p>
      </div>

      <p className="text-[11px] text-faint flex items-center gap-1.5"><FaUsers /> Patients book at <span className="font-mono">/organization/{orgId}/book</span></p>
    </div>
  )
}
