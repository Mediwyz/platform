'use client'

import HeroSection from '@/components/home/HeroSection'
import HowItWorksSection from '@/components/home/HowItWorksSection'
import CompanyTrustBar from '@/components/home/CompanyTrustBar'
import WhyMediWyzSection from '@/components/home/WhyMediWyzSection'
import FeatureShowcase from '@/components/home/FeatureShowcase'
import ProductTour from '@/components/home/ProductTour'
import AppDownloadSection from '@/components/home/AppDownloadSection'
import FinalCtaSection from '@/components/home/FinalCtaSection'
import StickyCTABar from '@/components/home/StickyCTABar'
import StatsBand from '@/components/home/StatsBand'
import ForProvidersSection from '@/components/home/ForProvidersSection'
import TrustSecuritySection from '@/components/home/TrustSecuritySection'
import dynamic from 'next/dynamic'

const CategoryNavigator = dynamic(() => import('@/components/home/CategoryNavigator'), { ssr: false })

export default function HomePage() {
  return (
    <>
      {/* 1 - Hook: hero + image carousel + app badges */}
      <HeroSection />

      {/* Sticky "Book Now / Find Provider" bar - appears after scrolling past hero */}
      <StickyCTABar />

      {/* 2 - Discover first: it's what users come to do - 3-level category navigator → /search/* (live map at final step) */}
      <CategoryNavigator />

      {/* 3 - Explain: 3-step "Search → Book → Consult" */}
      <HowItWorksSection />

      {/* 3b - Impact stats band (animated counters) */}
      <StatsBand />

      {/* 4 - Feature showcase: every capability of the platform (bento grid) */}
      <FeatureShowcase />

      {/* 4b - Product tour: real screenshots of the live app (member + provider) */}
      <ProductTour />

      {/* 5 - Value props: why choose MediWyz */}
      <WhyMediWyzSection />

      {/* 5b - For providers: grow your practice (supply side) */}
      <ForProvidersSection />

      {/* 6 - Trust: partner logos + key stats marquee */}
      <CompanyTrustBar />

      {/* 7 - Mobile app download */}
      <AppDownloadSection />

      {/* 7b - Trust & security + FAQ */}
      <TrustSecuritySection />

      {/* 8 - Final conversion CTA */}
      <FinalCtaSection />
    </>
  )
}
