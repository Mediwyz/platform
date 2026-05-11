'use client'

import Link from 'next/link'
import { FaTimes } from 'react-icons/fa'
import { useTranslation } from '@/lib/i18n'

export interface SidebarItem {
 id: string
 label: string
 labelKey?: string
 icon: React.ComponentType<{ className?: string }>
 color: string
 bgColor: string
 count?: number
 href: string
 divider?: boolean
}

interface DashboardSidebarProps {
 items: SidebarItem[]
 activeItemId: string
 isOpen: boolean
 isMobile: boolean
 onClose: () => void
 footer?: React.ReactNode
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
 items,
 activeItemId,
 isOpen,
 isMobile,
 onClose,
 footer,
}) => {
 const { t } = useTranslation()

 const getLabel = (item: SidebarItem): string => {
 if (item.labelKey) {
 const translated = t(item.labelKey)
 if (translated !== item.labelKey) return translated
 }
 return item.label
 }

 const isCollapsedDesktop = !isOpen && !isMobile

 // Mobile: fixed overlay sidebar with grid layout
 if (isMobile) {
 // Separate dividers (section headers) from regular items
 const sections: { label: string; items: SidebarItem[] }[] = []
 let currentSection: { label: string; items: SidebarItem[] } = { label: '', items: [] }

 for (const item of items) {
 if (item.divider) {
 if (currentSection.items.length > 0) sections.push(currentSection)
 currentSection = { label: getLabel(item), items: [] }
 } else {
 currentSection.items.push(item)
 }
 }
 if (currentSection.items.length > 0) sections.push(currentSection)

 return (
 <>
 {/* Backdrop overlay */}
 {isOpen && (
 <div
 className="fixed inset-0 bg-black/30 z-[55] transition-opacity duration-150"
 onClick={onClose}
 />
 )}
 <aside
 role="navigation"
 aria-label="Dashboard sidebar navigation"
 className={`
 fixed inset-y-0 left-0 z-[60]
 ${isOpen ? 'w-[85%]' : 'w-0'}
 bg-gray-50 shadow-2xl
 transform transition-all duration-150 ease-out
 overflow-hidden
 `}
 >
 {/* Close button */}
 <div className="flex items-center justify-between px-4 pt-4 pb-2">
 <span className="text-sm font-bold text-gray-900">Menu</span>
 <button
 onClick={onClose}
 className="p-2 rounded-lg bg-white hover:bg-gray-100 transition shadow-sm"
 aria-label="Close sidebar"
 >
 <FaTimes className="text-base text-gray-600" />
 </button>
 </div>

 <div className="h-full overflow-y-auto scrollbar-hidden px-3 pb-32">
 {sections.map((section, si) => (
 <div key={si} className="mb-4">
 {section.label && (
 <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">
 {section.label}
 </p>
 )}
 <div className="grid grid-cols-3 gap-2">
 {section.items.map((item) => {
 const Icon = item.icon
 const isActive = activeItemId === item.id
 const label = getLabel(item)

 return (
 <Link
 key={item.id}
 href={item.href}
 onClick={onClose}
 aria-current={isActive ? 'page' : undefined}
 className={`relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-all ${
 isActive
 ? `${item.bgColor} ${item.color} shadow-md ring-1 ring-blue-200`
 : 'bg-white shadow-sm hover:shadow-md text-gray-600 hover:text-gray-900'
 }`}
 >
 <Icon className={`text-xl ${isActive ? item.color : 'text-gray-500'}`} aria-hidden="true" />
 <span className={`text-[10px] font-medium text-center leading-tight line-clamp-2 ${isActive ? item.color : 'text-gray-700'}`}>
 {label}
 </span>
 {item.count != null && item.count > 0 && (
 <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center">
 {item.count > 9 ? '9+' : item.count}
 </span>
 )}
 </Link>
 )
 })}
 </div>
 </div>
 ))}

 {footer && (
 <div className="mt-4 pt-4 border-t border-gray-200">
 {footer}
 </div>
 )}
 </div>
 </aside>
 </>
 )
 }

 // Desktop: in-flow sidebar with grid layout
 // Separate dividers (section headers) from regular items
 const desktopSections: { label: string; items: SidebarItem[] }[] = []
 let currentDesktopSection: { label: string; items: SidebarItem[] } = { label: '', items: [] }

 for (const item of items) {
 if (item.divider) {
 if (currentDesktopSection.items.length > 0) desktopSections.push(currentDesktopSection)
 currentDesktopSection = { label: getLabel(item), items: [] }
 } else {
 currentDesktopSection.items.push(item)
 }
 }
 if (currentDesktopSection.items.length > 0) desktopSections.push(currentDesktopSection)

 return (
 <aside
 role="navigation"
 aria-label="Dashboard sidebar navigation"
 className={`
 flex-shrink-0
 ${isOpen ? 'w-64 lg:w-72 xl:w-80' : 'w-16'}
 bg-gray-50
 transition-all duration-300 ease-in-out
 overflow-hidden
 m-3 sm:m-4 md:m-5 lg:m-6 xl:m-8 rounded-2xl border border-gray-200 shadow-sm
 `}
 >
 <div className={`h-full overflow-y-auto scrollbar-hidden ${isCollapsedDesktop ? 'p-2' : 'p-3 md:p-4 lg:p-5'}`}>
 {isCollapsedDesktop ? (
 /* Collapsed: icon-only column */
 <nav className="space-y-2" aria-label="Dashboard menu">
 {items.filter(i => !i.divider).map((item) => {
 const Icon = item.icon
 const isActive = activeItemId === item.id
 return (
 <Link
 key={item.id}
 href={item.href}
 title={getLabel(item)}
 aria-current={isActive ? 'page' : undefined}
 className={`relative flex items-center justify-center p-2.5 rounded-xl transition-all ${
 isActive ? `${item.bgColor} ${item.color} shadow-md` : 'bg-white shadow-sm hover:shadow-md text-gray-500'
 }`}
 >
 <Icon className="text-lg" />
 {item.count != null && item.count > 0 && (
 <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
 )}
 </Link>
 )
 })}
 </nav>
 ) : (
 /* Expanded: grid of card buttons */
 <nav aria-label="Dashboard menu">
 {desktopSections.map((section, si) => (
 <div key={si} className="mb-4">
 {section.label && (
 <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">
 {section.label}
 </p>
 )}
 <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
 {section.items.map((item) => {
 const Icon = item.icon
 const isActive = activeItemId === item.id
 const label = getLabel(item)

 return (
 <Link
 key={item.id}
 href={item.href}
 aria-current={isActive ? 'page' : undefined}
 className={`relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-all hover:scale-105 ${
 isActive
 ? `${item.bgColor} ${item.color} shadow-md ring-1 ring-blue-200`
 : 'bg-white shadow-sm hover:shadow-md text-gray-600 hover:text-gray-900'
 }`}
 >
 <Icon className={`text-xl ${isActive ? item.color : 'text-gray-500'}`} aria-hidden="true" />
 <span className={`text-[10px] lg:text-xs font-medium text-center leading-tight line-clamp-2 ${isActive ? item.color : 'text-gray-700'}`}>
 {label}
 </span>
 {item.count != null && item.count > 0 && (
 <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center">
 {item.count > 9 ? '9+' : item.count}
 </span>
 )}
 </Link>
 )
 })}
 </div>
 </div>
 ))}
 </nav>
 )}

 {footer && !isCollapsedDesktop && (
 <div className="mt-4 md:mt-6 pt-4 md:pt-5 border-t border-gray-200">
 {footer}
 </div>
 )}
 </div>
 </aside>
 )
}

export default DashboardSidebar
