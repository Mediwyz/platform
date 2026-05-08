import HeroSection from '@/components/home/HeroSection'
import HowItWorksSection from '@/components/home/HowItWorksSection'
import CompanyTrustBar from '@/components/home/CompanyTrustBar'
import TestimonialsSection from '@/components/home/TestimonialsSection'
import DiscoverSection from '@/components/home/DiscoverSection'
import StickyCTABar from '@/components/home/StickyCTABar'

export default function HomePage() {
  return (
    <>
      {/* 1 — Hook: value prop + booking widget */}
      <HeroSection />

      {/* Sticky "Find Provider / Book Now" bar — appears after scrolling past hero */}
      <StickyCTABar />

      {/* 2 — Explain: 3-step "Search → Book → Consult" strip */}
      <HowItWorksSection />

      {/* 3 — Validate: partner logos + key stats marquee */}
      <CompanyTrustBar />

      {/* 4 — Social proof: patient testimonials */}
      <TestimonialsSection />

      {/* 5 — Explore: Services / Providers (with map) / Organisations (with map) / Community / Shop */}
      <DiscoverSection />
    </>
  )
}
