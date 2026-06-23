'use client'

import { cn } from '@/lib/cn'

export interface TabItem {
  key: string
  label: React.ReactNode
  icon?: React.ReactNode
  badge?: React.ReactNode
}

/**
 * Tabs  horizontal, scrollable, underline-style tab bar. Controlled via
 * `active` / `onChange`. Use for in-page section switches (profile, AI coach).
 */
export default function Tabs({
  items,
  active,
  onChange,
  className,
}: {
  items: TabItem[]
  active: string
  onChange: (key: string) => void
  className?: string
}) {
  return (
    <div className={cn('flex gap-1 overflow-x-auto scrollbar-hide border-b border-line', className)} role="tablist">
      {items.map((t) => {
        const selected = t.key === active
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(t.key)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer',
              selected ? 'text-[#0C6780] dark:text-accent' : 'text-soft hover:text-fg',
            )}
          >
            {t.icon}
            {t.label}
            {t.badge}
            {selected && (
              <span className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full bg-[#0C6780] dark:bg-accent" />
            )}
          </button>
        )
      })}
    </div>
  )
}
