'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import * as FaIcons from 'react-icons/fa'
import { FaUserMd, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import HorizontalScrollRow from '@/components/shared/HorizontalScrollRow'

interface ProviderSpecialty {
  name: string
  description: string | null
  icon: string | null
}

interface ProviderRole {
  code: string
  label: string
  singularLabel: string
  slug: string
  icon: string
  color: string
  description: string | null
  providerCount: number
  specialties: ProviderSpecialty[]
}

function resolveIcon(iconName: string) {
  return (FaIcons as Record<string, React.ComponentType<{ className?: string }>>)[iconName] || FaUserMd
}

// Comprehensive emoji map for medical specialties
const SPECIALTY_EMOJI: Record<string, string> = {
  // Doctor specialties
  'General Practice': '', 'Family Medicine': '', 'Internal Medicine': '',
  'Cardiology': '', 'Dermatology': '', 'Endocrinology': '',
  'Gastroenterology': '', 'Geriatrics': '', 'Gynecology': '',
  'Neurology': '', 'Oncology': '', 'Ophthalmology': '',
  'Orthopedics': '', 'Pediatrics': '', 'Psychiatry': '',
  'Psychology': '', 'Pulmonology': '', 'Radiology': '',
  'Rheumatology': '', 'Urology': '', 'Anesthesiology': '',
  'Pathology': '', 'Sports Medicine': '', 'Preventive Medicine': '',
  'Sexual Health': '',
  // Nurse specialties
  'General Nursing': '', 'ICU / Critical Care': '', 'Wound Care': '',
  'Midwifery': '', 'Pediatric Nursing': '', 'Geriatric Nursing': '',
  'Mental Health Nursing': '', 'Oncology Nursing': '',
  'Community Health': '', 'Home Care': '',
  // Childcare specialties
  'Newborn Care': '', 'Toddler Care': '', 'After-School': '',
  'Special Needs': '', 'Overnight Care': '',
  // Pharmacist specialties
  'Clinical Pharmacy': '', 'Hospital Pharmacy': '', 'Geriatric Pharmacy': '',
  'Oncology Pharmacy': '', 'Pediatric Pharmacy': '',
  // Lab specialties
  'Hematology': '', 'Microbiology': '', 'Clinical Chemistry': '',
  'Histology': '', 'Immunology': '', 'Molecular Biology': '',
  // Emergency specialties
  'Paramedic': '', 'EMT-Basic': '', 'EMT-Intermediate': '',
  'Critical Care Transport': '', 'Wilderness Rescue': '',
  // Caregiver specialties
  'Elder Care': '', 'Disability Care': '', 'Dementia Care': '',
  'Post-Surgery Care': '', 'Palliative Care': '',
  // Physiotherapy specialties
  'Orthopedic': '', 'Neurological': '', 'Sports': '',
  'Pediatric': '', 'Geriatric': '', 'Cardiopulmonary': '',
  // Dentist specialties
  'General Dentistry': '', 'Orthodontics': '', 'Periodontics': '',
  'Endodontics': '', 'Oral Surgery': '', 'Cosmetic Dentistry': '',
  'Pediatric Dentistry': '',
  // Optometrist specialties
  'General Eye Care': '', 'Contact Lenses': '', 'Pediatric Eye Care': '',
  'Low Vision': '', 'Sports Vision': '',
  // Nutritionist specialties
  'Clinical Nutrition': '', 'Sports Nutrition': '', 'Weight Management': '',
  'Pediatric Nutrition': '', 'Diabetes Nutrition': '', 'Prenatal Nutrition': '',
}

function getSpecialtyEmoji(name: string): string {
  return SPECIALTY_EMOJI[name] || ''
}

function colorToCardStyle(hex: string): { bg: string; text: string; border: string; accent: string } {
  const map: Record<string, { bg: string; text: string; border: string; accent: string }> = {
    '#0C6780': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', accent: 'bg-teal-100' },
    '#001E40': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', accent: 'bg-blue-100' },
    '#22c55e': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', accent: 'bg-green-100' },
    '#8b5cf6': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', accent: 'bg-purple-100' },
    '#ec4899': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', accent: 'bg-pink-100' },
    '#ef4444': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', accent: 'bg-red-100' },
    '#f97316': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', accent: 'bg-orange-100' },
    '#6366f1': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', accent: 'bg-indigo-100' },
    '#14b8a6': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', accent: 'bg-teal-100' },
    '#0ea5e9': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', accent: 'bg-sky-100' },
  }
  return map[hex] || { bg: 'bg-subtle', text: 'text-soft', border: 'border-line', accent: 'bg-subtle' }
}

export default function ProviderMarketplace({ embedded = false }: { embedded?: boolean } = {}) {
  const [roles, setRoles] = useState<ProviderRole[]>([])
  const [loading, setLoading] = useState(true)
  const roleScrollRef = useRef<HTMLDivElement>(null)
  const [roleCanLeft, setRoleCanLeft] = useState(false)
  const [roleCanRight, setRoleCanRight] = useState(false)

  const checkRoleScroll = () => {
    const el = roleScrollRef.current
    if (!el) return
    setRoleCanLeft(el.scrollLeft > 4)
    setRoleCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  const scrollRole = (dir: 'left' | 'right') => {
    const el = roleScrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'left' ? -180 : 180, behavior: 'smooth' })
  }

  useEffect(() => {
    const el = roleScrollRef.current
    if (!el) return
    checkRoleScroll()
    el.addEventListener('scroll', checkRoleScroll, { passive: true })
    const ro = new ResizeObserver(checkRoleScroll)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', checkRoleScroll); ro.disconnect() }
  }, [roles])

  useEffect(() => {
    fetch('/api/roles?searchEnabled=true')
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          setRoles(json.data.filter((r: ProviderRole) => r.specialties?.length > 0))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Inlined class strings instead of a Wrapper subcomponent - defining a
  // component inside the function body is a React anti-pattern (recreates
  // the component type every render and breaks children identity).
  const scrollbarClass = `[&::-webkit-scrollbar]:w-[3px]
    [&::-webkit-scrollbar-thumb]:bg-line
    [&::-webkit-scrollbar-thumb]:rounded-full
    [&::-webkit-scrollbar-track]:bg-transparent`

  if (loading) {
    if (embedded) {
      return (
        <>
          <div className="flex-shrink-0 px-5 sm:px-7 pt-5 sm:pt-6 pb-3 sm:pb-4 border-b border-line animate-pulse">
            <div className="h-7 bg-line rounded w-56 mb-2" />
            <div className="h-4 bg-subtle rounded w-44" />
          </div>
          <div className="flex-1 px-5 sm:px-7 py-4 animate-pulse space-y-8">
            {[1, 2, 3].map(i => (
              <div key={i}>
                <div className="h-5 bg-line rounded w-32 mb-4" />
                <div className="flex gap-4">
                  {[1, 2, 3, 4].map(j => (
                    <div key={j} className="w-48 h-36 bg-subtle rounded-2xl flex-shrink-0" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )
    }
    return (
      <section className="py-8 sm:py-12 bg-surface overflow-hidden">
        <div className="w-full px-6 sm:px-12 lg:px-20 xl:px-28">
          <div className="animate-pulse">
            <div className="h-8 bg-line rounded w-64 mb-2" />
            <div className="h-4 bg-subtle rounded w-96 mb-8" />
            {[1, 2, 3].map(i => (
              <div key={i} className="mb-10">
                <div className="h-5 bg-line rounded w-32 mb-4" />
                <div className="flex gap-4">
                  {[1, 2, 3, 4].map(j => (
                    <div key={j} className="w-48 h-36 bg-subtle rounded-2xl flex-shrink-0" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (roles.length === 0) return null

  const rolesContent = roles.map(role => {
    const Icon = resolveIcon(role.icon)
    const style = colorToCardStyle(role.color)
    return (
      <HorizontalScrollRow
        key={role.code}
        title={role.label}
        subtitle={`${role.providerCount} provider${role.providerCount !== 1 ? 's' : ''} available`}
        icon={<Icon className={style.text} />}
        seeAllHref={`/search/${role.slug}`}
      >
        {role.specialties.map((spec) => (
          <Link
            key={spec.name}
            href={`/search/${role.slug}?specialty=${encodeURIComponent(spec.name)}`}
            className={`flex-shrink-0 snap-start w-[160px] sm:w-52 md:w-56 p-4 sm:p-5
              rounded-[1.5rem] border-2 ${style.border} ${style.bg}
              shadow-[0_2px_16px_-2px_rgba(0,30,64,0.08)]
              hover:shadow-[0_8px_32px_-4px_rgba(0,30,64,0.18)]
              hover:scale-[1.03] hover:-translate-y-0.5
              transition-all duration-200 group`}
          >
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${style.accent}
              flex items-center justify-center text-3xl sm:text-4xl mb-3 shadow-inner`}>
              {spec.icon || getSpecialtyEmoji(spec.name)}
            </div>
            <div className={`text-sm font-bold ${style.text} group-hover:underline mb-1 line-clamp-2`}>
              {spec.name}
            </div>
            {spec.description && (
              <p className="text-xs text-soft line-clamp-2">{spec.description}</p>
            )}
          </Link>
        ))}
      </HorizontalScrollRow>
    )
  })

  if (embedded) {
    return (
      <>
        {/* Header - sits above the scroll area, never moves */}
        <div className="flex-shrink-0 px-5 sm:px-7 pt-5 sm:pt-6 pb-3 sm:pb-4 bg-surface border-b border-line">
          <h2 className="text-2xl sm:text-3xl font-bold text-fg mb-1 sm:mb-2">Find Healthcare Providers</h2>
          <p className="text-sm sm:text-base text-soft">Browse by specialty across all provider types</p>

          {/* Role quick-jump pills - scrollable strip with prev/next buttons */}
          <div className="flex items-center gap-1.5 mt-3">
            <button
              onClick={() => scrollRole('left')}
              disabled={!roleCanLeft}
              className={`flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-all
                ${roleCanLeft ? 'border-[#0C6780] text-[#0C6780] hover:bg-[#0C6780] hover:text-white' : 'border-line text-faint cursor-default'}`}
              aria-label="Scroll roles left"
            >
              <FaChevronLeft className="text-[10px]" />
            </button>

            <div className="flex-1 min-w-0 overflow-hidden relative">
              {roleCanRight && (
                <div className="absolute right-0 top-0 bottom-0 w-6 z-10 pointer-events-none"
                  style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.95))' }} />
              )}
              {roleCanLeft && (
                <div className="absolute left-0 top-0 bottom-0 w-6 z-10 pointer-events-none"
                  style={{ background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.95))' }} />
              )}
              <div
                ref={roleScrollRef}
                onScroll={checkRoleScroll}
                className="flex gap-2 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden scroll-smooth"
              >
                {roles.map(role => {
                  const Icon = resolveIcon(role.icon)
                  const style = colorToCardStyle(role.color)
                  return (
                    <Link
                      key={role.code}
                      href={`/search/${role.slug}`}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs whitespace-nowrap flex-shrink-0 transition-all
                        ${style.bg} ${style.border} ${style.text} hover:opacity-80`}
                    >
                      <Icon className="text-[11px]" />
                      {role.singularLabel || role.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            <button
              onClick={() => scrollRole('right')}
              disabled={!roleCanRight}
              className={`flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-all
                ${roleCanRight ? 'border-[#0C6780] text-[#0C6780] hover:bg-[#0C6780] hover:text-white' : 'border-line text-faint cursor-default'}`}
              aria-label="Scroll roles right"
            >
              <FaChevronRight className="text-[10px]" />
            </button>
          </div>
        </div>
        {/* Scrollable content */}
        <div className={`flex-1 overflow-y-auto px-5 sm:px-7 py-4 sm:py-6 ${scrollbarClass}`}>
          {rolesContent}
        </div>
      </>
    )
  }

  return (
    <section className="py-8 sm:py-12 bg-surface overflow-hidden">
      <div className="w-full px-6 sm:px-12 lg:px-20 xl:px-28">
        <div className="sticky top-0 z-20 -mx-6 sm:-mx-12 lg:-mx-20 xl:-mx-28 px-6 sm:px-12 lg:px-20 xl:px-28
          pt-6 sm:pt-8 pb-3 sm:pb-4 mb-4 sm:mb-6 bg-white/95 backdrop-blur-sm border-b border-line">
          <h2 className="text-2xl sm:text-3xl font-bold text-fg mb-1 sm:mb-2">Find Healthcare Providers</h2>
          <p className="text-sm sm:text-base text-soft">Browse by specialty across all provider types</p>
        </div>
        {rolesContent}
      </div>
    </section>
  )
}
