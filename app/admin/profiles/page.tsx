'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
 FaUserMd, FaUserNurse, FaChild, FaAmbulance, FaPills, FaFlask,
 FaSearch, FaCheckCircle, FaBan, FaUsers, FaSpinner, FaExclamationCircle
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

const USER_TYPE_ICON: Record<string, React.ReactNode> = {
 DOCTOR: <FaUserMd className="text-blue-600" />,
 NURSE: <FaUserNurse className="text-purple-600" />,
 NANNY: <FaChild className="text-pink-600" />,
 EMERGENCY_WORKER: <FaAmbulance className="text-red-600" />,
 PHARMACIST: <FaPills className="text-green-600" />,
 LAB_TECHNICIAN: <FaFlask className="text-orange-600" />,
}

function getUserTypeIcon(userType: string) {
 return USER_TYPE_ICON[userType] || <FaUsers className="text-gray-600" />
}

function formatUserType(userType: string) {
 return userType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const STATUS_FILTER_OPTIONS = ['all', 'active', 'pending', 'suspended']
const USER_TYPE_OPTIONS = [
 'All', 'DOCTOR', 'NURSE', 'NANNY', 'PHARMACIST', 'LAB_TECHNICIAN', 'EMERGENCY_WORKER', 'MEMBER'
]

export default function ProfileManagement() {
 const [accounts, setAccounts] = useState<AccountRecord[]>([])
 const [statusFilter, setStatusFilter] = useState('all')
 const [typeFilter, setTypeFilter] = useState('All')
 const [searchTerm, setSearchTerm] = useState('')
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)

 useEffect(() => {
 const fetchAccounts = async () => {
 setLoading(true)
 setError(null)
 try {
 const params = new URLSearchParams()
 if (statusFilter !== 'all') params.set('status', statusFilter)
 const res = await fetch(`/api/admin/accounts?${params.toString()}`, { credentials: 'include' })
 if (res.ok) {
 const json = await res.json()
 if (json.success) {
 setAccounts(json.data || [])
 } else {
 setError('Failed to load profiles')
 }
 } else {
 setError('Failed to load profiles')
 }
 } catch {
 setError('Failed to load profiles')
 } finally {
 setLoading(false)
 }
 }
 fetchAccounts()
 }, [statusFilter])

 const filteredAccounts = accounts.filter(acc => {
 const fullName = `${acc.firstName} ${acc.lastName}`.toLowerCase()
 const matchSearch = fullName.includes(searchTerm.toLowerCase()) ||
 acc.email.toLowerCase().includes(searchTerm.toLowerCase())
 const matchType = typeFilter === 'All' || acc.userType === typeFilter
 return matchSearch && matchType
 })

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
 <h1 className="text-2xl font-bold text-gray-900">Profile Management</h1>
 <p className="text-gray-600">Manage all healthcare provider profiles</p>
 </div>
 <Link href="/admin" className="px-4 py-2 border rounded-lg hover:bg-gray-50">
 Back to Dashboard
 </Link>
 </div>
 </div>
 </div>

 <div className="container mx-auto px-4 py-8">
 {error && (
 <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
 <FaExclamationCircle />
 {error}
 </div>
 )}

 {/* Filters */}
 <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
 <div className="flex flex-wrap gap-4 items-center justify-between">
 <div className="flex flex-wrap gap-2">
 {STATUS_FILTER_OPTIONS.map(status => (
 <button
 key={status}
 onClick={() => setStatusFilter(status)}
 className={`px-4 py-2 rounded-lg font-medium capitalize transition ${
 statusFilter === status
 ? 'bg-blue-600 text-white'
 : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
 }`}
 >
 {status}
 </button>
 ))}
 </div>
 <div className="flex gap-3 flex-wrap">
 <select
 value={typeFilter}
 onChange={(e) => setTypeFilter(e.target.value)}
 className="px-4 py-2 border rounded-lg text-sm"
 >
 {USER_TYPE_OPTIONS.map(t => (
 <option key={t} value={t}>{t === 'All' ? 'All Types' : formatUserType(t)}</option>
 ))}
 </select>
 <div className="relative">
 <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
 <input
 type="text"
 placeholder="Search profiles..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="pl-10 pr-4 py-2 border rounded-lg w-64"
 />
 </div>
 </div>
 </div>
 </div>

 {/* Profile Grid */}
 {filteredAccounts.length === 0 ? (
 <div className="text-center py-16 text-gray-500">
 <FaUsers className="text-4xl mx-auto mb-3 text-gray-300" />
 <p className="text-lg font-medium">No profiles found</p>
 <p className="text-sm mt-1">Try changing the filters above</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {filteredAccounts.map(account => (
 <div key={account.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
 <div className="p-6">
 <div className="flex items-start justify-between mb-4">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl">
 {getUserTypeIcon(account.userType)}
 </div>
 <div>
 <h3 className="font-semibold text-gray-900">
 {account.firstName} {account.lastName}
 </h3>
 <p className="text-sm text-gray-600">{formatUserType(account.userType)}</p>
 </div>
 </div>
 <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
 account.accountStatus === 'active' ? 'bg-green-100 text-green-800' :
 account.accountStatus === 'pending' ? 'bg-orange-100 text-orange-800' :
 'bg-red-100 text-red-800'
 }`}>
 {account.accountStatus}
 </span>
 </div>

 <div className="space-y-2 text-sm">
 <div className="flex items-center justify-between">
 <span className="text-gray-600">Email:</span>
 <span className="font-medium text-gray-900 truncate ml-2">{account.email}</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-gray-600">Phone:</span>
 <span className="font-medium">{account.phone || ' - '}</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-gray-600">Joined:</span>
 <span className="font-medium">{new Date(account.createdAt).toLocaleDateString()}</span>
 </div>
 </div>

 <div className="flex gap-2 mt-4 pt-4 border-t">
 {account.accountStatus === 'active' ? (
 <div className="flex items-center gap-1 text-green-600 text-sm">
 <FaCheckCircle />
 <span>Active Account</span>
 </div>
 ) : account.accountStatus === 'pending' ? (
 <Link
 href="/admin/validation"
 className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm"
 >
 Review in Validation
 </Link>
 ) : (
 <div className="flex items-center gap-1 text-red-600 text-sm">
 <FaBan />
 <span>Suspended</span>
 </div>
 )}
 </div>
 </div>
 </div>
 ))}
 </div>
 )}

 {/* Summary Stats */}
 <div className="mt-8 bg-white rounded-xl p-6 shadow-lg">
 <h2 className="text-lg font-bold text-gray-900 mb-4">Summary Statistics</h2>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <div className="text-center">
 <p className="text-3xl font-bold text-blue-600">{accounts.length}</p>
 <p className="text-gray-600 text-sm">Total Profiles</p>
 </div>
 <div className="text-center">
 <p className="text-3xl font-bold text-green-600">
 {accounts.filter(p => p.accountStatus === 'active').length}
 </p>
 <p className="text-gray-600 text-sm">Active</p>
 </div>
 <div className="text-center">
 <p className="text-3xl font-bold text-orange-600">
 {accounts.filter(p => p.accountStatus === 'pending').length}
 </p>
 <p className="text-gray-600 text-sm">Pending</p>
 </div>
 <div className="text-center">
 <p className="text-3xl font-bold text-red-600">
 {accounts.filter(p => p.accountStatus === 'suspended').length}
 </p>
 <p className="text-gray-600 text-sm">Suspended</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 )
}
