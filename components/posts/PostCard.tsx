'use client'

import { useState } from 'react'
import Image from 'next/image'
import { FaCheckCircle, FaHeart, FaComment, FaShare } from 'react-icons/fa'

interface PostCardProps {
 post: {
 id: string
 content: string
 category: string | null
 tags: string[]
 imageUrl?: string | null
 likeCount: number
 companyId?: string | null
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
 company?: { id: string; companyName: string } | null
 _count: { comments: number }
 }
 currentUserId?: string
 onLike?: (postId: string) => void
 onComment?: (postId: string) => void
 liked?: boolean
 children?: React.ReactNode
}

const categoryColors: Record<string, string> = {
 health_tips: 'bg-green-100 text-green-700',
 article: 'bg-blue-100 text-blue-700',
 news: 'bg-orange-100 text-orange-700',
 case_study: 'bg-purple-100 text-purple-700',
 wellness: 'bg-pink-100 text-pink-700',
}

const categoryLabels: Record<string, string> = {
 health_tips: 'Health Tips',
 article: 'Article',
 news: 'News',
 case_study: 'Case Study',
 wellness: 'Wellness',
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

export default function PostCard({
 post,
 currentUserId,
 onLike,
 onComment,
 liked = false,
 children,
}: PostCardProps) {
 const [expanded, setExpanded] = useState(false)
 // Defensive fallback: a freshly-created post occasionally arrives without
 // its `author` relation (caller bug). Render a stub so the feed doesn't
 // crash - the next refetch will fill it in properly.
 const author = post.author ?? {
  id: '', firstName: 'Unknown', lastName: '', profileImage: null, userType: 'MEMBER', verified: false,
 }
 const isLong = post.content.length > 300
 const displayContent = isLong && !expanded ? post.content.slice(0, 300) + '...' : post.content
 const specialty = author.doctorProfile?.specialty?.join(', ')

 return (
 <div className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow duration-200 p-4 sm:p-6">
 {/* Author row */}
 <div className="flex items-start gap-3">
 {author.profileImage ? (
 <Image
 src={author.profileImage}
 alt={`${author.firstName} ${author.lastName}`}
 width={40}
 height={40}
 className="w-10 h-10 rounded-full object-cover flex-shrink-0"
 />
 ) : (
 <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">
 {getInitials(author.firstName, author.lastName)}
 </div>
 )}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 flex-wrap">
 <span className="font-semibold text-gray-900 text-sm sm:text-base">
 {/* Only prefix "Dr." for users with a doctorProfile - MEMBERs and other roles get their real name. */}
 {post.company ? post.company.companyName
  : author.doctorProfile ? `Dr. ${author.firstName} ${author.lastName}`
  : `${author.firstName} ${author.lastName}`}
 </span>
 {author.verified && (
 <FaCheckCircle className="text-blue-500 text-xs flex-shrink-0" title="Verified" />
 )}
 <span className="text-gray-400 text-xs sm:text-sm">
 {getRelativeTime(post.createdAt)}
 </span>
 </div>
 {post.company ? (
 <p className="text-gray-500 text-xs sm:text-sm truncate">
 Posted by {author.firstName} {author.lastName}
 </p>
 ) : specialty ? (
 <p className="text-gray-500 text-xs sm:text-sm truncate">{specialty}</p>
 ) : null}
 </div>
 </div>

 {/* Content */}
 <div className="mt-3">
 <p className="text-gray-800 text-sm sm:text-base whitespace-pre-wrap leading-relaxed">
 {displayContent}
 </p>
 {isLong && (
 <button
 onClick={() => setExpanded(!expanded)}
 className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-1"
 >
 {expanded ? 'Show less' : 'Read more'}
 </button>
 )}
 </div>

 {/* Post Image */}
 {post.imageUrl && (
 <div className="mt-3 rounded-lg overflow-hidden">
 <Image
 src={post.imageUrl}
 alt="Post attachment"
 width={400}
 height={300}
 className="w-full max-h-96 object-cover rounded-lg"
 />
 </div>
 )}

 {/* Category and Tags */}
 {(post.category || post.tags.length > 0) && (
 <div className="flex flex-wrap items-center gap-2 mt-3">
 {post.category && (
 <span
 className={`text-xs font-medium rounded-full px-3 py-1 ${
 categoryColors[post.category] || 'bg-gray-100 text-gray-700'
 }`}
 >
 {categoryLabels[post.category] || post.category}
 </span>
 )}
 {post.tags.map((tag, index) => (
 <span
 key={index}
 className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5"
 >
 #{tag}
 </span>
 ))}
 </div>
 )}

 {/* Action row */}
 <div className="flex items-center gap-4 sm:gap-6 mt-4 pt-3 border-t border-gray-100">
 <button
 onClick={() => onLike?.(post.id)}
 className={`flex items-center gap-1.5 text-sm transition-colors ${
 liked
 ? 'text-red-500 hover:text-red-600'
 : 'text-gray-500 hover:text-red-500'
 }`}
 disabled={!currentUserId}
 title={currentUserId ? (liked ? 'Unlike' : 'Like') : 'Sign in to like'}
 >
 <FaHeart className={liked ? 'fill-current' : ''} />
 <span>{post.likeCount}</span>
 </button>

 <button
 onClick={() => onComment?.(post.id)}
 className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-500 transition-colors"
 >
 <FaComment />
 <span>{post._count.comments}</span>
 </button>

 <button
 onClick={() => {
 if (typeof navigator !== 'undefined' && navigator.clipboard) {
 navigator.clipboard.writeText(`${window.location.origin}/community?post=${post.id}`)
 }
 }}
 className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-500 transition-colors"
 title="Copy link"
 >
 <FaShare />
 </button>
 </div>

 {/* Expandable children (CommentSection) */}
 {children}
 </div>
 )
}
