'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FaHeart, FaComment, FaCheckCircle, FaArrowRight, FaSearch } from 'react-icons/fa'

interface PostPreview {
  id: string
  content: string
  category: string | null
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
  }
  company?: { id: string; companyName: string } | null
  _count: { comments: number }
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function getInitials(first: string, last: string): string {
  return `${first[0] || ''}${last[0] || ''}`.toUpperCase()
}

const ROLE_LABELS: Record<string, string> = {
  DOCTOR: 'Doctor', NURSE: 'Nurse', PATIENT: 'Patient',
  PHARMACIST: 'Pharmacist', DENTIST: 'Dentist', NUTRITIONIST: 'Nutritionist',
  PHYSIOTHERAPIST: 'Physiotherapist', OPTOMETRIST: 'Optometrist',
  CAREGIVER: 'Caregiver', LAB_TECHNICIAN: 'Lab Tech',
  NANNY: 'Childcare', EMERGENCY_WORKER: 'Emergency',
}

export default function CommunityPosts() {
  const [posts, setPosts] = useState<PostPreview[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts
    const q = searchQuery.toLowerCase()
    return posts.filter(p =>
      p.content.toLowerCase().includes(q) ||
      (p.category?.toLowerCase().includes(q)) ||
      `${p.author.firstName} ${p.author.lastName}`.toLowerCase().includes(q)
    )
  }, [posts, searchQuery])

  useEffect(() => {
    fetch('/api/posts?limit=12&sort=popular')
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data?.posts) {
          setPosts(json.data.posts)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section className="py-8 sm:py-12 bg-surface">
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14">
          <div className="animate-pulse">
            <div className="h-8 bg-line rounded w-64 mb-6" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 lg:gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-subtle rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (posts.length === 0) return null

  return (
    <section className="py-8 sm:py-12 bg-surface">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14">
        {/* Sticky header - pinned to the top of the viewport while the user
            scrolls past the community grid. Negative horizontal margins +
            matching padding give it an edge-to-edge backdrop. */}
        <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-10 xl:-mx-14 px-4 sm:px-6 lg:px-10 xl:px-14 py-4 mb-6 bg-white/95 backdrop-blur-sm border-b border-line">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-fg">From the Community</h2>
              <p className="text-sm sm:text-base text-soft mt-0.5">
                Most reacted posts on MediWyz - browse freely, no account needed
              </p>
            </div>
            <Link
              href="/feed"
              className="hidden sm:flex flex-col items-end gap-0.5 group mt-1"
            >
              <span className="flex items-center gap-1.5 text-sm font-medium text-[#0C6780] group-hover:text-[#001E40] transition-colors">
                See All <FaArrowRight className="text-xs" />
              </span>
              <span className="text-[10px] text-faint group-hover:text-soft transition-colors">No login needed</span>
            </Link>
          </div>
          {/* Search input */}
          <div className="relative sm:w-64">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-faint text-xs" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780] bg-subtle"
            />
          </div>
        </div>

        {filteredPosts.length === 0 && !loading ? (
          <div className="text-center py-12">
            <p className="text-sm text-soft">No posts match &ldquo;{searchQuery}&rdquo;</p>
            <button onClick={() => setSearchQuery('')} className="mt-2 text-xs text-[#0C6780] hover:underline">Clear search</button>
          </div>
        ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {filteredPosts.map(post => (
            <article
              key={post.id}
              className="bg-surface rounded-2xl border border-line hover:shadow-lg transition-all overflow-hidden group"
            >
              {/* Post image if available */}
              {post.imageUrl && (
                <div className="h-36 overflow-hidden">
                  <Image
                    src={post.imageUrl}
                    alt=""
                    width={400}
                    height={144}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              )}

              <div className="p-4">
                {/* Author */}
                <div className="flex items-center gap-2.5 mb-3">
                  {post.author.profileImage ? (
                    <Image
                      src={post.author.profileImage}
                      alt=""
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#0C6780]/10 text-[#0C6780] flex items-center justify-center text-xs font-bold">
                      {getInitials(post.author.firstName, post.author.lastName)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-fg truncate">
                        {post.company ? post.company.companyName : `${post.author.firstName} ${post.author.lastName}`}
                      </span>
                      {post.author.verified && <FaCheckCircle className="text-blue-500 text-[10px] flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-faint">
                      <span>{ROLE_LABELS[post.author.userType] || post.author.userType}</span>
                      <span></span>
                      <span>{getRelativeTime(post.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Category badge */}
                {post.category && (
                  <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-subtle text-soft mb-2">
                    {post.category.replace(/_/g, ' ')}
                  </span>
                )}

                {/* Content preview */}
                <p className="text-sm text-soft line-clamp-3 mb-3">{post.content}</p>

                {/* Engagement */}
                <div className="flex items-center gap-4 text-xs text-faint">
                  <span className="flex items-center gap-1">
                    <FaHeart className="text-[10px]" /> {post.likeCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <FaComment className="text-[10px]" /> {post._count.comments}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
        )}

        {/* Mobile "See All" link */}
        <div className="text-center mt-6 sm:hidden">
          <Link
            href="/feed"
            className="inline-flex flex-col items-center gap-0.5 px-5 py-2.5 bg-[#0C6780] text-white rounded-xl text-sm font-medium hover:bg-[#001E40] transition-colors"
          >
            <span className="flex items-center gap-2">See All Posts <FaArrowRight className="text-xs" /></span>
            <span className="text-[10px] opacity-80">No login needed</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
