'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'
import { DashboardLayout, DashboardLoadingState } from '@/components/dashboard'
import DashboardSidebar, { type SidebarItem } from '@/components/dashboard/DashboardSidebar'
import HealthwyzLogo from '@/components/ui/HealthwyzLogo'
import { getSidebarConfig } from '@/lib/dashboard/sidebarRegistry'
import { useDynamicSearchItems } from '@/hooks/useDynamicSearchItems'
import { useRoleFeatureConfig, filterSidebarByFeatures } from '@/hooks/useRoleFeatureConfig'
import { getSearchItems } from '@/lib/dashboard/patientHealthItems'
import {
  FaHome, FaRss, FaBriefcaseMedical, FaMoneyBillWave, FaCubes,
  FaCogs, FaProjectDiagram, FaVideo, FaPhone, FaComments, FaBuilding,
  FaBars,
} from 'react-icons/fa'
import { getPatientHealthItems } from '@/lib/dashboard/patientHealthItems'

const FALLBACK_SLUGS: Record<string, string> = { patient: 'patients' }

function getProviderSidebarItems(base: string): SidebarItem[] {
  return [
    { id: 'feed', label: 'Feed', icon: FaRss, color: 'text-orange-600', bgColor: 'bg-orange-50', href: `${base}/feed` },
    { id: 'overview', label: 'Dashboard', icon: FaHome, color: 'text-blue-600', bgColor: 'bg-blue-50', href: base },
    { id: 'practice', label: 'My Practice', icon: FaBriefcaseMedical, color: 'text-cyan-600', bgColor: 'bg-cyan-50', href: `${base}/practice` },
    { id: 'billing', label: 'Billing', icon: FaMoneyBillWave, color: 'text-green-600', bgColor: 'bg-green-50', href: `${base}/billing` },
    { id: 'services', label: 'My Services', icon: FaCogs, color: 'text-purple-600', bgColor: 'bg-purple-50', href: `${base}/services` },
    { id: 'inventory', label: 'My Inventory', icon: FaCubes, color: 'text-amber-600', bgColor: 'bg-amber-50', href: `${base}/inventory` },
    { id: 'workflows', label: 'Workflows', icon: FaProjectDiagram, color: 'text-indigo-600', bgColor: 'bg-indigo-50', href: `${base}/workflows` },
    { id: 'video', label: 'Video Call', icon: FaVideo, color: 'text-teal-600', bgColor: 'bg-teal-50', href: `${base}/video` },
    { id: 'audio', label: 'Audio Call', icon: FaPhone, color: 'text-cyan-600', bgColor: 'bg-cyan-50', href: `${base}/audio` },
    { id: 'messages', label: 'Messages', icon: FaComments, color: 'text-pink-600', bgColor: 'bg-pink-50', href: `${base}/messages` },
    { id: 'my-company', label: 'My Company', icon: FaBuilding, color: 'text-slate-600', bgColor: 'bg-slate-50', href: `${base}/my-company` },
    ...getPatientHealthItems(base),
  ]
}

/**
 * Guest layout: header with logo + sign-in/up, sidebar with search-only
 * items (no auth required). Used when user is not logged in on /search/* pages.
 */
function SearchGuestLayout({
  children,
  searchItems,
  pathname,
}: {
  children: React.ReactNode
  searchItems: SidebarItem[]
  pathname: string
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const searchSegment = pathname.replace(/^\/search\/?/, '').split('/')[0]
  const activeId = searchSegment ? `search-${searchSegment}` : 'overview'

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Guest header */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between z-40">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
            aria-label="Toggle sidebar"
          >
            <FaBars className="text-gray-600" />
          </button>
          <Link href="/" aria-label="MediWyz home" className="flex items-center rounded-lg hover:opacity-80 transition">
            <HealthwyzLogo height={36} />
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <FaHome className="text-xs" /> Home
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-[#0C6780] hover:bg-teal-50 rounded-lg transition"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm font-medium text-white bg-[#0C6780] hover:bg-[#0a5a70] rounded-lg transition"
          >
            Sign Up Free
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar
          items={searchItems}
          activeItemId={activeId}
          isOpen={sidebarOpen}
          isMobile={isMobile}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  )
}

export default function SearchDashboardWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading: userLoading, clearUser } = useUser()
  const pathname = usePathname()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [cookieVal, setCookieVal] = useState<string | null>(null)
  const [cookieToSlug, setCookieToSlug] = useState<Record<string, string>>(FALLBACK_SLUGS)

  // Static search items available to all (no auth required)
  const guestSearchItems = getSearchItems('')

  useEffect(() => {
    setMounted(true)
    const match = document.cookie.split(';').find(c => c.trim().startsWith('mediwyz_userType='))
    setCookieVal(match ? decodeURIComponent(match.split('=')[1]?.trim() || '') : null)
  }, [])

  useEffect(() => {
    fetch('/api/roles')
      .then(r => r.json())
      .then(json => {
        if (!json?.success || !Array.isArray(json.data)) return
        const map: Record<string, string> = { ...FALLBACK_SLUGS }
        for (const role of json.data) {
          if (role.cookieValue && role.slug) map[role.cookieValue] = role.slug
        }
        setCookieToSlug(map)
      })
      .catch(() => {})
  }, [])

  const providerSlug = cookieVal ? cookieToSlug[cookieVal] : null
  const basePath = providerSlug ? `/provider/${providerSlug}` : ''

  const dynamicSearch = useDynamicSearchItems(basePath)
  const featureConfig = useRoleFeatureConfig(user?.userType)

  // Before hydration, show the full-screen loading state
  if (!mounted || userLoading) {
    return <DashboardLoadingState />
  }

  // ── GUEST: no user ────────────────────────────────────────────────────────
  // Always show the layout with the search sidebar so visitors can browse
  // provider types without needing to log in.
  if (!user) {
    return (
      <SearchGuestLayout searchItems={guestSearchItems} pathname={pathname}>
        {children}
      </SearchGuestLayout>
    )
  }

  // ── AUTHENTICATED ─────────────────────────────────────────────────────────
  const registryConfig = getSidebarConfig(user.userType)

  let sidebarItems: SidebarItem[]
  let subtitle: string
  let profileHref: string
  let networkHref: string

  if (registryConfig) {
    sidebarItems = registryConfig.items
    subtitle = registryConfig.userSubtitle
    profileHref = registryConfig.profileHref
    networkHref = registryConfig.networkHref
  } else {
    const coreItems = getProviderSidebarItems(basePath)
    sidebarItems = dynamicSearch.length > 0
      ? [...coreItems.filter(i => !i.id.startsWith('search-') && i.id !== 'divider-search'), ...dynamicSearch]
      : coreItems
    sidebarItems = filterSidebarByFeatures(sidebarItems, featureConfig)
    subtitle = user.userType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    profileHref = `${basePath}/profile`
    networkHref = `${basePath}/network`
  }

  const displayName = `${user.firstName} ${user.lastName}`
  const searchSegment = pathname.replace(/^\/search\/?/, '').split('/')[0]
  const activeSectionId = searchSegment ? `search-${searchSegment}` : 'overview'

  const handleLogout = () => {
    clearUser()
    router.push('/login')
  }

  const isFullBleed = pathname === '/search/ai'

  return (
    <DashboardLayout
      userName={displayName}
      userSubtitle={subtitle}
      userImage={user.profileImage}
      sidebarItems={sidebarItems}
      activeSectionId={activeSectionId}
      notificationCount={0}
      profileHref={profileHref}
      networkHref={networkHref}
      onLogout={handleLogout}
      mainClassName={isFullBleed ? '!p-0 !overflow-hidden relative' : undefined}
    >
      {children}
    </DashboardLayout>
  )
}
