'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FaShieldAlt, FaBuilding, FaArrowRight, FaHospital } from 'react-icons/fa'

//  Types 

interface TrustItem {
  id: string
  name: string
  logoUrl?: string
  badge: string
  href: string
}

interface Company {
  id: string
  companyName: string
  industry: string | null
  isInsuranceCompany: boolean
}

interface OrgEntity {
  id: string
  name: string
  type: string
  logoUrl: string | null
}

//  Helpers 

function itemColor(name: string): string {
  const COLORS = [
    '#0C6780', '#001E40', '#0a5c73', '#1a6b8a',
    '#0e4a6b', '#2d7d8f', '#1e5f74', '#0f3460',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

function initials(name: string): string {
  return name.split(/\s+/).map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2)
}

function companiestoItems(companies: Company[]): TrustItem[] {
  return companies.map(c => ({
    id: `corp-${c.id}`,
    name: c.companyName,
    badge: c.isInsuranceCompany ? 'Insurance' : (c.industry ?? 'Corporate'),
    href: '/search/company',
  }))
}

function orgsToItems(orgs: OrgEntity[]): TrustItem[] {
  return orgs.map(org => ({
    id: `org-${org.id}`,
    name: org.name,
    logoUrl: org.logoUrl ?? undefined,
    badge: org.type ?? 'Organization',
    href: `/search/organizations/${org.id}`,
  }))
}

//  Static fallback 

const FALLBACK: TrustItem[] = [
  { id: 'f1', name: 'Flamingo Health Co', badge: 'Insurance', href: '/search/company' },
  { id: 'f2', name: 'Coconut Tree Holdings', badge: 'Corporate', href: '/search/company' },
  { id: 'f3', name: 'Flamingo Assurance Ltd', badge: 'Insurance', href: '/search/company' },
  { id: 'f4', name: 'Bonsai Medical Centre', badge: 'Clinic', href: '/search/organizations' },
  { id: 'f5', name: 'CloudNine Insurance', badge: 'Insurance', href: '/search/company' },
  { id: 'f6', name: 'Sunset Bay Medical', badge: 'Hospital', href: '/search/organizations' },
]

//  Badge icon 

function BadgeIcon({ badge }: { badge: string }) {
  const lower = badge.toLowerCase()
  if (lower === 'insurance') return <FaShieldAlt className="text-[8px]" />
  if (lower === 'clinic' || lower === 'hospital' || lower === 'medical') return <FaHospital className="text-[8px]" />
  return <FaBuilding className="text-[8px]" />
}

//  Component 

export default function CompanyTrustBar() {
  const [items, setItems] = useState<TrustItem[]>(FALLBACK)

  useEffect(() => {
    async function load() {
      try {
        const [corpRes, orgRes] = await Promise.allSettled([
          fetch('/api/corporate/companies?type=all').then(r => r.json()),
          fetch('/api/search/organizations?limit=20').then(r => r.json()),
        ])

        const corpItems =
          corpRes.status === 'fulfilled' && corpRes.value.success && Array.isArray(corpRes.value.data)
            ? companiestoItems(corpRes.value.data as Company[])
            : []

        const orgItems =
          orgRes.status === 'fulfilled' && orgRes.value.success && Array.isArray(orgRes.value.data)
            ? orgsToItems(orgRes.value.data as OrgEntity[])
            : []

        const merged = [...corpItems, ...orgItems]
        if (merged.length > 0) setItems(merged)
      } catch { /* keep fallback */ }
    }
    load()
  }, [])

  // Triplicate for seamless marquee loop
  const track = [...items, ...items, ...items]

  return (
    <div className="bg-gradient-to-r from-[#001E40] via-[#0C6780] to-[#001E40] py-4 sm:py-5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-3">
        <div className="flex items-center justify-between">
          <p className="text-white/70 text-xs sm:text-sm font-medium tracking-wide uppercase">
            Trusted by companies &amp; organizations across the region
          </p>
          <Link
            href="/search/company"
            className="flex items-center gap-1 text-xs text-[#9AE1FF] hover:text-white transition-colors font-medium"
          >
            Explore <FaArrowRight className="text-[9px]" />
          </Link>
        </div>
      </div>

      {/* Marquee track */}
      <div className="relative">
        {/* Fade masks */}
        <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, #001E40, transparent)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, #001E40, transparent)' }} />

        <div
          className="flex gap-4 px-4"
          style={{ animation: 'marquee 32s linear infinite', width: 'max-content' }}
        >
          {track.map((item, idx) => {
            const color = itemColor(item.name)
            const inits = initials(item.name)
            const isClinic = item.id.startsWith('org-') || item.id.startsWith('f4') || item.id.startsWith('f6')

            return (
              <Link
                key={`${item.id}-${idx}`}
                href={item.href}
                className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm
                  border border-white/15 rounded-xl px-4 py-2.5 flex-shrink-0 transition-colors group"
              >
                {/* Logo or initials */}
                <div
                  className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: item.logoUrl ? 'transparent' : color }}
                >
                  {item.logoUrl ? (
                    <Image
                      src={item.logoUrl}
                      alt={item.name}
                      width={32}
                      height={32}
                      unoptimized
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    inits
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-white text-xs sm:text-sm font-semibold whitespace-nowrap leading-tight">
                    {item.name}
                  </p>
                  <p className="text-white/50 text-[10px] whitespace-nowrap flex items-center gap-1">
                    <BadgeIcon badge={item.badge} />
                    {item.badge}
                    {isClinic && <span className="ml-0.5"></span>}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Keyframe */}
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(calc(-100% / 3)); }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track { animation: none !important; }
        }
      `}</style>
    </div>
  )
}
