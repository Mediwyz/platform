'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
 FaBars,
 FaTimes,
 FaSignOutAlt,
 FaUserFriends,
 FaHome,
 FaWallet,
} from 'react-icons/fa'
import { getCurrencySymbol } from '@/lib/currency'
import HealthwyzLogo from '@/components/ui/HealthwyzLogo'
import ThemeToggle from '@/components/ui/theme/ThemeToggle'
import LanguageSwitcher from '@/components/shared/LanguageSwitcher'
import { useTranslation } from '@/lib/i18n'
import { useCapacitor } from '@/hooks/useCapacitor'

const NotificationBell = dynamic(() => import('@/components/shared/NotificationBell'), { ssr: false })


interface DashboardHeaderProps {
 userName: string
 userImage?: string | null
 userSubtitle: string
 notificationCount: number
 profileHref: string
 networkHref?: string
 billingHref?: string
 sidebarOpen: boolean
 onToggleSidebar: () => void
 onLogout: () => void
 userId?: string
}


const DashboardHeader: React.FC<DashboardHeaderProps> = ({
 userName,
 userImage,
 userSubtitle,
 profileHref,
 networkHref,
 billingHref,
 sidebarOpen,
 onToggleSidebar,
 onLogout,
 userId,
}) => {
 const { t } = useTranslation()
 const [planLabel, setPlanLabel] = useState<string | null>(null)
 const [pendingConnectionCount, setPendingConnectionCount] = useState(0)
 const [wallet, setWallet] = useState<{ balance: number; currency: string } | null>(null)

 // Wallet balance — shown in the header so the member is always aware of their
 // available credit. Refetched when a wallet movement happens (Socket.IO event).
 useEffect(() => {
 if (!userId) return
 let cancelled = false
 const load = () => fetch(`/api/users/${userId}/wallet`, { credentials: 'include' })
 .then(r => r.json())
 .then(j => { if (!cancelled && j.success && j.data) setWallet({ balance: j.data.balance, currency: j.data.currency }) })
 .catch(() => {})
 load()
 const onWallet = () => load()
 if (typeof window !== 'undefined') window.addEventListener('mediwyz:wallet-changed', onWallet)
 return () => { cancelled = true; if (typeof window !== 'undefined') window.removeEventListener('mediwyz:wallet-changed', onWallet) }
 }, [userId])

 // Fetch user's subscription plan label
 useEffect(() => {
 if (!userId) return
 fetch(`/api/users/${userId}/subscription`, { credentials: 'include' })
 .then(r => r.json())
 .then(json => {
 if (json.success && json.data?.hasSubscription && json.data.plan) {
 const plan = json.data.plan
 const category = plan.type === 'corporate' ? 'Business' : 'For You'
 setPlanLabel(`${category} · ${plan.name}`)
 }
 })
 .catch(() => {})
 }, [userId])

 // Fetch pending connection request count
 useEffect(() => {
 if (!userId || !networkHref) return
 const fetchPendingConnections = async () => {
 try {
 const res = await fetch(`/api/connections?userId=${userId}&type=received&status=pending`, { credentials: 'include' })
 const data = await res.json()
 if (data.success && Array.isArray(data.data)) {
 setPendingConnectionCount(data.data.length)
 }
 } catch {
 // silent
 }
 }
 fetchPendingConnections()
 const interval = setInterval(fetchPendingConnections, 30000)
 return () => clearInterval(interval)
 }, [userId, networkHref])

 const isCapacitor = useCapacitor()

 return (
 <header role="banner" className="sticky top-0 z-50 flex-shrink-0">
 {/* Spacer for Android status bar in Capacitor WebView */}
 {isCapacitor && (
 <div className="bg-surface h-14" />
 )}
 <div className="h-0.5 bg-brand-teal " />
 <div className="bg-white/95 dark:bg-surface/95 backdrop-blur-md shadow-sm border-b border-line dark:border-line">
 <div className="px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-2.5">
 <div className="flex items-center justify-between gap-1">
 {/* Left: mobile toggle + logo + user info */}
 <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
 <button
 onClick={onToggleSidebar}
 className="md:hidden p-2.5 sm:p-2 rounded-lg bg-subtle dark:bg-subtle hover:bg-line dark:hover:bg-line text-soft dark:text-soft transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
 aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
 aria-expanded={sidebarOpen}
 >
 {sidebarOpen ? (
 <FaTimes className="text-lg sm:text-lg" aria-hidden="true" />
 ) : (
 <FaBars className="text-lg sm:text-lg" aria-hidden="true" />
 )}
 </button>

 {/* Logo — smaller on mobile so the header never overflows */}
 <Link href="/" className="flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal rounded-md">
 <span className="sm:hidden"><HealthwyzLogo width={128} height={38} /></span>
 <span className="hidden sm:block"><HealthwyzLogo width={200} height={56} /></span>
 </Link>

 <div className="hidden sm:flex items-center gap-2 sm:gap-3 ml-2 sm:ml-4 pl-2 sm:pl-4 border-l border-line">
 <div>
 <h1 className="text-sm sm:text-base md:text-lg font-bold text-fg dark:text-fg truncate max-w-[150px] sm:max-w-[200px] md:max-w-none">
 {userName}
 </h1>
 <div className="flex items-center gap-1.5">
 <p className="text-[10px] sm:text-xs text-soft dark:text-soft">
 {userSubtitle}
 </p>
 {planLabel && (
 <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full text-amber-700 font-medium whitespace-nowrap border border-amber-200">
 {planLabel}
 </span>
 )}
 </div>
 </div>
 </div>
 </div>

 {/* Right: profile, notifications, logout */}
 <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 flex-shrink min-w-0">
 {/* Profile avatar link */}
 <Link
 href={profileHref}
 className="flex-shrink-0"
 aria-label="My Profile"
 >
 {userImage ? (
 <Image
 src={userImage}
 alt={userName}
 width={36}
 height={36}
 className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-brand-teal/30 hover:border-brand-teal transition-colors"
 />
 ) : (
 <div className="w-8 h-8 sm:w-9 sm:h-9 bg-brand-navy rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold border-2 border-brand-teal/30 hover:border-brand-teal transition-colors">
 {userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
 </div>
 )}
 </Link>

 {/* Wallet balance — always-visible billing awareness, links to billing */}
 {wallet && (
 <Link
 href={billingHref || '#'}
 className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 transition flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
 aria-label={`Wallet balance ${getCurrencySymbol(wallet.currency)} ${wallet.balance.toLocaleString()}`}
 title="Your account balance"
 >
 <FaWallet className="text-sm" aria-hidden="true" />
 <span className="text-xs sm:text-sm font-bold whitespace-nowrap">{getCurrencySymbol(wallet.currency)} {wallet.balance.toLocaleString()}</span>
 </Link>
 )}

 {/* Network / Connections - hidden on very small mobile */}
 {networkHref && (
 <Link
 href={networkHref}
 className="hidden sm:flex relative p-2.5 md:p-3 text-soft hover:text-brand-teal bg-subtle rounded-lg hover:bg-sky-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
 aria-label={`My Network${pendingConnectionCount > 0 ? `, ${pendingConnectionCount} pending requests` : ''}`}
 >
 <FaUserFriends className="text-base sm:text-base md:text-lg" aria-hidden="true" />
 {pendingConnectionCount > 0 && (
 <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex items-center justify-center font-bold" aria-hidden="true">
 {pendingConnectionCount > 9 ? '9+' : pendingConnectionCount}
 </span>
 )}
 </Link>
 )}

 {/* Notification bell + dropdown (real-time, socket-powered) */}
 {userId && (
 <NotificationBell userId={userId} profileHref={profileHref} />
 )}

 {/* Theme toggle - light/dark */}
 <ThemeToggle />

 {/* Language switcher - hidden on small mobile to save space */}
 <div className="hidden sm:block">
 <LanguageSwitcher variant="header" />
 </div>

 {/* Home button - always visible, returns to landing page */}
 <Link
   href="/"
   className="hidden sm:flex p-2 sm:px-3 sm:py-2 rounded-lg bg-subtle dark:bg-subtle hover:bg-sky-100 text-soft dark:text-soft hover:text-brand-teal items-center gap-1.5 transition flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
   aria-label="Return to home page"
 >
   <FaHome className="text-sm" aria-hidden="true" />
   <span className="hidden sm:inline text-xs font-medium">Home</span>
 </Link>

 {/* Logout button */}
 <button
 onClick={onLogout}
 className="bg-red-500 hover:bg-red-600 text-white p-2 sm:px-3 sm:py-2 rounded-lg flex items-center gap-1.5 transition flex-shrink-0"
 aria-label="Log out"
 >
 <FaSignOutAlt className="text-sm" aria-hidden="true" />
 <span className="hidden sm:inline text-xs">
 {t('common.logout')}
 </span>
 </button>
 </div>
 </div>
 </div>
 </div>
 </header>
 )
}

export default DashboardHeader
