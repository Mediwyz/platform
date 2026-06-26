'use client'

import { FaGooglePlay, FaApple, FaCheckCircle, FaBell, FaSearch } from 'react-icons/fa'
import { useTranslation } from '@/lib/i18n'

const PERK_KEYS = [
  'landing.appPerkAppointments',
  'landing.appPerkVideo',
  'landing.appPerkPrescriptions',
  'landing.appPerkNotifications',
] as const

export default function AppDownloadSection() {
  const { t } = useTranslation()
  return (
    <section className="relative overflow-hidden py-16 sm:py-24"
      style={{ background: 'linear-gradient(135deg, #001E40 0%, #0C6780 130%)' }}>
      {/* decorative glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 right-10 w-80 h-80 rounded-full opacity-25 blur-3xl"
             style={{ background: 'radial-gradient(circle, #9AE1FF 0%, transparent 70%)' }} />
        <div className="absolute -bottom-24 -left-10 w-96 h-96 rounded-full opacity-20 blur-3xl"
             style={{ background: 'radial-gradient(circle, #0C6780 0%, transparent 70%)' }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
        {/* Copy + badges */}
        <div>
          <span className="inline-block text-xs font-semibold tracking-wider uppercase text-brand-sky mb-3">
            {t('landing.appEyebrow')}
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight mb-4">
            {t('landing.appHeading')}
          </h2>
          <p className="text-sm sm:text-base text-faint/90 leading-relaxed max-w-lg mb-7">
            {t('landing.appDescription')}
          </p>

          <ul className="space-y-2.5 mb-8">
            {PERK_KEYS.map(k => (
              <li key={k} className="flex items-start gap-2.5 text-sm text-gray-200">
                <FaCheckCircle className="text-brand-sky mt-0.5 flex-shrink-0" />
                <span>{t(k)}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/MediWyz-v3.0.0-debug.apk"
              className="inline-flex items-center gap-2.5 rounded-xl bg-surface text-fg pl-3.5 pr-5 py-2.5 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky"
              aria-label="Get it on Google Play"
            >
              <FaGooglePlay className="text-xl" />
              <span className="flex flex-col leading-none">
                <span className="text-[9px] uppercase tracking-wide text-soft">{t('landing.appGetItOn')}</span>
                <span className="text-sm font-bold">Google Play</span>
              </span>
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2.5 rounded-xl bg-white/10 border border-white/25 text-white pl-3.5 pr-5 py-2.5 backdrop-blur-sm hover:bg-white/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky"
              aria-label="Download on the App Store (coming soon)"
            >
              <FaApple className="text-xl" />
              <span className="flex flex-col leading-none">
                <span className="text-[9px] uppercase tracking-wide text-white/60">{t('landing.appComingSoon')}</span>
                <span className="text-sm font-bold">App Store</span>
              </span>
            </a>
          </div>
        </div>

        {/* Phone mockup (pure CSS - no asset) */}
        <div className="hidden lg:flex justify-center">
          <div className="relative w-64 h-[34rem] rounded-[2.5rem] bg-[#0A1A33] border-[10px] border-[#0a2547] shadow-2xl ring-1 ring-white/10 overflow-hidden">
            {/* notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#0a2547] rounded-b-2xl z-20" />
            {/* screen  a realistic mini app-home mockup */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#001E40] to-[#0C6780] flex flex-col pt-9 px-4">
              {/* status bar */}
              <div className="flex items-center justify-between text-white/80 text-[9px] font-semibold mb-3">
                <span>9:41</span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-1.5 rounded-sm bg-white/70" />
                  <span className="w-1 h-1.5 rounded-sm bg-white/40" />
                  <span>100%</span>
                </span>
              </div>

              {/* app header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-white font-black text-sm">M</span>
                  <span className="text-white font-bold text-sm">MediWyz</span>
                </div>
                <span className="relative w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <FaBell className="text-white/80 text-[11px]" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-400 border border-[#0C2240]" />
                </span>
              </div>

              {/* greeting + search */}
              <p className="text-white text-[13px] font-bold leading-tight">Hi Emma</p>
              <p className="text-white/60 text-[10px] mb-2.5">How are you feeling today?</p>
              <div className="flex items-center gap-2 rounded-full bg-white/12 border border-white/15 px-3 py-2 mb-3.5">
                <FaSearch className="text-white/60 text-[10px]" />
                <span className="text-white/55 text-[10px]">Search doctors, medicines</span>
              </div>

              {/* quick actions */}
              <div className="grid grid-cols-4 gap-2 mb-3.5">
                {[
                  { p: 'devices/stethoscope', l: 'Doctors' },
                  { p: 'medications/medicines', l: 'Pharmacy' },
                  { p: 'devices/microscope', l: 'Labs' },
                  { p: 'vehicles/ambulance', l: 'Emergency' },
                ].map(a => (
                  <div key={a.l} className="flex flex-col items-center gap-1">
                    <span className="w-11 h-11 rounded-2xl bg-white/12 border border-white/15 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/healthicons/${a.p}.svg`} alt="" aria-hidden className="w-5 h-5 [filter:brightness(0)_invert(1)] opacity-90" />
                    </span>
                    <span className="text-white/75 text-[8px] font-medium">{a.l}</span>
                  </div>
                ))}
              </div>

              {/* upcoming appointment card */}
              <p className="text-white/70 text-[9px] font-semibold uppercase tracking-wide mb-1.5">Upcoming</p>
              <div className="rounded-2xl bg-surface p-2.5 flex items-center gap-2.5 shadow-lg">
                <span className="w-9 h-9 rounded-xl bg-[#0C6780]/15 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/healthicons/specialties/cardiology.svg" alt="" aria-hidden className="w-5 h-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-fg text-[11px] font-bold leading-tight">Dr. Amelia Cole</p>
                  <p className="text-soft text-[9px]">Cardiology  Today, 4:30 PM</p>
                </div>
                <span className="text-[8px] font-bold text-[#0C6780] bg-[#0C6780]/10 px-1.5 py-0.5 rounded-full">Video</span>
              </div>

              {/* bottom tab hint */}
              <div className="mt-auto -mx-4 px-6 py-2.5 bg-black/20 flex items-center justify-between">
                {['Home', 'Search', 'Care', 'Profile'].map((t, i) => (
                  <span key={t} className={`text-[8px] font-medium ${i === 0 ? 'text-brand-sky' : 'text-white/45'}`}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
