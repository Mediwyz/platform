'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaBuilding, FaShieldAlt, FaUserCircle, FaGift, FaBell } from 'react-icons/fa'
import { useUser } from '@/hooks/useUser'
import { useCorporateCapability } from '@/hooks/useCorporateCapability'
import { useInsuranceCapability } from '@/hooks/useInsuranceCapability'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import DashboardLoadingState from '@/components/dashboard/DashboardLoadingState'
import type { SidebarItem } from '@/components/dashboard/DashboardSidebar'

// Static imports of every role's sidebar. Keeping them static so the
// bundler can tree-shake normally; we pick the right one at runtime.
import { PATIENT_SIDEBAR_ITEMS, getActiveSectionFromPath as patientActive } from '../../patient/(dashboard)/sidebar-config'
import { CORPORATE_SIDEBAR_ITEMS, getActiveSectionFromPath as corporateActive } from '../../corporate/(dashboard)/sidebar-config'
import { INSURANCE_SIDEBAR_ITEMS, getActiveSectionFromPath as insuranceActive } from '../../insurance/(dashboard)/sidebar-config'
import { REFERRAL_SIDEBAR_ITEMS, getActiveSectionFromPath as referralActive } from '../../referral-partner/(dashboard)/sidebar-config'
import { REGIONAL_ADMIN_SIDEBAR_ITEMS, getActiveSectionFromPath as regionalActive } from '../../regional/(dashboard)/sidebar-config'
import { ADMIN_SIDEBAR_ITEMS, getActiveSectionFromPath as adminActive } from '../../admin/(dashboard)/sidebar-config'
import { getDynamicProviderSidebarItems, getActiveSectionFromPath as providerActive } from '../../provider/[slug]/(dashboard)/sidebar-config'

/**
 * The unified `/profile/[id]` page is a top-level route - not inside any
 * role's `(dashboard)` group - so it would render bare without a sidebar.
 * This layout picks the matching sidebar config for the CURRENT user's
 * role and wraps the page in the standard dashboard shell. That way a
 * user clicking their avatar still sees the same nav they were using.
 *
 * Capability-based injections (My Profile, My Company, My Insurance
 * Company, Invite, Notifications) mirror what `createDashboardLayout`
 * does for the regular dashboard routes so the experience stays
 * consistent when bouncing between pages.
 */

const PROVIDER_SLUGS: Record<string, string> = {
  doctor: 'doctors', nurse: 'nurses', 'child-care-nurse': 'childcare',
  pharmacy: 'pharmacists', lab: 'lab-technicians', ambulance: 'emergency',
  caregiver: 'caregivers', physiotherapist: 'physiotherapists',
  dentist: 'dentists', optometrist: 'optometrists', nutritionist: 'nutritionists',
}

function sidebarForCookieUserType(cookieUserType: string | undefined): {
  items: SidebarItem[]; active: (path: string) => string
} {
  const providerSlug = cookieUserType ? (PROVIDER_SLUGS[cookieUserType] ?? cookieUserType) : 'patients'
  const map: Record<string, { items: SidebarItem[]; active: (path: string) => string }> = {
    'regional-admin': { items: REGIONAL_ADMIN_SIDEBAR_ITEMS, active: regionalActive },
    admin: { items: ADMIN_SIDEBAR_ITEMS, active: adminActive },
    corporate: { items: CORPORATE_SIDEBAR_ITEMS, active: corporateActive },
    insurance: { items: INSURANCE_SIDEBAR_ITEMS, active: insuranceActive },
    'referral-partner': { items: REFERRAL_SIDEBAR_ITEMS, active: referralActive },
    patient: { items: PATIENT_SIDEBAR_ITEMS, active: patientActive },
  }
  if (cookieUserType && map[cookieUserType]) return map[cookieUserType]
  // Every provider role (doctor, nurse, dentist, …) uses the shared dynamic
  // provider sidebar.
  return {
    items: getDynamicProviderSidebarItems(providerSlug),
    active: providerActive,
  }
}

function roleSubtitle(cookieUserType?: string): string {
  const map: Record<string, string> = {
    patient: 'Member',
    doctor: 'Doctor', nurse: 'Nurse', 'child-care-nurse': 'Nanny',
    pharmacy: 'Pharmacist', lab: 'Lab Technician', ambulance: 'Emergency Worker',
    admin: 'Admin', 'regional-admin': 'Regional Admin',
    corporate: 'Corporate', insurance: 'Insurance',
    'referral-partner': 'Referral Partner',
    caregiver: 'Caregiver', physiotherapist: 'Physiotherapist',
    dentist: 'Dentist', optometrist: 'Optometrist', nutritionist: 'Nutritionist',
  }
  return map[cookieUserType ?? ''] ?? 'MediWyz user'
}

export default function ProfilePageLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, clearUser } = useUser()
  const { has: hasCorporate } = useCorporateCapability()
  const { has: hasInsurance } = useInsuranceCapability()
  const router = useRouter()
  const [pathname, setPathname] = useState<string>('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    setPathname(typeof window !== 'undefined' ? window.location.pathname : '')
  }, [])

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [loading, user, router])

  const base = useMemo(() => sidebarForCookieUserType(user?.userType), [user?.userType])

  const sidebarItems = useMemo(() => {
    let list: SidebarItem[] = [...base.items]
    if (user?.id && !list.some((i) => i.id === 'my-profile')) {
      const overviewIdx = list.findIndex((i) => i.id === 'overview')
      const insertAt = overviewIdx >= 0 ? overviewIdx + 1 : Math.min(1, list.length)
      list = [
        ...list.slice(0, insertAt),
        { id: 'my-profile', label: 'My Profile', icon: FaUserCircle, color: 'text-[#0C6780]', bgColor: 'bg-sky-50', href: `/profile/${user.id}` },
        ...list.slice(insertAt),
      ]
    }
    if (hasCorporate && !list.some((i) => i.id === 'my-company')) {
      list.push({ id: 'my-company', label: 'My Company', icon: FaBuilding, color: 'text-slate-600', bgColor: 'bg-slate-50', href: '/corporate' })
    }
    if (hasInsurance && !list.some((i) => i.id === 'my-insurance-company')) {
      list.push({ id: 'my-insurance-company', label: 'My Insurance Company', icon: FaShieldAlt, color: 'text-blue-600', bgColor: 'bg-blue-50', href: '/my-insurance-company' })
    }
    if (user?.id && !list.some((i) => i.id === 'notifications')) {
      list.push({ id: 'notifications', label: 'Notifications', icon: FaBell, color: 'text-amber-600', bgColor: 'bg-amber-50', href: '/notifications' })
    }
    if (user?.id && !list.some((i) => i.id === 'invite')) {
      list.push({ id: 'invite', label: 'Invite friends', icon: FaGift, color: 'text-pink-600', bgColor: 'bg-pink-50', href: '/invite' })
    }
    const seen = new Set<string>()
    return list.filter((it) => { if (seen.has(it.id)) return false; seen.add(it.id); return true })
  }, [base.items, user?.id, hasCorporate, hasInsurance])

  if (!mounted || loading || !user) return <DashboardLoadingState />

  const displayName = `${user.firstName} ${user.lastName}`
  const subtitle = roleSubtitle(user.userType)
  // `my-profile` is always active when we're on this layout.
  const activeSectionId = pathname.startsWith('/profile/') ? 'my-profile' : base.active(pathname)

  return (
    <DashboardLayout
      userName={displayName}
      userSubtitle={subtitle}
      userImage={user.profileImage ?? undefined}
      sidebarItems={sidebarItems}
      activeSectionId={activeSectionId}
      profileHref={`/profile/${user.id}`}
      onLogout={() => { clearUser(); router.push('/login') }}
    >
      {children}
    </DashboardLayout>
  )
}
