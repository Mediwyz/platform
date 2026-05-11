'use client'

import { useState, useEffect, useCallback } from 'react'
import {
 FaBell, FaCheck, FaCheckDouble, FaSpinner, FaExclamationCircle,
 FaInfoCircle, FaCheckCircle
} from 'react-icons/fa'
import { useUser } from '@/hooks/useUser'

interface Notification {
 id: string
 title: string
 message: string
 type: string
 read: boolean
 createdAt: string
}

const typeIcons: Record<string, { icon: React.ElementType; color: string }> = {
 info: { icon: FaInfoCircle, color: 'text-blue-500' },
 success: { icon: FaCheckCircle, color: 'text-green-500' },
 warning: { icon: FaExclamationCircle, color: 'text-yellow-500' },
 error: { icon: FaExclamationCircle, color: 'text-red-500' },
}

export default function NotificationsPage() {
 const [notifications, setNotifications] = useState<Notification[]>([])
 const [loading, setLoading] = useState(true)
 const { user: currentUser } = useUser()
 const userId = currentUser?.id ?? ''

 const fetchNotifications = useCallback(async () => {
 if (!userId) return
 try {
 const res = await fetch(`/api/users/${userId}/notifications`, { credentials: 'include' })
 if (res.ok) {
 const json = await res.json()
 if (json.success) {
 setNotifications(json.data || [])
 }
 }
 } catch {
 // keep empty
 } finally {
 setLoading(false)
 }
 }, [userId])

 useEffect(() => {
 if (userId) fetchNotifications()
 }, [userId, fetchNotifications])

 const markAsRead = async (notificationId: string) => {
 try {
 const res = await fetch(`/api/users/${userId}/notifications`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ notificationId, read: true }),
 credentials: 'include',
 })
 if (res.ok) {
 setNotifications((prev) =>
 prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
 )
 }
 } catch { /* ignore */ }
 }

 const markAllRead = async () => {
 try {
 const res = await fetch(`/api/users/${userId}/notifications`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ markAllRead: true }),
 credentials: 'include',
 })
 if (res.ok) {
 setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
 }
 } catch { /* ignore */ }
 }

 const unreadCount = notifications.filter((n) => !n.read).length

 return (
 <div className="p-4 sm:p-6 max-w-4xl mx-auto">
 <div className="flex items-center justify-between mb-6">
 <div className="flex items-center gap-3">
 <FaBell className="text-2xl text-yellow-600" />
 <div>
 <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
 <p className="text-sm text-gray-500">
 {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up'}
 </p>
 </div>
 </div>
 {unreadCount > 0 && (
 <button
 onClick={markAllRead}
 className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
 >
 <FaCheckDouble /> Mark all read
 </button>
 )}
 </div>

 {loading ? (
 <div className="flex justify-center py-16">
 <FaSpinner className="animate-spin text-3xl text-blue-500" />
 </div>
 ) : notifications.length === 0 ? (
 <div className="text-center py-16 bg-white rounded-xl shadow-lg">
 <FaBell className="text-4xl text-gray-300 mx-auto mb-3" />
 <p className="text-gray-500 text-lg font-medium">No notifications</p>
 <p className="text-gray-400 text-sm mt-1">You&apos;re all caught up</p>
 </div>
 ) : (
 <div className="space-y-3">
 {notifications.map((notification) => {
 const typeInfo = typeIcons[notification.type] || typeIcons.info
 const Icon = typeInfo.icon
 return (
 <div
 key={notification.id}
 className={`bg-white rounded-xl p-4 shadow-sm border transition-colors ${
 notification.read ? 'border-gray-100' : 'border-blue-200 bg-blue-50/30'
 }`}
 >
 <div className="flex items-start gap-3">
 <Icon className={`mt-0.5 text-lg ${typeInfo.color} flex-shrink-0`} />
 <div className="flex-1 min-w-0">
 <div className="flex items-start justify-between gap-2">
 <h3 className={`text-sm font-semibold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
 {notification.title}
 </h3>
 <span className="text-xs text-gray-400 flex-shrink-0">
 {new Date(notification.createdAt).toLocaleDateString()}
 </span>
 </div>
 <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
 </div>
 {!notification.read && (
 <button
 onClick={() => markAsRead(notification.id)}
 className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
 title="Mark as read"
 >
 <FaCheck className="text-sm" />
 </button>
 )}
 </div>
 </div>
 )
 })}
 </div>
 )}
 </div>
 )
}
