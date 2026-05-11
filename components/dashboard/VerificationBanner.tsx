'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa'

interface VerificationBannerProps {
  userId?: string
  userType?: string
}

/**
 * Shows a banner when the user's account is not yet verified (verified === false).
 * Prompts them to upload required documents from their settings page.
 */
const VerificationBanner: React.FC<VerificationBannerProps> = ({ userId }) => {
  const [verified, setVerified] = useState<boolean | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!userId) return

    // Check if already dismissed this session
    const dismissedKey = `mediwyz_verification_banner_dismissed_${userId}`
    if (sessionStorage.getItem(dismissedKey)) {
      setDismissed(true)
      return
    }

    fetch(`/api/auth/me`, { credentials: 'include' })
      .then(res => res.json())
      .then(json => {
        if (json.success && json.user) {
          setVerified(json.user.verified ?? null)
        }
      })
      .catch(() => {})
  }, [userId])

  const handleDismiss = () => {
    if (userId) {
      sessionStorage.setItem(`mediwyz_verification_banner_dismissed_${userId}`, 'true')
    }
    setDismissed(true)
  }

  // Don't show if verified, still loading, dismissed, or patient (patients have minimal doc requirements)
  if (verified === null || verified === true || dismissed) return null

  // Link directly to the user's own profile page (centralised profile)
  const documentsPath = userId ? `/profile/${userId}?tab=documents` : '/login'

  return (
    <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-4 flex items-start gap-3">
      <FaExclamationTriangle className="text-amber-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-amber-800 font-medium text-sm">Account verification pending</p>
        <p className="text-amber-700 text-sm mt-1">
          Upload your required documents to unlock all features.{' '}
          <Link href={documentsPath} className="text-amber-900 underline font-medium hover:text-amber-950">
            Upload Documents
          </Link>
        </p>
      </div>
      <button
        onClick={handleDismiss}
        className="text-amber-400 hover:text-amber-600 flex-shrink-0"
        aria-label="Dismiss banner"
      >
        <FaTimes />
      </button>
    </div>
  )
}

export default VerificationBanner
