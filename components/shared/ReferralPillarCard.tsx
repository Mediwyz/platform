'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { FaShareAlt, FaCopy, FaGift } from 'react-icons/fa'
import { useT } from '@/lib/i18n/useT'

/**
 * MediWyz treats every user - including MEMBER - as a "provider of money"
 * via referrals. Every authenticated user auto-provisions a
 * `ReferralPartnerProfile` on first use, with a unique code that earns
 * wallet credit on successful signup attribution.
 *
 * This card surfaces the referral pillar on the member dashboard so the
 * platform's core loop (book  refer  earn) is visible, not buried in a
 * hidden menu. Other provider roles have this too - it's universal.
 */
interface ReferralPillarCardProps {
  userId: string
}

interface ReferralState {
  referralCode: string | null
  totalReferrals: number
  totalEarned: number
  currency: string
}

export default function ReferralPillarCard({ userId }: ReferralPillarCardProps) {
  const t = useT()
  const [state, setState] = useState<ReferralState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    fetch('/api/referral-partners/me', { credentials: 'include' })
      .then(r => r.json())
      .then(j => {
        if (j?.success && j.data) {
          // API shape: { data: { stats: { referralCode, totalEarnings, ... }, recentConversions, leadsBySource } }
          // Some deployments return the stats flat at data. Handle both.
          const stats = j.data.stats ?? j.data
          setState({
            referralCode: stats.referralCode ?? null,
            totalReferrals: stats.totalReferrals ?? 0,
            totalEarned: stats.totalEarnings ?? stats.totalCommissionEarned ?? stats.totalEarned ?? 0,
            currency: stats.currency ?? 'Rs',
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  async function copyLink() {
    if (!state?.referralCode) return
    const url = `${window.location.origin}/signup?ref=${state.referralCode}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success(t('referral.copied'))
    } catch {
      toast.error('Could not copy - select and copy manually')
    }
  }

  async function shareNative() {
    if (!state?.referralCode) return
    const url = `${window.location.origin}/signup?ref=${state.referralCode}`
    const text = 'Join MediWyz - your health, simplified.'
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'MediWyz', text, url })
      } catch {
        // User cancelled - no-op
      }
    } else {
      copyLink()
    }
  }

  if (loading) {
    return (
      <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-line animate-pulse h-32" />
    )
  }

  if (!state?.referralCode) {
    // User hasn't been provisioned yet (rare - auto-provisioned on first /me hit)
    return null
  }

  return (
    <div className="bg-gradient-to-br from-brand-navy via-brand-teal to-brand-navy rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-lg text-white">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <FaGift className="text-2xl" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold">{t('referral.title')}</h3>
            <p className="text-xs sm:text-sm text-white/80">
              {t('referral.subtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/10 rounded-lg p-3">
          <p className="text-[11px] uppercase tracking-wider text-white/70">{t('referral.stat.referrals')}</p>
          <p className="text-xl sm:text-2xl font-bold">{state.totalReferrals}</p>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <p className="text-[11px] uppercase tracking-wider text-white/70">{t('referral.stat.earned')}</p>
          <p className="text-xl sm:text-2xl font-bold">
            {state.currency} {state.totalEarned.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white/15 rounded-lg p-3 mb-3">
        <p className="text-[11px] uppercase tracking-wider text-white/70 mb-1">{t('referral.code.label')}</p>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono font-bold text-lg tracking-wider">{state.referralCode}</span>
          <button
            onClick={copyLink}
            aria-label="Copy referral link"
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition"
          >
            <FaCopy className="text-sm" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={shareNative}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-surface text-brand-navy font-semibold text-sm py-2.5 rounded-lg hover:bg-subtle transition"
        >
          <FaShareAlt /> {t('referral.share')}
        </button>
      </div>
    </div>
  )
}
