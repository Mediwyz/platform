'use client'

import { useState, useEffect } from 'react'

export interface LocalUser {
  id: string
  firstName: string
  lastName: string
  email: string
  userType: string
  profileImage: string | null
}

/**
 * Read the current user from localStorage (`mediwyz_user` key).
 *
 * Returns `{ user, loading }` where `user` is `null` until localStorage has
 * been checked. Handles corrupted / missing data gracefully.
 *
 * NOTE: The existing `useDashboardUser` hook in `hooks/useDashboardUser.ts`
 * returns the same shape but without a `loading` flag. Prefer this hook in
 * new code where you need to distinguish "not yet read" from "no user".
 */
export function useLocalUser() {
  const [user, setUser] = useState<LocalUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('mediwyz_user')
      if (stored) {
        setUser(JSON.parse(stored))
      }
    } catch {
      // Corrupted localStorage - leave user as null
    } finally {
      setLoading(false)
    }
  }, [])

  return { user, loading }
}
