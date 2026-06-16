'use client'

import { useState, useEffect } from 'react'
import {
 FaShieldAlt, FaSpinner, FaSignInAlt, FaExclamationTriangle,
 FaLock, FaCheckCircle, FaTimesCircle, FaClock
} from 'react-icons/fa'
import { useUser } from '@/hooks/useUser'

interface LoginAttempt {
 id: string
 email: string
 success: boolean
 ipAddress: string
 timestamp: string
 userAgent: string
}

export default function AdminSecurityPage() {
 const { user: currentUser } = useUser()
 const userId = currentUser?.id ?? ''
 const [loading, setLoading] = useState(true)
 const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([])
 const [securitySettings, setSecuritySettings] = useState({
 twoFactorRequired: false,
 sessionTimeout: 30,
 maxLoginAttempts: 5,
 passwordMinLength: 8,
 })

 useEffect(() => {
 if (!userId) return

 const fetchSecurityData = async () => {
 try {
 // Fetch recent login attempts from API (placeholder - no endpoint yet)
 // When a security audit API is implemented, replace this with a real fetch
 setLoginAttempts([])
 } catch (error) {
 console.error('Failed to fetch security data:', error)
 } finally {
 setLoading(false)
 }
 }

 fetchSecurityData()
 }, [userId])

 const failedLogins = loginAttempts.filter((a) => !a.success)
 const suspiciousActivity = loginAttempts.filter(
 (a) => !a.success && a.ipAddress.startsWith('203.')
 )

 return (
 <div className="p-6 max-w-7xl mx-auto">
 {/* Header */}
 <div className="mb-8">
 <div className="flex items-center gap-3 mb-2">
 <FaShieldAlt className="text-2xl text-red-600" />
 <h1 className="text-2xl font-bold text-[#001E40]">Security</h1>
 </div>
 <p className="text-gray-600">Monitor login activity and configure security settings</p>
 </div>

 {loading ? (
 <div className="flex justify-center items-center py-20">
 <FaSpinner className="animate-spin text-3xl text-blue-500" />
 </div>
 ) : (
 <>
 {/* Security Overview Cards */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
 <div className="bg-white rounded-xl p-6 shadow-lg">
 <div className="flex items-center gap-3 mb-3">
 <div className="p-2 rounded-lg bg-blue-50">
 <FaSignInAlt className="text-blue-600" />
 </div>
 <h3 className="font-semibold text-gray-900">Recent Logins</h3>
 </div>
 <p className="text-3xl font-bold text-gray-900">{loginAttempts.length}</p>
 <p className="text-sm text-gray-500 mt-1">In the last 24 hours</p>
 </div>

 <div className="bg-white rounded-xl p-6 shadow-lg">
 <div className="flex items-center gap-3 mb-3">
 <div className="p-2 rounded-lg bg-red-50">
 <FaTimesCircle className="text-red-600" />
 </div>
 <h3 className="font-semibold text-gray-900">Failed Logins</h3>
 </div>
 <p className="text-3xl font-bold text-red-600">{failedLogins.length}</p>
 <p className="text-sm text-gray-500 mt-1">Unsuccessful attempts</p>
 </div>

 <div className="bg-white rounded-xl p-6 shadow-lg">
 <div className="flex items-center gap-3 mb-3">
 <div className="p-2 rounded-lg bg-yellow-50">
 <FaExclamationTriangle className="text-yellow-600" />
 </div>
 <h3 className="font-semibold text-gray-900">Suspicious Activity</h3>
 </div>
 <p className="text-3xl font-bold text-yellow-600">{suspiciousActivity.length}</p>
 <p className="text-sm text-gray-500 mt-1">Flagged events</p>
 </div>
 </div>

 {/* Recent Login Attempts */}
 <div className="bg-white rounded-xl shadow-lg mb-8">
 <div className="p-6 border-b">
 <h2 className="text-xl font-bold text-gray-900">Recent Login Attempts</h2>
 </div>
 {loginAttempts.length === 0 ? (
 <div className="text-center py-12">
 <FaSignInAlt className="text-4xl text-gray-300 mx-auto mb-3" />
 <p className="text-gray-500">No recent login attempts</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-gray-50">
 <tr>
 <th className="px-6 py-3 text-left font-medium text-gray-700">Status</th>
 <th className="px-6 py-3 text-left font-medium text-gray-700">Email</th>
 <th className="px-6 py-3 text-left font-medium text-gray-700">IP Address</th>
 <th className="px-6 py-3 text-left font-medium text-gray-700">Browser</th>
 <th className="px-6 py-3 text-left font-medium text-gray-700">Time</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {loginAttempts.map((attempt) => (
 <tr key={attempt.id} className="hover:bg-gray-50">
 <td className="px-6 py-4">
 {attempt.success ? (
 <span className="flex items-center gap-1 text-green-600">
 <FaCheckCircle /> Success
 </span>
 ) : (
 <span className="flex items-center gap-1 text-red-600">
 <FaTimesCircle /> Failed
 </span>
 )}
 </td>
 <td className="px-6 py-4 text-gray-900">{attempt.email}</td>
 <td className="px-6 py-4 text-gray-600 font-mono text-xs">{attempt.ipAddress}</td>
 <td className="px-6 py-4 text-gray-600">{attempt.userAgent}</td>
 <td className="px-6 py-4 text-gray-500">
 <div className="flex items-center gap-1">
 <FaClock className="text-xs" />
 {new Date(attempt.timestamp).toLocaleString()}
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>

 {/* Security Settings */}
 <div className="bg-white rounded-xl p-6 shadow-lg">
 <div className="flex items-center gap-3 mb-6">
 <FaLock className="text-xl text-gray-700" />
 <h2 className="text-xl font-bold text-gray-900">Security Settings</h2>
 </div>

 <div className="space-y-6">
 <div className="flex items-center justify-between py-3 border-b border-gray-100">
 <div>
 <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
 <p className="text-sm text-gray-500">Require 2FA for all admin accounts</p>
 </div>
 <button
 onClick={() =>
 setSecuritySettings((prev) => ({
 ...prev,
 twoFactorRequired: !prev.twoFactorRequired,
 }))
 }
 className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
 securitySettings.twoFactorRequired ? 'bg-blue-600' : 'bg-gray-300'
 }`}
 >
 <span
 className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
 securitySettings.twoFactorRequired ? 'translate-x-6' : 'translate-x-1'
 }`}
 />
 </button>
 </div>

 <div className="flex items-center justify-between py-3 border-b border-gray-100">
 <div>
 <h3 className="font-medium text-gray-900">Session Timeout</h3>
 <p className="text-sm text-gray-500">Auto-logout after inactivity (minutes)</p>
 </div>
 <select
 value={securitySettings.sessionTimeout}
 onChange={(e) =>
 setSecuritySettings((prev) => ({
 ...prev,
 sessionTimeout: Number(e.target.value),
 }))
 }
 className="px-3 py-2 border rounded-lg text-sm"
 >
 <option value={15}>15 min</option>
 <option value={30}>30 min</option>
 <option value={60}>1 hour</option>
 <option value={120}>2 hours</option>
 </select>
 </div>

 <div className="flex items-center justify-between py-3 border-b border-gray-100">
 <div>
 <h3 className="font-medium text-gray-900">Max Login Attempts</h3>
 <p className="text-sm text-gray-500">Lock account after failed attempts</p>
 </div>
 <select
 value={securitySettings.maxLoginAttempts}
 onChange={(e) =>
 setSecuritySettings((prev) => ({
 ...prev,
 maxLoginAttempts: Number(e.target.value),
 }))
 }
 className="px-3 py-2 border rounded-lg text-sm"
 >
 <option value={3}>3 attempts</option>
 <option value={5}>5 attempts</option>
 <option value={10}>10 attempts</option>
 </select>
 </div>

 <div className="flex items-center justify-between py-3">
 <div>
 <h3 className="font-medium text-gray-900">Minimum Password Length</h3>
 <p className="text-sm text-gray-500">Enforce minimum password complexity</p>
 </div>
 <select
 value={securitySettings.passwordMinLength}
 onChange={(e) =>
 setSecuritySettings((prev) => ({
 ...prev,
 passwordMinLength: Number(e.target.value),
 }))
 }
 className="px-3 py-2 border rounded-lg text-sm"
 >
 <option value={6}>6 characters</option>
 <option value={8}>8 characters</option>
 <option value={12}>12 characters</option>
 <option value={16}>16 characters</option>
 </select>
 </div>
 </div>
 </div>
 </>
 )}
 </div>
 )
}
