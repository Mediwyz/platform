'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  GoogleMap, useJsApiLoader, Marker, InfoWindow,
  DirectionsService, DirectionsRenderer,
} from '@react-google-maps/api'
import {
  FaMapMarkerAlt, FaCrosshairs, FaSpinner, FaChevronRight,
  FaClinicMedical, FaExclamationTriangle, FaRoute, FaTimes,
  FaSearch, FaStar, FaCheckCircle, FaArrowRight, FaClock,
  FaConciergeBell, FaUserMd, FaShoppingBag, FaMap, FaLock,
} from 'react-icons/fa'
import Image from 'next/image'
import Link from 'next/link'
import { useBookingDrawer } from '@/lib/contexts/booking-drawer-context'
import { avatarSrc } from '@/lib/utils/avatar'
import { trackEvent } from '@/lib/analytics'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProviderPin {
  id: string; firstName: string; lastName: string
  profileImage: string | null; userType: string
  address: string | null; latitude: number; longitude: number; distanceKm: number
  specialty: string[]
}

interface EntityPin {
  id: string; name: string; type: string
  address: string | null; city: string | null; phone: string | null
  latitude: number; longitude: number; distanceKm: number
}

type AnyPin = ProviderPin | EntityPin

interface RoleData { code: string; label: string; slug: string; color: string; emoji?: string; iconKey?: string | null }

interface ServiceItem {
  id: string; serviceName: string; category: string; description: string | null
  providerType: string; defaultPrice: number; currency: string; duration: number | null
  providerCount: number; iconKey?: string | null; emoji?: string | null; imageUrl?: string | null
}

interface ProviderCard {
  id: string; firstName: string; lastName: string; profileImage: string | null
  userType: string; specialty?: string | null; rating?: number | null
  reviewCount?: number | null; verified: boolean
}

interface ShopItem {
  id: string; name: string; category: string; imageUrl?: string
  price: number; inStock: boolean; requiresPrescription: boolean
  unitOfMeasure: string; strength?: string; description?: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TABS = [
  { id: 'providers' as const, label: 'Providers',     emoji: '👨‍⚕️' },
  { id: 'services'  as const, label: 'Services',      emoji: '🩺'  },
  { id: 'shop'      as const, label: 'Health Shop',   emoji: '🛒'  },
]
type TabId = 'providers' | 'services' | 'shop'

const ENTITY_MODES = [
  { value: 'clinic',     label: 'Clinics',   color: '#DC2626', emoji: '🏥' },
  { value: 'hospital',   label: 'Hospitals', color: '#B45309', emoji: '🏨' },
  { value: 'laboratory', label: 'Labs',      color: '#6D28D9', emoji: '🔬' },
]
const ENTITY_TYPES = new Set(['clinic', 'hospital', 'laboratory', 'pharmacy'])

const ROLE_EMOJI_FALLBACK: Record<string, string> = {
  DOCTOR: '👨‍⚕️', NURSE: '👩‍⚕️', DENTIST: '🦷', PHARMACIST: '💊',
  NANNY: '🧸', CAREGIVER: '🤝', PHYSIOTHERAPIST: '🏃', OPTOMETRIST: '👁️',
  NUTRITIONIST: '🥗', LAB_TECHNICIAN: '🧪', EMERGENCY_WORKER: '🚑',
}

const SHOP_CATEGORIES = [
  { key: 'ALL',            label: 'All',          emoji: '🏥' },
  { key: 'medication',     label: 'Medications',  emoji: '💊' },
  { key: 'vitamins',       label: 'Vitamins',     emoji: '🌿' },
  { key: 'first_aid',      label: 'First Aid',    emoji: '🩹' },
  { key: 'personal_care',  label: 'Personal Care',emoji: '🧴' },
  { key: 'dental_care',    label: 'Dental',       emoji: '🦷' },
  { key: 'baby_care',      label: 'Baby Care',    emoji: '👶' },
  { key: 'nutrition',      label: 'Nutrition',    emoji: '🥗' },
  { key: 'eyewear',        label: 'Eyewear',      emoji: '👓' },
  { key: 'medical_devices',label: 'Devices',      emoji: '🩺' },
]

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

// ─── Utils ────────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function hex2rgba(hex: string, alpha = 0.12) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function svgUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function makeMarkerIcon(color: string, size = 32) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2.5"/>
    <circle cx="16" cy="16" r="6" fill="white"/>
  </svg>`
  return { url: svgUrl(svg), scaledSize: new window.google.maps.Size(size, size), anchor: new window.google.maps.Point(size / 2, size / 2) }
}

function makeEntityMarkerIcon(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
    <rect x="4" y="4" width="28" height="28" rx="6" fill="${color}" stroke="white" stroke-width="2.5"/>
    <rect x="15" y="9" width="6" height="18" rx="2" fill="white"/>
    <rect x="9" y="15" width="18" height="6" rx="2" fill="white"/>
  </svg>`
  return { url: svgUrl(svg), scaledSize: new window.google.maps.Size(36, 36), anchor: new window.google.maps.Point(18, 18) }
}

function isLoggedIn() {
  if (typeof document === 'undefined') return false
  return document.cookie.split(';').some(c => c.trim().startsWith('mediwyz_userType='))
}

// ─── Map Error Panel ──────────────────────────────────────────────────────────

function MapErrorPanel({ error, apiKey }: { error: Error | null; apiKey: string }) {
  if (!apiKey) return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0a2a46] z-10">
      <div className="text-center px-6 max-w-xs">
        <FaMapMarkerAlt className="text-[#9AE1FF] text-4xl mx-auto mb-3" />
        <p className="text-white font-semibold text-sm">Maps API key not configured</p>
        <p className="text-white/50 text-xs mt-1">
          Add <code className="bg-white/10 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to <code className="bg-white/10 px-1 rounded">.env.local</code>
        </p>
      </div>
    </div>
  )

  const msg = error?.message ?? ''
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0a2a46] z-10 p-6">
      <div className="max-w-sm w-full">
        <div className="flex items-center gap-2 mb-3">
          <FaExclamationTriangle className="text-amber-400 text-lg flex-shrink-0" />
          <p className="text-white font-bold text-sm">Map failed to load</p>
        </div>
        {msg && <pre className="bg-black/30 text-red-300 text-[10px] px-3 py-2 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">{msg}</pre>}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DiscoverSection() {
  const { openDrawer } = useBookingDrawer()
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    id: 'mediwyz-map',
    libraries: LIBRARIES,
  })

  const mapRef = useRef<google.maps.Map | null>(null)
  const onMapLoad = useCallback((map: google.maps.Map) => { mapRef.current = map }, [])

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabId>('providers')
  const [mobileMapOpen, setMobileMapOpen] = useState(false)

  // ── Shared role data (fetched once, used by all tabs + map) ────────────────
  const [roles, setRoles] = useState<RoleData[]>([])

  useEffect(() => {
    fetch('/api/roles?searchEnabled=true')
      .then(r => r.json())
      .then(json => { if (json.success && Array.isArray(json.data)) setRoles(json.data as RoleData[]) })
      .catch(() => {})
  }, [])

  const roleModes = useMemo(() => roles.map(r => ({
    value: r.code,
    label: r.label,
    color: r.color ?? '#0C6780',
    emoji: r.emoji ?? ROLE_EMOJI_FALLBACK[r.code] ?? '👨‍⚕️',
  })), [roles])

  const allModes = useMemo(() => [
    { value: 'ALL', label: 'All', color: '#0C6780', emoji: '🏥' },
    ...roleModes,
    ...ENTITY_MODES,
  ], [roleModes])

  const providerTypeCodes = useMemo(() => new Set(roleModes.map(r => r.value)), [roleModes])

  // ── Map state ──────────────────────────────────────────────────────────────
  const [mapMode, setMapMode]         = useState('ALL')
  const [userPos, setUserPos]         = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating]       = useState(false)
  const [locError, setLocError]       = useState<string | null>(null)
  const [allProviders, setAllProviders] = useState<ProviderPin[]>([])
  const [allEntities, setAllEntities]   = useState<EntityPin[]>([])
  const [selected, setSelected]       = useState<AnyPin | null>(null)
  const [dirTarget, setDirTarget]     = useState<AnyPin | null>(null)
  const [directions, setDirections]   = useState<google.maps.DirectionsResult | null>(null)
  const [routeInfo, setRouteInfo]     = useState<{ distance: string; duration: string } | null>(null)

  useEffect(() => {
    fetch('/api/geo/map-data')
      .then(r => r.json())
      .then(j => {
        if (j.success) {
          setAllProviders(j.data.providers ?? [])
          setAllEntities(j.data.entities ?? [])
        }
      })
      .catch(() => {})
  }, [])

  // When tab changes, sync map mode: providers tab uses selected role, others show ALL
  const [tabRoleFilter, setTabRoleFilter] = useState('ALL')
  const [tabServiceRole, setTabServiceRole] = useState('ALL')

  useEffect(() => {
    if (activeTab === 'providers') setMapMode(tabRoleFilter)
    else setMapMode('ALL')
  }, [activeTab, tabRoleFilter])

  const locate = useCallback(() => {
    if (!navigator.geolocation) { setLocError('Geolocation not supported'); return }
    setLocating(true); setLocError(null)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserPos(p); setLocating(false)
        mapRef.current?.panTo(p); mapRef.current?.setZoom(13)
      },
      () => { setLocating(false); setLocError('Location access denied') },
      { timeout: 8000 },
    )
  }, [])

  const clearRoute = useCallback(() => { setDirections(null); setDirTarget(null); setRouteInfo(null) }, [])

  const requestRoute = useCallback((pin: AnyPin) => {
    if (!userPos) { locate(); return }
    setDirections(null); setRouteInfo(null); setDirTarget(pin); setSelected(null)
  }, [userPos, locate])

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

  const visibleProviders = useMemo(() => {
    if (mapMode === 'ALL' || providerTypeCodes.has(mapMode)) {
      return mapMode === 'ALL' ? allProviders : allProviders.filter(p => p.userType === mapMode)
    }
    return []
  }, [allProviders, mapMode, providerTypeCodes])

  const visibleEntities = useMemo(() => {
    if (mapMode === 'ALL' || ENTITY_TYPES.has(mapMode)) {
      return mapMode === 'ALL' ? allEntities : allEntities.filter(e => e.type === mapMode)
    }
    return []
  }, [allEntities, mapMode])

  const nearestSidebar = useMemo(() =>
    [...visibleProviders, ...visibleEntities]
      .map(p => ({ ...p, distanceKm: userPos ? haversineKm(userPos.lat, userPos.lng, p.latitude, p.longitude) : p.distanceKm }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 6),
    [visibleProviders, visibleEntities, userPos]
  )

  const modeColor = (type: string) => allModes.find(m => m.value === type)?.color ?? '#0C6780'
  const modeEmoji = (type: string) => allModes.find(m => m.value === type)?.emoji ?? '🏥'

  // ─── Services tab state ────────────────────────────────────────────────────
  const [services, setServices]           = useState<ServiceItem[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [servicesError, setServicesError]     = useState(false)
  const [svcSearch, setSvcSearch]             = useState('')

  useEffect(() => {
    if (activeTab !== 'services' || services.length > 0) return
    setServicesLoading(true)
    fetch('/api/search/services?limit=500')
      .then(r => r.json())
      .then(json => { if (json.success && Array.isArray(json.data)) setServices(json.data) })
      .catch(() => setServicesError(true))
      .finally(() => setServicesLoading(false))
  }, [activeTab, services.length])

  const roleMap = useMemo(() => {
    const map: Record<string, RoleData> = {}
    for (const r of roles) map[r.code] = r
    return map
  }, [roles])

  const filteredServices = useMemo(() => {
    let list = services
    if (tabServiceRole !== 'ALL') list = list.filter(s => s.providerType === tabServiceRole)
    if (svcSearch.trim()) {
      const q = svcSearch.toLowerCase()
      list = list.filter(s =>
        s.serviceName.toLowerCase().includes(q) ||
        (s.description?.toLowerCase().includes(q)) ||
        s.category.toLowerCase().includes(q)
      )
    }
    return list
  }, [services, tabServiceRole, svcSearch])

  // ─── Providers tab state ───────────────────────────────────────────────────
  const [providerGroups, setProviderGroups] = useState<{ code: string; label: string; slug: string; color: string; providers: ProviderCard[] }[]>([])
  const [gridProviders, setGridProviders]   = useState<ProviderCard[]>([])
  const [gridLoading, setGridLoading]       = useState(false)
  const [provSearch, setProvSearch]         = useState('')
  const [providersLoaded, setProvidersLoaded] = useState(false)

  useEffect(() => {
    if (activeTab !== 'providers' || providersLoaded || roles.length === 0) return
    setProvidersLoaded(true)
    const sorted = [...roles].sort((a, b) => {
      if (a.code === 'DOCTOR') return -1
      if (b.code === 'DOCTOR') return 1
      return a.label.localeCompare(b.label)
    })
    Promise.all(
      sorted.map(async (role) => {
        try {
          const res = await fetch(`/api/search/providers?type=${role.code}&limit=8`)
          const data = await res.json()
          const providers = mapProviders(data.providers || data.data || [])
          return { ...role, providers }
        } catch { return { ...role, providers: [] } }
      })
    ).then(grouped => setProviderGroups(grouped.filter(g => g.providers.length > 0)))
  }, [activeTab, providersLoaded, roles])

  const handleRoleSelect = useCallback(async (code: string) => {
    setTabRoleFilter(code)
    setProvSearch('')
    trackEvent('discover_role_filter', { role: code })
    if (code === 'ALL') { setGridProviders([]); return }
    setGridLoading(true); setGridProviders([])
    try {
      const res = await fetch(`/api/search/providers?type=${code}&limit=50`)
      const data = await res.json()
      setGridProviders(mapProviders(data.providers || data.data || []))
    } catch { setGridProviders([]) }
    finally { setGridLoading(false) }
  }, [])

  const filteredGrid = useMemo(() => {
    if (!provSearch.trim()) return gridProviders
    const q = provSearch.toLowerCase()
    return gridProviders.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      (p.specialty?.toLowerCase().includes(q))
    )
  }, [gridProviders, provSearch])

  const filteredGroups = useMemo(() => {
    if (!provSearch.trim() || tabRoleFilter !== 'ALL') return providerGroups
    const q = provSearch.toLowerCase()
    return providerGroups.map(g => ({
      ...g,
      providers: g.providers.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        (p.specialty?.toLowerCase().includes(q))
      ),
    })).filter(g => g.providers.length > 0)
  }, [providerGroups, provSearch, tabRoleFilter])

  const activeRoleInfo = roles.find(r => r.code === tabRoleFilter)

  // ─── Shop tab state ────────────────────────────────────────────────────────
  const [shopItems, setShopItems]     = useState<ShopItem[]>([])
  const [shopLoading, setShopLoading] = useState(false)
  const [shopCat, setShopCat]         = useState('ALL')
  const [shopSearch, setShopSearch]   = useState('')
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => { setAuthenticated(isLoggedIn()) }, [])

  useEffect(() => {
    if (activeTab !== 'shop') return
    setShopLoading(true)
    const url = shopCat !== 'ALL'
      ? `/api/search/health-shop?category=${shopCat}&limit=50`
      : `/api/search/health-shop?limit=50`
    fetch(url)
      .then(r => r.json())
      .then(json => {
        if (json.success && Array.isArray(json.data)) setShopItems(json.data)
      })
      .catch(() => {})
      .finally(() => setShopLoading(false))
  }, [activeTab, shopCat])

  const filteredShop = useMemo(() => {
    if (!shopSearch.trim()) return shopItems
    const q = shopSearch.toLowerCase()
    return shopItems.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
  }, [shopItems, shopSearch])

  // ─── Layout ────────────────────────────────────────────────────────────────

  return (
    <section id="discover-section" className="bg-[#001E40]">

      {/* ── Section header + tab pills ──────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-10 pt-8 sm:pt-10 pb-5">
        <div className="text-center mb-6">
          <p className="text-[#9AE1FF]/70 text-xs font-semibold uppercase tracking-widest mb-1">Discover</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Everything You Need, <span className="text-[#9AE1FF]">All In One Place</span>
          </h2>
          <p className="text-sm text-white/50 mt-1.5 max-w-lg mx-auto">
            Find services, browse qualified providers, and shop health products — with live map to locate anyone near you.
          </p>
        </div>

        {/* 3 rounded pill tabs */}
        <div className="flex justify-center">
          <div className="inline-flex bg-white/10 p-1 rounded-full gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  trackEvent('discover_tab_switch', { tab: tab.id })
                }}
                className={`flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-[#9AE1FF] text-[#001E40] shadow-lg shadow-[#9AE1FF]/20'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="text-base leading-none">{tab.emoji}</span>
                <span className="hidden xs:inline sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile: map toggle button */}
        <div className="flex justify-center mt-3 lg:hidden">
          <button
            onClick={() => setMobileMapOpen(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white/70 text-xs font-semibold hover:bg-white/20 transition-colors"
          >
            <FaMap className="text-[#9AE1FF]" />
            {mobileMapOpen ? 'Hide Map' : 'View on Map'}
          </button>
        </div>
      </div>

      {/* ── Main body: map left + content right ─────────────────────────────── */}
      <div className="flex flex-col lg:flex-row">

        {/* ── Left: Google Map ──────────────────────────────────────────────── */}
        {/* Desktop: sticky alongside scrolling content */}
        <div className={`lg:w-[38%] xl:w-[36%] bg-[#001830] ${mobileMapOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="lg:sticky lg:top-0 lg:h-screen flex flex-col">

            {/* Map header */}
            <div className="px-4 pt-4 pb-3 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-white">
                    {activeTab === 'providers' && tabRoleFilter !== 'ALL'
                      ? `${allModes.find(m => m.value === tabRoleFilter)?.emoji ?? '👨‍⚕️'} ${activeRoleInfo?.label ?? ''} near you`
                      : 'Find nearby healthcare'}
                  </p>
                  <p className="text-[10px] text-white/40 mt-0.5">Tap a pin for directions</p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={locate}
                    disabled={locating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0C6780] text-white text-xs font-semibold hover:bg-[#0a5568] disabled:opacity-60 transition-colors"
                  >
                    {locating ? <FaSpinner className="animate-spin text-[10px]" /> : <FaCrosshairs className="text-[10px]" />}
                    {userPos ? 'Update' : 'Near Me'}
                  </button>
                </div>
              </div>
              {locError && <p className="text-[10px] text-red-400 mt-1.5">{locError}</p>}

              {/* Map mode chips (only in providers tab) */}
              {activeTab === 'providers' && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {[{ value: 'ALL', label: 'All', color: '#0C6780', emoji: '🏥' }, ...roleModes.slice(0, 6)].map(m => (
                    <button
                      key={m.value}
                      onClick={() => setTabRoleFilter(m.value)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${
                        mapMode === m.value
                          ? 'text-white border-transparent'
                          : 'text-white/60 border-white/20 hover:border-white/40 hover:text-white'
                      }`}
                      style={mapMode === m.value ? { backgroundColor: m.color } : {}}
                    >
                      {m.emoji} {m.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Route info banner */}
            {routeInfo && (
              <div className="mx-3 my-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0C6780]/20 border border-[#0C6780]/40 flex-shrink-0">
                <FaRoute className="text-[#9AE1FF] flex-shrink-0 text-xs" />
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-white">{routeInfo.distance} · {routeInfo.duration}</p>
                </div>
                <button onClick={clearRoute} className="text-white/40 hover:text-white p-0.5">
                  <FaTimes className="text-[9px]" />
                </button>
              </div>
            )}

            {/* Map */}
            <div className="flex-1 relative" style={{ minHeight: 300 }}>
              {(!apiKey || loadError) && <MapErrorPanel error={loadError ?? null} apiKey={apiKey} />}
              {!isLoaded && !loadError && apiKey && (
                <div className="absolute inset-0 bg-[#0a2a46] flex items-center justify-center z-10">
                  <FaSpinner className="text-[#9AE1FF] text-2xl animate-spin" />
                </div>
              )}
              {isLoaded && !loadError && (
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%', minHeight: 300 }}
                  center={userPos ?? MAURITIUS_CENTER}
                  zoom={userPos ? 12 : 10}
                  onLoad={onMapLoad}
                  options={{
                    styles: MAP_STYLES,
                    disableDefaultUI: false,
                    zoomControl: true,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                    backgroundColor: '#001E40',
                  }}
                >
                  {visibleProviders.map(p => (
                    <Marker key={p.id} position={{ lat: p.latitude, lng: p.longitude }}
                      icon={makeMarkerIcon(modeColor(p.userType))} onClick={() => setSelected(p)} />
                  ))}
                  {visibleEntities.map(e => (
                    <Marker key={e.id} position={{ lat: e.latitude, lng: e.longitude }}
                      icon={makeEntityMarkerIcon('#DC2626')} onClick={() => setSelected(e)} />
                  ))}
                  {userPos && (
                    <Marker position={userPos} zIndex={999} icon={{
                      url: svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#9AE1FF" stroke="white" stroke-width="3"/><circle cx="12" cy="12" r="4" fill="white"/></svg>`),
                      scaledSize: new window.google.maps.Size(24, 24),
                      anchor: new window.google.maps.Point(12, 12),
                    }} />
                  )}
                  {selected && (
                    <InfoWindow position={{ lat: selected.latitude, lng: selected.longitude }} onCloseClick={() => setSelected(null)}>
                      <div className="min-w-[180px] text-sm p-1">
                        {'firstName' in selected ? (
                          <>
                            <p className="font-bold text-gray-900">{selected.firstName} {selected.lastName}</p>
                            <p className="text-xs text-gray-500 capitalize">{selected.userType.toLowerCase().replace(/_/g, ' ')}</p>
                            {selected.specialty?.length > 0 && <p className="text-xs text-[#0C6780] mt-0.5">{selected.specialty.slice(0, 2).join(', ')}</p>}
                            {selected.address && <p className="text-xs text-gray-400 mt-0.5">{selected.address}</p>}
                            {selected.distanceKm > 0 && <p className="text-xs font-semibold text-[#001E40] mt-1">{selected.distanceKm.toFixed(1)} km away</p>}
                            <div className="flex gap-1.5 mt-2">
                              <Link href={`/profile/${selected.id}`} className="flex-1 text-xs text-center py-1 px-2 bg-[#001E40] text-white rounded-lg">Profile →</Link>
                              {userPos && (
                                <button onClick={() => requestRoute(selected)} className="flex-1 text-xs py-1 px-2 bg-[#0C6780] text-white rounded-lg flex items-center justify-center gap-1">
                                  <FaRoute className="text-[9px]" /> Route
                                </button>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="font-bold text-gray-900">{'name' in selected ? selected.name : ''}</p>
                            <p className="text-xs text-gray-500 capitalize">{'type' in selected ? selected.type : ''}</p>
                            {'address' in selected && selected.address && <p className="text-xs text-gray-400 mt-0.5">{selected.address}</p>}
                            {'city' in selected && selected.city && <p className="text-xs text-gray-400">{selected.city}</p>}
                            {selected.distanceKm > 0 && <p className="text-xs font-semibold text-[#001E40] mt-1">{selected.distanceKm.toFixed(1)} km away</p>}
                            {userPos && (
                              <button onClick={() => requestRoute(selected)} className="mt-2 w-full text-xs py-1 px-2 bg-[#0C6780] text-white rounded-lg flex items-center justify-center gap-1">
                                <FaRoute className="text-[9px]" /> Directions
                              </button>
                            )}
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
                    <DirectionsRenderer options={{ directions, suppressMarkers: true, polylineOptions: { strokeColor: '#9AE1FF', strokeOpacity: 0.85, strokeWeight: 5 } }} />
                  )}
                </GoogleMap>
              )}
            </div>

            {/* Nearest sidebar — compact list */}
            <div className="flex-shrink-0 border-t border-white/10 max-h-48 overflow-y-auto">
              {nearestSidebar.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <FaClinicMedical className="text-white/20 text-2xl mx-auto mb-2" />
                  <p className="text-[10px] text-white/40">No results for this filter</p>
                </div>
              ) : nearestSidebar.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-2.5 px-3 py-2.5 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelected(item)
                    mapRef.current?.panTo({ lat: item.latitude, lng: item.longitude })
                    mapRef.current?.setZoom(15)
                  }}
                >
                  <div className="w-8 h-8 rounded-lg flex-shrink-0 bg-white/10 flex items-center justify-center text-sm">
                    {'firstName' in item && item.profileImage
                      ? <Image src={item.profileImage} alt="" width={32} height={32} className="w-full h-full object-cover rounded-lg" />
                      : <span>{modeEmoji('type' in item ? item.type : item.userType)}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-white truncate">
                      {'firstName' in item ? `${item.firstName} ${item.lastName}` : ('name' in item ? item.name : '')}
                    </p>
                    <p className="text-[9px] text-white/40 truncate capitalize">
                      {'userType' in item ? item.userType.replace(/_/g, ' ').toLowerCase() : ('type' in item ? item.type : '')}
                      {'specialty' in item && item.specialty?.length > 0 ? ` · ${item.specialty[0]}` : ''}
                    </p>
                  </div>
                  {userPos && item.distanceKm > 0 && (
                    <span className="text-[9px] text-[#9AE1FF] font-semibold flex-shrink-0">
                      {item.distanceKm < 1 ? `${Math.round(item.distanceKm * 1000)}m` : `${item.distanceKm.toFixed(1)}km`}
                    </span>
                  )}
                  <FaChevronRight className="text-white/20 text-[9px] flex-shrink-0" />
                </div>
              ))}
              <div className="px-3 py-2 text-center">
                <Link href="/search/providers" className="text-[10px] font-semibold text-[#9AE1FF] hover:text-white transition-colors">
                  Browse all providers →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Tab content ──────────────────────────────────────────────── */}
        <div className="flex-1 bg-white overflow-hidden">

          {/* ── Providers tab ──────────────────────────────────────────────── */}
          {activeTab === 'providers' && (
            <div className="py-6 sm:py-8 overflow-hidden">
              <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">

                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <FaUserMd className="text-[#0C6780] text-lg" />
                      Browse Providers
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">Find qualified healthcare professionals near you</p>
                  </div>
                  {tabRoleFilter !== 'ALL' && activeRoleInfo && (
                    <Link href={`/search/${activeRoleInfo.slug}`}
                      className="hidden sm:flex items-center gap-1 text-sm font-medium text-[#0C6780] hover:text-[#001E40] whitespace-nowrap">
                      See All <FaArrowRight className="text-xs" />
                    </Link>
                  )}
                </div>

                {/* Search + role chips */}
                <div className="flex flex-col sm:flex-row gap-2 mb-5">
                  <div className="relative flex-shrink-0 sm:w-56">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input type="text" placeholder="Name or specialty…" value={provSearch}
                      onChange={e => setProvSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780]" />
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden">
                    <button
                      onClick={() => handleRoleSelect('ALL')}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border
                        ${tabRoleFilter === 'ALL' ? 'bg-[#0C6780] text-white border-[#0C6780]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#0C6780] hover:text-[#0C6780]'}`}
                    >All</button>
                    {roles.map(role => (
                      <button key={role.code}
                        onClick={() => handleRoleSelect(role.code)}
                        style={tabRoleFilter === role.code ? { backgroundColor: role.color, borderColor: role.color } : {}}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border
                          ${tabRoleFilter === role.code ? 'text-white' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-800'}`}
                      >
                        {ROLE_EMOJI_FALLBACK[role.code] ?? ''} {role.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content */}
                {tabRoleFilter === 'ALL' ? (
                  filteredGroups.length === 0 ? (
                    <div className="text-center py-12">
                      <FaUserMd className="text-4xl text-gray-200 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No providers match your search.</p>
                      <button onClick={() => setProvSearch('')} className="mt-2 text-xs text-[#0C6780] hover:underline">Clear</button>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {filteredGroups.map(group => (
                        <div key={group.code}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{ROLE_EMOJI_FALLBACK[group.code] ?? '👨‍⚕️'}</span>
                              <h4 className="text-sm font-bold text-gray-900">{group.label}</h4>
                              <span className="text-xs text-gray-400">({group.providers.length})</span>
                            </div>
                            <Link href={`/search/${group.slug}`} className="text-xs font-medium text-[#0C6780] hover:text-[#001E40] flex items-center gap-0.5">
                              See All <FaArrowRight className="text-[9px]" />
                            </Link>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {group.providers.slice(0, 4).map(provider => (
                              <ProviderCardItem key={provider.id} provider={provider} color={group.color} slug={group.slug}
                                onBook={() => openDrawer({ provider: { id: provider.id, name: `${provider.firstName} ${provider.lastName}`, userType: provider.userType, profileImage: provider.profileImage, rating: provider.rating ?? undefined, specializations: provider.specialty ? [provider.specialty as string] : [] } })} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : gridLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                    {Array.from({ length: 8 }).map((_, i) => <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-48" />)}
                  </div>
                ) : filteredGrid.length === 0 ? (
                  <div className="text-center py-12">
                    <FaUserMd className="text-4xl text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">{provSearch ? 'No match.' : 'No providers in this category.'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filteredGrid.map(provider => {
                      const role = roles.find(r => r.code === provider.userType)
                      return (
                        <ProviderCardItem key={provider.id} provider={provider}
                          color={role?.color ?? '#0C6780'} slug={role?.slug ?? provider.userType.toLowerCase()}
                          onBook={() => openDrawer({ provider: { id: provider.id, name: `${provider.firstName} ${provider.lastName}`, userType: provider.userType, profileImage: provider.profileImage, rating: provider.rating ?? undefined, specializations: provider.specialty ? [provider.specialty as string] : [] } })} />
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Services tab ───────────────────────────────────────────────── */}
          {activeTab === 'services' && (
            <div className="py-6 sm:py-8 overflow-hidden">
              <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">

                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <FaConciergeBell className="text-[#0C6780] text-lg" />
                      Find Services
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">Browse what every provider type offers</p>
                  </div>
                  <Link href="/search/services" className="hidden sm:flex items-center gap-1 text-sm font-medium text-[#0C6780] hover:text-[#001E40] whitespace-nowrap">
                    See All <FaArrowRight className="text-xs" />
                  </Link>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mb-5">
                  <div className="relative flex-shrink-0 sm:w-56">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input type="text" placeholder="Search services…" value={svcSearch}
                      onChange={e => setSvcSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780]" />
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden">
                    <button onClick={() => setTabServiceRole('ALL')}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border
                        ${tabServiceRole === 'ALL' ? 'bg-[#0C6780] text-white border-[#0C6780]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#0C6780] hover:text-[#0C6780]'}`}
                    >All</button>
                    {roles.map(role => (
                      <button key={role.code} onClick={() => setTabServiceRole(role.code)}
                        style={tabServiceRole === role.code ? { backgroundColor: role.color, borderColor: role.color } : {}}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border
                          ${tabServiceRole === role.code ? 'text-white' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-800'}`}
                      >
                        {role.label}
                      </button>
                    ))}
                  </div>
                </div>

                {servicesLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                    {Array.from({ length: 12 }).map((_, i) => <div key={i} className="animate-pulse"><div className="h-32 bg-gray-100 rounded-2xl mb-2" /><div className="h-3 bg-gray-100 rounded w-3/4 mb-1.5" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div>)}
                  </div>
                ) : servicesError || filteredServices.length === 0 ? (
                  <div className="text-center py-12">
                    <FaConciergeBell className="text-4xl text-gray-200 mx-auto mb-3" />
                    {servicesError
                      ? <p className="text-sm text-gray-500">Could not load services — ensure the backend is running.</p>
                      : <><p className="text-sm text-gray-500">No services match your search.</p>
                        <button onClick={() => { setSvcSearch(''); setTabServiceRole('ALL') }} className="mt-2 text-xs text-[#0C6780] hover:underline">Clear filters</button></>
                    }
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filteredServices.map(svc => {
                      const role = roleMap[svc.providerType]
                      return (
                        <ServiceCardItem key={svc.id} service={svc}
                          color={role?.color ?? '#0C6780'}
                          roleLabel={role?.label ?? svc.providerType}
                          onBook={() => openDrawer({ service: { id: svc.id, serviceName: svc.serviceName, category: svc.category, description: svc.description ?? undefined, defaultPrice: svc.defaultPrice, duration: svc.duration ?? undefined, providerType: svc.providerType, iconKey: svc.iconKey, emoji: svc.emoji } })}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Health Shop tab ────────────────────────────────────────────── */}
          {activeTab === 'shop' && (
            <div className="py-6 sm:py-8 overflow-hidden">
              <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">

                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <FaShoppingBag className="text-[#0C6780] text-lg" />
                      Health Shop
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">Medicines, vitamins, devices &amp; more — from verified providers</p>
                  </div>
                  <Link href="/search/health-shop" className="hidden sm:flex items-center gap-1 text-sm font-medium text-[#0C6780] hover:text-[#001E40] whitespace-nowrap">
                    See All <FaArrowRight className="text-xs" />
                  </Link>
                </div>

                {/* Category chips */}
                <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 [&::-webkit-scrollbar]:hidden">
                  {SHOP_CATEGORIES.map(cat => (
                    <button key={cat.key} onClick={() => setShopCat(cat.key)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border whitespace-nowrap
                        ${shopCat === cat.key ? 'bg-[#0C6780] text-white border-[#0C6780]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#0C6780] hover:text-[#0C6780]'}`}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative mb-5 sm:w-56">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input type="text" placeholder="Search products…" value={shopSearch}
                    onChange={e => setShopSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780]" />
                </div>

                {shopLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                    {Array.from({ length: 8 }).map((_, i) => <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-44" />)}
                  </div>
                ) : filteredShop.length === 0 ? (
                  <div className="text-center py-12">
                    <FaShoppingBag className="text-4xl text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No products in this category.</p>
                    <Link href="/search/health-shop" className="mt-2 inline-block text-xs text-[#0C6780] hover:underline">Browse full shop</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filteredShop.map(item => (
                      <ShopItemCard key={item.id} item={item} authenticated={authenticated} />
                    ))}
                  </div>
                )}

                <div className="text-center mt-6">
                  <Link href="/search/health-shop"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0C6780] text-white rounded-xl text-sm font-medium hover:bg-[#0a5568] transition-colors">
                    Browse Full Health Shop <FaArrowRight className="text-xs" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function mapProviders(raw: unknown[]): ProviderCard[] {
  return (raw as Record<string, unknown>[]).map(p => ({
    id: p.id as string,
    firstName: p.firstName as string,
    lastName: p.lastName as string,
    profileImage: (p.profileImage as string | null) ?? null,
    userType: p.userType as string,
    specialty: (p.specialty || ((p.doctorProfile as Record<string, unknown[]> | undefined)?.specialty)?.[0] || ((p.nurseProfile as Record<string, unknown[]> | undefined)?.specializations)?.[0] || null) as string | null,
    rating: (p.rating || (p.doctorProfile as Record<string, unknown>)?.rating || null) as number | null,
    reviewCount: (p.reviewCount || (p.doctorProfile as Record<string, unknown>)?.reviewCount || null) as number | null,
    verified: p.verified as boolean,
  }))
}

function ProviderCardItem({ provider, color, slug, onBook }: { provider: ProviderCard; color: string; slug: string; onBook: () => void }) {
  const bgLight  = hex2rgba(color, 0.10)
  const bgMedium = hex2rgba(color, 0.20)
  const avatarUrl = avatarSrc(provider.profileImage, provider.firstName, provider.lastName)

  return (
    <button onClick={() => {
      trackEvent('discover_provider_book', { providerId: provider.id, userType: provider.userType })
      onBook()
    }}
      className="group flex flex-col bg-white rounded-2xl border border-gray-100 text-left w-full hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-pointer">
      <div className="relative w-full h-24 sm:h-28 flex-shrink-0 flex items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${bgMedium} 0%, ${bgLight} 100%)` }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
          <img src={avatarUrl} alt="" className="w-full h-full object-cover object-top scale-150 blur-2xl opacity-40" />
        </div>
        <div className="relative group-hover:scale-105 transition-transform duration-300">
          <img src={avatarUrl} alt={`${provider.firstName} ${provider.lastName}`}
            className="w-14 h-14 sm:h-16 sm:w-16 rounded-full object-cover object-top border-2 border-white shadow-lg" />
          {provider.verified && <FaCheckCircle className="absolute -bottom-0.5 -right-0.5 text-blue-500 text-xs bg-white rounded-full" />}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: color }} />
      </div>
      <div className="p-2.5 flex-1 flex flex-col">
        <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug line-clamp-1 mb-0.5">{provider.firstName} {provider.lastName}</h4>
        {provider.specialty && <p className="text-[10px] text-gray-400 line-clamp-1">{Array.isArray(provider.specialty) ? provider.specialty[0] : provider.specialty}</p>}
      </div>
      <div className="px-2.5 pb-2.5 pt-1.5 border-t border-gray-100 flex items-center justify-between gap-1">
        {provider.rating && provider.rating > 0 ? (
          <div className="flex items-center gap-0.5 text-[10px] text-amber-500 font-medium">
            <FaStar className="text-[9px]" />{Number(provider.rating).toFixed(1)}
            {provider.reviewCount && <span className="text-gray-400 ml-0.5">({provider.reviewCount})</span>}
          </div>
        ) : <span />}
        <span className="text-[10px] font-semibold flex items-center gap-0.5" style={{ color }}>
          Book <FaArrowRight className="text-[8px]" />
        </span>
      </div>
    </button>
  )
}

function ServiceCardItem({ service, color, roleLabel, onBook }: { service: ServiceItem; color: string; roleLabel: string; onBook: () => void }) {
  const bgLight  = hex2rgba(color, 0.10)
  const bgMedium = hex2rgba(color, 0.20)

  return (
    <button onClick={() => {
      trackEvent('discover_service_book', { serviceId: service.id, category: service.category, providerType: service.providerType })
      onBook()
    }}
      className="group flex flex-col bg-white rounded-2xl border border-gray-100 text-left w-full hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-pointer">
      <div className="relative w-full h-24 sm:h-28 flex-shrink-0 flex items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${bgMedium} 0%, ${bgLight} 100%)` }}>
        <span className="relative group-hover:scale-110 transition-transform duration-300 text-5xl leading-none select-none">
          {service.emoji ?? service.imageUrl ? (service.emoji ?? '🩺') : '🩺'}
        </span>
        <div className="absolute bottom-1.5 left-2 z-10">
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(0,0,0,0.35)', color: '#fff', backdropFilter: 'blur(4px)' }}>
            {roleLabel}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: color }} />
      </div>
      <div className="p-2.5 flex-1 flex flex-col">
        <h4 className="text-xs sm:text-sm font-bold leading-snug line-clamp-2 mb-1" style={{ color }}>{service.serviceName}</h4>
        {service.description && <p className="text-[10px] text-gray-400 line-clamp-2 flex-1">{service.description}</p>}
      </div>
      <div className="px-2.5 pb-2.5 pt-1.5 border-t border-gray-100 flex items-center justify-between gap-1">
        <span className="text-xs font-bold text-gray-900">Rs {service.defaultPrice.toLocaleString()}</span>
        {service.duration && (
          <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
            <FaClock className="text-[9px]" />{service.duration}m
          </span>
        )}
      </div>
    </button>
  )
}

function ShopItemCard({ item, authenticated }: { item: ShopItem; authenticated: boolean }) {
  return (
    <Link
      href={authenticated ? `/search/health-shop/${item.id}` : '/login'}
      onClick={() => trackEvent('discover_shop_item_tap', { itemId: item.id, category: item.category, authenticated })}
      className="group flex flex-col bg-white rounded-2xl border border-gray-100 text-left w-full hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div className="relative w-full h-24 sm:h-28 bg-gradient-to-br from-teal-50 to-sky-50 flex items-center justify-center overflow-hidden">
        {item.imageUrl
          ? <img src={item.imageUrl} alt={item.name} className="h-full w-full object-contain p-3 group-hover:scale-105 transition-transform duration-300" />
          : <span className="text-5xl leading-none group-hover:scale-110 transition-transform duration-300">💊</span>
        }
        {item.requiresPrescription && (
          <div className="absolute top-1.5 right-1.5 bg-amber-400/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <FaLock className="text-[7px]" /> Rx
          </div>
        )}
        {!item.inStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded-full border border-gray-200">Out of Stock</span>
          </div>
        )}
      </div>
      <div className="p-2.5 flex-1 flex flex-col">
        <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug line-clamp-2 mb-0.5">{item.name}</h4>
        {item.strength && <p className="text-[10px] text-gray-400">{item.strength}</p>}
      </div>
      <div className="px-2.5 pb-2.5 pt-1.5 border-t border-gray-100 flex items-center justify-between gap-1">
        <span className="text-xs font-bold text-gray-900">Rs {item.price.toLocaleString()}</span>
        <span className="text-[10px] font-semibold text-[#0C6780] flex items-center gap-0.5 group-hover:gap-1 transition-all">
          {authenticated ? 'Order' : 'Sign in'} <FaArrowRight className="text-[8px]" />
        </span>
      </div>
    </Link>
  )
}
