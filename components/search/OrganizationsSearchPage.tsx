'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { FaSearch, FaMapMarkerAlt, FaPhone, FaGlobe, FaBriefcaseMedical, FaHospital, FaFlask, FaTooth, FaEye, FaHeart } from 'react-icons/fa'
import { MdVerified } from 'react-icons/md'

// ── Types ─────────────────────────────────────────────────────────────────────

interface SampleProvider {
  id: string
  name: string
  userType: string
  profileImage: string | null
  role: string | null
}

interface OrgEntity {
  id: string
  name: string
  type: string
  description: string | null
  address: string | null
  city: string | null
  country: string
  phone: string | null
  email: string | null
  website: string | null
  logoUrl: string | null
  isVerified: boolean
  providerCount: number
  sampleProviders: SampleProvider[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ENTITY_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'clinic', label: 'Clinic' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'laboratory', label: 'Lab' },
  { value: 'dental_clinic', label: 'Dental' },
  { value: 'optical_center', label: 'Optical' },
  { value: 'wellness_center', label: 'Wellness' },
  { value: 'other', label: 'Other' },
]

 
const TYPE_ICONS: Record<string, React.ComponentType<any>> = {
  clinic: FaBriefcaseMedical,
  hospital: FaHospital,
  laboratory: FaFlask,
  dental_clinic: FaTooth,
  optical_center: FaEye,
  wellness_center: FaHeart,
  other: FaBriefcaseMedical,
}

const TYPE_COLORS: Record<string, string> = {
  clinic: '#0C6780',
  hospital: '#E53E3E',
  laboratory: '#805AD5',
  dental_clinic: '#3182CE',
  optical_center: '#38A169',
  wellness_center: '#DD6B20',
  other: '#718096',
}

function EntityTypeIcon({ type, className, color }: { type: string; className?: string; color?: string }) {
  const Icon = TYPE_ICONS[type] ?? FaBriefcaseMedical
  return <Icon className={className} style={color ? { color } : undefined} />
}

// ── EntityCard ────────────────────────────────────────────────────────────────

function EntityCard({ entity }: { entity: OrgEntity }) {
  const color = TYPE_COLORS[entity.type] ?? '#0C6780'
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Top color bar */}
      <div className="h-1.5" style={{ background: color }} />

      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
            {entity.logoUrl ? (
              <Image src={entity.logoUrl} alt={entity.name} width={40} height={40} className="rounded-lg object-cover" />
            ) : (
              <EntityTypeIcon type={entity.type} className="text-xl" color={color} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-[#001E40] text-sm sm:text-base leading-snug">{entity.name}</h3>
              {entity.isVerified && <MdVerified className="text-[#0C6780] flex-shrink-0" size={16} title="Verified" />}
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full capitalize" style={{ background: `${color}18`, color }}>
              {entity.type.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Description */}
        {entity.description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{entity.description}</p>
        )}

        {/* Meta */}
        <div className="space-y-1 mb-3">
          {entity.address && (
            <div className="flex items-start gap-1.5 text-xs text-gray-500">
              <FaMapMarkerAlt className="flex-shrink-0 mt-0.5 text-gray-400" size={11} />
              <span>{entity.address}{entity.city ? `, ${entity.city}` : ''}</span>
            </div>
          )}
          {entity.phone && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <FaPhone className="flex-shrink-0 text-gray-400" size={10} />
              <span>{entity.phone}</span>
            </div>
          )}
          {entity.website && (
            <div className="flex items-center gap-1.5 text-xs text-[#0C6780]">
              <FaGlobe className="flex-shrink-0 text-gray-400" size={10} />
              <a href={entity.website} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">{entity.website.replace(/^https?:\/\//, '')}</a>
            </div>
          )}
        </div>

        {/* Providers preview */}
        {entity.sampleProviders.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex -space-x-2">
              {entity.sampleProviders.slice(0, 3).map(p => (
                <div key={p.id} className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center overflow-hidden flex-shrink-0">
                  {p.profileImage ? (
                    <Image src={p.profileImage} alt={p.name} width={28} height={28} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-gray-500">{p.name.charAt(0)}</span>
                  )}
                </div>
              ))}
            </div>
            <span className="text-xs text-gray-500">
              {entity.providerCount} provider{entity.providerCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* CTA */}
        <Link
          href={`/search/organizations/${entity.id}`}
          className="block w-full text-center py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: color }}
        >
          View Organization
        </Link>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function OrganizationsSearchPage() {
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [selectedType, setSelectedType] = useState(searchParams.get('type') ?? '')
  const [entities, setEntities] = useState<OrgEntity[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchOrganizations = useCallback(async (q: string, type: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (type) params.set('type', type)
      params.set('limit', '24')
      const res = await fetch(`/api/search/organizations?${params}`)
      const json = await res.json()
      if (json.success) {
        setEntities(json.data ?? [])
        setTotal(json.total ?? 0)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrganizations(query, selectedType)
  }, [fetchOrganizations, query, selectedType])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    fetchOrganizations(query, selectedType)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero / search bar */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🏥</span>
            <h1 className="text-2xl font-bold text-[#001E40]">Find an Organization</h1>
          </div>
          <p className="text-sm text-gray-500 mb-5">Hospitals, clinics, labs, dental practices, and wellness centers near you</p>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by name, city, or service..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0C6780]/30"
              />
            </div>
            <button type="submit" className="px-5 py-2.5 bg-[#0C6780] text-white rounded-lg text-sm font-medium hover:bg-[#0a5a6f] transition-colors">
              Search
            </button>
          </form>

          {/* Type filter chips */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            {ENTITY_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setSelectedType(t.value)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  selectedType === t.value
                    ? 'bg-[#0C6780] text-white border-[#0C6780]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#0C6780]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {!loading && entities.length > 0 && (
          <p className="text-sm text-gray-500 mb-4">{total} result{total !== 1 ? 's' : ''}</p>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 h-64 animate-pulse" />
            ))}
          </div>
        ) : entities.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl block mb-3">🏥</span>
            <h3 className="font-bold text-[#001E40] text-lg mb-1">No organizations found</h3>
            <p className="text-gray-500 text-sm">
              {query || selectedType
                ? 'Try a different search term or filter.'
                : 'No healthcare entities have been registered yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {entities.map(entity => (
              <EntityCard key={entity.id} entity={entity} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
