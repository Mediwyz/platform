'use client'

import { useState, useEffect } from 'react'
import { FaServer, FaDatabase, FaNetworkWired, FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaSpinner } from 'react-icons/fa'

interface HealthService {
 service: string
 status: 'healthy' | 'warning' | 'critical'
 uptime: number
 responseTime: number
 errorRate: number
 lastCheck: string
}

interface PerformanceMetrics {
 cpuUsage: number
 memoryUsage: number
 storageUsage: number
}

const SERVICE_ICONS: Record<string, React.ElementType> = {
 'API Gateway': FaNetworkWired,
 'Database Cluster': FaDatabase,
 'Application Servers': FaServer,
 'Security Services': FaShieldAlt,
}

export default function PlatformHealth() {
 const [healthMetrics, setHealthMetrics] = useState<HealthService[]>([])
 const [performance, setPerformance] = useState<PerformanceMetrics | null>(null)
 const [overallHealth, setOverallHealth] = useState<'healthy' | 'warning' | 'critical'>('healthy')
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 const fetchHealth = async () => {
 try {
 const res = await fetch('/api/admin/system-health', { credentials: 'include' })
 if (res.ok) {
 const json = await res.json()
 if (json.success && Array.isArray(json.data?.services)) {
 setHealthMetrics(json.data.services.map((s: any) => ({
  service: s.service ?? s.name ?? 'Unknown',
  status: s.status ?? 'healthy',
  uptime: s.uptime ?? 99.9,
  responseTime: s.responseTime ?? s.latency ?? 0,
  errorRate: s.errorRate ?? 0,
  lastCheck: s.lastCheck ?? new Date().toLocaleTimeString(),
 })))
 setPerformance(json.data.performance ?? null)
 setOverallHealth(json.data.overallHealth ?? 'healthy')
 }
 }
 } catch {
 // Keep defaults on error
 } finally {
 setLoading(false)
 }
 }

 fetchHealth()
 const interval = setInterval(fetchHealth, 30000)
 return () => clearInterval(interval)
 }, [])

 const getStatusColor = (status: string) => {
 switch (status) {
 case 'healthy': return 'text-green-500 bg-green-50'
 case 'warning': return 'text-yellow-500 bg-yellow-50'
 case 'critical': return 'text-red-500 bg-red-50'
 default: return 'text-gray-500 bg-gray-50'
 }
 }

 const getStatusBorder = (status: string) => {
 switch (status) {
 case 'healthy': return 'border-green-200'
 case 'warning': return 'border-yellow-200'
 case 'critical': return 'border-red-200'
 default: return 'border-gray-200'
 }
 }

 const getBarColor = (value: number) => {
 if (value > 80) return 'bg-red-500'
 if (value > 60) return 'bg-yellow-500'
 return 'bg-green-500'
 }

 if (loading) {
 return (
 <div className="mb-8 flex items-center justify-center py-12">
 <FaSpinner className="animate-spin text-2xl text-blue-600 mr-2" />
 <span className="text-gray-500">Loading platform health...</span>
 </div>
 )
 }

 return (
 <div className="mb-8">
 <div className="flex items-center justify-between mb-6">
 <h2 className="text-2xl font-bold">Platform Health Status</h2>
 <div className={`px-4 py-2 rounded-lg flex items-center gap-2 ${getStatusColor(overallHealth)}`}>
 {overallHealth === 'healthy' ? <FaCheckCircle /> : <FaExclamationTriangle />}
 <span className="font-semibold capitalize">{overallHealth}</span>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 {healthMetrics.map((metric, idx) => {
 const Icon = SERVICE_ICONS[metric.service] || FaServer
 return (
 <div key={idx} className={`bg-white rounded-xl p-6 shadow-lg border-2 ${getStatusBorder(metric.status)}`}>
 <div className="flex items-center justify-between mb-4">
 <div className={`p-3 rounded-lg ${getStatusColor(metric.status)}`}>
 <Icon className="text-2xl" />
 </div>
 <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(metric.status)}`}>
 {(metric.status ?? 'unknown').toUpperCase()}
 </span>
 </div>

 <h3 className="font-semibold text-gray-900 mb-3">{metric.service}</h3>

 <div className="space-y-2">
 <div className="flex justify-between text-sm">
 <span className="text-gray-500">Uptime</span>
 <span className="font-medium text-gray-700">{metric.uptime}%</span>
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-gray-500">Response Time</span>
 <span className="font-medium text-gray-700">{metric.responseTime}ms</span>
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-gray-500">Error Rate</span>
 <span className="font-medium text-gray-700">{metric.errorRate}%</span>
 </div>
 <div className="pt-2 border-t">
 <span className="text-xs text-gray-400">Last checked: {metric.lastCheck}</span>
 </div>
 </div>
 </div>
 )
 })}
 </div>

 {/* System Performance Metrics */}
 {performance && (
 <div className="bg-white rounded-xl p-6 shadow-lg mt-6">
 <h3 className="text-lg font-semibold mb-4">System Performance Metrics</h3>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div>
 <div className="flex items-center justify-between mb-2">
 <span className="text-sm text-gray-600">CPU Usage</span>
 <span className="text-sm font-medium">{performance.cpuUsage}%</span>
 </div>
 <div className="w-full bg-gray-200 rounded-full h-2">
 <div className={`${getBarColor(performance.cpuUsage)} h-2 rounded-full`} style={{ width: `${performance.cpuUsage}%` }} />
 </div>
 </div>
 <div>
 <div className="flex items-center justify-between mb-2">
 <span className="text-sm text-gray-600">Memory Usage</span>
 <span className="text-sm font-medium">{performance.memoryUsage}%</span>
 </div>
 <div className="w-full bg-gray-200 rounded-full h-2">
 <div className={`${getBarColor(performance.memoryUsage)} h-2 rounded-full`} style={{ width: `${performance.memoryUsage}%` }} />
 </div>
 </div>
 <div>
 <div className="flex items-center justify-between mb-2">
 <span className="text-sm text-gray-600">Storage Usage</span>
 <span className="text-sm font-medium">{performance.storageUsage}%</span>
 </div>
 <div className="w-full bg-gray-200 rounded-full h-2">
 <div className={`${getBarColor(performance.storageUsage)} h-2 rounded-full`} style={{ width: `${performance.storageUsage}%` }} />
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 )
}
