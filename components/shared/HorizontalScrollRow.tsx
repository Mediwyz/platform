'use client'

import { useRef, useState, useEffect, type ReactNode } from 'react'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import Link from 'next/link'

interface HorizontalScrollRowProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  seeAllHref?: string
  seeAllLabel?: string
  children: ReactNode
  className?: string
}

export default function HorizontalScrollRow({
  title,
  subtitle,
  icon,
  seeAllHref,
  seeAllLabel = 'See All',
  children,
  className = '',
}: HorizontalScrollRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', checkScroll, { passive: true })
    const observer = new ResizeObserver(checkScroll)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      observer.disconnect()
    }
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const amount = el.clientWidth * 0.75
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <div className={`mb-10 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3 min-w-0">
          {icon && <span className="text-2xl flex-shrink-0">{icon}</span>}
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-fg truncate">{title}</h3>
            {subtitle && <p className="text-xs text-soft truncate">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          {seeAllHref && (
            <Link
              href={seeAllHref}
              className="text-sm font-medium text-[#0C6780] hover:text-fg transition-colors whitespace-nowrap"
            >
              {seeAllLabel} &rarr;
            </Link>
          )}
        </div>
      </div>

      {/*
        ┌────┬──────────────────────────────────────┬────┐
        │ ◀  │  [ card ] [ card ] [ card ] [ card ] │ ▶  │
        └────┴──────────────────────────────────────┴────┘

        Flex row: button (fixed 40px) | scroll zone (flex-1) | button (fixed 40px)
        The scroll zone has overflow-hidden → cards are CLIPPED at its edges,
        never bleeding into the button columns. No absolute positioning needed.
      */}
      <div className="flex items-center gap-2">
        {/* LEFT button - always rendered, dimmed at start */}
        <button
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          className={`hidden md:flex flex-shrink-0 w-10 h-10 rounded-full
            bg-surface shadow-md border-2 items-center justify-center
            transition-all duration-150
            ${canScrollLeft
              ? 'border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white cursor-pointer'
              : 'border-line text-faint cursor-default'
            }`}
          aria-label="Scroll left"
        >
          <FaChevronLeft className="text-xs" />
        </button>

        {/* Scroll zone - flex-1 takes remaining width; overflow-hidden
            clips any card that partially exits the viewport so edges look
            clean instead of showing half-cards */}
        <div className="flex-1 min-w-0 overflow-hidden relative">
          {/* Subtle fade gradient at right edge - shows there's more content */}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
              style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.9))' }} />
          )}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
              style={{ background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.9))' }} />
          )}
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 scrollbar-hide"
          >
            {children}
          </div>
        </div>

        {/* RIGHT button - always rendered, dimmed at end */}
        <button
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          className={`hidden md:flex flex-shrink-0 w-10 h-10 rounded-full
            bg-surface shadow-md border-2 items-center justify-center
            transition-all duration-150
            ${canScrollRight
              ? 'border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white cursor-pointer'
              : 'border-line text-faint cursor-default'
            }`}
          aria-label="Scroll right"
        >
          <FaChevronRight className="text-xs" />
        </button>

      </div>
    </div>
  )
}
