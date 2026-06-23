'use client'

import { useEffect } from 'react'
import { FaTimes } from 'react-icons/fa'
import { cn } from '@/lib/cn'

/**
 * Modal  centered dialog with themed backdrop. Closes on Escape and backdrop
 * click. Locks body scroll while open. Pass `title` for the standard header.
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  className,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title?: React.ReactNode
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn('w-full bg-surface text-fg rounded-2xl shadow-xl border border-line', widths[size], className)}
        onClick={(e) => e.stopPropagation()}
      >
        {title !== undefined && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <h2 className="text-lg font-bold text-fg">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-2 -mr-2 rounded-lg text-faint hover:text-fg hover:bg-subtle transition-colors"
            >
              <FaTimes />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
