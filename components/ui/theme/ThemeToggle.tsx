'use client'

import { FaMoon, FaSun } from 'react-icons/fa'
import { useTheme } from './ThemeProvider'
import { cn } from '@/lib/cn'

/**
 * ThemeToggle — sun/moon switch for the dashboard header.
 * Mounted client-side; reflects the resolved theme and flips light/dark.
 */
export default function ThemeToggle({ className }: { className?: string }) {
  const { resolved, toggle } = useTheme()
  const isDark = resolved === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={cn(
        'p-2.5 rounded-lg flex items-center justify-center transition-colors flex-shrink-0',
        'bg-gray-100 text-gray-600 hover:text-brand-teal hover:bg-sky-100',
        'dark:bg-subtle dark:text-soft dark:hover:text-accent dark:hover:bg-line',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal',
        className,
      )}
    >
      {isDark ? <FaSun className="text-sm" aria-hidden="true" /> : <FaMoon className="text-sm" aria-hidden="true" />}
    </button>
  )
}
