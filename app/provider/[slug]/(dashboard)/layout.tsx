'use client'

import { useParams } from 'next/navigation'
import { createDashboardLayout } from '@/lib/dashboard/createDashboardLayout'
import type { SidebarItem } from '@/components/dashboard/DashboardSidebar'
import {
  FaHome, FaRss, FaBriefcaseMedical, FaMoneyBillWave, FaCubes,
  FaCogs, FaProjectDiagram, FaVideo, FaPhone, FaComments,
  FaBuilding, FaCalendarAlt,
} from 'react-icons/fa'
import { getPatientHealthItems, getSearchItems } from '@/lib/dashboard/patientHealthItems'

// Static sidebar items — ALL possible items for any role
// The createDashboardLayout adds dynamic search items via dynamicSearchBasePath
function getAllSidebarItems(base: string): SidebarItem[] {
  return [
    { id: 'feed', label: 'Feed', labelKey: 'nav.feed', icon: FaRss, color: 'text-orange-600', bgColor: 'bg-orange-50', href: `${base}/feed` },
    { id: 'overview', label: 'Dashboard', labelKey: 'nav.overview', icon: FaHome, color: 'text-blue-600', bgColor: 'bg-blue-50', href: base },
    { id: 'practice', label: 'My Practice', labelKey: 'nav.practice', icon: FaBriefcaseMedical, color: 'text-cyan-600', bgColor: 'bg-cyan-50', href: `${base}/practice` },
    { id: 'billing', label: 'Billing', labelKey: 'nav.billing', icon: FaMoneyBillWave, color: 'text-green-600', bgColor: 'bg-green-50', href: `${base}/billing` },
    { id: 'services', label: 'My Services', labelKey: 'nav.services', icon: FaCogs, color: 'text-purple-600', bgColor: 'bg-purple-50', href: `${base}/services` },
    { id: 'inventory', label: 'My Inventory', labelKey: 'nav.inventory', icon: FaCubes, color: 'text-amber-600', bgColor: 'bg-amber-50', href: `${base}/inventory` },
    { id: 'availability', label: 'My Availability', labelKey: 'nav.availability', icon: FaCalendarAlt, color: 'text-teal-600', bgColor: 'bg-teal-50', href: `${base}/availability` },
    { id: 'workflows', label: 'Workflows', labelKey: 'nav.workflows', icon: FaProjectDiagram, color: 'text-indigo-600', bgColor: 'bg-indigo-50', href: `${base}/workflows` },
    { id: 'video', label: 'Video Call', labelKey: 'nav.video', icon: FaVideo, color: 'text-teal-600', bgColor: 'bg-teal-50', href: `${base}/video` },
    { id: 'audio', label: 'Audio Call', labelKey: 'nav.audio', icon: FaPhone, color: 'text-cyan-600', bgColor: 'bg-cyan-50', href: `${base}/audio` },
    { id: 'messages', label: 'Messages', labelKey: 'nav.messages', icon: FaComments, color: 'text-pink-600', bgColor: 'bg-pink-50', href: `${base}/messages` },
    { id: 'my-company', label: 'My Company', labelKey: 'nav.myCompany', icon: FaBuilding, color: 'text-slate-600', bgColor: 'bg-slate-50', href: `${base}/my-company` },
    ...getPatientHealthItems(base),
    ...getSearchItems(base),
  ]
}

function getActiveSectionFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  const page = segments.length > 2 ? segments[2] : ''
  const map: Record<string, string> = {
    feed: 'feed', practice: 'practice', billing: 'billing',
    services: 'services', inventory: 'inventory', workflows: 'workflows',
    availability: 'availability',
    video: 'video', audio: 'audio', messages: 'messages', 'ai-assistant': 'ai-assistant',
    'my-health': 'my-health', 'my-company': 'my-company', administration: 'administration',
    roles: 'roles', network: 'network', profile: 'profile',
  }
  return map[page] || 'overview'
}

// Wrapper that reads the slug from params and creates the layout
export default function DynamicProviderLayoutWrapper({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const slug = params.slug as string
  const base = `/provider/${slug}`

  const Layout = createDashboardLayout({
    userSubtitle: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    sidebarItems: getAllSidebarItems(base),
    getActiveSectionFromPath,
    profileHref: `${base}/profile`,
    networkHref: `${base}/network`,
    dynamicSearchBasePath: base,
  })

  return <Layout>{children}</Layout>
}
