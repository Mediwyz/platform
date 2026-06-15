'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'

/**
 * Returns whether the current user owns an insurance company - regardless
 * of their `userType`. A MEMBER, DOCTOR, or any other user who created a
 * `CorporateAdminProfile` with `isInsuranceCompany: true` has this
 * capability; the legacy `INSURANCE_REP` userType also grants it for
 * backward compat with seeded users.
 *
 * Do NOT confuse "insurance owner" with the `REGIONAL_ADMIN` role (which
 * manages the platform itself) or with the legacy `INSURANCE_REP` userType
 * (a grace-period role kept only for seeded data).
 */
export function useInsuranceCapability(): { has: boolean; loading: boolean } {
  const { user } = useUser()
  const [has, setHas] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) {
      setHas(false); setLoading(false); return
    }
    let cancelled = false
    setLoading(true)
    fetch('/api/corporate/insurance-capability', { credentials: 'include' })
      .then((r) => r.json())
      .then((json) => { if (!cancelled) setHas(!!json?.data?.hasCapability) })
      .catch(() => { if (!cancelled) setHas(false) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user?.id])

  return { has, loading }
}
