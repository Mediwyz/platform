'use client'

import { useState, useEffect } from 'react'
import { FaSearch, FaFilter, FaSpinner } from 'react-icons/fa'

interface LogEntry {
 id: string
 timestamp: string
 level: 'info' | 'warning' | 'error'
 action: string
 user: string
 details: string
}

interface SecurityEvent {
 type: string
 message: string
 timestamp: string
}

interface RecentUser {
 id: string
 firstName: string
 lastName: string
 email: string
 userType: string
 accountStatus: string
 createdAt: string
}

interface SecurityData {
 suspendedAccounts: number
 pendingAccounts: number
 totalUsers: number
 recentRegistrations: RecentUser[]
 securityEvents: SecurityEvent[]
}

function mapSecurityDataToLogs(data: SecurityData): LogEntry[] {
 const logs: LogEntry[] = []

 // Add security event entries
 data.securityEvents.forEach((ev, idx) => {
 logs.push({
 id: `sec-${idx}`,
 timestamp: ev.timestamp,
 level: ev.type === 'error' ? 'error' : ev.type === 'warning' ? 'warning' : 'info',
 action: 'Security Event',
 user: 'System',
 details: ev.message,
 })
 })

 // Add recent registration entries
 data.recentRegistrations.forEach(user => {
 logs.push({
 id: `reg-${user.id}`,
 timestamp: user.createdAt,
 level: user.accountStatus === 'suspended' ? 'warning' : 'info',
 action: 'User Registered',
 user: `${user.firstName} ${user.lastName} (${user.email})`,
 details: `User type: ${user.userType.replace(/_/g, ' ')} - Status: ${user.accountStatus}`,
 })
 })

 // Sort by timestamp descending
 logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

 return logs
}

export default function AdminLogsPage() {
 const [logs, setLogs] = useState<LogEntry[]>([])
 const [loading, setLoading] = useState(true)
 const [filter, setFilter] = useState<string>('all')
 const [search, setSearch] = useState('')

 useEffect(() => {
 const fetchLogs = async () => {
 try {
 const res = await fetch('/api/admin/security', { credentials: 'include' })
 if (res.ok) {
 const json = await res.json()
 if (json.success && json.data) {
 setLogs(mapSecurityDataToLogs(json.data as SecurityData))
 }
 }
 } catch {
 // API unavailable - show empty state
 } finally {
 setLoading(false)
 }
 }

 fetchLogs()
 }, [])

 const filteredLogs = logs.filter(log => {
 if (filter !== 'all' && log.level !== filter) return false
 if (search &&
 !log.action.toLowerCase().includes(search.toLowerCase()) &&
 !log.user.toLowerCase().includes(search.toLowerCase())) return false
 return true
 })

 const getLevelBadge = (level: string) => {
 switch (level) {
 case 'info': return 'bg-blue-100 text-blue-800'
 case 'warning': return 'bg-yellow-100 text-yellow-800'
 case 'error': return 'bg-red-100 text-red-800'
 default: return 'bg-gray-100 text-gray-800'
 }
 }

 return (
 <div className="space-y-6">
 <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>

 <div className="flex flex-col md:flex-row gap-4">
 <div className="flex-1 relative">
 <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
 <input
 type="text"
 placeholder="Search logs..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="w-full pl-10 pr-4 py-2 border rounded-lg"
 />
 </div>
 <div className="flex items-center gap-2">
 <FaFilter className="text-gray-400" />
 <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-2 border rounded-lg">
 <option value="all">All Levels</option>
 <option value="info">Info</option>
 <option value="warning">Warning</option>
 <option value="error">Error</option>
 </select>
 </div>
 </div>

 <div className="bg-white rounded-xl shadow-lg overflow-hidden">
 {loading ? (
 <div className="flex justify-center py-12">
 <FaSpinner className="animate-spin text-2xl text-blue-500" />
 </div>
 ) : filteredLogs.length === 0 ? (
 <div className="text-center py-12 text-gray-500">
 <p className="text-lg font-medium">No activity logs found</p>
 <p className="text-sm mt-1">Activity logs will appear here as users interact with the platform</p>
 </div>
 ) : (
 <table className="w-full text-sm">
 <thead className="bg-gray-50">
 <tr>
 <th className="p-3 text-left font-medium text-gray-700">Timestamp</th>
 <th className="p-3 text-left font-medium text-gray-700">Level</th>
 <th className="p-3 text-left font-medium text-gray-700">Action</th>
 <th className="p-3 text-left font-medium text-gray-700">User</th>
 <th className="p-3 text-left font-medium text-gray-700">Details</th>
 </tr>
 </thead>
 <tbody>
 {filteredLogs.map((log) => (
 <tr key={log.id} className="border-b hover:bg-gray-50">
 <td className="p-3 text-gray-600 text-xs font-mono">
 {new Date(log.timestamp).toLocaleString()}
 </td>
 <td className="p-3">
 <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getLevelBadge(log.level)}`}>
 {(log.level ?? 'info').toUpperCase()}
 </span>
 </td>
 <td className="p-3 font-medium text-gray-900">{log.action}</td>
 <td className="p-3 text-gray-600">{log.user}</td>
 <td className="p-3 text-gray-500 text-xs max-w-xs truncate">{log.details}</td>
 </tr>
 ))}
 </tbody>
 </table>
 )}
 </div>
 </div>
 )
}
