'use client'

/**
 * CompanyMembershipsList - companies the signed-in user belongs to as an
 * EMPLOYEE/member (distinct from companies they own, and from healthcare
 * organisations). Backed by GET /api/corporate/my-companies.
 *
 * Renders nothing if the user isn't a member of any company, so it can be
 * dropped onto the My Company page unconditionally.
 */

import { useEffect, useState } from 'react'
import { FaBuilding, FaIndustry, FaUserTie } from 'react-icons/fa'

interface Membership {
  id: string
  corporateAdminId: string
  companyName: string
  industry: string | null
  adminName: string
  joinedAt?: string | null
}

export default function CompanyMembershipsList() {
  const [items, setItems] = useState<Membership[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/corporate/my-companies', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (j?.success && Array.isArray(j.data)) setItems(j.data) })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  if (!loaded || items.length === 0) return null

  return (
    <div className="bg-surface rounded-2xl border border-line shadow-sm p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <FaUserTie className="text-[#0C6780] dark:text-accent" />
        <h2 className="text-lg font-bold text-fg">Companies you belong to</h2>
        <span className="text-xs text-faint">({items.length})</span>
      </div>
      <div className="space-y-2.5">
        {items.map(m => (
          <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-line hover:bg-subtle transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#0C6780]/10 dark:bg-accent/15 flex items-center justify-center text-[#0C6780] dark:text-accent flex-shrink-0">
              <FaBuilding />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-fg truncate">{m.companyName}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-faint">
                {m.industry && <span className="inline-flex items-center gap-1"><FaIndustry className="text-[10px]" /> {m.industry}</span>}
                <span>Admin: {m.adminName}</span>
              </div>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-subtle text-soft flex-shrink-0">Member</span>
          </div>
        ))}
      </div>
    </div>
  )
}
