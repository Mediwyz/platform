'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useAppConfig } from '@/hooks/useAppConfig'
import { useTranslation } from '@/lib/i18n'
import { FaRobot, FaGooglePlay, FaApple } from 'react-icons/fa'
import WyzoAssistant, { Suggestion } from '@/components/shared/WyzoAssistant'

// Default chat starters mapped to the four hero capabilities.
const HERO_SUGGESTIONS: Suggestion[] = [
  { label: 'Assistant Santé IA', kind: 'ask' },
  { label: 'Un médecin en consultation vidéo', kind: 'search' },
  { label: 'Une infirmière à domicile', kind: 'search' },
  { label: 'Commander des médicaments en ligne', kind: 'ask' },
]

//  Props

interface HeroSectionProps {
  content?: {
    mainTitle?: string
    highlightWord?: string
    subtitle?: string
    platformBadge?: string
  }
  slides?: Array<{
    id: string
    title: string
    subtitle?: string | null
    imageUrl: string
    sortOrder: number
  }>
  countryCode?: string
}

// Full-bleed background scenes  each illustrates a core capability, with the
// caption (moved here from the old right-side card) that animates in as the
// background changes.
const DEFAULT_BG = [
  { src: '/images/landing/medical_team.jpg', title: 'Specialist & surgical care', sub: 'Consult verified specialists across 15+ fields' },
  { src: '/images/landing/telemedicine.jpg', title: 'Video consultations',        sub: 'See a doctor from anywhere, anytime' },
  { src: '/images/landing/hospital.jpg',     title: 'Hospital & ward care',       sub: 'Coordinated care across departments' },
  { src: '/images/landing/paramedics.jpg',   title: 'Vaccination & home nursing', sub: 'Preventive care and home visits' },
]

//  Component 

const HeroSection: React.FC<HeroSectionProps> = ({ content, slides }) => {
  const { config } = useAppConfig()
  const { t } = useTranslation()

  // Admin `slides` (title/subtitle/imageUrl) override the bundled backgrounds.
  const bg = slides && slides.length
    ? slides.map(s => ({ src: s.imageUrl, title: s.title, sub: s.subtitle ?? '' }))
    : DEFAULT_BG

  const [index, setIndex] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setIndex(p => (p + 1) % bg.length), 6000)
    return () => clearInterval(id)
  }, [bg.length])

  const titleParts = (content?.mainTitle || config.heroTitle || t('landing.heroTitle')).split(',')
  const caption = bg[index]

  return (
    <section
      className="relative overflow-hidden isolate"
      style={{ background: 'linear-gradient(135deg, #001E40 0%, #002B5C 55%, #0C6780 140%)', minHeight: 640 }}
    >
      {/*  Full-bleed background slider (Ken-Burns cross-fade)  */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <AnimatePresence>
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1, transition: { opacity: { duration: 1.4 }, scale: { duration: 6.5, ease: 'linear' } } }}
            exit={{ opacity: 0, transition: { duration: 1.4 } }}
            className="absolute inset-0"
          >
            <Image src={caption.src} alt="" fill priority={index === 0} className="object-cover object-center" sizes="100vw" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dark scrim (stronger on the left where the text sits) */}
      <div aria-hidden className="absolute inset-0 -z-10"
           style={{ background: 'linear-gradient(100deg, rgba(0,16,36,0.94) 0%, rgba(0,22,48,0.82) 48%, rgba(6,58,88,0.55) 100%)' }} />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-56 -z-10"
           style={{ background: 'linear-gradient(to top, rgba(0,14,32,0.85), transparent)' }} />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-20 blur-3xl"
             style={{ background: 'radial-gradient(circle, #9AE1FF 0%, transparent 70%)' }} />
        <div className="absolute inset-0 opacity-[0.03]"
             style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
      </div>

      {/*  The entire hero IS the chat UI: one big translucent agent panel.
           The background photo + Ken-Burns animation show through it; all the
           slogan/subtitle/suggestions live INSIDE the chat.  */}
      <div className="relative flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16" style={{ minHeight: 'inherit' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="w-full max-w-3xl mx-auto rounded-[28px] border border-white/15 bg-[#02132a]/45 backdrop-blur-xl shadow-[0_24px_70px_-20px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col"
        >
          {/* ── Agent identity zone: the slogan now lives inside the chat ── */}
          <div className="px-6 sm:px-10 pt-7 sm:pt-9 text-center">
            {/* animated caption synced to the background image */}
            <div className="h-7 mb-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.4 }}
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full pl-2 pr-4 py-1.5 border border-white/15"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-sky" />
                  <span className="text-xs font-semibold text-white">{caption.title}</span>
                  {caption.sub && <span className="hidden sm:inline text-[11px] text-white/55"> {caption.sub}</span>}
                </motion.div>
              </AnimatePresence>
            </div>

            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold mb-4 leading-[1.03] tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
              {titleParts.map((part, i) => (
                <span key={i} className={i === 1 ? 'text-brand-sky' : ''}>
                  {part.trim()}
                  {i === 0 && titleParts.length > 1 && ','}{i === 0 && titleParts.length > 1 && <br />}
                </span>
              ))}
            </h1>

            <p className="text-base sm:text-lg text-white/85 leading-relaxed max-w-2xl mx-auto mb-5">
              {content?.subtitle || t('landing.heroSubtitle')}
            </p>

            {/* App download badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-5">
              <a
                href="/MediWyz-v3.0.0-debug.apk"
                className="inline-flex items-center gap-2 rounded-xl bg-surface text-fg pl-3 pr-4 py-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky"
                aria-label="Get it on Google Play"
              >
                <FaGooglePlay className="text-lg" />
                <span className="flex flex-col leading-none">
                  <span className="text-[8px] uppercase tracking-wide text-soft">Get it on</span>
                  <span className="text-xs font-bold">Google Play</span>
                </span>
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/25 text-white pl-3 pr-4 py-2 backdrop-blur-sm hover:bg-white/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky"
                aria-label="Download on the App Store (coming soon)"
              >
                <FaApple className="text-lg" />
                <span className="flex flex-col leading-none">
                  <span className="text-[8px] uppercase tracking-wide text-white/60">Coming soon</span>
                  <span className="text-xs font-bold">App Store</span>
                </span>
              </a>
            </div>

            <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-brand-sky">
              <FaRobot className="animate-pulse" />
              <span>Bienvenue dans l&apos;ère Agentique — discutez avec notre IA santé</span>
            </div>
          </div>

          {/* ── The agent: suggestions + conversation + input, full width ── */}
          <div className="px-4 sm:px-7 pb-6 pt-4">
            <WyzoAssistant variant="hero" suggestions={HERO_SUGGESTIONS} />
          </div>
        </motion.div>
      </div>

      {/* background position dots */}
      <div className="absolute bottom-5 right-6 z-10 flex gap-1.5">
        {bg.map((_, i) => (
          <button key={i} onClick={() => setIndex(i)} aria-label={`Background ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'bg-brand-sky w-6' : 'bg-white/40 hover:bg-white/60 w-1.5'}`} />
        ))}
      </div>
    </section>
  )
}

export default HeroSection
