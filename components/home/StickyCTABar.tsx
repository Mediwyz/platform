'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { FaSearch } from 'react-icons/fa'
import { useTranslation } from '@/lib/i18n'

export default function StickyCTABar() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* Sentinel placed at the bottom of the hero section */}
      <div ref={sentinelRef} aria-hidden="true" />

      {/* Sticky bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
        aria-hidden={!visible}
      >
        <div className="bg-[#001E40]/95 backdrop-blur-sm border-t border-white/10 px-4 py-3 sm:py-2.5">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <FaSearch className="text-[#9AE1FF] text-sm flex-shrink-0 hidden sm:block" />
            <p className="text-xs sm:text-sm text-white/80 flex-1 leading-tight">
              <span className="font-semibold text-white">{t('landing.stickyProvidersBadge')}</span> {t('landing.stickyProvidersSub')}
            </p>
            <div className="flex gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('discover-tab', { detail: 'providers' }))
                  document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
              >
                {t('landing.stickyFindProvider')}
              </button>
              <Link
                href="/search/services"
                className="px-3 py-1.5 rounded-lg bg-[#0C6780] text-xs font-semibold text-white hover:bg-[#0a5c73] transition-colors"
              >
                {t('landing.stickyBookNow')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
