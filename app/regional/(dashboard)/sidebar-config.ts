import { FaHome, FaNewspaper, FaShieldAlt, FaComments, FaVideo, FaPhone, FaMoneyBillWave, FaSitemap, FaTag, FaUsersCog, FaBell, FaBook, FaInbox, FaUsers, FaClipboardCheck, FaFileAlt, FaToggleOn, FaClipboardList, FaCrown, FaCog, FaBuilding } from 'react-icons/fa'
import type { SidebarItem } from '@/components/dashboard/DashboardSidebar'
import { createGetActiveSectionFromPath } from '@/lib/dashboard/getActiveSectionFromPath'
import { getPatientHealthItems, getSearchItems, getInviteFriendsItem } from '@/lib/dashboard/patientHealthItems'

const base = '/regional'

export const REGIONAL_ADMIN_SIDEBAR_ITEMS: SidebarItem[] = [
  // ── Main ─────────────────────────────────────────────────────────────────
  { id: 'feed', label: 'Feed', labelKey: 'nav.feed', icon: FaNewspaper, color: 'text-orange-600', bgColor: 'bg-orange-50', href: `${base}/feed` },
  { id: 'overview', label: 'Dashboard', labelKey: 'nav.overview', icon: FaHome, color: 'text-blue-600', bgColor: 'bg-blue-50', href: base },

  // ── Administration ───────────────────────────────────────────────────────
  { id: 'admin-header', label: 'Administration', icon: FaCog, color: 'text-gray-400', bgColor: 'bg-gray-50', href: '#', divider: true },
  { id: 'users', label: 'Users', icon: FaUsers, color: 'text-purple-600', bgColor: 'bg-purple-50', href: `${base}/users` },
  { id: 'content', label: 'Content', icon: FaFileAlt, color: 'text-teal-600', bgColor: 'bg-teal-50', href: `${base}/content` },
  { id: 'security', label: 'Security', icon: FaShieldAlt, color: 'text-red-600', bgColor: 'bg-red-50', href: `${base}/security` },
  { id: 'role-config', label: 'Role Config', icon: FaToggleOn, color: 'text-violet-600', bgColor: 'bg-violet-50', href: `${base}/role-config` },
  { id: 'required-documents', label: 'Documents', icon: FaClipboardList, color: 'text-amber-600', bgColor: 'bg-amber-50', href: `${base}/required-documents` },
  { id: 'subscriptions', label: 'Plans', icon: FaCrown, color: 'text-yellow-600', bgColor: 'bg-yellow-50', href: `${base}/subscriptions` },

  // ── Providers ────────────────────────────────────────────────────────────
  { id: 'providers-header', label: 'Providers', icon: FaUsersCog, color: 'text-gray-400', bgColor: 'bg-gray-50', href: '#', divider: true },
  { id: 'validation', label: 'Validation', icon: FaClipboardCheck, color: 'text-amber-600', bgColor: 'bg-amber-50', href: `${base}/validation` },
  { id: 'roles', label: 'Provider Roles', labelKey: 'nav.roles', icon: FaUsersCog, color: 'text-violet-600', bgColor: 'bg-violet-50', href: `${base}/roles` },
  { id: 'org-categories', label: 'Organisation Categories', icon: FaBuilding, color: 'text-cyan-600', bgColor: 'bg-cyan-50', href: `${base}/org-categories` },
  { id: 'role-requests', label: 'Role Requests', labelKey: 'nav.roleRequests', icon: FaInbox, color: 'text-amber-600', bgColor: 'bg-amber-50', href: `${base}/role-requests` },

  // ── Service Flows (services + what happens after a booking) ───────────────
  { id: 'service-flows-header', label: 'Service Flows', icon: FaSitemap, color: 'text-gray-400', bgColor: 'bg-gray-50', href: '#', divider: true },
  { id: 'services', label: 'Services', labelKey: 'nav.services', icon: FaTag, color: 'text-brand-navy', bgColor: 'bg-sky-50', href: `${base}/services` },
  { id: 'workflows', label: 'After Booking', labelKey: 'nav.workflows', icon: FaSitemap, color: 'text-brand-teal', bgColor: 'bg-sky-50', href: `${base}/workflows` },
  { id: 'workflow-suggestions', label: 'Provider Requests', icon: FaInbox, color: 'text-amber-600', bgColor: 'bg-amber-50', href: `${base}/workflows/suggestions` },

  // ── Platform ─────────────────────────────────────────────────────────────
  { id: 'platform-header', label: 'Platform', icon: FaTag, color: 'text-gray-400', bgColor: 'bg-gray-50', href: '#', divider: true },
  { id: 'clinical-knowledge', label: 'AI Knowledge', labelKey: 'nav.clinicalKnowledge', icon: FaBook, color: 'text-indigo-600', bgColor: 'bg-indigo-50', href: `${base}/clinical-knowledge` },
  { id: 'billing', label: 'Billing', labelKey: 'nav.billing', icon: FaMoneyBillWave, color: 'text-emerald-600', bgColor: 'bg-emerald-50', href: `${base}/billing` },

  // ── Communication ────────────────────────────────────────────────────────
  { id: 'comms-header', label: 'Communication', icon: FaComments, color: 'text-gray-400', bgColor: 'bg-gray-50', href: '#', divider: true },
  { id: 'video', label: 'Video Call', labelKey: 'nav.video', icon: FaVideo, color: 'text-green-600', bgColor: 'bg-green-50', href: `${base}/video` },
  { id: 'audio', label: 'Audio Call', icon: FaPhone, color: 'text-cyan-600', bgColor: 'bg-cyan-50', href: `${base}/audio` },
  { id: 'messages', label: 'Messages', labelKey: 'nav.messages', icon: FaComments, color: 'text-pink-600', bgColor: 'bg-pink-50', href: `${base}/messages` },
  { id: 'notifications', label: 'Notifications', labelKey: 'nav.notifications', icon: FaBell, color: 'text-amber-600', bgColor: 'bg-amber-50', href: `${base}/notifications` },

  ...getPatientHealthItems(base),
  getInviteFriendsItem(base),
  ...getSearchItems(base),
]

export const getActiveSectionFromPath = createGetActiveSectionFromPath(base, REGIONAL_ADMIN_SIDEBAR_ITEMS)
