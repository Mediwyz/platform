'use client'

import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
 variant?: ButtonVariant
 size?: ButtonSize
 loading?: boolean
 icon?: React.ReactNode
 children: React.ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
 primary:
 ' text-white shadow-sm',
 secondary:
 'bg-subtle text-soft hover:bg-line border border-line',
 outline:
 'border-2 border-line text-soft hover:bg-subtle hover:border-gray-400',
 ghost:
 'text-soft hover:bg-subtle hover:text-fg',
 danger:
 ' text-white shadow-sm',
}

const sizeClasses: Record<ButtonSize, string> = {
 sm: 'px-3 py-1.5 text-xs rounded-lg',
 md: 'px-4 py-2 text-sm rounded-lg',
 lg: 'px-6 py-3 text-base rounded-xl',
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
 ({ variant = 'primary', size = 'md', loading, icon, children, className = '', disabled, ...props }, ref) => {
 return (
 <button
 ref={ref}
 disabled={disabled || loading}
 className={`
 inline-flex items-center justify-center gap-2 font-medium transition-all
 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1
 disabled:opacity-50 disabled:cursor-not-allowed
 ${variantClasses[variant]}
 ${sizeClasses[size]}
 ${className}
 `.trim()}
 {...props}
 >
 {loading ? (
 <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
 ) : icon ? (
 <span className="flex-shrink-0">{icon}</span>
 ) : null}
 {children}
 </button>
 )
 }
)

Button.displayName = 'Button'

export default Button
