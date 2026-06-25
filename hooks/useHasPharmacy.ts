'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'

/**
 * Returns whether the current user owns a pharmacy / health-shop organisation.
 * Gates the "My Inventory" sidebar entry — inventory/shop management is only
 * offered to people who founded a pharmacy/health-shop org.
 */
export function useHasPharmacy(): { has: boolean; loading: boolean } {
  const { user } = useUser()
  const [has, setHas] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) { setHas(false); setLoading(false); return }
    let cancelled = false
    setLoading(true)
    fetch('/api/organizations/inventory-capability', { credentials: 'include' })
      .then(r => r.json())
      .then(json => { if (!cancelled) setHas(!!json?.data?.hasPharmacy) })
      .catch(() => { if (!cancelled) setHas(false) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user?.id])

  return { has, loading }
}
