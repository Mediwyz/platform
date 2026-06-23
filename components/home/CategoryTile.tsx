'use client'

/**
 * CategoryTile  a big square tile for a service category (Cardiology, Wound
 * Care, ). Renders the matching local Healthicon (resolved by keyword, see
 * ServiceIcon) in white on a brand gradient, with the label below. Consistent
 * across all ~95 categories  no per-category image sourcing needed.
 *
 * The healthicons are monochrome SVGs, so we recolor them to white with a
 * `brightness-0 invert` filter to sit on the gradient.
 */

import { resolveServiceHealthicon, healthiconUrl } from '@/components/shared/ServiceIcon'
import { cn } from '@/lib/cn'

interface CategoryTileProps {
  label: string
  /** category string used for icon keyword matching (defaults to label) */
  category?: string
  providerType?: string | null
  /** brand color for the gradient start (falls back to teal) */
  color?: string
  onClick?: () => void
  className?: string
}

const TEAL = '#0C6780'
const NAVY = '#001E40'

export default function CategoryTile({
  label, category, providerType, color, onClick, className,
}: CategoryTileProps) {
  const iconPath = resolveServiceHealthicon(label, category ?? label, providerType)
  const start = color && color.trim() ? color : TEAL

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative aspect-square w-full rounded-2xl overflow-hidden text-left',
        'shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0C6780]',
        className,
      )}
      style={{ backgroundImage: `linear-gradient(150deg, ${start} 0%, ${NAVY} 100%)` }}
      title={label}
    >
      {/* soft glow */}
      <span className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/10 blur-xl" />

      {/* icon */}
      <span className="absolute inset-0 flex items-center justify-center pb-8">
        {/* eslint-disable-next-line @next/next/no-img-element -- local static SVG */}
        <img
          src={healthiconUrl(iconPath)}
          alt=""
          aria-hidden
          className="w-1/2 h-1/2 object-contain [filter:brightness(0)_invert(1)] opacity-95 transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />
      </span>

      {/* label */}
      <span className="absolute bottom-0 inset-x-0 px-2 py-2.5 bg-gradient-to-t from-black/45 to-transparent">
        <span className="block text-center text-white text-xs sm:text-sm font-semibold capitalize leading-tight line-clamp-2">
          {label.replace(/_/g, ' ')}
        </span>
      </span>
    </button>
  )
}
