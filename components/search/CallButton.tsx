'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FaPhoneAlt } from 'react-icons/fa'

interface CallButtonProps {
 providerId: string
 className?: string
}

/**
 * Initiates an audio-only call to a provider.
 * Redirects to the video consultation page with audio-only mode.
 * The call goes through WebSocket signaling and must be accepted by the responder.
 */
export default function CallButton({ providerId, className = '' }: CallButtonProps) {
 const router = useRouter()
 const [loading, setLoading] = useState(false)

 const getUserTypeCookie = useCallback((): string | null => {
 if (typeof document === 'undefined') return null
 const match = document.cookie
 .split(';')
 .find((c) => c.trim().startsWith('mediwyz_userType='))
 if (!match) return null
 return decodeURIComponent(match.trim().split('=')[1] ?? '')
 }, [])

 const handleCall = async () => {
 const userType = getUserTypeCookie()
 if (!userType) {
 router.push('/login')
 return
 }

 setLoading(true)
 try {
 // Create a conversation first so the call has a channel
 const res = await fetch('/api/conversations', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 credentials: 'include',
 body: JSON.stringify({ participantIds: [providerId] }),
 })

 const json = await res.json()
 if (!res.ok || !json.success) {
 console.error('Failed to create conversation for call:', json.message)
 return
 }

 // Determine the user's video/call page route
 // All roles use /video clean URL - middleware rewrites to correct folder
 const routeMap: Record<string, string> = {
 patient: '/video',
 doctor: '/video',
 nurse: '/video',
 'child-care-nurse': '/video',
 pharmacy: '/video',
 lab: '/video',
 ambulance: '/video',
 insurance: '/insurance/video',
 corporate: '/corporate/video',
 'referral-partner': '/referral-partner/video',
 admin: '/admin/video',
 'regional-admin': '/regional/video',
 }

 const videoRoute = routeMap[userType] ?? '/video'
 // Navigate to video page with audio-only mode and target provider
 router.push(`${videoRoute}?mode=audio&target=${providerId}`)
 } catch (err) {
 console.error('Failed to initiate call:', err)
 } finally {
 setLoading(false)
 }
 }

 return (
 <button
 onClick={handleCall}
 disabled={loading}
 className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors ${className}`}
 aria-label="Start audio call"
 >
 <FaPhoneAlt className="w-4 h-4" />
 {loading ? 'Calling...' : 'Call'}
 </button>
 )
}
