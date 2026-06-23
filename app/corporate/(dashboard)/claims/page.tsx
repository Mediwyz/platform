'use client'

import { useState, useEffect } from 'react'
import { FaFileAlt, FaSearch, FaFilter, FaCheckCircle, FaClock, FaTimes } from 'react-icons/fa'
import { useUser } from '@/hooks/useUser'

interface Claim {
 id: string
 employeeName: string
 claimType: string
 amount: number
 status: string
 date: string
 description: string
}

export default function CorporateClaimsPage() {
 const [claims, setClaims] = useState<Claim[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)
 const [filter, setFilter] = useState('all')
 const [search, setSearch] = useState('')
 const { user: currentUser } = useUser()
 const userId = currentUser?.id ?? ''

 useEffect(() => {
 if (!userId) return

 const fetchClaims = async () => {
 try {
 const res = await fetch(`/api/corporate/${userId}/claims`, { credentials: 'include' })
 if (res.ok) {
 const json = await res.json()
 if (json.success) setClaims(json.data || [])
 }
 } catch (err) {
 console.error('Failed to fetch claims:', err)
 setError(err instanceof Error ? err.message : 'Failed to load claims')
 } finally {
 setLoading(false)
 }
 }

 fetchClaims()
 }, [userId])

 const filteredClaims = claims.filter(claim => {
 if (filter !== 'all' && claim.status !== filter) return false
 if (search && !claim.employeeName.toLowerCase().includes(search.toLowerCase())) return false
 return true
 })

 const getStatusInfo = (status: string) => {
 switch (status) {
 case 'approved': return { text: 'Approved', color: 'bg-green-100 text-green-800', icon: FaCheckCircle }
 case 'pending': return { text: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: FaClock }
 case 'rejected': return { text: 'Rejected', color: 'bg-red-100 text-red-800', icon: FaTimes }
 default: return { text: status, color: 'bg-gray-100 text-gray-800', icon: FaClock }
 }
 }

 return (
 <div className="space-y-6">
 {error && (
 <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
 <span>{error}</span>
 <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
 <FaTimes />
 </button>
 </div>
 )}

 <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
 <FaFileAlt className="text-purple-500" /> Claims Management
 </h1>

 <div className="flex flex-col md:flex-row gap-4">
 <div className="flex-1 relative">
 <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
 <input
 type="text"
 placeholder="Search by employee name..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="w-full pl-10 pr-4 py-2 border rounded-lg"
 />
 </div>
 <div className="flex items-center gap-2">
 <FaFilter className="text-gray-400" />
 <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-2 border rounded-lg">
 <option value="all">All Status</option>
 <option value="approved">Approved</option>
 <option value="pending">Pending</option>
 <option value="rejected">Rejected</option>
 </select>
 </div>
 </div>

 <div className="bg-white rounded-xl shadow-lg overflow-hidden">
 {loading ? (
 <div className="flex items-center justify-center min-h-[400px]">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
 </div>
 ) : filteredClaims.length === 0 ? (
 <div className="text-center py-12 text-gray-500">
 <FaFileAlt className="text-4xl mx-auto mb-3 text-gray-300" />
 <p className="text-lg font-medium">No claims found</p>
 <p className="text-sm mt-1">Claims will appear here when employees submit them</p>
 </div>
 ) : (
 <div className="overflow-x-auto"><table className="w-full text-sm">
 <thead className="bg-gray-50">
 <tr>
 <th className="p-3 text-left font-medium text-gray-700">Employee</th>
 <th className="p-3 text-left font-medium text-gray-700">Type</th>
 <th className="p-3 text-left font-medium text-gray-700">Amount</th>
 <th className="p-3 text-left font-medium text-gray-700">Status</th>
 <th className="p-3 text-left font-medium text-gray-700">Date</th>
 </tr>
 </thead>
 <tbody>
 {filteredClaims.map((claim) => {
 const statusInfo = getStatusInfo(claim.status)
 return (
 <tr key={claim.id} className="border-b hover:bg-gray-50">
 <td className="p-3 font-medium text-gray-900">{claim.employeeName}</td>
 <td className="p-3 text-gray-600">{claim.claimType}</td>
 <td className="p-3 font-medium">Rs {claim.amount.toLocaleString()}</td>
 <td className="p-3">
 <span className={`px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${statusInfo.color}`}>
 <statusInfo.icon className="text-xs" /> {statusInfo.text}
 </span>
 </td>
 <td className="p-3 text-gray-600 text-xs">{claim.date}</td>
 </tr>
 )
 })}
 </tbody>
 </table></div>
 )}
 </div>
 </div>
 )
}
