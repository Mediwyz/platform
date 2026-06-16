'use client'

import { useState, useEffect, useCallback } from 'react'
import {
 FaGlobeAmericas, FaSearch, FaSpinner, FaCheck, FaBan, FaUserTimes,
 FaFilter, FaEye, FaTimes
} from 'react-icons/fa'

interface AdminRecord {
 id: string
 firstName: string
 lastName: string
 email: string
 phone: string
 accountStatus: string
 verified: boolean
 createdAt: string
 regionalAdminProfile: {
 region: string
 country: string
 countryCode: string | null
 commissionRate: number
 totalCommission: number
 } | null
}

const statusColors: Record<string, string> = {
 active: 'bg-green-100 text-green-800',
 pending: 'bg-yellow-100 text-yellow-800',
 suspended: 'bg-red-100 text-red-800',
}

export default function AdminRegionalAdminsPage() {
 const [admins, setAdmins] = useState<AdminRecord[]>([])
 const [loading, setLoading] = useState(true)
 const [actionLoading, setActionLoading] = useState<string | null>(null)
 const [searchQuery, setSearchQuery] = useState('')
 const [statusFilter, setStatusFilter] = useState<string>('all')
 const [selectedAdmin, setSelectedAdmin] = useState<AdminRecord | null>(null)

 const fetchAdmins = useCallback(async () => {
 setLoading(true)
 try {
 const res = await fetch('/api/admin/admins', { credentials: 'include' })
 if (res.ok) {
 const json = await res.json()
 if (json.success) setAdmins(json.data || [])
 }
 } catch (error) {
 console.error('Failed to fetch admins:', error)
 } finally {
 setLoading(false)
 }
 }, [])

 useEffect(() => { fetchAdmins() }, [fetchAdmins])

 const handleAction = async (userId: string, action: 'approve' | 'reject' | 'suspend') => {
 setActionLoading(userId)
 try {
 const res = await fetch('/api/admin/accounts', {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ userId, action }),
 credentials: 'include',
 })
 const data = await res.json()
 if (data.success) fetchAdmins()
 } catch (error) {
 console.error('Action failed:', error)
 } finally {
 setActionLoading(null)
 }
 }

 const filteredAdmins = admins.filter((a) => {
 if (statusFilter !== 'all' && a.accountStatus !== statusFilter) return false
 if (!searchQuery) return true
 const q = searchQuery.toLowerCase()
 return (
 a.firstName.toLowerCase().includes(q) ||
 a.lastName.toLowerCase().includes(q) ||
 a.email.toLowerCase().includes(q) ||
 (a.regionalAdminProfile?.region || '').toLowerCase().includes(q) ||
 (a.regionalAdminProfile?.country || '').toLowerCase().includes(q)
 )
 })

 return (
 <div className="p-4 sm:p-6 max-w-7xl mx-auto">
 <div className="mb-6">
 <div className="flex items-center gap-3 mb-2">
 <FaGlobeAmericas className="text-2xl text-teal-600" />
 <h1 className="text-2xl font-bold text-[#001E40]">Regional Admins</h1>
 </div>
 <p className="text-gray-600">Manage regional administrator accounts - approve, suspend, or review profiles</p>
 </div>

 {/* Filters */}
 <div className="bg-white rounded-xl p-4 shadow-lg mb-6">
 <div className="flex flex-wrap gap-4 items-center">
 <div className="relative flex-1 min-w-[200px]">
 <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
 <input
 type="text"
 placeholder="Search by name, email, region..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
 />
 </div>
 <div className="flex items-center gap-2">
 <FaFilter className="text-gray-400" />
 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
 >
 <option value="all">All Statuses</option>
 <option value="active">Active</option>
 <option value="pending">Pending</option>
 <option value="suspended">Suspended</option>
 </select>
 </div>
 </div>
 </div>

 {/* Admin List */}
 <div className="bg-white rounded-xl shadow-lg overflow-hidden">
 {loading ? (
 <div className="flex justify-center items-center py-16">
 <FaSpinner className="animate-spin text-3xl text-blue-500" />
 </div>
 ) : filteredAdmins.length === 0 ? (
 <div className="text-center py-16">
 <FaGlobeAmericas className="text-4xl text-gray-300 mx-auto mb-3" />
 <p className="text-gray-500 text-lg">No regional admins found</p>
 </div>
 ) : (
 <div className="divide-y divide-gray-100">
 {filteredAdmins.map((admin) => (
 <div key={admin.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 transition-colors gap-4">
 <div className="flex items-center gap-4 flex-1">
 <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-lg flex-shrink-0">
 {admin.firstName[0]}{admin.lastName[0]}
 </div>
 <div className="min-w-0">
 <h3 className="font-semibold text-gray-900">{admin.firstName} {admin.lastName}</h3>
 <p className="text-sm text-gray-500 truncate">{admin.email}</p>
 <div className="flex flex-wrap gap-2 mt-1">
 {admin.regionalAdminProfile && (
 <>
 <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
 {admin.regionalAdminProfile.region}
 </span>
 {admin.regionalAdminProfile.countryCode && (
 <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
 {admin.regionalAdminProfile.countryCode}
 </span>
 )}
 </>
 )}
 <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[admin.accountStatus] || 'bg-gray-100'}`}>
 {admin.accountStatus}
 </span>
 </div>
 </div>
 </div>

 <div className="flex gap-2 flex-shrink-0">
 <button
 onClick={() => setSelectedAdmin(admin)}
 className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
 >
 <FaEye /> Details
 </button>
 {admin.accountStatus === 'pending' && (
 <>
 <button
 onClick={() => handleAction(admin.id, 'approve')}
 disabled={actionLoading === admin.id}
 className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
 >
 {actionLoading === admin.id ? <FaSpinner className="animate-spin" /> : <FaCheck />} Approve
 </button>
 <button
 onClick={() => handleAction(admin.id, 'reject')}
 disabled={actionLoading === admin.id}
 className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
 >
 <FaUserTimes /> Reject
 </button>
 </>
 )}
 {admin.accountStatus === 'active' && (
 <button
 onClick={() => handleAction(admin.id, 'suspend')}
 disabled={actionLoading === admin.id}
 className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
 >
 {actionLoading === admin.id ? <FaSpinner className="animate-spin" /> : <FaBan />} Suspend
 </button>
 )}
 {admin.accountStatus === 'suspended' && (
 <button
 onClick={() => handleAction(admin.id, 'approve')}
 disabled={actionLoading === admin.id}
 className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
 >
 {actionLoading === admin.id ? <FaSpinner className="animate-spin" /> : <FaCheck />} Reactivate
 </button>
 )}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Detail Modal */}
 {selectedAdmin && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedAdmin(null)}>
 <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-xl font-bold text-gray-900">Admin Profile</h2>
 <button onClick={() => setSelectedAdmin(null)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
 </div>
 <div className="space-y-3">
 <div><span className="text-sm text-gray-500">Name:</span> <span className="font-medium">{selectedAdmin.firstName} {selectedAdmin.lastName}</span></div>
 <div><span className="text-sm text-gray-500">Email:</span> <span className="font-medium">{selectedAdmin.email}</span></div>
 <div><span className="text-sm text-gray-500">Phone:</span> <span className="font-medium">{selectedAdmin.phone}</span></div>
 <div><span className="text-sm text-gray-500">Status:</span> <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[selectedAdmin.accountStatus]}`}>{selectedAdmin.accountStatus}</span></div>
 <div><span className="text-sm text-gray-500">Joined:</span> <span className="font-medium">{new Date(selectedAdmin.createdAt).toLocaleDateString()}</span></div>
 {selectedAdmin.regionalAdminProfile && (
 <>
 <hr className="border-gray-200" />
 <div><span className="text-sm text-gray-500">Region:</span> <span className="font-medium">{selectedAdmin.regionalAdminProfile.region}</span></div>
 <div><span className="text-sm text-gray-500">Country:</span> <span className="font-medium">{selectedAdmin.regionalAdminProfile.country}</span></div>
 <div><span className="text-sm text-gray-500">Country Code:</span> <span className="font-medium">{selectedAdmin.regionalAdminProfile.countryCode || 'Not set'}</span></div>
 <div><span className="text-sm text-gray-500">Commission Rate:</span> <span className="font-medium">{selectedAdmin.regionalAdminProfile.commissionRate}%</span></div>
 <div><span className="text-sm text-gray-500">Total Commission:</span> <span className="font-medium text-green-600">Rs {selectedAdmin.regionalAdminProfile.totalCommission.toLocaleString()}</span></div>
 </>
 )}
 </div>
 </div>
 </div>
 )}
 </div>
 )
}
