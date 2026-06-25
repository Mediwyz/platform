import {
  FaHeartbeat, FaRobot, FaSearch, FaUserMd, FaUserNurse, FaBaby,
  FaFlask, FaAmbulance, FaCapsules, FaHandHoldingHeart, FaWalking,
  FaTooth, FaEye, FaAppleAlt, FaBuilding, FaShieldAlt, FaGift,
} from 'react-icons/fa'
import type { SidebarItem } from '@/components/dashboard/DashboardSidebar'

/**
 * Returns AI Health Assistant + My Health sidebar items for any role.
 */
export function getPatientHealthItems(base: string): SidebarItem[] {
  return [
    { id: 'my-health', label: 'My Health', labelKey: 'nav.health', icon: FaHeartbeat, color: 'text-red-600', bgColor: 'bg-red-50', href: `${base}/my-health` },
    { id: 'ai-assistant', label: 'AI Health Assistant', labelKey: 'nav.aiAssistant', icon: FaRobot, color: 'text-indigo-600', bgColor: 'bg-indigo-50', href: `${base}/ai-assistant` },
  ]
}

/**
 * Icon map for dynamic roles - maps icon name strings to React icon components.
 */
const ICON_MAP: Record<string, typeof FaSearch> = {
  FaUserMd, FaUserNurse, FaBaby, FaFlask, FaAmbulance, FaCapsules,
  FaHandHoldingHeart, FaWalking, FaTooth, FaEye, FaAppleAlt,
  FaSearch, FaHeartbeat, FaRobot,
}

/**
 * Returns search/browse sidebar items for ALL provider types.
 * Reusable across all role sidebar configs.
 * NOTE: This is the static fallback. For dynamic roles, use getSearchItemsFromRoles().
 */
export function getSearchItems(_base?: string): SidebarItem[] {
  return [
    { id: 'divider-search', label: 'Search & Browse', icon: FaSearch, color: 'text-gray-400', bgColor: 'bg-gray-50', href: '', divider: true },
    { id: 'search-doctors', label: 'Find Doctors', icon: FaUserMd, color: 'text-blue-600', bgColor: 'bg-blue-50', href: `/search/doctors` },
    { id: 'search-nurses', label: 'Find Nurses', icon: FaUserNurse, color: 'text-purple-600', bgColor: 'bg-purple-50', href: `/search/nurses` },
    { id: 'search-childcare', label: 'Find Childcare', icon: FaBaby, color: 'text-pink-600', bgColor: 'bg-pink-50', href: `/search/childcare` },
    { id: 'search-caregivers', label: 'Find Caregivers', icon: FaHandHoldingHeart, color: 'text-teal-600', bgColor: 'bg-teal-50', href: `/search/caregivers` },
    { id: 'search-physio', label: 'Find Physio', icon: FaWalking, color: 'text-lime-600', bgColor: 'bg-lime-50', href: `/search/physiotherapists` },
    { id: 'search-dentists', label: 'Find Dentists', icon: FaTooth, color: 'text-sky-600', bgColor: 'bg-sky-50', href: `/search/dentists` },
    { id: 'search-eye', label: 'Find Eye Care', icon: FaEye, color: 'text-violet-600', bgColor: 'bg-violet-50', href: `/search/optometrists` },
    { id: 'search-nutrition', label: 'Find Nutrition', icon: FaAppleAlt, color: 'text-yellow-600', bgColor: 'bg-yellow-50', href: `/search/nutritionists` },
    { id: 'search-lab', label: 'Find Lab Tests', icon: FaFlask, color: 'text-cyan-600', bgColor: 'bg-cyan-50', href: `/search/lab` },
    { id: 'search-emergency', label: 'Emergency Services', icon: FaAmbulance, color: 'text-red-600', bgColor: 'bg-red-50', href: `/search/emergency` },
    { id: 'search-medicines', label: 'Buy Medicines', icon: FaCapsules, color: 'text-green-600', bgColor: 'bg-green-50', href: `/search/medicines` },
    { id: 'search-insurance', label: 'Find Insurance', icon: FaShieldAlt, color: 'text-indigo-600', bgColor: 'bg-indigo-50', href: `/search/insurance` },
  ]
}

/**
 * Build search sidebar items dynamically from ProviderRole data.
 * Call this with data from GET /api/roles?searchEnabled=true
 */
export function getSearchItemsFromRoles(
  base: string,
  roles: { slug: string; label: string; icon: string; color: string }[]
): SidebarItem[] {
  const items: SidebarItem[] = [
    { id: 'divider-search', label: 'Search & Browse', icon: FaSearch, color: 'text-gray-400', bgColor: 'bg-gray-50', href: '', divider: true },
  ]

  for (const role of roles) {
    const IconComponent = ICON_MAP[role.icon] || FaSearch
    items.push({
      id: `search-${role.slug}`,
      label: `Find ${role.label}`,
      icon: IconComponent,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      href: `/search/${role.slug}`,
    })
  }

  // Always add Health Shop + Find Insurance at the end
  items.push({
    id: 'search-health-shop',
    label: 'Health Shop',
    icon: FaCapsules,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    href: `/search/health-shop`,
  })
  items.push({
    id: 'search-insurance',
    label: 'Find Insurance',
    icon: FaShieldAlt,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    href: `/search/insurance-companies`,
  })

  return items
}

/**
 * "My Company" sidebar entry - any user may own/belong to one or more
 * companies now that CORPORATE_ADMIN is a capability, not a role.
 */
export function getMyCompanyItem(base: string): SidebarItem {
  return {
    id: 'my-company',
    label: 'My Organizations',
    labelKey: 'nav.myCompany',
    icon: FaBuilding,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    href: `${base}/my-company`,
  }
}

/**
 * "Invite friends" entry - every user has a referral code and earns
 * wallet credit for every signup via their link. Capability, not role.
 */
export function getInviteFriendsItem(_base?: string): SidebarItem {
  // Top-level /invite page - shared across every dashboard. Backend
  // auto-provisions a referral code on first visit, so the page works
  // for any authenticated user regardless of role.
  return {
    id: 'invite',
    label: 'Invite friends',
    labelKey: 'nav.invite',
    icon: FaGift,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    href: `/invite`,
  }
}
