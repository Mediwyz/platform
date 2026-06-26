'use client'

import Image from 'next/image'
import {
  FaUserShield, FaBolt, FaVideo, FaMapMarkerAlt, FaLock, FaHeadset,
} from 'react-icons/fa'
import { useTranslation } from '@/lib/i18n'

const FEATURES = [
  { Icon: FaUserShield,    titleKey: 'landing.whyVerifiedTitle',  descKey: 'landing.whyVerifiedDesc',  img: 'doctor_portrait.jpg' },
  { Icon: FaBolt,          titleKey: 'landing.whyBookingTitle',   descKey: 'landing.whyBookingDesc',   img: 'booking.jpg' },
  { Icon: FaVideo,         titleKey: 'landing.whyVideoTitle',     descKey: 'landing.whyVideoDesc',     img: 'telemedicine.jpg' },
  { Icon: FaMapMarkerAlt,  titleKey: 'landing.whyCareNearTitle',  descKey: 'landing.whyCareNearDesc',  img: 'clinic.jpg' },
  { Icon: FaLock,          titleKey: 'landing.whyPrivacyTitle',   descKey: 'landing.whyPrivacyDesc',   img: 'medical_team.jpg' },
  { Icon: FaHeadset,       titleKey: 'landing.whySupportTitle',   descKey: 'landing.whySupportDesc',   img: 'nurse.jpg' },
] as const

export default function WhyMediWyzSection() {
  const { t } = useTranslation()
  return (
    <section className="bg-canvas border-b border-line py-14 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-14">
          <span className="inline-block text-xs font-semibold tracking-wider uppercase text-[#0C6780] mb-2">
            {t('landing.whyEyebrow')}
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-fg">
            {t('landing.whyHeading')}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-soft max-w-xl mx-auto">
            {t('landing.whySubheading')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {FEATURES.map(f => {
            const Icon = f.Icon
            return (
              <div
                key={f.titleKey}
                className="group relative overflow-hidden rounded-2xl min-h-[200px] flex flex-col justify-end p-5 text-white shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              >
                <Image
                  src={`/images/landing/${f.img}`}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#001E40] via-[#001E40]/60 to-[#001E40]/10" />
                <span aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
                <span className="relative self-start w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-3">
                  <Icon className="text-xl text-white" />
                </span>
                <h3 className="relative text-base font-bold mb-1 drop-shadow-sm">{t(f.titleKey)}</h3>
                <p className="relative text-sm text-white/85 leading-relaxed line-clamp-2">{t(f.descKey)}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
