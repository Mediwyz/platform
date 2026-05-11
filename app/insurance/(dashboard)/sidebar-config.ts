import { FaHome, FaNewspaper, FaBriefcaseMedical, FaComments, FaVideo, FaPhone, FaMoneyBillWave, FaUsers, FaBell } from 'react-icons/fa'
import type { SidebarItem } from '@/components/dashboard/DashboardSidebar'
import { createGetActiveSectionFromPath } from '@/lib/dashboard/getActiveSectionFromPath'
import { getPatientHealthItems, getSearchItems, getInviteFriendsItem } from '@/lib/dashboard/patientHealthItems'

const base = '/insurance'

export const INSURANCE_SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'feed', label: 'Feed', labelKey: 'nav.feed', icon: FaNewspaper, color: 'text-orange-600', bgColor: 'bg-orange-50', href: `${base}/feed` },
  { id: 'overview', label: 'Dashboard', labelKey: 'nav.overview', icon: FaHome, color: 'text-blue-600', bgColor: 'bg-blue-50', href: base },
  // NOTE: "Analytics" + "Pre-auths" are owner-tier management screens and live
  // under /my-insurance-company/ (capability-gated, visible to ANY user with
  // insurance-capability — not tied to the legacy INSURANCE_REP userType).
  // `createDashboardLayout` injects a "My Insurance Company" entry here
  // automatically when the current user has the capability.
  { id: 'portfolio', label: 'My Portfolio', labelKey: 'nav.portfolio', icon: FaBriefcaseMedical, color: 'text-blue-600', bgColor: 'bg-blue-50', href: `${base}/portfolio` },
  { id: 'members', label: 'Members', labelKey: 'nav.members', icon: FaUsers, color: 'text-purple-600', bgColor: 'bg-purple-50', href: `${base}/members` },
  { id: 'billing', label: 'Billing', labelKey: 'nav.billing', icon: FaMoneyBillWave, color: 'text-emerald-600', bgColor: 'bg-emerald-50', href: `${base}/billing` },
  { id: 'video', label: 'Video Call', labelKey: 'nav.video', icon: FaVideo, color: 'text-green-600', bgColor: 'bg-green-50', href: `${base}/video` },
  { id: 'audio', label: 'Audio Call', icon: FaPhone, color: 'text-cyan-600', bgColor: 'bg-cyan-50', href: `${base}/audio` },
  { id: 'messages', label: 'Messages', labelKey: 'nav.messages', icon: FaComments, color: 'text-pink-600', bgColor: 'bg-pink-50', href: `${base}/messages` },
  { id: 'notifications', label: 'Notifications', labelKey: 'nav.notifications', icon: FaBell, color: 'text-amber-600', bgColor: 'bg-amber-50', href: `${base}/notifications` },
  ...getPatientHealthItems(base),
  getInviteFriendsItem(base),
  ...getSearchItems(base),
]

export const getActiveSectionFromPath = createGetActiveSectionFromPath(base, INSURANCE_SIDEBAR_ITEMS)
