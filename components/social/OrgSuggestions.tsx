'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FaHospital, FaCheckCircle, FaArrowRight } from 'react-icons/fa'

interface SuggestedOrg {
  id: string
  name: string
  type: string
  city: string | null
  logoUrl: string | null
  isVerified: boolean
  providerCount?: number
}

/** Right-rail panel listing organisations (clinics, hospitals, labs, insurers)
 *  to discover — companion to UserSuggestions ("People You May Know"). */
export default function OrgSuggestions({ maxResults = 6 }: { maxResults?: number }) {
  const [orgs, setOrgs] = useState<SuggestedOrg[]>([])

  useEffect(() => {
    fetch(`/api/organizations?limit=${maxResults}`, { credentials: 'include' })
      .then(r => r.json())
      .then(j => { if (j.success) setOrgs((j.data?.entities ?? j.data ?? []) as SuggestedOrg[]) })
      .catch(() => {})
  }, [maxResults])

  if (orgs.length === 0) return null

  return (
    <aside className="bg-surface rounded-2xl border border-line overflow-hidden">
      <div className="px-4 py-3 border-b border-line flex items-center gap-2">
        <FaHospital className="text-[#0C6780] dark:text-accent text-sm" />
        <h2 className="text-sm font-bold text-fg">Organisations to discover</h2>
      </div>
      <div className="p-3 flex flex-col gap-1">
        {orgs.map(o => (
          <Link
            key={o.id}
            href={`/search/organizations/${o.id}`}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-subtle transition-colors"
          >
            {o.logoUrl ? (
              <Image src={o.logoUrl} alt="" width={32} height={32} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[#0C6780]/10 dark:bg-accent/15 text-[#0C6780] dark:text-accent flex items-center justify-center text-xs font-bold flex-shrink-0">
                {o.name.split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-fg truncate flex items-center gap-1">
                {o.name}
                {o.isVerified && <FaCheckCircle className="text-[#0C6780] dark:text-accent text-[8px] flex-shrink-0" />}
              </p>
              <p className="text-[10px] text-faint truncate capitalize">
                {o.type.replace(/_/g, ' ')}{o.city ? ` · ${o.city}` : ''}{o.providerCount ? ` · ${o.providerCount} provider${o.providerCount !== 1 ? 's' : ''}` : ''}
              </p>
            </div>
            <FaArrowRight className="text-[10px] text-faint flex-shrink-0" />
          </Link>
        ))}
      </div>
      <div className="p-3 border-t border-line">
        <Link
          href="/search/organizations"
          className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-[#0C6780]/5 dark:bg-accent/10 text-[#0C6780] dark:text-accent text-xs font-semibold rounded-xl hover:bg-[#0C6780]/10 dark:hover:bg-accent/15 transition-colors border border-[#0C6780]/20 dark:border-accent/20"
        >
          <FaHospital className="text-[10px]" /> Browse all organisations
        </Link>
      </div>
    </aside>
  )
}
