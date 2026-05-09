import dynamic from 'next/dynamic'
import HeroSection from '@/components/home/HeroSection'
import HowItWorksSection from '@/components/home/HowItWorksSection'
import CompanyTrustBar from '@/components/home/CompanyTrustBar'
import TestimonialsSection from '@/components/home/TestimonialsSection'
import StickyCTABar from '@/components/home/StickyCTABar'

const ServicesSection        = dynamic(() => import('@/components/home/ServicesSection'),        { ssr: false })
const ProvidersSection       = dynamic(() => import('@/components/home/ProvidersSection'),       { ssr: false })
const HealthShopMarketplace  = dynamic(() => import('@/components/home/HealthShopMarketplace'),  { ssr: false })
const CommunityPosts         = dynamic(() => import('@/components/home/CommunityPosts'),         { ssr: false })

export default function HomePage() {
  return (
    <>
      {/* 1 — Hook: hero + image carousel */}
      <HeroSection />

      {/* Sticky "Book Now / Find Provider" bar — appears after scrolling past hero */}
      <StickyCTABar />

      {/* 2 — Explain: 3-step "Search → Book → Consult" strip */}
      <HowItWorksSection />

      {/* 3 — Trust: partner logos + key stats marquee */}
      <CompanyTrustBar />

      {/* 4 — Discover: always-visible sections (no tab clicks required) */}
      <div id="services-section">
        <ServicesSection />
      </div>

      <div id="health-shop-section">
        <HealthShopMarketplace />
      </div>

      <div id="providers-section">
        <ProvidersSection />
      </div>

      <div id="community-section">
        <CommunityPosts />
      </div>

      {/* 5 — Social proof: patient testimonials */}
      <TestimonialsSection />
    </>
  )
}
