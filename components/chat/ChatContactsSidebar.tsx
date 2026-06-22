'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { FaComments, FaCircle } from 'react-icons/fa'
import Link from 'next/link'
import { initialsAvatar, avatarSrc } from '@/lib/utils/avatar'

interface Participant {
 userId: string
 firstName: string
 lastName: string
 userType: string
 avatarUrl?: string | null
}

interface ConversationSummary {
 id: string
 type: string
 participants: Participant[]
 lastMessage: { id: string; content: string; senderId: string; createdAt: string } | null
 unreadCount: number
 updatedAt: string
}

interface ChatContactsSidebarProps {
 currentUserId: string
 messagesPath: string
}

const USER_TYPE_COLORS: Record<string, string> = {
 DOCTOR: 'text-green-500',
 NURSE: 'text-teal-500',
 PATIENT: 'text-blue-500',
 PHARMACIST: 'text-purple-500',
 NANNY: 'text-yellow-500',
 LAB_TECHNICIAN: 'text-cyan-500',
 EMERGENCY_WORKER: 'text-red-500',
 INSURANCE_REP: 'text-emerald-500',
 CORPORATE_ADMIN: 'text-indigo-500',
 REFERRAL_PARTNER: 'text-orange-500',
 REGIONAL_ADMIN: 'text-slate-500',
}

const USER_TYPE_LABELS: Record<string, string> = {
 DOCTOR: 'Doctor',
 NURSE: 'Nurse',
 PATIENT: 'Patient',
 PHARMACIST: 'Pharmacist',
 NANNY: 'Nanny',
 LAB_TECHNICIAN: 'Lab Tech',
 EMERGENCY_WORKER: 'Emergency',
 INSURANCE_REP: 'Insurance',
 CORPORATE_ADMIN: 'Corporate',
 REFERRAL_PARTNER: 'Referral',
 REGIONAL_ADMIN: 'Admin',
}

function avatarUrl(p: Participant): string {
 return avatarSrc(p.avatarUrl, p.firstName, p.lastName)
}

function timeAgo(dateStr: string): string {
 const diff = Date.now() - new Date(dateStr).getTime()
 const mins = Math.floor(diff / 60000)
 if (mins < 1) return 'now'
 if (mins < 60) return `${mins}m`
 const hrs = Math.floor(mins / 60)
 if (hrs < 24) return `${hrs}h`
 const days = Math.floor(hrs / 24)
 return `${days}d`
}

export default function ChatContactsSidebar({ currentUserId, messagesPath }: ChatContactsSidebarProps) {
 const [conversations, setConversations] = useState<ConversationSummary[]>([])
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 async function fetchConversations() {
 try {
 const res = await fetch('/api/conversations', { credentials: 'include' })
 if (!res.ok) return
 const json = await res.json()
 if (json.success) {
 setConversations(json.data)
 }
 } catch {
 // silently ignore
 } finally {
 setLoading(false)
 }
 }
 fetchConversations()
 }, [])

 const getOtherParticipant = (conv: ConversationSummary): Participant | undefined => {
 return conv.participants.find((p) => p.userId !== currentUserId)
 }

 return (
 <div className="bg-surface rounded-2xl shadow-sm border border-line overflow-hidden h-fit sticky top-4">
 {/* Header */}
 <div className="px-4 py-3 border-b border-line flex items-center justify-between">
 <div className="flex items-center gap-2">
 <FaComments className="text-[#0C6780] dark:text-accent text-sm" />
 <h3 className="font-semibold text-fg text-sm">Messages</h3>
 </div>
 <Link
 href={messagesPath}
 className="text-xs text-[#0C6780] dark:text-accent hover:underline font-medium"
 >
 See all
 </Link>
 </div>

 {/* Contacts list */}
 <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
 {loading ? (
 <div className="p-4 space-y-3">
 {[1, 2, 3, 4].map((i) => (
 <div key={i} className="flex items-center gap-3 animate-pulse">
 <div className="w-9 h-9 rounded-full bg-subtle flex-shrink-0" />
 <div className="flex-1 min-w-0">
 <div className="h-3 bg-subtle rounded w-24" />
 <div className="h-2.5 bg-subtle rounded w-16 mt-1.5" />
 </div>
 </div>
 ))}
 </div>
 ) : conversations.length === 0 ? (
 <div className="p-4 text-center">
 <p className="text-xs text-faint">No conversations yet</p>
 </div>
 ) : (
 <div className="py-1">
 {conversations.map((conv) => {
 const other = getOtherParticipant(conv)
 if (!other) return null
 const typeColor = USER_TYPE_COLORS[other.userType] || 'text-gray-500'
 const typeLabel = USER_TYPE_LABELS[other.userType] || other.userType

 return (
 <Link
 key={conv.id}
 href={`${messagesPath}?conversationId=${conv.id}`}
 className="flex items-center gap-3 px-4 py-2.5 hover:bg-subtle transition-colors group"
 >
 {/* Avatar */}
 <div className="relative flex-shrink-0">
 <Image
   src={avatarUrl(other)}
   alt={`${other.firstName} ${other.lastName}`}
   width={36}
   height={36}
   className="w-9 h-9 rounded-full object-cover border border-line bg-subtle"
   onError={e => { e.currentTarget.src = initialsAvatar(other.firstName, other.lastName) }}
 />
 {conv.unreadCount > 0 && (
 <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
 {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
 </span>
 )}
 </div>

 {/* Info */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between">
 <p className={`text-sm font-medium truncate ${conv.unreadCount > 0 ? 'text-fg' : 'text-soft'}`}>
 {other.firstName} {other.lastName}
 </p>
 {conv.lastMessage && (
 <span className="text-[10px] text-faint flex-shrink-0 ml-1">
 {timeAgo(conv.lastMessage.createdAt)}
 </span>
 )}
 </div>
 <div className="flex items-center gap-1">
 <FaCircle className={`text-[6px] ${typeColor} flex-shrink-0`} />
 <span className="text-[11px] text-faint truncate">
 {typeLabel}
 </span>
 </div>
 {conv.lastMessage && (
 <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-soft font-medium' : 'text-faint'}`}>
 {conv.lastMessage.senderId === currentUserId ? 'You: ' : ''}{conv.lastMessage.content}
 </p>
 )}
 </div>
 </Link>
 )
 })}
 </div>
 )}
 </div>
 </div>
 )
}
