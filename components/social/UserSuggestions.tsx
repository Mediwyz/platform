'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FaUserPlus, FaUserMd, FaUserNurse, FaChild, FaFlask, FaAmbulance } from 'react-icons/fa'
import { getUserTypeLabel } from '@/lib/constants/userTypeStyles'
import { initialsAvatar, avatarSrc } from '@/lib/utils/avatar'

interface SuggestedUser {
 id: string
 firstName: string
 lastName: string
 profileImage: string | null
 userType: string
 specialty?: string[]
 connectionStatus: 'none' | 'pending' | 'accepted'
}

interface UserSuggestionsProps {
 currentUserId: string
 maxResults?: number
 className?: string
}

const typeIcons: Record<string, React.ReactNode> = {
 DOCTOR: <FaUserMd className="text-blue-500" />,
 NURSE: <FaUserNurse className="text-purple-500" />,
 NANNY: <FaChild className="text-orange-500" />,
 LAB_TECHNICIAN: <FaFlask className="text-cyan-500" />,
 EMERGENCY_WORKER: <FaAmbulance className="text-red-500" />,
}

function avatarUrl(user: SuggestedUser): string {
 return avatarSrc(user.profileImage, user.firstName, user.lastName)
}

export default function UserSuggestions({ currentUserId, maxResults = 7, className = '' }: UserSuggestionsProps) {
 const [suggestions, setSuggestions] = useState<SuggestedUser[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState('')
 const [sendingTo, setSendingTo] = useState<string | null>(null)

 const fetchSuggestions = useCallback(async () => {
 try {
 setError('')
 setLoading(true)
 const res = await fetch(`/api/connections/suggestions?userId=${currentUserId}&limit=${maxResults}`, { credentials: 'include' })
 const data = await res.json()
 if (data.success) {
 setSuggestions(data.data)
 }
 } catch {
 setError('Failed to load suggestions. Please try again.')
 } finally {
 setLoading(false)
 }
 }, [currentUserId, maxResults])

 useEffect(() => {
 fetchSuggestions()
 }, [fetchSuggestions])

 const handleConnect = async (targetId: string) => {
 setSendingTo(targetId)
 try {
 const res = await fetch('/api/connections', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ senderId: currentUserId, receiverId: targetId }),
 credentials: 'include',
 })
 const data = await res.json()
 if (data.success) {
 setSuggestions(prev =>
 prev.map(u => u.id === targetId ? { ...u, connectionStatus: 'pending' } : u)
 )
 }
 } catch {
 // silent
 } finally {
 setSendingTo(null)
 }
 }

 if (loading) {
 return (
 <div className={`bg-white rounded-sm shadow p-4 ${className}`}>
 <h3 className="font-semibold text-gray-900 mb-3">People You May Know</h3>
 <div className="space-y-3">
 {Array.from({ length: 7 }).map((_, i) => (
 <div key={i} className="animate-pulse flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-gray-200" />
 <div className="flex-1">
 <div className="h-3 bg-gray-200 rounded w-24 mb-1" />
 <div className="h-2 bg-gray-100 rounded w-16" />
 </div>
 </div>
 ))}
 </div>
 </div>
 )
 }

 if (error) {
 return (
 <div className={`bg-white rounded-sm shadow p-4 ${className}`}>
 <h3 className="font-semibold text-gray-900 mb-3">People You May Know</h3>
 <div className="bg-red-50 border border-red-200 rounded-sm p-6 text-center">
 <p className="text-red-600 text-sm mb-3">{error}</p>
 <button onClick={fetchSuggestions} className="text-sm text-red-700 font-medium hover:text-red-800 underline">
 Try again
 </button>
 </div>
 </div>
 )
 }

 if (suggestions.length === 0) return null

 return (
 <div className={`bg-white rounded-sm shadow p-4 ${className}`}>
 <h3 className="font-semibold text-gray-900 mb-3">People You May Know</h3>
 <div className="space-y-3">
 {suggestions.map(user => {
 return (
 <div key={user.id} className="flex items-center gap-3">
 <Link href={`/profile/${user.id}`} className="flex-shrink-0">
 <Image
 src={avatarUrl(user)}
 alt={`${user.firstName} ${user.lastName}`}
 width={40}
 height={40}
 className="w-10 h-10 rounded-full object-cover border-2 border-gray-100 bg-gray-100"
 onError={e => { e.currentTarget.src = initialsAvatar(user.firstName, user.lastName) }}
 />
 </Link>
 <div className="flex-1 min-w-0">
 <Link href={`/profile/${user.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 transition truncate block">
 {user.firstName} {user.lastName}
 </Link>
 <div className="flex items-center gap-1.5">
 {typeIcons[user.userType] || null}
 <span className="text-xs text-gray-500">{getUserTypeLabel(user.userType)}</span>
 </div>
 {user.specialty && user.specialty.length > 0 && (
 <p className="text-xs text-gray-400 truncate">{user.specialty.join(', ')}</p>
 )}
 </div>
 {user.connectionStatus === 'none' && (
 <button
 onClick={() => handleConnect(user.id)}
 disabled={sendingTo === user.id}
 className="flex-shrink-0 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-50"
 aria-label="Send connection request"
 >
 {sendingTo === user.id ? (
 <span className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent inline-block" />
 ) : (
 <FaUserPlus className="text-sm" />
 )}
 </button>
 )}
 {user.connectionStatus === 'pending' && (
 <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">Pending</span>
 )}
 {user.connectionStatus === 'accepted' && (
 <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">Connected</span>
 )}
 </div>
 )
 })}
 </div>
 </div>
 )
}
