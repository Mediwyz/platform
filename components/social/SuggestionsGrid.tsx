'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FaUserPlus, FaCheck, FaSpinner } from 'react-icons/fa'
import { getUserTypeLabel } from '@/lib/constants/userTypeStyles'
import { avatarSrc, initialsAvatar } from '@/lib/utils/avatar'

interface Suggestion {
  id: string
  firstName: string
  lastName: string
  profileImage: string | null
  userType: string
  address: string | null
}

type ConnStatus = 'none' | 'pending' | 'accepted'

const PAGE_SIZE = 12

export default function SuggestionsGrid({ currentUserId }: { currentUserId: string }) {
  const [items, setItems] = useState<Suggestion[]>([])
  const [statuses, setStatuses] = useState<Record<string, ConnStatus>>({})
  const [sending, setSending] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)

  const load = useCallback(async (currentOffset: number, append: boolean) => {
    try {
      const res = await fetch(
        `/api/connections/suggestions?userId=${currentUserId}&limit=${PAGE_SIZE}&offset=${currentOffset}`,
        { credentials: 'include' },
      )
      const json = await res.json()
      if (json.success) {
        setItems(prev => append ? [...prev, ...(json.data ?? [])] : (json.data ?? []))
        setHasMore(json.hasMore ?? false)
        setOffset(currentOffset + (json.data?.length ?? 0))
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [currentUserId])

  useEffect(() => { load(0, false) }, [load])

  const handleConnect = async (targetId: string) => {
    setSending(targetId)
    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: currentUserId, receiverId: targetId }),
        credentials: 'include',
      })
      const json = await res.json()
      if (json.success) {
        setStatuses(prev => ({ ...prev, [targetId]: 'pending' }))
      }
    } catch {
      // silent
    } finally {
      setSending(null)
    }
  }

  const handleLoadMore = () => {
    setLoadingMore(true)
    load(offset, true)
  }

  if (loading) {
    return (
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">People You May Know</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-xl border p-4 flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-gray-200" />
              <div className="h-3 bg-gray-200 rounded w-20" />
              <div className="h-2.5 bg-gray-100 rounded w-14" />
              <div className="h-7 bg-gray-100 rounded w-full mt-1" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (items.length === 0) return null

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">People You May Know</h2>
        <span className="text-xs text-gray-400">{items.length} shown</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {items.map(user => {
          const status: ConnStatus = statuses[user.id] ?? 'none'
          return (
            <div key={user.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col items-center text-center hover:shadow-md transition-shadow">
              {/* Avatar — links to profile */}
              <Link href={`/profile/${user.id}`} className="flex-shrink-0 mb-2">
                <Image
                  src={avatarSrc(user.profileImage, user.firstName, user.lastName)}
                  alt={`${user.firstName} ${user.lastName}`}
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 bg-gray-100"
                  onError={e => { e.currentTarget.src = initialsAvatar(user.firstName, user.lastName) }}
                />
              </Link>

              {/* Name — links to profile */}
              <Link
                href={`/profile/${user.id}`}
                className="text-sm font-medium text-gray-900 hover:text-blue-600 transition leading-tight line-clamp-2 mb-0.5"
              >
                {user.firstName} {user.lastName}
              </Link>

              {/* Role badge */}
              <span className="text-[10px] text-gray-500 mb-2 truncate w-full">
                {getUserTypeLabel(user.userType)}
              </span>

              {/* Connect / status button */}
              {status === 'none' && (
                <button
                  onClick={() => handleConnect(user.id)}
                  disabled={sending === user.id}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {sending === user.id
                    ? <FaSpinner className="animate-spin text-[10px]" />
                    : <FaUserPlus className="text-[10px]" />}
                  Connect
                </button>
              )}
              {status === 'pending' && (
                <span className="w-full flex items-center justify-center gap-1 py-1.5 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-lg border border-yellow-200">
                  Pending
                </span>
              )}
              {status === 'accepted' && (
                <span className="w-full flex items-center justify-center gap-1 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-lg border border-green-200">
                  <FaCheck className="text-[10px]" /> Connected
                </span>
              )}
            </div>
          )
        })}
      </div>

      {hasMore && (
        <div className="mt-5 flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition disabled:opacity-50 shadow-sm"
          >
            {loadingMore ? <FaSpinner className="animate-spin text-xs" /> : null}
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}
