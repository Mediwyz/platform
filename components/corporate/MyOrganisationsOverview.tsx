'use client'

/**
 * MyOrganisationsOverview  the multi-organisation summary at the top of the
 * "My Company" page. Shows every healthcare entity the user founded or is a
 * member of, grouped by category (clinics, hospitals, labs, pharmacies,
 * self-employed practice). Each category shows the org names (or "0  none
 * yet"), a Create button, and a per-owned-org member invite.
 *
 * Insurance / employer companies live in the corporate subsystem and are
 * managed by the section below this component on the same page.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  FaHospital, FaBriefcaseMedical, FaFlask, FaPills, FaUserMd,
  FaPlus, FaUserPlus, FaCrown, FaSpinner, FaTimes,
  FaBuilding, FaClinicMedical, FaPrescriptionBottleAlt, FaShieldAlt, FaTooth, FaEye, FaSpa,
} from 'react-icons/fa'
import type { IconType } from 'react-icons'

// Map stored FA icon names -> components (for admin-managed categories).
const ICON_MAP: Record<string, IconType> = {
  FaHospital, FaBriefcaseMedical, FaFlask, FaPills, FaUserMd, FaBuilding,
  FaClinicMedical, FaPrescriptionBottleAlt, FaShieldAlt, FaTooth, FaEye, FaSpa,
}

interface Org {
  id: string
  name: string
  type: string
  city: string | null
  isVerified: boolean
  isOwner: boolean
  memberCount?: number
  role?: string | null
}

interface MineResponse {
  owned: Org[]
  member: Org[]
}

type Category = { type: string; label: string; blurb: string; Icon: IconType }

// The org categories surfaced as rows. `type` is the HealthcareEntity.type
// string sent to POST /api/organizations. The live list is loaded from the
// admin-managed /api/org-categories endpoint; this is the fallback used until
// it resolves (or if the fetch fails).
const FALLBACK_CATEGORIES: Category[] = [
  { type: 'clinic',        label: 'Clinics',        blurb: 'Private practices & medical centres', Icon: FaBriefcaseMedical },
  { type: 'hospital',      label: 'Hospitals',      blurb: 'Multi-department hospitals',           Icon: FaHospital },
  { type: 'laboratory',    label: 'Labs',           blurb: 'Diagnostic & pathology labs',          Icon: FaFlask },
  { type: 'pharmacy',      label: 'Pharmacies',     blurb: 'Dispensaries & pharmacy chains',       Icon: FaPills },
  { type: 'self_employed', label: 'Self-employed',  blurb: 'Your solo practice / workplace',       Icon: FaUserMd },
]

const TEAL = '#0C6780'

export default function MyOrganisationsOverview() {
  const [data, setData] = useState<MineResponse>({ owned: [], member: [] })
  const [loading, setLoading] = useState(true)
  const [creatingType, setCreatingType] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)
  const [inviteFor, setInviteFor] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES)

  // Load the admin-managed organisation categories so this grid stays in sync
  // with the regional admin's CRUD. Falls back to FALLBACK_CATEGORIES on error.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/org-categories', { credentials: 'include' })
        const json = await res.json()
        if (!cancelled && json.success && Array.isArray(json.data) && json.data.length) {
          setCategories(json.data.map((c: { key: string; label: string; blurb?: string | null; icon?: string }) => ({
            type: c.key,
            label: c.label,
            blurb: c.blurb || '',
            Icon: ICON_MAP[c.icon || 'FaBuilding'] || FaBuilding,
          })))
        }
      } catch { /* keep fallback */ }
    })()
    return () => { cancelled = true }
  }, [])

  const fetchMine = useCallback(async () => {
    try {
      const res = await fetch('/api/organizations/mine', { credentials: 'include' })
      const json = await res.json()
      if (json.success) setData({ owned: json.data.owned ?? [], member: json.data.member ?? [] })
    } catch {
      /* leave empty  each category still renders its create CTA */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMine() }, [fetchMine])

  const allOrgs = [...data.owned, ...data.member]
  const orgsByType = (type: string) => allOrgs.filter(o => o.type === type)

  const handleCreate = async (type: string) => {
    if (!newName.trim()) { setMessage({ type: 'error', text: 'Please enter a name.' }); return }
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName.trim(), type }),
      })
      const json = await res.json()
      if (json.success) {
        setMessage({ type: 'success', text: `${newName.trim()} created.` })
        setNewName('')
        setCreatingType(null)
        await fetchMine()
      } else {
        setMessage({ type: 'error', text: json.message || 'Could not create organisation.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setBusy(false)
    }
  }

  const handleInvite = async (orgId: string) => {
    if (!inviteEmail.trim()) return
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/organizations/${orgId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })
      const json = await res.json()
      if (json.success) {
        setMessage({ type: 'success', text: `Invitation sent to ${inviteEmail.trim()}.` })
        setInviteEmail('')
        setInviteFor(null)
      } else {
        setMessage({ type: 'error', text: json.message || 'Could not send invitation.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-surface rounded-2xl border border-line shadow-sm p-6 mb-8 animate-pulse">
        <div className="h-6 bg-line rounded w-56 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-subtle rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-2xl border border-line shadow-sm p-6 mb-8">
      <div className="mb-1 flex items-center gap-2">
        <FaHospital className="text-[#0C6780]" />
        <h2 className="text-lg font-bold text-fg">My Organisations</h2>
      </div>
      <p className="text-sm text-soft mb-5">
        Clinics, hospitals, labs and practices you own or belong to. Create one and invite colleagues by email.
      </p>

      {message && (
        <div className={`p-3 rounded-xl mb-4 flex items-center justify-between text-sm ${
          message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="opacity-60 hover:opacity-100"><FaTimes /></button>
        </div>
      )}

      <div className="space-y-3">
        {categories.map(cat => {
          const orgs = orgsByType(cat.type)
          const Icon = cat.Icon
          return (
            <div key={cat.type} className="border border-line rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${TEAL}1A`, color: TEAL }}>
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-fg">{cat.label}</h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${orgs.length ? 'bg-[#0C6780]/10 text-[#0C6780]' : 'bg-subtle text-faint'}`}>
                        {orgs.length}
                      </span>
                    </div>
                    <p className="text-xs text-faint">{cat.blurb}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setCreatingType(creatingType === cat.type ? null : cat.type); setNewName(''); setMessage(null) }}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0C6780] border border-[#0C6780]/30 rounded-lg px-2.5 py-1.5 hover:bg-[#0C6780]/5 transition"
                >
                  <FaPlus size={10} /> Create
                </button>
              </div>

              {/* Org list  or empty state */}
              {orgs.length === 0 ? (
                <p className="text-xs text-faint mt-3 pl-13">None yet  create your first {cat.label.toLowerCase().replace(/s$/, '')} above.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {orgs.map(o => (
                    <li key={o.id} className="flex items-center justify-between gap-2 bg-subtle rounded-lg px-3 py-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-sm text-fg truncate">{o.name}</span>
                          {o.isOwner
                            ? <span title="You own this" className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600"><FaCrown size={9} /> Owner</span>
                            : <span className="text-[10px] font-medium text-soft">{o.role || 'Member'}</span>}
                        </div>
                        <p className="text-[11px] text-faint">
                          {o.city ? `${o.city}  ` : ''}{o.isOwner ? `${o.memberCount ?? 0} member${(o.memberCount ?? 0) !== 1 ? 's' : ''}` : 'You are a member'}
                        </p>
                      </div>
                      {o.isOwner && (
                        <button
                          onClick={() => { setInviteFor(inviteFor === o.id ? null : o.id); setInviteEmail(''); setMessage(null) }}
                          className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-soft hover:text-[#0C6780] transition"
                        >
                          <FaUserPlus size={11} /> Invite
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {/* Inline create form */}
              {creatingType === cat.type && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreate(cat.type)}
                    placeholder={`${cat.label.replace(/s$/, '')} name`}
                    className="flex-1 px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-[#0C6780] focus:border-transparent outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => handleCreate(cat.type)}
                    disabled={busy || !newName.trim()}
                    className="px-4 py-2 bg-[#0C6780] text-white text-sm font-medium rounded-lg hover:bg-[#0a5568] disabled:opacity-50 transition inline-flex items-center gap-1.5"
                  >
                    {busy ? <FaSpinner className="animate-spin" size={12} /> : <FaPlus size={11} />} Create
                  </button>
                </div>
              )}

              {/* Inline invite form */}
              {orgs.some(o => o.id === inviteFor) && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && inviteFor && handleInvite(inviteFor)}
                    placeholder="colleague@email.com"
                    className="flex-1 px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-[#0C6780] focus:border-transparent outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => inviteFor && handleInvite(inviteFor)}
                    disabled={busy || !inviteEmail.trim()}
                    className="px-4 py-2 bg-[#0C6780] text-white text-sm font-medium rounded-lg hover:bg-[#0a5568] disabled:opacity-50 transition inline-flex items-center gap-1.5"
                  >
                    {busy ? <FaSpinner className="animate-spin" size={12} /> : <FaUserPlus size={11} />} Send invite
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
