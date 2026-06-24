'use client'

import Image from 'next/image'
import { FaSearch, FaCalendarCheck, FaVideo } from 'react-icons/fa'
import { useTranslation } from '@/lib/i18n'

const STEPS = [
  { icon: FaSearch,        color: '#0C6780', step: '01', titleKey: 'landing.howStepOneTitle', descKey: 'landing.howStepOneDesc', img: 'find_care_map.jpg' },
  { icon: FaCalendarCheck, color: '#001E40', step: '02', titleKey: 'landing.howStepTwoTitle', descKey: 'landing.howStepTwoDesc', img: 'booking.jpg' },
  { icon: FaVideo,         color: '#0a5c73', step: '03', titleKey: 'landing.howStepThreeTitle', descKey: 'landing.howStepThreeDesc', img: 'video_consult.jpg' },
] as const

export default function HowItWorksSection() {
  const { t } = useTranslation()
  return (
    <section className="bg-surface border-b border-line py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="inline-block text-sm font-semibold tracking-wider uppercase text-[#0C6780] mb-2">
            {t('landing.howEyebrow')}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-fg">
            {t('landing.howTitle')}
          </h2>
          <p className="mt-3 text-base sm:text-lg text-soft max-w-2xl mx-auto">
            {t('landing.howSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          {STEPS.map(s => {
            const Icon = s.icon
            return (
              <div
                key={s.step}
                className="group relative flex flex-col bg-surface rounded-3xl border border-line shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200 overflow-hidden"
              >
                {/* Photo header with icon + step number */}
                <div className="relative h-44 w-full overflow-hidden">
                  <Image
                    src={`/images/landing/${s.img}`}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#001E40]/60 via-[#001E40]/10 to-transparent" />
                  <span
                    className="absolute top-4 left-4 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105"
                    style={{ backgroundColor: s.color }}
                  >
                    <Icon className="text-white text-xl" />
                  </span>
                  <span className="absolute top-3 right-5 text-3xl font-black text-white/85 drop-shadow">{s.step}</span>
                </div>

                <div className="px-7 py-7">
                  <h3 className="text-xl sm:text-2xl font-bold text-fg mb-2">{t(s.titleKey)}</h3>
                  <p className="text-base text-soft leading-relaxed">{t(s.descKey)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
