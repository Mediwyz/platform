'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FaHospital, FaCheckCircle, FaArrowRight } from 'react-icons/fa'

interface Org { id: string; name: string; type: string; city: string | null; logoUrl: string | null; isVerified: boolean; providerCount: number }

/** Right-rail card: organisations that have providers matching the current search. */
export default function SearchOrgPanel({ type, query, serviceId }: { type: string; query?: string; serviceId?: string }) {
  const [orgs, setOrgs] = useState<Org[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const qs = new URLSearchParams()
    if (type) qs.set('type', type)
    if (query) qs.set('q', query)
    if (serviceId) qs.set('serviceId', serviceId)
    fetch(`/api/search/organisations?${qs.toString()}`, { credentials: 'include' })
      .then(r => r.json())
      .then(j => { if (!cancelled && j.success) setOrgs(j.data || []) })
      .catch(() => { if (!cancelled) setOrgs([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [type, query, serviceId])

  if (loading || orgs.length === 0) return null

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <h3 className="text-sm font-bold text-fg mb-1 flex items-center gap-2"><FaHospital className="text-[#0C6780]" /> Organisations</h3>
      <p className="text-xs text-soft mb-3">Clinics, hospitals & labs with a matching provider — book directly.</p>
      <ul className="space-y-2">
        {orgs.slice(0, 8).map(o => (
          <li key={o.id}>
            <Link href={`/organization/${o.id}/book`} className="group flex items-center gap-3 rounded-xl border border-line hover:border-[#0C6780]/50 px-3 py-2 transition">
              <span className="w-9 h-9 rounded-lg bg-[#0C6780]/10 text-[#0C6780] flex items-center justify-center text-xs font-bold flex-shrink-0">
                {o.name.split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-fg truncate">{o.name}</span>
                  {o.isVerified && <FaCheckCircle className="text-[#0C6780] text-[11px] flex-shrink-0" title="Verified" />}
                </span>
                <span className="block text-[11px] text-faint capitalize truncate">
                  {o.type.replace(/_/g, ' ')}{o.city ? ` · ${o.city}` : ''} · {o.providerCount} provider{o.providerCount !== 1 ? 's' : ''}
                </span>
              </span>
              <FaArrowRight className="text-[10px] text-faint group-hover:text-[#0C6780] flex-shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
