'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/cn'

const SIZES = { xs: 24, sm: 32, md: 40, lg: 56, xl: 80 } as const
type SizeKey = keyof typeof SIZES

function initials(name?: string | null) {
  if (!name) return '?'
  return name.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

/**
 * Avatar — image with graceful initials fallback (broken/missing src).
 * `size` is a token key; px values map to next/image dimensions.
 */
export default function Avatar({
  src,
  name,
  size = 'md',
  className,
  ring,
}: {
  src?: string | null
  name?: string | null
  size?: SizeKey
  className?: string
  ring?: boolean
}) {
  const [errored, setErrored] = useState(false)
  const px = SIZES[size]
  const base = cn(
    'rounded-full object-cover flex-shrink-0',
    ring && 'ring-2 ring-[#0C6780]/30 dark:ring-accent/40',
    className,
  )

  if (src && !errored) {
    return (
      <Image
        src={src}
        alt={name || 'avatar'}
        width={px}
        height={px}
        onError={() => setErrored(true)}
        className={base}
        style={{ width: px, height: px }}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold text-white bg-[#001E40] dark:bg-subtle dark:text-fg flex-shrink-0',
        ring && 'ring-2 ring-[#0C6780]/30 dark:ring-accent/40',
        className,
      )}
      style={{ width: px, height: px, fontSize: px * 0.36 }}
      aria-label={name || 'avatar'}
    >
      {initials(name)}
    </div>
  )
}
