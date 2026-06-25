'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { DashboardLayout, DashboardLoadingState, DashboardErrorState } from '@/components/dashboard'
import type { SidebarItem } from '@/components/dashboard/DashboardSidebar'
import { useUser } from '@/hooks/useUser'
import { useDynamicSearchItems } from '@/hooks/useDynamicSearchItems'
import { useRoleFeatureConfig, filterSidebarByFeatures } from '@/hooks/useRoleFeatureConfig'
import { useCorporateCapability } from '@/hooks/useCorporateCapability'
import { useInsuranceCapability } from '@/hooks/useInsuranceCapability'
import { useHasPharmacy } from '@/hooks/useHasPharmacy'
import { FaBuilding, FaShieldAlt, FaGift, FaBell } from 'react-icons/fa'

interface UserData {
  id: string
  firstName: string
  lastName: string
  email: string
  profileImage?: string | null
  userType: string
}

interface DashboardLayoutConfig {
  /** Display label for the user type (e.g. 'Patient', 'Doctor', 'Nurse') */
  userSubtitle: string
  /** Sidebar navigation items for this role */
  sidebarItems: SidebarItem[]
  /** Function to resolve active sidebar section from pathname */
  getActiveSectionFromPath: (pathname: string) => string
  /** Link to profile page (e.g. '/patient/profile') */
  profileHref?: string
  /** Link to network/connections page (e.g. '/patient/network') */
  networkHref?: string
  /** @deprecated Use profileHref instead */
  settingsHref?: string
  /** Optional name prefix (e.g. 'Dr.' for doctors) */
  namePrefix?: string
  /** Optional context provider wrapping children (e.g. PatientDashboardProvider) */
  ContextProvider?: React.ComponentType<{ userData: any; children: React.ReactNode }>
  /** Optional callback to fetch additional data after auth (e.g. patient appointments) */
  fetchDashboardData?: (baseData: UserData) => Promise<any>
  /** Base path for dynamic search links (e.g. '/patient'). When set, replaces static search items with DB-driven roles. */
  dynamicSearchBasePath?: string
}

/**
 * Factory function that creates a dashboard layout component for any user type.
 * Eliminates the ~40 lines of boilerplate duplicated across all 12 layout files.
 *
 * @example
 * // app/nurse/(dashboard)/layout.tsx
 * export default createDashboardLayout({
 *   userSubtitle: 'Nurse',
 *   sidebarItems: NURSE_SIDEBAR_ITEMS,
 *   getActiveSectionFromPath,
 *   settingsHref: '/nurse/settings',
 * })
 */
export function createDashboardLayout(config: DashboardLayoutConfig) {
  const {
    userSubtitle,
    sidebarItems,
    getActiveSectionFromPath,
    profileHref,
    networkHref,
    settingsHref,
    namePrefix,
    ContextProvider,
    fetchDashboardData,
    dynamicSearchBasePath,
  } = config

  return function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
    const { user: hookUser, loading: userLoading, clearUser } = useUser()
    const [userData, setUserData] = useState<UserData | null>(null)
    const [contextData, setContextData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error] = useState<string | null>(null)
    const router = useRouter()
    const pathname = usePathname()

    const loadExtraData = useCallback(async (baseData: UserData) => {
      if (!fetchDashboardData) return
      try {
        const extra = await fetchDashboardData(baseData)
        if (extra) setContextData(extra)
      } catch {
        // Silently fall back to base data
      }
    }, [])

    useEffect(() => {
      if (userLoading) return
      if (hookUser) {
        const parsed = hookUser as UserData
        setUserData(parsed)
        setContextData(parsed)
        setLoading(false)
        loadExtraData(parsed)
      } else {
        // Redirect silently - don't show error state during logout
        router.push('/login')
      }
    }, [hookUser, userLoading, router, loadExtraData])

    const handleLogout = () => {
      clearUser()
      router.push('/login')
    }

    // Must call hooks before any early returns (React rules of hooks)
    const dynamicSearch = useDynamicSearchItems(dynamicSearchBasePath || '')
    const featureConfig = useRoleFeatureConfig(hookUser?.userType)
    const { has: hasCorporateCapability } = useCorporateCapability()
    const { has: hasInsuranceCapability } = useInsuranceCapability()
    const { has: hasPharmacy, loading: pharmacyLoading } = useHasPharmacy()

    if (loading) return <DashboardLoadingState />
    if (error || !userData) return <DashboardErrorState message={error} />

    const displayName = namePrefix
      ? `${namePrefix} ${userData.firstName} ${userData.lastName}`
      : `${userData.firstName} ${userData.lastName}`

    // Replace static search items with dynamic DB-driven ones only when
    // the roles API returned actual role entries. If DB is empty / the
    // hook hasn't loaded yet, keep the static hardcoded items so the
    // sidebar isn't reduced to just a "Health Shop" link.
    let finalSidebarItems = sidebarItems
    const dynamicHasRoles = dynamicSearch.some(
      item => !item.divider && item.id !== 'divider-search' && item.id !== 'search-health-shop' && item.id !== 'search-insurance'
    )
    if (dynamicSearchBasePath && dynamicHasRoles) {
      // Remove static search items (ids starting with 'search-' or divider-search)
      const coreItems = sidebarItems.filter(
        item => !item.id.startsWith('search-') && item.id !== 'divider-search'
      )
      finalSidebarItems = [...coreItems, ...dynamicSearch]
    }

    // Filter sidebar items based on role feature config (admin-configurable)
    finalSidebarItems = filterSidebarByFeatures(finalSidebarItems, featureConfig)

    // My Profile is NOT a sidebar item — it lives in the header (avatar +
    // name link to the profile). Remove it if any sidebar config still emits it.
    finalSidebarItems = finalSidebarItems.filter((i) => i.id !== 'my-profile')

    // Promote "My Health" to the top — it's a primary member surface, so it
    // belongs in the first few items (right after Dashboard), not buried mid-list.
    {
      const mhIdx = finalSidebarItems.findIndex((i) => i.id === 'my-health')
      if (mhIdx > -1) {
        const [mh] = finalSidebarItems.splice(mhIdx, 1)
        const overviewIdx = finalSidebarItems.findIndex((i) => i.id === 'overview')
        finalSidebarItems.splice(overviewIdx >= 0 ? overviewIdx + 1 : 0, 0, mh)
      }
    }

    // Inject "My Company" entry for any user with corporate-admin capability - 
    // capability, not role: granted by buying a corporate/enterprise plan or owning a company.
    if (hasCorporateCapability && !finalSidebarItems.some(i => i.id === 'my-company')) {
      finalSidebarItems = [
        ...finalSidebarItems,
        { id: 'my-company', label: 'My Organizations', icon: FaBuilding, color: 'text-slate-600', bgColor: 'bg-slate-50', href: '/corporate' },
      ]
    }
    // Same pattern for insurance-company owners. A MEMBER, DOCTOR, or any
    // role who owns a `CorporateAdminProfile` with `isInsuranceCompany: true`
    // gets a "My Insurance Company" shortcut in their sidebar regardless of
    // their userType. NOT tied to the legacy INSURANCE_REP role.
    if (hasInsuranceCapability && !finalSidebarItems.some(i => i.id === 'my-insurance-company')) {
      finalSidebarItems = [
        ...finalSidebarItems,
        { id: 'my-insurance-company', label: 'My Insurance Company', icon: FaShieldAlt, color: 'text-blue-600', bgColor: 'bg-blue-50', href: '/my-insurance-company' },
      ]
    }

    // Inventory / Health-Shop management is only for pharmacy / health-shop
    // owners. Once the capability check resolves with "no pharmacy", drop the
    // provider "My Inventory" entry. (Only the provider sidebar emits it.)
    if (!pharmacyLoading && !hasPharmacy) {
      finalSidebarItems = finalSidebarItems.filter(i => i.id !== 'inventory')
    }

    // Notifications - every user should have this. Fallback inject if the
    // sidebar config missed it or the feature-config filter stripped it.
    if (hookUser?.id && !finalSidebarItems.some(i => i.id === 'notifications')) {
      finalSidebarItems = [
        ...finalSidebarItems,
        { id: 'notifications', label: 'Notifications', icon: FaBell, color: 'text-amber-600', bgColor: 'bg-amber-50', href: '/notifications' },
      ]
    }

    // "Invite friends" - every authenticated user has a referral code and
    // earns wallet credit per successful signup. Injected here so sidebar
    // configs don't need to remember to add it (regional / admin were
    // missing it; user flagged it).
    if (hookUser?.id && !finalSidebarItems.some(i => i.id === 'invite')) {
      finalSidebarItems = [
        ...finalSidebarItems,
        { id: 'invite', label: 'Invite friends', icon: FaGift, color: 'text-pink-600', bgColor: 'bg-pink-50', href: '/invite' },
      ]
    }

    // Dedupe by id - a couple of sidebar helpers (`getSearchItems` +
    // `getSearchItemsFromRoles`) can both emit a 'search-insurance' entry
    // when combined, which triggered React's "unique key" warning on login.
    // Keep the first occurrence, drop any subsequent collisions.
    {
      const seen = new Set<string>()
      finalSidebarItems = finalSidebarItems.filter((item) => {
        if (seen.has(item.id)) return false
        seen.add(item.id)
        return true
      })
    }

    // Billing link for the header wallet pill — derived from the sidebar's
    // billing item so it works for any role's base path.
    const billingHref = finalSidebarItems.find((i) => i.id === 'billing')?.href

    const content = (
      <DashboardLayout
        userName={displayName}
        userSubtitle={userSubtitle}
        userImage={userData.profileImage}
        sidebarItems={finalSidebarItems}
        activeSectionId={getActiveSectionFromPath(pathname)}
        notificationCount={0}
        profileHref={profileHref || settingsHref}
        networkHref={networkHref}
        billingHref={billingHref}
        onLogout={handleLogout}
      >
        {children}
      </DashboardLayout>
    )

    if (ContextProvider) {
      return (
        <ContextProvider userData={contextData || userData}>
          {content}
        </ContextProvider>
      )
    }

    return content
  }
}
