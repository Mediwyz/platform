'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FaCheck, FaChevronRight, FaTimes } from 'react-icons/fa'

/**
 * Dismissible activation checklist per the SaaS best-practice rule:
 * users should reach their first meaningful action in ≤3 steps. Shown
 * on the dashboard for new users; hidden once all items are done OR
 * the user taps the × once (preference persists via localStorage).
 *
 * Each item fires a GET against its "done?" endpoint, so progress is
 * derived from real state - nothing to reset, nothing to game.
 */

interface Step {
  id: string
  label: string
  description: string
  href: string
  check: () => Promise<boolean>
}

const DISMISS_KEY = 'mediwyz_onboarding_dismissed'

export default function OnboardingChecklist({ userId }: { userId: string }) {
  const [done, setDone] = useState<Record<string, boolean>>({})
  const [dismissed, setDismissed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const steps: Step[] = [
    {
      id: 'check-in',
      label: 'Check in on your health today',
      description: 'Start a streak by logging one thing you care about.',
      href: '/patient/ai-assistant',
      check: async () => {
        try {
          const r = await fetch('/api/health-streak', { credentials: 'include' })
          const j = await r.json()
          return !!j?.data?.checkedInToday
        } catch { return false }
      },
    },
    {
      id: 'favorite',
      label: 'Save a provider for later',
      description: 'Tap ⭐ on any provider for one-tap rebooking.',
      href: '/search/doctors',
      check: async () => {
        try {
          const r = await fetch('/api/favorites', { credentials: 'include' })
          const j = await r.json()
          return Array.isArray(j?.data) && j.data.length > 0
        } catch { return false }
      },
    },
    {
      id: 'first-booking',
      label: 'Book your first visit',
      description: 'Video, home, or in-person - book in under 60 seconds.',
      href: '/search/doctors',
      check: async () => {
        try {
          const r = await fetch('/api/bookings/unified?role=patient', { credentials: 'include' })
          const j = await r.json()
          return Array.isArray(j?.data) && j.data.length > 0
        } catch { return false }
      },
    },
  ]

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(DISMISS_KEY) === 'true') {
      setDismissed(true)
      setLoaded(true)
      return
    }
    if (!userId) return
    let cancelled = false
    Promise.all(steps.map(s => s.check().then(v => [s.id, v] as const)))
      .then(entries => {
        if (cancelled) return
        setDone(Object.fromEntries(entries))
        setLoaded(true)
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const doneCount = Object.values(done).filter(Boolean).length
  const allDone = doneCount === steps.length

  if (!loaded || dismissed || allDone) return null

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true')
    setDismissed(true)
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-sky-50 border border-sky-200 rounded-xl p-5 mb-6">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="font-bold text-gray-900">Get the most out of MediWyz</h2>
          <p className="text-xs text-gray-500">
            {doneCount}/{steps.length} steps · takes about a minute
          </p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss onboarding"
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <FaTimes />
        </button>
      </div>
      <div className="h-1.5 bg-white rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-[#0C6780] transition-all"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>
      <div className="space-y-2">
        {steps.map(step => {
          const isDone = done[step.id]
          return (
            <Link
              key={step.id}
              href={step.href}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                isDone
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-gray-200 hover:border-[#0C6780]'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isDone ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400 border border-gray-300'
                }`}
              >
                {isDone ? <FaCheck className="text-xs" /> : <span className="text-xs font-bold">{steps.indexOf(step) + 1}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${isDone ? 'text-green-700 line-through' : 'text-gray-900'}`}>
                  {step.label}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
              {!isDone && <FaChevronRight className="text-gray-400 text-xs" />}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
