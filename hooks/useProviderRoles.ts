'use client'

import { useState, useEffect } from 'react'

export interface ProviderRole {
  role: string       // code (DOCTOR, NURSE, etc.)
  code: string       // same as role (for new API compat)
  label: string
  singularLabel: string
  slug: string
  searchPath: string
  icon: string
  color: string
  providerCount: number
  bookingEnabled: boolean
  specialties: { name: string; description: string | null }[]
}

let cachedRoles: ProviderRole[] | null = null

/**
 * Hook to fetch provider roles from the database.
 * Only returns bookable provider roles (excludes Patient, Admin, etc.)
 * Cached - only fetches once per page load.
 */
export function useProviderRoles() {
  const [roles, setRoles] = useState<ProviderRole[]>(cachedRoles || [])
  const [loading, setLoading] = useState(!cachedRoles)

  useEffect(() => {
    if (cachedRoles) return
    fetch('/api/roles?isProvider=true&bookingEnabled=true')
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          // Normalize: map `code` to `role` for backward compat
          const normalized = json.data.map((r: Record<string, unknown>) => ({
            ...r,
            role: r.code || r.role,
          }))
          cachedRoles = normalized
          setRoles(normalized)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { roles, loading }
}
