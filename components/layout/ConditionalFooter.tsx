'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Footer from './Footer'

// ISO-2 country codes that map to `/[countryCode]` landing pages.
const COUNTRY_HOME_CODES = new Set([
  'MG', 'KE', 'IN', 'FR', 'DE', 'GB', 'US', 'ZA', 'MU',
  'SC', 'TZ', 'UG', 'NG', 'GH', 'SN', 'MA', 'EG', 'AE',
])

function isHomePage(pathname: string): boolean {
  if (pathname === '/') return true
  // Match `/MU`, `/KE`, `/MU/`, etc. - single-segment uppercase ISO-2 codes.
  const match = pathname.match(/^\/([A-Z]{2})\/?$/i)
  return !!match && COUNTRY_HOME_CODES.has(match[1].toUpperCase())
}

export default function ConditionalFooter() {
 const pathname = usePathname()
 const [isMobile, setIsMobile] = useState(false)

 useEffect(() => {
 const check = () => setIsMobile(window.innerWidth < 640)
 check()
 window.addEventListener('resize', check)
 return () => window.removeEventListener('resize', check)
 }, [])

 const showFooter = isHomePage(pathname)

 // Hide footer on home page for mobile (swipe wrapper handles it)
 if (showFooter && isMobile) return null

 return showFooter ? <Footer /> : null
}
