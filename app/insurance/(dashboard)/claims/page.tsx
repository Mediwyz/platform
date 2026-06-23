'use client'

import { useState, useEffect, useCallback } from 'react'
import {
 FaFileAlt, FaSearch, FaClock, FaCheck,
 FaTimes, FaSpinner, FaEye, FaFilter, FaShieldAlt, FaPlus
} from 'react-icons/fa'
import { useUser } from '@/hooks/useUser'
import { useCurrency } from '@/hooks/useCurrency'
import { InsuranceClaim } from '../types'
import ClaimReviewDrawer, { ClaimDetail } from '@/components/insurance/ClaimReviewDrawer'
import OcrClaimModal from '@/components/insurance/OcrClaimModal'

const CLAIM_STATUSES = [
 { value: '', label: 'All Statuses' },
 { value: 'pending', label: 'Pending' },
 { value: 'processing', label: 'Processing' },
 { value: 'approved', label: 'Approved' },
 { value: 'rejected', label: 'Rejected' },
]

const getStatusInfo = (status: string) => {
 switch (status) {
 case 'pending':
 return { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800', icon: FaClock }
 case 'processing':
 return { label: 'Processing', color: 'bg-blue-100 text-blue-800', icon: FaSpinner }
 case 'approved':
 return { label: 'Approved', color: 'bg-green-100 text-green-800', icon: FaCheck }
 case 'rejected':
 return { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: FaTimes }
 default:
 return { label: status, color: 'bg-subtle text-fg', icon: FaEye }
 }
}

export default function InsuranceClaimsPage() {
 const [claims, setClaims] = useState<InsuranceClaim[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)
 const { user: currentUser } = useUser()
 const userId = currentUser?.id ?? ''
 const [statusFilter, setStatusFilter] = useState('')
 const [searchTerm, setSearchTerm] = useState('')
 const [reviewClaim, setReviewClaim] = useState<ClaimDetail | null>(null)
 const [showOcrModal, setShowOcrModal] = useState(false)
 const { format } = useCurrency()

 const fetchClaims = useCallback(async () => {
 if (!userId) return
 try {
 setLoading(true)
 setError(null)
 const params = new URLSearchParams({ limit: '50' })
 if (statusFilter) params.set('status', statusFilter)
 const res = await fetch(`/api/insurance/claims?${params}`, { credentials: 'include' })
 if (!res.ok) throw new Error('Failed to fetch claims')
 const json = await res.json()
 if (json.success) {
 setClaims(json.data.map((c: Record<string, unknown>) => ({
 ...c,
 submittedDate: c.submittedDate
 ? new Date(c.submittedDate as string).toLocaleDateString()
 : '',
 })))
 }
 } catch (err) {
 setError(err instanceof Error ? err.message : 'An error occurred')
 } finally {
 setLoading(false)
 }
 }, [userId, statusFilter])

 useEffect(() => {
 fetchClaims()
 }, [fetchClaims])

 // Legacy PATCH flow replaced by ClaimReviewDrawer which calls the
 // server-authoritative /approve + /deny endpoints (rules engine + audit log).

 const filteredClaims = claims.filter(claim => {
 const matchesStatus = !statusFilter || claim.status === statusFilter
 const matchesSearch =
 !searchTerm ||
 claim.claimId.toLowerCase().includes(searchTerm.toLowerCase()) ||
 claim.policyHolderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
 claim.policyType.toLowerCase().includes(searchTerm.toLowerCase())
 return matchesStatus && matchesSearch
 })

 return (
 <div className="p-6 max-w-7xl mx-auto">
 {/* Header */}
 <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
 <div className="flex items-center gap-3">
 <FaFileAlt className="text-3xl text-blue-600" />
 <div>
 <h1 className="text-2xl font-bold text-fg">Claims Management</h1>
 <p className="text-sm text-soft">Review and manage insurance claims</p>
 </div>
 </div>
 <button
 onClick={() => setShowOcrModal(true)}
 className="flex items-center gap-2 bg-[#0C6780] hover:bg-[#001E40] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
 >
 <FaPlus className="w-3.5 h-3.5" />
 File a claim
 </button>
 </div>

 {showOcrModal && (
 <OcrClaimModal
 onClose={() => setShowOcrModal(false)}
 onSubmitted={fetchClaims}
 />
 )}

 {/* Error Banner */}
 {error && (
 <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
 <span>{error}</span>
 <button onClick={() => setError(null)}>
 <FaTimes className="text-red-400 hover:text-red-600" />
 </button>
 </div>
 )}

 {/* Search and Filter */}
 <div className="flex flex-col sm:flex-row gap-4 mb-6">
 <div className="relative flex-1">
 <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
 <input
 type="text"
 placeholder="Search by claim ID, holder name, or type..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full pl-10 pr-4 py-2.5 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
 />
 </div>
 <div className="flex items-center gap-2">
 <FaFilter className="text-faint" />
 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 className="px-4 py-2.5 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-surface"
 >
 {CLAIM_STATUSES.map((s) => (
 <option key={s.value} value={s.value}>
 {s.label}
 </option>
 ))}
 </select>
 </div>
 </div>

 {/* Loading */}
 {loading ? (
 <div className="flex justify-center items-center py-20">
 <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
 </div>
 ) : filteredClaims.length === 0 ? (
 /* Empty State */
 <div className="text-center py-20 bg-subtle rounded-xl border border-dashed border-line">
 <FaFileAlt className="mx-auto text-4xl text-faint mb-4" />
 <h3 className="text-lg font-medium text-soft mb-1">No claims found</h3>
 <p className="text-sm text-faint">
 {statusFilter || searchTerm
 ? 'Try adjusting your search or filter.'
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
 Amount
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
 const statusInfo = getStatusInfo(claim.status)
 const StatusIcon = statusInfo.icon
 return (
 <tr key={claim.id} className="hover:bg-subtle transition-colors">
 <td className="px-6 py-4 font-mono text-sm text-fg">
 {claim.claimId}
 </td>
 <td className="px-6 py-4">
 <p className="font-medium text-fg">{claim.policyHolderName}</p>
 {claim.description && (
 <p className="text-xs text-soft mt-0.5 line-clamp-1 max-w-xs">
 {claim.description}
 </p>
 )}
 </td>
 <td className="px-6 py-4 text-soft">{claim.policyType}</td>
 <td className="px-6 py-4 text-right font-semibold text-fg">
 {format(claim.claimAmount)}
 </td>
 <td className="px-6 py-4 text-center">
 <span
 className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${statusInfo.color}`}
 >
 <StatusIcon className={claim.status === 'processing' ? 'animate-spin' : ''} />
 {statusInfo.label}
 </span>
 </td>
 <td className="px-6 py-4 text-sm text-soft">
 {claim.submittedDate}
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center justify-center gap-2">
 {claim.status === 'pending' ? (
 <button
 onClick={() => setReviewClaim({
  id: claim.id,
  memberName: claim.policyHolderName,
  description: claim.description ?? '',
  amount: claim.claimAmount,
  receiptUrl: (claim as { receiptUrl?: string | null }).receiptUrl ?? null,
  createdAt: claim.submittedDate,
 })}
 className="bg-indigo-600 text-white text-xs font-bold py-2 px-3 rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5"
 >
 <FaShieldAlt /> Review
 </button>
 ) : (
 <button className="bg-subtle text-soft text-xs font-bold py-2 px-3 rounded-lg hover:bg-line transition-colors">
 <FaEye className="inline mr-1" />
 View
 </button>
 )}
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

 <ClaimReviewDrawer
  claim={reviewClaim}
  onClose={() => setReviewClaim(null)}
  onResolved={() => { setReviewClaim(null); fetchClaims() }}
 />
 </div>
 )
}
