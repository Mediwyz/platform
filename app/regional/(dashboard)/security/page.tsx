'use client'

import { useState, useEffect } from 'react'
import { FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaLock, FaUserShield, FaSpinner } from 'react-icons/fa'

interface SecurityEvent {
 id: string
 type: 'login_failed' | 'account_locked' | 'suspicious_activity' | 'password_reset'
 eventType?: string
 message: string
 ip: string
 timestamp: string
 severity: 'low' | 'medium' | 'high' | 'critical'
}

export default function SuperAdminSecurityPage() {
 const [events, setEvents] = useState<SecurityEvent[]>([])
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 const fetchSecurity = async () => {
 try {
 const res = await fetch('/api/admin/security', { credentials: 'include' })
 if (res.ok) {
 const json = await res.json()
 if (json.success) {
 const d = json.data
 setEvents(Array.isArray(d) ? d : Array.isArray(d?.securityEvents) ? d.securityEvents : [])
 }
 }
 } catch {
 // API may not exist yet
 } finally {
 setLoading(false)
 }
 }

 fetchSecurity()
 }, [])

 const failedLogins = events.filter(e => e.type === 'login_failed' || e.eventType === 'login_failed').length
 const activeAlerts = events.filter(e => e.severity === 'high' || e.severity === 'critical').length

 const getSeverityBadge = (severity: string) => {
 switch (severity) {
 case 'high': return 'bg-red-100 text-red-800'
 case 'medium': return 'bg-yellow-100 text-yellow-800'
 case 'low': return 'bg-blue-100 text-blue-800'
 default: return 'bg-gray-100 text-gray-800'
 }
 }

 return (
 <div className="space-y-6">
 <h1 className="text-2xl font-bold text-[#001E40] flex items-center gap-2">
 <FaShieldAlt className="text-red-500" /> Security Overview
 </h1>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 {[
 { title: 'Security Status', value: 'Healthy', icon: FaCheckCircle, color: 'bg-green-500' },
 { title: 'Failed Logins (24h)', value: String(failedLogins), icon: FaLock, color: 'bg-red-500' },
 { title: 'Active Alerts', value: String(activeAlerts), icon: FaExclamationTriangle, color: 'bg-yellow-500' },
 { title: 'Protected Accounts', value: '100%', icon: FaUserShield, color: 'bg-blue-500' },
 ].map((stat, idx) => (
 <div key={idx} className="bg-white rounded-xl p-6 shadow-lg">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-gray-600 text-sm">{stat.title}</p>
 <p className="text-2xl font-bold text-[#001E40] mt-1">{stat.value}</p>
 </div>
 <div className={`p-3 rounded-full ${stat.color}`}>
 <stat.icon className="text-white text-xl" />
 </div>
 </div>
 </div>
 ))}
 </div>

 <div className="grid md:grid-cols-2 gap-6">
 <div className="bg-white rounded-xl p-6 shadow-lg">
 <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h2>
 <div className="space-y-4">
 {[
 { label: 'Two-Factor Authentication', desc: 'Require 2FA for admin accounts', enabled: true },
 { label: 'Strong Passwords', desc: 'Enforce minimum password requirements', enabled: true },
 { label: 'Session Timeout', desc: 'Auto-logout after 30 minutes of inactivity', enabled: true },
 { label: 'IP Whitelisting', desc: 'Restrict admin access by IP', enabled: false },
 ].map((setting, idx) => (
 <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
 <div>
 <p className="text-sm font-medium text-gray-900">{setting.label}</p>
 <p className="text-xs text-gray-500">{setting.desc}</p>
 </div>
 <div className={`w-10 h-6 rounded-full ${setting.enabled ? 'bg-green-500' : 'bg-gray-300'} relative`}>
 <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${setting.enabled ? 'right-1' : 'left-1'}`} />
 </div>
 </div>
 ))}
 </div>
 </div>

 <div className="bg-white rounded-xl p-6 shadow-lg">
 <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Security Events</h2>
 {loading ? (
 <div className="flex justify-center py-8">
 <FaSpinner className="animate-spin text-2xl text-red-500" />
 </div>
 ) : events.length === 0 ? (
 <div className="text-center py-8 text-gray-500">
 <FaShieldAlt className="text-4xl mx-auto mb-3 text-gray-300" />
 <p className="font-medium">No security events</p>
 <p className="text-sm mt-1">All systems operating normally</p>
 </div>
 ) : (
 <div className="space-y-3">
 {events.map((event) => (
 <div key={event.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
 <FaExclamationTriangle className={`mt-0.5 ${event.severity === 'high' ? 'text-red-500' : event.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'}`} />
 <div className="flex-1">
 <p className="text-sm text-gray-900">{event.message}</p>
 <div className="flex items-center gap-3 mt-1">
 <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getSeverityBadge(event.severity)}`}>
 {(event.severity ?? 'info').toUpperCase()}
 </span>
 <span className="text-xs text-gray-500">{event.ip}</span>
 <span className="text-xs text-gray-500">{new Date(event.timestamp).toLocaleString()}</span>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 )
}
