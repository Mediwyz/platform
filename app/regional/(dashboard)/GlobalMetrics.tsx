'use client'

import { FaUsers, FaUserMd, FaHandshake, FaChartLine } from 'react-icons/fa'
import { TbTrendingUp, TbTrendingDown } from 'react-icons/tb'
import { useEffect, useState } from 'react'

interface MetricData {
 title: string
 value: string | number
 change: number
 trend: 'up' | 'down' | 'stable'
 icon: React.ElementType
 color: string
 subMetrics?: { label: string; value: string | number }[]
}

export default function GlobalMetrics({ timeRange, region }: { timeRange: string; region: string }) {
 const [metrics, setMetrics] = useState<MetricData[]>([])
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 const fetchMetrics = async () => {
 setLoading(true)
 try {
 const res = await fetch('/api/admin/metrics', { credentials: 'include' })
 if (!res.ok) throw new Error('Failed to fetch')
 const json = await res.json()
 if (!json.success) throw new Error(json.message)
 const d = json.data

 const providers = d.users.doctors + d.users.nurses + d.users.nannies +
 d.users.pharmacists + d.users.labTechs + d.users.emergencyWorkers
 const partners = d.users.insuranceReps + d.users.corporateAdmins + d.users.referralPartners

 const revenueGrowth = d.revenue.lastMonth > 0
 ? Math.round(((d.revenue.thisMonth - d.revenue.lastMonth) / d.revenue.lastMonth) * 100 * 10) / 10
 : 0

 setMetrics([
 {
 title: 'Total Active Users',
 value: (d.users.active ?? 0).toLocaleString(),
 change: d.recentActivity.newUsersThisWeek,
 trend: d.recentActivity.newUsersThisWeek > 0 ? 'up' : 'stable',
 icon: FaUsers,
 color: 'bg-blue-500',
 subMetrics: [
 { label: 'Patients', value: (d.users.patients ?? 0).toLocaleString() },
 { label: 'Providers', value: (providers ?? 0).toLocaleString() },
 { label: 'Partners', value: (partners ?? 0).toLocaleString() },
 ],
 },
 {
 title: 'Healthcare Providers',
 value: (providers ?? 0).toLocaleString(),
 change: 0,
 trend: 'stable',
 icon: FaUserMd,
 color: 'bg-green-500',
 subMetrics: [
 { label: 'Doctors', value: (d.users.doctors ?? 0).toLocaleString() },
 { label: 'Nurses', value: (d.users.nurses ?? 0).toLocaleString() },
 { label: 'Others', value: (d.users.nannies + d.users.pharmacists + d.users.labTechs + d.users.emergencyWorkers).toLocaleString() },
 ],
 },
 {
 title: 'Bookings Overview',
 value: (d.bookings.total ?? 0).toLocaleString(),
 change: d.recentActivity.bookingsThisWeek,
 trend: d.recentActivity.bookingsThisWeek > 0 ? 'up' : 'stable',
 icon: FaHandshake,
 color: 'bg-purple-500',
 subMetrics: [
 { label: 'Pending', value: (d.bookings.pending ?? 0).toLocaleString() },
 { label: 'Upcoming', value: (d.bookings.upcoming ?? 0).toLocaleString() },
 { label: 'Completed', value: (d.bookings.completed ?? 0).toLocaleString() },
 ],
 },
 {
 title: 'Revenue This Month',
 value: `Rs ${(d.revenue.thisMonth ?? 0).toLocaleString()}`,
 change: revenueGrowth,
 trend: revenueGrowth > 0 ? 'up' : revenueGrowth < 0 ? 'down' : 'stable',
 icon: FaChartLine,
 color: 'bg-orange-500',
 subMetrics: [
 { label: 'Total Revenue', value: `Rs ${(d.revenue.total ?? 0).toLocaleString()}` },
 { label: 'Last Month', value: `Rs ${(d.revenue.lastMonth ?? 0).toLocaleString()}` },
 ],
 },
 ])
 } catch {
 // Fallback to empty state on error
 setMetrics([])
 } finally {
 setLoading(false)
 }
 }

 fetchMetrics()
 }, [timeRange, region])

 if (loading) {
 return (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
 {[1, 2, 3, 4].map(i => (
 <div key={i} className="bg-white rounded-xl p-6 shadow-lg animate-pulse">
 <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
 <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
 <div className="h-3 bg-gray-200 rounded w-1/3"></div>
 </div>
 ))}
 </div>
 )
 }

 return (
 <div className="mb-8">
 <h2 className="text-2xl font-bold mb-6">Global Platform Metrics</h2>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 {metrics.map((metric, idx) => (
 <div key={idx} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow group">
 <div className="flex items-start justify-between mb-4">
 <div className={`p-3 rounded-lg ${metric.color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
 <metric.icon className={`text-2xl ${metric.color.replace('bg-', 'text-')}`} />
 </div>
 <div className="flex items-center gap-1">
 {metric.trend === 'up' ? (
 <TbTrendingUp className="text-green-500" />
 ) : metric.trend === 'down' ? (
 <TbTrendingDown className="text-red-500" />
 ) : null}
 <span className={`text-sm font-medium ${
 metric.trend === 'up' ? 'text-green-500' : 
 metric.trend === 'down' ? 'text-red-500' : 'text-gray-500'
 }`}>
 {metric.change > 0 ? '+' : ''}{metric.change}%
 </span>
 </div>
 </div>
 
 <h3 className="text-gray-600 text-sm mb-1">{metric.title}</h3>
 <p className="text-3xl font-bold text-gray-900 mb-4">{metric.value}</p>
 
 {metric.subMetrics && (
 <div className="pt-4 border-t space-y-2">
 {metric.subMetrics.map((sub, subIdx) => (
 <div key={subIdx} className="flex justify-between text-sm">
 <span className="text-gray-500">{sub.label}</span>
 <span className="font-medium text-gray-700">{sub.value}</span>
 </div>
 ))}
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 )
}