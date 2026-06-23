'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  FaInfoCircle, FaNewspaper, FaStar, FaHeartbeat, FaCog, FaLock,
  FaConciergeBell, FaClock, FaArrowRight,
} from 'react-icons/fa'
import { useUser } from '@/hooks/useUser'
import ProfileHero from '@/components/profile/ProfileHero'

/**
 * Unified profile page - the SINGLE source of truth for user profile info.
 * Inspired by Facebook + LinkedIn: public hero + tabs for About / Posts /
 * Reviews (all publicly visible for SEO) plus self-only private tabs for
 * Health Goals / Documents / Settings.
 *
 * Replaces the per-user-type profile pages that previously scattered
 * profile fields across the AI Health tab, the Health Tracker "Profile &
 * Goals" tab, the Settings page's documents tab, etc.
 *
 * Route: /profile/[id] - same URL whether it's your own or someone else's.
 * Privacy gating happens client-side based on `currentUser.id === id`.
 */

const PostFeed = dynamic(() => import('@/components/posts/PostFeed'), { ssr: false })
const CreatePostForm = dynamic(() => import('@/components/posts/CreatePostForm'), { ssr: false })
const ProviderReviews = dynamic(() => import('@/components/shared/ProviderReviews'), { ssr: false })
const ProfileGoalsTab = dynamic(() => import('@/components/health-tracker/tabs/ProfileGoalsTab'), { ssr: false })
const UserProfile = dynamic(() => import('@/components/profile/UserProfile'), { ssr: false })
const AvailabilityPreview = dynamic(() => import('@/components/providers/AvailabilityPreview'), { ssr: false })

type TabId = 'about' | 'posts' | 'reviews' | 'services' | 'health' | 'settings'

interface ProfileData {
  id: string
  firstName: string
  lastName: string
  email: string
  profileImage?: string | null
  coverImage?: string | null
  phone?: string
  address?: string
  userType: string
  verified: boolean
  createdAt: string
  // Profile-specific (enriched by backend - may be partial)
  bio?: string | null
  specialty?: string | null
  rating?: number | null
  experience?: number
  isProvider?: boolean
}

export default function UnifiedProfilePage() {
  const params = useParams<{ id: string }>()
  const { user: currentUser } = useUser()
  const profileId = params?.id
  const isSelf = !!currentUser && currentUser.id === profileId

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('about')

  const fetchProfile = useCallback(async () => {
    if (!profileId) return
    try {
      setLoading(true)
      const res = await fetch(`/api/users/${profileId}`, { credentials: 'include' })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to load profile')
      setProfile(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [profileId])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  /** Uploads a file via /api/upload and patches the profile image/cover URL. */
  const uploadImage = useCallback(async (file: File, imageType: 'profile_image' | 'cover_image'): Promise<void> => {
    const form = new FormData()
    form.append('file', file)
    form.append('type', imageType)
    form.append('name', file.name)
    const res = await fetch('/api/upload', { method: 'POST', body: form, credentials: 'include' })
    const json = await res.json()
    if (!json.success) throw new Error(json.message || 'Upload failed')
    // Re-fetch so the hero reflects the new URL without a reload.
    await fetchProfile()
  }, [fetchProfile])

  const tabs = useMemo(() => {
    const publicTabs: { id: TabId; label: string; icon: React.ElementType; private?: boolean }[] = [
      { id: 'about', label: 'About', icon: FaInfoCircle },
      { id: 'posts', label: 'Posts', icon: FaNewspaper },
    ]
    if (profile?.isProvider) {
      publicTabs.push({ id: 'services', label: 'Services', icon: FaConciergeBell })
      publicTabs.push({ id: 'reviews', label: 'Reviews', icon: FaStar })
    }
    if (isSelf) {
      publicTabs.push(
        { id: 'health', label: 'Health Goals', icon: FaHeartbeat, private: true },
        { id: 'settings', label: 'Settings', icon: FaCog, private: true },
      )
    }
    return publicTabs
  }, [isSelf, profile?.isProvider])

  if (loading) return <ProfileSkeleton />
  if (error || !profile) return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-4 text-red-800 dark:text-red-300 text-sm">
        {error ?? 'Profile not found.'}
      </div>
    </div>
  )

  return (
    <div className="w-full py-4 sm:py-6 space-y-4">
      <ProfileHero
        userId={profile.id}
        firstName={profile.firstName}
        lastName={profile.lastName}
        profileImage={profile.profileImage}
        coverImage={profile.coverImage}
        userType={profile.userType}
        roleLabel={profile.specialty || humanizeRole(profile.userType)}
        verified={profile.verified}
        rating={profile.rating}
        location={profile.address}
        bio={profile.bio}
        isSelf={isSelf}
        stats={buildStats(profile)}
        onAvatarUpload={(f) => uploadImage(f, 'profile_image')}
        onCoverUpload={(f) => uploadImage(f, 'cover_image')}
      />

      {/*  Tab bar (Facebook-style)  */}
      <div className="bg-surface rounded-2xl shadow-sm border border-line">
        <nav className="flex overflow-x-auto border-b border-line px-2">
          {tabs.map((t) => {
            const Icon = t.icon
            const active = activeTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors relative flex items-center gap-2
                  ${active ? 'text-[#0C6780] dark:text-accent' : 'text-soft hover:text-fg'}`}
              >
                <Icon className="text-xs" /> {t.label}
                {t.private && <FaLock className="text-[10px] text-faint" title="Visible only to you" />}
                {active && <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#0C6780] dark:bg-accent rounded-full" />}
              </button>
            )
          })}
        </nav>

        <div className="p-4 sm:p-6">
          {activeTab === 'about' && <AboutTab profile={profile} isSelf={isSelf} onSaved={fetchProfile} />}
          {activeTab === 'posts' && (
            <div className="space-y-4">
              {isSelf && <CreatePostForm onPostCreated={() => { /* PostFeed refetches on mount */ }} />}
              <PostFeed currentUserId={currentUser?.id ?? ''} currentUserType={currentUser?.userType ?? ''} />
            </div>
          )}
          {activeTab === 'services' && profile.isProvider && (
            <ProfileServicesTab userId={profile.id} userType={profile.userType} />
          )}
          {activeTab === 'reviews' && profile.isProvider && (
            <ProviderReviews providerUserId={profile.id} />
          )}
          {activeTab === 'health' && isSelf && (
            <PrivateSection title="Health profile + goals">
              <ProfileGoalsTab />
            </PrivateSection>
          )}
          {activeTab === 'settings' && isSelf && (
            <PrivateSection title="Account settings">
              <UserProfile userId={profile.id} userType={profile.userType} settingsPath={`/profile/${profile.id}`} />
            </PrivateSection>
          )}
        </div>
      </div>
    </div>
  )
}

function AboutTab({ profile, isSelf, onSaved }: { profile: ProfileData; isSelf: boolean; onSaved: () => void; }) {
  const [editingBio, setEditingBio] = useState(false)
  const [draft, setDraft] = useState(profile.bio ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function saveBio() {
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/users/${profile.id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: draft.trim() || null }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Save failed')
      setEditingBio(false)
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-5">
      <Section title="Intro">
        {!editingBio && (
          <>
            <p className="text-sm text-fg/90 whitespace-pre-wrap">
              {profile.bio || (isSelf
                ? <span className="text-faint italic">Add a bio so members and providers know who you are.</span>
                : 'No bio yet.'
              )}
            </p>
            {isSelf && (
              <button
                onClick={() => { setDraft(profile.bio ?? ''); setEditingBio(true) }}
                className="mt-2 text-xs font-semibold text-[#0C6780] dark:text-accent hover:underline"
              >
                {profile.bio ? 'Edit bio' : 'Add bio'}
              </button>
            )}
          </>
        )}
        {editingBio && (
          <div className="space-y-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              maxLength={500}
              className="w-full text-sm bg-surface text-fg border border-line rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#0C6780] placeholder:text-faint"
              placeholder="Tell members and providers a bit about yourself."
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-faint">{draft.length}/500</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingBio(false)}
                  className="px-3 py-1.5 text-soft hover:bg-subtle rounded-lg"
                  disabled={saving}
                >Cancel</button>
                <button
                  onClick={saveBio}
                  className="px-3 py-1.5 bg-[#0C6780] hover:bg-[#001E40] text-white font-semibold rounded-lg disabled:opacity-50"
                  disabled={saving}
                >{saving ? 'Saving' : 'Save'}</button>
              </div>
            </div>
            {error && <div className="text-xs text-red-600">{error}</div>}
          </div>
        )}
      </Section>

      {profile.isProvider && (
        <Section title="Availability">
          <AvailabilityPreview
            providerId={profile.id}
            roleSlug={profile.userType.toLowerCase().replace(/_/g, '-')}
          />
        </Section>
      )}

      <Section title="Details">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <DetailRow label="Role" value={humanizeRole(profile.userType)} />
          {profile.specialty && <DetailRow label="Specialty" value={profile.specialty} />}
          {typeof profile.experience === 'number' && <DetailRow label="Experience" value={`${profile.experience} years`} />}
          <DetailRow label="Member since" value={new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} />
          {/* Email + phone are semi-private: shown only to self here. */}
          {isSelf && (
            <>
              <DetailRow label="Email" value={profile.email} />
              {profile.phone && <DetailRow label="Phone" value={profile.phone} />}
            </>
          )}
        </dl>
        {!isSelf && (
          <p className="mt-3 text-[11px] text-faint">Contact details are kept private. Message through MediWyz to reach {profile.firstName}.</p>
        )}
      </Section>
    </div>
  )
}

interface ServiceConfig {
  id: string
  priceOverride: number | null
  serviceModes?: string[]
  platformService: {
    id: string
    serviceName: string
    category: string
    description: string | null
    defaultPrice: number
    duration: number | null
    providerType: string
  }
}

// Booking modes a service supports, derived from its linked workflows.
const SERVICE_MODE_LABELS: Record<string, string> = {
  office: 'At Office', home: 'At Home', video: 'Video', audio: 'Phone',
  emergency: 'Emergency', delivery: 'Delivery',
}

function ProfileServicesTab({ userId, userType }: { userId: string; userType: string }) {
  const [configs, setConfigs] = useState<ServiceConfig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/services/provider/${userId}`)
      .then(r => r.json())
      .then(json => { if (json.success) setConfigs(json.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="h-16 bg-subtle rounded-xl animate-pulse" />)}
    </div>
  )

  if (configs.length === 0) return (
    <div className="text-center py-10">
      <FaConciergeBell className="text-3xl text-faint mx-auto mb-2" />
      <p className="text-sm font-medium text-soft">No services listed yet.</p>
      <p className="text-xs text-faint mt-1">Ask this provider about their services directly.</p>
    </div>
  )

  // Group by category
  const grouped: Record<string, ServiceConfig[]> = {}
  for (const cfg of configs) {
    const cat = cfg.platformService.category
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(cfg)
  }

  const roleSlug = userType.toLowerCase().replace(/_/g, '-')

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-soft mb-3 capitalize">
            {category.replace(/_/g, ' ')}
          </h4>
          <div className="space-y-2">
            {items.map(cfg => {
              const svc = cfg.platformService
              const price = cfg.priceOverride ?? svc.defaultPrice
              return (
                <div key={cfg.id} className="flex items-start gap-3 p-3 rounded-xl border border-line hover:bg-subtle transition-all">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-fg">{svc.serviceName}</span>
                      {(cfg.serviceModes ?? []).map(mode => (
                        SERVICE_MODE_LABELS[mode] ? (
                          <span key={mode} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#0C6780]/10 text-[#0C6780] dark:text-accent">
                            {SERVICE_MODE_LABELS[mode]}
                          </span>
                        ) : null
                      ))}
                    </div>
                    {svc.description && (
                      <p className="text-xs text-soft mt-0.5 line-clamp-2">{svc.description}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-sm font-bold text-fg">Rs {price.toLocaleString()}</div>
                    {svc.duration && (
                      <div className="flex items-center gap-0.5 text-[11px] text-faint justify-end mt-0.5">
                        <FaClock className="text-[9px]" /> {svc.duration}m
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
      <div className="pt-2 text-center">
        <Link
          href={`/search/${roleSlug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0C6780] dark:text-accent hover:underline transition-colors"
        >
          Book this provider <FaArrowRight className="text-xs" />
        </Link>
      </div>
    </div>
  )
}

function PrivateSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-soft">
        <FaLock className="text-faint" />
        <span>{title}</span>
        <span className="ml-auto text-[10px] font-medium bg-subtle text-soft px-2 py-0.5 rounded-full">Visible only to you</span>
      </div>
      {children}
    </section>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-soft mb-2">{title}</h3>
      {children}
    </section>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[11px] font-semibold uppercase text-faint tracking-wide">{label}</dt>
      <dd className="text-fg">{value}</dd>
    </div>
  )
}

function buildStats(profile: ProfileData): Array<{ label: string; value: string | number }> {
  const stats: Array<{ label: string; value: string | number }> = []
  if (typeof profile.rating === 'number' && profile.rating > 0) {
    stats.push({ label: 'Rating', value: `${profile.rating.toFixed(1)} ` })
  }
  if (typeof profile.experience === 'number' && profile.experience > 0) {
    stats.push({ label: 'years experience', value: profile.experience })
  }
  stats.push({ label: 'Member since', value: new Date(profile.createdAt).getFullYear() })
  return stats
}

function humanizeRole(userType: string): string {
  return userType
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ')
}

function ProfileSkeleton() {
  return (
    <div className="w-full py-4 sm:py-6 space-y-4">
      <div className="bg-surface rounded-2xl border border-line overflow-hidden">
        <div className="h-56 bg-subtle animate-pulse" />
        <div className="p-6 -mt-16">
          <div className="w-32 h-32 rounded-full bg-subtle border-4 border-surface animate-pulse" />
          <div className="mt-4 h-6 w-48 bg-subtle rounded animate-pulse" />
          <div className="mt-2 h-4 w-32 bg-subtle rounded animate-pulse" />
        </div>
      </div>
      <div className="h-48 bg-subtle rounded-2xl animate-pulse" />
    </div>
  )
}
