'use client'

import { useState, useEffect } from 'react'
import { FaHandshake, FaSpinner, FaSearch, FaCheckCircle, FaClock, FaTimesCircle } from 'react-icons/fa'
import { useUser } from '@/hooks/useUser'

interface Referral {
 id: string
 referredName: string
 referredEmail: string
 date: string
 status: 'pending' | 'converted' | 'expired'
 commissionEarned: number
}

export default function ReferralsPage() {
 const [referrals, setReferrals] = useState<Referral[]>([])
 const [loading, setLoading] = useState(true)
 const { user: currentUser } = useUser()
 const userId = currentUser?.id ?? ''
 const [searchTerm, setSearchTerm] = useState('')
 const [filterStatus, setFilterStatus] = useState<string>('all')

 useEffect(() => {
  if (!userId) return

  const fetchReferrals = async () => {
   try {
    const res = await fetch(`/api/referral-partners/${userId}/dashboard`, { credentials: 'include' })
    if (res.ok) {
     const json = await res.json()
     if (json.success) {
      // Backend returns: { profile, stats, recentClicks, topSources }
      // Map recentClicks to referral format
      const clicks = json.data.recentClicks || []
      const mapped: Referral[] = clicks.map((click: {
       id: string
       source: string | null
       medium: string | null
       converted: boolean
       createdAt: string
      }) => ({
       id: click.id,
       referredName: click.source || 'Direct Visit',
       referredEmail: click.medium || '',
       date: click.createdAt,
       status: click.converted ? 'converted' as const : 'pending' as const,
       commissionEarned: click.converted ? 100 : 0,
      }))
      setReferrals(mapped)
     }
    }
   } catch (error) {
    console.error('Failed to fetch referrals:', error)
   } finally {
    setLoading(false)
   }
  }

  fetchReferrals()
 }, [userId])

 const statusIcon = (status: Referral['status']) => {
  switch (status) {
   case 'converted': return <FaCheckCircle className="text-green-500" />
   case 'pending': return <FaClock className="text-yellow-500" />
   case 'expired': return <FaTimesCircle className="text-red-500" />
  }
 }

 const statusBadge = (status: Referral['status']) => {
  const styles = {
   converted: 'bg-green-100 text-green-800',
   pending: 'bg-yellow-100 text-yellow-800',
   expired: 'bg-red-100 text-red-800',
  }
  return (
   <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
    {statusIcon(status)}
    {status.charAt(0).toUpperCase() + status.slice(1)}
   </span>
  )
 }

 const filteredReferrals = referrals.filter(r => {
  const matchesSearch = r.referredName.toLowerCase().includes(searchTerm.toLowerCase()) ||
   r.referredEmail.toLowerCase().includes(searchTerm.toLowerCase())
  const matchesFilter = filterStatus === 'all' || r.status === filterStatus
  return matchesSearch && matchesFilter
 })

 const stats = {
  total: referrals.length,
  converted: referrals.filter(r => r.status === 'converted').length,
  pending: referrals.filter(r => r.status === 'pending').length,
  totalCommission: referrals.reduce((sum, r) => sum + r.commissionEarned, 0),
 }

 return (
  <div className="space-y-6">
   <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
    <FaHandshake className="text-indigo-500" /> My Referrals
   </h1>

   {loading ? (
    <div className="flex justify-center py-12">
     <FaSpinner className="animate-spin text-2xl text-indigo-500" />
    </div>
   ) : (
    <>
     <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-surface rounded-xl p-5 shadow-lg">
       <p className="text-soft text-sm">Total Clicks</p>
       <p className="text-2xl font-bold text-fg mt-1">{stats.total}</p>
      </div>
      <div className="bg-surface rounded-xl p-5 shadow-lg">
       <p className="text-soft text-sm">Converted</p>
       <p className="text-2xl font-bold text-green-600 mt-1">{stats.converted}</p>
      </div>
      <div className="bg-surface rounded-xl p-5 shadow-lg">
       <p className="text-soft text-sm">Pending</p>
       <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
      </div>
      <div className="bg-surface rounded-xl p-5 shadow-lg">
       <p className="text-soft text-sm">Total Commission</p>
       <p className="text-2xl font-bold text-indigo-600 mt-1">Rs {stats.totalCommission.toLocaleString()}</p>
      </div>
     </div>

     <div className="bg-surface rounded-xl shadow-lg">
      <div className="p-4 border-b flex flex-col sm:flex-row gap-3">
       <div className="relative flex-1">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
        <input
         type="text"
         placeholder="Search referrals..."
         value={searchTerm}
         onChange={(e) => setSearchTerm(e.target.value)}
         className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
       </div>
       <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
       >
        <option value="all">All Status</option>
        <option value="pending">Pending</option>
        <option value="converted">Converted</option>
        <option value="expired">Expired</option>
       </select>
      </div>

      {filteredReferrals.length === 0 ? (
       <div className="p-12 text-center">
        <FaHandshake className="mx-auto text-4xl text-faint mb-4" />
        <h3 className="text-lg font-semibold text-soft mb-2">No referral clicks yet</h3>
        <p className="text-soft text-sm">Share your promo code to start earning!</p>
       </div>
      ) : (
       <div className="overflow-x-auto">
        <table className="w-full">
         <thead>
          <tr className="text-left text-xs font-medium text-soft uppercase tracking-wider">
           <th className="px-6 py-3">Source</th>
           <th className="px-6 py-3">Date</th>
           <th className="px-6 py-3">Status</th>
           <th className="px-6 py-3 text-right">Commission Earned</th>
          </tr>
         </thead>
         <tbody className="divide-y divide-line">
          {filteredReferrals.map((referral) => (
           <tr key={referral.id} className="hover:bg-subtle transition-colors">
            <td className="px-6 py-4">
             <div>
              <p className="font-medium text-fg">{referral.referredName}</p>
              {referral.referredEmail && (
               <p className="text-soft text-sm">{referral.referredEmail}</p>
              )}
             </div>
            </td>
            <td className="px-6 py-4 text-sm text-soft">
             {new Date(referral.date).toLocaleDateString()}
            </td>
            <td className="px-6 py-4">
             {statusBadge(referral.status)}
            </td>
            <td className="px-6 py-4 text-right font-medium text-fg">
             Rs {referral.commissionEarned.toLocaleString()}
            </td>
           </tr>
          ))}
         </tbody>
        </table>
       </div>
      )}
     </div>
    </>
   )}
  </div>
 )
}
