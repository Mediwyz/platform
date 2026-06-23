'use client'

/**
 * MyOrganisationsList  a clean, at-a-glance list of every organisation the
 * signed-in user belongs to (as owner or member), each showing its CATEGORY
 * (pharmacy, clinic, hospital, lab, insurance), the user's role, member count
 * and location, plus quick "Members" / "Invite" actions for owned orgs.
 *
 * This is the "who am I part of" view. Creating/joining new organisations lives
 * in MyOrganisationsOverview (the category grid) below it.
 */

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  FaCrown, FaUserFriends, FaMapMarkerAlt, FaCheckCircle, FaUserPlus, FaBuilding, FaSpinner,
} from 'react-icons/fa'

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

interface Category { key: string; label: string }

export default function MyOrganisationsList() {
  const [owned, setOwned] = useState<Org[]>([])
  const [member, setMember] = useState<Org[]>([])
  const [labels, setLabels] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [mineRes, catRes] = await Promise.all([
        fetch('/api/organizations/mine', { credentials: 'include' }),
        fetch('/api/org-categories', { credentials: 'include' }),
      ])
      const mine = await mineRes.json().catch(() => null)
      const cats = await catRes.json().catch(() => null)
      if (mine?.success) {
        setOwned(mine.data.owned ?? [])
        setMember(mine.data.member ?? [])
      }
      if (cats?.success && Array.isArray(cats.data)) {
        const map: Record<string, string> = {}
        for (const c of cats.data as Category[]) map[c.key] = c.label
        setLabels(map)
      }
    } catch { /* leave empty */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const categoryLabel = (type: string) =>
    labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  const all = [...owned, ...member]

  return (
    <div className="bg-surface rounded-2xl border border-line shadow-sm p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <FaBuilding className="text-[#0C6780] dark:text-accent" />
        <h2 className="text-lg font-bold text-fg">Your organisations</h2>
        {!loading && <span className="text-xs text-faint">({all.length})</span>}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-faint"><FaSpinner className="animate-spin" /></div>
      ) : all.length === 0 ? (
        <div className="text-center py-8">
          <FaBuilding className="text-3xl text-faint mx-auto mb-2" />
          <p className="text-sm text-soft">You&apos;re not part of any organisation yet.</p>
          <p className="text-xs text-faint mt-1">Create or join one from the categories below.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {all.map(org => (
            <div key={org.id} className="flex items-center gap-3 p-3 rounded-xl border border-line hover:bg-subtle transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#0C6780]/10 dark:bg-accent/15 flex items-center justify-center text-[#0C6780] dark:text-accent font-bold flex-shrink-0">
                {org.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-semibold text-fg truncate">{org.name}</span>
                  {org.isVerified && <FaCheckCircle className="text-[#0C6780] dark:text-accent text-xs" title="Verified" />}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-faint">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#0C6780]/10 dark:bg-accent/15 text-[#0C6780] dark:text-accent font-medium">
                    {categoryLabel(org.type)}
                  </span>
                  {org.city && <span className="inline-flex items-center gap-1"><FaMapMarkerAlt className="text-[10px]" /> {org.city}</span>}
                  {typeof org.memberCount === 'number' && (
                    <span className="inline-flex items-center gap-1"><FaUserFriends className="text-[10px]" /> {org.memberCount}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  org.isOwner ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300' : 'bg-subtle text-soft'
                }`}>
                  {org.isOwner ? <><FaCrown className="text-[9px]" /> Owner</> : (org.role || 'Member')}
                </span>
                <Link
                  href={`/organization/${org.id}/manage`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0C6780] dark:text-accent hover:underline whitespace-nowrap"
                >
                  {org.isOwner ? <><FaUserPlus className="text-[10px]" /> Members</> : 'View'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
