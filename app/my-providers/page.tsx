'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FaStar, FaArrowLeft, FaCalendarPlus } from 'react-icons/fa'

interface Favorite {
  id: string
  providerId: string
  provider: {
    id: string
    firstName: string
    lastName: string
    userType: string
    profileImage: string | null
  }
  createdAt: string
}

export default function MyProvidersPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/favorites', { credentials: 'include' })
      const json = await res.json()
      setFavorites(Array.isArray(json?.data) ? json.data : [])
    } catch {
      setFavorites([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const remove = async (providerId: string) => {
    setFavorites(f => f.filter(x => x.providerId !== providerId))
    try {
      await fetch(`/api/favorites/${providerId}/toggle`, {
        method: 'POST', credentials: 'include',
      })
    } catch { load() /* revert on failure */ }
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-gray-400 hover:text-gray-600"><FaArrowLeft /></Link>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FaStar className="text-amber-500" /> My Providers
        </h1>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>
      ) : favorites.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <FaStar className="mx-auto text-5xl text-gray-200" />
          <p className="text-gray-500">No saved providers yet.</p>
          <p className="text-xs text-gray-400">
            Tap the ⭐ on any provider card to save them for one-tap rebooking.
          </p>
          <Link
            href="/search/doctors"
            className="inline-block mt-2 px-5 py-2.5 bg-[#0C6780] text-white rounded-xl text-sm font-medium hover:bg-[#0a5568]"
          >
            Browse providers
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {favorites.map(f => (
            <div key={f.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                {f.provider.profileImage
                  ? <Image src={f.provider.profileImage} alt="" width={48} height={48} className="w-full h-full object-cover" />
                  : <span className="text-lg font-bold text-[#001E40]">
                      {(f.provider.firstName[0] || '') + (f.provider.lastName[0] || '')}
                    </span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {f.provider.firstName} {f.provider.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {f.provider.userType.replace('_', ' ').toLowerCase()}
                </p>
              </div>
              <Link
                href={`/providers/${f.provider.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0C6780] text-white rounded-lg text-xs font-semibold hover:bg-[#0a5568]"
              >
                <FaCalendarPlus className="text-[10px]" /> Book
              </Link>
              <button
                onClick={() => remove(f.providerId)}
                aria-label="Unsave"
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <FaStar className="text-amber-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
