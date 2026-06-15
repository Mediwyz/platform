// app/regional/regional-admins/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import {
 FaUsersCog, FaCheckCircle, FaClock, FaEye,
 FaSearch, FaDownload,
 FaChartBar, FaStar, FaExclamationTriangle,
 FaThLarge, FaBan, FaClipboardCheck, FaSpinner
} from 'react-icons/fa'
import { initialsAvatar } from '@/lib/utils/avatar'

interface RegionalAdmin {
 id: string
 name: string
 email: string
 region: string
 country: string
 status: 'active' | 'pending' | 'suspended' | 'under_review'
 joinDate: string
 lastActive: string
 performance: {
 userGrowth: number
 revenue: number
 satisfactionScore: number
 marketPenetration: number
 }
 kpis: {
 monthlyActiveUsers: number
 monthlyRevenue: number
 providerCount: number
 patientCount: number
 }
 documents: {
 businessPlan: boolean
 financialStatements: boolean
 legalClearance: boolean
 references: boolean
 }
}

function mapApiToAdmin(r: Record<string, unknown>, idx: number): RegionalAdmin {
 return {
 id: `RA${String(idx + 1).padStart(3, '0')}`,
 name: (r.adminName as string) || `Admin - ${r.region}`,
 email: (r.adminEmail as string) || '',
 region: r.region as string,
 country: (r.countryCode as string) || '',
 status: 'active',
 joinDate: '',
 lastActive: '',
 performance: {
 userGrowth: (r.growth as number) || 0,
 revenue: (r.revenue as number) || 0,
 satisfactionScore: 0,
 marketPenetration: 0,
 },
 kpis: {
 monthlyActiveUsers: (r.activeUsers as number) || 0,
 monthlyRevenue: (r.revenue as number) || 0,
 providerCount: 0,
 patientCount: 0,
 },
 documents: {
 businessPlan: true,
 financialStatements: true,
 legalClearance: true,
 references: true,
 },
 }
}

const getCountryFlag = (country: string) => {
 const flags: Record<string, string> = {
 MG: '\u{1F1F2}\u{1F1EC}', KE: '\u{1F1F0}\u{1F1EA}',
 NG: '\u{1F1F3}\u{1F1EC}', ZA: '\u{1F1FF}\u{1F1E6}', MU: '\u{1F1F2}\u{1F1FA}',
 }
 return flags[country] || '\u{1F30D}'
}

export default function RegionalAdminsPage() {
 const [admins, setAdmins] = useState<RegionalAdmin[]>([])
 const [loading, setLoading] = useState(true)
 const [selectedAdmin, setSelectedAdmin] = useState<RegionalAdmin | null>(null)
 const [filterStatus, setFilterStatus] = useState('all')
 const [searchTerm, setSearchTerm] = useState('')

 useEffect(() => {
 const fetchAdmins = async () => {
 try {
 const res = await fetch('/api/admin/regional-activity', { credentials: 'include' })
 if (res.ok) {
 const json = await res.json()
 const regions = Array.isArray(json.data) ? json.data : (json.data?.regions ?? [])
 if (json.success && regions.length > 0) {
 setAdmins(regions.map(mapApiToAdmin))
 setLoading(false)
 return
 }
 }
 } catch {
 // Fall through to empty state
 }
 setLoading(false)
 }
 fetchAdmins()
 }, [])

 const getStatusBadge = (status: string) => {
 const styles: Record<string, string> = {
 active: 'bg-green-100 text-green-800',
 pending: 'bg-yellow-100 text-yellow-800',
 suspended: 'bg-red-100 text-red-800',
 under_review: 'bg-blue-100 text-blue-800',
 }
 return styles[status] || 'bg-gray-100 text-gray-800'
 }

 const filteredAdmins = admins.filter(admin => {
 const matchesStatus = filterStatus === 'all' || admin.status === filterStatus
 const matchesSearch = admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
 admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
 admin.region.toLowerCase().includes(searchTerm.toLowerCase())
 return matchesStatus && matchesSearch
 })

 return (
 <div className="min-h-screen bg-gray-50">
 {/* Header */}
 <div className="bg-white border-b">
 <div className="container mx-auto px-6 py-4">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-gray-900">Regional Admin Management</h1>
 <p className="text-gray-600 mt-1">Monitor and manage regional administrators across all territories</p>
 </div>
 <div className="flex gap-3">
 <Link
 href="/regional/regional-admins/validation"
 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
 >
 <FaUsersCog />
 New Applications
 </Link>
 <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
 <FaDownload />
 Export Report
 </button>
 </div>
 </div>
 </div>
 </div>

 {/* Filters */}
 <div className="container mx-auto px-6 py-6">
 <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
 <div className="flex flex-wrap gap-4 items-center justify-between">
 <div className="flex gap-2">
 {([
 { key: 'all', icon: FaThLarge, label: 'All' },
 { key: 'active', icon: FaCheckCircle, label: 'Active' },
 { key: 'pending', icon: FaClock, label: 'Pending' },
 { key: 'under_review', icon: FaClipboardCheck, label: 'Under Review' },
 { key: 'suspended', icon: FaBan, label: 'Suspended' },
 ]).map(f => (
 <button
 key={f.key}
 onClick={() => setFilterStatus(f.key)}
 title={f.label}
 aria-label={f.label}
 className={`p-2.5 rounded-lg font-medium transition ${
 filterStatus === f.key
 ? 'bg-blue-600 text-white'
 : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
 }`}
 >
 <f.icon className="text-base" />
 </button>
 ))}
 </div>
 <div className="relative">
 <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
 <input
 type="text"
 placeholder="Search admins..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="pl-10 pr-4 py-2 border rounded-lg w-64"
 />
 </div>
 </div>
 </div>

 {loading ? (
 <div className="flex justify-center py-12">
 <FaSpinner className="animate-spin text-2xl text-blue-500" />
 </div>
 ) : filteredAdmins.length === 0 ? (
 <div className="text-center py-20 bg-white rounded-xl shadow">
 <FaUsersCog className="mx-auto text-4xl text-gray-300 mb-4" />
 <h3 className="text-lg font-medium text-gray-600">No regional admins found</h3>
 <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or search term.</p>
 </div>
 ) : (
 /* Admin Cards */
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {filteredAdmins.map(admin => (
 <div key={admin.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
 <div className="p-6">
 <div className="flex items-start justify-between mb-4">
 <div className="flex items-center gap-4">
 <Image
 src={initialsAvatar(admin.name.split(' ')[0] ?? admin.name, admin.name.split(' ')[1] ?? '')}
 alt={admin.name}
 width={60}
 height={60}
 className="rounded-full"
 />
 <div>
 <h3 className="text-lg font-semibold text-gray-900">{admin.name}</h3>
 <p className="text-sm text-gray-500">{admin.email}</p>
 <div className="flex items-center gap-2 mt-1">
 <span className="text-2xl">{getCountryFlag(admin.country)}</span>
 <span className="text-sm font-medium">{admin.region}</span>
 </div>
 </div>
 </div>
 <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(admin.status)}`}>
 {admin.status.replace('_', ' ')}
 </span>
 </div>

 {/* Performance Metrics */}
 {admin.status === 'active' && (
 <div className="grid grid-cols-2 gap-4 mb-4">
 <div className="bg-blue-50 rounded-lg p-3">
 <p className="text-xs text-gray-600">User Growth</p>
 <p className="text-lg font-bold text-blue-600">+{admin.performance.userGrowth}%</p>
 </div>
 <div className="bg-green-50 rounded-lg p-3">
 <p className="text-xs text-gray-600">Monthly Revenue</p>
 <p className="text-lg font-bold text-green-600">Rs {admin.performance.revenue.toLocaleString()}</p>
 </div>
 <div className="bg-purple-50 rounded-lg p-3">
 <p className="text-xs text-gray-600">Satisfaction</p>
 <div className="flex items-center gap-1">
 <FaStar className="text-yellow-500" />
 <span className="text-lg font-bold text-purple-600">{admin.performance.satisfactionScore || ' - '}</span>
 </div>
 </div>
 <div className="bg-orange-50 rounded-lg p-3">
 <p className="text-xs text-gray-600">Active Users</p>
 <p className="text-lg font-bold text-orange-600">{admin.kpis.monthlyActiveUsers.toLocaleString()}</p>
 </div>
 </div>
 )}

 {/* Documents Status */}
 {admin.status === 'under_review' && (
 <div className="border-t pt-4 mb-4">
 <p className="text-sm font-medium text-gray-700 mb-2">Document Verification</p>
 <div className="grid grid-cols-2 gap-2">
 {Object.entries(admin.documents).map(([key, verified]) => (
 <div key={key} className="flex items-center gap-2">
 {verified ?
 <FaCheckCircle className="text-green-500" /> :
 <FaExclamationTriangle className="text-red-500" />
 }
 <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Actions */}
 <div className="flex gap-2 pt-4 border-t">
 <button
 onClick={() => setSelectedAdmin(admin)}
 className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
 >
 <FaEye />
 View Details
 </button>
 {admin.status === 'under_review' && (
 <button
 onClick={() => setSelectedAdmin(admin)}
 className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
 >
 <FaCheckCircle />
 Review
 </button>
 )}
 {admin.status === 'active' && (
 <Link
 href={`/regional/regional-admins/performance/${admin.id}`}
 className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
 >
 <FaChartBar />
 Performance
 </Link>
 )}
 </div>
 </div>
 </div>
 ))}
 </div>
 )}

 {/* Selected admin detail (simple modal) */}
 {selectedAdmin && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedAdmin(null)}>
 <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
 <h3 className="text-lg font-bold text-gray-900 mb-2">{selectedAdmin.name}</h3>
 <p className="text-sm text-gray-600 mb-1">{selectedAdmin.email}</p>
 <p className="text-sm text-gray-600 mb-4">{selectedAdmin.region} ({selectedAdmin.country})</p>
 <div className="grid grid-cols-2 gap-3 text-sm">
 <div><span className="text-gray-500">Active Users:</span> <strong>{selectedAdmin.kpis.monthlyActiveUsers.toLocaleString()}</strong></div>
 <div><span className="text-gray-500">Revenue:</span> <strong>Rs {selectedAdmin.kpis.monthlyRevenue.toLocaleString()}</strong></div>
 <div><span className="text-gray-500">Growth:</span> <strong>{selectedAdmin.performance.userGrowth}%</strong></div>
 <div><span className="text-gray-500">Status:</span> <strong className="capitalize">{selectedAdmin.status}</strong></div>
 </div>
 <button onClick={() => setSelectedAdmin(null)} className="mt-4 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">
 Close
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 )
}
