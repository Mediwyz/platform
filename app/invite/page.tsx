'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaGift, FaCopy, FaShareAlt, FaCheckCircle } from 'react-icons/fa'
import DashboardPageHeader from '@/components/shared/DashboardPageHeader'

interface Dashboard {
  stats: {
    referralCode: string
    totalEarnings: number
    totalReferrals: number
    conversionRate: number
    thisMonthEarnings: number
    thisMonthReferrals: number
    pendingPayouts: number
  }
  recentConversions: Array<{
    id: string; firstName: string; lastName: string; userType: string; createdAt: string
  }>
}

/**
 * Invite-friends page - every user lands here from the "Invite friends"
 * sidebar entry. Shows their unique referral code, quick copy/share, +
 * how much they've earned so far. Backend lazy-provisions a code on
 * first access so there's never a blank state.
 */
export default function InviteFriendsPage() {
  const router = useRouter()
  const [data, setData] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/referral-partners/me', { credentials: 'include' })
      .then(r => r.json())
      .then(json => { if (json?.success) setData(json.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const code = data?.stats.referralCode ?? ''
  const shareUrl = typeof window !== 'undefined' && code
    ? `${window.location.origin}/signup?ref=${code}`
    : ''

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch { /* silent */ }
  }

  const share = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator && shareUrl) {
      try {
        await (navigator as any).share({
          title: 'Join me on MediWyz',
          text: 'I\'ve been using MediWyz for my health - join me and we both earn credit.',
          url: shareUrl,
        })
      } catch { /* user cancelled */ }
    } else {
      copyLink()
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      <DashboardPageHeader
        icon={FaGift}
        title="Invite friends, earn credit"
        description="Share your code — you both earn wallet credit when they sign up."
        back={{ label: 'Home', onClick: () => router.push('/') }}
      />

      {loading ? (
        <div className="py-12 text-center text-gray-400 text-sm">Loading your code…</div>
      ) : !data ? (
        <div className="py-12 text-center text-gray-500">Unable to load referral info.</div>
      ) : (
        <>
          {/* Hero card with code + share */}
          <div className="bg-gradient-to-br from-[#0C6780] to-[#001E40] text-white rounded-2xl p-6 shadow-lg">
            <p className="text-sm text-white/80 mb-1">Your referral code</p>
            <p className="text-3xl font-bold tracking-[4px] font-mono mb-1">{code}</p>
            <p className="text-xs text-white/70 break-all">{shareUrl}</p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={copyLink}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-[#0C6780] rounded-lg text-sm font-semibold hover:bg-gray-100"
              >
                {copied ? <><FaCheckCircle /> Copied!</> : <><FaCopy /> Copy link</>}
              </button>
              <button
                onClick={share}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/20 text-white rounded-lg text-sm font-semibold hover:bg-white/30 border border-white/40"
              >
                <FaShareAlt /> Share
              </button>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-bold text-gray-900 mb-3">How it works</h2>
            <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
              <li>Share your code or link with a friend.</li>
              <li>They sign up and enter your code during registration.</li>
              <li>You both get wallet credit - instant, no waiting period.</li>
            </ol>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatTile label="Total earnings" value={`MUR ${data.stats.totalEarnings.toLocaleString()}`} />
            <StatTile label="Referrals" value={data.stats.totalReferrals} />
            <StatTile label="This month" value={data.stats.thisMonthReferrals} />
            <StatTile label="Conversion" value={`${data.stats.conversionRate}%`} />
          </div>

          {/* Recent conversions */}
          {data.recentConversions.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-sm text-gray-900">Recent signups</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {data.recentConversions.map(c => (
                  <div key={c.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {c.firstName} {c.lastName}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{c.userType.replace('_', ' ').toLowerCase()}</p>
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-lg p-3">
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}
