'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { FaCalendarCheck, FaSearch } from 'react-icons/fa'
import { FiRefreshCw, FiList, FiClock, FiActivity, FiCheckCircle, FiXCircle } from 'react-icons/fi'
import BookingCard, { type BookingCardData } from './BookingCard'

export interface BookingsDashboardProps {
  /** User's ID — used to fetch patient names for provider view (lazy) */
  userId: string
  /** Which side of each booking this user is on */
  role: 'patient' | 'provider'
  /** Human-readable label for the user type, e.g. "Doctor", "Nurse", "Member" */
  userType?: string
  /**
   * Base path for "View details" links. For patients: `/patient`.
   * For providers: `/provider/doctors`. Bookings detail link becomes
   * `${basePath}/bookings/${bookingType}/${bookingId}`.
   */
  basePath: string
}

type FilterTab = 'all' | 'pending' | 'active' | 'done' | 'cancelled'

const FILTER_TABS: { key: FilterTab; label: string; icon: React.ElementType }[] = [
  { key: 'all',       label: 'All',       icon: FiList },
  { key: 'pending',   label: 'Pending',   icon: FiClock },
  { key: 'active',    label: 'Active',    icon: FiActivity },
  { key: 'done',      label: 'Done',      icon: FiCheckCircle },
  { key: 'cancelled', label: 'Cancelled', icon: FiXCircle },
]

function matchesFilter(b: BookingCardData, filter: FilterTab): boolean {
  if (filter === 'all') return true
  if (filter === 'pending') return b.currentStepCategory === 'pending'
  if (filter === 'active') return b.currentStepCategory === 'active' || b.currentStepCategory === 'waiting'
  if (filter === 'done') return b.isCompleted
  if (filter === 'cancelled') return b.isCancelled
  return true
}

/** Skeleton card for loading state */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-gray-200 rounded w-1/2" />
          <div className="h-3 bg-gray-100 rounded w-1/3" />
        </div>
        <div className="h-3 bg-gray-100 rounded w-16" />
      </div>
    </div>
  )
}

export default function BookingsDashboard({ userId: _userId, role, userType, basePath }: BookingsDashboardProps) {
  const [instances, setInstances] = useState<BookingCardData[]>([])
  const [patientCache, setPatientCache] = useState<Record<string, { name: string; image: string | null }>>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')

  const fetchInstances = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/workflow/instances?role=${role}`, { credentials: 'include' })
      const json = await res.json()
      if (json.success) setInstances(json.data as BookingCardData[])
    } catch {
      // non-fatal
    } finally {
      setLoading(false)
    }
  }, [role])

  useEffect(() => { fetchInstances() }, [fetchInstances])

  // Lazy-fetch patient names for provider view
  useEffect(() => {
    if (role !== 'provider') return
    const missing = instances
      .map(i => i.patientUserId)
      .filter((uid): uid is string => !!uid && !patientCache[uid])
    const unique = [...new Set(missing)]
    if (unique.length === 0) return

    unique.forEach(async (uid) => {
      try {
        const res = await fetch(`/api/users/${uid}`, { credentials: 'include' })
        const json = await res.json()
        const u = json.data ?? json.user
        if (u) {
          setPatientCache(prev => ({
            ...prev,
            [uid]: { name: `${u.firstName} ${u.lastName}`, image: u.profileImage ?? null },
          }))
        }
      } catch { /* non-fatal */ }
    })
  }, [instances, patientCache, role])

  // Merge patient info into instances for provider view
  const enriched: BookingCardData[] = instances.map(inst => {
    if (role === 'provider' && inst.patientUserId && patientCache[inst.patientUserId]) {
      const p = patientCache[inst.patientUserId]
      return { ...inst, patientName: p.name, patientImage: p.image }
    }
    return inst
  })

  // Filter + search
  const filtered = enriched.filter(b => {
    if (!matchesFilter(b, filter)) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (b.templateName || '').toLowerCase().includes(q) ||
      (b.serviceName || '').toLowerCase().includes(q) ||
      (b.patientName || '').toLowerCase().includes(q) ||
      (b.bookingType || '').toLowerCase().includes(q)
    )
  })

  // Counts for tab badges
  const counts: Record<FilterTab, number> = {
    all:       enriched.length,
    pending:   enriched.filter(b => b.currentStepCategory === 'pending').length,
    active:    enriched.filter(b => b.currentStepCategory === 'active' || b.currentStepCategory === 'waiting').length,
    done:      enriched.filter(b => b.isCompleted).length,
    cancelled: enriched.filter(b => b.isCancelled).length,
  }

  const roleLabel = userType || (role === 'patient' ? 'Member' : 'Provider')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? 'Loading…' : `${counts.all} booking${counts.all !== 1 ? 's' : ''} across all services`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {role === 'patient' && (
            <Link
              href="/search/providers"
              className="flex items-center gap-1.5 text-sm text-brand-teal hover:text-brand-navy font-medium"
            >
              <FaSearch className="w-3.5 h-3.5" /> Find a Provider
            </Link>
          )}
          <button
            onClick={fetchInstances}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-gray-600"
            aria-label="Refresh bookings"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
        <input
          type="search"
          placeholder={role === 'patient' ? 'Search by service or provider…' : 'Search by service or member name…'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTER_TABS.map(({ key, label, icon: Icon }) => {
          const count = counts[key]
          if (key !== 'all' && count === 0) return null
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-brand-navy text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {count > 0 && key !== 'all' && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  filter === key ? 'bg-white/20' : 'bg-gray-200 text-gray-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          filter={filter}
          role={role}
          roleLabel={roleLabel}
          hasSearch={!!search.trim()}
          onClearSearch={() => setSearch('')}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(inst => (
            <BookingCard
              key={inst.id}
              data={inst}
              role={role}
              basePath={basePath}
              onTransition={fetchInstances}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState({
  filter,
  role,
  hasSearch,
  onClearSearch,
}: {
  filter: FilterTab
  role: 'patient' | 'provider'
  roleLabel: string
  hasSearch: boolean
  onClearSearch: () => void
}) {
  if (hasSearch) {
    return (
      <div className="bg-white rounded-xl p-10 text-center border border-gray-100">
        <FaSearch className="text-4xl text-gray-200 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-1">No results</h3>
        <p className="text-gray-400 text-sm mb-5">No bookings match your search.</p>
        <button onClick={onClearSearch} className="text-brand-teal hover:text-brand-navy font-medium text-sm">
          Clear search
        </button>
      </div>
    )
  }

  if (filter !== 'all') {
    return (
      <div className="bg-white rounded-xl p-10 text-center border border-gray-100">
        <FaCalendarCheck className="text-4xl text-gray-200 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-1">No {filter} bookings</h3>
        <p className="text-gray-400 text-sm">Try a different filter to see other bookings.</p>
      </div>
    )
  }

  // True empty: no bookings at all
  return (
    <div className="bg-white rounded-xl p-10 text-center border border-gray-100">
      <FaCalendarCheck className="text-4xl text-gray-200 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-700 mb-1">
        {role === 'patient' ? 'No bookings yet' : 'No bookings received yet'}
      </h3>
      <p className="text-gray-400 text-sm mb-5">
        {role === 'patient'
          ? 'Book a consultation with a doctor, nurse, or any other provider to get started.'
          : 'Once members book your services, their bookings will appear here with workflow actions.'}
      </p>
      {role === 'patient' && (
        <Link
          href="/search/providers"
          className="text-brand-teal hover:text-brand-navy font-medium text-sm"
        >
          Browse Providers →
        </Link>
      )}
    </div>
  )
}
