'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const NearMeSectionDesktop = dynamic(() => import('./NearMeSection'), {
  ssr: false,
  loading: () => (
    <div className="bg-[#001E40] flex items-center justify-center" style={{ minHeight: 420 }}>
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-brand-sky border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-white/50 text-sm">Loading map…</p>
      </div>
    </div>
  ),
})

const NearMeSectionMobile = dynamic(() => import('./NearMeSectionMobile'), { ssr: false })

export default function NearMeSectionLoader() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  useEffect(() => {
    // Only skip Google Maps on genuinely narrow viewports (phones in portrait)
    // Avoid touch detection — navigator.maxTouchPoints > 0 is true on most Windows/Chrome desktops
    setIsMobile(window.innerWidth < 768)
  }, [])

  if (isMobile === null) {
    return (
      <div className="bg-[#001E40] flex items-center justify-center" style={{ minHeight: 420 }}>
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-brand-sky border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/50 text-sm">Loading…</p>
        </div>
      </div>
    )
  }

  return isMobile ? <NearMeSectionMobile /> : <NearMeSectionDesktop />
}
