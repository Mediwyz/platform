'use client'

import React from 'react'
import Image from 'next/image'
import { FaCheckCircle } from 'react-icons/fa'

interface ProviderListCardProps {
 children?: React.ReactNode
 /** Left section: avatar + info */
 avatar?: {
 src?: string
 alt: string
 fallbackIcon?: React.ReactNode
 verified?: boolean
 /** Border color class e.g. 'border-blue-100' */
 borderColor?: string
 }
 /** Right section: price + buttons */
 rightSection?: React.ReactNode
 /** Additional info rendered inside the left section below avatar row */
 infoSection?: React.ReactNode
 /** Tags/badges row */
 tagsSection?: React.ReactNode
 /** Meta row (rating, location, etc.) */
 metaSection?: React.ReactNode
 /** Name and badge */
 name: string
 namePrefix?: string
 subtitle?: string
 badge?: { label: string; className: string }
}

export default function ProviderListCard({
 avatar,
 rightSection,
 metaSection,
 tagsSection,
 name,
 namePrefix,
 subtitle,
 badge,
}: ProviderListCardProps) {
 return (
 <div className="bg-surface rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-line overflow-hidden">
 <div className="p-3 sm:p-4 flex flex-col sm:flex-row gap-3">
 {/* Left: Avatar + Info */}
 <div className="flex items-start gap-3 flex-1 min-w-0">
 {/* Avatar */}
 {avatar && (
 <div className="relative flex-shrink-0">
 {avatar.src ? (
 <Image
 src={avatar.src}
 alt={avatar.alt}
 width={48}
 height={48}
 className={`rounded-full object-cover border-2 ${avatar.borderColor || 'border-line'}`}
 />
 ) : (
 <div
 className={`w-12 h-12 rounded-full bg-subtle flex items-center justify-center text-lg text-faint border-2 ${avatar.borderColor || 'border-line'}`}
 >
 {avatar.fallbackIcon}
 </div>
 )}
 {avatar.verified && (
 <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 text-white rounded-full p-0.5">
 <FaCheckCircle className="text-[10px]" />
 </div>
 )}
 </div>
 )}

 {/* Info */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-0.5 flex-wrap">
 <h3 className="text-sm font-bold text-fg truncate">
 {namePrefix && `${namePrefix} `}{name}
 </h3>
 {badge && (
 <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border whitespace-nowrap ${badge.className}`}>
 {badge.label}
 </span>
 )}
 </div>
 {subtitle && (
 <p className="text-xs text-blue-600 font-medium truncate mb-1">{subtitle}</p>
 )}
 {metaSection}
 {tagsSection}
 </div>
 </div>

 {/* Right: Price + Buttons */}
 {rightSection && (
 <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 flex-shrink-0 sm:border-l sm:border-line sm:pl-3 border-t sm:border-t-0 border-line pt-2 sm:pt-0">
 {rightSection}
 </div>
 )}
 </div>
 </div>
 )
}

/** Small action button for use inside ProviderListCard right section */
export function CardButton({
 children,
 variant = 'secondary',
 className = '',
 ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }) {
 const base = 'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap'
 const variants = {
 primary: 'bg-blue-600 text-white hover:bg-blue-700',
 secondary: 'bg-subtle text-soft hover:bg-line',
 danger: 'bg-red-600 text-white hover:bg-red-700',
 }
 return (
 <button className={`${base} ${variants[variant]} ${className}`} {...props}>
 {children}
 </button>
 )
}
