'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FaEnvelope } from 'react-icons/fa'

// Maps the mediwyz_userType cookie value to the user's chat URL segment
// All roles use /messages clean URL - middleware rewrites to correct folder
const USER_TYPE_CHAT_ROUTES: Record<string, string> = {
 patient: '/messages',
 doctor: '/messages',
 nurse: '/messages',
 'child-care-nurse': '/messages',
 pharmacy: '/messages',
 lab: '/messages',
 ambulance: '/messages',
 insurance: '/insurance/messages',
 corporate: '/corporate/messages',
 'referral-partner': '/referral-partner/messages',
 admin: '/admin/messages',
 'regional-admin': '/regional/messages',
}

interface MessageButtonProps {
 providerId: string
 className?: string
}

export default function MessageButton({ providerId, className = '' }: MessageButtonProps) {
 const router = useRouter()
 const [loading, setLoading] = useState(false)
 const [error, setError] = useState<string | null>(null)

 const getUserTypeCookie = useCallback((): string | null => {
 if (typeof document === 'undefined') return null
 const match = document.cookie
 .split(';')
 .find((c) => c.trim().startsWith('mediwyz_userType='))
 if (!match) return null
 return decodeURIComponent(match.trim().split('=')[1] ?? '')
 }, [])

 const isAuthenticated = useCallback((): boolean => {
 return getUserTypeCookie() !== null
 }, [getUserTypeCookie])

 const handleMessage = async () => {
 if (!isAuthenticated()) {
 router.push('/login')
 return
 }

 setLoading(true)
 setError(null)

 try {
 const res = await fetch('/api/conversations', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 credentials: 'include',
 body: JSON.stringify({ participantIds: [providerId] }),
 })

 const json = await res.json()

 if (!res.ok || !json.success) {
 setError(json.message ?? 'Failed to start conversation')
 return
 }

 const conversationId: string = json.data?.id
 const userTypeCookie = getUserTypeCookie() ?? 'patient'
 const baseRoute = USER_TYPE_CHAT_ROUTES[userTypeCookie] ?? '/messages'
 const chatUrl = conversationId ? `${baseRoute}?conversation=${conversationId}` : baseRoute

 router.push(chatUrl)
 } catch {
 setError('Could not start conversation. Please try again.')
 } finally {
 setLoading(false)
 }
 }

 return (
 <>
 <button
 onClick={handleMessage}
 disabled={loading}
 className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-subtle text-soft hover:bg-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors ${className}`}
 aria-label="Send a message"
 >
 <FaEnvelope className="w-4 h-4" />
 {loading ? 'Opening…' : 'Message'}
 </button>
 {error && (
 <span className="text-xs text-red-500 col-span-2" role="alert">
 {error}
 </span>
 )}
 </>
 )
}
