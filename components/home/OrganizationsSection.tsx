'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FaSearch, FaMapMarkerAlt, FaHospital, FaBriefcaseMedical, FaFlask, FaTooth, FaEye, FaHeart, FaCalendarAlt } from 'react-icons/fa'
import { MdVerified } from 'react-icons/md'
import { useBookingDrawer } from '@/lib/contexts/booking-drawer-context'

interface OrgEntity {
  id: string
  name: string
  type: string
  description: string | null
  address: string | null
  city: string | null
  country: string
  phone: string | null
  logoUrl: string | null
  isVerified: boolean
  providerCount: number
  sampleProviders: { id: string; name: string; profileImage: string | null }[]
}

const TYPE_COLORS: Record<string, string> = {
  clinic: '#0C6780',
  hospital: '#C53030',
  laboratory: '#805AD5',
  dental_clinic: '#3182CE',
  optical_center: '#38A169',
  wellness_center: '#DD6B20',
  other: '#718096',
}

 
const TYPE_ICONS: Record<string, React.ComponentType<any>> = {
  clinic: FaBriefcaseMedical,
  hospital: FaHospital,
  laboratory: FaFlask,
  dental_clinic: FaTooth,
  optical_center: FaEye,
  wellness_center: FaHeart,
  other: FaBriefcaseMedical,
}

function OrgCard({ entity }: { entity: OrgEntity }) {
  const { openDrawer } = useBookingDrawer()
  const color = TYPE_COLORS[entity.type] ?? '#0C6780'
  const Icon = TYPE_ICONS[entity.type] ?? FaBriefcaseMedical

  function handleBook(e: React.MouseEvent) {
    e.preventDefault()
    openDrawer({ organization: { id: entity.id, name: entity.name, type: entity.type, logoUrl: entity.logoUrl } })
  }

  return (
    <div className="w-full bg-surface rounded-2xl border border-line shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 overflow-hidden">
      <div className="h-1" style={{ background: color }} />
      <div className="p-4">
        <Link href={`/search/organizations/${entity.id}`} className="block">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
              {entity.logoUrl ? (
                <Image src={entity.logoUrl} alt={entity.name} width={32} height={32} className="rounded-lg object-cover" unoptimized />
              ) : (
                <Icon style={{ color }} className="text-lg" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-xs font-bold text-fg leading-tight line-clamp-2">{entity.name}</p>
                {entity.isVerified && <MdVerified className="text-[#0C6780] flex-shrink-0" size={13} />}
              </div>
              <span className="text-[10px] font-medium capitalize" style={{ color }}>{entity.type.replace('_', ' ')}</span>
            </div>
          </div>

          {entity.address && (
            <div className="flex items-start gap-1 mb-2">
              <FaMapMarkerAlt className="flex-shrink-0 mt-0.5 text-faint" size={9} />
              <p className="text-[10px] text-faint line-clamp-1">{entity.city ?? entity.address}</p>
            </div>
          )}

          {entity.sampleProviders.length > 0 && (
            <div className="flex items-center gap-1.5 mb-3">
              <div className="flex -space-x-1.5">
                {entity.sampleProviders.slice(0, 3).map(p => (
                  <div key={p.id} className="w-5 h-5 rounded-full bg-subtle border border-white flex items-center justify-center overflow-hidden">
                    {p.profileImage ? (
                      <Image src={p.profileImage} alt={p.name} width={20} height={20} className="w-full h-full object-cover" unoptimized />
                    ) : (
                      <span className="text-[8px] font-bold text-faint">{p.name.charAt(0)}</span>
                    )}
                  </div>
                ))}
              </div>
              <span className="text-[10px] text-faint">{entity.providerCount} provider{entity.providerCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </Link>

        {/* Book CTA */}
        <button
          onClick={handleBook}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: color }}
        >
          <FaCalendarAlt size={9} /> Book Here
        </button>
      </div>
    </div>
  )
}

const TYPE_FILTERS = [
  { key: '',               label: 'All' },
  { key: 'hospital',       label: 'Hospitals' },
  { key: 'clinic',         label: 'Clinics' },
  { key: 'laboratory',     label: 'Labs' },
  { key: 'dental_clinic',  label: 'Dental' },
  { key: 'optical_center', label: 'Optical' },
  { key: 'wellness_center',label: 'Wellness' },
]

export default function OrganizationsSection() {
  const [query, setQuery]   = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [entities, setEntities] = useState<OrgEntity[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '50' })
    if (query)      params.set('q', query)
    if (typeFilter) params.set('type', typeFilter)
    fetch(`/api/search/organizations?${params}`)
      .then(r => r.json())
      .then(j => { if (j.success) setEntities(j.data ?? []) })
      .finally(() => setLoading(false))
  }, [query, typeFilter])

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl"></span>
          <h3 className="font-bold text-fg text-lg">Find an Organization</h3>
        </div>
        <Link href="/search/organizations" className="text-xs text-[#0C6780] font-medium hover:underline">See All </Link>
      </div>

      {/* Search + type filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" size={13} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or city..."
            className="w-full pl-9 pr-4 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C53030]/20"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {TYPE_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setTypeFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                typeFilter === f.key
                  ? 'bg-[#C53030] text-white border-[#C53030]'
                  : 'bg-surface text-soft border-line hover:border-[#C53030]/40 hover:text-[#C53030]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards - responsive grid, full width */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-40 bg-subtle animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : entities.length === 0 ? (
        <div className="text-center py-10">
          <span className="text-4xl block mb-2"></span>
          <p className="text-sm text-soft">
            {query ? `No organizations matching "${query}"` : 'No organizations registered yet.'}
          </p>
          <Link href="/search/organizations" className="mt-3 inline-block text-[#C53030] text-sm font-medium hover:underline">
            Browse all 
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {entities.map(entity => (
            <OrgCard key={entity.id} entity={entity} />
          ))}
        </div>
      )}
    </div>
  )
}
