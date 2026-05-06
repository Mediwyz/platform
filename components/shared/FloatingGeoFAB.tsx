'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { FaLocationArrow, FaTimes, FaRoute, FaSpinner, FaSyncAlt } from 'react-icons/fa'

// ─── Types ────────────────────────────────────────────────────────────────────

interface NearPin {
  id: string
  name: string
  type: string
  city: string | null
  address: string | null
  distanceKm: number
  lat: number
  lng: number
}

// ─── Haversine (client-side, used for "All" filter) ──────────────────────────

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Filter config ────────────────────────────────────────────────────────────

const FILTERS: { key: string; emoji: string; label: string; isProvider: boolean }[] = [
  { key: 'all',        emoji: '🏥', label: 'All',          isProvider: false },
  { key: 'DOCTOR',     emoji: '👨‍⚕️', label: 'Doctors',     isProvider: true  },
  { key: 'NURSE',      emoji: '👩‍⚕️', label: 'Nurses',      isProvider: true  },
  { key: 'DENTIST',    emoji: '🦷',  label: 'Dentists',    isProvider: true  },
  { key: 'PHARMACIST', emoji: '💊',  label: 'Pharmacists', isProvider: true  },
  { key: 'clinic',     emoji: '🏥',  label: 'Clinics',     isProvider: false },
  { key: 'hospital',   emoji: '🏨',  label: 'Hospitals',   isProvider: false },
  { key: 'laboratory', emoji: '🔬',  label: 'Labs',        isProvider: false },
]

const TYPE_EMOJI: Record<string, string> = {
  DOCTOR: '👨‍⚕️', NURSE: '👩‍⚕️', DENTIST: '🦷', PHARMACIST: '💊',
  PHYSIOTHERAPIST: '🧘', CAREGIVER: '🤝', OPTOMETRIST: '👁️', NUTRITIONIST: '🥗',
  LAB_TECHNICIAN: '🔬', EMERGENCY_WORKER: '🚑',
  clinic: '🏥', hospital: '🏨', laboratory: '🔬', dental_clinic: '🦷',
  optical_center: '👁️', wellness_center: '💆', pharmacy: '💊',
}

function typeEmoji(type: string): string {
  return TYPE_EMOJI[type] ?? '🏥'
}

function formatType(type: string): string {
  return type.toLowerCase().replace(/_/g, ' ')
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function FloatingGeoFAB() {
  const [open, setOpen]               = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
  const [sortByDist, setSortByDist]   = useState(true)
  const [userLoc, setUserLoc]         = useState<{ lat: number; lng: number } | null>(null)
  const [pins, setPins]               = useState<NearPin[]>([])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const loadNearest = useCallback(
    async (filter: string, forceFreshLoc = false) => {
      setLoading(true)
      setError(null)
      try {
        // ── Get location ────────────────────────────────────────────────────
        let loc = forceFreshLoc ? null : userLoc
        if (!loc) {
          loc = await new Promise<{ lat: number; lng: number }>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(
              pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
              ()  => reject(new Error('Location access denied. Please allow location in your browser.')),
              { timeout: 8000 },
            ),
          )
          setUserLoc(loc)
        }

        // ── Fetch ───────────────────────────────────────────────────────────
        let results: NearPin[] = []

        if (filter === 'all') {
          const res = await fetch('/api/geo/map-data').then(r => r.json())
          if (res.success) {
            const provPins: NearPin[] = (res.data.providers ?? []).map((p: any) => ({
              id: `prov-${p.id}`,
              name: `${p.firstName} ${p.lastName}`,
              type: p.userType,
              city: null,
              address: p.address ?? null,
              lat: p.latitude,
              lng: p.longitude,
              distanceKm: haversine(loc!.lat, loc!.lng, p.latitude, p.longitude),
            }))
            const entPins: NearPin[] = (res.data.entities ?? []).map((e: any) => ({
              id: `ent-${e.id}`,
              name: e.name,
              type: e.type,
              city: e.city ?? null,
              address: e.address ?? null,
              lat: e.latitude,
              lng: e.longitude,
              distanceKm: haversine(loc!.lat, loc!.lng, e.latitude, e.longitude),
            }))
            results = [...provPins, ...entPins]
              .sort((a, b) => a.distanceKm - b.distanceKm)
              .slice(0, 15)
          }
        } else {
          const f = FILTERS.find(x => x.key === filter)!
          const endpoint = f.isProvider
            ? `/api/geo/providers?type=${filter}&lat=${loc.lat}&lng=${loc.lng}&limit=10`
            : `/api/geo/entities?type=${filter}&lat=${loc.lat}&lng=${loc.lng}&limit=10`
          const res = await fetch(endpoint).then(r => r.json())
          if (res.success) {
            results = (res.data ?? []).map((item: any) => ({
              id: f.isProvider ? `prov-${item.id}` : `ent-${item.id}`,
              name: f.isProvider ? `${item.firstName} ${item.lastName}` : item.name,
              type: f.isProvider ? item.userType : item.type,
              city: item.city ?? null,
              address: item.address ?? null,
              lat: item.latitude,
              lng: item.longitude,
              distanceKm: item.distanceKm,
            }))
          }
        }

        setPins(results)
      } catch (e: any) {
        setError(e.message ?? 'Something went wrong.')
      } finally {
        setLoading(false)
      }
    },
    [userLoc],
  )

  function handleFilterClick(key: string) {
    setActiveFilter(key)
    if (userLoc) loadNearest(key)
  }

  function routeUrl(pin: NearPin): string {
    const origin = userLoc ? `${userLoc.lat},${userLoc.lng}` : ''
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${pin.lat},${pin.lng}&travelmode=driving`
  }

  const displayPins = sortByDist
    ? [...pins].sort((a, b) => a.distanceKm - b.distanceKm)
    : pins

  return (
    <>
      {/* ── FAB button ─────────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-[228px] sm:bottom-[155px] right-4 sm:right-5 z-[150]
          w-12 h-12 rounded-full shadow-lg flex items-center justify-center
          bg-[#0C6780] hover:bg-[#0a5c73] text-white
          transition-all hover:scale-110 active:scale-95"
        aria-label="Find nearest healthcare"
        title="Find Nearest Healthcare"
      >
        <FaLocationArrow className="text-sm" />
      </button>

      {/* ── Backdrop ───────────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Modal / bottom sheet ───────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[201]
            sm:bottom-auto sm:top-1/2 sm:left-1/2
            sm:-translate-y-1/2 sm:-translate-x-1/2
            sm:w-[500px] sm:rounded-2xl
            w-full rounded-t-2xl
            bg-white shadow-2xl flex flex-col"
          style={{ maxHeight: '85vh' }}
        >
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="flex items-start justify-between px-4 pt-4 pb-3 border-b border-gray-100">
            {/* Drag handle on mobile */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 rounded-full sm:hidden" />
            <div>
              <h2 className="text-[#001E40] font-bold text-base leading-tight">
                Find Nearest Healthcare
              </h2>
              <p className="text-gray-500 text-xs mt-0.5 leading-snug">
                Discover providers &amp; clinics near you — tap a pin for directions
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="ml-3 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition flex-shrink-0"
              aria-label="Close"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>

          {/* ── Action row ─────────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 px-4 pt-3 pb-1 flex-wrap">
            <button
              onClick={() => { setActiveFilter('all'); loadNearest('all', true) }}
              disabled={loading}
              className="flex items-center gap-1.5 bg-[#0C6780] hover:bg-[#0a5c73] disabled:opacity-60
                text-white text-xs font-semibold px-3 py-2 rounded-lg transition"
            >
              {loading
                ? <FaSpinner className="text-xs animate-spin" />
                : <FaLocationArrow className="text-xs" />}
              Find Nearest
            </button>
            <button
              onClick={() => loadNearest(activeFilter)}
              disabled={loading || !userLoc}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-xs
                font-medium px-3 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
            >
              <FaSyncAlt className="text-xs" />
              Update
            </button>
            <label className="ml-auto flex items-center gap-1.5 cursor-pointer select-none">
              <span className="text-[11px] text-gray-500 whitespace-nowrap">Sort by distance</span>
              <input
                type="checkbox"
                checked={sortByDist}
                onChange={e => setSortByDist(e.target.checked)}
                className="accent-[#0C6780] w-3.5 h-3.5 cursor-pointer"
              />
            </label>
          </div>

          {/* ── Filter chips ───────────────────────────────────────────────── */}
          <div className="flex gap-1.5 px-4 py-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => handleFilterClick(f.key)}
                className={`flex-shrink-0 text-xs px-2.5 py-1.5 rounded-full border font-medium transition
                  ${activeFilter === f.key
                    ? 'bg-[#0C6780] text-white border-[#0C6780]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#0C6780] hover:text-[#0C6780]'
                  }`}
              >
                {f.emoji} {f.label}
              </button>
            ))}
          </div>

          {/* ── Results ────────────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-4 pb-2 min-h-0">

            {/* Loading skeleton */}
            {loading && (
              <div className="space-y-2 py-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="text-center py-8">
                <p className="text-sm text-red-500 mb-1">⚠️ {error}</p>
                <p className="text-xs text-gray-400">Check your browser location settings and try again.</p>
              </div>
            )}

            {/* Empty — no location yet */}
            {!loading && !error && pins.length === 0 && !userLoc && (
              <div className="text-center py-10">
                <div className="text-4xl mb-2">📍</div>
                <p className="text-sm text-gray-500 font-medium">Ready to find care near you?</p>
                <p className="text-xs text-gray-400 mt-1">
                  Tap <strong>Find Nearest</strong> to detect your location.
                </p>
              </div>
            )}

            {/* Empty — location known but no results */}
            {!loading && !error && pins.length === 0 && userLoc && (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">🔍</div>
                <p className="text-sm text-gray-500">No results found nearby.</p>
                <p className="text-xs text-gray-400 mt-1">Try a different filter or expand your search.</p>
              </div>
            )}

            {/* Results list */}
            {!loading && displayPins.length > 0 && (
              <>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold pt-1 pb-2">
                  Nearest to you ({displayPins.length})
                </p>
                <div className="space-y-2">
                  {displayPins.map(pin => (
                    <div
                      key={pin.id}
                      className="flex items-center justify-between bg-gray-50 hover:bg-gray-100
                        rounded-xl px-3 py-2.5 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl flex-shrink-0" aria-hidden>
                          {typeEmoji(pin.type)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[#001E40] text-xs font-semibold truncate leading-tight">
                            {pin.name}
                          </p>
                          <p className="text-gray-400 text-[10px] leading-tight mt-0.5">
                            {formatType(pin.type)}
                            {(pin.city ?? pin.address) ? ` · ${pin.city ?? pin.address}` : ''}
                            {userLoc && (
                              <span className="ml-1 text-[#0C6780] font-medium">
                                · {pin.distanceKm < 1
                                    ? `${Math.round(pin.distanceKm * 1000)} m`
                                    : `${pin.distanceKm.toFixed(1)} km`}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <a
                        href={routeUrl(pin)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 ml-2 flex items-center gap-1 text-[10px] font-semibold
                          text-[#0C6780] border border-[#0C6780]/30 rounded-lg px-2 py-1.5
                          hover:bg-[#0C6780] hover:text-white hover:border-[#0C6780] transition"
                        title={`Get directions to ${pin.name}`}
                      >
                        <FaRoute className="text-[9px]" /> Route
                      </a>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Footer ─────────────────────────────────────────────────────── */}
          <div className="border-t border-gray-100 px-4 py-3 flex-shrink-0">
            <Link
              href="/search/providers"
              onClick={() => setOpen(false)}
              className="text-xs text-[#0C6780] font-semibold hover:underline"
            >
              Browse all providers →
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
