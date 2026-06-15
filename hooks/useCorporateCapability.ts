'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'

/**
 * Returns whether the current user has corporate-admin capability.
 * Capability - not role - is granted when the user owns a company OR has
 * an active corporate/enterprise subscription.
 *
 * Used to conditionally show "My Company" sidebar entry, "Post as company"
 * toggles, and access to the corporate dashboard from any user type.
 */
export function useCorporateCapability(): { has: boolean; loading: boolean } {
  const { user } = useUser()
  const [has, setHas] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) {
      setHas(false)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    fetch('/api/corporate/capability', { credentials: 'include' })
      .then(r => r.json())
      .then(json => {
        if (cancelled) return
        setHas(!!json?.data?.hasCapability)
      })
      .catch(() => { if (!cancelled) setHas(false) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user?.id])

  return { has, loading }
}
