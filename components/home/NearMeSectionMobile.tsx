'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  FaMapMarkerAlt, FaSpinner, FaRoute, FaCrosshairs,
  FaClinicMedical,
} from 'react-icons/fa'

// ─── Types (mirrors NearMeSection) ───────────────────────────────────────────

interface ProviderPin {
  id: string
  firstName: string
  lastName: string
  userType: string
  address: string | null
  latitude: number
  longitude: number
  distanceKm: number
  specialty: string[]
}

interface EntityPin {
  id: string
  name: string
  type: string
  address: string | null
  city: string | null
  latitude: number
  longitude: number
  distanceKm: number
}

type AnyPin = ProviderPin | EntityPin

// ─── Haversine ───────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const TYPE_EMOJI: Record<string, string> = {
  DOCTOR: '👨‍⚕️', NURSE: '👩‍⚕️', DENTIST: '🦷', PHARMACIST: '💊',
  PHYSIOTHERAPIST: '🧘', CAREGIVER: '🤝', OPTOMETRIST: '👁️', NUTRITIONIST: '🥗',
  LAB_TECHNICIAN: '🔬', EMERGENCY_WORKER: '🚑',
  clinic: '🏥', hospital: '🏨', laboratory: '🔬', dental_clinic: '🦷',
  optical_center: '👁️', wellness_center: '💆', pharmacy: '💊',
}
const getEmoji = (type: string) => TYPE_EMOJI[type] ?? '🏥'

function formatType(type: string) {
  return type.toLowerCase().replace(/_/g, ' ')
}

function mapsUrl(pin: AnyPin, userPos: { lat: number; lng: number } | null) {
  const dest = `${pin.latitude},${pin.longitude}`
  if (userPos) {
    return `https://www.google.com/maps/dir/?api=1&origin=${userPos.lat},${userPos.lng}&destination=${dest}&travelmode=driving`
  }
  return `https://www.google.com/maps/search/?api=1&query=${dest}`
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function NearMeSectionMobile() {
  const [providers, setProviders]   = useState<ProviderPin[]>([])
  const [entities, setEntities]     = useState<EntityPin[]>([])
  const [userPos, setUserPos]       = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating]     = useState(false)
  const [locError, setLocError]     = useState<string | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  // Fetch all pins on mount
  useEffect(() => {
    fetch('/api/geo/map-data')
      .then(r => r.json())
      .then(j => {
        if (j.success) {
          setProviders(j.data.providers ?? [])
          setEntities(j.data.entities ?? [])
        }
      })
      .catch(() => {})
      .finally(() => setDataLoading(false))
  }, [])

  const locate = useCallback(() => {
    if (!navigator.geolocation) { setLocError('Geolocation not supported'); return }
    setLocating(true)
    setLocError(null)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
      },
      () => { setLocating(false); setLocError('Location access denied') },
      { timeout: 8000 },
    )
  }, [])

  // Sort by distance when userPos is known
  const allPins: AnyPin[] = [
    ...providers.map(p => ({ ...p, distanceKm: userPos ? haversineKm(userPos.lat, userPos.lng, p.latitude, p.longitude) : p.distanceKm })),
    ...entities.map(e => ({ ...e, distanceKm: userPos ? haversineKm(userPos.lat, userPos.lng, e.latitude, e.longitude) : e.distanceKm })),
  ].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 12)

  return (
    <section className="bg-[#001E40]">
      {/* Header */}
      <div className="px-5 pt-7 pb-4">
        <h2 className="text-xl font-extrabold text-white">
          Find Nearest <span className="text-[#9AE1FF]">Healthcare</span>
        </h2>
        <p className="text-sm text-white/60 mt-0.5">
          Discover providers &amp; clinics near you
        </p>

        <div className="flex gap-2 mt-4">
          <button
            onClick={locate}
            disabled={locating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#9AE1FF] text-[#001E40] text-sm font-bold
              hover:opacity-90 disabled:opacity-60 transition-all active:scale-95"
          >
            {locating ? <FaSpinner className="animate-spin" /> : <FaMapMarkerAlt />}
            {userPos ? 'Update Location' : 'Find Nearest'}
          </button>
          {userPos && (
            <button
              onClick={() => setUserPos(null)}
              className="px-3 py-2.5 rounded-xl border border-white/20 text-white/60 text-sm hover:border-white/40 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {locError && <p className="text-xs text-red-400 mt-2">{locError}</p>}
        {userPos && (
          <p className="text-xs text-[#9AE1FF]/70 mt-1.5 flex items-center gap-1">
            <FaCrosshairs className="text-[10px]" />
            Sorted by distance from your location
          </p>
        )}
      </div>

      {/* List */}
      <div className="px-4 pb-6">
        {dataLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {!dataLoading && allPins.length === 0 && (
          <div className="text-center py-10">
            <FaClinicMedical className="text-white/20 text-3xl mx-auto mb-2" />
            <p className="text-sm text-white/40">No healthcare providers found</p>
          </div>
        )}

        {!dataLoading && allPins.length > 0 && (
          <div className="space-y-2.5">
            {allPins.map(pin => {
              const isProvider = 'firstName' in pin
              const name = isProvider ? `${pin.firstName} ${pin.lastName}` : (pin as EntityPin).name
              const type = isProvider ? pin.userType : (pin as EntityPin).type
              const location = !isProvider && (pin as EntityPin).city
                ? (pin as EntityPin).city
                : pin.address

              return (
                <div
                  key={pin.id}
                  className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-2xl px-4 py-3.5 transition-colors"
                >
                  {/* Emoji */}
                  <span className="text-2xl flex-shrink-0">{getEmoji(type)}</span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{name}</p>
                    <p className="text-white/50 text-xs mt-0.5 truncate">
                      {formatType(type)}
                      {location ? ` · ${location}` : ''}
                      {pin.distanceKm > 0 && (
                        <span className="text-[#9AE1FF] font-medium ml-1">
                          · {pin.distanceKm < 1
                            ? `${Math.round(pin.distanceKm * 1000)} m`
                            : `${pin.distanceKm.toFixed(1)} km`}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Route button */}
                  <a
                    href={mapsUrl(pin, userPos)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold
                      text-[#9AE1FF] border border-[#9AE1FF]/30 rounded-xl px-3 py-2
                      hover:bg-[#9AE1FF] hover:text-[#001E40] hover:border-[#9AE1FF] transition-all active:scale-95"
                    title={`Get directions to ${name}`}
                  >
                    <FaRoute className="text-[10px]" />
                    Maps
                  </a>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer link */}
        <div className="mt-5 pt-4 border-t border-white/10 text-center">
          <Link
            href="/search/providers"
            className="text-sm text-[#9AE1FF] font-semibold hover:underline"
          >
            Browse all providers →
          </Link>
        </div>
      </div>
    </section>
  )
}
