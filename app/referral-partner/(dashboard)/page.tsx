'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
 FaDollarSign,
 FaUsers,
 FaChartLine,
 FaTrophy,
} from 'react-icons/fa'
import { useUser } from '@/hooks/useUser'
import { ReferralPartnerData } from '../types'
import StatCard from './StatCard'
import UTMLinkGenerator from './UTMLinkGenerator'
import LeadPerformance from './LeadPerformance'
import RecentConversions from './RecentConversions'
import WalletBalanceCard from '@/components/shared/WalletBalanceCard'

function computeNextPayoutDate(): string {
 const now = new Date()
 const day = now.getDate()
 let payoutDate: Date

 if (day < 15) {
  // Next payout is the 15th of this month
  payoutDate = new Date(now.getFullYear(), now.getMonth(), 15)
 } else {
  // Next payout is the 1st of next month
  payoutDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
 }

 return payoutDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function ReferralPartnerDashboard() {
 const [partnerData, setPartnerData] = useState<ReferralPartnerData>({
  name: '', email: '', avatar: '', memberSince: '', partnerLevel: 'Bronze', promoCode: '',
  stats: { totalEarnings: 0, totalReferrals: 0, conversionRate: 0, thisMonthEarnings: 0, thisMonthReferrals: 0, pendingPayouts: 0 },
  earnings: { totalRevenue: 0, paidOut: 0, pending: 0, nextPayoutDate: computeNextPayoutDate() },
  leadsBySource: [],
  recentConversions: [],
 })
 const { user: currentUser } = useUser()
 const userId = currentUser?.id ?? ''
 const [loading, setLoading] = useState(true)

 useEffect(() => {
  if (!userId) return

  const fetchDashboard = async () => {
   try {
    const res = await fetch(`/api/referral-partners/${userId}/dashboard`, { credentials: 'include' })
    if (res.ok) {
     const json = await res.json()
     if (json.success) {
      // Backend returns: { profile, stats: { totalClicks, totalConversions, totalCommission, conversionRate }, recentClicks, topSources }
      const { profile, stats, recentClicks = [], topSources = [] } = json.data

      // Map topSources from API into LeadSourceData[] format
      const mappedLeads: typeof partnerData.leadsBySource = topSources.map((s: { source: string; count: number }) => ({
       source: s.source.charAt(0).toUpperCase() + s.source.slice(1),
       visitors: s.count,
       conversions: 0,
       conversionRate: 0,
       earnings: 0,
       utmLink: '',
      }))

      // Map recentClicks to conversions display
      const mappedConversions = recentClicks
       .filter((c: { converted: boolean }) => c.converted)
       .map((c: { id: string; source: string; medium: string; createdAt: string }) => ({
        id: c.id,
        customerName: c.source || 'Direct',
        planType: c.medium || 'Referral',
        conversionDate: c.createdAt,
        commission: 100, // Rs 100 signup bonus per referral
        status: 'completed' as const,
       }))

      setPartnerData(prev => ({
       ...prev,
       promoCode: profile?.referralCode || prev.promoCode,
       stats: {
        totalEarnings: stats.totalCommission ?? 0,
        totalReferrals: profile?.totalReferrals ?? stats.totalClicks ?? 0,
        conversionRate: stats.conversionRate ?? 0,
        thisMonthEarnings: stats.totalCommission ?? 0,
        thisMonthReferrals: stats.totalConversions ?? 0,
        pendingPayouts: 0,
       },
       earnings: {
        totalRevenue: stats.totalCommission ?? 0,
        paidOut: stats.totalCommission ?? 0,
        pending: 0,
        nextPayoutDate: prev.earnings.nextPayoutDate || computeNextPayoutDate(),
       },
       leadsBySource: mappedLeads,
       recentConversions: mappedConversions,
      }))
     }
    }
   } catch (error) {
    console.error('Failed to fetch referral partner dashboard:', error)
   } finally {
    setLoading(false)
   }
  }

  fetchDashboard()
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [userId])

 return (
  <>
   {userId && (
    <div className="mb-8">
     <WalletBalanceCard userId={userId} />
    </div>
   )}

   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <StatCard
     icon={FaDollarSign}
     title="Total Earnings"
     value={loading ? '...' : `Rs ${partnerData.stats.totalEarnings.toLocaleString()}`}
     subtitle="Lifetime commission"
     color="bg-green-500"
     trend={0}
    />
    <StatCard
     icon={FaUsers}
     title="Total Referrals"
     value={partnerData.stats.totalReferrals}
     subtitle="People referred"
     color="bg-blue-500"
     trend={0}
    />
    <StatCard
     icon={FaChartLine}
     title="Conversion Rate"
     value={`${partnerData.stats.conversionRate}%`}
     subtitle="Clicks to conversions"
     color="bg-purple-500"
     trend={0}
    />
    <StatCard
     icon={FaDollarSign}
     title="This Month"
     value={loading ? '...' : `Rs ${partnerData.stats.thisMonthEarnings.toLocaleString()}`}
     subtitle={`${partnerData.stats.thisMonthReferrals} conversions`}
     color="bg-orange-500"
     trend={0}
    />
   </div>

   <div className="grid lg:grid-cols-3 gap-8">
    <div className="lg:col-span-2 space-y-8">
     <UTMLinkGenerator promoCode={partnerData.promoCode} />
     <LeadPerformance leadsBySource={partnerData.leadsBySource} />
    </div>

    <div className="space-y-8">
     <div className="bg-brand-navy text-white rounded-2xl p-6">
      <h3 className="text-lg font-bold mb-2">Your Promo Code</h3>
      <div className="bg-white/20 rounded-lg p-3 mb-4">
       <p className="text-2xl font-bold font-mono">{partnerData.promoCode}</p>
      </div>
      <p className="text-white/90 text-sm mb-4">
       Share this code with potential customers to earn commissions
      </p>
      <button
       onClick={() => navigator.clipboard.writeText(partnerData.promoCode)}
       className="bg-white text-purple-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition w-full"
      >
       Copy Code
      </button>
     </div>

     <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
       <h3 className="text-lg font-bold text-gray-900">Earnings Summary</h3>
       <Link href="/referral-partner/billing" className="text-purple-600 text-sm hover:underline">
        View Details
       </Link>
      </div>
      <div className="space-y-3">
       <div className="flex justify-between text-sm">
        <span className="text-gray-600">Total Revenue</span>
        <span className="font-medium">Rs {partnerData.earnings.totalRevenue.toLocaleString()}</span>
       </div>
       <div className="flex justify-between text-sm">
        <span className="text-gray-600">Paid Out</span>
        <span className="font-medium text-green-600">Rs {partnerData.earnings.paidOut.toLocaleString()}</span>
       </div>
       <div className="flex justify-between text-sm">
        <span className="text-gray-600">Pending</span>
        <span className="font-medium text-orange-600">Rs {partnerData.earnings.pending.toLocaleString()}</span>
       </div>
       <div className="border-t pt-3 mt-3 flex justify-between">
        <span className="font-bold">Next Payout</span>
        <span className="font-bold text-purple-600">{partnerData.earnings.nextPayoutDate}</span>
       </div>
      </div>
     </div>

     <RecentConversions conversions={partnerData.recentConversions} />

     <div className=" border border-yellow-200 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-yellow-800 mb-2 flex items-center gap-2">
       <FaTrophy />
       Partner Level Progress
      </h3>
      <div className="mb-4">
       <div className="flex justify-between text-sm mb-2">
        <span className="text-yellow-700">Current: {partnerData.partnerLevel}</span>
        <span className="text-yellow-700">
         {partnerData.partnerLevel === 'Diamond' ? 'Max Level!' : 'Next: Diamond'}
        </span>
       </div>
       <div className="w-full bg-yellow-200 rounded-full h-2">
        <div
         className="bg-yellow-500 h-2 rounded-full transition-all"
         style={{ width: partnerData.partnerLevel === 'Gold' ? '75%' : '100%' }}
        />
       </div>
      </div>
      <div className="text-yellow-700 text-sm">
       <p className="mb-2">Benefits at {partnerData.partnerLevel} level:</p>
       <ul className="space-y-1 text-xs">
        <li>&bull; Up to 25% commission rate</li>
        <li>&bull; Priority support</li>
        <li>&bull; Marketing materials</li>
        <li>&bull; Monthly performance calls</li>
       </ul>
      </div>
     </div>

    </div>
   </div>
  </>
 )
}
