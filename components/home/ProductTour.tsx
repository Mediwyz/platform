'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MdArrowForward } from 'react-icons/md'
import { useTranslation } from '@/lib/i18n'

/**
 * Product Tour  real screenshots of the live app, grouped by audience, so the
 * landing page shows exactly what MediWyz does. Images are captured by
 * scripts/capture-showcase.mjs into /public/showcase/*.png  re-run it to refresh.
 */

interface Shot {
  key: string
  titleKey: string
  descKey: string
}

const TABS: { id: 'members' | 'providers'; labelKey: string; shots: Shot[] }[] = [
  {
    id: 'members',
    labelKey: 'landing.tourTabMembers',
    shots: [
      { key: 'home',                 titleKey: 'landing.tourDiscoverTitle',       descKey: 'landing.tourDiscoverDesc' },
      { key: 'find-providers',       titleKey: 'landing.tourFindTitle',           descKey: 'landing.tourFindDesc' },
      { key: 'member-dashboard',     titleKey: 'landing.tourDashboardTitle',      descKey: 'landing.tourDashboardDesc' },
      { key: 'member-consultations', titleKey: 'landing.tourConsultationsTitle',  descKey: 'landing.tourConsultationsDesc' },
      { key: 'member-billing',       titleKey: 'landing.tourWalletTitle',         descKey: 'landing.tourWalletDesc' },
      { key: 'member-health',        titleKey: 'landing.tourAiTitle',             descKey: 'landing.tourAiDesc' },
      { key: 'member-video',         titleKey: 'landing.tourVideoTitle',          descKey: 'landing.tourVideoDesc' },
      { key: 'health-shop',          titleKey: 'landing.tourShopTitle',           descKey: 'landing.tourShopDesc' },
    ],
  },
  {
    id: 'providers',
    labelKey: 'landing.tourTabProviders',
    shots: [
      { key: 'provider-dashboard',    titleKey: 'landing.tourProviderDashTitle', descKey: 'landing.tourProviderDashDesc' },
      { key: 'provider-services',     titleKey: 'landing.tourServicesTitle',     descKey: 'landing.tourServicesDesc' },
      { key: 'provider-workflows',    titleKey: 'landing.tourWorkflowsTitle',    descKey: 'landing.tourWorkflowsDesc' },
      { key: 'provider-inventory',    titleKey: 'landing.tourInventoryTitle',    descKey: 'landing.tourInventoryDesc' },
      { key: 'provider-availability', titleKey: 'landing.tourAvailabilityTitle', descKey: 'landing.tourAvailabilityDesc' },
    ],
  },
]

export default function ProductTour() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<'members' | 'providers'>('members')
  const [index, setIndex] = useState(0)

  const active = TABS.find(x => x.id === tab)!
  const shot = active.shots[index]

  return (
    <section className="relative py-16 sm:py-24 bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="inline-block text-sm font-semibold tracking-wider uppercase text-[#0C6780] mb-2">
            {t('landing.tourEyebrow')}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-fg">
            {t('landing.tourHeading')}
          </h2>
          <p className="mt-3 text-base sm:text-lg text-soft max-w-2xl mx-auto">
            {t('landing.tourSubheading')}
          </p>
        </div>

        {/* Audience tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 bg-subtle rounded-full">
            {TABS.map(tabItem => (
              <button
                key={tabItem.id}
                onClick={() => { setTab(tabItem.id); setIndex(0) }}
                className={`px-5 sm:px-6 py-2 rounded-full text-sm font-semibold transition-colors ${
                  tab === tabItem.id ? 'bg-surface text-[#0C6780] shadow-sm' : 'text-soft hover:text-soft'
                }`}
              >
                {t(tabItem.labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6 lg:gap-8 items-start">
          {/* Framed screenshot */}
          <div className="rounded-2xl border border-line shadow-xl overflow-hidden bg-surface">
            <div className="flex items-center gap-1.5 px-4 py-2.5 bg-subtle border-b border-line">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-3 text-xs text-faint truncate">mediwyz.com  {t(shot.titleKey)}</span>
            </div>
            <div className="relative aspect-[1280/820] bg-subtle">
              <Image
                key={shot.key}
                src={`/showcase/${shot.key}.png`}
                alt={t(shot.titleKey)}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover object-top"
                priority={index === 0}
              />
            </div>
          </div>

          {/* Feature list  click to switch the preview */}
          <div className="space-y-2">
            {active.shots.map((s, i) => (
              <button
                key={s.key}
                onClick={() => setIndex(i)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  i === index
                    ? 'border-[#0C6780] bg-[#0C6780]/5 shadow-sm'
                    : 'border-line hover:border-line hover:bg-subtle'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-bold ${i === index ? 'text-[#0C6780]' : 'text-fg'}`}>{t(s.titleKey)}</span>
                  {i === index && <MdArrowForward className="text-[#0C6780] flex-shrink-0" aria-hidden />}
                </div>
                <p className="text-xs text-soft mt-0.5">{t(s.descKey)}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
