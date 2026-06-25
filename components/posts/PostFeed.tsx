'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { FaPenFancy, FaGlobeAmericas, FaHeartbeat, FaBookOpen, FaNewspaper, FaSpa, FaMicroscope } from 'react-icons/fa'
import type { IconType } from 'react-icons'
import PostCard, { type ReactionKey } from './PostCard'
import CommentSection from './CommentSection'
import CreatePostForm from './CreatePostForm'

type ReactionCounts = Partial<Record<ReactionKey, number>>

interface Post {
 id: string
 content: string
 category: string | null
 tags: string[]
 imageUrl: string | null
 likeCount: number
 reactions?: ReactionCounts
 createdAt: string
 author: {
 id: string
 firstName: string
 lastName: string
 profileImage: string | null
 userType: string
 verified: boolean
 doctorProfile?: { specialty: string[]; clinicAffiliation: string } | null
 }
 _count: { comments: number }
}

interface PostFeedProps {
 currentUserId?: string
 currentUserType?: string
 showCreateButton?: boolean
 /** When set, the feed shows ONLY this user's posts (e.g. on their profile). */
 authorId?: string
}

const CATEGORY_TABS: { value: string; label: string; icon: IconType }[] = [
 { value: '', label: 'All', icon: FaGlobeAmericas },
 { value: 'health_tips', label: 'Health Tips', icon: FaHeartbeat },
 { value: 'article', label: 'Articles', icon: FaBookOpen },
 { value: 'news', label: 'News', icon: FaNewspaper },
 { value: 'wellness', label: 'Wellness', icon: FaSpa },
 { value: 'case_study', label: 'Case Studies', icon: FaMicroscope },
]

export default function PostFeed({
 currentUserId,
 currentUserType,
 showCreateButton = false,
 authorId,
}: PostFeedProps) {
 const [posts, setPosts] = useState<Post[]>([])
 const [loading, setLoading] = useState(true)
 const [loadingMore, setLoadingMore] = useState(false)
 const [page, setPage] = useState(1)
 const [totalPages, setTotalPages] = useState(1)
 const [activeCategory, setActiveCategory] = useState('')
 // The current user's reaction per post (postId → reaction key).
 const [userReactions, setUserReactions] = useState<Record<string, ReactionKey | null>>({})
 const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())

 const fetchPosts = useCallback(
 async (pageNum: number, category: string, append = false) => {
 try {
 if (append) {
 setLoadingMore(true)
 } else {
 setLoading(true)
 }

 const params = new URLSearchParams({
 page: String(pageNum),
 limit: '10',
 })
 if (category) params.set('category', category)
 if (authorId) params.set('authorId', authorId)

 const res = await fetch(`/api/posts?${params}`)
 const json = await res.json()

 if (json.success) {
 setPosts((prev) =>
 append ? [...prev, ...json.data.posts] : json.data.posts
 )
 setTotalPages(json.data.totalPages)
 }
 } catch (error) {
 console.error('Failed to fetch posts:', error)
 } finally {
 setLoading(false)
 setLoadingMore(false)
 }
 },
 [authorId]
 )

 useEffect(() => {
 setPage(1)
 fetchPosts(1, activeCategory)
 }, [activeCategory, fetchPosts])

 const handleLoadMore = useCallback(() => {
 const nextPage = page + 1
 setPage(nextPage)
 fetchPosts(nextPage, activeCategory, true)
 }, [page, activeCategory, fetchPosts])

 // ── Infinite scroll ──────────────────────────────────────────────────────
 // A sentinel at the end of the list; when it scrolls into view we load the
 // next page automatically (Facebook-style). A ref holds the latest guard so
 // the IntersectionObserver callback never sees stale state.
 const sentinelRef = useRef<HTMLDivElement>(null)
 const loadMoreRef = useRef<() => void>(() => {})
 loadMoreRef.current = () => {
 if (!loading && !loadingMore && page < totalPages) handleLoadMore()
 }
 useEffect(() => {
 const el = sentinelRef.current
 if (!el) return
 const obs = new IntersectionObserver(
 (entries) => { if (entries[0]?.isIntersecting) loadMoreRef.current() },
 { rootMargin: '300px' },
 )
 obs.observe(el)
 return () => obs.disconnect()
 }, [])

 // Adjust a post's reaction tallies/likeCount when moving from `from` → `to`.
 const applyReactionDelta = (
 list: Post[],
 postId: string,
 from: ReactionKey | null,
 to: ReactionKey | null,
 ) =>
 list.map((p) => {
 if (p.id !== postId) return p
 const reactions: ReactionCounts = { ...(p.reactions ?? {}) }
 if (from) reactions[from] = Math.max(0, (reactions[from] ?? 0) - 1)
 if (to) reactions[to] = (reactions[to] ?? 0) + 1
 const likeDelta = (to ? 1 : 0) - (from ? 1 : 0)
 return { ...p, reactions, likeCount: Math.max(0, p.likeCount + likeDelta) }
 })

 const handleReact = async (postId: string, type: ReactionKey) => {
 if (!currentUserId) return

 const prev = userReactions[postId] ?? null
 const next: ReactionKey | null = prev === type ? null : type // same reaction toggles off

 // Optimistic update
 setUserReactions((m) => ({ ...m, [postId]: next }))
 setPosts((list) => applyReactionDelta(list, postId, prev, next))

 try {
 const res = await fetch(`/api/posts/${postId}/like`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ type }),
 })
 const json = await res.json()
 if (json.success) {
 // Reconcile with authoritative server state
 setUserReactions((m) => ({ ...m, [postId]: json.data.userReaction ?? null }))
 setPosts((list) =>
 list.map((p) =>
 p.id === postId
 ? { ...p, reactions: json.data.reactions ?? p.reactions, likeCount: json.data.likeCount ?? p.likeCount }
 : p,
 ),
 )
 }
 } catch (error) {
 // Revert optimistic update on failure
 console.error('Failed to set reaction:', error)
 setUserReactions((m) => ({ ...m, [postId]: prev }))
 setPosts((list) => applyReactionDelta(list, postId, next, prev))
 }
 }

 // Back-compat shim: a plain Like tap is just the "like" reaction.
 const handleLike = (postId: string) => handleReact(postId, 'like')

 const handleComment = (postId: string) => {
 setExpandedComments((prev) => {
 const next = new Set(prev)
 if (next.has(postId)) {
 next.delete(postId)
 } else {
 next.add(postId)
 }
 return next
 })
 }

 const handlePostCreated = (post: Record<string, unknown>) => {
 // Add the new post to the top of the feed with _count
 const newPost = { ...post, _count: { comments: 0 } } as unknown as Post
 setPosts((prev) => [newPost, ...prev])
 }

 // Any authenticated user may post - role-agnostic per dynamic-roles rule.
 const showCreateForm = showCreateButton && !!currentUserType

 return (
 <div className="space-y-6">
 {/* Create post form - any logged-in user */}
 {showCreateForm && <CreatePostForm onPostCreated={handlePostCreated} />}

 {/* Category filter tabs */}
 <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
 <div className="flex gap-1.5 sm:gap-2 min-w-max">
 {CATEGORY_TABS.map((tab) => {
 const Icon = tab.icon
 return (
 <button
 key={tab.value}
 onClick={() => setActiveCategory(tab.value)}
 className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
 activeCategory === tab.value
 ? 'bg-[#0C6780] text-white dark:bg-accent dark:text-[#04121f]'
 : 'bg-subtle text-soft hover:text-fg hover:bg-line'
 }`}
 title={tab.label}
 >
 <Icon className="text-sm" />
 <span className="hidden sm:inline">{tab.label}</span>
 </button>
 )
 })}
 </div>
 </div>

 {/* Posts list */}
 {loading ? (
 <div className="space-y-4">
 {[1, 2, 3].map((i) => (
 <div key={i} className="bg-surface border border-line rounded-2xl shadow-sm p-5 animate-pulse">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-subtle" />
 <div className="flex-1">
 <div className="h-4 bg-subtle rounded w-32" />
 <div className="h-3 bg-subtle rounded w-24 mt-1.5" />
 </div>
 </div>
 <div className="mt-4 space-y-2">
 <div className="h-3 bg-subtle rounded w-full" />
 <div className="h-3 bg-subtle rounded w-3/4" />
 </div>
 </div>
 ))}
 </div>
 ) : posts.length === 0 ? (
 <div className="bg-surface border border-line rounded-2xl shadow-sm p-12 text-center">
 <FaPenFancy className="text-4xl text-faint mx-auto mb-3" />
 <h3 className="text-lg font-semibold text-soft">No posts yet</h3>
 <p className="text-faint text-sm mt-1">
 {activeCategory
 ? 'No posts in this category. Try a different filter.'
 : 'Be the first to share something with the community!'}
 </p>
 </div>
 ) : (
 <div className="space-y-4">
 {posts.map((post) => (
 <PostCard
 key={post.id}
 post={post}
 currentUserId={currentUserId}
 liked={!!userReactions[post.id]}
 userReaction={userReactions[post.id] ?? null}
 onLike={handleLike}
 onReact={handleReact}
 onComment={handleComment}
 >
 {expandedComments.has(post.id) && (
 <CommentSection
 postId={post.id}
 currentUserId={currentUserId}
 currentUserType={currentUserType}
 />
 )}
 </PostCard>
 ))}

 {/* Infinite scroll: sentinel auto-loads the next page when reached */}
 {page < totalPages && (
 <div ref={sentinelRef} className="flex justify-center py-6">
 <div className="w-6 h-6 border-2 border-[#0C6780] dark:border-accent border-t-transparent rounded-full animate-spin" aria-label="Loading more posts" />
 </div>
 )}
 {page >= totalPages && posts.length > 0 && (
 <p className="text-center text-xs text-faint py-6">You&apos;re all caught up.</p>
 )}
 </div>
 )}
 </div>
 )
}
