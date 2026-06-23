'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslation, type SupportedLanguage } from '@/lib/i18n'
import { FaGlobe } from 'react-icons/fa'

interface LanguageSwitcherProps {
 /** 'navbar' for public pages, 'header' for dashboard header area */
 variant?: 'navbar' | 'header'
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'navbar' }) => {
 const { language, setLanguage, supportedLanguages } = useTranslation()
 const [open, setOpen] = useState(false)
 const ref = useRef<HTMLDivElement>(null)

 // Close on outside click
 useEffect(() => {
 const handler = (e: MouseEvent) => {
 if (ref.current && !ref.current.contains(e.target as Node)) {
 setOpen(false)
 }
 }
 if (open) {
 document.addEventListener('mousedown', handler)
 }
 return () => document.removeEventListener('mousedown', handler)
 }, [open])

 const current = supportedLanguages.find((l) => l.code === language)

 const isHeader = variant === 'header'

 return (
 <div className="relative" ref={ref}>
 <button
 onClick={() => setOpen(!open)}
 className={
 isHeader
 ? 'p-2 sm:p-2.5 md:p-3 text-gray-600 dark:text-soft hover:text-brand-teal dark:hover:text-accent bg-gray-100 dark:bg-subtle rounded-lg hover:bg-sky-100 dark:hover:bg-line transition flex items-center gap-1.5'
 : 'flex items-center gap-1.5 text-white/90 hover:text-white transition-colors duration-200 px-2 py-1.5 rounded-md hover:bg-white/10 text-sm font-medium'
 }
 aria-label="Change language"
 aria-expanded={open}
 >
 <FaGlobe className={isHeader ? 'text-sm sm:text-base md:text-lg' : 'text-sm'} />
 <span className="hidden sm:inline text-xs sm:text-sm">
 {current?.flag} {current?.code.toUpperCase()}
 </span>
 </button>

 {open && (
 <div className="absolute right-0 top-full mt-1 w-44 bg-surface rounded-xl shadow-xl border border-line z-50 overflow-hidden">
 {supportedLanguages.map((lang) => (
 <button
 key={lang.code}
 onClick={() => {
 setLanguage(lang.code as SupportedLanguage)
 setOpen(false)
 }}
 className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-subtle transition-colors ${
 language === lang.code
 ? 'bg-[#0C6780]/10 text-[#0C6780] dark:text-accent font-medium'
 : 'text-soft'
 }`}
 >
 <span className="text-lg">{lang.flag}</span>
 <span>{lang.label}</span>
 {language === lang.code && (
 <span className="ml-auto text-[#0C6780] dark:text-accent text-xs">&#10003;</span>
 )}
 </button>
 ))}
 </div>
 )}
 </div>
 )
}

export default LanguageSwitcher
