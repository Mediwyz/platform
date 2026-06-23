'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { FaTimes, FaLock, FaSpinner, FaArrowRight } from 'react-icons/fa'
import { useBookingCart } from '@/lib/contexts/booking-cart-context'

export default function FloatingAuthFAB() {
  const { loginModalOpen, closeLoginModal, onAfterLogin } = useBookingCart()
  const [mounted, setMounted] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { setMounted(true) }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
        credentials: 'include',
      })
      const j = await res.json()
      if (j.success) {
        closeLoginModal()
        onAfterLogin?.()
      } else {
        setError(j.message || 'Incorrect email or password')
      }
    } catch {
      setError('Connection error - please try again')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <>
      {/*  Login modal (global, shared across the app)  */}
      <AnimatePresence>
        {loginModalOpen && (
          <>
            <motion.div
              key="auth-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
              onClick={closeLoginModal}
            />
            <motion.div
              key="auth-modal"
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="fixed inset-x-4 bottom-20 sm:inset-auto sm:bottom-44 sm:right-6 z-[90] sm:w-[340px] bg-surface rounded-2xl shadow-2xl overflow-hidden"
              style={{ boxShadow: '0 32px 80px rgba(0,30,64,0.30)' }}
            >
              {/* Header */}
              <div className="px-5 pt-5 pb-4 bg-gradient-to-r from-[#001E40] to-[#0C6780]">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FaLock className="text-[#9AE1FF] text-xs" />
                      <h3 className="text-sm font-bold text-white">Sign in to continue</h3>
                    </div>
                    <p className="text-[11px] text-white/60">
                      Join MediWyz - Africa&apos;s #1 HealthTech Platform
                    </p>
                  </div>
                  <button onClick={closeLoginModal} className="p-1.5 text-white/40 hover:text-white -mt-1 -mr-1 rounded-lg">
                    <FaTimes className="text-xs" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="px-5 py-4 space-y-3">
                <input
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  autoComplete="email"
                  required
                  className="w-full px-3 py-2.5 text-sm border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780]"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password"
                  required
                  className="w-full px-3 py-2.5 text-sm border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780]"
                />

                {error && (
                  <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#0C6780] text-white rounded-xl text-sm font-semibold
                    hover:bg-[#0a5a6e] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <FaSpinner className="animate-spin text-xs" /> : <FaLock className="text-xs" />}
                  {loading ? 'Signing in' : 'Sign In & Continue'}
                </button>

                <div className="flex items-center justify-between pt-0.5">
                  <Link href="/signup" className="text-xs text-[#0C6780] hover:underline font-medium">
                    Create free account
                  </Link>
                  <Link href="/login" className="text-xs text-faint hover:text-soft flex items-center gap-1">
                    Full login <FaArrowRight className="text-[8px]" />
                  </Link>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </>
  )
}
