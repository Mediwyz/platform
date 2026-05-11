'use client'

import dynamic from 'next/dynamic'
import HeroSection from '@/components/home/HeroSection'
import HowItWorksSection from '@/components/home/HowItWorksSection'
import CompanyTrustBar from '@/components/home/CompanyTrustBar'
import TestimonialsSection from '@/components/home/TestimonialsSection'
import StickyCTABar from '@/components/home/StickyCTABar'

const DiscoverSection = dynamic(() => import('@/components/home/DiscoverSection'), { ssr: false })
const CommunityPosts  = dynamic(() => import('@/components/home/CommunityPosts'),  { ssr: false })

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

      {/* 4 — Discover: tabbed (Providers / Services / Health Shop) with live Google Map */}
      <DiscoverSection />

      {/* 5 — Community posts */}
      <div id="community-section">
        <CommunityPosts />
      </div>

      {/* 6 — Social proof: patient testimonials */}
      <TestimonialsSection />
    </>
  )
}
