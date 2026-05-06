import HeroSection from '@/components/home/HeroSection'
import CompanyTrustBar from '@/components/home/CompanyTrustBar'
import DiscoverSection from '@/components/home/DiscoverSection'
import NearMeSectionLoader from '@/components/home/NearMeSectionLoader'

export default function HomePage() {
  return (
    <>
      {/* 1 — Hook: book a slot or search; shows global availability by role */}
      <HeroSection />

      {/* 2 — Locate: Google Maps with all provider pins + directions; lazy-loaded */}
      <NearMeSectionLoader />

      {/* 3 — Validate: partner logos + key stats */}
      <CompanyTrustBar />

      {/* 4 — Explore: Services / Providers / Organisations / Community / Shop tabs */}
      <DiscoverSection />
    </>
  )
}
