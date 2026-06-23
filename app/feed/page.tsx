'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  FaHeart, FaComment, FaCheckCircle, FaSignInAlt, FaUserPlus,
  FaUserMd, FaFire, FaComments, FaArrowRight,
} from 'react-icons/fa'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Post {
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

interface SuggestedUser {
  id: string
  firstName: string
  lastName: string
  userType: string
  profileImage: string | null
  verified: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function getInitials(first: string, last: string): string {
  return `${first[0] || ''}${last[0] || ''}`.toUpperCase()
}

const CATEGORY_LABELS: Record<string, string> = {
  health_tips: 'Health Tips', article: 'Article', news: 'News',
  wellness: 'Wellness', case_study: 'Case Study',
}

const CATEGORY_TABS = [
  { value: '', label: 'All' },
  { value: 'health_tips', label: 'Health Tips' },
  { value: 'article', label: 'Articles' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'news', label: 'News' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function PostCard({ post }: { post: Post }) {
  const authorName = post.company
    ? post.company.companyName
    : `${post.author.firstName} ${post.author.lastName}`

  return (
    <article className="bg-surface rounded-2xl border border-line hover:shadow-md transition-all overflow-hidden">
      {post.imageUrl && (
        <div className="h-40 overflow-hidden">
          <Image src={post.imageUrl} alt="" width={400} height={160} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2.5 mb-3">
          {post.author.profileImage ? (
            <Image src={post.author.profileImage} alt="" width={36} height={36} className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#0C6780]/10 text-[#0C6780] flex items-center justify-center text-xs font-bold flex-shrink-0">
              {getInitials(post.author.firstName, post.author.lastName)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-fg truncate">{authorName}</span>
              {post.author.verified && <FaCheckCircle className="text-blue-500 text-[10px] flex-shrink-0" />}
            </div>
            <p className="text-[10px] text-faint">{getRelativeTime(post.createdAt)}</p>
          </div>
          {post.category && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-subtle text-soft flex-shrink-0">
              {CATEGORY_LABELS[post.category] || post.category}
            </span>
          )}
        </div>
        <p className="text-sm text-soft line-clamp-3 mb-3">{post.content}</p>
        <div className="flex items-center gap-4 text-xs text-faint">
          <span className="flex items-center gap-1"><FaHeart className="text-red-400" /> {post.likeCount}</span>
          <span className="flex items-center gap-1"><FaComment /> {post._count.comments}</span>
          <span className="ml-auto text-[#0C6780] font-medium cursor-default">Read more →</span>
        </div>
      </div>
    </article>
  )
}

function PeopleYouMayKnow({ users }: { users: SuggestedUser[] }) {
  return (
    <aside className="bg-surface rounded-2xl border border-line overflow-hidden">
      <div className="px-4 py-3 border-b border-line flex items-center gap-2">
        <FaUserMd className="text-[#0C6780] text-sm" />
        <h2 className="text-sm font-bold text-fg">People You May Know</h2>
      </div>
      <div className="p-3 flex flex-col gap-1">
        {users.length > 0 ? users.map(u => (
          <div key={u.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-subtle transition-colors">
            {u.profileImage ? (
              <Image src={u.profileImage} alt="" width={32} height={32} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#0C6780]/10 text-[#0C6780] flex items-center justify-center text-xs font-bold flex-shrink-0">
                {getInitials(u.firstName, u.lastName)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-fg truncate flex items-center gap-1">
                {u.firstName} {u.lastName}
                {u.verified && <FaCheckCircle className="text-blue-500 text-[8px]" />}
              </p>
              <p className="text-[10px] text-faint truncate">{u.userType.replace(/_/g, ' ').toLowerCase()}</p>
            </div>
            <Link
              href="/signup"
              className="text-[10px] font-semibold text-[#0C6780] px-2 py-1 rounded-lg border border-[#0C6780]/30 hover:bg-[#0C6780]/5 transition-colors flex-shrink-0"
            >
              Connect
            </Link>
          </div>
        )) : (
          <div className="px-3 py-4 text-center">
            <p className="text-xs text-soft">Find and connect with health professionals</p>
          </div>
        )}
      </div>
      <div className="p-3 border-t border-line">
        <Link
          href="/signup"
          className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-[#0C6780] text-white text-xs font-semibold rounded-xl hover:bg-[#001E40] transition-colors"
        >
          <FaUserPlus className="text-[10px]" /> Join to connect
        </Link>
      </div>
    </aside>
  )
}

function MessagesPanel() {
  return (
    <aside className="bg-surface rounded-2xl border border-line overflow-hidden">
      <div className="px-4 py-3 border-b border-line flex items-center gap-2">
        <FaComments className="text-pink-500 text-sm" />
        <h2 className="text-sm font-bold text-fg">Messages</h2>
      </div>
      <div className="p-4 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center mx-auto">
          <FaComments className="text-pink-400 text-xl" />
        </div>
        <p className="text-xs text-soft font-medium">Chat with health professionals</p>
        <p className="text-[11px] text-faint">Sign in to access your messages and connect with providers.</p>
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-pink-50 text-pink-700 text-xs font-semibold rounded-xl hover:bg-pink-100 transition-colors border border-pink-200"
        >
          <FaSignInAlt className="text-[10px]" /> Sign in to message
        </Link>
      </div>
    </aside>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PublicFeedPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [activeCategory, setActiveCategory] = useState('')
  const [authChecked, setAuthChecked] = useState(false)

  // Redirect authenticated users to their own dashboard feed
  useEffect(() => {
    try {
      const stored = localStorage.getItem('mediwyz_user')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.id) {
          const DEDICATED: Record<string, string> = {
            insurance:          '/insurance/feed',
            corporate:          '/corporate/feed',
            'referral-partner': '/referral-partner/feed',
            'regional-admin':   '/regional/feed',
            admin:              '/admin/feed',
          }
          const SLUGS: Record<string, string> = {
            patient: 'patients', doctor: 'doctors', nurse: 'nurses',
            'child-care-nurse': 'childcare', pharmacy: 'pharmacists',
            lab: 'lab-technicians', ambulance: 'emergency',
            caregiver: 'caregivers', physiotherapist: 'physiotherapists',
            dentist: 'dentists', optometrist: 'optometrists', nutritionist: 'nutritionists',
          }
          const dest = DEDICATED[parsed.userType] ??
            `/provider/${SLUGS[parsed.userType] ?? 'patients'}/feed`
          router.replace(dest)
          return
        }
      }
    } catch {
      // guest
    }
    setAuthChecked(true)
  }, [router])

  // Load suggested users (providers) for the right panel
  useEffect(() => {
    fetch('/api/search/providers?type=DOCTOR&limit=5')
      .then(r => r.json())
      .then(json => {
        if (json.success && Array.isArray(json.data)) {
          setSuggestedUsers(json.data.slice(0, 5).map((u: Record<string, unknown>) => ({
            id: u.id as string,
            firstName: u.firstName as string,
            lastName: u.lastName as string,
            userType: (u.userType as string) || 'DOCTOR',
            profileImage: (u.profileImage as string | null) ?? null,
            verified: (u.verified as boolean) || false,
          })))
        }
      })
      .catch(() => {})
  }, [])

  const fetchPosts = useCallback(async (pageNum: number, category: string, append = false) => {
    try {
      if (append) setLoadingMore(true)
      else setLoading(true)
      const params = new URLSearchParams({ page: String(pageNum), limit: '10', sortBy: 'reactions' })
      if (category) params.set('category', category)
      const res = await fetch(`/api/posts?${params}`)
      const json = await res.json()
      if (json.success) {
        const newPosts: Post[] = json.data.posts || []
        setPosts(prev => append ? [...prev, ...newPosts] : newPosts)
        setHasMore(pageNum < (json.data.totalPages || 1))
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    setPage(1)
    fetchPosts(1, activeCategory)
  }, [activeCategory, fetchPosts])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchPosts(next, activeCategory, true)
  }

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#0C6780] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

      {/* CENTER: Feed (8 cols) */}
      <div className="lg:col-span-8">
        {/* Page header */}
        <div className="flex items-center gap-2 mb-4">
          <FaFire className="text-orange-500" />
          <div>
            <h1 className="text-lg font-bold text-fg">Community Health Feed</h1>
            <p className="text-xs text-soft">Most reacted posts - no account needed to browse</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-line rounded-lg hover:border-[#0C6780] hover:text-[#0C6780] transition-colors"
            >
              <FaSignInAlt /> Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#0C6780] text-white rounded-lg hover:bg-[#001E40] transition-colors"
            >
              <FaUserPlus /> Join free
            </Link>
          </div>
        </div>

        {/* Guest banner */}
        <div className="bg-[#9AE1FF]/20 border border-[#9AE1FF]/40 rounded-xl py-2 px-4 mb-4">
          <p className="text-xs text-fg">
            <span className="font-semibold">You&apos;re browsing as a guest.</span>{' '}
            <Link href="/signup" className="underline font-medium hover:text-[#0C6780]">
              Create a free account
            </Link>{' '}
            to like, comment, and share health tips.
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide">
          {CATEGORY_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveCategory(tab.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeCategory === tab.value
                  ? 'bg-[#0C6780] text-white shadow-sm'
                  : 'bg-surface text-soft border border-line hover:border-[#0C6780] hover:text-[#0C6780]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Posts */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-surface rounded-2xl border border-line p-4 animate-pulse">
                <div className="flex gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-line" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-line rounded w-1/3" />
                    <div className="h-2.5 bg-subtle rounded w-1/5" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="h-3 bg-line rounded w-full" />
                  <div className="h-3 bg-line rounded w-5/6" />
                  <div className="h-3 bg-subtle rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-line p-10 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-soft text-sm">No posts yet in this category.</p>
            <button onClick={() => setActiveCategory('')} className="mt-3 text-sm text-[#0C6780] underline">
              View all posts
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => <PostCard key={post.id} post={post} />)}
            {hasMore && (
              <div className="text-center pt-2">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-2.5 bg-surface border border-line text-sm font-semibold text-soft rounded-xl hover:border-[#0C6780] hover:text-[#0C6780] transition-colors disabled:opacity-50"
                >
                  {loadingMore ? 'Loading…' : 'Load more posts'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT: People You May Know + Messages (4 cols) */}
      <div className="hidden lg:block lg:col-span-4">
        <div className="sticky top-4 space-y-4">
          <PeopleYouMayKnow users={suggestedUsers} />
          <MessagesPanel />

          {/* Book a consultation CTA */}
          <div className="bg-gradient-to-br from-[#001E40] to-[#0C6780] rounded-2xl p-4 text-white">
            <p className="text-xs font-semibold opacity-80 mb-1">Ready to get care?</p>
            <p className="text-sm font-bold mb-3">Find and book a health provider in minutes</p>
            <Link
              href="/search/results?category=providers"
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-surface text-fg px-3 py-1.5 rounded-lg hover:bg-white/90 transition-colors"
            >
              Book now <FaArrowRight className="text-[10px]" />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile: right panel stacked below */}
      <div className="mt-2 grid sm:grid-cols-2 gap-4 lg:hidden">
        <PeopleYouMayKnow users={suggestedUsers} />
        <MessagesPanel />
      </div>

    </div>
  )
}
