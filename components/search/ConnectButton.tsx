'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FaUserPlus, FaUserCheck, FaClock } from 'react-icons/fa'

type ConnectionStatus = 'none' | 'pending' | 'accepted'

interface ConnectButtonProps {
 providerId: string
 className?: string
}

interface ConnectionRecord {
 id: string
 status: string
 sender: { id: string }
 receiver: { id: string }
}

export default function ConnectButton({ providerId, className = '' }: ConnectButtonProps) {
 const router = useRouter()
 const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('none')
 const [, setConnectionId] = useState<string | null>(null)
 const [loading, setLoading] = useState(true)
 const [acting, setActing] = useState(false)

 const isAuthenticated = useCallback((): boolean => {
 if (typeof document === 'undefined') return false
 return document.cookie
 .split(';')
 .some((c) => c.trim().startsWith('mediwyz_userType='))
 }, [])

 const checkExistingConnection = useCallback(async () => {
 if (!isAuthenticated()) {
 setLoading(false)
 return
 }

 try {
 const res = await fetch('/api/connections', { credentials: 'include' })
 if (!res.ok) {
 setLoading(false)
 return
 }

 const json = await res.json()
 if (!json.success) {
 setLoading(false)
 return
 }

 const connections: ConnectionRecord[] = json.data ?? []

 const match = connections.find(
 (c) => c.sender.id === providerId || c.receiver.id === providerId
 )

 if (match) {
 setConnectionId(match.id)
 if (match.status === 'accepted') {
 setConnectionStatus('accepted')
 } else if (match.status === 'pending') {
 setConnectionStatus('pending')
 } else {
 setConnectionStatus('none')
 }
 } else {
 setConnectionStatus('none')
 }
 } catch {
 setConnectionStatus('none')
 } finally {
 setLoading(false)
 }
 }, [providerId, isAuthenticated])

 useEffect(() => {
 checkExistingConnection()
 }, [checkExistingConnection])

 const handleConnect = async () => {
 if (!isAuthenticated()) {
 router.push('/login')
 return
 }

 if (connectionStatus !== 'none') return

 setActing(true)
 try {
 const res = await fetch('/api/connections', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 credentials: 'include',
 body: JSON.stringify({ receiverId: providerId }),
 })

 const json = await res.json()

 if (res.ok && json.success) {
 setConnectionId(json.data.id)
 setConnectionStatus('pending')
 } else if (res.status === 409 && json.data) {
 // Already exists
 setConnectionId(json.data.id)
 const status: string = json.data.status ?? 'pending'
 setConnectionStatus(status === 'accepted' ? 'accepted' : 'pending')
 }
 } catch {
 // Silently fail - user can retry
 } finally {
 setActing(false)
 }
 }

 if (loading) {
 return (
 <button
 disabled
 className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-subtle text-faint cursor-not-allowed ${className}`}
 aria-label="Loading connection status"
 >
 <FaUserPlus className="w-4 h-4" />
 Connect
 </button>
 )
 }

 if (connectionStatus === 'accepted') {
 return (
 <button
 disabled
 className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-700 cursor-default ${className}`}
 aria-label="Already connected"
 >
 <FaUserCheck className="w-4 h-4" />
 Connected
 </button>
 )
 }

 if (connectionStatus === 'pending') {
 return (
 <button
 disabled
 className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-yellow-100 text-yellow-700 cursor-default ${className}`}
 aria-label="Connection request pending"
 >
 <FaClock className="w-4 h-4" />
 Requested
 </button>
 )
 }

 return (
 <button
 onClick={handleConnect}
 disabled={acting}
 className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors ${className}`}
 aria-label="Send connection request"
 >
 <FaUserPlus className="w-4 h-4" />
 {acting ? 'Sending' : 'Connect'}
 </button>
 )
}
