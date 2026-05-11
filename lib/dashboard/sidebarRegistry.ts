import type { SidebarItem } from '@/components/dashboard/DashboardSidebar'

// Non-provider roles keep their dedicated sidebar configs
// Patient now uses the unified provider/[slug] route (no longer dedicated)
import { INSURANCE_SIDEBAR_ITEMS, getActiveSectionFromPath as insuranceGetActive } from '@/app/insurance/(dashboard)/sidebar-config'
import { CORPORATE_SIDEBAR_ITEMS, getActiveSectionFromPath as corporateGetActive } from '@/app/corporate/(dashboard)/sidebar-config'
import { REFERRAL_SIDEBAR_ITEMS, getActiveSectionFromPath as referralGetActive } from '@/app/referral-partner/(dashboard)/sidebar-config'
import { REGIONAL_ADMIN_SIDEBAR_ITEMS, getActiveSectionFromPath as regionalGetActive } from '@/app/regional/(dashboard)/sidebar-config'

export interface SidebarConfig {
  items: SidebarItem[]
  getActiveSectionFromPath: (pathname: string) => string
  userSubtitle: string
  profileHref: string
  networkHref: string
  namePrefix?: string
}

// Only non-provider roles have dedicated sidebar configs
// All provider roles use the dynamic provider/[slug] layout
const registry: Record<string, SidebarConfig> = {
  INSURANCE_REP: {
    items: INSURANCE_SIDEBAR_ITEMS,
    getActiveSectionFromPath: insuranceGetActive,
    userSubtitle: 'Insurance',
    profileHref: '/insurance/profile',
    networkHref: '/insurance/network',
  },
  CORPORATE_ADMIN: {
    items: CORPORATE_SIDEBAR_ITEMS,
    getActiveSectionFromPath: corporateGetActive,
    userSubtitle: 'Corporate',
    profileHref: '/corporate/profile',
    networkHref: '/corporate/network',
  },
  REFERRAL_PARTNER: {
    items: REFERRAL_SIDEBAR_ITEMS,
    getActiveSectionFromPath: referralGetActive,
    userSubtitle: 'Referral Partner',
    profileHref: '/referral-partner/profile',
    networkHref: '/referral-partner/network',
  },
  REGIONAL_ADMIN: {
    items: REGIONAL_ADMIN_SIDEBAR_ITEMS,
    getActiveSectionFromPath: regionalGetActive,
    userSubtitle: 'Regional Admin',
    profileHref: '/regional/profile',
    networkHref: '/regional/network',
  },
}

export function getSidebarConfig(userType: string): SidebarConfig | null {
  return registry[userType] ?? null
}

export function getUserTypeSlug(userType: string): string | null {
  // Non-provider roles have dedicated routes
  const slugs: Record<string, string> = {
    INSURANCE_REP: 'insurance',
    CORPORATE_ADMIN: 'corporate',
    REFERRAL_PARTNER: 'referral-partner',
    REGIONAL_ADMIN: 'regional',
  }
  return slugs[userType] ?? null
}
