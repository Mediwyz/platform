'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
 FaUsers, FaCalendarAlt, FaDollarSign,
 FaUserMd, FaUserNurse, FaChild, FaAmbulance, FaPills, FaFlask,
 FaArrowUp, FaSpinner
} from 'react-icons/fa'

interface MetricsData {
 users: {
 total: number
 active: number
 patients: number
 doctors: number
 nurses: number
 nannies: number
 pharmacists: number
 labTechs: number
 emergencyWorkers: number
 insuranceReps: number
 corporateAdmins: number
 referralPartners: number
 }
 bookings: {
 total: number
 pending: number
 upcoming: number
 completed: number
 cancelled: number
 }
 revenue: {
 total: number
 thisMonth: number
 lastMonth: number
 byServiceType: { serviceType: string; total: number }[]
 }
 recentActivity: {
 newUsersThisWeek: number
 bookingsThisWeek: number
 videoSessionsThisWeek: number
 }
}

interface CategoryStat {
 label: string
 count: number
 icon: React.ReactNode
 color: string
}

export default function UserStatistics() {
 const [metrics, setMetrics] = useState<MetricsData | null>(null)
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)

 useEffect(() => {
 const fetchMetrics = async () => {
 try {
 const res = await fetch('/api/admin/metrics', { credentials: 'include' })
 if (res.ok) {
 const json = await res.json()
 if (json.success && json.data) {
 setMetrics(json.data)
 } else {
 setError('Failed to load metrics')
 }
 } else {
 setError('Failed to load metrics')
 }
 } catch {
 setError('Failed to load metrics')
 } finally {
 setLoading(false)
 }
 }
 fetchMetrics()
 }, [])

 if (loading) {
 return (
 <div className="min-h-screen bg-gray-50 flex items-center justify-center">
 <FaSpinner className="animate-spin text-3xl text-blue-600" />
 </div>
 )
 }

 const categoryStats: CategoryStat[] = metrics ? [
 { label: 'Doctors', count: metrics.users.doctors, icon: <FaUserMd />, color: 'text-blue-600' },
 { label: 'Nurses', count: metrics.users.nurses, icon: <FaUserNurse />, color: 'text-purple-600' },
 { label: 'Child Care', count: metrics.users.nannies, icon: <FaChild />, color: 'text-pink-600' },
 { label: 'Emergency', count: metrics.users.emergencyWorkers, icon: <FaAmbulance />, color: 'text-red-600' },
 { label: 'Pharmacy', count: metrics.users.pharmacists, icon: <FaPills />, color: 'text-green-600' },
 { label: 'Lab Tech', count: metrics.users.labTechs, icon: <FaFlask />, color: 'text-orange-600' },
 ] : []

 return (
 <div className="min-h-screen bg-gray-50">
 {/* Header */}
 <div className="bg-white shadow-sm border-b">
 <div className="container mx-auto px-4 py-4">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-gray-900">User &amp; Visit Statistics</h1>
 <p className="text-gray-600">Platform analytics and growth metrics</p>
 </div>
 <Link href="/admin" className="px-4 py-2 border rounded-lg hover:bg-gray-50">
 Back to Dashboard
 </Link>
 </div>
 </div>
 </div>

 <div className="container mx-auto px-4 py-8">
 {error && (
 <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
 {error}
 </div>
 )}

 {/* Summary Cards */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
 <div className="bg-white rounded-xl p-6 shadow">
 <div className="flex items-center justify-between mb-2">
 <span className="text-gray-600 text-sm">Total Users</span>
 <FaUsers className="text-blue-600" />
 </div>
 <p className="text-2xl font-bold text-gray-900">{metrics?.users.total.toLocaleString() ?? ' - '}</p>
 <p className="text-sm text-green-600 flex items-center gap-1 mt-2">
 <FaArrowUp /> {metrics?.recentActivity.newUsersThisWeek ?? 0} new this week
 </p>
 </div>
 <div className="bg-white rounded-xl p-6 shadow">
 <div className="flex items-center justify-between mb-2">
 <span className="text-gray-600 text-sm">Active Users</span>
 <FaUsers className="text-green-600" />
 </div>
 <p className="text-2xl font-bold text-gray-900">{metrics?.users.active.toLocaleString() ?? ' - '}</p>
 <p className="text-sm text-gray-600 mt-2">
 {metrics ? Math.round((metrics.users.active / metrics.users.total) * 100) : 0}% of total
 </p>
 </div>
 <div className="bg-white rounded-xl p-6 shadow">
 <div className="flex items-center justify-between mb-2">
 <span className="text-gray-600 text-sm">Total Bookings</span>
 <FaCalendarAlt className="text-purple-600" />
 </div>
 <p className="text-2xl font-bold text-gray-900">{metrics?.bookings.total.toLocaleString() ?? ' - '}</p>
 <p className="text-sm text-green-600 flex items-center gap-1 mt-2">
 <FaArrowUp /> {metrics?.recentActivity.bookingsThisWeek ?? 0} this week
 </p>
 </div>
 <div className="bg-white rounded-xl p-6 shadow">
 <div className="flex items-center justify-between mb-2">
 <span className="text-gray-600 text-sm">Total Revenue</span>
 <FaDollarSign className="text-orange-600" />
 </div>
 <p className="text-2xl font-bold text-gray-900">
 Rs {(metrics?.revenue.total ?? 0).toLocaleString()}
 </p>
 <p className="text-sm text-gray-600 mt-2">
 Rs {(metrics?.revenue.thisMonth ?? 0).toLocaleString()} this month
 </p>
 </div>
 </div>

 {/* Booking Status Breakdown */}
 <div className="bg-white rounded-xl p-6 shadow mb-6">
 <h2 className="text-xl font-bold text-gray-900 mb-6">Booking Status Breakdown</h2>
 <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
 {metrics && [
 { label: 'Total', value: metrics.bookings.total, color: 'text-gray-900' },
 { label: 'Pending', value: metrics.bookings.pending, color: 'text-orange-600' },
 { label: 'Upcoming', value: metrics.bookings.upcoming, color: 'text-blue-600' },
 { label: 'Completed', value: metrics.bookings.completed, color: 'text-green-600' },
 { label: 'Cancelled', value: metrics.bookings.cancelled, color: 'text-red-600' },
 ].map(item => (
 <div key={item.label} className="text-center p-4 bg-gray-50 rounded-lg">
 <p className={`text-2xl font-bold ${item.color}`}>{item.value.toLocaleString()}</p>
 <p className="text-sm text-gray-600 mt-1">{item.label}</p>
 </div>
 ))}
 </div>
 </div>

 {/* Provider Distribution */}
 <div className="bg-white rounded-xl p-6 shadow mb-6">
 <h2 className="text-xl font-bold text-gray-900 mb-6">Users by Provider Category</h2>
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
 {categoryStats.map(cat => (
 <div key={cat.label} className="text-center p-4 bg-gray-50 rounded-lg">
 <div className={`text-3xl mb-2 flex justify-center ${cat.color}`}>{cat.icon}</div>
 <p className="text-xl font-bold text-gray-900">{cat.count}</p>
 <p className="text-xs text-gray-600 mt-1">{cat.label}</p>
 </div>
 ))}
 </div>
 </div>

 {/* Revenue by Service Type */}
 {metrics && metrics.revenue.byServiceType.length > 0 && (
 <div className="bg-white rounded-xl p-6 shadow mb-6">
 <h2 className="text-xl font-bold text-gray-900 mb-6">Revenue by Service Type</h2>
 <div className="space-y-3">
 {metrics.revenue.byServiceType.map(row => (
 <div key={row.serviceType} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
 <span className="font-medium text-gray-700 capitalize">
 {row.serviceType.replace(/_/g, ' ')}
 </span>
 <span className="font-bold text-gray-900">Rs {row.total.toLocaleString()}</span>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Recent Activity */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="bg-white rounded-xl p-6 shadow">
 <h3 className="font-bold text-gray-900 mb-4">This Week&apos;s Activity</h3>
 <div className="space-y-3">
 <div className="flex justify-between items-center">
 <span className="text-gray-600">New Users</span>
 <span className="font-medium">{metrics?.recentActivity.newUsersThisWeek ?? 0}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-gray-600">New Bookings</span>
 <span className="font-medium">{metrics?.recentActivity.bookingsThisWeek ?? 0}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-gray-600">Video Sessions</span>
 <span className="font-medium">{metrics?.recentActivity.videoSessionsThisWeek ?? 0}</span>
 </div>
 </div>
 </div>
 <div className="bg-white rounded-xl p-6 shadow">
 <h3 className="font-bold text-gray-900 mb-4">Revenue Comparison</h3>
 <div className="space-y-3">
 <div className="flex justify-between items-center">
 <span className="text-gray-600">This Month</span>
 <span className="font-medium">Rs {(metrics?.revenue.thisMonth ?? 0).toLocaleString()}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-gray-600">Last Month</span>
 <span className="font-medium">Rs {(metrics?.revenue.lastMonth ?? 0).toLocaleString()}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-gray-600">All Time</span>
 <span className="font-medium">Rs {(metrics?.revenue.total ?? 0).toLocaleString()}</span>
 </div>
 </div>
 </div>
 <div className="bg-white rounded-xl p-6 shadow">
 <h3 className="font-bold text-gray-900 mb-4">Patient Distribution</h3>
 <div className="space-y-3">
 <div className="flex justify-between items-center">
 <span className="text-gray-600">Patients</span>
 <span className="font-medium">{metrics?.users.patients ?? 0}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-gray-600">Insurance Reps</span>
 <span className="font-medium">{metrics?.users.insuranceReps ?? 0}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-gray-600">Corporate Admins</span>
 <span className="font-medium">{metrics?.users.corporateAdmins ?? 0}</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 )
}
