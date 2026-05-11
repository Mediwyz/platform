'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'
import {
 FaUsers, FaUserMd,
 FaCheckCircle, FaDollarSign, FaChartLine,
 FaNewspaper, FaUsersCog, FaSpinner, FaShieldAlt,
 FaPercentage, FaExchangeAlt, FaGlobeAmericas
} from 'react-icons/fa'
import { IconType } from 'react-icons'
import WalletBalanceCard from '@/components/shared/WalletBalanceCard'
import DashboardStatCard from '@/components/shared/DashboardStatCard'

function SystemHealthCard() {
 const [health, setHealth] = useState<{
 cpuUsage: number; memoryUsage: number; responseTime: number
 } | null>(null)

 useEffect(() => {
 const fetchHealth = async () => {
 try {
 const res = await fetch('/api/admin/system-health', { credentials: 'include' })
 if (res.ok) {
 const json = await res.json()
 if (json.success) {
 setHealth({
 cpuUsage: json.data.performance.cpuUsage,
 memoryUsage: json.data.performance.memoryUsage,
 responseTime: json.data.services?.[0]?.responseTime ?? 0,
 })
 }
 }
 } catch { /* fail silently */ }
 }
 fetchHealth()
 const interval = setInterval(fetchHealth, 30000)
 return () => clearInterval(interval)
 }, [])

 const getBarColor = (v: number) => v > 80 ? 'bg-red-500' : v > 60 ? 'bg-yellow-500' : 'bg-green-500'

 return (
 <div className="bg-white rounded-xl p-6 shadow-lg">
 <h3 className="text-lg font-bold text-gray-900 mb-4">System Health</h3>
 {health ? (
 <div className="space-y-4">
 <div>
 <div className="flex justify-between text-sm mb-1">
 <span className="text-gray-600">Server Load</span>
 <span className="font-medium">{health.cpuUsage}%</span>
 </div>
 <div className="bg-gray-200 rounded-full h-2">
 <div className={`${getBarColor(health.cpuUsage)} rounded-full h-2`} style={{ width: `${health.cpuUsage}%` }} />
 </div>
 </div>
 <div>
 <div className="flex justify-between text-sm mb-1">
 <span className="text-gray-600">Database Usage</span>
 <span className="font-medium">{health.memoryUsage}%</span>
 </div>
 <div className="bg-gray-200 rounded-full h-2">
 <div className={`${getBarColor(health.memoryUsage)} rounded-full h-2`} style={{ width: `${health.memoryUsage}%` }} />
 </div>
 </div>
 <div>
 <div className="flex justify-between text-sm mb-1">
 <span className="text-gray-600">API Response Time</span>
 <span className={`font-medium ${health.responseTime < 200 ? 'text-green-600' : 'text-yellow-600'}`}>{health.responseTime}ms</span>
 </div>
 </div>
 </div>
 ) : (
 <div className="text-center py-4 text-gray-400 text-sm">Loading health data...</div>
 )}
 </div>
 )
}

interface CategoryStat { category: string; count: number; active: number; pending: number }
interface ActivityItem { type: string; message: string; time: string }
interface QuickAction { title: string; icon: IconType; href: string; color: string }
interface CommissionData {
 totalPlatformCommission: number
 totalRegionalCommission: number
 totalTransactionVolume: number
 transactionCount: number
 recentTransactions: Array<{
 id: string; amount: number; description: string; serviceType: string | null
 platformCommission: number | null; regionalCommission: number | null
 providerAmount: number | null; createdAt: string
 }>
 regionalAdmins: Array<{
 id: string; name: string; email: string; region: string; country: string
 commissionRate: number; totalCommission: number
 }>
}

const AdminDashboard = () => {
 const [selectedPeriod, setSelectedPeriod] = useState('month')
 const { user: currentUser } = useUser()
 const userId = currentUser?.id ?? ''
 const [loading, setLoading] = useState(true)
 const [stats, setStats] = useState({
 totalUsers: 0, pendingValidations: 0, monthlyRevenue: 0, activeSessions: 0,
 })
 const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([])
 const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
 const [commission, setCommission] = useState<CommissionData | null>(null)
 const [commissionLoading, setCommissionLoading] = useState(true)

 useEffect(() => {
 if (!userId) return
 const fetchDashboard = async () => {
 try {
 const res = await fetch('/api/admin/dashboard', { credentials: 'include' })
 if (res.ok) {
 const json = await res.json()
 if (json.success) {
 const s = json.data?.stats ?? {}
 setStats({
 totalUsers: Number(s.totalUsers ?? 0),
 pendingValidations: Number(s.pendingValidations ?? 0),
 monthlyRevenue: Number(s.monthlyRevenue ?? 0),
 activeSessions: Number(s.activeSessions ?? 0),
 })
 setCategoryStats(json.data?.categoryStats || [])
 setRecentActivity(json.data?.recentActivity || [])
 }
 }
 } catch (error) {
 console.error('Failed to fetch admin dashboard:', error)
 } finally {
 setLoading(false)
 }
 }
 fetchDashboard()
 }, [userId])

 // Fetch commission/earnings
 useEffect(() => {
 fetch('/api/admin/platform-commission', { credentials: 'include' })
 .then((res) => res.json())
 .then((json) => {
 if (!json.success) return
 const d = json.data ?? {}
 setCommission({
 totalPlatformCommission: Number(d.totalPlatformCommission ?? 0),
 totalRegionalCommission: Number(d.totalRegionalCommission ?? 0),
 totalTransactionVolume: Number(d.totalTransactionVolume ?? 0),
 transactionCount: Number(d.transactionCount ?? 0),
 recentTransactions: Array.isArray(d.recentTransactions) ? d.recentTransactions : [],
 regionalAdmins: Array.isArray(d.regionalAdmins) ? d.regionalAdmins : [],
 })
 })
 .catch(() => {})
 .finally(() => setCommissionLoading(false))
 }, [])

 const quickActions: QuickAction[] = [
 { title: 'User Management', icon: FaUsersCog, href: '/admin/users', color: 'bg-blue-500' },
 { title: 'Regional Admins', icon: FaGlobeAmericas, href: '/admin/regional-admins', color: 'bg-teal-500' },
 { title: 'Content Management', icon: FaNewspaper, href: '/admin/content', color: 'bg-pink-500' },
 { title: 'Security', icon: FaShieldAlt, href: '/admin/security', color: 'bg-indigo-500' },
 ]

 return (
 <>
 {/* Wallet Balance */}
 {userId && (
 <div className="mb-6">
 <WalletBalanceCard userId={userId} />
 </div>
 )}

 {/* Period Filter */}
 <div className="flex justify-end mb-6">
 <select
 value={selectedPeriod}
 onChange={(e) => setSelectedPeriod(e.target.value)}
 className="px-4 py-2 border rounded-lg text-sm"
 >
 <option value="day">Today</option>
 <option value="week">This Week</option>
 <option value="month">This Month</option>
 <option value="year">This Year</option>
 </select>
 </div>

 {/* Stats Overview */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
 {([
 { title: 'Total Users', value: loading ? '...' : stats.totalUsers.toLocaleString(), icon: FaUsers, color: 'bg-blue-500' },
 { title: 'Pending Validations', value: loading ? '...' : stats.pendingValidations, icon: FaCheckCircle, color: 'bg-orange-500' },
 { title: 'Monthly Revenue', value: loading ? '...' : `Rs ${stats.monthlyRevenue.toLocaleString()}`, icon: FaDollarSign, color: 'bg-green-500' },
 { title: 'Active Sessions', value: loading ? '...' : stats.activeSessions, icon: FaChartLine, color: 'bg-purple-500' },
 ] as const).map((stat, idx) => (
 <div key={idx} className="bg-white rounded-xl p-6 shadow-lg">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-gray-600 text-sm">{stat.title}</p>
 <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
 </div>
 <div className={`p-3 rounded-full ${stat.color}`}>
 <stat.icon className="text-white text-xl" />
 </div>
 </div>
 </div>
 ))}
 </div>

 {/* Platform Earnings Section */}
 <div className="mb-8">
 <h2 className="text-xl font-bold text-gray-800 mb-4">Platform Earnings</h2>
 {commissionLoading ? (
 <div className="flex justify-center py-8">
 <FaSpinner className="animate-spin text-2xl text-blue-500" />
 </div>
 ) : commission ? (
 <>
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
 <DashboardStatCard
 title="Platform Revenue (5%)"
 value={`Rs ${commission.totalPlatformCommission.toLocaleString()}`}
 icon={FaPercentage}
 color="text-green-600"
 />
 <DashboardStatCard
 title="Regional Admin Payouts"
 value={`Rs ${commission.totalRegionalCommission.toLocaleString()}`}
 icon={FaGlobeAmericas}
 color="text-yellow-600"
 />
 <DashboardStatCard
 title="Total Volume"
 value={`Rs ${commission.totalTransactionVolume.toLocaleString()}`}
 icon={FaChartLine}
 color="text-blue-600"
 />
 <DashboardStatCard
 title="Transactions"
 value={commission.transactionCount.toString()}
 icon={FaExchangeAlt}
 color="text-purple-600"
 />
 </div>

 {/* Revenue Distribution */}
 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
 <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Distribution Model</h3>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className="bg-blue-50 rounded-lg p-4">
 <div className="text-2xl font-bold text-blue-700">85%</div>
 <div className="text-sm text-blue-600">Service Provider</div>
 <p className="text-xs text-blue-500 mt-1">Doctors, nurses, pharmacists, etc.</p>
 </div>
 <div className="bg-yellow-50 rounded-lg p-4">
 <div className="text-2xl font-bold text-yellow-700">10%</div>
 <div className="text-sm text-yellow-600">Regional Admin</div>
 <p className="text-xs text-yellow-500 mt-1">Per-region administrator commission</p>
 </div>
 <div className="bg-green-50 rounded-lg p-4">
 <div className="text-2xl font-bold text-green-700">5%</div>
 <div className="text-sm text-green-600">Platform</div>
 <p className="text-xs text-green-500 mt-1">MediWyz platform maintenance</p>
 </div>
 </div>
 </div>

 {/* Regional Admin Commission Summary */}
 {commission.regionalAdmins.length > 0 && (
 <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
 <div className="p-4 border-b border-gray-200">
 <h3 className="text-lg font-semibold text-gray-900">Regional Admin Commissions</h3>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead>
 <tr className="bg-gray-50 border-b border-gray-200">
 <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Admin</th>
 <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Region</th>
 <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Rate</th>
 <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Total Earned</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {commission.regionalAdmins.map((admin) => (
 <tr key={admin.id} className="hover:bg-gray-50">
 <td className="py-3 px-4">
 <div className="text-sm font-medium text-gray-900">{admin.name}</div>
 <div className="text-xs text-gray-500">{admin.email}</div>
 </td>
 <td className="py-3 px-4 text-sm text-gray-600">{admin.region}, {admin.country}</td>
 <td className="py-3 px-4 text-sm text-right">{admin.commissionRate}%</td>
 <td className="py-3 px-4 text-sm text-right font-medium text-yellow-600">
 Rs {(admin.totalCommission ?? 0).toLocaleString()}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* Recent Transactions */}
 {commission.recentTransactions.length > 0 && (
 <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
 <div className="p-4 border-b border-gray-200">
 <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead>
 <tr className="bg-gray-50 border-b border-gray-200">
 <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Description</th>
 <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Type</th>
 <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Total</th>
 <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Platform (5%)</th>
 <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Regional (10%)</th>
 <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Date</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {commission.recentTransactions.map((tx) => (
 <tr key={tx.id} className="hover:bg-gray-50">
 <td className="py-3 px-4 text-sm text-gray-900">{tx.description}</td>
 <td className="py-3 px-4">
 <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
 {tx.serviceType || 'other'}
 </span>
 </td>
 <td className="py-3 px-4 text-sm text-right font-medium">Rs {(tx.amount ?? 0).toLocaleString()}</td>
 <td className="py-3 px-4 text-sm text-right text-green-600">
 Rs {(tx.platformCommission ?? 0).toLocaleString()}
 </td>
 <td className="py-3 px-4 text-sm text-right text-yellow-600">
 Rs {(tx.regionalCommission ?? 0).toLocaleString()}
 </td>
 <td className="py-3 px-4 text-sm text-right text-gray-500">
 {new Date(tx.createdAt).toLocaleDateString()}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </>
 ) : (
 <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500 mb-6">
 No commission data available yet
 </div>
 )}
 </div>

 <div className="grid lg:grid-cols-3 gap-8">
 {/* Quick Actions + Categories */}
 <div className="lg:col-span-2">
 <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
 <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {quickActions.map((action, idx) => (
 <Link
 key={idx}
 href={action.href}
 className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition group"
 >
 <div className={`p-3 rounded-full ${action.color} w-fit mb-3`}>
 <action.icon className="text-white text-xl" />
 </div>
 <p className="font-semibold text-gray-900 group-hover:text-blue-600">
 {action.title}
 </p>
 </Link>
 ))}
 </div>
 </div>

 {/* Category Statistics */}
 <div className="bg-white rounded-xl p-6 shadow-lg">
 <h2 className="text-xl font-bold text-gray-900 mb-6">Provider Categories</h2>
 {loading ? (
 <div className="flex justify-center py-8">
 <FaSpinner className="animate-spin text-2xl text-blue-500" />
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-gray-50">
 <tr>
 <th className="p-3 text-left font-medium text-gray-700">Category</th>
 <th className="p-3 text-center font-medium text-gray-700">Total</th>
 <th className="p-3 text-center font-medium text-gray-700">Active</th>
 <th className="p-3 text-center font-medium text-gray-700">Pending</th>
 </tr>
 </thead>
 <tbody>
 {categoryStats.map((cat, idx) => (
 <tr key={idx} className="border-b hover:bg-gray-50">
 <td className="p-3 font-medium">{cat.category}</td>
 <td className="p-3 text-center">{(cat.count ?? 0).toLocaleString()}</td>
 <td className="p-3 text-center text-green-600">{(cat.active ?? 0).toLocaleString()}</td>
 <td className="p-3 text-center">
 <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">{cat.pending}</span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </div>

 {/* Sidebar */}
 <div className="space-y-6">
 <div className="bg-white rounded-xl p-6 shadow-lg">
 <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activities</h3>
 {loading ? (
 <div className="flex justify-center py-4">
 <FaSpinner className="animate-spin text-xl text-blue-500" />
 </div>
 ) : recentActivity.length === 0 ? (
 <p className="text-gray-500 text-center py-4">No recent activity</p>
 ) : (
 <div className="space-y-3">
 {recentActivity.map((activity, idx) => (
 <div key={idx} className="flex items-start gap-3">
 <div className="p-2 bg-blue-100 rounded-full">
 <FaUserMd className="text-blue-600 text-sm" />
 </div>
 <div className="flex-1">
 <p className="text-sm text-gray-900">{activity.message}</p>
 <p className="text-xs text-gray-500">{new Date(activity.time).toLocaleString()}</p>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 <SystemHealthCard />
 </div>
 </div>
 </>
 )
}

export default AdminDashboard
