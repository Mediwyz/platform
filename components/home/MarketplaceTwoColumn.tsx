'use client'

import ProviderMarketplace from './ProviderMarketplace'
import HealthShopMarketplace from './HealthShopMarketplace'

/** Both cards share the same height and equal width (50/50). */
const CARD_HEIGHT = 'h-[780px] sm:h-[840px] lg:h-[880px]'

export default function MarketplaceTwoColumn() {
  return (
    <section className="py-4 sm:py-6 lg:py-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 xl:gap-8 items-stretch">

          {/* LEFT - Health Service Providers */}
          <div className={`min-w-0 flex flex-col
            rounded-2xl bg-white border border-gray-100
            shadow-[0_4px_32px_-4px_rgba(0,30,64,0.08)]
            hover:shadow-[0_8px_48px_-4px_rgba(0,30,64,0.14)]
            transition-shadow duration-300 overflow-hidden
            ${CARD_HEIGHT}`}>
            <ProviderMarketplace embedded />
          </div>

          {/* RIGHT - Health Shop */}
          <div className={`min-w-0 flex flex-col
            rounded-2xl bg-white border border-gray-100
            shadow-[0_4px_32px_-4px_rgba(12,103,128,0.10)]
            hover:shadow-[0_8px_48px_-4px_rgba(12,103,128,0.18)]
            transition-shadow duration-300 overflow-hidden
            ${CARD_HEIGHT}`}>
            <HealthShopMarketplace embedded />
          </div>

        </div>
      </div>
    </section>
  )
}
