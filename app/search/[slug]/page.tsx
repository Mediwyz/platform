'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import ProviderSearchPage from '@/components/search/ProviderSearchPage'

interface RoleData {
  code: string
  label: string
  singularLabel: string
  slug: string
  color: string
}

/**
 * Dynamic search page: /search/[slug]
 * Works for any provider role (existing or newly created by regional admin).
 * Fetches role metadata from /api/roles then renders the generic ProviderSearchPage.
 */
export default function DynamicSearchPage() {
  const params = useParams()
  const slug = params.slug as string
  const [role, setRole] = useState<RoleData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/roles?searchEnabled=true')
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          const found = json.data.find((r: RoleData) => r.slug === slug)
          setRole(found || null)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0C6780]" />
      </div>
    )
  }

  if (!role) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-soft">
        <p>Provider type not found</p>
      </div>
    )
  }

  return (
    <ProviderSearchPage
      config={{
        providerType: role.code,
        title: `Find ${role.label}`,
        singularLabel: role.singularLabel,
        slug: role.slug,
      }}
    />
  )
}
