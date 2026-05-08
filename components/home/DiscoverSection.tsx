'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'

type Choice = 'services' | 'providers' | 'community' | 'health-shop' | 'organizations'

function SectionSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-40" />
        ))}
      </div>
    </div>
  )
}

function MapSkeleton() {
  return (
    <div className="h-full bg-[#001E40] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#9AE1FF] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

const ServicesSection = dynamic(() => import('./ServicesSection'), { ssr: false, loading: () => <SectionSkeleton /> })
const ProvidersSection = dynamic(() => import('./ProvidersSection'), { ssr: false, loading: () => <SectionSkeleton /> })
const CommunityPosts = dynamic(() => import('./CommunityPosts'), { ssr: false, loading: () => <SectionSkeleton /> })
const HealthShopMarketplace = dynamic(() => import('./HealthShopMarketplace'), { ssr: false, loading: () => <SectionSkeleton /> })
const OrganizationsSection = dynamic(() => import('./OrganizationsSection'), { ssr: false, loading: () => <SectionSkeleton /> })
const MapPanel = dynamic(() => import('./MapPanel'), { ssr: false, loading: () => <MapSkeleton /> })

interface ChoiceDef {
  id: Choice
  emoji: string
  title: string
  color: string
}

const CHOICES: ChoiceDef[] = [
  { id: 'services',      emoji: '🩺', title: 'Book a Service',  color: '#0C6780' },
  { id: 'providers',     emoji: '👨‍⚕️', title: 'Find a Provider', color: '#001E40' },
  { id: 'organizations', emoji: '🏥', title: 'Organizations',    color: '#C53030' },
  { id: 'community',     emoji: '💬', title: 'Community',        color: '#0a5c73' },
  { id: 'health-shop',   emoji: '🛒', title: 'Health Shop',      color: '#1a6b8a' },
]

// Tabs that show the map panel alongside their content
const MAP_TABS = new Set<Choice>(['providers', 'organizations'])

export default function DiscoverSection() {
  const [selected, setSelected] = useState<Choice>('services')
  const [mapMode, setMapMode] = useState<string | undefined>(undefined)
  const activeColor = CHOICES.find(c => c.id === selected)?.color ?? '#0C6780'
  const showMap = MAP_TABS.has(selected)

  // Reset map mode filter when the user switches main tabs
  useEffect(() => { setMapMode(undefined) }, [selected])

  // Allow HeroSection feature pills to switch tabs via custom event
  useEffect(() => {
    const handler = (e: Event) => {
      const tab = (e as CustomEvent<string>).detail
      if (CHOICES.some(c => c.id === tab)) {
        setSelected(tab as Choice)
        document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    window.addEventListener('discover-tab', handler)
    return () => window.removeEventListener('discover-tab', handler)
  }, [])

  // Sync MapPanel with role filter selected in ProvidersSection
  useEffect(() => {
    const handler = (e: Event) => setMapMode((e as CustomEvent<string>).detail)
    window.addEventListener('discover-map-mode', handler)
    return () => window.removeEventListener('discover-map-mode', handler)
  }, [])

  return (
    <div id="discover" className="bg-white">
      {/* Question + tab strip */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black text-white flex-shrink-0"
            style={{ backgroundColor: activeColor }}
          >
            ?
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#001E40]">
            What are you looking for today?
          </h2>
        </div>

        {/* Tab strip
            Mobile: emoji only (equal-width square buttons, no truncation)
            sm+: emoji + full label */}
        <div className="flex gap-1.5 w-full">
          {CHOICES.map(c => {
            const active = selected === c.id
            return (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                title={c.title}
                aria-label={c.title}
                className={`flex-1 min-w-0 flex items-center justify-center gap-1.5
                  px-1 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold
                  transition-all duration-200 border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C6780]
                  ${active
                    ? 'text-white shadow-md scale-[1.02]'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                  }`}
                style={active ? { backgroundColor: c.color, borderColor: c.color } : {}}
              >
                <span className="text-base leading-none flex-shrink-0" aria-hidden="true">{c.emoji}</span>
                <span className="hidden sm:inline truncate">{c.title}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100" />

      {/* Content area */}
      {showMap ? (
        /* Split layout: content left + map right (always visible on desktop, stacked on mobile) */
        <div className="flex flex-col lg:flex-row">
          {/* Left: section content — normal page flow so ProvidersSection sticky header works */}
          <div className="flex-1 min-w-0 overflow-hidden">
            {selected === 'providers'     && <ProvidersSection />}
            {selected === 'organizations' && <OrganizationsSection />}
          </div>

          {/* Right: sticky map panel (desktop) */}
          <div className="hidden lg:block w-[380px] xl:w-[420px] flex-shrink-0 border-l border-gray-100">
            <div className="sticky top-0 h-screen">
              <MapPanel externalMode={mapMode} />
            </div>
          </div>

          {/* Map below content on mobile */}
          <div className="lg:hidden border-t border-gray-100" style={{ height: 340 }}>
            <MapPanel externalMode={mapMode} />
          </div>
        </div>
      ) : (
        <div key={selected}>
          {selected === 'services'    && <ServicesSection />}
          {selected === 'community'   && <CommunityPosts />}
          {selected === 'health-shop' && <HealthShopMarketplace />}
        </div>
      )}
    </div>
  )
}
