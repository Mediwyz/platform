'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { FaSearch, FaConciergeBell, FaClock, FaArrowRight, FaUsers } from 'react-icons/fa'
import ServiceIcon from '@/components/shared/ServiceIcon'

interface ServiceItem {
  id: string
  serviceName: string
  category: string
  description: string | null
  providerType: string
  defaultPrice: number
  currency: string
  duration: number | null
  providerCount: number
  imageUrl?: string | null
  iconKey?: string | null
  sampleProviders: { id: string; name: string; profileImage: string | null; price: number }[]
}

interface RoleData {
  code: string
  label: string
  slug: string
  color: string
}

const PROVIDER_EMOJI: Record<string, string> = {
  DOCTOR: '🩺', NURSE: '💉', NANNY: '🧸', PHARMACIST: '💊',
  LAB_TECHNICIAN: '🧪', EMERGENCY_WORKER: '🚑', CAREGIVER: '🤝',
  PHYSIOTHERAPIST: '🏃', DENTIST: '🦷', OPTOMETRIST: '👁️',
  NUTRITIONIST: '🥗',
}

const CATEGORY_EMOJI: Record<string, string> = {
  consultation: '🩺', 'home visit': '🏠', 'video consultation': '📹',
  prescription: '💊', 'lab test': '🧪', vaccination: '💉',
  emergency: '🚑', childcare: '🧸', nursing: '💉',
  pharmacy: '💊', dental: '🦷', eye: '👁️', optical: '👁️',
  physiotherapy: '🏃', nutrition: '🥗', caregiver: '🤝', custom: '⚕️',
}

function resolveCategoryEmoji(category: string, providerType: string): string {
  const lower = category.toLowerCase()
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (lower.includes(key)) return emoji
  }
  return PROVIDER_EMOJI[providerType] ?? '⚕️'
}

function hex2rgba(hex: string, alpha = 0.12) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export default function ServicesSearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [services, setServices] = useState<ServiceItem[]>([])
  const [roles, setRoles] = useState<RoleData[]>([])
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') ?? '')
  const [activeRole, setActiveRole] = useState(searchParams?.get('type') ?? 'ALL')
  const [activeCategory, setActiveCategory] = useState(searchParams?.get('category') ?? 'ALL')

  useEffect(() => {
    Promise.all([
      fetch('/api/search/services?limit=200').then(r => r.json()),
      fetch('/api/roles?searchEnabled=true').then(r => r.json()),
    ]).then(([svcJson, rolesJson]) => {
      if (svcJson.success && svcJson.data) setServices(svcJson.data)
      if (rolesJson.success && rolesJson.data) setRoles(rolesJson.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (activeRole !== 'ALL') params.set('type', activeRole)
    if (activeCategory !== 'ALL') params.set('category', activeCategory)
    const str = params.toString()
    router.replace(`/search/services${str ? `?${str}` : ''}`, { scroll: false })
  }, [searchQuery, activeRole, activeCategory, router])

  // All unique categories in the current dataset
  const allCategories = useMemo(() => {
    const cats = new Set<string>()
    for (const s of services) cats.add(s.category)
    return Array.from(cats).sort()
  }, [services])

  // Filtered services
  const filtered = useMemo(() => {
    let list = services
    if (activeRole !== 'ALL') list = list.filter(s => s.providerType === activeRole)
    if (activeCategory !== 'ALL') list = list.filter(s => s.category === activeCategory)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(s =>
        s.serviceName.toLowerCase().includes(q) ||
        (s.description?.toLowerCase().includes(q)) ||
        s.category.toLowerCase().includes(q)
      )
    }
    return list
  }, [services, activeRole, activeCategory, searchQuery])

  // Role info lookup
  const roleInfo = useMemo(() => {
    const info: Record<string, RoleData> = {}
    for (const r of roles) info[r.code] = r
    return info
  }, [roles])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">Home</Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-medium text-gray-900">Services</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <FaConciergeBell className="text-[#0C6780] text-xl" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">All Services</h1>
              {!loading && (
                <span className="text-sm text-gray-400 font-normal">({filtered.length})</span>
              )}
            </div>

            {/* Search */}
            <div className="relative sm:ml-auto sm:w-72">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780] bg-gray-50"
              />
            </div>
          </div>

          {/* Role filter chips */}
          <div className="flex gap-1.5 mt-3 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setActiveRole('ALL')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border
                ${activeRole === 'ALL'
                  ? 'bg-[#0C6780] text-white border-[#0C6780]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#0C6780] hover:text-[#0C6780]'}`}
            >
              All Types
            </button>
            {roles.map(role => (
              <button
                key={role.code}
                onClick={() => setActiveRole(role.code)}
                style={activeRole === role.code ? { backgroundColor: role.color, borderColor: role.color } : {}}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border
                  ${activeRole === role.code
                    ? 'text-white'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
              >
                {PROVIDER_EMOJI[role.code] ?? ''} {role.label}
              </button>
            ))}
          </div>

          {/* Category filter chips */}
          {allCategories.length > 0 && (
            <div className="flex gap-1.5 mt-2 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden">
              <button
                onClick={() => setActiveCategory('ALL')}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-all border
                  ${activeCategory === 'ALL'
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
              >
                All Categories
              </button>
              {allCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-all border capitalize
                    ${activeCategory === cat
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
                >
                  {resolveCategoryEmoji(cat, '')} {cat.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl h-44 border border-gray-200" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <FaConciergeBell className="text-5xl text-gray-200 mx-auto mb-4" />
            <p className="text-base font-semibold text-gray-600">No services found</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">Try a different search or remove filters</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveRole('ALL'); setActiveCategory('ALL') }}
              className="px-4 py-2 bg-[#0C6780] text-white rounded-lg text-sm font-medium hover:bg-[#001E40] transition-colors"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filtered.map(svc => {
              const info = roleInfo[svc.providerType]
              const color = info?.color ?? '#0C6780'
              const slug = info?.slug ?? svc.providerType.toLowerCase()
              const iconBg = hex2rgba(color, 0.10)

              return (
                <Link
                  key={svc.id}
                  href={`/search/${slug}?serviceId=${svc.id}&serviceName=${encodeURIComponent(svc.serviceName)}`}
                  className="group flex flex-col bg-white rounded-2xl border border-gray-100
                    hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                  style={{ borderTopWidth: 3, borderTopColor: color }}
                >
                  <div className="p-3 sm:p-4 flex-1 flex flex-col">
                    <div
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-2 flex-shrink-0 overflow-hidden"
                      style={{ background: iconBg }}
                    >
                      <ServiceIcon
                        serviceName={svc.serviceName}
                        category={svc.category}
                        providerType={svc.providerType}
                        imageUrl={svc.imageUrl}
                        iconKey={svc.iconKey}
                        size={24}
                      />
                    </div>

                    <h3
                      className="text-xs sm:text-sm font-bold leading-snug line-clamp-2 mb-1"
                      style={{ color }}
                    >
                      {svc.serviceName}
                    </h3>

                    {svc.description && (
                      <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2 flex-1">
                        {svc.description}
                      </p>
                    )}
                  </div>

                  <div className="px-3 sm:px-4 pb-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-gray-900">
                        Rs {svc.defaultPrice.toLocaleString()}
                      </span>
                      {svc.duration && (
                        <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                          <FaClock className="text-[8px]" /> {svc.duration}m
                        </span>
                      )}
                    </div>

                    {svc.providerCount > 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <FaUsers className="text-[8px]" />
                        {svc.providerCount} provider{svc.providerCount !== 1 ? 's' : ''}
                      </div>
                    )}

                    <div
                      className="mt-1.5 text-[10px] font-semibold flex items-center gap-1 group-hover:gap-2 transition-all"
                      style={{ color }}
                    >
                      Find providers <FaArrowRight className="text-[8px]" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
