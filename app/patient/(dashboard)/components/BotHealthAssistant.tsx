'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
 FaRobot,
 FaUtensils,
 FaDumbbell,
 FaPaperPlane,
 FaChartLine,
 FaUser,
 FaPlus,
 FaTrash,
 FaComments,
 FaBars,
 FaTimes,
 FaExclamationTriangle,
} from 'react-icons/fa'

interface Props {
 userName?: string
 healthScore?: number
}

interface ChatMessage {
 id: string
 role: 'user' | 'assistant'
 content: string
 createdAt: string
}

interface ChatSession {
 id: string
 title: string
 createdAt: string
 updatedAt: string
 _count: { messages: number }
}

const BotHealthAssistant: React.FC<Props> = ({ userName, healthScore }) => {
 const [sessions, setSessions] = useState<ChatSession[]>([])
 const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
 const [messages, setMessages] = useState<ChatMessage[]>([])
 const [newMessage, setNewMessage] = useState('')
 const [isLoading, setIsLoading] = useState(false)
 const [isSidebarOpen, setIsSidebarOpen] = useState(false)
 const [isLoadingSessions, setIsLoadingSessions] = useState(true)
 const [error, setError] = useState<string | null>(null)
 const [displayName, setDisplayName] = useState(userName || '')
 const messagesEndRef = useRef<HTMLDivElement>(null)
 const textareaRef = useRef<HTMLTextAreaElement>(null)

 // Fetch user name if not provided
 useEffect(() => {
 if (!userName) {
 fetch('/api/auth/me', { credentials: 'include' })
 .then(r => r.json())
 .then(data => {
 if (data.user?.firstName) setDisplayName(data.user.firstName)
 })
 .catch(() => {})
 }
 }, [userName])

 const scrollToBottom = useCallback(() => {
 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
 }, [])

 useEffect(() => {
 scrollToBottom()
 }, [messages, scrollToBottom])

 // Load sessions on mount
 useEffect(() => {
 loadSessions()
 }, [])

 const loadSessions = async () => {
 setIsLoadingSessions(true)
 try {
 const res = await fetch('/api/ai/chat', { credentials: 'include' })
 const data = await res.json()
 if (data.success) {
 setSessions(data.data)
 }
 } catch {
 console.error('Failed to load sessions')
 } finally {
 setIsLoadingSessions(false)
 }
 }

 const loadSessionMessages = async (sessionId: string) => {
 try {
 const res = await fetch(`/api/ai/chat/${sessionId}`, { credentials: 'include' })
 const data = await res.json()
 if (data.success) {
 setMessages(data.data.messages)
 setActiveSessionId(sessionId)
 setError(null)
 }
 } catch {
 console.error('Failed to load messages')
 }
 setIsSidebarOpen(false)
 }

 const startNewChat = () => {
 setActiveSessionId(null)
 setMessages([])
 setError(null)
 setIsSidebarOpen(false)
 }

 const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
 e.stopPropagation()
 try {
 const res = await fetch(`/api/ai/chat/${sessionId}`, { method: 'DELETE', credentials: 'include' })
 const data = await res.json()
 if (data.success) {
 setSessions(prev => prev.filter(s => s.id !== sessionId))
 if (activeSessionId === sessionId) {
 startNewChat()
 }
 }
 } catch {
 console.error('Failed to delete session')
 }
 }

 const handleSendMessage = async () => {
 const trimmed = newMessage.trim()
 if (!trimmed || isLoading) return

 // Add user message optimistically
 const tempUserMsg: ChatMessage = {
 id: `temp-${Date.now()}`,
 role: 'user',
 content: trimmed,
 createdAt: new Date().toISOString(),
 }
 setMessages(prev => [...prev, tempUserMsg])
 setNewMessage('')
 setIsLoading(true)
 setError(null)

 // Reset textarea height
 if (textareaRef.current) {
 textareaRef.current.style.height = 'auto'
 }

 try {
 const res = await fetch('/api/ai/chat', {
 method: 'POST',
 credentials: 'include',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 message: trimmed,
 sessionId: activeSessionId || undefined,
 }),
 })

 const data = await res.json()

 if (data.success) {
 const assistantMsg: ChatMessage = {
 id: `assistant-${Date.now()}`,
 role: 'assistant',
 content: data.data.response,
 createdAt: new Date().toISOString(),
 }
 setMessages(prev => [...prev, assistantMsg])

 // Update session info
 if (!activeSessionId) {
 setActiveSessionId(data.data.sessionId)
 }

 // Refresh sessions list
 loadSessions()
 } else {
 setError(data.message || 'Failed to get response')
 // Remove optimistic user message on error
 setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id))
 }
 } catch {
 setError('Network error. Please check your connection and try again.')
 setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id))
 } finally {
 setIsLoading(false)
 }
 }

 const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
 if (e.key === 'Enter' && !e.shiftKey) {
 e.preventDefault()
 handleSendMessage()
 }
 }

 const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
 setNewMessage(e.target.value)
 // Auto-resize textarea
 const textarea = e.target
 textarea.style.height = 'auto'
 textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
 }

 const handleQuickAction = (text: string) => {
 setNewMessage(text)
 textareaRef.current?.focus()
 }

 const formatTime = (dateStr: string): string => {
 const date = new Date(dateStr)
 return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
 }

 const formatDate = (dateStr: string): string => {
 const date = new Date(dateStr)
 const now = new Date()
 const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

 if (diffDays === 0) return 'Today'
 if (diffDays === 1) return 'Yesterday'
 if (diffDays < 7) return `${diffDays} days ago`
 return date.toLocaleDateString()
 }

 /**
 * Render markdown-like formatting in assistant messages.
 * Supports: **bold**, *italic*, bullet lists, numbered lists, headers, code blocks.
 */
 const renderMarkdown = (text: string) => {
 const lines = text.split('\n')
 const elements: React.ReactNode[] = []
 let inCodeBlock = false
 let codeBlockContent: string[] = []
 let listItems: React.ReactNode[] = []
 let listType: 'ul' | 'ol' | null = null

 const flushList = () => {
 if (listItems.length > 0 && listType) {
 const ListTag = listType === 'ul' ? 'ul' : 'ol'
 elements.push(
 <ListTag
 key={`list-${elements.length}`}
 className={`${listType === 'ul' ? 'list-disc' : 'list-decimal'} ml-4 my-2 space-y-1`}
 >
 {listItems}
 </ListTag>
 )
 listItems = []
 listType = null
 }
 }

 const formatInline = (text: string): React.ReactNode => {
 // Process bold and italic
 const parts: React.ReactNode[] = []
 let remaining = text
 let keyIdx = 0

 while (remaining.length > 0) {
 // Bold: **text**
 const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
 // Italic: *text*
 const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/)

 let firstMatch: RegExpMatchArray | null = null
 let matchType: 'bold' | 'italic' | null = null

 if (boldMatch && italicMatch) {
 if ((boldMatch.index ?? Infinity) <= (italicMatch.index ?? Infinity)) {
 firstMatch = boldMatch
 matchType = 'bold'
 } else {
 firstMatch = italicMatch
 matchType = 'italic'
 }
 } else if (boldMatch) {
 firstMatch = boldMatch
 matchType = 'bold'
 } else if (italicMatch) {
 firstMatch = italicMatch
 matchType = 'italic'
 }

 if (firstMatch && firstMatch.index !== undefined && matchType) {
 if (firstMatch.index > 0) {
 parts.push(remaining.substring(0, firstMatch.index))
 }
 if (matchType === 'bold') {
 parts.push(<strong key={`b-${keyIdx++}`}>{firstMatch[1]}</strong>)
 } else {
 parts.push(<em key={`i-${keyIdx++}`}>{firstMatch[1]}</em>)
 }
 remaining = remaining.substring(firstMatch.index + firstMatch[0].length)
 } else {
 parts.push(remaining)
 break
 }
 }

 return parts.length === 1 ? parts[0] : <>{parts}</>
 }

 for (let i = 0; i < lines.length; i++) {
 const line = lines[i]

 // Code block
 if (line.trim().startsWith('```')) {
 if (inCodeBlock) {
 elements.push(
 <pre
 key={`code-${elements.length}`}
 className="bg-gray-800 text-green-300 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono"
 >
 <code>{codeBlockContent.join('\n')}</code>
 </pre>
 )
 codeBlockContent = []
 inCodeBlock = false
 } else {
 flushList()
 inCodeBlock = true
 }
 continue
 }

 if (inCodeBlock) {
 codeBlockContent.push(line)
 continue
 }

 // Headers
 if (line.startsWith('### ')) {
 flushList()
 elements.push(
 <h4 key={`h3-${i}`} className="font-semibold text-sm mt-3 mb-1">
 {formatInline(line.substring(4))}
 </h4>
 )
 continue
 }
 if (line.startsWith('## ')) {
 flushList()
 elements.push(
 <h3 key={`h2-${i}`} className="font-bold text-sm mt-3 mb-1">
 {formatInline(line.substring(3))}
 </h3>
 )
 continue
 }
 if (line.startsWith('# ')) {
 flushList()
 elements.push(
 <h2 key={`h1-${i}`} className="font-bold text-base mt-3 mb-1">
 {formatInline(line.substring(2))}
 </h2>
 )
 continue
 }

 // Bullet lists
 const bulletMatch = line.match(/^[\s]*[-*]\s+(.+)/)
 if (bulletMatch) {
 if (listType !== 'ul') {
 flushList()
 listType = 'ul'
 }
 listItems.push(
 <li key={`li-${i}`} className="text-sm">
 {formatInline(bulletMatch[1])}
 </li>
 )
 continue
 }

 // Numbered lists
 const numberedMatch = line.match(/^[\s]*\d+\.\s+(.+)/)
 if (numberedMatch) {
 if (listType !== 'ol') {
 flushList()
 listType = 'ol'
 }
 listItems.push(
 <li key={`li-${i}`} className="text-sm">
 {formatInline(numberedMatch[1])}
 </li>
 )
 continue
 }

 // Empty line
 if (line.trim() === '') {
 flushList()
 elements.push(<div key={`br-${i}`} className="h-2" />)
 continue
 }

 // Regular paragraph
 flushList()
 elements.push(
 <p key={`p-${i}`} className="text-sm my-1">
 {formatInline(line)}
 </p>
 )
 }

 // Flush remaining list
 flushList()

 return <div className="space-y-0">{elements}</div>
 }

 const renderMessage = (message: ChatMessage) => {
 const isUser = message.role === 'user'

 return (
 <div
 key={message.id}
 className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
 >
 <div
 className={`flex items-start max-w-[85%] md:max-w-[75%] ${
 isUser ? 'flex-row-reverse' : 'flex-row'
 }`}
 >
 {/* Avatar */}
 <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
 <div
 className={`w-8 h-8 rounded-full flex items-center justify-center ${
 isUser
 ? 'bg-blue-500 text-white'
 : 'bg-brand-navy text-white'
 }`}
 >
 {isUser ? (
 <FaUser className="text-sm" />
 ) : (
 <FaRobot className="text-sm" />
 )}
 </div>
 </div>

 {/* Message Content */}
 <div
 className={`rounded-2xl px-4 py-3 ${
 isUser
 ? 'bg-blue-500 text-white'
 : 'bg-surface border border-line text-fg'
 }`}
 >
 {isUser ? (
 <p className="text-sm whitespace-pre-wrap">{message.content}</p>
 ) : (
 renderMarkdown(message.content)
 )}
 <p
 className={`text-xs mt-2 ${
 isUser ? 'text-blue-100' : 'text-faint'
 }`}
 >
 {formatTime(message.createdAt)}
 </p>
 </div>
 </div>
 </div>
 )
 }

 return (
 <div className="h-full flex bg-subtle border border-line overflow-hidden">
 {/* Mobile Sidebar Overlay */}
 {isSidebarOpen && (
 <div
 className="fixed inset-0 bg-black/50 z-40 lg:hidden"
 onClick={() => setIsSidebarOpen(false)}
 />
 )}

 {/* Sidebar - Chat Sessions */}
 <div
 className={`${
 isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
 } lg:translate-x-0 fixed lg:relative z-50 lg:z-0 w-72 h-screen lg:h-full bg-surface border-r border-line flex flex-col transition-transform duration-300 ease-in-out`}
 >
 {/* Sidebar Header */}
 <div className="p-4 border-b border-line">
 <div className="flex items-center justify-between mb-3">
 <h3 className="font-semibold text-fg flex items-center">
 <FaComments className="mr-2 text-purple-500" />
 Chats
 </h3>
 <button
 onClick={() => setIsSidebarOpen(false)}
 className="lg:hidden p-1 text-soft hover:text-soft"
 >
 <FaTimes />
 </button>
 </div>
 <button
 onClick={startNewChat}
 className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-surface transition text-sm font-medium"
 >
 <FaPlus className="text-xs" />
 New Chat
 </button>
 </div>

 {/* Sessions List */}
 <div className="flex-1 overflow-y-auto">
 {isLoadingSessions ? (
 <div className="p-4 text-center text-faint text-sm">
 Loading chats...
 </div>
 ) : sessions.length === 0 ? (
 <div className="p-4 text-center text-faint text-sm">
 No chat history yet. Start a new conversation!
 </div>
 ) : (
 sessions.map(session => (
 <div
 key={session.id}
 onClick={() => loadSessionMessages(session.id)}
 className={`group flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-subtle border-b border-line transition ${
 activeSessionId === session.id
 ? 'bg-purple-50 border-l-2 border-l-purple-500'
 : ''
 }`}
 >
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium text-fg truncate">
 {session.title}
 </p>
 <p className="text-xs text-faint mt-0.5">
 {formatDate(session.updatedAt)} &middot;{' '}
 {session._count.messages} messages
 </p>
 </div>
 <button
 onClick={(e) => deleteSession(session.id, e)}
 className="opacity-0 group-hover:opacity-100 p-1 text-faint hover:text-red-500 transition ml-2"
 title="Delete chat"
 >
 <FaTrash className="text-xs" />
 </button>
 </div>
 ))
 )}
 </div>
 </div>

 {/* Main Chat Area */}
 <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
 {/* Chat Header */}
 <div className="bg-brand-navy text-white px-4 py-3 flex items-center justify-between">
 <div className="flex items-center space-x-3">
 <button
 onClick={() => setIsSidebarOpen(true)}
 className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition"
 >
 <FaBars />
 </button>
 <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
 <FaRobot className="text-xl" />
 </div>
 <div>
 <h2 className="text-lg font-bold">AI Health Assistant</h2>
 <p className="text-xs text-purple-100">
 Powered by AI &middot; Your personal wellness advisor
 </p>
 </div>
 </div>
 {healthScore != null && (
 <div className="text-right hidden sm:block">
 <p className="text-xs text-purple-100">Health Score</p>
 <p className="text-xl font-bold">{healthScore}%</p>
 </div>
 )}
 </div>

 {/* Chat Messages */}
 <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-subtle">
 {messages.length === 0 && !isLoading ? (
 <div className="flex flex-col items-center justify-center h-full text-center">
 <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-4">
 <FaRobot className="text-3xl text-white" />
 </div>
 <h3 className="text-xl font-semibold text-soft mb-2">
 Hello{displayName ? `, ${displayName}` : ''}!
 </h3>
 <p className="text-soft mb-6 max-w-md text-sm">
 I am your AI Health Assistant. I can help you with diet and
 nutrition advice, exercise recommendations, and wellness
 guidance tailored to your health profile.
 </p>

 {/* Quick Action Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg">
 <button
 onClick={() =>
 handleQuickAction(
 'What healthy meals would you recommend for me based on my health profile?'
 )
 }
 className="bg-surface border border-line hover:border-green-300 hover:shadow-md p-4 rounded-xl transition text-left group"
 >
 <FaUtensils className="text-green-500 text-lg mb-2 group-hover:scale-110 transition-transform" />
 <h4 className="font-medium text-fg text-sm">
 Meal Planning
 </h4>
 <p className="text-xs text-soft mt-1">
 Get diet suggestions
 </p>
 </button>

 <button
 onClick={() =>
 handleQuickAction(
 'Can you suggest a safe exercise plan for me based on my health conditions?'
 )
 }
 className="bg-surface border border-line hover:border-blue-300 hover:shadow-md p-4 rounded-xl transition text-left group"
 >
 <FaDumbbell className="text-blue-500 text-lg mb-2 group-hover:scale-110 transition-transform" />
 <h4 className="font-medium text-fg text-sm">
 Exercise Plan
 </h4>
 <p className="text-xs text-soft mt-1">
 Custom workouts
 </p>
 </button>

 <button
 onClick={() =>
 handleQuickAction(
 'Can you analyze my health profile and give me tips to improve my health score?'
 )
 }
 className="bg-surface border border-line hover:border-purple-300 hover:shadow-md p-4 rounded-xl transition text-left group"
 >
 <FaChartLine className="text-purple-500 text-lg mb-2 group-hover:scale-110 transition-transform" />
 <h4 className="font-medium text-fg text-sm">
 Health Insights
 </h4>
 <p className="text-xs text-soft mt-1">
 Improve your score
 </p>
 </button>
 </div>
 </div>
 ) : (
 <>
 {messages.map(renderMessage)}

 {/* Typing Indicator */}
 {isLoading && (
 <div className="flex justify-start mb-4">
 <div className="flex items-start">
 <div className="w-8 h-8 bg-surface rounded-full flex items-center justify-center mr-3">
 <FaRobot className="text-white text-sm" />
 </div>
 <div className="bg-surface border border-line rounded-2xl px-4 py-3">
 <div className="flex space-x-1.5">
 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
 <div
 className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
 style={{ animationDelay: '0.15s' }}
 />
 <div
 className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
 style={{ animationDelay: '0.3s' }}
 />
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Error Message */}
 {error && (
 <div className="flex justify-center mb-4">
 <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 flex items-center gap-2 text-sm text-red-700 max-w-md">
 <FaExclamationTriangle className="flex-shrink-0" />
 <span>{error}</span>
 </div>
 </div>
 )}
 </>
 )}
 <div ref={messagesEndRef} />
 </div>

 {/* Chat Input */}
 <div className="p-3 md:p-4 border-t bg-surface">
 <div className="flex items-end space-x-3">
 <textarea
 ref={textareaRef}
 value={newMessage}
 onChange={handleTextareaChange}
 onKeyDown={handleKeyDown}
 placeholder="Ask about nutrition, exercise, or wellness..."
 rows={1}
 className="flex-1 px-4 py-3 border border-line rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition resize-none text-sm"
 style={{ maxHeight: '120px' }}
 disabled={isLoading}
 />
 <button
 onClick={handleSendMessage}
 disabled={!newMessage.trim() || isLoading}
 className="p-3 bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition flex-shrink-0"
 >
 <FaPaperPlane className="text-lg" />
 </button>
 </div>
 <p className="text-xs text-faint mt-2 text-center">
 AI responses are informational only. Always consult your doctor for
 medical advice.
 </p>
 </div>
 </div>
 </div>
 )
}

export default BotHealthAssistant
