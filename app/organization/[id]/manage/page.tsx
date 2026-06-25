'use client'

import { useState, useEffect, useRef, useCallback, ChangeEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  FaBuilding, FaUsers, FaEnvelope, FaCog, FaCheck, FaTimes,
  FaUserCircle, FaUpload, FaTrash, FaCopy, FaSpinner,
  FaBoxOpen, FaPlus, FaEdit, FaExclamationTriangle, FaPrescriptionBottleAlt,
} from 'react-icons/fa'

// ─── Types ─────────────────────────────────────────────────────────────────

interface EntityDetail {
  id: string; name: string; type: string; description: string | null
  address: string | null; city: string | null; country: string
  phone: string | null; email: string | null; website: string | null
  logoUrl: string | null; isVerified: boolean; founderUserId: string | null
}

interface WorkplaceMember {
  id: string; status: string; role: string | null; isPrimary: boolean
  provider: { id: string; firstName: string; lastName: string; userType: string; profileImage: string | null }
}

interface Invitation {
  id: string; email: string; suggestedRole: string | null; token: string; createdAt: string
}

type TabId = 'overview' | 'members' | 'invite' | 'inventory' | 'settings'

// Pharmacies / health-shops get an Inventory tab; other org types don't.
const isInventoryOrg = (type: string) => /pharmac|health[\s_-]?shop|drugstore/i.test(type || '')

const SHOP_CATEGORIES = [
  { key: 'medicines', label: 'Medicines' }, { key: 'supplements', label: 'Supplements' },
  { key: 'equipment', label: 'Equipment' }, { key: 'personal_care', label: 'Personal Care' },
  { key: 'eyewear', label: 'Eyewear' }, { key: 'dental', label: 'Dental Products' },
  { key: 'nutrition', label: 'Nutrition Products' }, { key: 'other', label: 'Other' },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

function avatarInitials(first: string, last: string): string {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

const ENTITY_TYPES = [
  'Clinic', 'Hospital', 'Pharmacy', 'Laboratory', 'Dental Clinic',
  'Eye Clinic', 'Physiotherapy Center', 'Nursing Home', 'Diagnostic Center', 'Other',
]

// ─── Sub-components ─────────────────────────────────────────────────────────

function MemberRow({
  member, onApprove, onReject, onRemove, loading,
}: {
  member: WorkplaceMember
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  onRemove?: (id: string) => void
  loading: boolean
}) {
  const { provider } = member
  const name = `${provider.firstName} ${provider.lastName}`

  return (
    <div className="flex items-center gap-3 py-3 border-b border-line last:border-0">
      {provider.profileImage ? (
        <Image
          src={provider.profileImage}
          alt={name}
          width={40}
          height={40}
          unoptimized
          className="rounded-full object-cover w-10 h-10 flex-shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-[#0C6780] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {avatarInitials(provider.firstName, provider.lastName)}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-fg text-sm truncate">{name}</p>
        <p className="text-xs text-soft">{provider.userType.replace(/_/g, ' ')}</p>
        {member.role && <p className="text-xs text-[#0C6780]">{member.role}</p>}
      </div>

      {member.isPrimary && (
        <span className="text-[10px] font-bold bg-[#001E40] text-white px-2 py-0.5 rounded-full">
          Primary
        </span>
      )}

      <div className="flex gap-2 flex-shrink-0">
        {onApprove && (
          <button
            onClick={() => onApprove(member.id)}
            disabled={loading}
            aria-label="Approve"
            className="w-8 h-8 rounded-full bg-green-100 hover:bg-green-200 text-green-700 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <FaCheck className="text-xs" />
          </button>
        )}
        {onReject && (
          <button
            onClick={() => onReject(member.id)}
            disabled={loading}
            aria-label="Reject"
            className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 text-red-700 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <FaTimes className="text-xs" />
          </button>
        )}
        {onRemove && (
          <button
            onClick={() => onRemove(member.id)}
            disabled={loading}
            aria-label="Remove"
            className="w-8 h-8 rounded-full bg-subtle hover:bg-line text-soft flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <FaTrash className="text-xs" />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Overview ───────────────────────────────────────────────────────────

function OverviewTab({ entity, id }: { entity: EntityDetail; id: string }) {
  const [form, setForm] = useState({
    name: entity.name,
    type: entity.type,
    description: entity.description ?? '',
    address: entity.address ?? '',
    city: entity.city ?? '',
    country: entity.country,
    phone: entity.phone ?? '',
    email: entity.email ?? '',
    website: entity.website ?? '',
  })
  const [logoPreview, setLogoPreview] = useState<string | null>(entity.logoUrl)
  const [saving, setSaving] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const logoData = reader.result as string
        setLogoPreview(logoData)
        const res = await fetch(`/api/organizations/${id}/logo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ logoData }),
        })
        const json = await res.json()
        if (!json.success) throw new Error(json.message)
        showToast('Logo updated', true)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Logo upload failed', false)
    } finally {
      setLogoUploading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/organizations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      showToast('Changes saved', true)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', false)
    } finally {
      setSaving(false)
    }
  }

  const initials = form.name.split(/\s+/).map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2)

  return (
    <div className="space-y-6 relative">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.ok ? <FaCheck /> : <FaTimes />} {toast.msg}
        </div>
      )}

      {/* Logo */}
      <div className="flex items-center gap-5">
        <button
          onClick={() => fileRef.current?.click()}
          aria-label="Change logo"
          className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-dashed border-line hover:border-[#0C6780] transition-colors group"
        >
          {logoPreview ? (
            <Image src={logoPreview} alt="Logo" fill unoptimized className="object-cover" />
          ) : (
            <div className="w-full h-full bg-[#001E40] flex items-center justify-center text-white text-xl font-bold">
              {initials}
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            {logoUploading ? <FaSpinner className="text-white animate-spin" /> : <FaUpload className="text-white" />}
          </div>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
        <div>
          <p className="font-semibold text-fg">Entity Logo</p>
          <p className="text-xs text-soft mt-0.5">Click to upload. PNG or JPG up to 2MB.</p>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Entity Name" name="name" value={form.name} onChange={handleChange} required />
        <div>
          <label className="block text-sm font-medium text-soft mb-1">Type</label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full px-3 py-2.5 border border-line rounded-xl text-sm focus:ring-2 focus:ring-[#0C6780] focus:border-[#0C6780] outline-none"
          >
            {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-soft mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2.5 border border-line rounded-xl text-sm focus:ring-2 focus:ring-[#0C6780] focus:border-[#0C6780] outline-none resize-none"
            placeholder="Brief description of your entity…"
          />
        </div>
        <Field label="Address" name="address" value={form.address} onChange={handleChange} />
        <Field label="City" name="city" value={form.city} onChange={handleChange} />
        <Field label="Country" name="country" value={form.country} onChange={handleChange} />
        <Field label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange} />
        <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} />
        <Field label="Website" name="website" type="url" value={form.website} onChange={handleChange} placeholder="https://" />
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#0C6780] hover:bg-[#0a5568] text-white px-6 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60 transition-colors"
        >
          {saving ? <FaSpinner className="animate-spin" /> : <FaCheck />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

function Field({
  label, name, value, onChange, type = 'text', required = false, placeholder,
}: {
  label: string; name: string; value: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void
  type?: string; required?: boolean; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-soft mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-line rounded-xl text-sm focus:ring-2 focus:ring-[#0C6780] focus:border-[#0C6780] outline-none"
      />
    </div>
  )
}

// ─── Tab: Members ────────────────────────────────────────────────────────────

function MembersTab({ id }: { id: string }) {
  const [members, setMembers] = useState<WorkplaceMember[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showRejected, setShowRejected] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/organizations/${id}/members`, { credentials: 'include' })
      const json = await res.json()
      if (json.success) setMembers(json.data ?? [])
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  async function approve(workplaceId: string) {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/organizations/${id}/members/${workplaceId}/approve`, {
        method: 'POST', credentials: 'include',
      })
      const json = await res.json()
      if (json.success) await load()
    } finally { setActionLoading(false) }
  }

  async function reject(workplaceId: string) {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/organizations/${id}/members/${workplaceId}`, {
        method: 'DELETE', credentials: 'include',
      })
      const json = await res.json()
      if (json.success) await load()
    } finally { setActionLoading(false) }
  }

  async function remove(workplaceId: string) {
    if (!confirm('Remove this member from the entity?')) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/organizations/${id}/members/${workplaceId}`, {
        method: 'DELETE', credentials: 'include',
      })
      const json = await res.json()
      if (json.success) await load()
    } finally { setActionLoading(false) }
  }

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-14 bg-subtle rounded-xl animate-pulse" />)}</div>
  }

  const pending = members.filter(m => m.status === 'pending_approval')
  const active = members.filter(m => m.status === 'active')
  const rejected = members.filter(m => m.status === 'rejected' || m.status === 'removed')

  return (
    <div className="space-y-6">
      {/* Pending */}
      <Section title="Pending Approval" count={pending.length} accentColor="amber">
        {pending.length === 0 ? (
          <p className="text-sm text-faint py-2">No pending requests</p>
        ) : pending.map(m => (
          <MemberRow key={m.id} member={m} onApprove={approve} onReject={reject} loading={actionLoading} />
        ))}
      </Section>

      {/* Active */}
      <Section title="Active Members" count={active.length} accentColor="green">
        {active.length === 0 ? (
          <p className="text-sm text-faint py-2">No active members yet. Approve pending requests or send invitations.</p>
        ) : active.map(m => (
          <MemberRow key={m.id} member={m} onRemove={remove} loading={actionLoading} />
        ))}
      </Section>

      {/* Rejected */}
      {rejected.length > 0 && (
        <Section title="Rejected / Removed" count={rejected.length} accentColor="gray" collapsible collapsed={!showRejected} onToggle={() => setShowRejected(p => !p)}>
          {rejected.map(m => <MemberRow key={m.id} member={m} loading={actionLoading} />)}
        </Section>
      )}
    </div>
  )
}

function Section({
  title, count, accentColor, children, collapsible = false, collapsed = false, onToggle,
}: {
  title: string; count: number; accentColor: string; children: React.ReactNode
  collapsible?: boolean; collapsed?: boolean; onToggle?: () => void
}) {
  const badge: Record<string, string> = {
    amber: 'bg-amber-100 text-amber-700',
    green: 'bg-green-100 text-green-700',
    gray: 'bg-subtle text-soft',
  }
  return (
    <div className="border border-line rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-4 py-3 bg-subtle border-b border-line ${collapsible ? 'cursor-pointer hover:bg-subtle' : 'cursor-default'}`}
        disabled={!collapsible}
      >
        <span className="font-semibold text-fg text-sm">{title}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge[accentColor] ?? badge.gray}`}>{count}</span>
      </button>
      {(!collapsible || !collapsed) && (
        <div className="px-4">{children}</div>
      )}
    </div>
  )
}

// ─── Tab: Invite ─────────────────────────────────────────────────────────────

function InviteTab({ id }: { id: string }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [sending, setSending] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [copied, setCopied] = useState(false)

  const loadInvitations = useCallback(async () => {
    try {
      const res = await fetch(`/api/organizations/${id}/invitations`, { credentials: 'include' })
      const json = await res.json()
      if (json.success) setInvitations(json.data ?? [])
    } catch { /* silent */ }
  }, [id])

  useEffect(() => { loadInvitations() }, [loadInvitations])

  async function send() {
    if (!email.trim()) { setError('Email is required'); return }
    setSending(true); setError(null); setToken(null)
    try {
      const res = await fetch(`/api/organizations/${id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), suggestedRole: role.trim() || undefined }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      setToken(json.data?.token ?? null)
      setEmail(''); setRole('')
      loadInvitations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation')
    } finally { setSending(false) }
  }

  const inviteLink = token ? `${typeof window !== 'undefined' ? window.location.origin : ''}/organization/join/${token}` : ''

  function copyLink() {
    if (!inviteLink) return
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-6">
      <div className="border border-line rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-fg">Send Invitation</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-soft mb-1">Email address <span className="text-red-500">*</span></label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="colleague@hospital.mu"
              className="w-full px-3 py-2.5 border border-line rounded-xl text-sm focus:ring-2 focus:ring-[#0C6780] focus:border-[#0C6780] outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-soft mb-1">Suggested role <span className="text-faint font-normal">(optional)</span></label>
            <input
              type="text"
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="e.g. Head Nurse, Cardiologist"
              className="w-full px-3 py-2.5 border border-line rounded-xl text-sm focus:ring-2 focus:ring-[#0C6780] focus:border-[#0C6780] outline-none"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <button
          onClick={send}
          disabled={sending}
          className="flex items-center gap-2 bg-[#0C6780] hover:bg-[#0a5568] text-white px-5 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60 transition-colors"
        >
          {sending ? <FaSpinner className="animate-spin" /> : <FaEnvelope />}
          {sending ? 'Sending…' : 'Send Invitation'}
        </button>
      </div>

      {token && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-green-800">Invitation created! Share this link:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-surface border border-green-200 rounded-lg px-3 py-2 text-green-900 break-all">{inviteLink}</code>
            <button
              onClick={copyLink}
              aria-label="Copy link"
              className="flex-shrink-0 w-9 h-9 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg flex items-center justify-center transition-colors"
            >
              {copied ? <FaCheck className="text-xs" /> : <FaCopy className="text-xs" />}
            </button>
          </div>
        </div>
      )}

      {invitations.length > 0 && (
        <div className="border border-line rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-subtle border-b border-line">
            <span className="font-semibold text-fg text-sm">Pending Invitations</span>
          </div>
          <div className="divide-y divide-line">
            {invitations.map(inv => (
              <div key={inv.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-fg">{inv.email}</p>
                  {inv.suggestedRole && <p className="text-xs text-soft">{inv.suggestedRole}</p>}
                </div>
                <p className="text-xs text-faint">{new Date(inv.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Settings ────────────────────────────────────────────────────────────

function SettingsTab() {
  return (
    <div className="space-y-6">
      <div className="border border-red-200 rounded-xl p-5 bg-red-50">
        <h3 className="font-semibold text-red-800 mb-1">Danger Zone</h3>
        <p className="text-sm text-red-600 mb-4">Irreversible and destructive actions</p>
        <div className="relative group inline-block">
          <button
            disabled
            title="Contact support to deactivate"
            className="px-5 py-2.5 bg-red-200 text-red-400 rounded-xl font-semibold text-sm cursor-not-allowed"
          >
            Deactivate Entity
          </button>
          <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap bg-gray-800 text-white text-xs rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Contact support to deactivate
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Inventory (pharmacy / health-shop only) ────────────────────────────

interface InvItem {
  id: string; name: string; category: string; price: number; quantity: number
  minStockAlert: number; requiresPrescription: boolean; inStock: boolean
}

const emptyInvForm = { name: '', category: 'medicines', price: '', quantity: '', minStockAlert: '5', requiresPrescription: false }

function InventoryTab({ id }: { id: string }) {
  const [items, setItems] = useState<InvItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...emptyInvForm })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/organizations/${id}/inventory`, { credentials: 'include' })
      const json = await res.json()
      if (json.success) setItems(json.data ?? [])
    } catch { /* silent */ } finally { setLoading(false) }
  }, [id])
  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditId(null); setForm({ ...emptyInvForm }); setErr(null); setShowForm(true) }
  const openEdit = (it: InvItem) => {
    setEditId(it.id)
    setForm({ name: it.name, category: it.category, price: String(it.price), quantity: String(it.quantity), minStockAlert: String(it.minStockAlert), requiresPrescription: it.requiresPrescription })
    setErr(null); setShowForm(true)
  }

  async function save() {
    if (!form.name.trim()) { setErr('Name is required'); return }
    setSaving(true); setErr(null)
    const body = {
      name: form.name.trim(), category: form.category,
      price: Number(form.price) || 0, quantity: Number(form.quantity) || 0,
      minStockAlert: Number(form.minStockAlert) || 5, requiresPrescription: form.requiresPrescription,
    }
    try {
      const url = editId ? `/api/organizations/${id}/inventory/${editId}` : `/api/organizations/${id}/inventory`
      const res = await fetch(url, {
        method: editId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Save failed')
      setShowForm(false); await load()
    } catch (e) { setErr(e instanceof Error ? e.message : 'Save failed') } finally { setSaving(false) }
  }

  async function del(itemId: string) {
    if (!confirm('Remove this item from the inventory?')) return
    try {
      const res = await fetch(`/api/organizations/${id}/inventory/${itemId}`, { method: 'DELETE', credentials: 'include' })
      const json = await res.json()
      if (json.success) await load()
    } catch { /* silent */ }
  }

  const catLabel = (k: string) => SHOP_CATEGORIES.find(c => c.key === k)?.label ?? k

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-fg">Inventory</h3>
          <p className="text-xs text-soft">Products this organisation sells on the Health Shop.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#0C6780] hover:bg-[#0a5568] text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors flex-shrink-0">
          <FaPlus className="text-xs" /> Add item
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-14 bg-subtle rounded-xl animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-line rounded-xl">
          <FaBoxOpen className="text-3xl text-faint mx-auto mb-2" />
          <p className="text-sm text-soft">No items yet.</p>
          <p className="text-xs text-faint mt-1">Add your first product to start selling.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(it => {
            const low = it.quantity <= it.minStockAlert
            return (
              <div key={it.id} className="flex items-center gap-3 p-3 rounded-xl border border-line">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold text-fg truncate">{it.name}</span>
                    {it.requiresPrescription && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 dark:bg-amber-500/15 dark:text-amber-300 px-1.5 py-0.5 rounded-full">
                        <FaPrescriptionBottleAlt className="text-[9px]" /> Rx
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-faint flex-wrap">
                    <span>{catLabel(it.category)}</span>
                    <span>·</span>
                    <span>Rs {it.price.toLocaleString()}</span>
                    <span>·</span>
                    <span className={low ? 'inline-flex items-center gap-1 text-red-600 font-medium' : ''}>
                      {low && <FaExclamationTriangle className="text-[9px]" />} {it.quantity} in stock
                    </span>
                  </div>
                </div>
                <button onClick={() => openEdit(it)} aria-label="Edit" className="w-8 h-8 rounded-full bg-subtle hover:bg-line text-soft flex items-center justify-center"><FaEdit className="text-xs" /></button>
                <button onClick={() => del(it.id)} aria-label="Remove" className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-500/15 hover:bg-red-100 text-red-600 flex items-center justify-center"><FaTrash className="text-xs" /></button>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-surface rounded-2xl border border-line shadow-xl w-full max-w-md p-5 space-y-3" onClick={e => e.stopPropagation()}>
            <h4 className="font-bold text-fg">{editId ? 'Edit item' : 'Add item'}</h4>
            {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</p>}
            <div>
              <label className="block text-xs font-medium text-soft mb-1">Name *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-line rounded-xl text-sm focus:ring-2 focus:ring-[#0C6780] outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-soft mb-1">Category</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2 border border-line rounded-xl text-sm bg-surface text-fg focus:ring-2 focus:ring-[#0C6780] outline-none">
                  {SHOP_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-soft mb-1">Price (Rs)</label>
                <input type="number" min="0" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} className="w-full px-3 py-2 border border-line rounded-xl text-sm focus:ring-2 focus:ring-[#0C6780] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-soft mb-1">Quantity</label>
                <input type="number" min="0" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} className="w-full px-3 py-2 border border-line rounded-xl text-sm focus:ring-2 focus:ring-[#0C6780] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-soft mb-1">Low-stock alert</label>
                <input type="number" min="0" value={form.minStockAlert} onChange={e => setForm(p => ({ ...p, minStockAlert: e.target.value }))} className="w-full px-3 py-2 border border-line rounded-xl text-sm focus:ring-2 focus:ring-[#0C6780] outline-none" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-soft">
              <input type="checkbox" checked={form.requiresPrescription} onChange={e => setForm(p => ({ ...p, requiresPrescription: e.target.checked }))} />
              Requires prescription
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-soft hover:bg-subtle">Cancel</button>
              <button onClick={save} disabled={saving} className="flex items-center gap-2 bg-[#0C6780] hover:bg-[#0a5568] text-white px-5 py-2 rounded-xl font-semibold text-sm disabled:opacity-60">
                {saving ? <FaSpinner className="animate-spin" /> : <FaCheck />} {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

const BASE_TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <FaBuilding /> },
  { id: 'members', label: 'Members', icon: <FaUsers /> },
  { id: 'invite', label: 'Invite', icon: <FaEnvelope /> },
  { id: 'settings', label: 'Settings', icon: <FaCog /> },
]

export default function ManageOrganizationPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [entity, setEntity] = useState<EntityDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/organizations/${id}`, { credentials: 'include' })
        const json = await res.json()
        if (!json.success) { setForbidden(true); return }

        const data: EntityDetail = json.data
        const currentUserId = getCookie('mediwyz_user_id')

        if (data.founderUserId && currentUserId && data.founderUserId !== currentUserId) {
          setForbidden(true)
          return
        }
        setEntity(data)
      } catch {
        setForbidden(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="text-[#0C6780] text-3xl animate-spin" />
      </div>
    )
  }

  if (forbidden || !entity) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <FaUserCircle className="text-5xl text-faint mx-auto mb-4" />
          <h2 className="text-xl font-bold text-fg mb-2">Access Denied</h2>
          <p className="text-soft mb-6">You don&apos;t have permission to manage this organization.</p>
          <button
            onClick={() => router.back()}
            className="px-5 py-2.5 bg-[#0C6780] text-white rounded-xl font-semibold text-sm hover:bg-[#0a5568] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // Pharmacies/health-shops get an Inventory tab (inserted before Settings).
  const tabs = isInventoryOrg(entity.type)
    ? [
        ...BASE_TABS.slice(0, 3),
        { id: 'inventory' as TabId, label: 'Inventory', icon: <FaBoxOpen /> },
        ...BASE_TABS.slice(3),
      ]
    : BASE_TABS

  return (
    <div className="min-h-screen bg-subtle">
      {/* Header */}
      <div className="bg-[#001E40] text-white px-4 sm:px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              {entity.logoUrl ? (
                <Image src={entity.logoUrl} alt={entity.name} width={48} height={48} unoptimized className="rounded-xl object-cover" />
              ) : (
                <span className="text-white font-bold text-lg">
                  {entity.name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold">{entity.name}</h1>
              <p className="text-white/60 text-sm">{entity.type} · Manage</p>
            </div>
            {entity.isVerified && (
              <span className="ml-auto text-xs font-bold bg-[#0C6780] text-white px-3 py-1 rounded-full">
                Verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-surface border-b border-line sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-8">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0
                  ${activeTab === tab.id
                    ? 'border-[#0C6780] text-[#0C6780]'
                    : 'border-transparent text-soft hover:text-soft'
                  }`}
              >
                <span className="text-xs">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6">
        <div className="bg-surface rounded-2xl border border-line p-5 sm:p-7">
          {activeTab === 'overview' && <OverviewTab entity={entity} id={id} />}
          {activeTab === 'members' && <MembersTab id={id} />}
          {activeTab === 'invite' && <InviteTab id={id} />}
          {activeTab === 'inventory' && <InventoryTab id={id} />}
          {activeTab === 'settings' && <SettingsTab />}
        </div>
      </div>
    </div>
  )
}
