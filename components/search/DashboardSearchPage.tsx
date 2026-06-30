'use client'

import dynamic from 'next/dynamic'
import { use, useState, useEffect } from 'react'
import ProviderSearchPage from '@/components/search/ProviderSearchPage'
import { CUSTOM_SEARCH_SLUGS } from '@/components/search/search-registry'

export { CUSTOM_SEARCH_SLUGS }

// Static pages ONLY for the custom-UI categories (see search-registry).
const searchPages: Record<string, React.ComponentType> = {
  childcare: dynamic(() => import('@/app/search/childcare/page'), { ssr: false }),
  lab: dynamic(() => import('@/app/search/lab/page'), { ssr: false }),
  emergency: dynamic(() => import('@/app/search/emergency/page'), { ssr: false }),
  medicines: dynamic(() => import('@/app/search/medicines/page'), { ssr: false }),
  insurance: dynamic(() => import('@/app/search/insurance/page'), { ssr: false }),
  'health-shop': dynamic(() => import('@/app/search/health-shop/page'), { ssr: false }),
}

// Slug-to-providerType mapping for known types
const SLUG_TO_TYPE: Record<string, string> = {
  'lab-technicians': 'LAB_TECHNICIAN',
  'emergency': 'EMERGENCY_WORKER',
  'insurance-reps': 'INSURANCE_REP',
  'pharmacists': 'PHARMACIST',
}

/**
 * Dynamic fallback: fetches role from /api/roles and renders ProviderSearchPage.
 * Used when the slug doesn't match a hardcoded search page.
 */
function DynamicProviderSearch({ slug }: { slug: string }) {
  const [role, setRole] = useState<{ code: string; label: string; singularLabel: string; slug: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/roles?searchEnabled=true')
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          const found = json.data.find((r: { slug: string }) => r.slug === slug)
          setRole(found || null)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0C6780]" /></div>

  if (!role) {
    // Try slug-to-type mapping
    const code = SLUG_TO_TYPE[slug] || slug.toUpperCase().replace(/-/g, '_')
    return (
      <ProviderSearchPage config={{
        providerType: code,
        title: `Find ${slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')}`,
        singularLabel: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ').replace(/s$/, ''),
        slug,
      }} />
    )
  }

  return (
    <ProviderSearchPage config={{
      providerType: role.code,
      title: `Find ${role.label}`,
      singularLabel: role.singularLabel,
      slug: role.slug,
    }} />
  )
}

export default function DashboardSearchPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = use(params)

  // Check static pages first
  const SearchComponent = searchPages[type]
  if (SearchComponent) return <SearchComponent />

  // Fallback: dynamic provider search from DB
  return <DynamicProviderSearch slug={type} />
}
