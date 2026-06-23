'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  FaBell,
  FaCalendarCheck,
  FaComment,
  FaWallet,
  FaInfoCircle,
  FaCheckDouble,
  FaFlask,
  FaHeartbeat,
  FaBoxOpen,
} from 'react-icons/fa'
import { useNotifications, type NotificationItem } from '@/hooks/useNotifications'

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

function NotifIcon({ type }: { type: string }) {
  const cls = 'text-sm flex-shrink-0 mt-0.5'
  switch (type) {
    case 'appointment':
    case 'booking':
    case 'booking_request':
    case 'booking_cancelled':
    case 'workflow':
      return <FaCalendarCheck className={`${cls} text-brand-teal`} aria-hidden="true" />
    case 'message':
    case 'chat':
      return <FaComment className={`${cls} text-blue-500`} aria-hidden="true" />
    case 'payment':
    case 'wallet':
    case 'insurance':
    case 'corporate_enrollment':
      return <FaWallet className={`${cls} text-emerald-500`} aria-hidden="true" />
    case 'lab_result':
    case 'lab_test_booking':
      return <FaFlask className={`${cls} text-purple-500`} aria-hidden="true" />
    case 'health':
    case 'emergency':
      return <FaHeartbeat className={`${cls} text-red-500`} aria-hidden="true" />
    case 'inventory':
    case 'order':
      return <FaBoxOpen className={`${cls} text-orange-500`} aria-hidden="true" />
    case 'system':
      return <FaBell className={`${cls} text-faint`} aria-hidden="true" />
    default:
      return <FaInfoCircle className={`${cls} text-faint`} aria-hidden="true" />
  }
}

function SkeletonRow() {
  return (
    <div className="px-4 py-3 border-b border-line animate-pulse">
      <div className="flex gap-3">
        <div className="w-4 h-4 bg-line rounded-full mt-0.5 flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-line rounded w-3/4" />
          <div className="h-3 bg-line rounded w-full" />
          <div className="h-2 bg-subtle rounded w-1/4" />
        </div>
      </div>
    </div>
  )
}

interface NotificationBellProps {
  userId: string
  /** Used to compute relative action URLs for notification clicks */
  profileHref?: string
}

export default function NotificationBell({ userId, profileHref }: NotificationBellProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pulse, setPulse] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const lastOpenRef = useRef<number>(0)

  const { notifications, unreadCount, loading, markRead, markAllRead, refetch } = useNotifications(userId)

  // Animate bell when a new notification arrives
  useEffect(() => {
    const handler = () => {
      setPulse(true)
      setTimeout(() => setPulse(false), 1000)
    }
    window.addEventListener('notification:new', handler)
    return () => window.removeEventListener('notification:new', handler)
  }, [])

  // Close panel on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  const handleBellClick = useCallback(() => {
    const next = !open
    setOpen(next)
    if (next) {
      const now = Date.now()
      // Re-fetch if panel was closed more than 60s ago
      if (now - lastOpenRef.current > 60_000) refetch()
      lastOpenRef.current = now
    }
  }, [open, refetch])

  const handleNotifClick = useCallback(async (n: NotificationItem) => {
    if (!n.isRead) await markRead(n.id)
    setOpen(false)
    const href = resolveHref(n, profileHref)
    if (href) router.push(href)
  }, [markRead, profileHref, router])

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={handleBellClick}
        className={`relative p-2.5 md:p-3 text-soft hover:text-brand-teal bg-subtle rounded-lg hover:bg-sky-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal ${pulse ? 'animate-bounce' : ''}`}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <FaBell className="text-base md:text-lg" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none"
            aria-hidden="true"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="region"
          aria-label="Notifications"
          aria-live="polite"
          className="fixed left-0 right-0 top-[60px] max-h-[calc(100vh-60px)] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 w-full sm:w-96 bg-surface sm:rounded-xl shadow-2xl border border-line z-50 sm:max-h-[480px] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-subtle flex-shrink-0">
            <h3 className="font-semibold text-fg text-sm" id="notif-panel-heading">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-[10px] font-bold bg-red-100 text-red-600 rounded-full px-1.5 py-0.5">
                  {unreadCount} new
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead()}
                className="text-xs text-brand-teal hover:text-brand-navy flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal rounded"
                aria-label="Mark all notifications as read"
              >
                <FaCheckDouble className="text-[10px]" aria-hidden="true" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div
            className="overflow-y-auto flex-1"
            role="list"
            aria-labelledby="notif-panel-heading"
          >
            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <FaBell className="text-3xl text-gray-200 mb-3" aria-hidden="true" />
                <p className="text-sm font-medium text-soft">You&apos;re all caught up!</p>
                <p className="text-xs text-faint mt-1">No new notifications right now.</p>
              </div>
            ) : (
              notifications.map(n => (
                <NotifRow key={n.id} notif={n} onClick={handleNotifClick} />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t bg-subtle px-4 py-2.5 flex-shrink-0">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-brand-teal hover:text-brand-navy font-medium flex items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal rounded"
            >
              See all notifications &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

//  Notification row 

interface NotifRowProps {
  notif: NotificationItem
  onClick: (n: NotificationItem) => void
}

function NotifRow({ notif, onClick }: NotifRowProps) {
  return (
    <button
      type="button"
      role="listitem"
      onClick={() => onClick(notif)}
      className={`w-full text-left px-4 py-3 border-b border-line hover:bg-subtle transition flex gap-3 items-start ${!notif.isRead ? 'bg-sky-50/60 border-l-2 border-l-brand-teal' : ''}`}
    >
      <NotifIcon type={notif.type} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${!notif.isRead ? 'font-semibold text-fg' : 'font-medium text-soft'}`}>
          {notif.title}
        </p>
        <p className="text-xs text-soft mt-0.5 line-clamp-2">{notif.message}</p>
        <p className="text-[10px] text-faint mt-1">{timeAgo(notif.createdAt)}</p>
      </div>
      {!notif.isRead && (
        <span className="w-2 h-2 bg-brand-teal rounded-full flex-shrink-0 mt-1.5" aria-label="Unread" />
      )}
    </button>
  )
}

//  URL resolution helper 

function resolveHref(n: NotificationItem, profileHref?: string): string | null {
  // Payload may carry an explicit href
  if (n.actionUrl) return n.actionUrl
  if (n.payload && typeof n.payload === 'object') {
    const p = n.payload as Record<string, any>
    if (p.href) return p.href
  }

  const base = profileHref ? profileHref.replace(/\/profile$/, '') : ''

  // Workflow notifications  booking detail
  if ((n.type === 'workflow' || n.type === 'review_request') && n.referenceId && n.referenceType) {
    return `${base}/bookings/${n.referenceType}/${n.referenceId}`
  }

  // Generic type-based routing
  const typeMap: Record<string, string> = {
    appointment: '/practice',
    booking: '/practice',
    booking_request: '/practice',
    booking_cancelled: '/practice',
    prescription: '/practice',
    lab_result: '/practice',
    lab_test_booking: '/practice',
    message: '/messages',
    chat: '/messages',
    connection: '/network',
    emergency: '/practice',
    corporate_enrollment: '/my-company',
    insurance: '/my-company',
    payment: '/wallet',
    wallet: '/wallet',
  }
  const key = n.type?.toLowerCase()
  if (key && typeMap[key]) return `${base}${typeMap[key]}`

  return null
}
