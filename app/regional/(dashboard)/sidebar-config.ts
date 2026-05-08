import { FaHome, FaNewspaper, FaShieldAlt, FaComments, FaVideo, FaPhone, FaMoneyBillWave, FaSitemap, FaTag, FaUsersCog, FaBell, FaBook, FaInbox, FaUsers, FaClipboardCheck, FaFileAlt, FaToggleOn, FaClipboardList, FaCrown } from 'react-icons/fa'
import type { SidebarItem } from '@/components/dashboard/DashboardSidebar'
import { createGetActiveSectionFromPath } from '@/lib/dashboard/getActiveSectionFromPath'
import { getPatientHealthItems, getSearchItems, getInviteFriendsItem } from '@/lib/dashboard/patientHealthItems'

const base = '/regional'

export const REGIONAL_ADMIN_SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'feed', label: 'Feed', labelKey: 'nav.feed', icon: FaNewspaper, color: 'text-orange-600', bgColor: 'bg-orange-50', href: `${base}/feed` },
  { id: 'overview', label: 'Dashboard', labelKey: 'nav.overview', icon: FaHome, color: 'text-blue-600', bgColor: 'bg-blue-50', href: base },
  { id: 'users', label: 'Users', icon: FaUsers, color: 'text-purple-600', bgColor: 'bg-purple-50', href: `${base}/users` },
  { id: 'content', label: 'Content', icon: FaFileAlt, color: 'text-teal-600', bgColor: 'bg-teal-50', href: `${base}/content` },
  { id: 'security', label: 'Security', icon: FaShieldAlt, color: 'text-red-600', bgColor: 'bg-red-50', href: `${base}/security` },
  { id: 'role-config', label: 'Role Config', icon: FaToggleOn, color: 'text-violet-600', bgColor: 'bg-violet-50', href: `${base}/role-config` },
  { id: 'required-documents', label: 'Documents', icon: FaClipboardList, color: 'text-amber-600', bgColor: 'bg-amber-50', href: `${base}/required-documents` },
  { id: 'subscriptions', label: 'Plans', icon: FaCrown, color: 'text-yellow-600', bgColor: 'bg-yellow-50', href: `${base}/subscriptions` },
  { id: 'validation', label: 'Document Validation', icon: FaClipboardCheck, color: 'text-amber-600', bgColor: 'bg-amber-50', href: `${base}/validation` },
  { id: 'services', label: 'Services & Workflows', labelKey: 'nav.services', icon: FaTag, color: 'text-brand-navy', bgColor: 'bg-sky-50', href: `${base}/services` },
  { id: 'workflows', label: 'Workflow Templates', labelKey: 'nav.workflows', icon: FaSitemap, color: 'text-brand-teal', bgColor: 'bg-sky-50', href: `${base}/workflows` },
  { id: 'workflow-suggestions', label: 'Workflow Suggestions', icon: FaInbox, color: 'text-amber-600', bgColor: 'bg-amber-50', href: `${base}/workflows/suggestions` },
  { id: 'role-requests', label: 'Role Requests', labelKey: 'nav.roleRequests', icon: FaInbox, color: 'text-amber-600', bgColor: 'bg-amber-50', href: `${base}/role-requests` },
  { id: 'roles', label: 'Provider Roles', labelKey: 'nav.roles', icon: FaUsersCog, color: 'text-violet-600', bgColor: 'bg-violet-50', href: `${base}/roles` },
  { id: 'clinical-knowledge', label: 'AI Knowledge', labelKey: 'nav.clinicalKnowledge', icon: FaBook, color: 'text-indigo-600', bgColor: 'bg-indigo-50', href: `${base}/clinical-knowledge` },
  { id: 'billing', label: 'Billing', labelKey: 'nav.billing', icon: FaMoneyBillWave, color: 'text-emerald-600', bgColor: 'bg-emerald-50', href: `${base}/billing` },
  { id: 'video', label: 'Video Call', labelKey: 'nav.video', icon: FaVideo, color: 'text-green-600', bgColor: 'bg-green-50', href: `${base}/video` },
  { id: 'audio', label: 'Audio Call', icon: FaPhone, color: 'text-cyan-600', bgColor: 'bg-cyan-50', href: `${base}/audio` },
  { id: 'messages', label: 'Messages', labelKey: 'nav.messages', icon: FaComments, color: 'text-pink-600', bgColor: 'bg-pink-50', href: `${base}/messages` },
  { id: 'notifications', label: 'Notifications', labelKey: 'nav.notifications', icon: FaBell, color: 'text-amber-600', bgColor: 'bg-amber-50', href: `${base}/notifications` },
  ...getPatientHealthItems(base),
  getInviteFriendsItem(base),
  ...getSearchItems(base),
]

export const getActiveSectionFromPath = createGetActiveSectionFromPath(base, REGIONAL_ADMIN_SIDEBAR_ITEMS)
