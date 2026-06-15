'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  readAt: string | null
  referenceId: string | null
  referenceType: string | null
  payload: Record<string, unknown> | null
  actionUrl: string | null
}

interface UseNotificationsReturn {
  notifications: NotificationItem[]
  unreadCount: number
  loading: boolean
  markRead: (notifId: string) => Promise<void>
  markAllRead: () => Promise<void>
  refetch: () => Promise<void>
  prependNotification: (n: NotificationItem) => void
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

export function useNotifications(userId: string | undefined, limit = 15): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const lastFetchRef = useRef<number>(0)

  const refetch = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${userId}/notifications?limit=${limit}`, { credentials: 'include' })
      if (!res.ok) return
      const json = await res.json()
      if (!json.success) return
      const mapped = (json.data as any[]).map(mapRaw)
      setNotifications(mapped)
      setUnreadCount(json.meta?.unreadCount ?? mapped.filter(n => !n.isRead).length)
      lastFetchRef.current = Date.now()
    } catch {
      // silent - bell gracefully shows stale data
    } finally {
      setLoading(false)
    }
  }, [userId, limit])

  // Initial fetch + unread count polling every 60s
  useEffect(() => {
    if (!userId) return
    refetch()
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/users/${userId}/notifications?limit=1&unreadOnly=true`, { credentials: 'include' })
        if (!res.ok) return
        const json = await res.json()
        if (json.meta?.unreadCount != null) setUnreadCount(json.meta.unreadCount)
      } catch { /* silent */ }
    }, 60_000)
    return () => clearInterval(interval)
  }, [userId, refetch])

  // Real-time: listen to the CustomEvent dispatched by DashboardLayout's socket handler
  useEffect(() => {
    const handler = (e: Event) => {
      const data = (e as CustomEvent).detail as any
      if (!data?.id) return
      const incoming = mapRaw({ ...data, readAt: null })
      setNotifications(prev => {
        if (prev.some(n => n.id === incoming.id)) return prev
        return [incoming, ...prev].slice(0, limit)
      })
      setUnreadCount(prev => prev + 1)
    }
    window.addEventListener('notification:new', handler)
    return () => window.removeEventListener('notification:new', handler)
  }, [limit])

  // Listen to notification:read and notification:read-all socket events
  useEffect(() => {
    const handleRead = (e: Event) => {
      const { id } = (e as CustomEvent).detail ?? {}
      if (!id) return
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n),
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    const handleReadAll = () => {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: n.readAt ?? new Date().toISOString() })))
      setUnreadCount(0)
    }
    window.addEventListener('notification:read', handleRead)
    window.addEventListener('notification:read-all', handleReadAll)
    return () => {
      window.removeEventListener('notification:read', handleRead)
      window.removeEventListener('notification:read-all', handleReadAll)
    }
  }, [])

  const markRead = useCallback(async (notifId: string) => {
    if (!userId) return
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => n.id === notifId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n),
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
    try {
      await fetch(`/api/users/${userId}/notifications/${notifId}`, {
        method: 'PATCH',
        credentials: 'include',
      })
    } catch { /* silent - optimistic update stays */ }
  }, [userId])

  const markAllRead = useCallback(async () => {
    if (!userId) return
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: n.readAt ?? new Date().toISOString() })))
    setUnreadCount(0)
    try {
      await fetch(`/api/users/${userId}/notifications/read-all`, {
        method: 'PATCH',
        credentials: 'include',
      })
    } catch { /* silent */ }
  }, [userId])

  const prependNotification = useCallback((n: NotificationItem) => {
    setNotifications(prev => {
      if (prev.some(x => x.id === n.id)) return prev
      return [n, ...prev].slice(0, limit)
    })
    setUnreadCount(prev => prev + 1)
  }, [limit])

  return { notifications, unreadCount, loading, markRead, markAllRead, refetch, prependNotification }
}
