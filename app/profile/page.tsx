'use client'

/**
 * /profile (no id)  convenience redirect to the signed-in user's unified
 * profile at /profile/[id]. Any bare "/profile" link (or a link built with an
 * empty id) lands here instead of 404'ing. Falls back to /login when signed out.
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FaSpinner } from 'react-icons/fa'

function currentUserId(): string | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.split('; ').find(r => r.startsWith('mediwyz_user_id='))
  return m ? decodeURIComponent(m.split('=')[1]) : null
}

export default function ProfileIndexRedirect() {
  const router = useRouter()
  useEffect(() => {
    const id = currentUserId()
    router.replace(id ? `/profile/${id}` : '/login?next=/profile')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <FaSpinner className="animate-spin text-2xl text-[#0C6780] dark:text-accent" />
    </div>
  )
}
