'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'

export interface Workspace {
  id: string
  name: string
  kind: 'healthcare' | 'insurance' | 'company'
  type: string | null
  isFounder: boolean
  manageHref: string
}

/**
 * Every organisation/company the current user owns or works at — used to inject
 * one named entry per entity into the dashboard sidebar.
 */
export function useMyWorkspaces(): { workspaces: Workspace[]; loading: boolean } {
  const { user } = useUser()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) { setWorkspaces([]); setLoading(false); return }
    let cancelled = false
    setLoading(true)
    fetch('/api/organizations/my-workspaces', { credentials: 'include' })
      .then(r => r.json())
      .then(json => { if (!cancelled && json?.success && Array.isArray(json.data)) setWorkspaces(json.data) })
      .catch(() => { if (!cancelled) setWorkspaces([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user?.id])

  return { workspaces, loading }
}
