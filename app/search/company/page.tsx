'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FaShieldAlt, FaBuilding, FaSearch, FaArrowLeft,
  FaCheckCircle, FaExclamationCircle, FaArrowRight,
} from 'react-icons/fa'

interface Company {
  id: string
  companyName: string
  industry: string | null
  isInsuranceCompany: boolean
  monthlyContribution: number | null
  coverageDescription: string | null
  user: { id: string; firstName: string; lastName: string } | null
}

const TYPE_FILTERS = [
  { key: 'all', label: 'All Companies' },
  { key: 'insurance', label: 'Insurance Companies' },
  { key: 'corporate', label: 'Corporate Partners' },
]

function companyColor(name: string): string {
  const COLORS = ['#0C6780', '#001E40', '#0a5c73', '#1a6b8a', '#0e4a6b', '#2d7d8f']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

function companyInitials(name: string): string {
  return name.split(/\s+/).map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2)
}

export default function FindCompanyPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState(searchParams?.get('q') ?? '')
  const [activeType, setActiveType] = useState(searchParams?.get('type') ?? 'all')
  const [joinBusyId, setJoinBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)

  const load = async (q: string, type: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      if (type !== 'all') params.set('type', type)
      const res = await fetch(`/api/corporate/companies?${params}`)
      const json = await res.json()
      setCompanies(json.success && Array.isArray(json.data) ? json.data : [])
    } catch { setCompanies([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load(query, activeType) }, [activeType, query])

  // Sync URL params without triggering reload
  const syncUrl = (q: string, type: string) => {
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q)
    if (type !== 'all') params.set('type', type)
    router.replace(`/search/company${params.toString() ? `?${params}` : ''}`, { scroll: false })
  }

  const handleTypeChange = (type: string) => {
    setActiveType(type)
    syncUrl(query, type)
    load(query, type)
  }

  const handleSearch = () => {
    syncUrl(query, activeType)
    load(query, activeType)
  }

  const join = async (c: Company) => {
    setJoinBusyId(c.id)
    setToast(null)
    try {
      const res = await fetch(`/api/corporate/insurance/${c.id}/join`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      const json = await res.json()
      setToast(json.success
        ? { type: 'ok', msg: `Joined ${c.companyName} — first contribution deducted from wallet` }
        : { type: 'err', msg: json.message || 'Failed to join' })
    } catch {
      setToast({ type: 'err', msg: 'Network error' })
    } finally {
      setJoinBusyId(null)
      setTimeout(() => setToast(null), 4500)
    }
  }

  const insuranceCount = useMemo(() => companies.filter(c => c.isInsuranceCompany).length, [companies])
  const corporateCount = useMemo(() => companies.filter(c => !c.isInsuranceCompany).length, [companies])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
              <FaArrowLeft />
            </Link>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/" className="text-gray-500 hover:text-gray-700">Home</Link>
              <span className="text-gray-300">/</span>
              <span className="font-medium text-gray-900">Company Partners</span>
            </nav>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <FaBuilding className="text-[#0C6780] text-xl" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Find Company Partners</h1>
              {!loading && (
                <span className="text-sm text-gray-400">({companies.length})</span>
              )}
            </div>

            {/* Search */}
            <div className="flex gap-2 sm:ml-auto">
              <div className="relative flex-1 sm:w-64">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
                  placeholder="Search companies…"
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780] bg-gray-50"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-[#0C6780] text-white rounded-lg text-sm font-medium hover:bg-[#001E40] transition-colors"
              >
                Search
              </button>
            </div>
          </div>

          {/* Type filter chips */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden">
            {TYPE_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => handleTypeChange(f.key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border
                  ${activeType === f.key
                    ? 'bg-[#0C6780] text-white border-[#0C6780]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#0C6780] hover:text-[#0C6780]'}`}
              >
                {f.label}
                {!loading && f.key === 'insurance' && insuranceCount > 0 && (
                  <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${activeType === f.key ? 'bg-white/20' : 'bg-gray-100'}`}>
                    {insuranceCount}
                  </span>
                )}
                {!loading && f.key === 'corporate' && corporateCount > 0 && (
                  <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${activeType === f.key ? 'bg-white/20' : 'bg-gray-100'}`}>
                    {corporateCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className={`text-sm px-4 py-3 rounded-xl border flex items-center gap-2
            ${toast.type === 'ok'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'}`}>
            {toast.type === 'ok' ? <FaCheckCircle /> : <FaExclamationCircle />}
            {toast.msg}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl h-40 border border-gray-200" />
            ))}
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-24">
            <FaBuilding className="text-5xl text-gray-200 mx-auto mb-4" />
            <p className="text-base font-semibold text-gray-600">No companies found</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">Try a different search or remove filters</p>
            <button
              onClick={() => { setQuery(''); setActiveType('all'); load('', 'all'); syncUrl('', 'all') }}
              className="px-4 py-2 bg-[#0C6780] text-white rounded-lg text-sm font-medium hover:bg-[#001E40] transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map(c => {
              const color = companyColor(c.companyName)
              const initials = companyInitials(c.companyName)
              return (
                <div key={c.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    {/* Logo placeholder */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: color }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate text-sm">{c.companyName}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        {c.isInsuranceCompany ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                            <FaShieldAlt className="text-[8px]" /> Insurance
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#0C6780] bg-sky-50 px-2 py-0.5 rounded-full">
                            <FaBuilding className="text-[8px]" /> Corporate
                          </span>
                        )}
                        {c.industry && (
                          <span className="text-[10px] text-gray-400 truncate">{c.industry}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {c.coverageDescription && (
                    <p className="text-xs text-gray-600 line-clamp-2 flex-1">{c.coverageDescription}</p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    {c.isInsuranceCompany && c.monthlyContribution != null ? (
                      <>
                        <div>
                          <p className="text-[10px] text-gray-400">Monthly contribution</p>
                          <p className="text-sm font-bold text-gray-900">
                            MUR {c.monthlyContribution.toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => join(c)}
                          disabled={joinBusyId === c.id}
                          className="px-4 py-1.5 bg-[#0C6780] text-white rounded-lg text-xs font-semibold hover:bg-[#001E40] disabled:opacity-50 transition-colors"
                        >
                          {joinBusyId === c.id ? 'Joining…' : 'Join'}
                        </button>
                      </>
                    ) : (
                      <Link
                        href={`/profile/${c.user?.id ?? ''}`}
                        className="flex items-center gap-1 text-xs font-medium text-[#0C6780] hover:text-[#001E40] transition-colors"
                      >
                        View profile <FaArrowRight className="text-[9px]" />
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
