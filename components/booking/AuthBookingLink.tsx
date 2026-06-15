'use client'

import { useRouter } from 'next/navigation'
import { ReactNode, useCallback } from 'react'
import type { BookingType } from '@/lib/booking/types'

interface AuthBookingLinkProps {
 type: BookingType
 providerId?: string
 children: ReactNode
 className?: string
}

function getCookie(name: string): string | null {
 if (typeof document === 'undefined') return null
 const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
 return match ? decodeURIComponent(match[2]) : null
}


export default function AuthBookingLink({ type, providerId, children, className }: AuthBookingLinkProps) {
 const router = useRouter()

 const handleClick = useCallback(() => {
 const userType = getCookie('mediwyz_userType')
 if (!userType) {
 const fallbackPath = type === 'emergency'
 ? '/book/emergency'
 : `/book/${type}/${providerId}`
 router.push(`/login?returnUrl=${encodeURIComponent(fallbackPath)}`)
 return
 }

 // Use clean URLs - middleware rewrites to correct folder
 const bookingPath = type === 'emergency'
 ? '/book/emergency'
 : `/book/${type}/${providerId}`
 router.push(bookingPath)
 }, [type, providerId, router])

 return (
 <button onClick={handleClick} className={className}>
 {children}
 </button>
 )
}
