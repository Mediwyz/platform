'use client'

import { useState, useEffect } from 'react'
import { FaUsers, FaChartBar, FaDollarSign, FaSpinner } from 'react-icons/fa'
import type { IconType } from 'react-icons'

interface RegionActivity {
 region: string
 code: string
 flag: string
 activeUsers: number
 transactions: number
 revenue: number
 growth: number
 peakTime: string
 popularServices: string[]
}

type MetricKey = 'users' | 'transactions' | 'revenue'

interface Metric {
 key: MetricKey
 label: string
 icon: IconType
}

export default function ActivityHeatmap() {
 const [regionActivities, setRegionActivities] = useState<RegionActivity[]>([])
 const [selectedMetric, setSelectedMetric] = useState<MetricKey>('users')
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 const fetchActivity = async () => {
 try {
 const res = await fetch('/api/admin/regional-activity', { credentials: 'include' })
 if (res.ok) {
 const json = await res.json()
 if (json.success && Array.isArray(json.data)) {
 setRegionActivities(json.data)
 }
 }
 } catch {
 // Keep empty on error
 } finally {
 setLoading(false)
 }
 }

 fetchActivity()
 }, [])

 const metrics: Metric[] = [
 { key: 'users', label: 'Active Users', icon: FaUsers },
 { key: 'transactions', label: 'Transactions', icon: FaChartBar },
 { key: 'revenue', label: 'Revenue', icon: FaDollarSign },
 ]

 const getHeatmapColor = (value: number, max: number) => {
 const intensity = value / max
 if (intensity > 0.8) return 'bg-red-500'
 if (intensity > 0.6) return 'bg-orange-500'
 if (intensity > 0.4) return 'bg-yellow-500'
 if (intensity > 0.2) return 'bg-green-500'
 return 'bg-blue-500'
 }

 const getMaxValue = () => {
 if (regionActivities.length === 0) return 1
 const values = regionActivities.map(r => {
 if (selectedMetric === 'users') return r.activeUsers
 if (selectedMetric === 'transactions') return r.transactions
 return r.revenue
 })
 return Math.max(...values)
 }

 const getValue = (region: RegionActivity) => {
 if (selectedMetric === 'users') return region.activeUsers
 if (selectedMetric === 'transactions') return region.transactions
 return region.revenue
 }

 if (loading) {
 return (
 <div className="mb-8 flex items-center justify-center py-12">
 <FaSpinner className="animate-spin text-2xl text-blue-600 mr-2" />
 <span className="text-soft">Loading regional activity...</span>
 </div>
 )
 }

 if (regionActivities.length === 0) {
 return (
 <div className="mb-8">
 <h2 className="text-2xl font-bold mb-4">Cross-Region Activity Heatmap</h2>
 <div className="bg-surface rounded-xl p-8 shadow-lg text-center text-soft">
 No regional activity data available yet.
 </div>
 </div>
 )
 }

 return (
 <div className="mb-8">
 <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
 <h2 className="text-2xl font-bold">Cross-Region Activity Heatmap</h2>
 <div className="flex items-center gap-2 p-1 bg-subtle rounded-lg">
 {metrics.map(({ key, label, icon: Icon }) => (
 <button
 key={key}
 onClick={() => setSelectedMetric(key)}
 className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
 selectedMetric === key ? 'bg-surface shadow text-blue-600' : 'text-soft hover:bg-line'
 }`}
 >
 <Icon />
 {label}
 </button>
 ))}
 </div>
 </div>

 <div className="bg-surface rounded-xl p-6 shadow-lg">
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {regionActivities.map((region) => {
 const maxValue = getMaxValue()
 const value = getValue(region)
 const colorClass = getHeatmapColor(value, maxValue)

 return (
 <div key={region.code} className="border border-line rounded-xl p-4 hover:shadow-md transition-shadow">
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-2">
 <span className="text-2xl">{region.flag}</span>
 <h3 className="font-semibold text-fg">{region.region}</h3>
 </div>
 <div className={`w-4 h-4 rounded-full ${colorClass}`} title={`Activity: ${Math.round((value / maxValue) * 100)}%`} />
 </div>

 <div className="space-y-2">
 <div className="flex justify-between text-sm">
 <span className="text-soft">Active Users</span>
 <span className="font-medium">{(region.activeUsers ?? 0).toLocaleString()}</span>
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-soft">Transactions</span>
 <span className="font-medium">{(region.transactions ?? 0).toLocaleString()}</span>
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-soft">Revenue</span>
 <span className="font-medium">Rs {(region.revenue ?? 0).toLocaleString()}</span>
 </div>
 {region.growth !== 0 && (
 <div className="flex justify-between text-sm">
 <span className="text-soft">Growth</span>
 <span className={`font-medium ${region.growth > 0 ? 'text-green-600' : 'text-red-500'}`}>
 {region.growth > 0 ? '+' : ''}{region.growth}%
 </span>
 </div>
 )}

 <div className="pt-2 border-t mt-2">
 {region.peakTime && <p className="text-xs text-soft mb-1">Peak Time: {region.peakTime}</p>}
 <div className="flex flex-wrap gap-1">
 {(region.popularServices ?? []).map((service, sIdx) => (
 <span key={sIdx} className="text-xs bg-subtle px-2 py-1 rounded">
 {service}
 </span>
 ))}
 </div>
 </div>
 </div>
 </div>
 )
 })}
 </div>
 </div>
 </div>
 )
}
