'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
 FaSearch, FaCheck, FaTimes, FaBan, FaThLarge, FaClock, FaCheckCircle, FaSpinner, FaUsers
} from 'react-icons/fa'
import { avatarSrc } from '@/lib/utils/avatar'
import type { Admin } from '@/types/regional-admin'

interface RawAdminRecord {
 id: string
 firstName: string
 lastName: string
 email: string
 phone: string | null
 profileImage: string | null
 accountStatus: string
 verified: boolean
 createdAt: string
 regionalAdminProfile: {
 region: string
 country: string
 countryCode: string
 } | null
}

function mapToAdmin(raw: RawAdminRecord): Admin {
 return {
 id: raw.id,
 name: `${raw.firstName} ${raw.lastName}`,
 email: raw.email,
 role: raw.regionalAdminProfile
 ? `Regional Admin - ${raw.regionalAdminProfile.region}, ${raw.regionalAdminProfile.country}`
 : 'Regional Admin',
 status: raw.accountStatus === 'active'
 ? 'active'
 : raw.accountStatus === 'suspended'
 ? 'suspended'
 : 'pending',
 joinDate: new Date(raw.createdAt).toLocaleDateString(),
 lastLogin: ' - ',
 avatar: avatarSrc(raw.profileImage as string | null, raw.firstName as string, raw.lastName as string),
 permissions: {
 canManageCMS: false,
 canManageFinances: false,
 canManageUsers: true,
 },
 }
}

const AdminManagementPage = () => {
 const [admins, setAdmins] = useState<Admin[]>([])
 const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'suspended'>('all')
 const [search, setSearch] = useState('')
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)

 useEffect(() => {
 const fetchAdmins = async () => {
 try {
 const res = await fetch('/api/admin/admins', { credentials: 'include' })
 if (res.ok) {
 const json = await res.json()
 if (json.success) {
 setAdmins((json.data as RawAdminRecord[]).map(mapToAdmin))
 } else {
 setError('Failed to load admins')
 }
 } else {
 setError('Failed to load admins')
 }
 } catch {
 setError('Failed to load admins')
 } finally {
 setLoading(false)
 }
 }
 fetchAdmins()
 }, [])

 const handleUpdateStatus = (id: string, newStatus: Admin['status']) => {
 setAdmins(admins.map(admin => admin.id === id ? { ...admin, status: newStatus } : admin))
 }

 const filteredAdmins = admins.filter(admin => {
 const matchFilter = filter === 'all' || admin.status === filter
 const matchSearch = !search ||
 admin.name.toLowerCase().includes(search.toLowerCase()) ||
 admin.email.toLowerCase().includes(search.toLowerCase())
 return matchFilter && matchSearch
 })

 const getStatusBadge = (status: Admin['status']) => ({
 active: 'bg-green-100 text-green-800',
 pending: 'bg-orange-100 text-orange-800',
 suspended: 'bg-red-100 text-red-800',
 }[status])

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
 <header className="bg-white shadow-sm border-b">
 <div className="container mx-auto px-4 py-4 flex justify-between items-center">
 <div>
 <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
 <p className="text-gray-600">Approve, manage, and monitor all regional admin accounts.</p>
 </div>
 <Link href="/regional" className="px-4 py-2 border rounded-lg hover:bg-gray-50">
 Back to Dashboard
 </Link>
 </div>
 </header>

 {/* Main Content */}
 <main className="container mx-auto px-4 py-8">
 {error && (
 <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
 {error}
 </div>
 )}

 {/* Filters */}
 <div className="bg-white p-4 rounded-xl shadow mb-6 flex justify-between items-center flex-wrap gap-4">
 <div className="flex gap-2">
 {([
 { key: 'all' as const, icon: FaThLarge, label: 'All' },
 { key: 'pending' as const, icon: FaClock, label: 'Pending' },
 { key: 'active' as const, icon: FaCheckCircle, label: 'Active' },
 { key: 'suspended' as const, icon: FaBan, label: 'Suspended' },
 ]).map(f => (
 <button
 key={f.key}
 onClick={() => setFilter(f.key)}
 title={`${f.label} (${f.key === 'all' ? admins.length : admins.filter(a => a.status === f.key).length})`}
 aria-label={`${f.label}: ${f.key === 'all' ? admins.length : admins.filter(a => a.status === f.key).length}`}
 className={`px-3 py-2 text-sm font-medium rounded-lg transition flex items-center gap-2 ${
 filter === f.key ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'
 }`}
 >
 <f.icon className="text-base" />
 <span>{f.label}</span>
 <span className={`text-xs px-1.5 py-0.5 rounded-full ${
 filter === f.key ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
 }`}>
 {f.key === 'all' ? admins.length : admins.filter(a => a.status === f.key).length}
 </span>
 </button>
 ))}
 </div>
 <div className="relative">
 <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
 <input
 type="text"
 placeholder="Search admins..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="pl-10 pr-4 py-2 border rounded-lg w-64"
 />
 </div>
 </div>

 {/* Admins List */}
 {filteredAdmins.length === 0 ? (
 <div className="text-center py-16 bg-white rounded-xl shadow text-gray-500">
 <FaUsers className="text-4xl mx-auto mb-3 text-gray-300" />
 <p className="text-lg font-medium">No regional admins found</p>
 <p className="text-sm mt-1">Regional admin accounts will appear here once registered</p>
 </div>
 ) : (
 <div className="space-y-4">
 {filteredAdmins.map(admin => (
 <div key={admin.id} className="bg-white rounded-xl shadow p-4 flex items-center justify-between flex-wrap gap-4">
 <div className="flex items-center gap-4">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img
 src={admin.avatar}
 alt={admin.name}
 width={48}
 height={48}
 className="w-12 h-12 rounded-full object-cover"
 />
 <div>
 <p className="font-semibold text-gray-900">{admin.name}</p>
 <p className="text-sm text-gray-600">{admin.email}</p>
 <p className="text-xs text-gray-500">{admin.role}</p>
 </div>
 </div>
 <div className="flex items-center gap-4 flex-wrap">
 <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(admin.status)}`}>
 {admin.status}
 </span>
 <p className="text-sm text-gray-500">Joined: {admin.joinDate}</p>
 {admin.status === 'pending' ? (
 <div className="flex gap-2">
 <button
 onClick={() => handleUpdateStatus(admin.id, 'active')}
 className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
 title="Approve"
 >
 <FaCheck />
 </button>
 <button
 onClick={() => handleUpdateStatus(admin.id, 'suspended')}
 className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
 title="Reject"
 >
 <FaTimes />
 </button>
 </div>
 ) : (
 <button
 onClick={() => handleUpdateStatus(admin.id, admin.status === 'active' ? 'suspended' : 'active')}
 className={`p-2 rounded-lg ${
 admin.status === 'active'
 ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
 : 'bg-green-100 text-green-600 hover:bg-green-200'
 }`}
 title={admin.status === 'active' ? 'Suspend' : 'Reactivate'}
 >
 {admin.status === 'active' ? <FaBan /> : <FaCheck />}
 </button>
 )}
 </div>
 </div>
 ))}
 </div>
 )}
 </main>
 </div>
 )
}

export default AdminManagementPage
