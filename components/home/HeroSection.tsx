'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useAppConfig } from '@/hooks/useAppConfig'
import { FaRobot, FaVideo, FaHome, FaPills } from 'react-icons/fa'

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
      className="overflow-hidden"
      style={{ background: '#001E40', minHeight: 400 }}
    >
      {/* ── 2-column flex row ─────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-stretch" style={{ minHeight: 'inherit' }}>

        {/* ── COL 1: Platform description (left, ~58%) ─────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="lg:flex-[58] flex flex-col justify-center
            px-6 sm:px-10 lg:px-12 xl:px-16
            py-8 sm:py-10 lg:py-12"
        >
          {/* Country flag + platform badge */}
          <div className="inline-flex self-start items-center bg-white/10 rounded-lg px-3 py-1.5 mb-5 border border-white/20">
            <CountryFlag countryCode={countryCode} className="mr-2" />
            <span className="text-xs font-semibold text-brand-sky tracking-wide uppercase">
              {content?.platformBadge || config.platformDescription || "Africa's #1 HealthTech Platform"}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold mb-4 leading-[1.08] text-white">
            {titleParts.map((part, i) => (
              <span key={i} className={i === 1 ? 'text-brand-sky' : ''}>
                {part.trim()}
                {i === 0 && titleParts.length > 1 && ','}{i === 0 && titleParts.length > 1 && <br />}
              </span>
            ))}
          </h1>

          <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-lg mb-6">
            {content?.subtitle ||
              "Connect with verified doctors, nurses, dentists, and 10+ specialist types across Africa — all in one secure platform."}
          </p>

          {/* Feature pills — clickable, navigate to the relevant Discover tab */}
          <div className="flex flex-wrap gap-2 mb-7">
            {[
              { icon: <FaRobot className="text-brand-sky" />, label: 'AI Health Assistant', href: '/ai-assistant' },
              { icon: <FaVideo className="text-brand-sky" />, label: 'Video Consultations',  tab: 'providers' },
              { icon: <FaHome  className="text-brand-sky" />, label: 'Home Visits',          tab: 'services'  },
              { icon: <FaPills className="text-brand-sky" />, label: 'Online Pharmacy',      tab: 'health-shop' },
            ].map(f => {
              const cls = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 border border-white/25 text-[11px] font-medium text-white hover:bg-white/25 transition-colors cursor-pointer"
              if ('href' in f) return (
                <a key={f.label} href={f.href} className={cls}>{f.icon} {f.label}</a>
              )
              return (
                <button key={f.label} type="button" className={cls} onClick={() => {
                  window.dispatchEvent(new CustomEvent('discover-tab', { detail: f.tab }))
                }}>
                  {f.icon} {f.label}
                </button>
              )
            })}
          </div>

          {/* Trust stats — dynamic from DB */}
          <div className="flex flex-wrap gap-6 sm:gap-8">
            {[
              { value: stats.providers >= 500 ? '500+' : `${stats.providers}+`, label: 'Verified Providers',  sub: 'across all specialties' },
              { value: `${stats.specialties}+`,                                  label: 'Medical Specialties', sub: 'doctors, nurses & more' },
              { value: `${stats.countries}`,                                      label: 'Countries',           sub: 'across Africa' },
              { value: `${stats.providerTypes}+`,                                 label: 'Provider Types',      sub: 'from 1 platform' },
            ].map(stat => (
              <div key={stat.label} className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-black text-white leading-none">{stat.value}</span>
                <span className="text-xs font-semibold text-white/80 mt-0.5">{stat.label}</span>
                <span className="text-[10px] text-white/40 mt-0.5">{stat.sub}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── COL 2: Image carousel (right, ~42%) ──────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.3 }}
          className="lg:flex-[42] relative overflow-hidden min-h-[260px]"
        >
          {/* Mobile image strip */}
          <div className="lg:hidden relative h-52">
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

          {/* Desktop full-height image carousel */}
          <div className="hidden lg:block absolute inset-0">
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
