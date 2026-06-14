'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useAppConfig } from '@/hooks/useAppConfig'
import { FaRobot, FaVideo, FaHome, FaPills, FaGooglePlay, FaApple } from 'react-icons/fa'

interface HeroStats {
  providers: number
  specialties: number
  countries: number
  providerTypes: number
}

function useHeroStats(): HeroStats {
  const [stats, setStats] = useState<HeroStats>({ providers: 500, specialties: 15, countries: 6, providerTypes: 11 })

  useEffect(() => {
    Promise.all([
      fetch('/api/roles?searchEnabled=true').then(r => r.json()),
      fetch('/api/specialties').then(r => r.json()),
      fetch('/api/regions').then(r => r.json()),
    ]).then(([rolesJson, specJson, regionsJson]) => {
      const totalProviders = rolesJson.success
        ? (rolesJson.data as Array<{ providerCount: number }>).reduce((s, r) => s + (r.providerCount ?? 0), 0)
        : 500
      const specialtyCount = specJson.success ? (specJson.data as unknown[]).length : 15
      const countryCount   = regionsJson.success ? (regionsJson.data as unknown[]).length : 6
      const typeCount      = rolesJson.success
        ? (rolesJson.data as unknown[]).filter((r: any) => r.isProvider).length
        : 11
      setStats({
        providers:     Math.max(totalProviders, 1),
        specialties:   Math.max(specialtyCount, 1),
        countries:     Math.max(countryCount, 1),
        providerTypes: Math.max(typeCount, 1),
      })
    }).catch(() => {})
  }, [])

  return stats
}

// ─── Flag mini-icons ──────────────────────────────────────────────────────────

const flags: Record<string, React.ReactNode> = {
  MU: (
    <div className="inline-flex flex-col rounded-sm overflow-hidden">
      <div className="h-1.5 w-6 bg-red-600" />
      <div className="h-1.5 w-6 bg-brand-navy" />
      <div className="h-1.5 w-6 bg-yellow-400" />
      <div className="h-1.5 w-6 bg-green-600" />
    </div>
  ),
  MG: (
    <div className="inline-flex rounded-sm overflow-hidden">
      <div className="w-2 h-6 bg-white" />
      <div className="inline-flex flex-col">
        <div className="h-3 w-4 bg-red-600" />
        <div className="h-3 w-4 bg-green-600" />
      </div>
    </div>
  ),
  KE: (
    <div className="inline-flex flex-col rounded-sm overflow-hidden">
      <div className="h-1.5 w-6 bg-black" />
      <div className="h-0.5 w-6 bg-white" />
      <div className="h-1.5 w-6 bg-red-600" />
      <div className="h-0.5 w-6 bg-white" />
      <div className="h-1.5 w-6 bg-green-700" />
    </div>
  ),
  FR: (
    <div className="inline-flex rounded-sm overflow-hidden">
      <div className="w-2 h-6 bg-blue-700" />
      <div className="w-2 h-6 bg-white" />
      <div className="w-2 h-6 bg-red-600" />
    </div>
  ),
}

function CountryFlag({ countryCode, className = '' }: { countryCode: string; className?: string }) {
  return <div className={className}>{flags[countryCode] || flags.MU}</div>
}

// ─── Props ────────────────────────────────────────────────────────────────────

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

// ─── Image animation variants ─────────────────────────────────────────────────

const imageVariants = {
  enter:  { opacity: 0, scale: 1.06 },
  center: { opacity: 1, scale: 1, transition: { duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] as const } },
  exit:   { opacity: 0, scale: 0.97, transition: { duration: 0.5, ease: [0.55, 0.085, 0.68, 0.53] as const } },
}

// ─── Component ────────────────────────────────────────────────────────────────

const HeroSection: React.FC<HeroSectionProps> = ({ content, slides, countryCode = 'MU' }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const { config } = useAppConfig()
  const stats = useHeroStats()

  const defaultHeroImages = [
    { src: '/images/hero/gemini-doctor-3-removebg-1.png', alt: 'Specialist Medical Doctor',  title: 'Medical Specialists',      description: 'Consult verified specialists across 15+ fields' },
    { src: '/images/hero/medicine-1.png',                 alt: 'Buy medicines online',        title: 'Medicine Store',           description: 'Order prescriptions & wellness products online' },
    { src: '/images/hero/doctor-1.png',                   alt: 'Professional Doctor',         title: 'Expert Medical Care',      description: 'Qualified professionals at your service' },
    { src: '/images/hero/ambulance-1.png',                alt: 'Emergency Ambulance',         title: 'Emergency Services',       description: 'Rapid response when every second counts' },
    { src: '/images/hero/insurance-1.png',                alt: 'Health Insurance',            title: 'Insurance Protection',     description: 'Coverage plans for individuals & families' },
    { src: '/images/hero/nurse-1.png',                    alt: 'Professional Nurse',          title: 'Nursing Excellence',       description: 'Home visits & ongoing health monitoring' },
    { src: '/images/hero/doctor-2.png',                   alt: 'Experienced Doctor',          title: 'Healthcare Professionals', description: 'Trusted providers verified by MediWyz' },
    { src: '/images/hero/patient-1.png',                  alt: 'Patient Care',                title: 'Patient-Centered Care',   description: 'Your health journey, our commitment' },
  ]

  const heroImages = slides
    ? slides.map(s => ({ src: s.imageUrl, alt: s.subtitle || s.title, title: s.title, description: s.subtitle ?? undefined }))
    : defaultHeroImages

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [heroImages.length])

  const titleParts = (content?.mainTitle || config.heroTitle || 'Healthcare, Reimagined').split(',')

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #001E40 0%, #002B5C 55%, #0C6780 140%)', minHeight: 320 }}
    >
      {/* Decorative backdrop · soft sky/teal glows + faint grid (pure CSS, no extra assets) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-30 blur-3xl"
             style={{ background: 'radial-gradient(circle, #9AE1FF 0%, transparent 70%)' }} />
        <div className="absolute -bottom-32 right-1/4 w-[28rem] h-[28rem] rounded-full opacity-20 blur-3xl"
             style={{ background: 'radial-gradient(circle, #0C6780 0%, transparent 70%)' }} />
        <div className="absolute inset-0 opacity-[0.04]"
             style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
      </div>

      {/* ── 2-column flex row ─────────────────────────────────────── */}
      <div className="relative flex flex-col lg:flex-row lg:items-stretch" style={{ minHeight: 'inherit' }}>

        {/* ── COL 1: Platform description (left, ~58%) ─────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="lg:flex-[58] flex flex-col justify-center
            px-6 sm:px-10 lg:px-12 xl:px-16
            py-7 sm:py-9 lg:py-12"
        >
          {/* Country flag + platform badge */}
          <div className="inline-flex self-start items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full pl-2 pr-3.5 py-1.5 mb-6 border border-white/20 shadow-sm">
            <CountryFlag countryCode={countryCode} />
            <span className="text-[11px] font-semibold text-brand-sky tracking-wide uppercase">
              {content?.platformBadge || config.platformDescription || "Africa's #1 HealthTech Platform"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl xl:text-[2.6rem] font-bold mb-4 leading-[1.12] tracking-tight text-white">
            {titleParts.map((part, i) => (
              <span key={i} className={i === 1 ? 'text-brand-sky' : ''}>
                {part.trim()}
                {i === 0 && titleParts.length > 1 && ','}{i === 0 && titleParts.length > 1 && <br />}
              </span>
            ))}
          </h1>

          <p className="text-sm sm:text-[15px] text-gray-300/90 leading-relaxed max-w-lg mb-6">
            {content?.subtitle ||
              "Connect with verified doctors, nurses, dentists, and 10+ specialist types across Africa — all in one secure platform."}
          </p>

          {/* App download badges */}
          <div className="flex flex-wrap items-center gap-3 mb-7">
            <a
              href="/MediWyz-v3.0.0-debug.apk"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-[#001E40] pl-3 pr-4 py-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky"
              aria-label="Get it on Google Play"
            >
              <FaGooglePlay className="text-lg" />
              <span className="flex flex-col leading-none">
                <span className="text-[8px] uppercase tracking-wide text-gray-500">Get it on</span>
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

          {/* Feature pills — clickable, scroll to the relevant section */}
          <div className="flex flex-wrap gap-2 mb-7">
            {[
              { icon: <FaRobot className="text-brand-sky" />, label: 'AI Health Assistant', href: '/ai-assistant' },
              { icon: <FaVideo className="text-brand-sky" />, label: 'Video Consultations',  sectionId: 'discover-section' },
              { icon: <FaHome  className="text-brand-sky" />, label: 'Home Visits',          sectionId: 'discover-section' },
              { icon: <FaPills className="text-brand-sky" />, label: 'Online Pharmacy',      sectionId: 'discover-section' },
            ].map(f => {
              const cls = "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/10 border border-white/20 text-[11px] font-medium text-white hover:bg-white/20 hover:border-brand-sky/50 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky"
              if ('href' in f) return (
                <a key={f.label} href={f.href} className={cls}>{f.icon} {f.label}</a>
              )
              return (
                <button key={f.label} type="button" className={cls} onClick={() => {
                  document.getElementById(f.sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}>
                  {f.icon} {f.label}
                </button>
              )
            })}
          </div>

          {/* Trust stats — dynamic from DB · subtle glass stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 max-w-xl">
            {[
              { value: stats.providers >= 500 ? '500+' : `${stats.providers}+`, label: 'Verified Providers',  sub: 'across all specialties' },
              { value: `${stats.specialties}+`,                                  label: 'Medical Specialties', sub: 'doctors, nurses & more' },
              { value: `${stats.countries}`,                                      label: 'Countries',           sub: 'across Africa' },
              { value: `${stats.providerTypes}+`,                                 label: 'Provider Types',      sub: 'from 1 platform' },
            ].map(stat => (
              <div key={stat.label} className="flex flex-col rounded-xl bg-white/[0.06] border border-white/10 px-3 py-2.5 backdrop-blur-sm">
                <span className="text-xl sm:text-2xl font-black text-white leading-none">{stat.value}</span>
                <span className="text-[11px] font-semibold text-white/85 mt-1">{stat.label}</span>
                <span className="text-[9px] text-white/45 mt-0.5 leading-tight">{stat.sub}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── COL 2: Image carousel (right, ~42%) ──────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.3 }}
          className="lg:flex-[42] relative overflow-hidden min-h-[200px]"
        >
          {/* Mobile image strip */}
          <div className="lg:hidden relative h-44">
            <AnimatePresence mode="wait">
              <motion.div
                key={`mobile-${currentImageIndex}`}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1, transition: { duration: 0.8 } }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
              >
                <Image
                  src={heroImages[currentImageIndex].src}
                  alt={heroImages[currentImageIndex].alt}
                  fill
                  className="object-cover object-center"
                  sizes="100vw"
                />
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-[#001E40]/80 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5">
              <div className="w-0.5 h-6 rounded-full bg-[#9AE1FF] flex-shrink-0" />
              <p className="text-xs font-bold text-white leading-tight">{heroImages[currentImageIndex].title}</p>
            </div>
            <div className="absolute top-3 right-3 flex gap-1">
              {heroImages.map((_, i) => (
                <button key={i} onClick={() => setCurrentImageIndex(i)} aria-label={`Slide ${i + 1}`}
                  className={`h-1 rounded-full transition-all duration-300 ${i === currentImageIndex ? 'bg-white w-4' : 'bg-white/40 w-1'}`} />
              ))}
            </div>
          </div>

          {/* Desktop image carousel — smaller rounded card with vertical margin spacing */}
          <div className="hidden lg:block absolute inset-y-10 inset-x-8 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/15">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImageIndex}
                variants={imageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0"
              >
                <Image
                  src={heroImages[currentImageIndex].src}
                  alt={heroImages[currentImageIndex].alt}
                  fill
                  className="object-cover object-center"
                  sizes="42vw"
                  priority={currentImageIndex === 0}
                />
              </motion.div>
            </AnimatePresence>

            {/* Bottom gradient for caption legibility */}
            <div
              className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-10"
              style={{ background: 'linear-gradient(to top, rgba(0,10,30,0.95) 0%, rgba(0,10,30,0.5) 60%, transparent 100%)' }}
            />

            {/* Image caption */}
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-10 z-20">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`caption-${currentImageIndex}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.4 }}
                  className="flex items-start gap-2"
                >
                  <div className="w-0.5 h-8 rounded-full bg-brand-sky flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-white leading-tight">
                      {heroImages[currentImageIndex].title}
                    </p>
                    {heroImages[currentImageIndex].description && (
                      <p className="text-[11px] text-white/60 mt-0.5 leading-relaxed">
                        {heroImages[currentImageIndex].description}
                      </p>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Carousel dots */}
              <div className="flex gap-1.5 mt-3">
                {heroImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    aria-label={`Slide ${index + 1}`}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      index === currentImageIndex
                        ? 'bg-white w-5'
                        : 'bg-white/30 hover:bg-white/50 w-1'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}

export default HeroSection
