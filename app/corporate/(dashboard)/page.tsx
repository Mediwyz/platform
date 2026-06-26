'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * The standalone corporate dashboard (with the "Company management has moved"
 * banner + overview widgets) is retired. Company/organisation management now
 * lives entirely on the unified My Organizations hub. Anyone landing here — via
 * an old bookmark or the "All organisations" sidebar link — is sent straight there.
 */
export default function CorporateDashboardRedirect() {
 const router = useRouter()

 useEffect(() => {
  router.replace('/my-company')
 }, [router])

 return (
  <div className="flex items-center justify-center h-64" role="status" aria-label="Redirecting to My Organizations">
   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal" />
  </div>
 )
}
