'use client'

import { useEffect, useState } from 'react'
import { FaStar, FaRegStar } from 'react-icons/fa'

/**
 * Star toggle on provider cards. Optimistic update - reverts on API failure.
 * Reads initial state on mount if not supplied.
 */
export default function FavoriteButton({
  providerId,
  initialFavorited,
  size = 'md',
  className = '',
}: {
  providerId: string
  initialFavorited?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const [favorited, setFavorited] = useState(initialFavorited ?? false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (initialFavorited !== undefined) return
    let cancelled = false
    fetch('/api/favorites', { credentials: 'include' })
      .then(r => r.json())
      .then(json => {
        if (cancelled || !json?.success) return
        const list = Array.isArray(json.data) ? json.data : []
        setFavorited(list.some((f: { providerId: string }) => f.providerId === providerId))
      })
      .catch(() => { /* silent */ })
    return () => { cancelled = true }
  }, [providerId, initialFavorited])

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (busy) return
    const prev = favorited
    setFavorited(!favorited)
    setBusy(true)
    try {
      const res = await fetch(`/api/favorites/${providerId}/toggle`, {
        method: 'POST',
        credentials: 'include',
      })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.message)
      setFavorited(json.data.favorited)
    } catch {
      setFavorited(prev) // revert
    } finally {
      setBusy(false)
    }
  }

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 22 : 18
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={favorited ? 'Remove from favourites' : 'Save provider'}
      aria-pressed={favorited}
      disabled={busy}
      className={`inline-flex items-center justify-center p-2 rounded-full transition-colors hover:bg-gray-100 disabled:opacity-50 ${className}`}
    >
      {favorited
        ? <FaStar size={iconSize} className="text-amber-500" />
        : <FaRegStar size={iconSize} className="text-gray-400 hover:text-amber-500" />}
    </button>
  )
}
