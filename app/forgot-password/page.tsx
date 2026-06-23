'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FaEnvelope, FaKey, FaArrowLeft } from 'react-icons/fa'
import { useTranslation } from '@/lib/i18n'

/**
 * In-app password reset (no email). Two steps:
 *   1. Enter email  backend returns the account's security question (fake question for unknown emails)
 *   2. Answer the question  backend issues a short-lived token, we redirect to /reset-password?token=
 */
type Stage = 'email' | 'answer'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [stage, setStage] = useState<Stage>('email')
  const [email, setEmail] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/forgot-password/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()
      if (json.success) {
        setQuestion(json.question || '')
        setStage('answer')
      } else {
        setError(json.message || t('auth.couldNotContinue'))
      }
    } catch {
      setError(t('auth.networkError'))
    } finally {
      setBusy(false)
    }
  }

  const verify = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/forgot-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, answer }),
      })
      const json = await res.json()
      if (json.success && json.resetToken) {
        router.push(`/reset-password?token=${encodeURIComponent(json.resetToken)}`)
      } else {
        setError(json.message || t('auth.incorrectAnswer'))
      }
    } catch {
      setError(t('auth.networkError'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-subtle px-4">
      <div className="w-full max-w-md bg-surface rounded-2xl shadow-sm p-8">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-soft hover:text-soft mb-6">
          <FaArrowLeft /> {t('auth.backToSignIn')}
        </Link>
        <h1 className="text-2xl font-bold text-fg mb-2">{t('auth.forgotPassword')}</h1>
        <p className="text-sm text-soft mb-6">
          {stage === 'email' ? t('auth.enterEmailToContinue') : t('auth.answerToReset')}
        </p>

        {stage === 'email' && (
          <form onSubmit={lookup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-soft mb-1.5">{t('auth.email')}</label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-line rounded-lg focus:ring-2 focus:ring-[#0C6780] focus:border-[#0C6780] outline-none"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={busy || !email}
              className="w-full py-2.5 bg-[#0C6780] text-white rounded-lg font-medium hover:bg-[#0a5568] disabled:bg-gray-300"
            >
              {busy ? t('auth.checking') : t('auth.continue')}
            </button>
          </form>
        )}

        {stage === 'answer' && (
          <form onSubmit={verify} className="space-y-4">
            <div className="bg-[#9AE1FF]/20 border border-[#9AE1FF] rounded-lg p-4">
              <p className="text-xs font-semibold text-fg uppercase tracking-wide mb-1">{t('auth.securityQuestion')}</p>
              <p className="text-sm text-fg">{question}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-soft mb-1.5">{t('auth.yourAnswer')}</label>
              <div className="relative">
                <FaKey className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                <input
                  type="text"
                  required
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-line rounded-lg focus:ring-2 focus:ring-[#0C6780] focus:border-[#0C6780] outline-none"
                  autoFocus
                />
              </div>
              <p className="text-xs text-faint mt-1">{t('auth.answerCaseInsensitive')}</p>
            </div>
            <button
              type="submit"
              disabled={busy || !answer}
              className="w-full py-2.5 bg-[#0C6780] text-white rounded-lg font-medium hover:bg-[#0a5568] disabled:bg-gray-300"
            >
              {busy ? t('auth.verifying') : t('auth.verifyContinue')}
            </button>
            <button
              type="button"
              onClick={() => { setStage('email'); setError(null); setAnswer('') }}
              className="w-full py-2 text-sm text-soft hover:text-soft"
            >
              {t('auth.useDifferentEmail')}
            </button>
          </form>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
