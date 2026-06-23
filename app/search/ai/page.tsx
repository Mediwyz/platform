'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FaRobot, FaSignInAlt, FaUserPlus, FaShieldAlt } from 'react-icons/fa'
import BotHealthAssistant from '@/app/patient/(dashboard)/components/BotHealthAssistant'

interface Me {
  user?: { id: string; firstName: string; healthScore?: number }
}

export default function PublicAIAssistantPage() {
  const [me, setMe] = useState<Me | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data?.user) setMe(data)
      })
      .catch(() => {})
      .finally(() => setChecked(true))
  }, [])

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-subtle">
        <div className="w-10 h-10 border-2 border-[#0C6780] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Authenticated  render the canonical MediWyz AI component used everywhere
  // else (patient, provider, admin, regional dashboards). Same sessions API,
  // same UX.
  if (me?.user) {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <BotHealthAssistant
          userName={me.user.firstName}
          healthScore={me.user.healthScore}
        />
      </div>
    )
  }

  // Guest  invite them to sign in. The floating widget at the bottom-right
  // remains available for one-off questions without an account.
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001E40] via-[#0a3d62] to-[#0C6780] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl bg-surface rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#001E40] to-[#0C6780] px-6 sm:px-10 py-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white/15 flex items-center justify-center mb-4">
            <FaRobot className="text-3xl text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">MediWyz AI Assistant</h1>
          <p className="text-sm sm:text-base text-white/85">
            Personalised health guidance powered by your profile, conditions, goals, and tracker data.
          </p>
        </div>

        <div className="px-6 sm:px-10 py-7 space-y-5">
          <ul className="space-y-3 text-sm text-soft">
            <li className="flex gap-3">
              <span className="text-[#0C6780] flex-shrink-0"></span>
              <span>Conversations grounded in <strong>your real profile</strong> - allergies, medications, goals, recent activity.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#0C6780] flex-shrink-0"></span>
              <span>Saved chat history across all your sessions.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#0C6780] flex-shrink-0"></span>
              <span>Booking, medication, and emergency guidance - all in one place.</span>
            </li>
          </ul>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-3">
            <FaShieldAlt className="text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-900 leading-relaxed">
              For medical emergencies, call <strong>114</strong> immediately. The assistant provides general guidance only - never diagnoses.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Link
              href="/login?returnUrl=%2Fsearch%2Fai"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0C6780] text-white font-semibold hover:bg-[#001E40] transition"
            >
              <FaSignInAlt /> Sign in
            </Link>
            <Link
              href="/signup?returnUrl=%2Fsearch%2Fai"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-surface border-2 border-[#0C6780] text-[#0C6780] font-semibold hover:bg-[#0C6780] hover:text-white transition"
            >
              <FaUserPlus /> Create account
            </Link>
          </div>

          <p className="text-center text-xs text-soft pt-1">
            Just want a quick question? Use the <strong>Assistant Sant IA</strong> bubble at the bottom right of every page.
          </p>
        </div>
      </div>
    </div>
  )
}
