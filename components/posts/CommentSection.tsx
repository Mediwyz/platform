'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { FaPaperPlane } from 'react-icons/fa'

interface Comment {
 id: string
 content: string
 createdAt: string
 author: {
 id: string
 firstName: string
 lastName: string
 profileImage: string | null
 userType: string
 }
}

interface CommentSectionProps {
 postId: string
 currentUserId?: string
 currentUserType?: string
}

const userTypeBadgeColors: Record<string, string> = {
 PATIENT: 'bg-green-100 text-green-700',
 DOCTOR: 'bg-blue-100 text-blue-700',
 NURSE: 'bg-purple-100 text-purple-700',
 NANNY: 'bg-pink-100 text-pink-700',
 PHARMACIST: 'bg-orange-100 text-orange-700',
 LAB_TECHNICIAN: 'bg-yellow-100 text-yellow-700',
 EMERGENCY_WORKER: 'bg-red-100 text-red-700',
 INSURANCE_REP: 'bg-indigo-100 text-indigo-700',
 CORPORATE_ADMIN: 'bg-subtle text-soft',
 REFERRAL_PARTNER: 'bg-teal-100 text-teal-700',
 REGIONAL_ADMIN: 'bg-cyan-100 text-cyan-700',
}

const userTypeLabels: Record<string, string> = {
 PATIENT: 'Patient',
 DOCTOR: 'Doctor',
 NURSE: 'Nurse',
 NANNY: 'Nanny',
 PHARMACIST: 'Pharmacist',
 LAB_TECHNICIAN: 'Lab Tech',
 EMERGENCY_WORKER: 'Responder',
 INSURANCE_REP: 'Insurance',
 CORPORATE_ADMIN: 'Corporate',
 REFERRAL_PARTNER: 'Partner',
 REGIONAL_ADMIN: 'Admin',
}

function getRelativeTime(dateString: string): string {
 const now = new Date()
 const date = new Date(dateString)
 const diffMs = now.getTime() - date.getTime()
 const diffSeconds = Math.floor(diffMs / 1000)
 const diffMinutes = Math.floor(diffSeconds / 60)
 const diffHours = Math.floor(diffMinutes / 60)
 const diffDays = Math.floor(diffHours / 24)
 const diffWeeks = Math.floor(diffDays / 7)

 if (diffSeconds < 60) return 'just now'
 if (diffMinutes < 60) return `${diffMinutes}m ago`
 if (diffHours < 24) return `${diffHours}h ago`
 if (diffDays < 7) return `${diffDays}d ago`
 if (diffWeeks < 4) return `${diffWeeks}w ago`
 return date.toLocaleDateString()
}

function getInitials(firstName: string, lastName: string): string {
 return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export default function CommentSection({
 postId,
 currentUserId,
}: CommentSectionProps) {
 const [comments, setComments] = useState<Comment[]>([])
 const [loading, setLoading] = useState(true)
 const [newComment, setNewComment] = useState('')
 const [submitting, setSubmitting] = useState(false)
 const [page, setPage] = useState(1)
 const [totalPages, setTotalPages] = useState(1)
 const [total, setTotal] = useState(0)

 const fetchComments = useCallback(async (pageNum: number, append = false) => {
 try {
 setLoading(true)
 const res = await fetch(`/api/posts/${postId}/comments?page=${pageNum}&limit=10`)
 const json = await res.json()
 if (json.success) {
 setComments((prev) =>
 append ? [...prev, ...json.data.comments] : json.data.comments
 )
 setTotalPages(json.data.totalPages)
 setTotal(json.data.total)
 }
 } catch (error) {
 console.error('Failed to fetch comments:', error)
 } finally {
 setLoading(false)
 }
 }, [postId])

 useEffect(() => {
 fetchComments(1)
 }, [fetchComments])

 const handleLoadMore = () => {
 const nextPage = page + 1
 setPage(nextPage)
 fetchComments(nextPage, true)
 }

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 if (!newComment.trim() || !currentUserId) return

 setSubmitting(true)
 try {
 const res = await fetch(`/api/posts/${postId}/comments`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ content: newComment.trim() }),
 })
 const json = await res.json()
 if (json.success) {
 // Optimistic update: add comment to list immediately
 setComments((prev) => [...prev, json.data])
 setTotal((prev) => prev + 1)
 setNewComment('')
 }
 } catch (error) {
 console.error('Failed to post comment:', error)
 } finally {
 setSubmitting(false)
 }
 }

 return (
 <div className="px-4 sm:px-5 py-3 bg-subtle/40">
 {/* Comments list */}
 {loading && comments.length === 0 ? (
 <div className="flex items-center justify-center py-4">
 <div className="w-5 h-5 border-2 border-[#0C6780] dark:border-accent border-t-transparent rounded-full animate-spin" />
 </div>
 ) : comments.length === 0 ? (
 <p className="text-faint text-sm text-center py-3">No comments yet. Be the first to comment!</p>
 ) : (
 <div className="space-y-3">
 {comments.map((comment) => (
 <div key={comment.id} className="flex items-start gap-2.5">
 {comment.author.profileImage ? (
 <Image
 src={comment.author.profileImage}
 alt={`${comment.author.firstName} ${comment.author.lastName}`}
 width={32}
 height={32}
 className="w-8 h-8 rounded-full object-cover flex-shrink-0"
 />
 ) : (
 <div className="w-8 h-8 rounded-full bg-subtle text-soft flex items-center justify-center font-medium text-xs flex-shrink-0">
 {getInitials(comment.author.firstName, comment.author.lastName)}
 </div>
 )}
 <div className="flex-1 min-w-0">
 <div className="bg-surface border border-line rounded-2xl px-3 py-2">
 <div className="flex items-center gap-2 flex-wrap">
 <span className="font-medium text-fg text-sm">
 {comment.author.firstName} {comment.author.lastName}
 </span>
 <span
 className={`text-xs font-medium rounded-full px-2 py-0.5 ${
 userTypeBadgeColors[comment.author.userType] || 'bg-subtle text-soft'
 }`}
 >
 {userTypeLabels[comment.author.userType] || comment.author.userType}
 </span>
 <span className="text-faint text-xs">
 {getRelativeTime(comment.createdAt)}
 </span>
 </div>
 <p className="text-soft text-sm mt-0.5">{comment.content}</p>
 </div>
 </div>
 </div>
 ))}

 {/* Load more */}
 {page < totalPages && (
 <button
 onClick={handleLoadMore}
 disabled={loading}
 className="w-full text-center text-sm text-[#0C6780] dark:text-accent hover:underline font-medium py-2 disabled:opacity-50"
 >
 {loading ? 'Loading' : `Load more comments (${total - comments.length} remaining)`}
 </button>
 )}
 </div>
 )}

 {/* Add comment input */}
 {currentUserId ? (
 <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-3">
 <input
 type="text"
 value={newComment}
 onChange={(e) => setNewComment(e.target.value)}
 placeholder="Add a comment"
 className="flex-1 text-sm bg-surface text-fg border border-line rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent placeholder:text-faint"
 disabled={submitting}
 />
 <button
 type="submit"
 disabled={submitting || !newComment.trim()}
 className="flex items-center justify-center w-9 h-9 rounded-full bg-[#0C6780] hover:bg-[#001E40] dark:bg-accent dark:text-[#04121f] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
 >
 <FaPaperPlane className="text-xs" />
 </button>
 </form>
 ) : (
 <p className="text-faint text-xs text-center mt-3">
 Sign in to leave a comment
 </p>
 )}
 </div>
 )
}
