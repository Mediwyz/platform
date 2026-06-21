'use client'

/**
 * ProviderMarquee - an auto-scrolling horizontal band of provider categories,
 * loaded dynamically from /api/roles (the same roles the regional admin manages
 * via CRUD). Each card uses the admin-uploaded illustrative image (cardImage)
 * with a realistic bundled fallback per role code. Pauses on hover.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Role { code: string; label: string; slug: string; color: string; cardImage?: string | null }

// Realistic default illustration per provider-type code (under /public/images/landing/roles).
const ROLE_IMG: Record<string, string> = {
  DOCTOR: 'doctor', NURSE: 'nurse', NANNY: 'nanny', PHARMACIST: 'pharmacist',
  LAB_TECHNICIAN: 'lab', EMERGENCY_WORKER: 'emergency', CAREGIVER: 'caregiver',
  PHYSIOTHERAPIST: 'physiotherapist', DENTIST: 'dentist', OPTOMETRIST: 'optometrist',
  NUTRITIONIST: 'nutritionist',
}
const imgFor = (r: Role) =>
  r.cardImage && r.cardImage.trim() ? r.cardImage : `/images/landing/roles/${ROLE_IMG[r.code] || 'generic'}.jpg`

export default function ProviderMarquee() {
  const [roles, setRoles] = useState<Role[]>([])

  useEffect(() => {
    fetch('/api/roles?searchEnabled=true')
      .then(r => r.json())
      .then(j => { if (j?.success && Array.isArray(j.data)) setRoles(j.data.filter((r: Role) => r.slug)) })
      .catch(() => { /* leave empty - section hides itself */ })
  }, [])

  if (roles.length === 0) return null
  const loop = [...roles, ...roles] // duplicate for a seamless -50% loop

  return (
    <section className="bg-white border-b border-gray-100 py-14 sm:py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-9 text-center">
        <span className="inline-block text-sm font-semibold tracking-wider uppercase text-[#0C6780] mb-2">
          Browse by provider
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#001E40]">
          Care for every need
        </h2>
        <p className="mt-2 text-sm sm:text-base text-gray-500 max-w-xl mx-auto">
          From doctors and nurses to pharmacies, labs and emergency response - explore every type of provider on MediWyz.
        </p>
      </div>

      <div className="mw-marquee relative w-full">
        <div aria-hidden className="pointer-events-none absolute left-0 top-0 h-full w-16 sm:w-24 z-10 bg-gradient-to-r from-white to-transparent" />
        <div aria-hidden className="pointer-events-none absolute right-0 top-0 h-full w-16 sm:w-24 z-10 bg-gradient-to-l from-white to-transparent" />

        <div className="mw-marquee-track flex gap-4 px-4">
          {loop.map((r, i) => (
            <Link
              key={`${r.code}-${i}`}
              href={`/search/${r.slug}`}
              aria-label={r.label}
              className="group relative shrink-0 w-52 sm:w-60 h-40 sm:h-44 rounded-2xl overflow-hidden shadow-md ring-1 ring-black/5
                flex flex-col justify-end p-4 text-white transition-transform duration-200 hover:-translate-y-1
                focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0C6780]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgFor(r)}
                alt=""
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#001E40] via-[#001E40]/45 to-transparent" />
              <span aria-hidden className="absolute left-0 top-0 h-full w-1" style={{ background: r.color || '#0C6780' }} />
              <span className="relative text-base sm:text-lg font-bold drop-shadow-sm">{r.label}</span>
              <span className="relative text-xs text-brand-sky font-semibold mt-0.5">Explore &rarr;</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
