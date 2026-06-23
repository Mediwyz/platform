'use client'

import React from 'react'

interface FormFieldProps {
 label: string
 error?: string
 required?: boolean
 children: React.ReactNode
 className?: string
}

export function FormField({ label, error, required, children, className = '' }: FormFieldProps) {
 return (
 <div className={className}>
 <label className="block text-sm font-medium text-soft mb-1">
 {label}
 {required && <span className="text-red-500 ml-0.5">*</span>}
 </label>
 {children}
 {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
 </div>
 )
}

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
 error?: boolean
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
 ({ error, className = '', ...props }, ref) => {
 return (
 <input
 ref={ref}
 className={`
 w-full px-3 py-2 border rounded-lg text-sm transition-colors
 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
 disabled:bg-subtle disabled:text-soft
 ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-line'}
 ${className}
 `.trim()}
 {...props}
 />
 )
 }
)
FormInput.displayName = 'FormInput'

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
 error?: boolean
 options: { value: string; label: string }[]
 placeholder?: string
}

export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
 ({ error, options, placeholder, className = '', ...props }, ref) => {
 return (
 <select
 ref={ref}
 className={`
 w-full px-3 py-2 border rounded-lg text-sm transition-colors
 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
 disabled:bg-subtle disabled:text-soft
 ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-line'}
 ${className}
 `.trim()}
 {...props}
 >
 {placeholder && (
 <option value="">{placeholder}</option>
 )}
 {options.map(opt => (
 <option key={opt.value} value={opt.value}>{opt.label}</option>
 ))}
 </select>
 )
 }
)
FormSelect.displayName = 'FormSelect'

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
 error?: boolean
}

export const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
 ({ error, className = '', ...props }, ref) => {
 return (
 <textarea
 ref={ref}
 className={`
 w-full px-3 py-2 border rounded-lg text-sm transition-colors resize-none
 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
 disabled:bg-subtle disabled:text-soft
 ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-line'}
 ${className}
 `.trim()}
 {...props}
 />
 )
 }
)
FormTextarea.displayName = 'FormTextarea'
