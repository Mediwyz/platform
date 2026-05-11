'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
 FaCheckCircle, FaTimes, FaEye,
 FaClock, FaSearch, FaSpinner, FaExclamationTriangle, FaUsers
} from 'react-icons/fa'

interface AccountRecord {
 id: string
 firstName: string
 lastName: string
 email: string
 phone: string
 userType: string
 accountStatus: string
 profileImage: string | null
 createdAt: string
}

export default function AccountValidation() {
 const [accounts, setAccounts] = useState<AccountRecord[]>([])
 const [statusFilter, setStatusFilter] = useState('unverified')
 const [searchTerm, setSearchTerm] = useState('')
 const [loading, setLoading] = useState(true)
 const [actionLoading, setActionLoading] = useState<string | null>(null)
 const [error, setError] = useState<string | null>(null)

 const fetchAccounts = async (status: string) => {
 setLoading(true)
 setError(null)
 try {
 const res = await fetch(`/api/admin/accounts?status=${status}`, { credentials: 'include' })
 if (res.ok) {
 const json = await res.json()
 if (json.success) setAccounts(json.data || [])
 } else {
 setError('Failed to load accounts')
 }
 } catch {
 setError('Failed to load accounts')
 } finally {
 setLoading(false)
 }
 }

 useEffect(() => {
 fetchAccounts(statusFilter)
 }, [statusFilter])

 const handleAction = async (userId: string, action: 'approve' | 'reject' | 'suspend') => {
 setActionLoading(userId)
 try {
 const res = await fetch('/api/admin/accounts', {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ userId, action }),
 credentials: 'include',
 })
 if (res.ok) {
 setAccounts(prev => prev.filter(a => a.id !== userId))
 }
 } catch {
 // Silently ignore — account list will refresh on next filter change
 } finally {
 setActionLoading(null)
 }
 }

 const filteredAccounts = accounts.filter(acc => {
 const fullName = `${acc.firstName} ${acc.lastName}`.toLowerCase()
 const matchSearch = fullName.includes(searchTerm.toLowerCase()) ||
 acc.email.toLowerCase().includes(searchTerm.toLowerCase())
 return matchSearch
 })

 const formatUserType = (userType: string) =>
 userType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

 if (loading) {
 return (
 <div className="min-h-screen bg-gray-50 flex items-center justify-center">
 <FaSpinner className="animate-spin text-3xl text-blue-600" />
 </div>
 )
 }

 return (
 <div className="min-h-screen bg-gray-50">
 {/* Header */}
 <div className="bg-white shadow-sm border-b">
 <div className="container mx-auto px-4 py-4">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-gray-900">Account Validation</h1>
 <p className="text-gray-600">Review and approve provider registrations</p>
 </div>
 <Link href="/admin" className="px-4 py-2 border rounded-lg hover:bg-gray-50">
 Back to Dashboard
 </Link>
 </div>
 </div>
 </div>

 <div className="container mx-auto px-4 py-8">
 {/* Summary Cards */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
 <div className="bg-white rounded-lg p-4 shadow">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-2xl font-bold text-orange-600">{accounts.length}</p>
 <p className="text-gray-600 text-sm">Showing {statusFilter} accounts</p>
 </div>
 <FaClock className="text-orange-600 text-2xl" />
 </div>
 </div>
 <div className="bg-white rounded-lg p-4 shadow">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-2xl font-bold text-blue-600">{filteredAccounts.length}</p>
 <p className="text-gray-600 text-sm">Matching search</p>
 </div>
 <FaEye className="text-blue-600 text-2xl" />
 </div>
 </div>
 <div className="bg-white rounded-lg p-4 shadow">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-2xl font-bold text-green-600">
 {accounts.filter(a => a.accountStatus === 'active').length}
 </p>
 <p className="text-gray-600 text-sm">Active in view</p>
 </div>
 <FaCheckCircle className="text-green-600 text-2xl" />
 </div>
 </div>
 </div>

 {/* Filters */}
 <div className="bg-white rounded-xl p-4 shadow mb-6">
 <div className="flex flex-wrap gap-4 items-center justify-between">
 <div className="flex flex-wrap gap-2">
 {[
 { key: 'unverified', label: 'Pending Verification' },
 { key: 'verified', label: 'Verified' },
 { key: 'suspended', label: 'Suspended' },
 { key: 'rejected', label: 'Rejected' },
 { key: 'all', label: 'All' },
 ].map(({ key, label }) => (
 <button
 key={key}
 onClick={() => setStatusFilter(key)}
 className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
 statusFilter === key
 ? 'bg-blue-600 text-white'
 : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
 }`}
 >
 {label}
 </button>
 ))}
 </div>
 <div className="relative">
 <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
 <input
 type="text"
 placeholder="Search by name or email..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="pl-10 pr-4 py-2 border rounded-lg w-64"
 />
 </div>
 </div>
 </div>

 {error && (
 <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
 <FaExclamationTriangle />
 {error}
 </div>
 )}

 {/* Accounts Table */}
 <div className="bg-white rounded-xl shadow overflow-hidden">
 {filteredAccounts.length === 0 ? (
 <div className="text-center py-16 text-gray-500">
 <FaUsers className="text-4xl mx-auto mb-3 text-gray-300" />
 <p className="text-lg font-medium">No accounts found</p>
 <p className="text-sm mt-1">{statusFilter === 'unverified' ? 'All provider accounts have been verified' : 'No accounts match this filter'}</p>
 </div>
 ) : (
 <table className="w-full">
 <thead className="bg-gray-50">
 <tr>
 <th className="p-4 text-left text-sm font-medium text-gray-700">Provider</th>
 <th className="p-4 text-left text-sm font-medium text-gray-700">Type</th>
 <th className="p-4 text-left text-sm font-medium text-gray-700">Phone</th>
 <th className="p-4 text-left text-sm font-medium text-gray-700">Status</th>
 <th className="p-4 text-left text-sm font-medium text-gray-700">Registered</th>
 <th className="p-4 text-left text-sm font-medium text-gray-700">Actions</th>
 </tr>
 </thead>
 <tbody>
 {filteredAccounts.map(account => (
 <tr key={account.id} className="border-t hover:bg-gray-50">
 <td className="p-4">
 <div>
 <p className="font-medium text-gray-900">
 {account.firstName} {account.lastName}
 </p>
 <p className="text-sm text-gray-500">{account.email}</p>
 </div>
 </td>
 <td className="p-4">
 <span className="text-sm text-gray-700">{formatUserType(account.userType)}</span>
 </td>
 <td className="p-4">
 <span className="text-sm text-gray-700">{account.phone || '—'}</span>
 </td>
 <td className="p-4">
 <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
 account.accountStatus === 'active' ? 'bg-green-100 text-green-800' :
 account.accountStatus === 'pending' ? 'bg-orange-100 text-orange-800' :
 'bg-red-100 text-red-800'
 }`}>
 {account.accountStatus}
 </span>
 </td>
 <td className="p-4">
 <span className="text-sm text-gray-700">
 {new Date(account.createdAt).toLocaleDateString()}
 </span>
 </td>
 <td className="p-4">
 <div className="flex items-center gap-2">
 {actionLoading === account.id ? (
 <FaSpinner className="animate-spin text-blue-500" />
 ) : (
 <>
 {account.accountStatus === 'pending' && (
 <>
 <button
 onClick={() => handleAction(account.id, 'approve')}
 className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200"
 title="Approve"
 >
 <FaCheckCircle />
 </button>
 <button
 onClick={() => handleAction(account.id, 'reject')}
 className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
 title="Reject"
 >
 <FaTimes />
 </button>
 </>
 )}
 {account.accountStatus === 'active' && (
 <button
 onClick={() => handleAction(account.id, 'suspend')}
 className="p-2 bg-orange-100 text-orange-600 rounded hover:bg-orange-200"
 title="Suspend"
 >
 <FaTimes />
 </button>
 )}
 </>
 )}
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 )}
 </div>
 </div>
 </div>
 )
}
