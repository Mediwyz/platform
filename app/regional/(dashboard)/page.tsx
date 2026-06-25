'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import GlobalMetrics from './GlobalMetrics'
import RevenueAnalytics from './RevenueAnalytics'
import PlatformHealth from './PlatformHealth'
import ActivityHeatmap from './ActivityHeatMap'
import DashboardStatCard from '@/components/shared/DashboardStatCard'
import {
 FaExclamationTriangle, FaUsers, FaUserShield, FaFileAlt,
 FaPercentage, FaMoneyBillWave, FaChartLine, FaExchangeAlt,
 FaSpinner, FaUserMd, FaHandshake, FaChartBar
} from 'react-icons/fa'

interface Alert {
 type: string
 message: string
 time: string
}

interface MetricsData {
 users: {
 total: number; active: number; patients: number; doctors: number
 nurses: number; nannies: number; pharmacists: number; labTechs: number
 emergencyWorkers: number; insuranceReps: number; corporateAdmins: number
 referralPartners: number
 }
 bookings: { total: number; pending: number; upcoming: number; completed: number; cancelled: number }
 revenue: { total: number; thisMonth: number; lastMonth: number }
 recentActivity: { newUsersThisWeek: number; bookingsThisWeek: number }
}

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
}

const QuickActions = () => {
 const actions = [
 { name: 'Manage Users', href: '/regional/users', icon: FaUsers, color: 'text-purple-500' },
 { name: 'Content Management', href: '/regional/content', icon: FaFileAlt, color: 'text-teal-500' },
 { name: 'Security', href: '/regional/security', icon: FaUserShield, color: 'text-red-500' },
 ]

 return (
 <div className="mb-8">
 <h2 className="text-xl font-bold text-fg mb-4">Quick Actions</h2>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 {actions.map((action) => (
 <Link
 key={action.name}
 href={action.href}
 className="bg-surface p-6 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center gap-4"
 >
 <action.icon className={`text-3xl ${action.color}`} />
 <div>
 <p className="font-semibold text-lg text-fg">{action.name}</p>
 <p className="text-sm text-soft">Go to {action.name.toLowerCase()}</p>
 </div>
 </Link>
 ))}
 </div>
 </div>
 )
}

export default function RegionalAdminDashboard() {
 const [timeRange, setTimeRange] = useState('24h')
 const [selectedRegion, setSelectedRegion] = useState('all')
 const [criticalAlerts, setCriticalAlerts] = useState<Alert[]>([])
 const [metrics, setMetrics] = useState<MetricsData | null>(null)
 const [commission, setCommission] = useState<CommissionData | null>(null)
 const [metricsLoading, setMetricsLoading] = useState(true)
 const [commissionLoading, setCommissionLoading] = useState(true)

 const [regions, setRegions] = useState([
 { code: 'all', name: 'All Regions', flag: '\u{1F30D}' },
 ])

 useEffect(() => {
 fetch('/api/regions')
  .then(r => r.json())
  .then(json => {
   if (json.success && Array.isArray(json.data)) {
    const mapped = json.data.map((r: { id: string; countryCode: string; name: string; flagEmoji?: string }) => ({
     code: r.countryCode || r.id,
     name: r.name,
     flag: r.flagEmoji || '\u{1F3F3}',
    }))
    setRegions([{ code: 'all', name: 'All Regions', flag: '\u{1F30D}' }, ...mapped])
   }
  })
  .catch(() => {})
 }, [])

 useEffect(() => {
 const fetchAlerts = async () => {
 try {
 const res = await fetch('/api/admin/alerts', { credentials: 'include' })
 if (res.ok) {
 const json = await res.json()
 if (json.success && Array.isArray(json.data)) setCriticalAlerts(json.data)
 }
 } catch { /* keep empty */ }
 }
 fetchAlerts()
 const interval = setInterval(fetchAlerts, 60000)
 return () => clearInterval(interval)
 }, [])

 // Fetch analytics metrics
 useEffect(() => {
 const fetchMetrics = async () => {
 try {
 const res = await fetch('/api/admin/metrics', { credentials: 'include' })
 if (res.ok) {
 const json = await res.json()
 if (json.success) setMetrics(json.data)
 }
 } catch { /* keep empty */ }
 finally { setMetricsLoading(false) }
 }
 fetchMetrics()
 }, [])

 // Fetch commission/earnings data
 useEffect(() => {
 fetch('/api/admin/platform-commission', { credentials: 'include' })
 .then((res) => res.json())
 .then((json) => { if (json.success) setCommission(json.data) })
 .catch(() => {})
 .finally(() => setCommissionLoading(false))
 }, [])

 const providers = metrics
 ? metrics.users.doctors + metrics.users.nurses + metrics.users.nannies +
 metrics.users.pharmacists + metrics.users.labTechs + metrics.users.emergencyWorkers
 : 0
 const revenueGrowth = metrics && metrics.revenue.lastMonth > 0
 ? Math.round(((metrics.revenue.thisMonth - metrics.revenue.lastMonth) / metrics.revenue.lastMonth) * 100 * 10) / 10
 : 0

 const userBreakdown = metrics ? [
 { label: 'Patients', count: metrics.users.patients, color: 'bg-blue-500' },
 { label: 'Doctors', count: metrics.users.doctors, color: 'bg-green-500' },
 { label: 'Nurses', count: metrics.users.nurses, color: 'bg-teal-500' },
 { label: 'Nannies', count: metrics.users.nannies, color: 'bg-pink-500' },
 { label: 'Pharmacists', count: metrics.users.pharmacists, color: 'bg-purple-500' },
 { label: 'Lab Technicians', count: metrics.users.labTechs, color: 'bg-indigo-500' },
 { label: 'Emergency Workers', count: metrics.users.emergencyWorkers, color: 'bg-red-500' },
 { label: 'Insurance Reps', count: metrics.users.insuranceReps, color: 'bg-amber-500' },
 { label: 'Corporate Admins', count: metrics.users.corporateAdmins, color: 'bg-slate-500' },
 { label: 'Referral Partners', count: metrics.users.referralPartners, color: 'bg-cyan-500' },
 ] : []

 return (
 <>
 {/* Filters */}
 <div className="flex justify-end gap-4 mb-6">
 <select
 value={timeRange}
 onChange={(e) => setTimeRange(e.target.value)}
 className="px-4 py-2 border rounded-lg bg-surface"
 >
 <option value="1h">Last Hour</option>
 <option value="24h">Last 24 Hours</option>
 <option value="7d">Last 7 Days</option>
 <option value="30d">Last 30 Days</option>
 </select>
 <select
 value={selectedRegion}
 onChange={(e) => setSelectedRegion(e.target.value)}
 className="px-4 py-2 border rounded-lg bg-surface"
 >
 {regions.map(region => (
 <option key={region.code} value={region.code}>
 {region.flag} {region.name}
 </option>
 ))}
 </select>
 </div>

 {/* Critical Alerts Bar */}
 {criticalAlerts.length > 0 && (
 <div className="bg-yellow-50 border-b border-yellow-200 rounded-lg mb-6">
 <div className="px-6 py-3">
 <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
 <FaExclamationTriangle className="text-yellow-600 flex-shrink-0" />
 {criticalAlerts.map((alert, idx) => (
 <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-surface rounded-lg flex-shrink-0">
 <span className={`w-2 h-2 rounded-full ${
 alert.type === 'error' ? 'bg-red-500' :
 alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
 }`} />
 <span className="text-sm">{alert.message}</span>
 <span className="text-xs text-soft">{alert.time}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 <QuickActions />

 {/* Commission Earnings Section */}
 <div className="mb-8">
 <h2 className="text-xl font-bold text-fg mb-4">Commission Earnings</h2>
 {commissionLoading ? (
 <div className="flex justify-center py-8">
 <FaSpinner className="animate-spin text-2xl text-blue-500" />
 </div>
 ) : commission ? (
 <>
 <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
 <DashboardStatCard
 title="Your Commission (10%)"
 value={`Rs ${(commission.totalRegionalCommission ?? 0).toLocaleString()}`}
 icon={FaPercentage}
 color="text-yellow-600"
 />
 <DashboardStatCard
 title="Platform Fee (5%)"
 value={`Rs ${(commission.totalPlatformCommission ?? 0).toLocaleString()}`}
 icon={FaMoneyBillWave}
 color="text-green-600"
 />
 <DashboardStatCard
 title="Total Volume"
 value={`Rs ${(commission.totalTransactionVolume ?? 0).toLocaleString()}`}
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

 {/* Commission Breakdown */}
 <div className="bg-surface rounded-xl shadow-sm border border-line p-4 sm:p-6 mb-6">
 <h3 className="text-lg font-semibold text-fg mb-4">How Commissions Work</h3>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className="bg-blue-50 rounded-lg p-4">
 <div className="text-2xl font-bold text-blue-700">85%</div>
 <div className="text-sm text-blue-600">Service Provider</div>
 <p className="text-xs text-blue-500 mt-1">Goes to the doctor, nurse, or other provider</p>
 </div>
 <div className="bg-yellow-50 rounded-lg p-4">
 <div className="text-2xl font-bold text-yellow-700">10%</div>
 <div className="text-sm text-yellow-600">Regional Admin</div>
 <p className="text-xs text-yellow-500 mt-1">Your earnings from each transaction</p>
 </div>
 <div className="bg-green-50 rounded-lg p-4">
 <div className="text-2xl font-bold text-green-700">5%</div>
 <div className="text-sm text-green-600">Platform</div>
 <p className="text-xs text-green-500 mt-1">MediWyz platform maintenance fee</p>
 </div>
 </div>
 </div>

 {/* Recent Commission Transactions */}
 {commission.recentTransactions.length > 0 && (
 <div className="bg-surface rounded-xl shadow-sm border border-line mb-6">
 <div className="p-4 border-b border-line">
 <h3 className="text-lg font-semibold text-fg">Recent Commission Transactions</h3>
 </div>
 <div className="overflow-x-auto scrollbar-hide">
 <table className="w-full">
 <thead>
 <tr className="bg-subtle border-b border-line">
 <th className="text-left py-3 px-4 text-xs font-medium text-soft uppercase">Description</th>
 <th className="text-left py-3 px-4 text-xs font-medium text-soft uppercase">Type</th>
 <th className="text-right py-3 px-4 text-xs font-medium text-soft uppercase">Total</th>
 <th className="text-right py-3 px-4 text-xs font-medium text-soft uppercase">Your Share</th>
 <th className="text-right py-3 px-4 text-xs font-medium text-soft uppercase">Date</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-line">
 {commission.recentTransactions.map((tx) => (
 <tr key={tx.id} className="hover:bg-subtle">
 <td className="py-3 px-4 text-sm text-fg">{tx.description}</td>
 <td className="py-3 px-4">
 <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
 {tx.serviceType || 'other'}
 </span>
 </td>
 <td className="py-3 px-4 text-sm text-right font-medium">Rs {(tx.amount ?? 0).toLocaleString()}</td>
 <td className="py-3 px-4 text-sm text-right font-medium text-yellow-600">
 Rs {(tx.regionalCommission ?? 0).toLocaleString()}
 </td>
 <td className="py-3 px-4 text-sm text-right text-soft">
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
 <div className="bg-subtle rounded-xl p-6 text-center text-soft mb-6">
 No commission data available yet
 </div>
 )}
 </div>

 {/* Analytics Section */}
 <div className="mb-8">
 <h2 className="text-xl font-bold text-fg mb-4">Platform Analytics</h2>
 {metricsLoading ? (
 <div className="flex justify-center py-8">
 <FaSpinner className="animate-spin text-2xl text-blue-500" />
 </div>
 ) : metrics ? (
 <>
 {/* Top Stats */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
 <div className="bg-surface rounded-xl p-6 shadow-lg">
 <div className="flex items-center justify-between mb-4">
 <div className="p-3 rounded-lg bg-blue-50"><FaUsers className="text-xl text-blue-600" /></div>
 </div>
 <h3 className="text-sm text-soft mb-1">Total Users</h3>
 <p className="text-2xl font-bold text-fg">{(metrics.users.total ?? 0).toLocaleString()}</p>
 <p className="text-xs text-green-600 mt-2">+{metrics.recentActivity.newUsersThisWeek} this week</p>
 </div>
 <div className="bg-surface rounded-xl p-6 shadow-lg">
 <div className="flex items-center justify-between mb-4">
 <div className="p-3 rounded-lg bg-green-50"><FaUserMd className="text-xl text-green-600" /></div>
 </div>
 <h3 className="text-sm text-soft mb-1">Healthcare Providers</h3>
 <p className="text-2xl font-bold text-fg">{(providers ?? 0).toLocaleString()}</p>
 <p className="text-xs text-soft mt-2">{metrics.users.doctors} doctors, {metrics.users.nurses} nurses</p>
 </div>
 <div className="bg-surface rounded-xl p-6 shadow-lg">
 <div className="flex items-center justify-between mb-4">
 <div className="p-3 rounded-lg bg-purple-50"><FaHandshake className="text-xl text-purple-600" /></div>
 </div>
 <h3 className="text-sm text-soft mb-1">Total Bookings</h3>
 <p className="text-2xl font-bold text-fg">{(metrics.bookings.total ?? 0).toLocaleString()}</p>
 <p className="text-xs text-green-600 mt-2">+{metrics.recentActivity.bookingsThisWeek} this week</p>
 </div>
 <div className="bg-surface rounded-xl p-6 shadow-lg">
 <div className="flex items-center justify-between mb-4">
 <div className="p-3 rounded-lg bg-orange-50"><FaChartLine className="text-xl text-orange-600" /></div>
 </div>
 <h3 className="text-sm text-soft mb-1">Revenue This Month</h3>
 <p className="text-2xl font-bold text-fg">Rs {(metrics.revenue.thisMonth ?? 0).toLocaleString()}</p>
 <p className={`text-xs mt-2 ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
 {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth}% vs last month
 </p>
 </div>
 </div>

 {/* User Breakdown + Bookings */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
 <div className="bg-surface rounded-xl p-6 shadow-lg">
 <h3 className="text-lg font-bold text-fg mb-4">User Breakdown</h3>
 <div className="space-y-3">
 {userBreakdown.map((item) => {
 const percentage = metrics.users.total > 0
 ? Math.round((item.count / metrics.users.total) * 100)
 : 0
 return (
 <div key={item.label}>
 <div className="flex justify-between items-center mb-1">
 <span className="text-sm font-medium text-soft">{item.label}</span>
 <span className="text-sm text-soft">{(item.count ?? 0).toLocaleString()} ({percentage}%)</span>
 </div>
 <div className="bg-line rounded-full h-2">
 <div
 className={`${item.color} rounded-full h-2 transition-all duration-500`}
 style={{ width: `${Math.max(percentage, 1)}%` }}
 />
 </div>
 </div>
 )
 })}
 </div>
 </div>

 <div className="space-y-6">
 <div className="bg-surface rounded-xl p-6 shadow-lg">
 <h3 className="text-lg font-bold text-fg mb-4">Bookings Overview</h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {[
 { label: 'Pending', value: metrics.bookings.pending, color: 'text-yellow-600', bg: 'bg-yellow-50' },
 { label: 'Upcoming', value: metrics.bookings.upcoming, color: 'text-blue-600', bg: 'bg-blue-50' },
 { label: 'Completed', value: metrics.bookings.completed, color: 'text-green-600', bg: 'bg-green-50' },
 { label: 'Cancelled', value: metrics.bookings.cancelled, color: 'text-red-600', bg: 'bg-red-50' },
 ].map((item) => (
 <div key={item.label} className={`${item.bg} rounded-lg p-4`}>
 <p className="text-sm text-soft">{item.label}</p>
 <p className={`text-xl font-bold ${item.color}`}>{(item.value ?? 0).toLocaleString()}</p>
 </div>
 ))}
 </div>
 </div>

 <div className="bg-surface rounded-xl p-6 shadow-lg">
 <h3 className="text-lg font-bold text-fg mb-4">Revenue Summary</h3>
 <div className="space-y-3">
 <div className="flex justify-between py-2 border-b border-line">
 <span className="text-soft">Total Revenue</span>
 <span className="font-bold text-fg">Rs {(metrics.revenue.total ?? 0).toLocaleString()}</span>
 </div>
 <div className="flex justify-between py-2 border-b border-line">
 <span className="text-soft">This Month</span>
 <span className="font-bold text-green-600">Rs {(metrics.revenue.thisMonth ?? 0).toLocaleString()}</span>
 </div>
 <div className="flex justify-between py-2">
 <span className="text-soft">Last Month</span>
 <span className="font-bold text-soft">Rs {(metrics.revenue.lastMonth ?? 0).toLocaleString()}</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </>
 ) : (
 <div className="bg-subtle rounded-xl p-6 text-center text-soft mb-6">
 <FaChartBar className="text-4xl mx-auto mb-3 text-faint" />
 <p>Unable to load analytics data</p>
 </div>
 )}
 </div>

 {/* Existing Dashboard Components */}
 <GlobalMetrics timeRange={timeRange} region={selectedRegion} />
 <RevenueAnalytics timeRange={timeRange} region={selectedRegion} />
 <PlatformHealth />
 <ActivityHeatmap />
 </>
 )
}
