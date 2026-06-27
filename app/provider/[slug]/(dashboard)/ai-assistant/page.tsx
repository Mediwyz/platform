'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

/** The standalone AI/health dashboard has been merged into the unified dashboard
 *  (AI Assistant is the first tab there). Redirect any old links to it. */
export default function AiAssistantPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  useEffect(() => { router.replace(`/provider/${slug}`) }, [router, slug])
  return (
    <div className="flex items-center justify-center py-20" role="status" aria-label="Redirecting to your dashboard">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0C6780]" />
    </div>
  )
}
