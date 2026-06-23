'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  FaShieldAlt, FaCheck, FaTimes, FaHourglassHalf, FaBan, FaClock, FaSpinner,
} from 'react-icons/fa'
import { useCurrency } from '@/hooks/useCurrency'

/**
 * Insurance-owner view of incoming pre-authorization requests. Approving
 * runs the rules engine (which may auto-downgrade to `pending_review` if
 * fraud signals fire). Denying leaves an audit trail via ClaimDecisionLog.
 */
interface PreAuth {
  id: string
  memberId: string
  providerId: string
  description: string
  category?: string | null
  requestedAmount: number
  approvedAmount?: number | null
  memberPaysAmount?: number | null
  status: 'pending' | 'approved' | 'denied' | 'used' | 'expired' | 'cancelled'
  expiresAt: string
  denialReason?: string | null
  createdAt: string
  member?: { firstName: string; lastName: string; email: string }
  provider?: { firstName: string; lastName: string; email: string; userType: string }
}

export default function InsurancePreAuthsPage() {
  const [list, setList] = useState<PreAuth[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [denyingId, setDenyingId] = useState<string | null>(null)
  const [denyReason, setDenyReason] = useState('')
  const { format } = useCurrency()

  const fetchList = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const res = await fetch('/api/corporate/insurance/pre-auth?as=owner', { credentials: 'include' })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to load')
      setList(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchList() }, [fetchList])

  async function approve(id: string) {
    setBusyId(id)
    try {
      const res = await fetch(`/api/corporate/insurance/pre-auth/${id}/approve`, { method: 'POST', credentials: 'include' })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Approve failed')
      await fetchList()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed')
    } finally { setBusyId(null) }
  }

  async function deny(id: string) {
    setBusyId(id)
    try {
      const res = await fetch(`/api/corporate/insurance/pre-auth/${id}/deny`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: denyReason.trim() || undefined }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Deny failed')
      setDenyingId(null); setDenyReason('')
      await fetchList()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed')
    } finally { setBusyId(null) }
  }

  const pending = list.filter((p) => p.status === 'pending')
  const approved = list.filter((p) => p.status === 'approved')
  const historical = list.filter((p) => !['pending', 'approved'].includes(p.status))

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-5">
      <header className="flex items-center gap-3">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><FaShieldAlt /></div>
        <div>
          <h1 className="text-2xl font-bold text-fg">Pre-authorizations</h1>
          <p className="text-sm text-soft mt-1">Providers request coverage upfront; you approve, rules engine runs, direct billing triggers when they deliver.</p>
        </div>
      </header>

      {loading ? (
        <div className="bg-surface border border-line rounded-xl p-8 text-center text-sm text-soft">Loading…</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm">{error}</div>
      ) : list.length === 0 ? (
        <div className="bg-surface border border-dashed border-line rounded-xl p-8 text-center">
          <FaShieldAlt className="mx-auto text-4xl text-faint mb-2" />
          <p className="text-sm text-soft">No pre-authorizations yet.</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-2">Awaiting your review</h2>
              <div className="bg-surface border border-line rounded-xl divide-y divide-line">
                {pending.map((p) => (
                  <div key={p.id} className="p-4">
                    <Row p={p} format={format} />
                    {denyingId === p.id ? (
                      <div className="mt-3 space-y-2">
                        <textarea
                          rows={2}
                          value={denyReason}
                          onChange={(e) => setDenyReason(e.target.value)}
                          placeholder="Optional reason shown to provider + member"
                          className="w-full text-xs border border-line rounded-lg p-2"
                        />
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => { setDenyingId(null); setDenyReason('') }} className="px-3 py-1.5 text-xs text-soft hover:bg-subtle rounded-lg">Cancel</button>
                          <button onClick={() => deny(p.id)} disabled={busyId === p.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50">
                            {busyId === p.id && <FaSpinner className="animate-spin" />} Confirm deny
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex gap-2 justify-end">
                        <button onClick={() => setDenyingId(p.id)} disabled={busyId !== null} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg disabled:opacity-50"><FaBan /> Deny</button>
                        <button onClick={() => approve(p.id)} disabled={busyId !== null} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50">
                          {busyId === p.id ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                          {busyId === p.id ? 'Approving…' : 'Approve (runs rules engine)'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {approved.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-2">Approved - waiting for provider to deliver</h2>
              <div className="bg-surface border border-line rounded-xl divide-y divide-line">
                {approved.map((p) => <div key={p.id} className="p-4"><Row p={p} format={format} /></div>)}
              </div>
            </section>
          )}

          {historical.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-soft mb-2">History</h2>
              <div className="bg-surface border border-line rounded-xl divide-y divide-line">
                {historical.map((p) => <div key={p.id} className="p-4"><Row p={p} format={format} /></div>)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function Row({ p, format }: { p: PreAuth; format: (amt: number) => string }) {
  const expires = new Date(p.expiresAt)
  const expired = expires < new Date() && !['used', 'denied', 'cancelled'].includes(p.status)
  return (
    <div className="flex items-start justify-between gap-3 flex-wrap">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-fg">
          {format(p.requestedAmount)}
          {p.approvedAmount != null && p.approvedAmount !== p.requestedAmount && (
            <span className="text-emerald-700 font-semibold"> → {format(p.approvedAmount)} approved</span>
          )}
        </p>
        <p className="text-sm text-soft mt-0.5">{p.description}</p>
        <p className="text-[11px] text-soft mt-1">
          Member: {p.member?.firstName} {p.member?.lastName}
          {' · '}Provider: {p.provider?.firstName} {p.provider?.lastName} ({p.provider?.userType?.toLowerCase()})
          {p.category ? ` · ${p.category}` : ''}
          {p.status !== 'used' && p.status !== 'denied' && (
            <span className={expired ? 'text-red-600 ml-2' : 'ml-2'}><FaClock className="inline mb-0.5 mr-0.5" />{expired ? 'Expired ' : 'Expires '}{expires.toLocaleDateString()}</span>
          )}
          {p.denialReason && <span className="block text-red-600 mt-0.5">Denial reason: {p.denialReason}</span>}
        </p>
      </div>
      <StatusBadge status={p.status} />
    </div>
  )
}

function StatusBadge({ status }: { status: PreAuth['status'] }) {
  const cfg = {
    used: { icon: FaCheck, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Used · Paid' },
    denied: { icon: FaTimes, cls: 'bg-red-50 text-red-700 border-red-200', label: 'Denied' },
    expired: { icon: FaClock, cls: 'bg-subtle text-soft border-line', label: 'Expired' },
    cancelled: { icon: FaBan, cls: 'bg-subtle text-soft border-line', label: 'Cancelled' },
    pending: { icon: FaHourglassHalf, cls: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pending' },
    approved: { icon: FaCheck, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Approved' },
  }[status]
  const Icon = cfg.icon
  return <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${cfg.cls}`}><Icon /> {cfg.label}</span>
}
