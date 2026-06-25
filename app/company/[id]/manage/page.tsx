'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  FaBuilding, FaUsers, FaEnvelope, FaCheck, FaTimes, FaTrash, FaSpinner, FaUserCircle,
} from 'react-icons/fa'

interface Member {
  id: string; userId: string; status: string
  name: string; email: string; profileImage: string | null; joinedAt: string
}
interface Company { id: string; companyName: string; isInsuranceCompany: boolean }

export default function ManageCompanyPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/corporate/companies/${id}/members`, { credentials: 'include' })
      const json = await res.json()
      if (!json.success) { setForbidden(true); return }
      setCompany(json.data.company)
      setMembers(json.data.members ?? [])
    } catch { setForbidden(true) } finally { setLoading(false) }
  }, [id])
  useEffect(() => { load() }, [load])

  async function invite() {
    if (!email.trim()) { setMsg({ ok: false, text: 'Email is required' }); return }
    setBusy(true); setMsg(null)
    try {
      const res = await fetch(`/api/corporate/companies/${id}/members`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ email: email.trim() }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to invite')
      setMsg({ ok: true, text: `Invitation sent to ${email.trim()}.` }); setEmail(''); await load()
    } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : 'Failed to invite' }) } finally { setBusy(false) }
  }

  async function act(memberId: string, action: 'approve' | 'reject' | 'remove') {
    if (action === 'remove' && !confirm('Remove this member?')) return
    setBusy(true)
    try {
      const res = await fetch(`/api/corporate/companies/${id}/members`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ memberId, action }),
      })
      const json = await res.json()
      if (json.success) await load()
    } finally { setBusy(false) }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><FaSpinner className="text-[#0C6780] text-3xl animate-spin" /></div>
  }
  if (forbidden || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <FaUserCircle className="text-5xl text-faint mx-auto mb-4" />
          <h2 className="text-xl font-bold text-fg mb-2">Access Denied</h2>
          <p className="text-soft mb-6">You don&apos;t have permission to manage this company.</p>
          <button onClick={() => router.back()} className="px-5 py-2.5 bg-[#0C6780] text-white rounded-xl font-semibold text-sm hover:bg-[#0a5568]">Go Back</button>
        </div>
      </div>
    )
  }

  const pending = members.filter(m => m.status === 'pending')
  const active = members.filter(m => m.status === 'active')

  return (
    <div className="min-h-screen bg-subtle">
      <div className="bg-[#001E40] text-white px-4 sm:px-8 py-6">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <FaBuilding className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{company.companyName}</h1>
            <p className="text-white/60 text-sm">{company.isInsuranceCompany ? 'Insurance company' : 'Company'} · Members</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Invite */}
        <div className="bg-surface rounded-2xl border border-line p-5">
          <h3 className="font-semibold text-fg mb-3 flex items-center gap-2"><FaEnvelope className="text-[#0C6780]" /> Invite a member</h3>
          {msg && <p className={`text-sm mb-3 px-3 py-2 rounded-lg ${msg.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg.text}</p>}
          <div className="flex gap-2">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && invite()} placeholder="colleague@email.com" className="flex-1 px-3 py-2.5 border border-line rounded-xl text-sm focus:ring-2 focus:ring-[#0C6780] outline-none" />
            <button onClick={invite} disabled={busy} className="px-5 py-2.5 bg-[#0C6780] text-white rounded-xl font-semibold text-sm hover:bg-[#0a5568] disabled:opacity-60 inline-flex items-center gap-2">
              {busy ? <FaSpinner className="animate-spin" /> : <FaEnvelope />} Invite
            </button>
          </div>
        </div>

        {/* Members */}
        <div className="bg-surface rounded-2xl border border-line p-5">
          <h3 className="font-semibold text-fg mb-3 flex items-center gap-2"><FaUsers className="text-[#0C6780]" /> Members ({active.length})</h3>

          {pending.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-amber-700 uppercase mb-1.5">Pending ({pending.length})</p>
              {pending.map(m => (
                <MemberRow key={m.id} m={m} busy={busy}
                  onApprove={() => act(m.id, 'approve')} onReject={() => act(m.id, 'reject')} />
              ))}
            </div>
          )}

          {active.length === 0 ? (
            <p className="text-sm text-faint py-2">No active members yet. Invite someone above.</p>
          ) : active.map(m => (
            <MemberRow key={m.id} m={m} busy={busy} onRemove={() => act(m.id, 'remove')} />
          ))}
        </div>
      </div>
    </div>
  )
}

function MemberRow({ m, busy, onApprove, onReject, onRemove }: {
  m: Member; busy: boolean
  onApprove?: () => void; onReject?: () => void; onRemove?: () => void
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-line last:border-0">
      <div className="w-9 h-9 rounded-full bg-[#0C6780] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {`${m.name.split(' ')[0]?.[0] ?? ''}${m.name.split(' ')[1]?.[0] ?? ''}`.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-fg text-sm truncate">{m.name}</p>
        <p className="text-xs text-soft truncate">{m.email}</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        {onApprove && <button onClick={onApprove} disabled={busy} aria-label="Approve" className="w-8 h-8 rounded-full bg-green-100 hover:bg-green-200 text-green-700 flex items-center justify-center disabled:opacity-50"><FaCheck className="text-xs" /></button>}
        {onReject && <button onClick={onReject} disabled={busy} aria-label="Reject" className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 text-red-700 flex items-center justify-center disabled:opacity-50"><FaTimes className="text-xs" /></button>}
        {onRemove && <button onClick={onRemove} disabled={busy} aria-label="Remove" className="w-8 h-8 rounded-full bg-subtle hover:bg-line text-soft flex items-center justify-center disabled:opacity-50"><FaTrash className="text-xs" /></button>}
      </div>
    </div>
  )
}
