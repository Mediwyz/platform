'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  GoogleMap, useJsApiLoader, Marker, InfoWindow,
  DirectionsService, DirectionsRenderer,
} from '@react-google-maps/api'
import { FaCrosshairs, FaSpinner, FaMapMarkerAlt, FaRoute, FaTimes } from 'react-icons/fa'
import Link from 'next/link'

interface ProviderPin {
  id: string; firstName: string; lastName: string; profileImage: string | null
  userType: string; address: string | null; latitude: number; longitude: number; distanceKm: number; specialty: string[]
}
interface EntityPin {
  id: string; name: string; type: string; address: string | null; city: string | null
  phone: string | null; latitude: number; longitude: number; distanceKm: number
}
type AnyPin = ProviderPin | EntityPin
type SearchMode = 'DOCTOR' | 'NURSE' | 'DENTIST' | 'PHARMACIST' | 'clinic' | 'hospital' | 'laboratory' | 'ALL'

interface MapPanelProps {
  externalMode?: string
}

const MODES: { value: SearchMode; label: string; color: string; emoji: string }[] = [
  { value: 'ALL',        label: 'All',         color: '#0C6780', emoji: '🏥' },
  { value: 'DOCTOR',     label: 'Doctors',     color: '#4F46E5', emoji: '👨‍⚕️' },
  { value: 'NURSE',      label: 'Nurses',      color: '#0891B2', emoji: '👩‍⚕️' },
  { value: 'DENTIST',    label: 'Dentists',    color: '#7C3AED', emoji: '🦷' },
  { value: 'PHARMACIST', label: 'Pharmacists', color: '#059669', emoji: '💊' },
  { value: 'clinic',     label: 'Clinics',     color: '#DC2626', emoji: '🏥' },
  { value: 'hospital',   label: 'Hospitals',   color: '#B45309', emoji: '🏨' },
  { value: 'laboratory', label: 'Labs',        color: '#6D28D9', emoji: '🔬' },
]

const PROVIDER_TYPES = new Set(['DOCTOR','NURSE','DENTIST','PHARMACIST','NANNY','CAREGIVER','PHYSIOTHERAPIST','OPTOMETRIST','NUTRITIONIST','LAB_TECHNICIAN','EMERGENCY_WORKER'])
const ENTITY_TYPES   = new Set(['clinic','hospital','laboratory','pharmacy'])
const MAURITIUS_CENTER = { lat: -20.2, lng: 57.5 }
const LIBRARIES: ('places' | 'geometry')[] = ['places', 'geometry']

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry',              stylers: [{ color: '#0a2744' }] },
  { elementType: 'labels.text.stroke',    stylers: [{ color: '#001E40' }] },
  { elementType: 'labels.text.fill',      stylers: [{ color: '#9AE1FF' }] },
  { featureType: 'water',    elementType: 'geometry',        stylers: [{ color: '#0C3460' }] },
  { featureType: 'road',     elementType: 'geometry',        stylers: [{ color: '#1a4a6b' }] },
  { featureType: 'road',     elementType: 'geometry.stroke', stylers: [{ color: '#0C2A44' }] },
  { featureType: 'poi',      elementType: 'geometry',        stylers: [{ color: '#0d3a5c' }] },
  { featureType: 'administrative', elementType: 'geometry',  stylers: [{ color: '#2a6090' }] },
  { featureType: 'landscape',      elementType: 'geometry',  stylers: [{ color: '#0d2f4a' }] },
]

function svgUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
function markerIcon(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2.5"/><circle cx="16" cy="16" r="6" fill="white"/></svg>`
  return { url: svgUrl(svg), scaledSize: new window.google.maps.Size(28, 28), anchor: new window.google.maps.Point(14, 14) }
}
function entityMarkerIcon(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 36 36"><rect x="4" y="4" width="28" height="28" rx="6" fill="${color}" stroke="white" stroke-width="2.5"/><rect x="15" y="9" width="6" height="18" rx="2" fill="white"/><rect x="9" y="15" width="18" height="6" rx="2" fill="white"/></svg>`
  return { url: svgUrl(svg), scaledSize: new window.google.maps.Size(30, 30), anchor: new window.google.maps.Point(15, 15) }
}

const VALID_MODE_SET = new Set<string>(MODES.map(m => m.value))

export default function MapPanel({ externalMode }: MapPanelProps = {}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: apiKey, id: 'mediwyz-map', libraries: LIBRARIES })
  const mapRef = useRef<google.maps.Map | null>(null)

  const [mode, setMode]           = useState<SearchMode>('ALL')

  // Sync internal mode when parent passes an external filter (e.g. role chip from ProvidersSection)
  useEffect(() => {
    if (externalMode != null) {
      setMode(VALID_MODE_SET.has(externalMode) ? (externalMode as SearchMode) : 'ALL')
    }
  }, [externalMode])
  const [userPos, setUserPos]     = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating]   = useState(false)
  const [providers, setProviders] = useState<ProviderPin[]>([])
  const [entities, setEntities]   = useState<EntityPin[]>([])
  const [selected, setSelected]   = useState<AnyPin | null>(null)
  const [dirTarget, setDirTarget] = useState<AnyPin | null>(null)
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null)
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null)

  useEffect(() => {
    fetch('/api/geo/map-data')
      .then(r => r.json())
      .then(j => { if (j.success) { setProviders(j.data.providers ?? []); setEntities(j.data.entities ?? []) } })
      .catch(() => {})
  }, [])

  const locate = useCallback(() => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserPos(p); setLocating(false)
        mapRef.current?.panTo(p); mapRef.current?.setZoom(13)
      },
      () => setLocating(false),
      { timeout: 8000 },
    )
  }, [])

  const onDirectionsCallback = useCallback(
    (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
      if (status === 'OK' && result) {
        setDirections(result)
        const leg = result.routes[0]?.legs[0]
        if (leg) setRouteInfo({ distance: leg.distance?.text ?? '', duration: leg.duration?.text ?? '' })
      }
      setDirTarget(null)
    },
    [],
  )

  const providerColor = (type: string) => MODES.find(m => m.value === type)?.color ?? '#0C6780'
  const onMapLoad = useCallback((map: google.maps.Map) => { mapRef.current = map }, [])

  const visibleProviders = (mode === 'ALL' || PROVIDER_TYPES.has(mode))
    ? (mode === 'ALL' ? providers : providers.filter(p => p.userType === mode))
    : []
  const visibleEntities = (mode === 'ALL' || ENTITY_TYPES.has(mode))
    ? (mode === 'ALL' ? entities : entities.filter(e => e.type === mode))
    : []

  if (!apiKey || loadError) {
    return (
      <div className="h-full bg-[#0a2a46] flex flex-col items-center justify-center p-6 text-center gap-3">
        <FaMapMarkerAlt className="text-[#9AE1FF] text-3xl" />
        <p className="text-white/70 text-sm font-medium">
          {!apiKey ? 'Map API key not configured' : 'Map failed to load'}
        </p>
        <Link href="/search/providers" className="text-xs text-[#9AE1FF] hover:text-white">
          Browse providers →
        </Link>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[#001E40]">

      {/* Mode chips */}
      <div className="flex gap-1.5 px-3 py-2.5 overflow-x-auto [&::-webkit-scrollbar]:hidden bg-[#001830] border-b border-white/10 flex-shrink-0">
        {MODES.map(m => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            title={m.label}
            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all
              ${mode === m.value ? 'text-white border-transparent' : 'text-white/60 border-white/20 hover:border-white/40 hover:text-white'}`}
            style={mode === m.value ? { backgroundColor: m.color } : {}}
          >
            {m.emoji} <span className="hidden sm:inline">{m.label}</span>
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="flex-1 relative min-h-0">
        {!isLoaded && (
          <div className="absolute inset-0 bg-[#0a2a46] flex items-center justify-center z-10">
            <FaSpinner className="text-[#9AE1FF] text-2xl animate-spin" />
          </div>
        )}

        {isLoaded && (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={userPos ?? MAURITIUS_CENTER}
            zoom={userPos ? 12 : 10}
            onLoad={onMapLoad}
            options={{
              styles: MAP_STYLES,
              disableDefaultUI: false,
              zoomControl: true,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: true,
              backgroundColor: '#001E40',
            }}
          >
            {visibleProviders.map(p => (
              <Marker key={p.id} position={{ lat: p.latitude, lng: p.longitude }} icon={markerIcon(providerColor(p.userType))} onClick={() => setSelected(p)} />
            ))}
            {visibleEntities.map(e => (
              <Marker key={e.id} position={{ lat: e.latitude, lng: e.longitude }} icon={entityMarkerIcon('#DC2626')} onClick={() => setSelected(e)} />
            ))}
            {userPos && (
              <Marker
                position={userPos}
                zIndex={999}
                icon={{
                  url: svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#9AE1FF" stroke="white" stroke-width="3"/><circle cx="12" cy="12" r="4" fill="white"/></svg>`),
                  scaledSize: new window.google.maps.Size(24, 24),
                  anchor: new window.google.maps.Point(12, 12),
                }}
              />
            )}

            {selected && (
              <InfoWindow position={{ lat: selected.latitude, lng: selected.longitude }} onCloseClick={() => setSelected(null)}>
                <div className="min-w-[160px] text-sm p-1">
                  {'firstName' in selected ? (
                    <>
                      <p className="font-bold text-gray-900">{selected.firstName} {selected.lastName}</p>
                      <p className="text-xs text-gray-500 capitalize">{selected.userType.toLowerCase().replace(/_/g, ' ')}</p>
                      {selected.specialty?.length > 0 && (
                        <p className="text-xs text-[#0C6780] mt-0.5">{selected.specialty[0]}</p>
                      )}
                      {selected.address && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{selected.address}</p>}
                      <Link href={`/profile/${selected.id}`} className="mt-2 block text-center text-xs py-1 px-2 bg-[#001E40] text-white rounded-lg">
                        View Profile →
                      </Link>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-gray-900">{'name' in selected ? selected.name : ''}</p>
                      <p className="text-xs text-gray-500 capitalize">{'type' in selected ? selected.type : ''}</p>
                      {'city' in selected && selected.city && <p className="text-xs text-gray-400">{selected.city}</p>}
                    </>
                  )}
                </div>
              </InfoWindow>
            )}

            {dirTarget && userPos && (
              <DirectionsService
                options={{ origin: userPos, destination: { lat: dirTarget.latitude, lng: dirTarget.longitude }, travelMode: google.maps.TravelMode.DRIVING }}
                callback={onDirectionsCallback}
              />
            )}
            {directions && (
              <DirectionsRenderer
                options={{ directions, suppressMarkers: true, polylineOptions: { strokeColor: '#9AE1FF', strokeOpacity: 0.85, strokeWeight: 5 } }}
              />
            )}
          </GoogleMap>
        )}

        {/* Floating locate button */}
        <button
          onClick={locate}
          disabled={locating}
          title="Use my location"
          className="absolute bottom-4 right-4 z-10 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center text-[#0C6780] hover:bg-[#0C6780] hover:text-white transition-colors disabled:opacity-60"
        >
          {locating ? <FaSpinner className="text-sm animate-spin" /> : <FaCrosshairs className="text-sm" />}
        </button>

        {/* Route info overlay */}
        {routeInfo && (
          <div className="absolute top-3 left-3 right-14 z-10 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#001E40]/90 border border-white/20 backdrop-blur-sm">
            <FaRoute className="text-[#9AE1FF] text-xs flex-shrink-0" />
            <p className="text-xs text-white flex-1">{routeInfo.distance} · {routeInfo.duration}</p>
            <button onClick={() => { setDirections(null); setRouteInfo(null) }} className="text-white/50 hover:text-white">
              <FaTimes className="text-[10px]" />
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-3 py-2 bg-[#001830] border-t border-white/10 text-center">
        <Link href="/search/providers" className="text-xs text-[#9AE1FF] hover:text-white transition-colors font-medium">
          Browse all providers →
        </Link>
      </div>
    </div>
  )
}
