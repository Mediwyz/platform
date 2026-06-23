'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'react-toastify'
import Link from 'next/link'
import { useDashboardUser } from '@/hooks/useDashboardUser'
import { CATEGORY_BADGE, categoryFromLegacyStatus } from '@/components/workflow/stepCategoryStyles'
import {
  FaSpinner, FaCalendarAlt, FaCheck, FaTimes, FaCheckCircle,
  FaSearch, FaClock, FaClipboardList, FaHistory, FaPlay,
  FaVideo, FaPhone, FaUser, FaHome, FaHospital, FaBolt, FaExternalLinkAlt,
} from 'react-icons/fa'

//  Types 

interface Booking {
  id: string
  bookingType: string
  providerName?: string
  providerRole?: string
  providerSpecialty?: string
  serviceName?: string
  scheduledAt?: string
  createdAt?: string
  status: string
  price?: number | null
  availableActions?: string[]
  patientName?: string
  patientImage?: string
  type?: string
  reason?: string
  duration?: number
  workflowInstanceId?: string
  templateName?: string
  providerType?: string
}

//  Component 

export default function UnifiedPracticePage() {
  const user = useDashboardUser()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  // Multi-select for bulk actions - morning routines typically batch-accept
  // several bookings at once. Keyed by booking.id so we don't lose selection
  // across refetches.
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)

  const fetchBookings = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const res = await fetch('/api/bookings/unified?role=provider', { credentials: 'include' })
      const json = await res.json()
      if (json.success && json.data) {
        setBookings(json.data)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  //  Actions 

  const handleAction = async (bookingId: string, bookingType: string, action: string) => {
    if (!user) return
    setActionLoading(bookingId)
    try {
      if (action === 'complete') {
        // Try workflow transition first, fallback to direct update
        const wfRes = await fetch('/api/workflow/transition', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId, bookingType, action: 'complete' }),
          credentials: 'include',
        })
        if (!wfRes.ok) {
          await fetch('/api/bookings/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId, bookingType: mapBookingType(bookingType), action: 'accept' }),
            credentials: 'include',
          })
        }
      } else {
        const res = await fetch('/api/bookings/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId, bookingType: mapBookingType(bookingType), action }),
          credentials: 'include',
        })
        const result = await res.json()
        if (!result.success) {
          toast.error(result.message || `Failed to ${action} booking`)
          return
        }
      }

      await fetchBookings()

      if (action === 'accept') {
        // Find the booking to determine if it's a video/audio call
        const booking = bookings.find(b => b.id === bookingId)
        const serviceType = booking?.type || booking?.bookingType || ''
        if (serviceType === 'video' || serviceType.includes('video')) {
          toast.success(
            <span className="flex items-center gap-2">
              Booking accepted!{' '}
              <Link href="video" className="underline font-medium flex items-center gap-1">
                View Video Call <FaExternalLinkAlt className="text-[10px]" />
              </Link>
            </span>
          )
          return
        }
        if (serviceType === 'audio' || serviceType.includes('audio')) {
          toast.success(
            <span className="flex items-center gap-2">
              Booking accepted!{' '}
              <Link href="audio" className="underline font-medium flex items-center gap-1">
                View Audio Call <FaExternalLinkAlt className="text-[10px]" />
              </Link>
            </span>
          )
          return
        }
      }

      toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)} - done`)
    } catch {
      toast.error('Action failed. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  //  Bulk action 

  const runBulk = async (action: 'accept' | 'deny' | 'complete') => {
    if (selected.size === 0 || bulkBusy) return
    setBulkBusy(true)
    const ids = Array.from(selected)
    const targets = bookings.filter(b => ids.includes(b.id))
    let ok = 0
    let failed = 0

    for (const b of targets) {
      try {
        const res = await fetch('/api/bookings/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: b.id, bookingType: mapBookingType(b.bookingType), action }),
          credentials: 'include',
        })
        const json = await res.json()
        if (json.success) ok++; else failed++
      } catch {
        failed++
      }
    }

    setSelected(new Set())
    setBulkBusy(false)
    await fetchBookings()
    if (failed === 0) toast.success(`${ok} bookings updated`)
    else if (ok === 0) toast.error(`All ${failed} failed`)
    else toast.warning(`${ok} succeeded, ${failed} failed`)
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  //  Filters 

  const filtered = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = !searchTerm ||
        (b.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.serviceName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.reason || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [bookings, searchTerm, statusFilter])

  const pendingBookings = filtered.filter(b => b.status === 'pending')
  const activeBookings = filtered.filter(b => ['accepted', 'upcoming', 'confirmed', 'in_progress', 'dispatched', 'en_route'].includes(b.status))
  const completedBookings = filtered.filter(b => ['completed', 'resolved'].includes(b.status))
  const cancelledBookings = filtered.filter(b => b.status === 'cancelled')

  // "Needs your action" = any booking where the provider has at least one
  // action to take. Derived from availableActions when present (canonical),
  // else falls back to the status-based heuristic.
  const needsActionBookings = useMemo(() => bookings.filter(b => {
    const actions = b.availableActions && b.availableActions.length > 0
      ? b.availableActions
      : deriveActionsFromStatus(b.status)
    return actions.length > 0 && !['completed', 'resolved', 'cancelled'].includes(b.status)
  }), [bookings])

  //  Stats 

  const stats = useMemo(() => ({
    pending: bookings.filter(b => b.status === 'pending').length,
    active: bookings.filter(b => ['accepted', 'upcoming', 'confirmed', 'in_progress', 'dispatched', 'en_route'].includes(b.status)).length,
    today: bookings.filter(b => {
      if (!b.scheduledAt) return false
      const d = new Date(b.scheduledAt)
      const now = new Date()
      return d.toDateString() === now.toDateString() && !['completed', 'cancelled', 'resolved'].includes(b.status)
    }).length,
    completed: bookings.filter(b => ['completed', 'resolved'].includes(b.status)).length,
  }), [bookings])

  //  Render 

  if (!user) return null

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <FaSpinner className="animate-spin text-[#0C6780] text-3xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-fg">My Practice</h1>
      </div>

      {/* Needs-Action Rail - surfaces actionable bookings across all statuses */}
      {needsActionBookings.length > 0 && (
        <div className="rounded-xl bg-gradient-to-r from-brand-navy to-brand-teal p-4 text-white shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <FaBolt className="text-xl" />
              </div>
              <div>
                <p className="text-sm font-semibold">Needs your action</p>
                <p className="text-xs text-white/80">
                  {needsActionBookings.length} booking{needsActionBookings.length !== 1 ? 's' : ''} waiting on you
                </p>
              </div>
            </div>
            <button
              onClick={() => setStatusFilter('pending')}
              className="px-3 py-1.5 bg-surface text-brand-navy text-xs font-semibold rounded-lg hover:bg-subtle transition-colors"
            >
              Show pending only
            </button>
          </div>
        </div>
      )}

      {/* Bulk Action Bar - appears when bookings are selected */}
      {selected.size > 0 && (
        <div className="sticky top-0 z-40 rounded-xl bg-amber-50 border border-amber-200 p-3 shadow-sm flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm font-medium text-amber-900">
            {selected.size} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => runBulk('accept')}
              disabled={bulkBusy}
              className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {bulkBusy ? 'Working...' : 'Accept selected'}
            </button>
            <button
              onClick={() => runBulk('complete')}
              disabled={bulkBusy}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Complete selected
            </button>
            <button
              onClick={() => runBulk('deny')}
              disabled={bulkBusy}
              className="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-100 disabled:opacity-50"
            >
              Decline selected
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="px-3 py-1.5 bg-surface text-soft text-xs font-medium rounded-lg hover:bg-subtle border border-line"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={FaClock} label="Pending" value={stats.pending} color="text-yellow-600" bgColor="bg-yellow-50" onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')} active={statusFilter === 'pending'} />
        <StatCard icon={FaCalendarAlt} label="Today" value={stats.today} color="text-blue-600" bgColor="bg-blue-50" onClick={() => setStatusFilter('all')} active={false} />
        <StatCard icon={FaClipboardList} label="Active" value={stats.active} color="text-green-600" bgColor="bg-green-50" onClick={() => setStatusFilter(statusFilter === 'accepted' ? 'all' : 'accepted')} active={statusFilter === 'accepted'} />
        <StatCard icon={FaHistory} label="Completed" value={stats.completed} color="text-soft" bgColor="bg-subtle" onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')} active={statusFilter === 'completed'} />
      </div>

      {/* Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-faint text-sm" />
          <input
            type="text"
            placeholder="Search patient, service, reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-line rounded-xl focus:ring-2 focus:ring-[#0C6780] focus:border-transparent outline-none text-sm bg-surface"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-line rounded-xl focus:ring-2 focus:ring-[#0C6780] focus:border-transparent outline-none bg-surface text-sm"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="upcoming">Upcoming</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && !loading && (
        <div className="bg-surface rounded-xl border border-line p-12 text-center">
          <FaCalendarAlt className="text-4xl text-faint mx-auto mb-3" />
          <p className="font-medium text-soft">No bookings found</p>
          <p className="text-sm text-faint mt-1">When patients book your services, they will appear here.</p>
        </div>
      )}

      {/* Booking Sections */}
      {pendingBookings.length > 0 && (
        <BookingSection title="Pending Requests" count={pendingBookings.length} color="yellow" bookings={pendingBookings} onAction={handleAction} actionLoading={actionLoading} selected={selected} onToggleSelect={toggleSelect} />
      )}
      {activeBookings.length > 0 && (
        <BookingSection title="Active" count={activeBookings.length} color="green" bookings={activeBookings} onAction={handleAction} actionLoading={actionLoading} selected={selected} onToggleSelect={toggleSelect} />
      )}
      {completedBookings.length > 0 && (
        <BookingSection title="Completed" count={completedBookings.length} color="gray" bookings={completedBookings} onAction={handleAction} actionLoading={actionLoading} selected={selected} onToggleSelect={toggleSelect} />
      )}
      {cancelledBookings.length > 0 && (
        <BookingSection title="Cancelled" count={cancelledBookings.length} color="red" bookings={cancelledBookings} onAction={handleAction} actionLoading={actionLoading} selected={selected} onToggleSelect={toggleSelect} />
      )}
    </div>
  )
}

//  Sub-components 

function StatCard({ icon: Icon, label, value, color, bgColor, onClick, active }: {
  icon: React.ComponentType<{ className?: string }>
  label: string; value: number; color: string; bgColor: string
  onClick: () => void; active: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
        active ? 'border-[#0C6780] ring-2 ring-[#0C6780]/20 bg-surface' : 'border-line bg-surface hover:border-line'
      }`}
    >
      <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center`}>
        <Icon className={`${color} text-lg`} />
      </div>
      <div className="text-left">
        <p className="text-2xl font-bold text-fg">{value}</p>
        <p className="text-xs text-soft">{label}</p>
      </div>
    </button>
  )
}

function BookingSection({ title, count, color, bookings, onAction, actionLoading, selected, onToggleSelect }: {
  title: string; count: number; color: string
  bookings: Booking[]; onAction: (id: string, type: string, action: string) => void; actionLoading: string | null
  selected: Set<string>; onToggleSelect: (id: string) => void
}) {
  const borderColor = color === 'yellow' ? 'border-yellow-200' : color === 'green' ? 'border-green-200' : color === 'red' ? 'border-red-200' : 'border-line'
  const headerColor = color === 'yellow' ? 'text-yellow-700' : color === 'green' ? 'text-green-700' : color === 'red' ? 'text-red-700' : 'text-soft'

  return (
    <div>
      <h2 className={`text-sm font-semibold ${headerColor} mb-2`}>{title} ({count})</h2>

      {/* Desktop Table */}
      <div className={`hidden sm:block bg-surface rounded-xl border ${borderColor} overflow-hidden`}>
        <div className="overflow-x-auto"><table className="w-full">
          <thead>
            <tr className="bg-subtle border-b border-line">
              <th className="w-10 px-3 py-3"></th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-soft uppercase">Patient</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-soft uppercase">Service</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-soft uppercase">Date & Time</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-soft uppercase">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-soft uppercase">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-soft uppercase">Price</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-soft uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {bookings.map(b => (
              <tr key={b.id} className={`hover:bg-subtle/50 transition-colors ${selected.has(b.id) ? 'bg-amber-50/40' : ''}`}>
                <td className="px-3 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selected.has(b.id)}
                    onChange={() => onToggleSelect(b.id)}
                    aria-label={`Select booking for ${b.patientName || 'patient'}`}
                    className="w-4 h-4 rounded border-line text-brand-teal focus:ring-brand-teal"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#0C6780]/10 flex items-center justify-center text-xs font-bold text-[#0C6780]">
                      {(b.patientName || 'P').split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <span className="text-sm font-medium text-fg">{b.patientName || 'Patient'}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-fg">{b.serviceName || b.providerSpecialty || 'Consultation'}</p>
                  {b.reason && <p className="text-xs text-faint truncate max-w-[180px]">{b.reason}</p>}
                </td>
                <td className="px-4 py-3">
                  {b.scheduledAt ? (
                    <>
                      <p className="text-sm text-soft">{new Date(b.scheduledAt!).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                      <p className="text-xs text-faint">{new Date(b.scheduledAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </>
                  ) : (
                    <p className="text-xs text-faint">{b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-GB') : ' - '}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <TypeBadge type={b.type} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={b.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  {b.price != null && b.price > 0 ? (
                    <span className="text-sm font-medium text-soft">Rs {b.price.toLocaleString()}</span>
                  ) : (
                    <span className="text-xs text-faint">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <ActionButtons booking={b} onAction={onAction} loading={actionLoading === b.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>

      {/* Mobile Cards */}
      <div className={`sm:hidden bg-surface rounded-xl border ${borderColor} divide-y divide-line`}>
        {bookings.map(b => (
          <div key={b.id} className={`p-4 space-y-2 ${selected.has(b.id) ? 'bg-amber-50/40' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected.has(b.id)}
                  onChange={() => onToggleSelect(b.id)}
                  aria-label={`Select booking for ${b.patientName || 'patient'}`}
                  className="w-4 h-4 rounded border-line text-brand-teal focus:ring-brand-teal"
                />
                <div className="w-8 h-8 rounded-full bg-[#0C6780]/10 flex items-center justify-center text-xs font-bold text-[#0C6780]">
                  {(b.patientName || 'P').split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <span className="text-sm font-medium text-fg">{b.patientName || 'Patient'}</span>
              </div>
              <StatusBadge status={b.status} />
            </div>
            <p className="text-sm text-soft">{b.serviceName || 'Consultation'}</p>
            <div className="flex items-center justify-between text-xs text-faint">
              <span>{b.scheduledAt ? `${new Date(b.scheduledAt).toLocaleDateString('en-GB')} at ${new Date(b.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : (b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-GB') : ' - ')}</span>
              {b.price != null && b.price > 0 && <span className="font-medium text-soft">Rs {b.price.toLocaleString()}</span>}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <TypeBadge type={b.type} />
              <ActionButtons booking={b} onAction={onAction} loading={actionLoading === b.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Booking-list status pill. Uses the same category buckets as the workflow
// detail page so custom status codes (sample_collected, eye_test_done, )
// still light up with colour. Falls back to categoryFromLegacyStatus when
// the booking doesn't carry a category (older rows).
function StatusBadge({ status }: { status: string }) {
  const category = categoryFromLegacyStatus(status)
  const style = CATEGORY_BADGE[category]
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${style.bg} ${style.text}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function TypeBadge({ type }: { type?: string }) {
  if (!type) return null
  const icon = type === 'video' ? FaVideo
    : type === 'audio' ? FaPhone
    : type === 'home_visit' || type === 'home' ? FaHome
    : type === 'in_person' || type === 'office' ? FaHospital
    : FaUser
  const Icon = icon
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#0C6780]/10 text-[#0C6780] font-medium">
      <Icon className="text-[8px]" />
      {(type || '').replace(/_/g, ' ')}
    </span>
  )
}

function ActionButtons({ booking, onAction, loading }: {
  booking: Booking; onAction: (id: string, type: string, action: string) => void; loading: boolean
}) {
  const b = booking
  if (loading) return <FaSpinner className="animate-spin text-faint text-sm" />

  // Derive available actions from status (since API may not include availableActions)
  const actions: string[] = (b.availableActions && b.availableActions.length > 0)
    ? b.availableActions
    : deriveActionsFromStatus(b.status)

  return (
    <div className="flex items-center gap-1.5 justify-center">
      {actions.includes('accept') && (
        <button onClick={() => onAction(b.id, b.bookingType, 'accept')} className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors">
          <FaCheck className="text-[10px]" /> Accept
        </button>
      )}
      {actions.includes('deny') && (
        <button onClick={() => onAction(b.id, b.bookingType, 'deny')} className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors">
          <FaTimes className="text-[10px]" /> Decline
        </button>
      )}
      {actions.includes('complete') && (
        <button onClick={() => onAction(b.id, b.bookingType, 'complete')} className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">
          <FaCheckCircle className="text-[10px]" /> Complete
        </button>
      )}
      {actions.includes('start') && (
        <button onClick={() => onAction(b.id, b.bookingType, 'start')} className="flex items-center gap-1 px-2.5 py-1.5 bg-[#0C6780] text-white rounded-lg text-xs font-medium hover:bg-[#0a5568] transition-colors">
          <FaPlay className="text-[10px]" /> Start
        </button>
      )}
    </div>
  )
}

function deriveActionsFromStatus(status: string): string[] {
  switch (status) {
    case 'pending': return ['accept', 'deny']
    case 'accepted':
    case 'confirmed':
    case 'upcoming': return ['start', 'complete']
    case 'in_progress': return ['complete']
    default: return []
  }
}

//  Helpers 

function mapBookingType(type: string): string {
  const map: Record<string, string> = {
    appointment: 'doctor',
    nurse_booking: 'nurse',
    childcare_booking: 'nanny',
    lab_test_booking: 'lab_test',
    emergency_booking: 'emergency',
    service_booking: 'service',
  }
  return map[type] || type
}
