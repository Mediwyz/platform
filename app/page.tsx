'use client'

import dynamic from 'next/dynamic'
import HeroSection from '@/components/home/HeroSection'
import HowItWorksSection from '@/components/home/HowItWorksSection'
import CompanyTrustBar from '@/components/home/CompanyTrustBar'
import WhyMediWyzSection from '@/components/home/WhyMediWyzSection'
import AppDownloadSection from '@/components/home/AppDownloadSection'
import FinalCtaSection from '@/components/home/FinalCtaSection'
import StickyCTABar from '@/components/home/StickyCTABar'

const CategoryNavigator = dynamic(() => import('@/components/home/CategoryNavigator'), { ssr: false })
const CommunityPosts    = dynamic(() => import('@/components/home/CommunityPosts'),    { ssr: false })

export default function HomePage() {
  return (
    <>
      {/* 1 — Hook: hero + image carousel + app badges */}
      <HeroSection />

      {/* Sticky "Book Now / Find Provider" bar — appears after scrolling past hero */}
      <StickyCTABar />

      {/* 2 — Explain: 3-step "Search → Book → Consult" */}
      <HowItWorksSection />

      {/* 3 — Discover: lightweight 3-level category navigator.
             The heavy provider/service lists + live Google Map now live on the
             dedicated /search/* pages (reached at the final step). */}
      <CategoryNavigator />

      {/* 4 — Value props: why choose MediWyz */}
      <WhyMediWyzSection />

      {/* 5 — Trust: partner logos + key stats marquee */}
      <CompanyTrustBar />

      {/* 6 — Mobile app download */}
      <AppDownloadSection />

      {/* 7 — Community posts */}
      <div id="community-section">
        <CommunityPosts />
      </div>

      {/* 8 — Final conversion CTA */}
      <FinalCtaSection />
    </>
  )
}
