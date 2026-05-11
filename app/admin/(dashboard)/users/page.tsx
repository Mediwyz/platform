'use client'

import { useState, useEffect, useCallback } from 'react'
import {
 FaUsers, FaSearch, FaSpinner,
 FaFilter
} from 'react-icons/fa'
import { useUser } from '@/hooks/useUser'

interface UserRecord {
 id: string
 firstName: string
 lastName: string
 email: string
 userType: string
 accountStatus: string
 createdAt: string
}

const userTypeLabels: Record<string, string> = {
 DOCTOR: 'Doctor',
 NURSE: 'Nurse',
 NANNY: 'Nanny',
 PHARMACIST: 'Pharmacist',
 LAB_TECHNICIAN: 'Lab Technician',
 EMERGENCY_WORKER: 'Emergency Worker',
 INSURANCE_REP: 'Insurance Rep',
 CORPORATE_ADMIN: 'Corporate Admin',
 REFERRAL_PARTNER: 'Referral Partner',
 PATIENT: 'Patient',
 REGIONAL_ADMIN: 'Regional Admin',
}

const statusColors: Record<string, string> = {
 active: 'bg-green-100 text-green-800',
 pending: 'bg-yellow-100 text-yellow-800',
 suspended: 'bg-red-100 text-red-800',
}

export default function AdminUsersPage() {
 const { user: currentUser } = useUser()
 const userId = currentUser?.id ?? ''
 const [users, setUsers] = useState<UserRecord[]>([])
 const [loading, setLoading] = useState(true)
 const [searchQuery, setSearchQuery] = useState('')
 const [typeFilter, setTypeFilter] = useState<string>('all')
 const [statusFilter, setStatusFilter] = useState<string>('all')

 const fetchUsers = useCallback(async () => {
 setLoading(true)
 try {
 const params = new URLSearchParams()
 if (statusFilter !== 'all') params.set('status', statusFilter)
 const res = await fetch(`/api/admin/accounts?${params.toString()}`, { credentials: 'include' })
 if (res.ok) {
 const data = await res.json()
 if (data.success) {
 setUsers(data.data || [])
 }
 }
 } catch (error) {
 console.error('Failed to fetch users:', error)
 } finally {
 setLoading(false)
 }
 }, [statusFilter])

 useEffect(() => {
 if (!userId) return
 fetchUsers()
 }, [userId, fetchUsers])

 const filteredUsers = users.filter((u) => {
 if (typeFilter !== 'all' && u.userType !== typeFilter) return false
 if (!searchQuery) return true
 const q = searchQuery.toLowerCase()
 return (
 u.firstName.toLowerCase().includes(q) ||
 u.lastName.toLowerCase().includes(q) ||
 u.email.toLowerCase().includes(q) ||
 (userTypeLabels[u.userType] || u.userType).toLowerCase().includes(q)
 )
 })

 return (
 <div className="p-6 max-w-7xl mx-auto">
 {/* Header */}
 <div className="mb-6">
 <div className="flex items-center gap-3 mb-2">
 <FaUsers className="text-2xl text-purple-600" />
 <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
 </div>
 <p className="text-gray-600">View and manage all platform users</p>
 </div>

 {/* Filters */}
 <div className="bg-white rounded-xl p-4 shadow-lg mb-6">
 <div className="flex flex-wrap gap-4 items-center">
 {/* Search */}
 <div className="relative flex-1 min-w-[200px]">
 <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
 <input
 type="text"
 placeholder="Search by name or email..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
 />
 </div>

 {/* Type Filter */}
 <div className="flex items-center gap-2">
 <FaFilter className="text-gray-400" />
 <select
 value={typeFilter}
 onChange={(e) => setTypeFilter(e.target.value)}
 className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
 >
 <option value="all">All Types</option>
 {Object.entries(userTypeLabels).map(([key, label]) => (
 <option key={key} value={key}>{label}</option>
 ))}
 </select>
 </div>

 {/* Status Filter */}
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

 {/* Users Table */}
 <div className="bg-white rounded-xl shadow-lg overflow-hidden">
 {loading ? (
 <div className="flex justify-center items-center py-16">
 <FaSpinner className="animate-spin text-3xl text-blue-500" />
 </div>
 ) : filteredUsers.length === 0 ? (
 <div className="text-center py-16">
 <FaUsers className="text-4xl text-gray-300 mx-auto mb-3" />
 <p className="text-gray-500 text-lg">No users found</p>
 <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-gray-50 border-b">
 <tr>
 <th className="px-6 py-3 text-left font-medium text-gray-700">Name</th>
 <th className="px-6 py-3 text-left font-medium text-gray-700">Email</th>
 <th className="px-6 py-3 text-left font-medium text-gray-700">User Type</th>
 <th className="px-6 py-3 text-left font-medium text-gray-700">Status</th>
 <th className="px-6 py-3 text-left font-medium text-gray-700">Join Date</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {filteredUsers.map((user) => (
 <tr key={user.id} className="hover:bg-gray-50 transition-colors">
 <td className="px-6 py-4">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
 {user.firstName[0]}{user.lastName[0]}
 </div>
 <span className="font-medium text-gray-900">
 {user.firstName} {user.lastName}
 </span>
 </div>
 </td>
 <td className="px-6 py-4 text-gray-600">{user.email}</td>
 <td className="px-6 py-4">
 <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
 {userTypeLabels[user.userType] || user.userType}
 </span>
 </td>
 <td className="px-6 py-4">
 <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[user.accountStatus] || 'bg-gray-100 text-gray-800'}`}>
 {user.accountStatus}
 </span>
 </td>
 <td className="px-6 py-4 text-gray-500">
 {new Date(user.createdAt).toLocaleDateString()}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}

 {/* Results count */}
 {!loading && filteredUsers.length > 0 && (
 <div className="px-6 py-3 bg-gray-50 border-t text-sm text-gray-500">
 Showing {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
 </div>
 )}
 </div>
 </div>
 )
}
