import {
  FaHome, FaBriefcaseMedical, FaMoneyBillWave, FaCubes,
  FaCogs, FaProjectDiagram, FaVideo, FaPhone, FaComments,
  FaRss, FaRobot, FaHeart, FaInbox, FaCalendarCheck, FaStar, FaBell, FaGift, FaShieldAlt, FaPaperPlane,
  FaCalendarAlt,
} from 'react-icons/fa'
import type { IconType } from 'react-icons'

export interface SidebarItem {
  id: string
  label: string
  icon: IconType
  color: string
  bgColor: string
  href: string
}

export function getDynamicProviderSidebarItems(slug: string): SidebarItem[] {
  const base = `/provider/${slug}`
  return [
    { id: 'feed', label: 'Feed', icon: FaRss, color: 'text-orange-600', bgColor: 'bg-orange-50', href: `${base}/feed` },
    { id: 'overview', label: 'Dashboard', icon: FaHome, color: 'text-blue-600', bgColor: 'bg-blue-50', href: base },
    { id: 'practice', label: 'My Practice', icon: FaBriefcaseMedical, color: 'text-cyan-600', bgColor: 'bg-cyan-50', href: `${base}/practice` },
    { id: 'billing', label: 'Billing', icon: FaMoneyBillWave, color: 'text-green-600', bgColor: 'bg-green-50', href: `${base}/billing` },
    { id: 'pre-auth', label: 'Pre-authorizations', icon: FaShieldAlt, color: 'text-blue-600', bgColor: 'bg-blue-50', href: `${base}/pre-auth` },
    { id: 'services', label: 'My Services', icon: FaCogs, color: 'text-purple-600', bgColor: 'bg-purple-50', href: `${base}/services` },
    { id: 'inventory', label: 'Health Shop', icon: FaCubes, color: 'text-amber-600', bgColor: 'bg-amber-50', href: `${base}/inventory` },
    { id: 'workflows', label: 'Workflows', icon: FaProjectDiagram, color: 'text-indigo-600', bgColor: 'bg-indigo-50', href: `${base}/workflows` },
    { id: 'workflow-suggestions', label: 'My Suggestions', icon: FaPaperPlane, color: 'text-purple-600', bgColor: 'bg-purple-50', href: `${base}/workflows/my-suggestions` },
    { id: 'availability', label: 'My Availability', icon: FaCalendarAlt, color: 'text-teal-600', bgColor: 'bg-teal-50', href: `${base}/availability` },
    { id: 'booking-requests', label: 'Booking Requests', icon: FaInbox, color: 'text-deepOrange-600', bgColor: 'bg-orange-50', href: `${base}/booking-requests` },
    { id: 'bookings', label: 'Bookings', icon: FaCalendarCheck, color: 'text-purple-600', bgColor: 'bg-purple-50', href: `${base}/bookings` },
    { id: 'reviews', label: 'Reviews', icon: FaStar, color: 'text-yellow-600', bgColor: 'bg-yellow-50', href: `${base}/reviews` },
    { id: 'video', label: 'Video Call', icon: FaVideo, color: 'text-teal-600', bgColor: 'bg-teal-50', href: `${base}/video` },
    { id: 'audio', label: 'Audio Call', icon: FaPhone, color: 'text-cyan-600', bgColor: 'bg-cyan-50', href: `${base}/audio` },
    { id: 'messages', label: 'Messages', icon: FaComments, color: 'text-pink-600', bgColor: 'bg-pink-50', href: `${base}/messages` },
    { id: 'notifications', label: 'Notifications', icon: FaBell, color: 'text-blue-600', bgColor: 'bg-blue-50', href: `${base}/notifications` },
    { id: 'ai', label: 'AI Health Assistant', icon: FaRobot, color: 'text-violet-600', bgColor: 'bg-violet-50', href: `${base}/ai-assistant` },
    { id: 'health', label: 'My Health', icon: FaHeart, color: 'text-red-600', bgColor: 'bg-red-50', href: `${base}/my-health` },
    { id: 'invite', label: 'Invite friends', icon: FaGift, color: 'text-pink-600', bgColor: 'bg-pink-50', href: `/invite` },
  ]
}

export function getActiveSectionFromPath(pathname: string): string {
  if (pathname.includes('/feed')) return 'feed'
  if (pathname.includes('/practice')) return 'practice'
  if (pathname.includes('/billing')) return 'billing'
  if (pathname.includes('/pre-auth')) return 'pre-auth'
  if (pathname.includes('/services')) return 'services'
  if (pathname.includes('/inventory')) return 'inventory'
  if (pathname.includes('/workflows/my-suggestions')) return 'workflow-suggestions'
  if (pathname.includes('/workflows')) return 'workflows'
  if (pathname.includes('/availability')) return 'availability'
  if (pathname.includes('/booking-requests')) return 'booking-requests'
  if (pathname.includes('/bookings')) return 'bookings'
  if (pathname.includes('/reviews')) return 'reviews'
  if (pathname.includes('/audio')) return 'audio'
  if (pathname.includes('/video')) return 'video'
  if (pathname.includes('/messages')) return 'messages'
  if (pathname.includes('/notifications')) return 'notifications'
  if (pathname.includes('/ai-assistant')) return 'ai'
  if (pathname.includes('/my-health')) return 'health'
  return 'overview'
}
