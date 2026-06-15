'use client'

import { useState, useEffect, useCallback } from 'react'
import { FaPenFancy, FaGlobeAmericas, FaHeartbeat, FaBookOpen, FaNewspaper, FaSpa, FaMicroscope } from 'react-icons/fa'
import type { IconType } from 'react-icons'
import PostCard from './PostCard'
import CommentSection from './CommentSection'
import CreatePostForm from './CreatePostForm'

interface Post {
 id: string
 content: string
 category: string | null
 tags: string[]
 imageUrl: string | null
 likeCount: number
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
}: PostFeedProps) {
 const [posts, setPosts] = useState<Post[]>([])
 const [loading, setLoading] = useState(true)
 const [loadingMore, setLoadingMore] = useState(false)
 const [page, setPage] = useState(1)
 const [totalPages, setTotalPages] = useState(1)
 const [activeCategory, setActiveCategory] = useState('')
 const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
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
 []
 )

 useEffect(() => {
 setPage(1)
 fetchPosts(1, activeCategory)
 }, [activeCategory, fetchPosts])

 const handleLoadMore = () => {
 const nextPage = page + 1
 setPage(nextPage)
 fetchPosts(nextPage, activeCategory, true)
 }

 const handleLike = async (postId: string) => {
 if (!currentUserId) return

 // Optimistic update
 const wasLiked = likedPosts.has(postId)
 setLikedPosts((prev) => {
 const next = new Set(prev)
 if (wasLiked) {
 next.delete(postId)
 } else {
 next.add(postId)
 }
 return next
 })

 setPosts((prev) =>
 prev.map((p) =>
 p.id === postId
 ? { ...p, likeCount: p.likeCount + (wasLiked ? -1 : 1) }
 : p
 )
 )

 try {
 const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' })
 const json = await res.json()
 if (json.success) {
 // Reconcile with server state
 setPosts((prev) =>
 prev.map((p) =>
 p.id === postId ? { ...p, likeCount: json.data.likeCount } : p
 )
 )
 setLikedPosts((prev) => {
 const next = new Set(prev)
 if (json.data.liked) {
 next.add(postId)
 } else {
 next.delete(postId)
 }
 return next
 })
 }
 } catch (error) {
 // Revert optimistic update on failure
 console.error('Failed to toggle like:', error)
 setLikedPosts((prev) => {
 const next = new Set(prev)
 if (wasLiked) {
 next.add(postId)
 } else {
 next.delete(postId)
 }
 return next
 })
 setPosts((prev) =>
 prev.map((p) =>
 p.id === postId
 ? { ...p, likeCount: p.likeCount + (wasLiked ? 1 : -1) }
 : p
 )
 )
 }
 }

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
 ? 'bg-blue-600 text-white'
 : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
 <div key={i} className="bg-white rounded-xl shadow p-6 animate-pulse">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-gray-200" />
 <div className="flex-1">
 <div className="h-4 bg-gray-200 rounded w-32" />
 <div className="h-3 bg-gray-200 rounded w-24 mt-1" />
 </div>
 </div>
 <div className="mt-3 space-y-2">
 <div className="h-3 bg-gray-200 rounded w-full" />
 <div className="h-3 bg-gray-200 rounded w-3/4" />
 </div>
 </div>
 ))}
 </div>
 ) : posts.length === 0 ? (
 <div className="bg-white rounded-xl shadow p-12 text-center">
 <FaPenFancy className="text-4xl text-gray-300 mx-auto mb-3" />
 <h3 className="text-lg font-semibold text-gray-500">No posts yet</h3>
 <p className="text-gray-400 text-sm mt-1">
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
 liked={likedPosts.has(post.id)}
 onLike={handleLike}
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

 {/* Load more */}
 {page < totalPages && (
 <div className="flex justify-center pt-4">
 <button
 onClick={handleLoadMore}
 disabled={loadingMore}
 className="px-6 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
 >
 {loadingMore ? (
 <span className="flex items-center gap-2">
 <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
 Loading...
 </span>
 ) : (
 'Load More'
 )}
 </button>
 </div>
 )}
 </div>
 )}
 </div>
 )
}
