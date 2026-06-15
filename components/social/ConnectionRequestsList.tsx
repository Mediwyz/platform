'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FaCheck, FaTimes, FaUserMd, FaUserNurse, FaChild, FaFlask, FaAmbulance, FaUsers } from 'react-icons/fa'
import { getUserTypeLabel } from '@/lib/constants/userTypeStyles'
import { avatarSrc } from '@/lib/utils/avatar'
import UserSuggestions from './UserSuggestions'
import SuggestionsGrid from './SuggestionsGrid'

interface ConnectionPerson {
 id: string
 firstName: string
 lastName: string
 profileImage: string | null
 userType: string
}

interface ConnectionRequest {
 id: string
 senderId: string
 sender: ConnectionPerson
 receiver: ConnectionPerson
 createdAt: string
 status: string
}

interface ConnectionRequestsListProps {
 userId: string
}

export default function ConnectionRequestsList({ userId }: ConnectionRequestsListProps) {
 const [requests, setRequests] = useState<ConnectionRequest[]>([])
 const [loading, setLoading] = useState(true)
 const [actioning, setActioning] = useState<string | null>(null)
 const [tab, setTab] = useState<'requests' | 'connections'>('requests')
 const [connections, setConnections] = useState<ConnectionRequest[]>([])

 useEffect(() => {
 const fetchData = async () => {
 try {
 const [reqRes, connRes] = await Promise.all([
 fetch(`/api/connections?userId=${userId}&type=received&status=pending`, { credentials: 'include' }),
 fetch(`/api/connections?userId=${userId}&type=all&status=accepted`, { credentials: 'include' }),
 ])
 const reqData = await reqRes.json()
 const connData = await connRes.json()
 if (reqData.success) setRequests(reqData.data || [])
 if (connData.success) setConnections(connData.data || [])
 } catch {
 // silent
 } finally {
 setLoading(false)
 }
 }
 fetchData()
 }, [userId])

 const handleAction = async (connectionId: string, action: 'accepted' | 'rejected') => {
 setActioning(connectionId)
 try {
 const res = await fetch(`/api/connections/${connectionId}`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ action: action === 'accepted' ? 'accept' : 'reject' }),
 credentials: 'include',
 })
 const data = await res.json()
 if (data.success) {
 if (action === 'accepted') {
 const accepted = requests.find(r => r.id === connectionId)
 if (accepted) {
 setConnections(prev => [{ ...accepted, status: 'accepted' }, ...prev])
 }
 }
 setRequests(prev => prev.filter(r => r.id !== connectionId))
 }
 } catch {
 // silent
 } finally {
 setActioning(null)
 }
 }

 const typeIcons: Record<string, React.ReactNode> = {
 DOCTOR: <FaUserMd className="text-blue-500 text-xs" />,
 NURSE: <FaUserNurse className="text-purple-500 text-xs" />,
 NANNY: <FaChild className="text-orange-500 text-xs" />,
 LAB_TECHNICIAN: <FaFlask className="text-cyan-500 text-xs" />,
 EMERGENCY_WORKER: <FaAmbulance className="text-red-500 text-xs" />,
 }

 function timeAgo(dateStr: string): string {
 const diff = Date.now() - new Date(dateStr).getTime()
 const minutes = Math.floor(diff / 60000)
 if (minutes < 1) return 'Just now'
 if (minutes < 60) return `${minutes}m ago`
 const hours = Math.floor(minutes / 60)
 if (hours < 24) return `${hours}h ago`
 const days = Math.floor(hours / 24)
 return `${days}d ago`
 }

 return (
 <div className="max-w-4xl mx-auto">
 <div className="flex items-center gap-3 mb-6">
 <div className="w-10 h-10 rounded-xl flex items-center justify-center">
 <FaUsers className="text-white text-lg" />
 </div>
 <div>
 <h1 className="text-2xl font-bold text-gray-900">My Network</h1>
 <p className="text-sm text-gray-500">Manage your connections and requests</p>
 </div>
 </div>

 {/* Tabs */}
 <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
 <button
 onClick={() => setTab('requests')}
 className={`px-4 py-2 rounded-md text-sm font-medium transition ${
 tab === 'requests'
 ? 'bg-white text-blue-600 shadow-sm'
 : 'text-gray-600 hover:text-gray-900'
 }`}
 >
 Requests {requests.length > 0 && (
 <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
 {requests.length}
 </span>
 )}
 </button>
 <button
 onClick={() => setTab('connections')}
 className={`px-4 py-2 rounded-md text-sm font-medium transition ${
 tab === 'connections'
 ? 'bg-white text-blue-600 shadow-sm'
 : 'text-gray-600 hover:text-gray-900'
 }`}
 >
 Connections ({connections.length})
 </button>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Main content */}
 <div className="lg:col-span-2">
 {loading ? (
 <div className="bg-white rounded-xl shadow-sm border p-6">
 <div className="space-y-4">
 {[1, 2, 3].map(i => (
 <div key={i} className="animate-pulse flex items-center gap-4">
 <div className="w-12 h-12 rounded-full bg-gray-200" />
 <div className="flex-1">
 <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
 <div className="h-3 bg-gray-100 rounded w-20" />
 </div>
 </div>
 ))}
 </div>
 </div>
 ) : tab === 'requests' ? (
 <div className="bg-white rounded-xl shadow-sm border">
 {requests.length === 0 ? (
 <div className="p-8 text-center text-gray-500">
 <FaUsers className="text-4xl text-gray-300 mx-auto mb-3" />
 <p className="font-medium">No pending requests</p>
 <p className="text-sm mt-1">When someone sends you a connection request, it will appear here.</p>
 </div>
 ) : (
 <div className="divide-y">
 {requests.map(req => {
 return (
 <div key={req.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition">
 <Link href={`/profile/${req.sender.id}`} className="flex-shrink-0">
 <Image
 src={avatarSrc(req.sender.profileImage, req.sender.firstName, req.sender.lastName)}
 alt={`${req.sender.firstName} ${req.sender.lastName}`}
 width={48}
 height={48}
 className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 bg-gray-100"
 />
 </Link>
 <div className="flex-1 min-w-0">
 <Link href={`/profile/${req.sender.id}`} className="font-medium text-gray-900 hover:text-blue-600 transition">
 {req.sender.firstName} {req.sender.lastName}
 </Link>
 <div className="flex items-center gap-1.5">
 {typeIcons[req.sender.userType]}
 <span className="text-xs text-gray-500">{getUserTypeLabel(req.sender.userType)}</span>
 <span className="text-xs text-gray-400 ml-2">{timeAgo(req.createdAt)}</span>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button
 onClick={() => handleAction(req.id, 'accepted')}
 disabled={actioning === req.id}
 className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
 >
 <FaCheck className="text-xs" /> Accept
 </button>
 <button
 onClick={() => handleAction(req.id, 'rejected')}
 disabled={actioning === req.id}
 className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
 >
 <FaTimes className="text-xs" /> Decline
 </button>
 </div>
 </div>
 )
 })}
 </div>
 )}
 </div>
 ) : (
 <div className="bg-white rounded-xl shadow-sm border">
 {connections.length === 0 ? (
 <div className="p-8 text-center text-gray-500">
 <FaUsers className="text-4xl text-gray-300 mx-auto mb-3" />
 <p className="font-medium">No connections yet</p>
 <p className="text-sm mt-1">Connect with healthcare professionals to grow your network.</p>
 </div>
 ) : (
 <div className="divide-y">
 {connections.map(conn => {
 const person = conn.senderId === userId ? conn.receiver : conn.sender
 return (
 <div key={conn.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition">
 <Link href={`/profile/${person.id}`} className="flex-shrink-0">
 <Image
 src={avatarSrc(person.profileImage, person.firstName, person.lastName)}
 alt={`${person.firstName} ${person.lastName}`}
 width={48}
 height={48}
 className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 bg-gray-100"
 />
 </Link>
 <div className="flex-1 min-w-0">
 <Link href={`/profile/${person.id}`} className="font-medium text-gray-900 hover:text-blue-600 transition">
 {person.firstName} {person.lastName}
 </Link>
 <div className="flex items-center gap-1.5 mt-0.5">
 {typeIcons[person.userType]}
 <span className="text-xs text-gray-500">{getUserTypeLabel(person.userType)}</span>
 </div>
 </div>
 <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">Connected</span>
 </div>
 )
 })}
 </div>
 )}
 </div>
 )}
 </div>

 {/* Right sidebar: Suggestions */}
 <div className="lg:col-span-1">
 <UserSuggestions currentUserId={userId} maxResults={8} />
 </div>
 </div>

 {/* Paginated suggestions grid - all users including MEMBER */}
 <SuggestionsGrid currentUserId={userId} />
 </div>
 )
}
