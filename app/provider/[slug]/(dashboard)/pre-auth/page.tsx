'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  FaShieldAlt, FaPlus, FaCheck, FaTimes, FaHourglassHalf, FaBan, FaClock, FaSpinner,
} from 'react-icons/fa'
import { useCurrency } from '@/hooks/useCurrency'

/**
 * Provider-side pre-authorization flow. File a pre-auth on behalf of a
 * member before delivering a service. Owners review it (separate page).
 * Once approved, the provider comes back here and clicks "Mark as used"
 * to trigger the tiers-payant direct-billing payout to their wallet.
 */
interface PreAuth {
  id: string
  memberId: string
  companyProfileId: string
  description: string
  category?: string | null
  requestedAmount: number
  approvedAmount?: number | null
  memberPaysAmount?: number | null
  status: 'pending' | 'approved' | 'denied' | 'used' | 'expired' | 'cancelled'
  expiresAt: string
  denialReason?: string | null
  member?: { firstName: string; lastName: string }
  company?: { companyName: string }
}

const CATEGORIES = ['consultation', 'pharmacy', 'dental', 'lab', 'hospitalization', 'optical', 'other']

export default function ProviderPreAuthPage() {
  const [list, setList] = useState<PreAuth[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [companies, setCompanies] = useState<{ id: string; companyName: string }[]>([])

  // Draft form
  const [memberEmail, setMemberEmail] = useState('')
  const [companyProfileId, setCompanyProfileId] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('consultation')
  const [requestedAmount, setRequestedAmount] = useState('')
  const [expiresInDays, setExpiresInDays] = useState('14')
  const [submitting, setSubmitting] = useState(false)
  const [usingId, setUsingId] = useState<string | null>(null)
  const { format } = useCurrency()

  const fetchList = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const res = await fetch('/api/corporate/insurance/pre-auth?as=provider', { credentials: 'include' })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to load')
      setList(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally { setLoading(false) }
  }, [])

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await fetch('/api/corporate/insurance-companies', { credentials: 'include' })
      const json = await res.json()
      setCompanies(Array.isArray(json?.data) ? json.data : [])
    } catch { /* noop */ }
  }, [])

  useEffect(() => { fetchList() }, [fetchList])

  async function submit() {
    setSubmitting(true); setError(null)
    try {
      // Backend accepts memberEmail directly - no separate lookup needed.
      const res = await fetch('/api/corporate/insurance/pre-auth', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberEmail: memberEmail.trim(),
          companyProfileId,
          description: description.trim(),
          category,
          requestedAmount: parseFloat(requestedAmount),
          expiresInDays: parseInt(expiresInDays, 10),
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Submit failed')

      setCreating(false); setMemberEmail(''); setDescription(''); setRequestedAmount('')
      await fetchList()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed')
    } finally { setSubmitting(false) }
  }

  async function markUsed(id: string) {
    if (!confirm('Mark this pre-authorization as used? This triggers direct billing - funds move from the insurer to your Account Balance.')) return
    setUsingId(id)
    try {
      const res = await fetch(`/api/corporate/insurance/pre-auth/${id}/use`, { method: 'POST', credentials: 'include' })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to mark used')
      await fetchList()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed')
    } finally { setUsingId(null) }
  }

  const openForm = () => {
    if (companies.length === 0) fetchCompanies()
    setCreating(true)
  }

  const pending = list.filter((p) => p.status === 'pending')
  const approved = list.filter((p) => p.status === 'approved')
  const historical = list.filter((p) => !['pending', 'approved'].includes(p.status))

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-5">
      <header className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><FaShieldAlt /></div>
          <div>
            <h1 className="text-2xl font-bold text-fg">Pre-authorizations</h1>
            <p className="text-sm text-soft mt-1">Request coverage upfront, then mark as used to get paid directly by the insurer.</p>
          </div>
        </div>
        {!creating && (
          <button onClick={openForm} className="inline-flex items-center gap-1.5 text-sm font-semibold bg-[#0C6780] hover:bg-[#001E40] text-white px-4 py-2 rounded-lg">
            <FaPlus /> Request pre-auth
          </button>
        )}
      </header>

      {creating && (
        <section className="bg-surface border border-line rounded-xl p-4 sm:p-5 space-y-3">
          <h2 className="text-sm font-semibold text-fg">Request pre-authorization</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-soft mb-1">Member email</label>
              <input value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} placeholder="member@mediwyz.com" className="w-full text-sm border border-line rounded-lg px-2 py-1.5" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase text-soft mb-1">Insurance company</label>
              <select value={companyProfileId} onChange={(e) => setCompanyProfileId(e.target.value)} className="w-full text-sm border border-line rounded-lg px-2 py-1.5 bg-surface">
                <option value="">Choose an insurance company</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-soft mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full text-sm border border-line rounded-lg px-2 py-1.5 bg-surface">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase text-soft mb-1">Requested amount</label>
              <input type="number" inputMode="decimal" value={requestedAmount} onChange={(e) => setRequestedAmount(e.target.value)} placeholder="0" className="w-full text-sm border border-line rounded-lg px-2 py-1.5" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase text-soft mb-1">Expires in (days)</label>
              <input type="number" min={1} max={90} value={expiresInDays} onChange={(e) => setExpiresInDays(e.target.value)} className="w-full text-sm border border-line rounded-lg px-2 py-1.5" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase text-soft mb-1">Description</label>
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Orthodontic consultation + treatment plan" className="w-full text-sm border border-line rounded-lg p-2" />
          </div>
          {error && <div className="text-xs text-red-600">{error}</div>}
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => { setCreating(false); setError(null) }} className="px-3 py-1.5 text-sm text-soft hover:bg-subtle rounded-lg" disabled={submitting}>Cancel</button>
            <button onClick={submit} disabled={submitting || !memberEmail || !companyProfileId || !description || !requestedAmount} className="px-4 py-1.5 text-sm font-semibold bg-[#0C6780] hover:bg-[#001E40] text-white rounded-lg disabled:opacity-50 inline-flex items-center gap-1.5">
              {submitting && <FaSpinner className="animate-spin" />} {submitting ? 'Submitting' : 'Submit request'}
            </button>
          </div>
        </section>
      )}

      {loading ? (
        <Skeleton />
      ) : error && !creating ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm">{error}</div>
      ) : list.length === 0 ? (
        <div className="bg-surface border border-dashed border-line rounded-xl p-8 text-center">
          <FaShieldAlt className="mx-auto text-4xl text-faint mb-2" />
          <p className="text-sm text-soft mb-3">No pre-authorizations yet.</p>
          <p className="text-[11px] text-faint max-w-sm mx-auto">Use pre-auths for services where the member wants the insurer to pay you directly (tiers payant) instead of reimbursing them after the fact.</p>
        </div>
      ) : (
        <>
          {approved.length > 0 && (
            <Group title="Approved - ready to deliver" tint="emerald">
              {approved.map((p) => (
                <Row key={p.id} p={p} format={format}>
                  <button onClick={() => markUsed(p.id)} disabled={usingId === p.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50">
                    {usingId === p.id && <FaSpinner className="animate-spin" />}
                    {usingId === p.id ? 'Processing' : 'Mark as used'}
                  </button>
                </Row>
              ))}
            </Group>
          )}
          {pending.length > 0 && (
            <Group title="Awaiting insurer review" tint="amber">
              {pending.map((p) => (
                <Row key={p.id} p={p} format={format}>
                  <span className="inline-flex items-center gap-1 text-xs text-amber-700"><FaHourglassHalf /> Pending</span>
                </Row>
              ))}
            </Group>
          )}
          {historical.length > 0 && (
            <Group title="History" tint="gray">
              {historical.map((p) => (
                <Row key={p.id} p={p} format={format}>
                  <StatusBadge status={p.status} />
                </Row>
              ))}
            </Group>
          )}
        </>
      )}
    </div>
  )
}

function Group({ title, tint, children }: { title: string; tint: 'emerald' | 'amber' | 'gray'; children: React.ReactNode }) {
  const tintCls = { emerald: 'text-emerald-700', amber: 'text-amber-700', gray: 'text-soft' }[tint]
  return (
    <section>
      <h2 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${tintCls}`}>{title}</h2>
      <div className="bg-surface border border-line rounded-xl divide-y divide-line">{children}</div>
    </section>
  )
}

function Row({ p, children, format }: { p: PreAuth; children: React.ReactNode; format: (amt: number) => string }) {
  const expires = new Date(p.expiresAt)
  const expired = expires < new Date()
  return (
    <div className="p-4 flex items-start justify-between gap-3 flex-wrap">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-fg">
          {format(p.requestedAmount)}
          {p.approvedAmount != null && p.approvedAmount !== p.requestedAmount && (
            <span className="text-emerald-700 font-semibold">  {format(p.approvedAmount)} approved</span>
          )}
        </p>
        <p className="text-sm text-soft mt-0.5">{p.description}</p>
        <p className="text-[11px] text-soft mt-1">
          {p.member ? `${p.member.firstName} ${p.member.lastName}  ` : ''}
          {p.company?.companyName}
          {p.category ? `  ${p.category}` : ''}
          {p.status !== 'used' && p.status !== 'denied' && (
            <span className={expired ? 'text-red-600 ml-2' : 'ml-2'}><FaClock className="inline mb-0.5 mr-0.5" />{expired ? 'Expired ' : 'Expires '}{expires.toLocaleDateString()}</span>
          )}
          {p.denialReason && <span className="block text-red-600 mt-0.5">Denial reason: {p.denialReason}</span>}
        </p>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: PreAuth['status'] }) {
  const cfg = {
    used: { icon: FaCheck, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Used  Paid' },
    denied: { icon: FaTimes, cls: 'bg-red-50 text-red-700 border-red-200', label: 'Denied' },
    expired: { icon: FaClock, cls: 'bg-subtle text-soft border-line', label: 'Expired' },
    cancelled: { icon: FaBan, cls: 'bg-subtle text-soft border-line', label: 'Cancelled' },
    pending: { icon: FaHourglassHalf, cls: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pending' },
    approved: { icon: FaCheck, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Approved' },
  }[status]
  const Icon = cfg.icon
  return <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${cfg.cls}`}><Icon /> {cfg.label}</span>
}

function Skeleton() {
  return (
    <div className="bg-surface border border-line rounded-xl p-4 space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-16 bg-subtle rounded-lg animate-pulse" />
      ))}
    </div>
  )
}
