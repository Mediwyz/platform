'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { FaCalendarCheck, FaClock, FaCheckCircle, FaChartLine, FaComments, FaMoneyBillWave, FaRobot, FaHospital, FaMapMarkerAlt, FaPlus } from 'react-icons/fa'
import { MdVerified } from 'react-icons/md'
import Link from 'next/link'
import DashboardStatCard from '@/components/shared/DashboardStatCard'
import HealthTrackerTabs from '@/components/health-tracker/HealthTrackerTabs'

interface Workplace {
  id: string
  isPrimary: boolean
  role: string | null
  entity: {
    id: string
    name: string
    type: string
    city: string | null
    country: string
    isVerified: boolean
  }
}

interface Booking {
  id: string
  type: string
  status: string
  patientName?: string
  scheduledAt?: string
  createdAt?: string
}

export default function DynamicProviderDashboard() {
  const params = useParams()
  const slug = params.slug as string
  const base = `/provider/${slug}`
  const { user } = useUser()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [workplaces, setWorkplaces] = useState<Workplace[]>([])

  useEffect(() => {
    if (!user?.id) return
    const fetchBookings = async () => {
      try {
        const res = await fetch(`/api/bookings/unified?role=provider`, { credentials: 'include' })
        if (!res.ok) return
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          setBookings(json.data)
        }
      } catch {
        // Keep empty state
      } finally {
        setLoading(false)
      }
    }
    const fetchWorkplaces = async () => {
      try {
        const res = await fetch(`/api/providers/${user.id}/workplaces`)
        const json = await res.json()
        if (json.success) setWorkplaces(json.data ?? [])
      } catch { /* non-critical */ }
    }
    fetchBookings()
    fetchWorkplaces()
  }, [user?.id])

  const totalBookings = bookings.length
  const pendingBookings = bookings.filter(b =>
    ['PENDING', 'CONFIRMED', 'SCHEDULED', 'IN_PROGRESS'].includes(b.status?.toUpperCase() ?? '')
  ).length
  const completedBookings = bookings.filter(b =>
    ['COMPLETED', 'DELIVERED'].includes(b.status?.toUpperCase() ?? '')
  ).length
  const recentBookings = bookings.slice(0, 5)

  const quickLinks = [
    { label: 'My Practice', href: `${base}/practice`, icon: FaCalendarCheck, color: 'bg-blue-50 text-blue-600' },
    { label: 'Messages', href: `${base}/messages`, icon: FaComments, color: 'bg-green-50 text-green-600' },
    { label: 'Billing', href: `${base}/billing`, icon: FaMoneyBillWave, color: 'bg-purple-50 text-purple-600' },
    { label: 'AI Assistant', href: `${base}/ai-assistant`, icon: FaRobot, color: 'bg-teal-50 text-teal-600' },
  ]

  const statusColor: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    SCHEDULED: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
    COMPLETED: 'bg-green-100 text-green-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  }

  return (
    <div className="space-y-6 p-1">
      <div>
        <h1 className="text-2xl font-bold text-fg">
          Welcome back{user ? `, ${user.firstName}` : ''}
        </h1>
        <p className="text-soft mt-1">Here is your dashboard overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatCard
          icon={FaChartLine}
          title="Total Bookings"
          value={loading ? '...' : totalBookings}
          color="bg-[#0C6780]"
        />
        <DashboardStatCard
          icon={FaClock}
          title="Pending"
          value={loading ? '...' : pendingBookings}
          color="bg-yellow-500"
        />
        <DashboardStatCard
          icon={FaCheckCircle}
          title="Completed"
          value={loading ? '...' : completedBookings}
          color="bg-green-500"
        />
        <DashboardStatCard
          icon={FaCalendarCheck}
          title="This Month"
          value={loading ? '...' : bookings.filter(b => {
            const d = b.scheduledAt || b.createdAt
            if (!d) return false
            const date = new Date(d)
            const now = new Date()
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
          }).length}
          color="bg-purple-500"
        />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="flex flex-col items-center gap-2 p-4 bg-surface rounded-xl border border-line hover:shadow-md transition-all"
          >
            <div className={`w-10 h-10 rounded-xl ${link.color} flex items-center justify-center`}>
              <link.icon className="text-lg" />
            </div>
            <span className="text-sm font-medium text-soft">{link.label}</span>
          </Link>
        ))}
      </div>

      {/* My Workplace */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-fg">My Workplace</h2>
          <Link href="/search/organizations" className="text-xs text-[#0C6780] font-medium hover:underline flex items-center gap-1">
            <FaPlus size={10} /> Add Workplace
          </Link>
        </div>
        {workplaces.length === 0 ? (
          <div className="bg-surface rounded-xl border border-dashed border-line p-5 text-center">
            <FaHospital className="text-faint text-2xl mx-auto mb-2" />
            <p className="text-sm text-soft mb-2">You have not linked an organization yet.</p>
            <Link href="/search/organizations" className="text-xs text-[#0C6780] font-medium hover:underline">Find and join an organization →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {workplaces.map(wp => (
              <div key={wp.id} className="bg-surface rounded-xl border border-line shadow-sm p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                  <FaHospital className="text-red-600" size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-semibold text-fg truncate">{wp.entity.name}</p>
                    {wp.entity.isVerified && <MdVerified className="text-[#0C6780] flex-shrink-0" size={13} />}
                    {wp.isPrimary && <span className="text-[10px] bg-[#0C6780]/10 text-[#0C6780] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0">Primary</span>}
                  </div>
                  {wp.role && <p className="text-xs text-soft">{wp.role}</p>}
                  <div className="flex items-center gap-1 mt-0.5">
                    <FaMapMarkerAlt className="text-faint" size={9} />
                    <p className="text-[10px] text-faint">{wp.entity.city ?? ''}{wp.entity.city ? ', ' : ''}{wp.entity.country}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-bold text-fg mb-3">Recent Activity</h2>
        {loading ? (
          <div className="bg-surface rounded-xl border border-line p-6 text-center">
            <p className="text-sm text-soft">Loading bookings...</p>
          </div>
        ) : recentBookings.length === 0 ? (
          <div className="bg-surface rounded-xl border border-line p-6 text-center">
            <p className="text-sm text-soft">
              No recent bookings yet. View your full schedule in{' '}
              <Link href={`${base}/practice`} className="text-[#0C6780] font-medium hover:underline">
                My Practice
              </Link>
            </p>
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-line divide-y divide-line">
            {recentBookings.map(booking => {
              const dateStr = booking.scheduledAt || booking.createdAt
              const statusKey = booking.status?.toUpperCase() ?? ''
              return (
                <div key={booking.id} className="flex items-center justify-between p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg truncate">
                      {booking.patientName || booking.type?.replace(/_/g, ' ') || 'Booking'}
                    </p>
                    <p className="text-xs text-soft mt-0.5">
                      {booking.type?.replace(/_/g, ' ')}
                      {dateStr ? ` - ${new Date(dateStr).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${statusColor[statusKey] || 'bg-subtle text-fg'}`}>
                    {booking.status?.replace(/_/g, ' ') || 'Unknown'}
                  </span>
                </div>
              )
            })}
            {bookings.length > 5 && (
              <div className="p-3 text-center">
                <Link href={`${base}/practice`} className="text-sm text-[#0C6780] font-medium hover:underline">
                  View all {bookings.length} bookings
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Health & AI Assistant — merged from the former standalone AI dashboard.
          AI Assistant is the first tab; daily-logging surfaces follow. */}
      <div>
        <h2 className="text-lg font-bold text-fg mb-3 flex items-center gap-2">
          <FaRobot className="text-[#0C6780]" /> Health &amp; AI Assistant
        </h2>
        <HealthTrackerTabs embedded userName={user?.firstName} />
      </div>
    </div>
  )
}
