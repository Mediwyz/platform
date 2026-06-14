'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import Navbar from './Navbar'

// These public entry-points always show the navbar — regardless of auth state.
const ALWAYS_SHOW = new Set(['/', '/login', '/signup'])

// These path prefixes always show the navbar — even when authenticated.
// NOTE: '/search/' is intentionally excluded — those pages are wrapped by
// SearchDashboardWrapper, which renders its own header. Showing the global
// Navbar too produced two stacked headers.
const PUBLIC_SHOW_PREFIXES = ['/about', '/contact']

const DASHBOARD_PREFIXES = [
  // Role-prefix routes
  '/patient/', '/doctor/', '/nurse/', '/nanny/', '/pharmacist/',
  '/lab-technician/', '/responder/', '/insurance/', '/corporate/',
  '/referral-partner/', '/admin/', '/regional/',
  '/caregiver/', '/physiotherapist/', '/dentist/', '/optometrist/', '/nutritionist/',
  // Dynamic provider route
  '/provider/',
  // Clean URL dashboard routes
  '/practice', '/inventory', '/services', '/workflows',
  '/billing', '/video', '/messages', '/ai-assistant', '/my-health',
  '/profile', '/network', '/booking-requests', '/bookings/',
  '/my-consultations', '/my-nurse-services', '/my-childcare',
  '/my-emergency', '/my-health-records', '/my-lab-results',
  '/my-insurance', '/my-prescriptions', '/roles', '/administration',
  '/pharmacy', '/book', '/my-company',
  // Password-reset / verification — have their own minimal layout
  '/reset-password', '/verify',
]

function isDashboardPath(pathname: string) {
  return DASHBOARD_PREFIXES.some(p => pathname.startsWith(p))
    || DASHBOARD_PREFIXES.some(p => pathname === p.replace(/\/$/, ''))
}

export default function ConditionalNavbar() {
  const pathname = usePathname() || ''
  const { user } = useUser()
  const [authCookie, setAuthCookie] = useState<boolean | null>(null)

  useEffect(() => {
    setAuthCookie(document.cookie.includes('mediwyz_userType='))
  }, [pathname])

  // Landing page, login, and signup always get the navbar — no auth check.
  if (ALWAYS_SHOW.has(pathname)) return <Navbar />

  // Public search/browse pages always show the navbar, even when authenticated.
  if (PUBLIC_SHOW_PREFIXES.some(p => pathname.startsWith(p))) return <Navbar />

  // All dashboard / internal paths — suppress entirely.
  if (isDashboardPath(pathname)) return null

  // Other public paths: only show when definitely not authenticated.
  if (authCookie !== false) return null
  if (user) return null

  return <Navbar />
}
