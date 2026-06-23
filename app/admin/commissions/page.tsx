'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
 FaPercentage, FaInfoCircle,
 FaUserMd, FaUserNurse, FaChild, FaAmbulance, FaPills, FaFlask,
 FaDollarSign, FaArrowUp, FaArrowDown, FaSpinner
} from 'react-icons/fa'

interface ServiceRevenue {
 serviceType: string
 total: number
}

interface MetricsData {
 revenue: {
 total: number
 thisMonth: number
 lastMonth: number
 byServiceType: ServiceRevenue[]
 }
 bookings: {
 total: number
 completed: number
 }
}

const SERVICE_ICON_MAP: Record<string, React.ReactNode> = {
 doctor: <FaUserMd className="text-blue-600" />,
 nurse: <FaUserNurse className="text-purple-600" />,
 nanny: <FaChild className="text-pink-600" />,
 childcare: <FaChild className="text-pink-600" />,
 emergency: <FaAmbulance className="text-red-600" />,
 pharmacy: <FaPills className="text-green-600" />,
 lab: <FaFlask className="text-orange-600" />,
}

function getServiceIcon(serviceType: string) {
 const key = Object.keys(SERVICE_ICON_MAP).find(k =>
 serviceType.toLowerCase().includes(k)
 )
 return key ? SERVICE_ICON_MAP[key] : <FaPercentage className="text-soft" />
}

function formatServiceLabel(serviceType: string) {
 return serviceType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function CommissionManagement() {
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
 setError('Failed to load commission data')
 }
 } else {
 setError('Failed to load commission data')
 }
 } catch {
 setError('Failed to load commission data')
 } finally {
 setLoading(false)
 }
 }
 fetchMetrics()
 }, [])

 if (loading) {
 return (
 <div className="min-h-screen bg-subtle flex items-center justify-center">
 <FaSpinner className="animate-spin text-3xl text-blue-600" />
 </div>
 )
 }

 const totalRevenue = metrics?.revenue.total ?? 0
 const thisMonth = metrics?.revenue.thisMonth ?? 0
 const lastMonth = metrics?.revenue.lastMonth ?? 0
 const monthGrowth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0
 const byServiceType = metrics?.revenue.byServiceType ?? []

 return (
 <div className="min-h-screen bg-subtle">
 {/* Header */}
 <div className="bg-surface shadow-sm border-b">
 <div className="container mx-auto px-4 py-4">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-fg">Revenue &amp; Commissions</h1>
 <p className="text-soft">Platform revenue breakdown by service category</p>
 </div>
 <Link href="/admin" className="px-4 py-2 border rounded-lg hover:bg-subtle">
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

 {/* Info Box */}
 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
 <div className="flex gap-3">
 <FaInfoCircle className="text-blue-600 text-xl flex-shrink-0 mt-0.5" />
 <div>
 <h3 className="font-semibold text-blue-900">Revenue Overview</h3>
 <p className="text-sm text-blue-800 mt-1">
 This page shows actual revenue collected through wallet transactions across all service types.
 Revenue is sourced from completed debit transactions.
 </p>
 </div>
 </div>
 </div>

 {/* Summary Cards */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
 <div className="bg-surface rounded-xl p-6 shadow">
 <div className="flex items-center justify-between mb-2">
 <span className="text-soft text-sm">Total Revenue (All Time)</span>
 <FaDollarSign className="text-green-600" />
 </div>
 <p className="text-2xl font-bold text-fg">Rs {totalRevenue.toLocaleString()}</p>
 </div>
 <div className="bg-surface rounded-xl p-6 shadow">
 <div className="flex items-center justify-between mb-2">
 <span className="text-soft text-sm">This Month</span>
 <FaDollarSign className="text-blue-600" />
 </div>
 <p className="text-2xl font-bold text-fg">Rs {thisMonth.toLocaleString()}</p>
 <p className={`text-sm flex items-center gap-1 mt-2 ${monthGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
 {monthGrowth >= 0 ? <FaArrowUp /> : <FaArrowDown />}
 {Math.abs(monthGrowth).toFixed(1)}% vs last month
 </p>
 </div>
 <div className="bg-surface rounded-xl p-6 shadow">
 <div className="flex items-center justify-between mb-2">
 <span className="text-soft text-sm">Last Month</span>
 <FaDollarSign className="text-purple-600" />
 </div>
 <p className="text-2xl font-bold text-fg">Rs {lastMonth.toLocaleString()}</p>
 </div>
 </div>

 {/* Revenue by Service Type */}
 <div className="bg-surface rounded-xl p-6 shadow mb-6">
 <h2 className="text-xl font-bold text-fg mb-6">Revenue by Service Type</h2>
 {byServiceType.length === 0 ? (
 <div className="text-center py-12 text-soft">
 <FaDollarSign className="text-4xl mx-auto mb-3 text-faint" />
 <p className="text-lg font-medium">No revenue data yet</p>
 <p className="text-sm mt-1">Revenue from completed transactions will appear here</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
 {byServiceType.map(row => {
 const percentage = totalRevenue > 0 ? (row.total / totalRevenue) * 100 : 0
 return (
 <div key={row.serviceType} className="border rounded-xl p-5 bg-surface hover:shadow-md transition">
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-3">
 <span className="text-2xl">{getServiceIcon(row.serviceType)}</span>
 <h3 className="font-semibold text-fg">
 {formatServiceLabel(row.serviceType)}
 </h3>
 </div>
 <span className="text-xl font-bold text-fg">
 Rs {row.total.toLocaleString()}
 </span>
 </div>
 <div className="w-full bg-line rounded-full h-2">
 <div
 className="bg-blue-600 h-2 rounded-full"
 style={{ width: `${Math.min(percentage, 100)}%` }}
 />
 </div>
 <p className="text-xs text-soft mt-2 text-right">
 {percentage.toFixed(1)}% of total revenue
 </p>
 </div>
 )
 })}
 </div>
 )}
 </div>

 {/* Booking Completion Summary */}
 {metrics && (
 <div className="bg-surface rounded-xl p-6 shadow">
 <h2 className="text-xl font-bold text-fg mb-4">Booking Completion Summary</h2>
 <div className="grid grid-cols-2 gap-6">
 <div className="text-center p-4 bg-subtle rounded-lg">
 <p className="text-3xl font-bold text-fg">{metrics.bookings.total.toLocaleString()}</p>
 <p className="text-sm text-soft mt-1">Total Bookings</p>
 </div>
 <div className="text-center p-4 bg-green-50 rounded-lg">
 <p className="text-3xl font-bold text-green-600">{metrics.bookings.completed.toLocaleString()}</p>
 <p className="text-sm text-soft mt-1">Completed (Revenue-Generating)</p>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 )
}
