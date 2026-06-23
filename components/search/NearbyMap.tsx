'use client'

/**
 * NearbyMap - the "find nearest with geolocation" experience for the final
 * search step. Lives on /search/{role} (mode="providers") and the
 * organisations search (mode="entities"). It is collapsed by default; the user
 * clicks "Find near me", we read their browser geolocation, query the geo API
 * for the nearest results of the given type, and render a Google Map + a
 * distance-sorted list.
 *
 * Endpoints:
 *   providers → GET /api/geo/providers?type={CODE}&lat&lng&limit
 *   entities  → GET /api/geo/entities?type={kind}&lat&lng&limit
 */

import { useCallback, useRef, useState } from 'react'
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'
import { FaLocationArrow, FaMapMarkerAlt, FaSpinner, FaTimes } from 'react-icons/fa'

const MAURITIUS_CENTER = { lat: -20.2, lng: 57.5 }
const NAVY = '#001E40'
const TEAL = '#0C6780'

interface NearbyItem {
  id: string
  latitude: number
  longitude: number
  distanceKm: number
  label: string
  sub?: string
}

interface NearbyMapProps {
  mode: 'providers' | 'entities'
  /** providerType code (DOCTOR…) for providers, or entity kind (clinic…) for entities. */
  type?: string
  accentColor?: string
  /** Heading shown on the toggle, e.g. "doctors near you". */
  noun: string
}

export default function NearbyMap({ mode, type, accentColor = TEAL, noun }: NearbyMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  })

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null)
  const [items, setItems] = useState<NearbyItem[]>([])
  const mapRef = useRef<google.maps.Map | null>(null)

  const findNearMe = useCallback(() => {
    setErr(null)
    if (!navigator.geolocation) { setErr('Geolocation is not supported by your browser.'); return }
    setLoading(true)
    setOpen(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setUserPos({ lat, lng })
        try {
          const params = new URLSearchParams({ lat: String(lat), lng: String(lng), limit: '15' })
          if (type) params.set('type', type)
          const res = await fetch(`/api/geo/${mode}?${params.toString()}`)
          const json = await res.json()
          const raw = (json?.success && Array.isArray(json.data)) ? json.data : []
          const mapped: NearbyItem[] = raw.map((r: Record<string, unknown>) => ({
            id: r.id as string,
            latitude: r.latitude as number,
            longitude: r.longitude as number,
            distanceKm: r.distanceKm as number,
            label: mode === 'providers'
              ? `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim() || 'Provider'
              : (r.name as string) || 'Location',
            sub: mode === 'providers'
              ? (Array.isArray(r.specialty) ? (r.specialty as string[])[0] : undefined) ?? (r.address as string | undefined)
              : [(r.type as string), (r.city as string)].filter(Boolean).join(' · '),
          }))
          setItems(mapped)
        } catch {
          setErr('Could not load nearby results. Please try again.')
        } finally {
          setLoading(false)
        }
      },
      () => { setLoading(false); setErr('Location permission denied. Enable it to find care near you.') },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }, [mode, type])

  const panTo = (it: NearbyItem) => mapRef.current?.panTo({ lat: it.latitude, lng: it.longitude })

  if (!apiKey) {
    // Graceful fallback when the maps key isn't configured - never crash the search page.
    return null
  }

  return (
    <div className="mb-5">
      {!open ? (
        <button
          onClick={findNearMe}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: accentColor, '--tw-ring-color': accentColor } as React.CSSProperties}
        >
          <FaLocationArrow /> Find {noun} near me
        </button>
      ) : (
        <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-sm">
          {/* header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <span className="text-sm font-bold flex items-center gap-2" style={{ color: NAVY }}>
              <FaMapMarkerAlt style={{ color: accentColor }} /> {noun} near you
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close map"
              className="text-faint hover:text-soft p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
            >
              <FaTimes />
            </button>
          </div>

          <div className="grid md:grid-cols-[1.4fr_1fr]">
            {/* map */}
            <div className="relative h-72 md:h-80 bg-subtle">
              {loadError ? (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-faint">Map failed to load.</div>
              ) : !isLoaded ? (
                <div className="absolute inset-0 flex items-center justify-center text-faint"><FaSpinner className="animate-spin" /></div>
              ) : (
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={userPos ?? MAURITIUS_CENTER}
                  zoom={userPos ? 12 : 10}
                  onLoad={(m) => { mapRef.current = m }}
                  options={{ disableDefaultUI: true, zoomControl: true, clickableIcons: false }}
                >
                  {userPos && (
                    <Marker
                      position={userPos}
                      icon={{
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 7, fillColor: '#1d4ed8', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2,
                      }}
                      title="You are here"
                    />
                  )}
                  {items.map(it => (
                    <Marker
                      key={it.id}
                      position={{ lat: it.latitude, lng: it.longitude }}
                      onClick={() => panTo(it)}
                      icon={{
                        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                        scale: 4.5, fillColor: accentColor, fillOpacity: 1, strokeColor: '#fff', strokeWeight: 1.5,
                      }}
                      title={it.label}
                    />
                  ))}
                </GoogleMap>
              )}
            </div>

            {/* nearest list */}
            <div className="max-h-72 md:max-h-80 overflow-y-auto divide-y divide-gray-50">
              {loading ? (
                <div className="p-6 text-center text-sm text-faint"><FaSpinner className="animate-spin inline mr-2" /> Locating you…</div>
              ) : err ? (
                <div className="p-6 text-center text-sm text-soft">
                  {err}
                  <button onClick={findNearMe} className="block mx-auto mt-3 text-xs font-semibold underline" style={{ color: accentColor }}>Try again</button>
                </div>
              ) : items.length === 0 ? (
                <div className="p-6 text-center text-sm text-faint">No {noun} found near you yet.</div>
              ) : (
                items.map((it, i) => (
                  <button
                    key={it.id}
                    onClick={() => panTo(it)}
                    className="w-full text-left px-4 py-3 hover:bg-subtle transition-colors flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-200"
                  >
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                          style={{ background: accentColor }}>
                      {i + 1}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-fg truncate">{it.label}</span>
                      {it.sub && <span className="block text-xs text-faint truncate">{it.sub}</span>}
                    </span>
                    <span className="text-xs font-medium flex-shrink-0" style={{ color: accentColor }}>
                      {it.distanceKm < 1 ? `${Math.round(it.distanceKm * 1000)} m` : `${it.distanceKm.toFixed(1)} km`}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
