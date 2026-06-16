'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  FaBell, FaCalendarCheck, FaComment, FaWallet, FaInfoCircle,
  FaCheckDouble, FaFlask, FaHeartbeat, FaBoxOpen, FaFilter,
} from 'react-icons/fa'
import { type NotificationItem } from '@/hooks/useNotifications'
import DashboardPageHeader from '@/components/shared/DashboardPageHeader'

// ─── helpers ─────────────────────────────────────────────────────────────────

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.split('; ').find(r => r.startsWith(name + '='))
  return match ? decodeURIComponent(match.split('=')[1]) : null
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  if (hours < 48) return 'Yesterday'
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function mapRaw(raw: any): NotificationItem {
  return {
    id: raw.id,
    type: raw.type ?? 'system',
    title: raw.title ?? '',
    message: raw.message ?? '',
    isRead: !!raw.readAt,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    readAt: raw.readAt ?? null,
    referenceId: raw.referenceId ?? null,
    referenceType: raw.referenceType ?? null,
    payload: raw.payload ?? null,
    actionUrl: raw.actionUrl ?? null,
  }
}

function NotifIcon({ type }: { type: string }) {
  const cls = 'text-base flex-shrink-0'
  switch (type) {
    case 'appointment': case 'booking': case 'booking_request': case 'booking_cancelled': case 'workflow':
      return <FaCalendarCheck className={`${cls} text-brand-teal`} aria-hidden="true" />
    case 'message': case 'chat':
      return <FaComment className={`${cls} text-blue-500`} aria-hidden="true" />
    case 'payment': case 'wallet': case 'insurance': case 'corporate_enrollment':
      return <FaWallet className={`${cls} text-emerald-500`} aria-hidden="true" />
    case 'lab_result': case 'lab_test_booking':
      return <FaFlask className={`${cls} text-purple-500`} aria-hidden="true" />
    case 'health': case 'emergency':
      return <FaHeartbeat className={`${cls} text-red-500`} aria-hidden="true" />
    case 'inventory': case 'order':
      return <FaBoxOpen className={`${cls} text-orange-500`} aria-hidden="true" />
    case 'system':
      return <FaBell className={`${cls} text-gray-400`} aria-hidden="true" />
    default:
      return <FaInfoCircle className={`${cls} text-gray-400`} aria-hidden="true" />
  }
}

type Tab = 'all' | 'unread' | 'bookings' | 'messages' | 'system'

const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'messages', label: 'Messages' },
  { id: 'system', label: 'System' },
]

function filterByTab(items: NotificationItem[], tab: Tab): NotificationItem[] {
  switch (tab) {
    case 'unread': return items.filter(n => !n.isRead)
    case 'bookings': return items.filter(n => ['appointment', 'booking', 'booking_request', 'booking_cancelled', 'workflow', 'lab_result', 'lab_test_booking', 'emergency'].includes(n.type))
    case 'messages': return items.filter(n => ['message', 'chat'].includes(n.type))
    case 'system': return items.filter(n => ['system', 'payment', 'wallet', 'insurance', 'corporate_enrollment'].includes(n.type))
    default: return items
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const loadingMore = useRef(false)

  useEffect(() => {
    const id = getCookie('mediwyz_user_id')
    setUserId(id)
  }, [])

  const fetchPage = useCallback(async (pageNum: number, replace = false) => {
    if (!userId) return
    if (pageNum === 1) setLoading(true)
    try {
      const res = await fetch(`/api/users/${userId}/notifications?limit=20&page=${pageNum}`, { credentials: 'include' })
      if (!res.ok) return
      const json = await res.json()
      if (!json.success) return
      const mapped = (json.data as any[]).map(mapRaw)
      setNotifications(prev => replace ? mapped : [...prev, ...mapped])
      setUnreadCount(json.meta?.unreadCount ?? 0)
      setHasMore(mapped.length === 20)
    } catch { /* silent */ } finally {
      setLoading(false)
      loadingMore.current = false
    }
  }, [userId])

  useEffect(() => {
    if (userId) fetchPage(1, true)
  }, [userId, fetchPage])

  const handleLoadMore = () => {
    if (loadingMore.current || !hasMore) return
    loadingMore.current = true
    const next = page + 1
    setPage(next)
    fetchPage(next)
  }

  const handleMarkRead = async (n: NotificationItem) => {
    if (n.isRead) return
    setNotifications(prev =>
      prev.map(x => x.id === n.id ? { ...x, isRead: true, readAt: new Date().toISOString() } : x),
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
    try {
      await fetch(`/api/users/${userId}/notifications/${n.id}`, { method: 'PATCH', credentials: 'include' })
    } catch { /* silent */ }
  }

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: n.readAt ?? new Date().toISOString() })))
    setUnreadCount(0)
    try {
      await fetch(`/api/users/${userId}/notifications/read-all`, { method: 'PATCH', credentials: 'include' })
    } catch { /* silent */ }
  }

  const handleNotifClick = async (n: NotificationItem) => {
    await handleMarkRead(n)
    const href = n.actionUrl ?? (n.payload as any)?.href
    if (href) router.push(href)
  }

  const filtered = filterByTab(notifications, activeTab)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <DashboardPageHeader
        icon={FaBell}
        title="Notifications"
        description={unreadCount > 0 ? `${unreadCount} unread` : undefined}
        actions={unreadCount > 0 ? (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 text-sm text-brand-teal hover:text-brand-navy font-medium px-3 py-2 rounded-lg hover:bg-sky-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
          >
            <FaCheckDouble className="text-xs" aria-hidden="true" />
            Mark all read
          </button>
        ) : undefined}
      />

      {/* Tab strip */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1" role="tablist" aria-label="Filter notifications">
        {TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-3 py-1.5 text-sm rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal ${
              activeTab === tab.id
                ? 'bg-brand-teal text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
            {tab.id === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 text-[10px] bg-white/30 rounded-full px-1">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
        <div className="ml-auto flex-shrink-0">
          <FaFilter className="text-gray-400 text-sm mt-2 ml-2" aria-hidden="true" />
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="px-4 py-4 border-b border-gray-100 animate-pulse last:border-b-0">
              <div className="flex gap-3">
                <div className="w-5 h-5 bg-gray-200 rounded-full flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-2.5 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <FaBell className="text-5xl text-gray-200 mb-4" aria-hidden="true" />
            <p className="text-base font-semibold text-gray-500">
              {activeTab === 'unread' ? 'All caught up!' : 'No notifications here'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {activeTab === 'unread'
                ? 'You have no unread notifications.'
                : 'Notifications will appear here as they arrive.'}
            </p>
            {activeTab !== 'all' && (
              <button
                onClick={() => setActiveTab('all')}
                className="mt-4 text-sm text-brand-teal hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal rounded"
              >
                View all notifications
              </button>
            )}
          </div>
        ) : (
          <>
            {filtered.map(n => (
              <button
                key={n.id}
                type="button"
                onClick={() => handleNotifClick(n)}
                className={`w-full text-left px-4 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition flex gap-3 items-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-teal ${
                  !n.isRead ? 'bg-sky-50/60 border-l-2 border-l-brand-teal' : ''
                }`}
              >
                <NotifIcon type={n.type} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                    {n.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <span className="w-2.5 h-2.5 bg-brand-teal rounded-full flex-shrink-0 mt-1.5" aria-label="Unread" />
                )}
              </button>
            ))}

            {/* Load more */}
            {activeTab === 'all' && hasMore && (
              <div className="px-4 py-3 border-t border-gray-100 text-center">
                <button
                  onClick={handleLoadMore}
                  className="text-sm text-brand-teal hover:text-brand-navy font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal rounded"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Back link */}
      <div className="mt-6 text-center">
        <Link href="javascript:history.back()" className="text-sm text-gray-400 hover:text-gray-600 transition">
          &larr; Go back
        </Link>
      </div>
    </div>
  )
}
