// components/chat/ChatView.tsx
// Shared chat component for the unified digital health platform.
// Used by ALL user types - patients, doctors, nurses, nannies, pharmacists, etc.

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { FaPaperPlane, FaSearch, FaArrowLeft, FaCheck, FaCheckDouble, FaUserPlus } from 'react-icons/fa'
import { useChat, ChatMessage } from '@/hooks/useChat'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatViewProps {
 currentUser: {
 id: string
 firstName: string
 lastName: string
 userType: string
 }
 initialConversationId?: string | null
}

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
 isNewConnection?: boolean
}

interface AcceptedConnection {
 id: string
 status: string
 sender: { id: string; firstName: string; lastName: string; userType: string; profileImage?: string | null }
 receiver: { id: string; firstName: string; lastName: string; userType: string; profileImage?: string | null }
 updatedAt: string
}

interface Message {
 id: string
 conversationId: string
 senderId: string
 senderName: string
 senderType: string
 content: string
 createdAt: string
 readAt?: string | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getUserTypeColor(userType: string): { bg: string; text: string; label: string } {
 const map: Record<string, { bg: string; text: string; label: string }> = {
 DOCTOR: { bg: 'bg-green-100', text: 'text-green-700', label: 'Doctor' },
 NURSE: { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Nurse' },
 PATIENT: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Patient' },
 PHARMACIST: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Pharmacist' },
 NANNY: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Nanny' },
 LAB_TECHNICIAN: { bg: 'bg-cyan-100', text: 'text-cyan-700', label: 'Lab Tech' },
 EMERGENCY_WORKER: { bg: 'bg-red-100', text: 'text-red-700', label: 'Emergency' },
 INSURANCE_REP: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Insurance' },
 CORPORATE_ADMIN: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Corporate' },
 REFERRAL_PARTNER: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Referral' },
 REGIONAL_ADMIN: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Admin' },
 }
 return map[userType] ?? { bg: 'bg-gray-100', text: 'text-gray-600', label: userType }
}

function formatMessageTime(dateStr: string): string {
 const now = new Date()
 const date = new Date(dateStr)
 const diffMs = now.getTime() - date.getTime()
 const diffMin = Math.floor(diffMs / 60_000)
 const diffHrs = Math.floor(diffMs / 3_600_000)

 if (diffMin < 1) return 'Just now'
 if (diffMin < 60) return `${diffMin}m`
 if (diffHrs < 24) return `${diffHrs}h`

 // Check if yesterday
 const yesterday = new Date(now)
 yesterday.setDate(yesterday.getDate() - 1)
 if (
 date.getDate() === yesterday.getDate() &&
 date.getMonth() === yesterday.getMonth() &&
 date.getFullYear() === yesterday.getFullYear()
 ) {
 return 'Yesterday'
 }

 // Check if within this week (last 7 days)
 const diffDays = Math.floor(diffMs / 86_400_000)
 if (diffDays < 7) {
 const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
 return days[date.getDay()]
 }

 // Otherwise MM/DD/YYYY
 const mm = String(date.getMonth() + 1).padStart(2, '0')
 const dd = String(date.getDate()).padStart(2, '0')
 return `${mm}/${dd}/${date.getFullYear()}`
}

function formatTimestamp(dateStr: string): string {
 const d = new Date(dateStr)
 const h = d.getHours()
 const m = String(d.getMinutes()).padStart(2, '0')
 const ampm = h >= 12 ? 'PM' : 'AM'
 const h12 = h % 12 || 12
 return `${h12}:${m} ${ampm}`
}

function formatDateSeparator(dateStr: string): string {
 const d = new Date(dateStr)
 const now = new Date()
 const yesterday = new Date(now)
 yesterday.setDate(yesterday.getDate() - 1)

 if (d.toDateString() === now.toDateString()) return 'Today'
 if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'

 return d.toLocaleDateString('en-US', {
 weekday: 'long',
 month: 'long',
 day: 'numeric',
 year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
 })
}

function isSameDay(a: string, b: string): boolean {
 return new Date(a).toDateString() === new Date(b).toDateString()
}

function truncate(str: string, max: number): string {
 if (str.length <= max) return str
 return str.slice(0, max) + '...'
}

function getOtherParticipants(participants: Participant[], currentUserId: string): Participant[] {
 const others = participants.filter((p) => p.userId !== currentUserId)
 return others.length > 0 ? others : participants
}

function participantDisplayName(p: Participant): string {
 return `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Unknown'
}

// ---------------------------------------------------------------------------
// UserTypeBadge
// ---------------------------------------------------------------------------

function UserTypeBadge({ userType }: { userType: string }) {
 const { bg, text, label } = getUserTypeColor(userType)
 return (
 <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${bg} ${text}`}>
 {label}
 </span>
 )
}

// ---------------------------------------------------------------------------
// ConversationListItem
// ---------------------------------------------------------------------------

interface ConversationListItemProps {
 conversation: ConversationSummary
 currentUserId: string
 isSelected: boolean
 onSelect: (id: string) => void
}

function ConversationListItem({ conversation, currentUserId, isSelected, onSelect }: ConversationListItemProps) {
 const others = getOtherParticipants(conversation.participants, currentUserId)
 const displayName = others.map(participantDisplayName).join(', ')
 const primaryOther = others[0]

 const isNewConnection = conversation.isNewConnection === true

 const preview = isNewConnection
 ? 'New connection - click to start chatting'
 : conversation.lastMessage
 ? truncate(conversation.lastMessage.content, 50)
 : 'No messages yet'

 const timeLabel = conversation.lastMessage
 ? formatMessageTime(conversation.lastMessage.createdAt)
 : ''

 return (
 <button
 onClick={() => onSelect(conversation.id)}
 className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors hover:bg-blue-50 focus:outline-none ${
 isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
 } ${isNewConnection ? 'bg-green-50 hover:bg-green-100' : ''}`}
 >
 <div className="flex items-start justify-between gap-2">
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-2 mb-0.5">
 <span className="font-semibold text-sm text-gray-900 truncate">{displayName}</span>
 {primaryOther && <UserTypeBadge userType={primaryOther.userType} />}
 {isNewConnection && (
 <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 flex-shrink-0">
 New
 </span>
 )}
 </div>
 <p className={`text-xs truncate ${isNewConnection ? 'text-green-600 italic' : 'text-gray-500'}`}>{preview}</p>
 </div>
 <div className="flex flex-col items-end gap-1 flex-shrink-0">
 {timeLabel && <span className="text-xs text-gray-400 whitespace-nowrap">{timeLabel}</span>}
 {conversation.unreadCount > 0 && (
 <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold">
 {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
 </span>
 )}
 </div>
 </div>
 </button>
 )
}

// ---------------------------------------------------------------------------
// MessageBubble
// ---------------------------------------------------------------------------

interface MessageBubbleProps {
 message: Message
 isOwn: boolean
}

function MessageBubble({ message, isOwn }: MessageBubbleProps) {
 return (
 <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
 <div
 className={`max-w-[75%] sm:max-w-[65%] rounded-2xl px-4 py-2 ${
 isOwn
 ? 'bg-blue-500 text-white rounded-br-md'
 : 'bg-gray-100 text-gray-900 rounded-bl-md'
 }`}
 >
 {!isOwn && (
 <p className="text-xs font-semibold text-gray-600 mb-0.5">{message.senderName}</p>
 )}
 <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
 <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
 <span className="text-[10px]">{formatTimestamp(message.createdAt)}</span>
 {isOwn && (
 message.readAt
 ? <FaCheckDouble className="w-3 h-3" />
 : <FaCheck className="w-3 h-3" />
 )}
 </div>
 </div>
 </div>
 )
}

// ---------------------------------------------------------------------------
// DateSeparator
// ---------------------------------------------------------------------------

function DateSeparator({ dateStr }: { dateStr: string }) {
 return (
 <div className="flex items-center gap-3 my-4">
 <div className="flex-1 h-px bg-gray-200" />
 <span className="text-xs text-gray-400 font-medium">{formatDateSeparator(dateStr)}</span>
 <div className="flex-1 h-px bg-gray-200" />
 </div>
 )
}

// ---------------------------------------------------------------------------
// ChatView (main component)
// ---------------------------------------------------------------------------

export default function ChatView({ currentUser, initialConversationId }: ChatViewProps) {
 // ---- State ----
 const [conversations, setConversations] = useState<ConversationSummary[]>([])
 const [selectedId, setSelectedId] = useState<string | null>(null)
 const [messages, setMessages] = useState<Message[]>([])
 const [inputText, setInputText] = useState('')
 const [searchQuery, setSearchQuery] = useState('')
 const [loadingConversations, setLoadingConversations] = useState(true)
 const [loadingMessages, setLoadingMessages] = useState(false)
 const [mobileShowMessages, setMobileShowMessages] = useState(false)
 const [userSearchResults, setUserSearchResults] = useState<Array<{
 id: string; firstName: string; lastName: string; email: string; userType: string; profileImage: string | null
 }>>([])
 const [searchingUsers, setSearchingUsers] = useState(false)
 const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

 const messagesEndRef = useRef<HTMLDivElement>(null)
 const inputRef = useRef<HTMLInputElement>(null)
 const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
 const previousConversationRef = useRef<string | null>(null)
 const conversationsRef = useRef<ConversationSummary[]>([])

 // ---- useChat hook ----
 const {
 connected,
 sendMessage,
 onNewMessage,
 offNewMessage,
 startTyping,
 stopTyping,
 joinConversation,
 leaveConversation,
 markRead,
 typingUsers,
 } = useChat({ userId: currentUser.id })

 const senderFullName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'User'

 // Keep ref in sync so callbacks always have current conversations
 useEffect(() => {
 conversationsRef.current = conversations
 }, [conversations])

 // ---- Fetch conversations on mount ----
 useEffect(() => {
 let cancelled = false

 async function fetchConversations() {
 try {
 // For regional admins, ensure conversations exist with all users first
 if (currentUser.userType === 'REGIONAL_ADMIN') {
 await fetch('/api/conversations/ensure-all', {
 method: 'POST',
 credentials: 'include',
 }).catch(() => {})
 }

 // Fetch conversations and accepted connections in parallel
 const [convRes, connRes] = await Promise.all([
 fetch('/api/conversations', { credentials: 'include' }),
 fetch('/api/connections?status=accepted', { credentials: 'include' }),
 ])

 if (cancelled) return

 const convJson = convRes.ok ? await convRes.json() : { success: false, data: [] }
 const connJson = connRes.ok ? await connRes.json() : { success: false, data: [] }

 const existingConversations: ConversationSummary[] = convJson.success ? convJson.data : []

 // Build a set of user IDs that already have a conversation
 const participantUserIds = new Set<string>()
 for (const conv of existingConversations) {
 for (const p of conv.participants) {
 if (p.userId !== currentUser.id) {
 participantUserIds.add(p.userId)
 }
 }
 }

 // Map accepted connections without an existing conversation into synthetic ConversationSummary entries
 const newConnectionEntries: ConversationSummary[] = []
 if (connJson.success && Array.isArray(connJson.data)) {
 for (const conn of connJson.data as AcceptedConnection[]) {
 // Determine which side is the other person
 const other = conn.sender.id === currentUser.id ? conn.receiver : conn.sender
 if (participantUserIds.has(other.id)) continue

 newConnectionEntries.push({
 id: `connection:${conn.id}`,
 type: 'direct',
 participants: [
 {
 userId: other.id,
 firstName: other.firstName,
 lastName: other.lastName,
 userType: other.userType,
 avatarUrl: other.profileImage ?? null,
 },
 ],
 lastMessage: null,
 unreadCount: 0,
 updatedAt: conn.updatedAt,
 isNewConnection: true,
 })
 }
 }

 if (!cancelled) {
 // Sort connections by updatedAt and place existing conversations first, then new connections
 newConnectionEntries.sort(
 (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
 )

 // Add AI Health Assistant as first entry
 const aiEntry: ConversationSummary = {
   id: 'ai-assistant',
   type: 'direct',
   participants: [{
     userId: 'ai-assistant',
     firstName: 'AI Health',
     lastName: 'Assistant',
     userType: 'AI_ASSISTANT',
     avatarUrl: null,
   }],
   lastMessage: { id: 'ai-welcome', content: 'How can I help you today?', senderId: 'ai-assistant', createdAt: new Date().toISOString() },
   unreadCount: 0,
   updatedAt: new Date().toISOString(),
 }

 setConversations([aiEntry, ...existingConversations, ...newConnectionEntries])
 }
 } catch {
 // Network error - silently ignore
 } finally {
 if (!cancelled) setLoadingConversations(false)
 }
 }

 fetchConversations()
 return () => { cancelled = true }
 }, [currentUser.id, currentUser.userType])

 // ---- Search platform users when query has 2+ characters ----
 useEffect(() => {
 if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

 if (searchQuery.length < 2) {
 setUserSearchResults([])
 setSearchingUsers(false)
 return
 }

 setSearchingUsers(true)
 searchTimeoutRef.current = setTimeout(async () => {
 try {
 const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, { credentials: 'include' })
 if (res.ok) {
 const json = await res.json()
 if (json.success) {
 // Filter out users who already have conversations
 const existingUserIds = new Set<string>()
 for (const conv of conversations) {
 for (const p of conv.participants) {
 if (p.userId !== currentUser.id) existingUserIds.add(p.userId)
 }
 }
 setUserSearchResults(
 (json.data || []).filter((u: { id: string }) => !existingUserIds.has(u.id))
 )
 }
 }
 } catch {
 // silent
 } finally {
 setSearchingUsers(false)
 }
 }, 300)

 return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current) }
 }, [searchQuery, conversations, currentUser.id])

 // ---- Start conversation with a searched user ----
 const handleStartConversation = useCallback(async (targetUserId: string) => {
 try {
 const res = await fetch('/api/conversations', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 credentials: 'include',
 body: JSON.stringify({ participantIds: [targetUserId] }),
 })
 const json = await res.json()
 if (res.ok && json.success) {
 const newConv: ConversationSummary = {
 ...json.data,
 participants: json.data.participants ?? [],
 unreadCount: 0,
 }
 setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== newConv.id)])
 setSelectedId(newConv.id)
 setMobileShowMessages(true)
 setSearchQuery('')
 setUserSearchResults([])
 }
 } catch {
 // silent
 }
 }, [])

 // ---- Auto-select initial conversation if provided ----
 useEffect(() => {
 if (initialConversationId && conversations.length > 0 && !selectedId) {
 const match = conversations.find((c) => c.id === initialConversationId)
 if (match) {
 setSelectedId(match.id)
 setMobileShowMessages(true)
 }
 }
 }, [initialConversationId, conversations, selectedId])

 // ---- Fetch messages when selected conversation changes ----
 useEffect(() => {
 if (!selectedId) return

 // AI Assistant - no server-side conversation; just seed a greeting once.
 if (selectedId === 'ai-assistant') {
 setMessages((prev) => prev.length > 0 && prev[0].conversationId === 'ai-assistant' ? prev : [{
 id: 'ai-welcome',
 conversationId: 'ai-assistant',
 senderId: 'ai-assistant',
 senderName: 'AI Health Assistant',
 senderType: 'AI_ASSISTANT',
 content: 'Hi! I\'m your AI health assistant. Ask me anything - nutrition, symptoms, exercise, sleep, or general wellbeing.',
 createdAt: new Date().toISOString(),
 }])
 setLoadingMessages(false)
 return
 }

 let cancelled = false

 async function fetchMessages() {
 setLoadingMessages(true)
 try {
 const res = await fetch(`/api/conversations/${selectedId}/messages`, { credentials: 'include' })
 if (!res.ok) return
 const json = await res.json()
 if (!cancelled && json.success) {
 setMessages(json.data)
 }
 } catch {
 // Network error
 } finally {
 if (!cancelled) setLoadingMessages(false)
 }
 }

 fetchMessages()
 return () => { cancelled = true }
 }, [selectedId])

 // ---- Join / leave conversation rooms ----
 useEffect(() => {
 if (!connected) return

 const prev = previousConversationRef.current
 if (prev && prev !== selectedId) {
 leaveConversation(prev)
 }

 if (selectedId) {
 joinConversation(selectedId)
 markRead(selectedId)

 // Clear local unread count
 setConversations((prev) =>
 prev.map((c) => (c.id === selectedId ? { ...c, unreadCount: 0 } : c))
 )
 }

 previousConversationRef.current = selectedId
 }, [selectedId, connected, joinConversation, leaveConversation, markRead])

 // ---- Real-time message handler ----
 const handleNewMessage = useCallback(
 (msg: ChatMessage) => {
 const message: Message = {
 id: msg.id,
 conversationId: msg.conversationId,
 senderId: msg.senderId,
 senderName: msg.senderName,
 senderType: msg.senderType,
 content: msg.content,
 createdAt: msg.createdAt,
 }

 // If this message belongs to the currently selected conversation, append it
 if (msg.conversationId === selectedId) {
 setMessages((prev) => {
 // Deduplicate by id
 if (prev.some((m) => m.id === msg.id)) return prev
 return [...prev, message]
 })

 // Mark as read if from another user
 if (msg.senderId !== currentUser.id) {
 markRead(msg.conversationId)
 }
 } else {
 // Increment unread count for conversations not currently viewed
 setConversations((prev) =>
 prev.map((c) =>
 c.id === msg.conversationId
 ? { ...c, unreadCount: c.unreadCount + 1 }
 : c
 )
 )
 }

 // Update last message in the conversation list and move it to top
 setConversations((prev) => {
 const updated = prev.map((c) =>
 c.id === msg.conversationId
 ? {
 ...c,
 lastMessage: {
 id: msg.id,
 content: msg.content,
 senderId: msg.senderId,
 createdAt: msg.createdAt,
 },
 updatedAt: msg.createdAt,
 }
 : c
 )
 // Sort so most-recently-updated is at top
 updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
 return updated
 })
 },
 [selectedId, currentUser.id, markRead]
 )

 useEffect(() => {
 onNewMessage(handleNewMessage)
 return () => { offNewMessage(handleNewMessage) }
 }, [handleNewMessage, onNewMessage, offNewMessage])

 // ---- Auto-scroll to latest message ----
 useEffect(() => {
 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
 }, [messages])

 // ---- Send message ----
 const handleSend = useCallback(async () => {
 const text = inputText.trim()
 if (!text || !selectedId || selectedId.startsWith('connection:')) return

 setInputText('')

 // ---- AI Assistant inline chat ----
 if (selectedId === 'ai-assistant') {
 const userMsg: Message = {
 id: `ai-u-${Date.now()}`,
 conversationId: 'ai-assistant',
 senderId: currentUser.id,
 senderName: senderFullName,
 senderType: currentUser.userType,
 content: text,
 createdAt: new Date().toISOString(),
 }
 setMessages((prev) => [...prev, userMsg])

 // Typing placeholder
 const typingId = `ai-typing-${Date.now()}`
 setMessages((prev) => [...prev, {
 id: typingId,
 conversationId: 'ai-assistant',
 senderId: 'ai-assistant',
 senderName: 'AI Health Assistant',
 senderType: 'AI_ASSISTANT',
 content: 'Typing...',
 createdAt: new Date().toISOString(),
 }])

 try {
 const res = await fetch('/api/ai/chat', {
 method: 'POST',
 credentials: 'include',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ message: text }),
 })
 const json = await res.json().catch(() => null)
 const reply = json?.data?.response || json?.data?.message || 'Sorry, I couldn\'t respond right now.'
 setMessages((prev) => prev.filter(m => m.id !== typingId).concat({
 id: `ai-a-${Date.now()}`,
 conversationId: 'ai-assistant',
 senderId: 'ai-assistant',
 senderName: 'AI Health Assistant',
 senderType: 'AI_ASSISTANT',
 content: reply,
 createdAt: new Date().toISOString(),
 }))
 } catch {
 setMessages((prev) => prev.filter(m => m.id !== typingId).concat({
 id: `ai-err-${Date.now()}`,
 conversationId: 'ai-assistant',
 senderId: 'ai-assistant',
 senderName: 'AI Health Assistant',
 senderType: 'AI_ASSISTANT',
 content: 'AI is unavailable right now - please try again in a moment.',
 createdAt: new Date().toISOString(),
 }))
 }
 inputRef.current?.focus()
 return
 }

 // Stop typing indicator
 if (typingTimeoutRef.current) {
 clearTimeout(typingTimeoutRef.current)
 typingTimeoutRef.current = null
 }
 stopTyping(selectedId)

 // Send via socket for real-time delivery
 sendMessage(selectedId, text, senderFullName, currentUser.userType)

 // Also persist via REST API
 try {
 await fetch(`/api/conversations/${selectedId}/messages`, {
 method: 'POST',
 credentials: 'include',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ content: text }),
 })
 } catch {
 // Socket delivery is the primary channel; REST is for persistence
 }

 inputRef.current?.focus()
 }, [inputText, selectedId, sendMessage, stopTyping, senderFullName, currentUser.userType, currentUser.id])

 // ---- Typing indicator ----
 const handleInputChange = useCallback(
 (e: React.ChangeEvent<HTMLInputElement>) => {
 setInputText(e.target.value)

 if (!selectedId) return

 startTyping(selectedId, senderFullName)

 if (typingTimeoutRef.current) {
 clearTimeout(typingTimeoutRef.current)
 }
 typingTimeoutRef.current = setTimeout(() => {
 stopTyping(selectedId)
 typingTimeoutRef.current = null
 }, 2000)
 },
 [selectedId, startTyping, stopTyping, senderFullName]
 )

 const handleKeyDown = useCallback(
 (e: React.KeyboardEvent<HTMLInputElement>) => {
 if (e.key === 'Enter' && !e.shiftKey) {
 e.preventDefault()
 handleSend()
 }
 },
 [handleSend]
 )

 // ---- Conversation selection ----
 const [creatingConversation, setCreatingConversation] = useState(false)

 const handleSelectConversation = useCallback(async (id: string) => {
 // AI Assistant - stay inside the chat UI and talk to the bot inline.
 if (id === 'ai-assistant') {
   setSelectedId('ai-assistant')
   setMobileShowMessages(true)
   return
 }

 // Regular conversation - select immediately
 if (!id.startsWith('connection:')) {
 setSelectedId(id)
 setMobileShowMessages(true)
 return
 }

 // New connection - create the real conversation first, then select it
 const syntheticConv = conversationsRef.current.find((c) => c.id === id)
 if (!syntheticConv) return
 const otherId = syntheticConv.participants[0]?.userId
 if (!otherId) return

 setCreatingConversation(true)
 try {
 const res = await fetch('/api/conversations', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 credentials: 'include',
 body: JSON.stringify({ participantIds: [otherId] }),
 })
 const json = await res.json()
 if (json.success) {
 const realConv: ConversationSummary = {
 ...json.data,
 participants: json.data.participants ?? syntheticConv.participants,
 unreadCount: 0,
 }
 // Replace synthetic entry with the real conversation
 setConversations((prev) => [
 realConv,
 ...prev.filter((c) => c.id !== id),
 ])
 setSelectedId(realConv.id)
 setMobileShowMessages(true)
 }
 } catch {
 // Network error
 } finally {
 setCreatingConversation(false)
 }
 }, [])

 const handleMobileBack = useCallback(() => {
 setMobileShowMessages(false)
 }, [])

 // ---- Filtered conversations ----
 const filteredConversations = searchQuery
 ? conversations.filter((c) => {
 const others = getOtherParticipants(c.participants, currentUser.id)
 const names = others.map((p) => `${p.firstName} ${p.lastName}`.toLowerCase()).join(' ')
 return names.includes(searchQuery.toLowerCase())
 })
 : conversations

 // ---- Selected conversation details ----
 const selectedConversation = conversations.find((c) => c.id === selectedId)
 const selectedOthers = selectedConversation
 ? getOtherParticipants(selectedConversation.participants, currentUser.id)
 : []

 // ---- Typing users for selected conversation ----
 const activeTypingUsers = Array.from(typingUsers.values()).filter(
 (t) => t.conversationId === selectedId
 )

 // =========================================================================
 // RENDER
 // =========================================================================

 return (
 <div className="flex h-[calc(100vh-8rem)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
 {/* ----------------------------------------------------------------- */}
 {/* LEFT PANEL - Conversation List */}
 {/* ----------------------------------------------------------------- */}
 <div
 className={`w-full md:w-80 lg:w-96 border-r border-gray-200 flex flex-col bg-white ${
 mobileShowMessages ? 'hidden md:flex' : 'flex'
 }`}
 >
 {/* Header */}
 <div className="px-4 py-3 border-b border-gray-200">
 <h2 className="text-lg font-bold text-gray-900 mb-2">Messages</h2>
 <div className="relative">
 <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
 <input
 type="text"
 placeholder="Search conversations..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
 />
 </div>
 </div>

 {/* Conversation list */}
 <div className="flex-1 overflow-y-auto relative">
 {creatingConversation && (
 <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
 <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
 </div>
 )}
 {loadingConversations ? (
 <div className="flex items-center justify-center py-12">
 <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
 </div>
 ) : filteredConversations.length === 0 ? (
 <div className="text-center py-12 px-4">
 <p className="text-sm text-gray-500">
 {searchQuery ? 'No conversations match your search.' : 'No conversations yet.'}
 </p>
 </div>
 ) : (
 filteredConversations.map((conv) => (
 <ConversationListItem
 key={conv.id}
 conversation={conv}
 currentUserId={currentUser.id}
 isSelected={conv.id === selectedId}
 onSelect={handleSelectConversation}
 />
 ))
 )}

 {/* Platform user search results */}
 {searchQuery.length >= 2 && (userSearchResults.length > 0 || searchingUsers) && (
 <div className="border-t border-gray-200">
 <div className="px-4 py-2 bg-gray-50">
 <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
 {searchingUsers ? 'Searching users...' : 'Start a new conversation'}
 </p>
 </div>
 {userSearchResults.map((user) => {
 const { bg, text, label } = getUserTypeColor(user.userType)
 return (
 <button
 key={user.id}
 onClick={() => handleStartConversation(user.id)}
 className="w-full text-left px-4 py-3 border-b border-gray-100 transition-colors hover:bg-green-50 focus:outline-none"
 >
 <div className="flex items-center justify-between gap-2">
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-2 mb-0.5">
 <span className="font-semibold text-sm text-gray-900 truncate">
 {user.firstName} {user.lastName}
 </span>
 <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${bg} ${text}`}>
 {label}
 </span>
 </div>
 <p className="text-xs text-gray-500 truncate">{user.email}</p>
 </div>
 <FaUserPlus className="text-green-500 flex-shrink-0" />
 </div>
 </button>
 )
 })}
 </div>
 )}
 </div>

 {/* Connection status */}
 <div className="px-4 py-2 border-t border-gray-100">
 <div className="flex items-center gap-1.5">
 <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
 <span className="text-xs text-gray-400">{connected ? 'Connected' : 'Reconnecting...'}</span>
 </div>
 </div>
 </div>

 {/* ----------------------------------------------------------------- */}
 {/* RIGHT PANEL - Message View */}
 {/* ----------------------------------------------------------------- */}
 <div
 className={`flex-1 flex flex-col bg-gray-50 ${
 !mobileShowMessages ? 'hidden md:flex' : 'flex'
 }`}
 >
 {selectedId && selectedConversation ? (
 <>
 {/* Conversation header */}
 <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
 <button
 onClick={handleMobileBack}
 className="md:hidden text-gray-500 hover:text-gray-700 p-1"
 aria-label="Back to conversations"
 >
 <FaArrowLeft className="w-4 h-4" />
 </button>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <h3 className="font-semibold text-gray-900 truncate">
 {selectedOthers.map(participantDisplayName).join(', ')}
 </h3>
 {selectedOthers.length === 1 && (
 <UserTypeBadge userType={selectedOthers[0].userType} />
 )}
 </div>
 {selectedOthers.length > 1 && (
 <div className="flex items-center gap-1 mt-0.5">
 {selectedOthers.map((p) => (
 <UserTypeBadge key={p.userId} userType={p.userType} />
 ))}
 </div>
 )}
 </div>
 </div>

 {/* Messages area */}
 <div className="flex-1 overflow-y-auto px-4 py-4" aria-live="polite" aria-label="Chat messages">
 {loadingMessages ? (
 <div className="flex items-center justify-center h-full">
 <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
 </div>
 ) : messages.length === 0 ? (
 <div className="flex items-center justify-center h-full">
 <p className="text-sm text-gray-400">No messages yet. Start the conversation!</p>
 </div>
 ) : (
 <>
 {messages.map((msg, idx) => {
 const showDateSep =
 idx === 0 || !isSameDay(messages[idx - 1].createdAt, msg.createdAt)

 return (
 <React.Fragment key={msg.id}>
 {showDateSep && <DateSeparator dateStr={msg.createdAt} />}
 <MessageBubble
 message={msg}
 isOwn={msg.senderId === currentUser.id}
 />
 </React.Fragment>
 )
 })}
 </>
 )}

 {/* Typing indicator */}
 {activeTypingUsers.length > 0 && (
 <div className="flex items-center gap-2 mt-1 ml-1">
 <div className="flex gap-1">
 <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
 <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
 <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
 </div>
 <span className="text-xs text-gray-400 italic">
 {activeTypingUsers.map((t) => t.userName).join(', ')}{' '}
 {activeTypingUsers.length === 1 ? 'is' : 'are'} typing...
 </span>
 </div>
 )}

 <div ref={messagesEndRef} />
 </div>

 {/* Message input */}
 <div className="px-4 py-3 bg-white border-t border-gray-200">
 <div className="flex items-center gap-2">
 <input
 ref={inputRef}
 type="text"
 placeholder="Type a message..."
 value={inputText}
 onChange={handleInputChange}
 onKeyDown={handleKeyDown}
 className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
 />
 <button
 onClick={handleSend}
 disabled={!inputText.trim()}
 className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
 aria-label="Send message"
 >
 <FaPaperPlane className="w-4 h-4" />
 </button>
 </div>
 </div>
 </>
 ) : (
 /* Empty state - no conversation selected */
 <div className="flex-1 flex items-center justify-center">
 <div className="text-center px-4">
 <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
 <FaPaperPlane className="w-6 h-6 text-blue-400" />
 </div>
 <h3 className="text-lg font-semibold text-gray-700 mb-1">Your Messages</h3>
 <p className="text-sm text-gray-400 max-w-xs">
 Select a conversation from the list to start chatting with your healthcare team.
 </p>
 </div>
 </div>
 )}
 </div>
 </div>
 )
}
