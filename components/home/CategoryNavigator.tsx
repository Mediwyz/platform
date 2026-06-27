'use client'

/**
 * CategoryNavigator - the lightweight 3-level entry point that replaces the old
 * 1,200-line DiscoverSection on the landing page.
 *
 * Flow:
 *   Level 1  Entity       Services | Providers | Organisations | Health Shop
 *   Level 2  Sub-group    provider roles (Services/Providers)  org types  shop categories
 *   Level 3  Category      service categories for the chosen role (Services path only)
 *
 * The final click routes to an existing /search/* page with query params. The
 * Google-Maps "find nearest" experience lives on those search pages (the last step),
 * never on the landing - keeping the home page fast and uncluttered.
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { IconType } from 'react-icons'
import CategoryTile from './CategoryTile'
import DiscoverAiSearch from './DiscoverAiSearch'
import { useTranslation } from '@/lib/i18n'
import {
  MdMedicalServices, MdPeople, MdLocalHospital, MdShoppingCart,
  MdArrowBack, MdArrowForward, MdChevronRight, MdHealthAndSafety,
} from 'react-icons/md'
import {
  TbStethoscope, TbHeartRateMonitor, TbDental, TbEye,
  TbBabyCarriage, TbActivity, TbPill, TbAmbulance, TbFlask,
  TbApple, TbNurse, TbBuildingHospital, TbMicroscope,
} from 'react-icons/tb'

const TEAL = '#0C6780'

//  Level 1  entities 
type EntityKey = 'services' | 'providers' | 'organisations' | 'shop'

interface Entity {
  key: EntityKey
  labelKey: string
  blurbKey: string
  Icon: IconType
  img: string
}

const ENTITIES: Entity[] = [
  { key: 'services',      labelKey: 'landing.entityServices',      blurbKey: 'landing.entityServicesBlurb',      Icon: MdMedicalServices, img: 'video_consult.jpg' },
  { key: 'providers',     labelKey: 'landing.entityProviders',     blurbKey: 'landing.entityProvidersBlurb',     Icon: MdPeople,          img: 'doctor_team.jpg' },
  { key: 'organisations', labelKey: 'landing.entityOrganisations', blurbKey: 'landing.entityOrganisationsBlurb', Icon: MdLocalHospital,   img: 'hospital.jpg' },
  { key: 'shop',          labelKey: 'landing.entityHealthShop',    blurbKey: 'landing.entityHealthShopBlurb',    Icon: MdShoppingCart,    img: 'pharmacy.jpg' },
]

//  Provider role icon mapping (by role code) 
const ROLE_ICON: Record<string, IconType> = {
  DOCTOR: TbStethoscope,
  NURSE: TbNurse,
  NANNY: TbBabyCarriage,
  PHARMACIST: TbPill,
  LAB_TECHNICIAN: TbFlask,
  EMERGENCY_WORKER: TbAmbulance,
  CAREGIVER: TbHeartRateMonitor,
  PHYSIOTHERAPIST: TbActivity,
  DENTIST: TbDental,
  OPTOMETRIST: TbEye,
  NUTRITIONIST: TbApple,
}

//  Level 2  organisation types (redirect to /search/organizations) 
const ORG_TYPES: { value: string; label: string; Icon: IconType }[] = [
  { value: 'clinic',     label: 'Clinics',    Icon: TbBuildingHospital },
  { value: 'hospital',   label: 'Hospitals',  Icon: MdLocalHospital },
  { value: 'laboratory', label: 'Labs',       Icon: TbMicroscope },
  { value: 'pharmacy',   label: 'Pharmacies', Icon: TbPill },
  { value: 'insurance',  label: 'Insurance',  Icon: MdHealthAndSafety },
]

//  Level 2  shop categories (redirect to /search/health-shop) 
const SHOP_CATEGORIES: { key: string; label: string; Icon: IconType }[] = [
  { key: 'medication',      label: 'Medications',   Icon: TbPill },
  { key: 'vitamins',        label: 'Vitamins',      Icon: TbApple },
  { key: 'first_aid',       label: 'First Aid',     Icon: MdMedicalServices },
  { key: 'personal_care',   label: 'Personal Care', Icon: TbActivity },
  { key: 'dental_care',     label: 'Dental',        Icon: TbDental },
  { key: 'baby_care',       label: 'Baby Care',     Icon: TbBabyCarriage },
  { key: 'nutrition',       label: 'Nutrition',     Icon: TbApple },
  { key: 'eyewear',         label: 'Eyewear',       Icon: TbEye },
  { key: 'medical_devices', label: 'Devices',       Icon: TbHeartRateMonitor },
]

interface RoleData {
  code: string
  label: string
  slug: string
  color: string
  /** Admin-managed illustrative image URL (falls back to a bundled default by code). */
  cardImage?: string | null
}

// Default realistic illustration per provider-type code (under /public/images/landing/roles).
// Used when a regional admin has not uploaded a custom cardImage yet.
const ROLE_IMG: Record<string, string> = {
  DOCTOR: 'doctor', NURSE: 'nurse', NANNY: 'nanny', PHARMACIST: 'pharmacist',
  LAB_TECHNICIAN: 'lab', EMERGENCY_WORKER: 'emergency', CAREGIVER: 'caregiver',
  PHYSIOTHERAPIST: 'physiotherapist', DENTIST: 'dentist', OPTOMETRIST: 'optometrist',
  NUTRITIONIST: 'nutritionist',
}
const roleImg = (r: RoleData) =>
  r.cardImage && r.cardImage.trim() ? r.cardImage : `/images/landing/roles/${ROLE_IMG[r.code] || 'generic'}.jpg`

export default function CategoryNavigator() {
  const router = useRouter()
  const { t } = useTranslation()

  const [entity, setEntity] = useState<EntityKey | null>(null)
  const [roles, setRoles] = useState<RoleData[]>([])
  const [rolesLoaded, setRolesLoaded] = useState(false)
  const [role, setRole] = useState<RoleData | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [loadingCats, setLoadingCats] = useState(false)

  // Lazily load provider roles the first time the user enters Services or Providers.
  const ensureRoles = useCallback(async () => {
    if (rolesLoaded) return
    try {
      const res = await fetch('/api/roles?searchEnabled=true')
      const json = await res.json()
      if (json?.success && Array.isArray(json.data)) setRoles(json.data)
    } catch {
      /* network errors leave the role grid empty - the entity card still works as a direct link */
    } finally {
      setRolesLoaded(true)
    }
  }, [rolesLoaded])

  const pickEntity = useCallback(async (key: EntityKey) => {
    setEntity(key)
    setRole(null)
    setCategories([])
    if (key === 'services' || key === 'providers') await ensureRoles()
  }, [ensureRoles])

  // Services path  choosing a role loads that role's service categories (level 3).
  const pickServiceRole = useCallback(async (r: RoleData) => {
    setRole(r)
    setLoadingCats(true)
    try {
      const res = await fetch(`/api/search/services?providerType=${encodeURIComponent(r.code)}&limit=500`)
      const json = await res.json()
      const cats = new Set<string>()
      if (json?.success && Array.isArray(json.data)) {
        for (const s of json.data) if (s.category) cats.add(s.category as string)
      }
      setCategories(Array.from(cats).sort())
    } catch {
      setCategories([])
    } finally {
      setLoadingCats(false)
    }
  }, [])

  //  Redirect helpers (all targets are existing /search/* pages) 
  const goServicesCategory = (r: RoleData, cat?: string) =>
    router.push(`/search/services?type=${encodeURIComponent(r.code)}${cat ? `&category=${encodeURIComponent(cat)}` : ''}`)
  const goProviderRole = (r: RoleData) => router.push(`/search/${r.slug}`)
  // Insurance companies live in their own discovery page (they are
  // CorporateAdminProfile rows, not HealthcareEntity records), so route
  // there instead of the healthcare-entity organisations search.
  const goOrg = (type: string) =>
    type === 'insurance'
      ? router.push('/search/insurance-companies')
      : router.push(`/search/organizations?type=${encodeURIComponent(type)}`)
  const goShop = (cat: string) => router.push(`/search/health-shop?category=${encodeURIComponent(cat)}`)

  const reset = () => { setEntity(null); setRole(null); setCategories([]) }
  const backToRoles = () => { setRole(null); setCategories([]) }

  const activeEntity = ENTITIES.find(e => e.key === entity) ?? null

  return (
    <section id="discover-section" className="relative py-16 sm:py-24 bg-canvas">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <span className="inline-block text-sm font-semibold tracking-wider uppercase text-[#0C6780] mb-2">
            {t('landing.discoverEyebrow')}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-fg">
            {t('landing.discoverHeading')}
          </h2>
          <p className="mt-3 text-base sm:text-lg text-soft max-w-2xl mx-auto">
            {t('landing.discoverSubheading')}
          </p>
        </div>

        {/* Breadcrumb */}
        {entity && (
          <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1.5 mb-5 text-sm">
            <button
              onClick={reset}
              className="font-medium text-[#0C6780] hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C6780]/40 rounded px-1"
            >
              {t('landing.navAllCategories')}
            </button>
            <MdChevronRight className="text-faint" aria-hidden />
            <button
              onClick={backToRoles}
              disabled={!role}
              className={`font-medium rounded px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C6780]/40
                ${role ? 'text-[#0C6780] hover:text-fg' : 'text-soft cursor-default'}`}
            >
              {activeEntity ? t(activeEntity.labelKey) : ''}
            </button>
            {role && (
              <>
                <MdChevronRight className="text-faint" aria-hidden />
                <span className="font-medium text-soft px-1">{role.label}</span>
              </>
            )}
          </nav>
        )}

        {/*  Level 1  Entities  */}
        {/* First thing a new user sees: 22 grid of large cards (was a single
            cramped row of 4). Bigger tap targets + more breathing room. */}
        {!entity && (
          <div className="grid lg:grid-cols-[1fr_1fr] xl:grid-cols-[1.05fr_1fr] gap-6 lg:gap-8 max-w-7xl mx-auto items-stretch">
            {/* Left: the 4 category cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            {ENTITIES.map(e => {
              const Icon = e.Icon
              return (
                <button
                  key={e.key}
                  onClick={() => pickEntity(e.key)}
                  className="group relative overflow-hidden flex flex-col items-start justify-end text-left min-h-[230px] p-8 sm:p-9 rounded-3xl text-white
                    shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-200
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0C6780] cursor-pointer"
                >
                  <Image
                    src={`/images/landing/${e.img}`}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#001E40] via-[#001E40]/60 to-[#001E40]/15" />
                  <span aria-hidden className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10" />
                  <span className="relative w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-5 transition-transform group-hover:scale-105">
                    <Icon size={34} aria-hidden className="text-white" />
                  </span>
                  <span className="relative text-xl sm:text-2xl font-bold drop-shadow-sm">{t(e.labelKey)}</span>
                  <span className="relative text-base text-white/80 mt-1.5">{t(e.blurbKey)}</span>
                  <span className="relative mt-5 inline-flex items-center gap-1.5 text-base font-semibold text-brand-sky group-hover:gap-2.5 transition-all">
                    Browse <MdArrowForward size={16} aria-hidden />
                  </span>
                </button>
              )
            })}
            </div>
            {/* Right: AI chatbot column */}
            <aside className="lg:sticky lg:top-24">
              <DiscoverAiSearch />
            </aside>
          </div>
        )}

        {/*  Level 2  Services or Providers  role grid  */}
        {(entity === 'services' || entity === 'providers') && !role && (
          <RoleGrid
            roles={roles}
            loaded={rolesLoaded}
            onPick={entity === 'services' ? pickServiceRole : goProviderRole}
            cta={entity === 'services' ? t('landing.navSeeCategories') : t('landing.navFindProviders')}
          />
        )}

        {/*  Level 2  Organisations  */}
        {entity === 'organisations' && (
          <TileGrid
            items={ORG_TYPES.map(o => ({ id: o.value, label: o.label, Icon: o.Icon }))}
            onPick={goOrg}
          />
        )}

        {/*  Level 2  Health Shop  */}
        {entity === 'shop' && (
          <TileGrid
            items={SHOP_CATEGORIES.map(c => ({ id: c.key, label: c.label, Icon: c.Icon }))}
            onPick={goShop}
          />
        )}

        {/*  Level 3  Service categories for the chosen role  */}
        {entity === 'services' && role && (
          <div>
            <button
              onClick={backToRoles}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0C6780] hover:text-fg mb-4
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C6780]/40 rounded px-1"
            >
              <MdArrowBack size={16} aria-hidden /> Back to provider types
            </button>

            {loadingCats ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-2xl bg-subtle animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {/* "All" shortcut tile */}
                <CategoryTile
                  label={`All ${role.label}`}
                  category="general consultation"
                  providerType={role.code}
                  color={role.color}
                  onClick={() => goServicesCategory(role)}
                />
                {categories.map(cat => (
                  <CategoryTile
                    key={cat}
                    label={cat}
                    category={cat}
                    providerType={role.code}
                    color={role.color}
                    onClick={() => goServicesCategory(role, cat)}
                  />
                ))}
                {categories.length === 0 && (
                  <p className="col-span-full text-sm text-faint py-2">
                    No sub-categories yet - <button onClick={() => goServicesCategory(role)} className="text-[#0C6780] dark:text-accent font-medium underline">browse all {role.label} services</button>.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer link to the full catalogue (the heavy list now lives here) */}
        <div className="text-center mt-12">
          <button
            onClick={() => router.push('/search/services')}
            className="inline-flex items-center gap-2 text-base font-semibold text-[#0C6780] hover:text-fg
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C6780]/40 rounded px-2 py-1 cursor-pointer"
          >
            {t('landing.navBrowseCatalogue')} <MdArrowForward size={16} aria-hidden />
          </button>
        </div>
      </div>
    </section>
  )
}

//  Role grid (Level 2 for Services / Providers) 
function RoleGrid({
  roles, loaded, onPick, cta,
}: {
  roles: RoleData[]
  loaded: boolean
  onPick: (r: RoleData) => void
  cta: string
}) {
  const { t } = useTranslation()
  if (!loaded) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-subtle animate-pulse" />
        ))}
      </div>
    )
  }
  if (roles.length === 0) {
    return <p className="text-sm text-faint py-6 text-center">{t('landing.navNoProviderTypes')}</p>
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {roles.map(r => {
        const Icon = ROLE_ICON[r.code] ?? MdMedicalServices
        const color = r.color || TEAL
        return (
          <button
            key={r.code}
            onClick={() => onPick(r)}
            className="group relative overflow-hidden flex flex-col justify-end text-left min-h-[150px] p-4 rounded-2xl text-white
              shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0C6780] cursor-pointer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={roleImg(r)}
              alt=""
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#001E40] via-[#001E40]/55 to-[#001E40]/10" />
            <span aria-hidden className="absolute left-0 top-0 h-full w-1" style={{ background: color }} />
            <span className="relative w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-2">
              <Icon size={18} aria-hidden className="text-white" />
            </span>
            <span className="relative text-sm font-bold drop-shadow-sm">{r.label}</span>
            <span className="relative mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-sky group-hover:gap-2 transition-all">
              {cta} <MdArrowForward size={11} aria-hidden />
            </span>
          </button>
        )
      })}
    </div>
  )
}

//  Generic tile grid (Level 2 for Organisations / Shop) 
function TileGrid({
  items, onPick,
}: {
  items: { id: string; label: string; Icon: IconType }[]
  onPick: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {items.map(it => {
        const Icon = it.Icon
        return (
          <button
            key={it.id}
            onClick={() => onPick(it.id)}
            className="group flex flex-col items-start text-left p-4 rounded-2xl bg-surface border border-line
              shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C6780] cursor-pointer"
          >
            <span className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ background: 'rgba(12,103,128,0.10)', color: TEAL }}>
              <Icon size={20} aria-hidden />
            </span>
            <span className="text-sm font-bold text-fg">{it.label}</span>
            <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#0C6780] group-hover:gap-2 transition-all">
              Browse <MdArrowForward size={11} aria-hidden />
            </span>
          </button>
        )
      })}
    </div>
  )
}
