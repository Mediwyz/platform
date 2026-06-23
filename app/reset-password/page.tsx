'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { FaLock, FaKey, FaCheckCircle } from 'react-icons/fa'
import { useTranslation } from '@/lib/i18n'

function ResetInner() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const initialToken = searchParams?.get('token') || ''
  const [token, setToken] = useState(initialToken)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => { if (initialToken) setToken(initialToken) }, [initialToken])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 6) { setError(t('auth.passwordTooShort')); return }
    if (password !== confirm) { setError(t('auth.passwordsMismatch')); return }
    setBusy(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const json = await res.json()
      if (json.success) {
        setDone(true)
      } else {
        setError(json.message || t('common.error'))
      }
    } catch {
      setError(t('auth.networkError'))
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-subtle px-4">
        <div className="w-full max-w-md bg-surface rounded-2xl shadow-sm p-8 text-center">
          <FaCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-fg mb-2">{t('auth.passwordUpdated')}</h1>
          <p className="text-sm text-soft mb-6">{t('auth.passwordUpdatedDesc')}</p>
          <Link
            href="/login"
            className="inline-block px-6 py-2.5 bg-[#0C6780] text-white rounded-lg font-medium hover:bg-[#0a5568]"
          >
            {t('common.login')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-subtle px-4">
      <div className="w-full max-w-md bg-surface rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-fg mb-2">{t('auth.resetPassword')}</h1>
        <p className="text-sm text-soft mb-6">{t('auth.chooseNewPassword')}</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-soft mb-1.5">{t('auth.resetToken')}</label>
            <div className="relative">
              <FaKey className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <input
                type="text"
                required
                value={token}
                onChange={e => setToken(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-line rounded-lg font-mono text-xs focus:ring-2 focus:ring-[#0C6780] focus:border-[#0C6780] outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-soft mb-1.5">{t('auth.newPassword')}</label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-line rounded-lg focus:ring-2 focus:ring-[#0C6780] focus:border-[#0C6780] outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-soft mb-1.5">{t('auth.confirmNewPassword')}</label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <input
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-line rounded-lg focus:ring-2 focus:ring-[#0C6780] focus:border-[#0C6780] outline-none"
              />
            </div>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 bg-[#0C6780] text-white rounded-lg font-medium hover:bg-[#0a5568] disabled:bg-gray-300"
          >
            {busy ? t('auth.updating') : t('auth.updatePassword')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <ResetInner />
    </Suspense>
  )
}
