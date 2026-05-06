import HeroSection from '@/components/home/HeroSection'
import CompanyTrustBar from '@/components/home/CompanyTrustBar'
import DiscoverSection from '@/components/home/DiscoverSection'
import NearMeSectionLoader from '@/components/home/NearMeSectionLoader'

export default function HomePage() {
  return (
    <>
      {/* 1 — Hook: book a slot or search; shows global availability by role */}
      <HeroSection />

      {/* 2 — Validate: partner logos + key stats (flows dark→dark with hero) */}
      <CompanyTrustBar />

      {/* 3 — Explore: Services / Providers / Organisations / Community / Shop tabs */}
      <DiscoverSection />

      {/* 4 — Locate: Google Maps with all provider pins + directions; lazy-loaded */}
      <NearMeSectionLoader />
    </>
  )
}
