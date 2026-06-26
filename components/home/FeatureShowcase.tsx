'use client'

/**
 * FeatureShowcase - a bento-grid section that surfaces every core capability of
 * the MediWyz platform (video/audio calls, chat, health shop, feed, emergency,
 * geolocation directory, provider workflow/services management, notifications).
 * Replaces the old "From the Community" block with something that actually shows
 * what the app does. Bento layout (varied card spans), brand navy/teal/sky,
 * soft shadows, glassmorphism accents, hover lift - per ui-ux-pro-max.
 */

import Link from 'next/link'
import Image from 'next/image'
import type { IconType } from 'react-icons'
import {
  FaVideo, FaComments, FaShoppingBag, FaNewspaper, FaAmbulance,
  FaMapMarkedAlt, FaProjectDiagram, FaBell, FaArrowRight, FaUserMd, FaShieldAlt,
  FaLock, FaBolt, FaMobileAlt, FaUniversalAccess, FaLayerGroup,
} from 'react-icons/fa'
import { useTranslation } from '@/lib/i18n'

const NAVY = '#001E40'
const TEAL = '#0C6780'
const SKY = '#9AE1FF'

/** Engineering & design highlights - shows the craft behind the platform. */
const CRAFT: { Icon: IconType; titleKey: string; descKey: string }[] = [
  { Icon: FaLock,             titleKey: 'landing.craftEncryptionTitle',  descKey: 'landing.craftEncryptionDesc' },
  { Icon: FaBolt,             titleKey: 'landing.craftRealtimeTitle',    descKey: 'landing.craftRealtimeDesc' },
  { Icon: FaMobileAlt,        titleKey: 'landing.craftMobileTitle',      descKey: 'landing.craftMobileDesc' },
  { Icon: FaMapMarkedAlt,     titleKey: 'landing.craftGeoTitle',         descKey: 'landing.craftGeoDesc' },
  { Icon: FaUniversalAccess,  titleKey: 'landing.craftAccessibleTitle',  descKey: 'landing.craftAccessibleDesc' },
  { Icon: FaLayerGroup,       titleKey: 'landing.craftMultiroleTitle',   descKey: 'landing.craftMultiroleDesc' },
]

interface Feature {
  Icon: IconType
  titleKey: string
  descKey: string
  href: string
  /** Background photo (under /public/images/landing/). */
  img: string
  /** Tailwind column/row span classes for the bento layout (lg+). */
  span?: string
}

const FEATURES: Feature[] = [
  { Icon: FaVideo,          titleKey: 'landing.featureVideoTitle',         descKey: 'landing.featureVideoDesc',         href: '/search/doctors',          img: 'video_consult.jpg', span: 'lg:col-span-2 lg:row-span-2' },
  { Icon: FaMapMarkedAlt,   titleKey: 'landing.featureMapTitle',           descKey: 'landing.featureMapDesc',           href: '/search/organizations',    img: 'find_care_map.jpg', span: 'lg:col-span-2' },
  { Icon: FaShoppingBag,    titleKey: 'landing.featureShopTitle',          descKey: 'landing.featureShopDesc',          href: '/search/health-shop',      img: 'pharmacy.jpg' },
  { Icon: FaComments,       titleKey: 'landing.featureChatTitle',          descKey: 'landing.featureChatDesc',          href: '/search/doctors',          img: 'secure_chat.jpg' },
  { Icon: FaAmbulance,      titleKey: 'landing.featureEmergencyTitle',     descKey: 'landing.featureEmergencyDesc',     href: '/search/emergency',        img: 'ambulance.jpg', span: 'lg:col-span-2' },
  { Icon: FaNewspaper,      titleKey: 'landing.featureCommunityTitle',     descKey: 'landing.featureCommunityDesc',     href: '/community',               img: 'community.jpg' },
  { Icon: FaProjectDiagram, titleKey: 'landing.featureWorkflowTitle',      descKey: 'landing.featureWorkflowDesc',      href: '/signup?type=provider',    img: 'provider_work.jpg', span: 'lg:col-span-2' },
  { Icon: FaBell,           titleKey: 'landing.featureStatusTitle',        descKey: 'landing.featureStatusDesc',        href: '/signup',                  img: 'notifications.jpg' },
  { Icon: FaShieldAlt,      titleKey: 'landing.featureInsuranceTitle',     descKey: 'landing.featureInsuranceDesc',     href: '/search/insurance',        img: 'hospital.jpg' },
]

export default function FeatureShowcase() {
  const { t } = useTranslation()
  return (
    <section className="bg-canvas border-b border-line py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="inline-block text-sm font-semibold tracking-wider uppercase text-[#0C6780] mb-2">
            {t('landing.featureEyebrow')}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-fg">
            {t('landing.featureHeading')}
          </h2>
          <p className="mt-3 text-base sm:text-lg text-soft max-w-2xl mx-auto">
            {t('landing.featureSubheading')}
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[minmax(172px,auto)] gap-5">
          {FEATURES.map(f => {
            const Icon = f.Icon
            return (
              <Link
                key={f.titleKey}
                href={f.href}
                className={`group relative overflow-hidden rounded-3xl min-h-[200px] flex flex-col justify-end p-6 text-white shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0C6780] ${f.span ?? ''}`}
              >
                <Image
                  src={`/images/landing/${f.img}`}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#001E40] via-[#001E40]/65 to-[#001E40]/10" />
                <span aria-hidden className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10" />
                <span className="relative self-start w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-3">
                  <Icon className="text-xl text-white" />
                </span>
                <div className="relative">
                  <h3 className="text-lg font-bold mb-1.5 drop-shadow-sm">{t(f.titleKey)}</h3>
                  <p className="text-sm text-white/85 leading-relaxed line-clamp-3">{t(f.descKey)}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-sky group-hover:gap-2.5 transition-all">
                    {t('landing.featureExplore')} <FaArrowRight className="text-[10px]" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>

        {/*  Craft band  the engineering & design behind the product  */}
        <div
          className="relative overflow-hidden rounded-3xl mt-12 sm:mt-16 px-6 sm:px-10 py-10 sm:py-14 text-white shadow-xl"
          style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${TEAL} 135%)` }}
        >
          {/* soft sky glows */}
          <span aria-hidden className="pointer-events-none absolute -top-16 -left-10 w-72 h-72 rounded-full blur-3xl opacity-25"
                style={{ background: `radial-gradient(circle, ${SKY} 0%, transparent 70%)` }} />
          <span aria-hidden className="pointer-events-none absolute -bottom-20 right-0 w-80 h-80 rounded-full blur-3xl opacity-20"
                style={{ background: `radial-gradient(circle, ${SKY} 0%, transparent 70%)` }} />

          <div className="relative text-center max-w-2xl mx-auto mb-9">
            <span className="inline-block text-sm font-semibold tracking-wider uppercase text-brand-sky mb-2">
              {t('landing.craftEyebrow')}
            </span>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              {t('landing.craftHeading')}
            </h3>
            <p className="mt-3 text-base sm:text-lg text-white/75">
              {t('landing.craftSubheading')}
            </p>
          </div>

          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {CRAFT.map(c => {
              const Icon = c.Icon
              return (
                <div key={c.titleKey}
                     className="flex items-start gap-4 rounded-2xl bg-white/[0.07] border border-white/10 backdrop-blur-sm px-5 py-5 hover:bg-white/[0.12] transition-colors">
                  <span className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
                    <Icon className="text-xl text-brand-sky" />
                  </span>
                  <div>
                    <h4 className="text-base font-bold leading-tight">{t(c.titleKey)}</h4>
                    <p className="text-sm text-white/65 mt-1 leading-relaxed">{t(c.descKey)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Dual audience CTA */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-[#0C6780] text-white px-6 py-3 text-sm font-semibold hover:bg-[#001E40] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0C6780]">
            {t('landing.featureCtaPatient')} <FaArrowRight className="text-xs" />
          </Link>
          <Link href="/signup?type=provider" className="inline-flex items-center gap-2 rounded-xl bg-surface border border-[#0C6780]/30 text-[#0C6780] px-6 py-3 text-sm font-semibold hover:border-[#0C6780] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C6780]">
            <FaUserMd className="text-xs" /> {t('landing.featureCtaProvider')}
          </Link>
        </div>
      </div>
    </section>
  )
}
