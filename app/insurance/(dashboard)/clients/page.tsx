'use client'

import { useState, useEffect, useCallback } from 'react'
import {
 FaUsers, FaSearch, FaEye, FaTrash, FaTimes
} from 'react-icons/fa'
import { useUser } from '@/hooks/useUser'

interface ClaimRecord {
 id: string
 claimId: string
 policyHolderName: string
 policyType: string
 claimAmount: number
 status: string
 submittedDate: string
 description: string
}

const statusConfig: Record<string, { label: string; color: string }> = {
 pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
 approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
 rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
 denied: { label: 'Denied', color: 'bg-red-100 text-red-800' },
 processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800' },
 cancelled: { label: 'Cancelled', color: 'bg-subtle text-fg' },
}

export default function InsuranceClientsPage() {
 const [claims, setClaims] = useState<ClaimRecord[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)
 const { user: currentUser } = useUser()
 const userId = currentUser?.id ?? ''
 const [searchTerm, setSearchTerm] = useState('')

 const fetchClaims = useCallback(async () => {
  if (!userId) return
  try {
   setLoading(true)
   setError(null)
   // Backend getDashboard returns: { total, pending, approved, denied, totalCoverage, recentClaims }
   const res = await fetch(`/api/insurance/${userId}/dashboard`, { credentials: 'include' })
   if (!res.ok) throw new Error('Failed to fetch data')
   const json = await res.json()
   if (json.success) {
    const apiData = json.data
    // Map recentClaims to display format
    const records: ClaimRecord[] = (apiData.recentClaims || []).map(
     (c: {
      id: string
      claimId: string
      policyHolderName: string
      policyType: string
      claimAmount: number
      status: string
      submittedDate: string
      description?: string
      patient?: { user?: { firstName?: string; lastName?: string } }
     }) => ({
      id: c.id,
      claimId: c.claimId || `CLM-${c.id.slice(0, 8)}`,
      policyHolderName: c.policyHolderName || (c.patient?.user ? `${c.patient.user.firstName} ${c.patient.user.lastName}` : 'Unknown'),
      policyType: c.policyType || 'General',
      claimAmount: c.claimAmount || 0,
      status: c.status || 'pending',
      submittedDate: c.submittedDate ? new Date(c.submittedDate).toLocaleDateString() : '',
      description: c.description || '',
     })
    )
    setClaims(records)
   }
  } catch (err) {
   setError(err instanceof Error ? err.message : 'An error occurred')
  } finally {
   setLoading(false)
  }
 }, [userId])

 useEffect(() => {
  fetchClaims()
 }, [fetchClaims])

 const handleDelete = async (claimId: string) => {
  if (!confirm('Are you sure you want to cancel this claim?')) return
  try {
   const res = await fetch(`/api/insurance/claims/${claimId}`, {
    method: 'DELETE',
    credentials: 'include',
   })
   if (res.ok) {
    setClaims(prev => prev.filter(c => c.id !== claimId))
   }
  } catch (err) {
   console.error('Failed to delete claim:', err)
  }
 }

 const handleView = (claimId: string) => {
  window.location.href = `/insurance/claims?view=${claimId}`
 }

 const filteredClaims = claims.filter(claim => {
  if (!searchTerm) return true
  const term = searchTerm.toLowerCase()
  return (
   claim.policyHolderName.toLowerCase().includes(term) ||
   claim.claimId.toLowerCase().includes(term) ||
   claim.policyType.toLowerCase().includes(term)
  )
 })

 return (
  <div className="p-6 max-w-7xl mx-auto">
   {/* Header */}
   <div className="flex items-center gap-3 mb-8">
    <FaUsers className="text-3xl text-purple-600" />
    <div>
     <h1 className="text-2xl font-bold text-fg">Claims & Clients</h1>
     <p className="text-sm text-soft">View recent claims and client activity</p>
    </div>
   </div>

   {/* Error Banner */}
   {error && (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
     <span>{error}</span>
     <button onClick={() => setError(null)}>
      <FaTimes className="text-red-400 hover:text-red-600" />
     </button>
    </div>
   )}

   {/* Search */}
   <div className="flex flex-col sm:flex-row gap-4 mb-6">
    <div className="relative flex-1">
     <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
     <input
      type="text"
      placeholder="Search by name, claim ID, or type..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full pl-10 pr-4 py-2.5 border border-line rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
     />
    </div>
   </div>

   {/* Loading */}
   {loading ? (
    <div className="flex justify-center items-center py-20">
     <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-600"></div>
    </div>
   ) : filteredClaims.length === 0 ? (
    /* Empty State */
    <div className="text-center py-20 bg-subtle rounded-xl border border-dashed border-line">
     <FaUsers className="mx-auto text-4xl text-faint mb-4" />
     <h3 className="text-lg font-medium text-soft mb-1">No claims found</h3>
     <p className="text-sm text-faint">
      {searchTerm
       ? 'Try adjusting your search term.'
       : 'Claims will appear here when they are submitted.'}
     </p>
    </div>
   ) : (
    /* Claims Table */
    <div className="bg-surface rounded-xl border border-line shadow-sm overflow-hidden">
     <div className="overflow-x-auto">
      <table className="w-full">
       <thead>
        <tr className="bg-subtle border-b border-line">
         <th className="text-left px-6 py-3.5 text-xs font-semibold text-soft uppercase tracking-wider">
          Claim ID
         </th>
         <th className="text-left px-6 py-3.5 text-xs font-semibold text-soft uppercase tracking-wider">
          Claimant
         </th>
         <th className="text-left px-6 py-3.5 text-xs font-semibold text-soft uppercase tracking-wider">
          Type
         </th>
         <th className="text-right px-6 py-3.5 text-xs font-semibold text-soft uppercase tracking-wider">
          Amount (MUR)
         </th>
         <th className="text-center px-6 py-3.5 text-xs font-semibold text-soft uppercase tracking-wider">
          Status
         </th>
         <th className="text-left px-6 py-3.5 text-xs font-semibold text-soft uppercase tracking-wider">
          Date
         </th>
         <th className="text-center px-6 py-3.5 text-xs font-semibold text-soft uppercase tracking-wider">
          Actions
         </th>
        </tr>
       </thead>
       <tbody className="divide-y divide-line">
        {filteredClaims.map((claim) => {
         const info = statusConfig[claim.status] || statusConfig.pending
         return (
          <tr key={claim.id} className="hover:bg-subtle transition-colors">
           <td className="px-6 py-4 font-mono text-sm text-soft">
            {claim.claimId}
           </td>
           <td className="px-6 py-4">
            <p className="font-medium text-fg">{claim.policyHolderName}</p>
            {claim.description && (
             <p className="text-xs text-soft mt-0.5 line-clamp-1 max-w-xs">{claim.description}</p>
            )}
           </td>
           <td className="px-6 py-4 text-soft">{claim.policyType}</td>
           <td className="px-6 py-4 text-right font-semibold text-fg">
            Rs {claim.claimAmount.toLocaleString()}
           </td>
           <td className="px-6 py-4 text-center">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${info.color}`}>
             {info.label}
            </span>
           </td>
           <td className="px-6 py-4 text-sm text-soft">{claim.submittedDate}</td>
           <td className="px-6 py-4">
            <div className="flex items-center justify-center gap-1">
             <button
              onClick={() => handleView(claim.id)}
              className="p-2 text-faint hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="View Details"
             >
              <FaEye />
             </button>
             <button
              onClick={() => handleDelete(claim.id)}
              className="p-2 text-faint hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Cancel Claim"
             >
              <FaTrash />
             </button>
            </div>
           </td>
          </tr>
         )
        })}
       </tbody>
      </table>
     </div>
    </div>
   )}
  </div>
 )
}
