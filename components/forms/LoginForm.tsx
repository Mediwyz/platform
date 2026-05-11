'use client'

import { useState, FormEvent, ChangeEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
 FaEye,
 FaEyeSlash,
 FaGoogle,
 FaLock,
 FaEnvelope,
} from 'react-icons/fa'
import type { LoginFormData } from '@/types'

const LoginForm: React.FC = () => {
 const [showPassword, setShowPassword] = useState(false)
 const [isSubmitting, setIsSubmitting] = useState(false)
 const [error, setError] = useState('')
 const [fieldErrors, setFieldErrors] = useState<{email?: string; password?: string}>({})
 const [formData, setFormData] = useState<LoginFormData>({
 email: '',
 password: '',
 })

 const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

 const validateEmail = (email: string): string | undefined => {
 if (!email.trim()) return 'Email is required'
 if (!EMAIL_REGEX.test(email)) return 'Please enter a valid email address'
 return undefined
 }

 const validatePassword = (password: string): string | undefined => {
 if (!password) return 'Password is required'
 return undefined
 }

 const router = useRouter()

 const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
 const { name, value } = e.target
 setError('')
 setFieldErrors(prev => ({ ...prev, [name]: undefined }))
 setFormData(prev => ({ ...prev, [name]: value }))
 }

 const handleBlurEmail = () => {
 const emailError = validateEmail(formData.email)
 if (emailError) setFieldErrors(prev => ({ ...prev, email: emailError }))
 }

 const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
 e.preventDefault()
 setIsSubmitting(true)
 setError('')

 const emailError = validateEmail(formData.email)
 const passwordError = validatePassword(formData.password)
 if (emailError || passwordError) {
 setFieldErrors({ email: emailError, password: passwordError })
 setIsSubmitting(false)
 return
 }

 try {
 const res = await fetch('/api/auth/login', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 email: formData.email,
 password: formData.password,
 }),
 })
 const data = await res.json()

 if (!res.ok || !data.success) {
 setError(data.message || 'Invalid credentials')
 setIsSubmitting(false)
 return
 }

 // Store user data + redirect path in localStorage for client-side access
 localStorage.setItem('mediwyz_user', JSON.stringify(data.user))
 if (data.redirectPath) {
  localStorage.setItem('mediwyz_redirectPath', data.redirectPath)
 }

 // Redirect to the user's private dashboard feed
 router.push(data.redirectPath || '/patient/feed')
 } catch {
 setError('Network error. Please try again.')
 setIsSubmitting(false)
 }
 }

 const handleGoogleLogin = () => {
 setError('Google sign-in coming soon. Please use email/password.')
 }

 return (
 <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
 {/* Header */}
 <div className="text-center mb-6">
 <Image src="/images/logo-icon.png" alt="MediWyz" width={64} height={64} className="w-16 h-16 mx-auto mb-3" />
 <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h3>
 <p className="text-gray-600">Sign in to your MediWyz account</p>
 </div>

 {/* Error Message */}
 {error && (
 <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
 {error}
 </div>
 )}

 {/* Login Form */}
 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
 Email Address
 </label>
 <div className="relative">
 <input
 type="email"
 id="email"
 name="email"
 required
 placeholder="Enter your email"
 className="w-full px-4 py-3 pl-10 border rounded-lg focus:outline-none focus:border-primary-blue"
 value={formData.email}
 onChange={handleChange}
 onBlur={handleBlurEmail}
 />
 <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
 </div>
 {fieldErrors.email && (
 <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
 )}
 </div>

 <div>
 <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
 Password
 </label>
 <div className="relative">
 <input
 type={showPassword ? 'text' : 'password'}
 id="password"
 name="password"
 required
 placeholder="Enter your password"
 className="w-full px-4 py-3 pl-10 pr-12 border rounded-lg focus:outline-none focus:border-primary-blue"
 value={formData.password}
 onChange={handleChange}
 />
 <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
 >
 {showPassword ? <FaEyeSlash /> : <FaEye />}
 </button>
 </div>
 {fieldErrors.password && (
 <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
 )}
 </div>

 <div className="flex items-center justify-between">
 <label className="flex items-center">
 <input
 type="checkbox"
 className="rounded border-gray-300 text-primary-blue focus:ring-primary-blue"
 />
 <span className="ml-2 text-sm text-gray-600">Remember me</span>
 </label>
 <Link href="/forgot-password" className="text-sm text-primary-blue hover:underline">
 Forgot password?
 </Link>
 </div>

 <button
 type="submit"
 disabled={isSubmitting}
 className="w-full btn-gradient py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
 >
 {isSubmitting ? (
 <div className="flex items-center gap-2">
 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
 Signing In...
 </div>
 ) : (
 'Sign In'
 )}
 </button>

 <div className="text-center mt-3">
 <Link href="/forgot-password" className="text-sm text-[#0C6780] hover:underline">
 Forgot password?
 </Link>
 </div>
 </form>

 {/* Divider */}
 <div className="my-6">
 <div className="relative">
 <div className="absolute inset-0 flex items-center">
 <div className="w-full border-t border-gray-300" />
 </div>
 <div className="relative flex justify-center text-sm">
 <span className="px-2 bg-white text-gray-500">Or continue with</span>
 </div>
 </div>
 </div>

 {/* Google Login */}
 <button
 onClick={handleGoogleLogin}
 disabled={isSubmitting}
 className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
 >
 <FaGoogle className="text-red-500" />
 <span className="text-gray-700 font-medium">Sign in with Google</span>
 </button>

 {/* Register Link */}
 <div className="mt-6 text-center">
 <p className="text-gray-600 text-sm">
 New to MediWyz?{' '}
 <Link href="/signup" className="text-primary-blue hover:underline font-medium">
 Create an account
 </Link>
 </p>
 </div>

 {/* Help */}
 <div className="mt-4 text-center">
 <Link href="/help" className="text-xs text-gray-500 hover:underline">
 Need help? Contact Support
 </Link>
 </div>
 </div>
 )
}

export default LoginForm
