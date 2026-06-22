'use client'

import { forwardRef } from 'react'
import { FaSpinner } from 'react-icons/fa'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'subtle' | 'danger'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-[#0C6780] text-white hover:bg-[#001E40] dark:bg-accent dark:text-[#04121f] dark:hover:bg-[#5fc7e6] shadow-sm',
  secondary: 'bg-[#001E40] text-white hover:bg-[#0C6780] dark:bg-subtle dark:text-fg dark:hover:bg-line',
  outline: 'border border-line text-fg bg-transparent hover:bg-subtle',
  ghost: 'text-soft hover:text-fg hover:bg-subtle bg-transparent',
  subtle: 'bg-subtle text-fg hover:bg-line',
  danger: 'bg-red-500 text-white hover:bg-red-600',
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-6 text-base gap-2 rounded-xl',
  icon: 'h-10 w-10 justify-center rounded-lg',
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, leftIcon, rightIcon, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center font-semibold cursor-pointer select-none transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-1 dark:focus-visible:ring-offset-canvas',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading ? <FaSpinner className="animate-spin" aria-hidden="true" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
})

export default Button
