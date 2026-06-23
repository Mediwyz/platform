'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { useUser } from '@/hooks/useUser'
import DashboardHeader from './DashboardHeader'
import DashboardSidebar, { type SidebarItem } from './DashboardSidebar'
import VerificationBanner from './VerificationBanner'

interface DashboardLayoutProps {
 children: React.ReactNode
 userName: string
 userImage?: string | null
 userSubtitle: string
 sidebarItems: SidebarItem[]
 activeSectionId: string
 notificationCount?: number
 /** @deprecated Use profileHref instead */
 settingsHref?: string
 profileHref?: string
 networkHref?: string
 billingHref?: string
 onLogout: () => void
 sidebarFooter?: React.ReactNode
 /** Extra classes applied to the <main> scroll container (e.g. "!p-0" for full-bleed pages). */
 mainClassName?: string
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
 children,
 userName,
 userImage,
 userSubtitle,
 sidebarItems,
 activeSectionId,
 notificationCount = 0,
 settingsHref,
 profileHref,
 networkHref,
 billingHref,
 onLogout,
 sidebarFooter,
 mainClassName,
}) => {
 const [sidebarOpen, setSidebarOpen] = useState(true)
 const [isMobile, setIsMobile] = useState(false)
 const { user: currentUser } = useUser()
 const userId = currentUser?.id

 // Use profileHref if provided, fall back to settingsHref for backwards compat
 const resolvedProfileHref = profileHref || settingsHref || '/profile'

 useEffect(() => {
 const handleResize = () => {
 const mobile = window.innerWidth < 768
 setIsMobile(mobile)
 if (mobile) setSidebarOpen(false)
 }

 handleResize()
 window.addEventListener('resize', handleResize)
 return () => window.removeEventListener('resize', handleResize)
 }, [])

 // Socket.IO singleton - ONE socket and ONE notification listener per
 // (tab, userId). Every time this effect runs (strict-mode, HMR, nav):
 //    reuse the existing socket if one exists for this userId
 //    ALWAYS re-attach the current `notification:new` handler using
 //     off() then on() - prevents stale listeners from old HMR modules
 //     from continuing to fire toasts alongside the new one.
 //
 // Seen-ids set lives on window so duplicate notifications (backend
 // retries, socket replay) are deduped across re-mounts too.
 useEffect(() => {
 if (!userId || typeof window === 'undefined') return
 const w = window as any
 let cancelled = false

 // Fresh login under a different userId - drop the old socket first.
 if (w.__mediwyzSocket && w.__mediwyzSocketUserId !== userId) {
  try { w.__mediwyzSocket.removeAllListeners(); w.__mediwyzSocket.disconnect() } catch {}
  w.__mediwyzSocket = null
 }

 // Shared seen-ids across remounts
 const seenIds: Set<string> = w.__mediwyzSeenNotifIds ?? new Set<string>()
 w.__mediwyzSeenNotifIds = seenIds

 const wireListeners = (socket: any) => {
  // Detach every prior listener for these events - removes ghost
  // listeners attached by HMR'd module instances and guarantees
  // exactly ONE handler is active per event.
  socket.off('connect')
  socket.off('notification:new')

  socket.on('connect', () => { socket.emit('chat:join', { userId }) })

  socket.on('notification:new', (data: { title: string; message: string; id: string; type: string; createdAt: string }) => {
   if (data?.id && seenIds.has(data.id)) return
   if (data?.id) seenIds.add(data.id)
   toast.info(
    <div>
     <p className="font-semibold text-sm">{data.title}</p>
     <p className="text-xs text-soft mt-0.5">{data.message}</p>
    </div>,
    { toastId: data?.id, autoClose: 5000 },
   )
   window.dispatchEvent(new CustomEvent('notification:new', { detail: data }))
  })

  // If socket was already connected when we rewired, manually (re)join
  // the room since the `connect` handler won't fire again.
  if (socket.connected) socket.emit('chat:join', { userId })
 }

 // Reuse existing socket when possible.
 if (w.__mediwyzSocket && w.__mediwyzSocketUserId === userId) {
  wireListeners(w.__mediwyzSocket)
  return () => { cancelled = true }
 }

 // Mark claim synchronously so concurrent mounts don't both create sockets.
 w.__mediwyzSocketUserId = userId
 w.__mediwyzSocketCreating = true

 ;(async () => {
  try {
   const { io } = await import('socket.io-client')
   if (cancelled || w.__mediwyzSocketUserId !== userId) return
   // If another effect ran first and created the socket, reuse it.
   if (w.__mediwyzSocket) { wireListeners(w.__mediwyzSocket); return }

   const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL
    || (window.location.hostname === 'localhost'
     ? 'http://localhost:3001'
     : window.location.origin)
   const socket = io(socketUrl, { transports: ['websocket', 'polling'], withCredentials: true })
   w.__mediwyzSocket = socket
   wireListeners(socket)
  } finally {
   w.__mediwyzSocketCreating = false
  }
 })()

 return () => { cancelled = true }
 }, [userId])

 const handleToggleSidebar = () => {
 setSidebarOpen((prev) => !prev)
 }

 const handleCloseSidebar = () => {
 setSidebarOpen(false)
 }

 return (
 <div className="h-screen flex flex-col overflow-hidden">
 {/* Skip to content link */}
 <a
 href="#dashboard-main-content"
 className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
 >
 Skip to main content
 </a>

 {/* Single header with logo, user info, notifications, logout */}
 <DashboardHeader
 userName={userName}
 userImage={userImage}
 userSubtitle={userSubtitle}
 notificationCount={notificationCount}
 profileHref={resolvedProfileHref}
 networkHref={networkHref}
 billingHref={billingHref}
 sidebarOpen={sidebarOpen}
 onToggleSidebar={handleToggleSidebar}
 onLogout={onLogout}
 userId={userId}
 />

 {/* Sidebar + Main content */}
 <div className="flex flex-1 overflow-hidden">
 <DashboardSidebar
 items={sidebarItems}
 activeItemId={activeSectionId}
 isOpen={sidebarOpen}
 isMobile={isMobile}
 onClose={handleCloseSidebar}
 footer={sidebarFooter}
 />

 <main
 id="dashboard-main-content"
 role="main"
 className={`flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8${mainClassName ? ` ${mainClassName}` : ''}`}
 >
 <VerificationBanner userId={userId} userType={currentUser?.userType} />
 {children}
 </main>
 </div>

 {/* Mobile overlay backdrop */}
 {isMobile && sidebarOpen && (
 <div
 className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
 onClick={handleCloseSidebar}
 aria-hidden="true"
 />
 )}
 </div>
 )
}

export default DashboardLayout
