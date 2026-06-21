'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import {
 FaHome,
 FaUserMd,
 FaPills,
 FaRobot,
 FaPhone,
 FaBars,
 FaTimes,
 FaInfoCircle,
 FaUserNurse,
 FaAmbulance,
 FaBaby,
 FaChevronDown,
 FaUser,
 FaSignOutAlt,
} from 'react-icons/fa'

import HealthwyzLogo from '@/components/ui/HealthwyzLogo'
import SearchAutocomplete from '@/components/search/SearchAutocomplete'
import LanguageSwitcher from '@/components/shared/LanguageSwitcher'
import { useCapacitor } from '@/hooks/useCapacitor'
import { getProfilePath } from '@/lib/navigation/profilePath'
import * as FaIcons from 'react-icons/fa'

type ServiceItem = { href: string; label: string; desc: string; icon: React.ComponentType<{ className?: string }>; color: string }
type ServiceCategories = Record<string, ServiceItem[]>

// Static fallback (used until API loads)
const staticCategories: ServiceCategories = {
 'Healthcare Services': [
   { href: '/search/doctors', label: 'Find Doctors', desc: 'Book GP & specialist consultations', icon: FaUserMd, color: 'bg-brand-navy' },
   { href: '/search/nurses', label: 'Nursing Care', desc: 'Home visits & health monitoring', icon: FaUserNurse, color: 'bg-brand-teal' },
   { href: '/search/childcare', label: 'Childcare', desc: 'Trusted nannies & child services', icon: FaBaby, color: 'bg-brand-navy' },
   { href: '/search/emergency', label: 'Emergency', desc: 'Ambulance & first response', icon: FaAmbulance, color: 'bg-red-500' },
 ],
 'Digital Health': [
   { href: '/search/health-shop', label: 'Health Shop', desc: 'Products from all providers', icon: FaPills, color: 'bg-brand-navy' },
   { href: '/search/ai', label: 'AI Support', desc: 'AI-powered health assistant', icon: FaRobot, color: 'bg-brand-teal' },
 ],
}

function resolveIcon(iconName: string): React.ComponentType<{ className?: string }> {
  return (FaIcons as Record<string, React.ComponentType<{ className?: string }>>)[iconName] || FaUser
}

function buildDynamicCategories(roles: { slug: string; label: string; icon: string; description: string | null; displayOrder: number }[]): ServiceCategories {
  const half = Math.ceil(roles.length / 2)
  const group1 = roles.slice(0, half)
  const group2 = roles.slice(half)

  const cats: ServiceCategories = { 'Healthcare Services': [], 'Medical Services': [] }

  for (const r of group1) {
    cats['Healthcare Services'].push({
      href: `/search/${r.slug}`,
      label: r.label,
      desc: r.description || `Find ${r.label.toLowerCase()}`,
      icon: resolveIcon(r.icon),
      color: cats['Healthcare Services'].length % 2 === 0 ? 'bg-brand-navy' : 'bg-brand-teal',
    })
  }
  for (const r of group2) {
    cats['Medical Services'].push({
      href: `/search/${r.slug}`,
      label: r.label,
      desc: r.description || `Find ${r.label.toLowerCase()}`,
      icon: resolveIcon(r.icon),
      color: cats['Medical Services'].length % 2 === 0 ? 'bg-brand-navy' : 'bg-brand-teal',
    })
  }

  // Always add Health Shop + AI at end
  cats['Digital Health'] = [
    { href: '/search/health-shop', label: 'Health Shop', desc: 'Products from all providers', icon: FaPills, color: 'bg-brand-navy' },
    { href: '/search/ai', label: 'AI Support', desc: 'AI-powered health assistant', icon: FaRobot, color: 'bg-brand-teal' },
  ]

  return cats
}

// Static fallback mapping (used until roles load from DB)
const STATIC_COOKIE_TO_SLUG: Record<string, string> = {
 patient: 'patient',
 doctor: 'doctor',
 nurse: 'nurse',
 'child-care-nurse': 'nanny',
 pharmacy: 'pharmacist',
 lab: 'lab-technician',
 ambulance: 'responder',
 insurance: 'insurance',
 corporate: 'corporate',
 'referral-partner': 'referral-partner',
 admin: 'admin',
 'regional-admin': 'regional',
 caregiver: 'caregiver',
 physiotherapist: 'physiotherapist',
 dentist: 'dentist',
 optometrist: 'optometrist',
 nutritionist: 'nutritionist',
}

const Navbar: React.FC = () => {
 const router = useRouter()
 const { user: authUser, clearUser } = useUser()
 const isCapacitor = useCapacitor()
 const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false)
 const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
 const [isMobile, setIsMobile] = useState<boolean>(false)
 const [profileHref, setProfileHref] = useState('/login')
 const [serviceCategories, setServiceCategories] = useState<ServiceCategories>(staticCategories)
 const [cookieToSlug, setCookieToSlug] = useState<Record<string, string>>(STATIC_COOKIE_TO_SLUG)

 // Fetch roles dynamically for navbar dropdown + cookie mapping
 useEffect(() => {
   fetch('/api/roles?searchEnabled=true')
     .then(r => r.json())
     .then(json => {
       if (json.success && json.data?.length > 0) {
         setServiceCategories(buildDynamicCategories(json.data))
         // Build cookie-to-slug from roles
         const map: Record<string, string> = { ...STATIC_COOKIE_TO_SLUG }
         for (const role of json.data) {
           if (role.cookieValue && role.urlPrefix) {
             map[role.cookieValue] = role.urlPrefix.replace(/^\//, '')
           }
         }
         setCookieToSlug(map)
       }
     })
     .catch(() => {})
 }, [])
 useEffect(() => {
 const handleResize = () => {
 setIsMobile(window.innerWidth < 640)
 }

 handleResize()
 window.addEventListener('resize', handleResize)

 return () => window.removeEventListener('resize', handleResize)
 }, [])

 // Get userType slug from cookie
 useEffect(() => {
 const match = document.cookie
 .split(';')
 .find((c) => c.trim().startsWith('mediwyz_userType='))
 if (match) {
 const cookieVal = decodeURIComponent(match.trim().split('=')[1] ?? '')
 setProfileHref(getProfilePath(cookieVal))
 }
 }, [cookieToSlug])

 const handleLogout = useCallback(async () => {
 try {
 await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
 } catch { /* ignore */ }
 clearUser()
 document.cookie = 'mediwyz_token=; path=/; max-age=0'
 document.cookie = 'mediwyz_userType=; path=/; max-age=0'
 router.push('/login')
 }, [router, clearUser])

 const toggleDropdown = (category: string) => {
 setActiveDropdown(activeDropdown === category ? null : category)
 }

 const isLoggedIn = !!authUser

 // Search pages are public - never prepend user slug
 const getServiceHref = (href: string) => href

 return (
 <nav role="navigation" aria-label="Main navigation" className="sticky top-0 z-50">
 {/* Spacer for Android status bar in Capacitor WebView */}
 {isCapacitor && <div className="bg-brand-navy h-14" />}
 {/* Brand gradient accent line */}
 <div className="h-1 bg-brand-teal " />
 <div
 className="backdrop-blur-md shadow-md border-b border-white/10 py-1.5"
 style={{ background: 'linear-gradient(135deg, rgba(0,30,64,0.96) 0%, rgba(12,103,128,0.96) 140%)' }}
 >
 {/* Skip to content link */}
 <a
 href="#main-content"
 className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
 >
 Skip to main content
 </a>
 <div className="container mx-auto px-3 sm:px-4 lg:px-6">
 <div className="flex justify-between items-center h-10 lg:h-11">
 {/* Logo */}
 <Link href="/" className="flex items-center space-x-2 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal rounded-md">
 <HealthwyzLogo
 width={isMobile ? 120 : 150}
 height={isMobile ? 34 : 40}
 light
 />
 </Link>

 {/* Desktop Navigation */}
 <div className="hidden xl:flex items-center space-x-6">
 <Link
 href="/"
 className="flex items-center space-x-1 text-white/90 hover:text-white transition-colors duration-200 px-2 py-1 rounded-md hover:bg-white/10"
 >
 <FaHome className="text-sm" />
 <span className="text-sm font-medium">Home</span>
 </Link>

 {/* Services Dropdown - hidden when logged in (accessible from dashboard sidebar) */}
 {!isLoggedIn && (
 <div className="relative group">
 <button
 className="flex items-center space-x-1 text-white/90 hover:text-white transition-colors duration-200 px-2 py-1 rounded-md hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
 aria-haspopup="true"
 aria-label="Services menu"
 >
 <FaUserMd className="text-sm" aria-hidden="true" />
 <span className="text-sm font-medium">Services</span>
 <FaChevronDown className="text-xs" aria-hidden="true" />
 </button>

 <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[580px] bg-white rounded-2xl shadow-2xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
 <div className="p-5">
 {Object.entries(serviceCategories).map(([category, services]) => (
 <div key={category} className="mb-4 last:mb-0">
 <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5 px-1">{category}</h4>
 <div className="grid grid-cols-2 gap-2">
 {services.map((service) => (
 <Link
 key={service.href}
 href={getServiceHref(service.href)}
 className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group/card"
 >
 <div className={`w-10 h-10 rounded-xl ${service.color} flex items-center justify-center flex-shrink-0 shadow-sm group-hover/card:shadow-md transition-shadow`}>
 <service.icon className="text-white text-sm" />
 </div>
 <div className="min-w-0">
 <p className="text-sm font-semibold text-gray-900 group-hover/card:text-brand-teal transition-colors">{service.label}</p>
 <p className="text-[11px] text-gray-400 leading-tight">{service.desc}</p>
 </div>
 </Link>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 <Link
 href="/about"
 className="flex items-center space-x-1 text-white/90 hover:text-white transition-colors duration-200 px-2 py-1 rounded-md hover:bg-white/10"
 >
 <FaInfoCircle className="text-sm" />
 <span className="text-sm font-medium">About</span>
 </Link>

 <Link
 href="/contact"
 className="flex items-center space-x-1 text-white/90 hover:text-white transition-colors duration-200 px-2 py-1 rounded-md hover:bg-white/10"
 >
 <FaPhone className="text-sm" />
 <span className="text-sm font-medium">Contact</span>
 </Link>
 </div>

 {/* Right: Search, Language, Auth */}
 <div className="hidden md:flex items-center space-x-3">
 <div className="hidden lg:block w-48 xl:w-64">
 <SearchAutocomplete variant="navbar" placeholder="Search doctors, medicines..." />
 </div>

 <LanguageSwitcher variant="navbar" />

 {isLoggedIn ? (
 <>
 <Link
 href={profileHref}
 className="flex items-center gap-1.5 px-3 py-2 text-white/90 hover:text-brand-teal hover:bg-white/10 rounded-lg transition-colors text-sm font-medium"
 >
 <FaUser className="text-sm" />
 <span>My Profile</span>
 </Link>
 <button
 onClick={handleLogout}
 className="flex items-center gap-1.5 px-3 py-2 text-white rounded-lg transition text-sm font-medium"
 >
 <FaSignOutAlt className="text-sm" />
 <span>Logout</span>
 </button>
 </>
 ) : (
 <>
 <Link
 href="/login"
 className="px-4 py-2.5 border-2 border-white/50 text-white rounded-full hover:bg-white/10 transition-all duration-200 font-medium text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2"
 >
 Sign In
 </Link>
 <Link
 href="/signup"
 className="px-4 py-2.5 bg-brand-teal text-white rounded-full transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2"
 >
 Sign Up
 </Link>
 </>
 )}
 </div>

 {/* Mobile Menu Button */}
 <button
 onClick={() => setIsMenuOpen(!isMenuOpen)}
 className="xl:hidden text-white p-2 rounded-md hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky"
 aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
 aria-expanded={isMenuOpen}
 >
 {isMenuOpen ? <FaTimes size={20} aria-hidden="true" /> : <FaBars size={20} aria-hidden="true" />}
 </button>
 </div>

 {/* Mobile/Tablet Menu */}
 {isMenuOpen && (
 <div className="xl:hidden">
 <div className="py-4 border-t border-white/10">
 {/* Mobile Search */}
 <div className="px-2 mb-4">
 <SearchAutocomplete variant="navbar" placeholder="Search doctors, medicines..." />
 </div>

 {/* Navigation Links */}
 <div className="space-y-2 px-2">
 <Link
 href="/"
 className="flex items-center space-x-3 text-white/90 py-3 px-3 rounded-lg transition-colors"
 onClick={() => setIsMenuOpen(false)}
 >
 <FaHome className="text-brand-sky" />
 <span className="font-medium">Home</span>
 </Link>

 {/* Mobile: Icon grid - hidden when logged in */}
 {!isLoggedIn && (
 <div className="sm:hidden grid grid-cols-3 gap-2 mb-3 pb-3 border-b border-gray-100">
 {Object.values(serviceCategories).flat().map((service) => (
 <Link
 key={service.href}
 href={getServiceHref(service.href)}
 className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 hover:bg-white/10 transition-colors"
 onClick={() => setIsMenuOpen(false)}
 aria-label={service.label}
 >
 <div className={`w-10 h-10 rounded-xl ${service.color} flex items-center justify-center shadow-sm`}>
 <service.icon className="text-white text-sm" />
 </div>
 <span className="text-[11px] font-medium text-white/90 text-center leading-tight">{service.label}</span>
 </Link>
 ))}
 </div>
 )}

 {/* Tablet+: Expandable categories - hidden when logged in */}
 {!isLoggedIn && (
 <div className="hidden sm:block">
 {Object.entries(serviceCategories).map(([category, services]) => (
 <div key={category} className="border-b border-white/10 pb-3 mb-3">
 <button
 onClick={() => toggleDropdown(category)}
 className="flex items-center justify-between w-full text-left py-2 px-3 text-white font-semibold hover:bg-white/10 rounded-lg transition-colors"
 >
 <span className="text-sm">{category}</span>
 <FaChevronDown
 className={`text-xs transition-transform duration-200 ${
 activeDropdown === category ? 'rotate-180' : ''
 }`}
 />
 </button>

 {activeDropdown === category && (
 <div className="mt-2 space-y-1 pl-4">
 {services.map((service) => (
 <Link
 key={service.href}
 href={getServiceHref(service.href)}
 className="flex items-center space-x-3 py-2.5 px-3 text-white/80 rounded-lg transition-colors"
 onClick={() => setIsMenuOpen(false)}
 >
 <service.icon className="text-brand-sky" />
 <span>{service.label}</span>
 </Link>
 ))}
 </div>
 )}
 </div>
 ))}
 </div>
 )}

 <Link
 href="/about"
 className="flex items-center space-x-3 text-white/90 py-3 px-3 rounded-lg transition-colors"
 onClick={() => setIsMenuOpen(false)}
 >
 <FaInfoCircle className="text-brand-sky" />
 <span className="font-medium">About</span>
 </Link>

 <Link
 href="/contact"
 className="flex items-center space-x-3 text-white/90 py-3 px-3 rounded-lg transition-colors"
 onClick={() => setIsMenuOpen(false)}
 >
 <FaPhone className="text-brand-sky" />
 <span className="font-medium">Contact</span>
 </Link>
 </div>

 {/* Mobile Language Switcher */}
 <div className="px-2 mt-3">
 <LanguageSwitcher variant="navbar" />
 </div>

 {/* Mobile Auth Buttons */}
 <div className="pt-4 px-2 space-y-3 border-t border-white/10 mt-4">
 {isLoggedIn ? (
 <>
 <Link
 href={profileHref}
 className="flex items-center justify-center gap-2 py-3 border-2 border-white/50 text-white rounded-full font-medium hover:bg-white/10 transition-colors"
 onClick={() => setIsMenuOpen(false)}
 >
 <FaUser /> My Profile
 </Link>
 <button
 onClick={() => { setIsMenuOpen(false); handleLogout() }}
 className="w-full py-3 text-white rounded-full font-medium transition-all duration-200 flex items-center justify-center gap-2"
 >
 <FaSignOutAlt /> Logout
 </button>
 </>
 ) : (
 <>
 <Link
 href="/login"
 className="block text-center py-3 border-2 border-white/50 text-white rounded-full font-medium hover:bg-white/10 transition-colors"
 onClick={() => setIsMenuOpen(false)}
 >
 Sign In
 </Link>
 <Link
 href="/signup"
 className="block text-center py-3 bg-brand-teal text-white rounded-full font-medium shadow-md transition-all duration-200"
 onClick={() => setIsMenuOpen(false)}
 >
 Sign Up
 </Link>
 </>
 )}
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 </nav>
 )
}

export default Navbar
