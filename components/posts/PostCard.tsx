'use client'

import { useState } from 'react'
import Image from 'next/image'
import { FaCheckCircle, FaRegHeart, FaHeart, FaRegComment, FaShare, FaEllipsisH } from 'react-icons/fa'
import { Card, Badge, Avatar } from '@/components/ui/ds'
import { cn } from '@/lib/cn'

interface PostCardProps {
  post: {
    id: string
    content: string
    category: string | null
    tags: string[]
    imageUrl?: string | null
    companyId?: string | null
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
    company?: { id: string; companyName: string } | null
    _count: { comments: number }
  }
  currentUserId?: string
  onLike?: (postId: string) => void
  onComment?: (postId: string) => void
  liked?: boolean
  children?: React.ReactNode
}

const CATEGORY_TONE: Record<string, 'success' | 'info' | 'warning' | 'accent' | 'danger'> = {
  health_tips: 'success',
  article: 'info',
  news: 'warning',
  case_study: 'accent',
  wellness: 'danger',
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

export default function PostCard({
  post,
  currentUserId,
  onLike,
  onComment,
  liked = false,
  children,
}: PostCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  // Defensive fallback for a freshly-created post missing its author relation.
  const author = post.author ?? {
    id: '', firstName: 'Unknown', lastName: '', profileImage: null, userType: 'MEMBER', verified: false,
  }
  const isLong = post.content.length > 300
  const displayContent = isLong && !expanded ? post.content.slice(0, 300) + '' : post.content
  const specialty = author.doctorProfile?.specialty?.join(', ')

  const displayName = post.company
    ? post.company.companyName
    : author.doctorProfile
      ? `Dr. ${author.firstName} ${author.lastName}`
      : `${author.firstName} ${author.lastName}`

  const subtitle = post.company
    ? `Posted by ${author.firstName} ${author.lastName}`
    : specialty || author.userType?.toLowerCase().replace(/_/g, ' ')

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/community?post=${post.id}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-4 sm:p-5">
        {/* Author row */}
        <div className="flex items-start gap-3">
          <Avatar src={post.company ? null : author.profileImage} name={displayName} size="md" ring />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-fg text-sm sm:text-[15px] leading-tight">{displayName}</span>
              {author.verified && (
                <FaCheckCircle className="text-[#0C6780] dark:text-accent text-xs flex-shrink-0" title="Verified" />
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-faint mt-0.5">
              {subtitle && <span className="capitalize truncate">{subtitle}</span>}
              {subtitle && <span aria-hidden></span>}
              <span className="whitespace-nowrap">{getRelativeTime(post.createdAt)}</span>
            </div>
          </div>
          <button
            className="p-2 -mt-1 -mr-1 rounded-full text-faint hover:text-fg hover:bg-subtle transition-colors"
            aria-label="Post options"
          >
            <FaEllipsisH className="text-sm" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-3">
          <p className="text-[15px] text-fg/90 whitespace-pre-wrap leading-relaxed">{displayContent}</p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[#0C6780] dark:text-accent hover:underline text-sm font-medium mt-1"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {/* Category + tags */}
        {(post.category || post.tags.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {post.category && (
              <Badge tone={CATEGORY_TONE[post.category] || 'neutral'}>
                {categoryLabels[post.category] || post.category}
              </Badge>
            )}
            {post.tags.map((tag, i) => (
              <span key={i} className="text-xs text-soft bg-subtle rounded-full px-2 py-0.5">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Image  full-bleed */}
      {post.imageUrl && (
        <div className="bg-subtle">
          <Image
            src={post.imageUrl}
            alt="Post attachment"
            width={800}
            height={500}
            className="w-full max-h-[28rem] object-cover"
          />
        </div>
      )}

      {/* Counts summary */}
      {(post.likeCount > 0 || post._count.comments > 0) && (
        <div className="flex items-center justify-between px-4 sm:px-5 pt-3 text-xs text-faint">
          <span className="flex items-center gap-1">
            {post.likeCount > 0 && (
              <>
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white">
                  <FaHeart className="text-[8px]" />
                </span>
                {post.likeCount}
              </>
            )}
          </span>
          {post._count.comments > 0 && <span>{post._count.comments} comments</span>}
        </div>
      )}

      {/* Action row */}
      <div className="grid grid-cols-3 gap-1 px-2 sm:px-3 py-1.5 mt-2 border-t border-line">
        <ActionButton
          active={liked}
          activeClass="text-red-500"
          disabled={!currentUserId}
          onClick={() => onLike?.(post.id)}
          icon={liked ? <FaHeart className="scale-110" /> : <FaRegHeart />}
          label="Like"
        />
        <ActionButton
          onClick={() => onComment?.(post.id)}
          icon={<FaRegComment />}
          label="Comment"
        />
        <ActionButton
          onClick={handleShare}
          icon={<FaShare />}
          label={copied ? 'Copied!' : 'Share'}
        />
      </div>

      {/* Expandable children (CommentSection) */}
      {children && <div className="border-t border-line">{children}</div>}
    </Card>
  )
}

function ActionButton({
  icon, label, onClick, active, activeClass, disabled,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  active?: boolean
  activeClass?: string
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors',
        'text-soft hover:bg-subtle hover:text-fg disabled:opacity-50 disabled:cursor-not-allowed',
        active && activeClass,
      )}
    >
      {icon}
      <span className="hidden xs:inline">{label}</span>
    </button>
  )
}
