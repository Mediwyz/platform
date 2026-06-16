'use client'

import { useState, useEffect } from 'react'
import { FaToggleOn, FaToggleOff, FaSave, FaSpinner } from 'react-icons/fa'

const ALL_FEATURES = [
 'feed', 'overview', 'profile', 'consultations', 'bookings',
 'prescriptions', 'health-records', 'ai-assistant', 'nurse-services',
 'childcare', 'emergency', 'lab-results', 'insurance', 'billing',
 'video', 'chat', 'messages', 'reviews', 'booking-requests',
 'patients', 'appointments', 'posts', 'schedule', 'analytics',
 'accounts', 'users', 'content', 'security', 'system',
 'inventory', 'orders', 'test-requests', 'results', 'dispatch',
 'active-calls', 'plans', 'claims', 'clients', 'employees',
 'company', 'referrals', 'earnings', 'regional-admins',
 'role-config', 'required-documents',
]

export default function RoleConfigPage() {
 const [userTypes, setUserTypes] = useState<string[]>([])
 const [configs, setConfigs] = useState<Record<string, Record<string, boolean>>>({})
 const [loading, setLoading] = useState(true)
 const [saving, setSaving] = useState(false)
 const [message, setMessage] = useState('')

 useEffect(() => {
 Promise.all([
  fetch('/api/roles?all=true').then(r => r.json()),
  fetch('/api/admin/role-config', { credentials: 'include' }).then(r => r.json()),
 ])
  .then(([rolesJson, configJson]) => {
   if (rolesJson.success && Array.isArray(rolesJson.data)) {
    const roleCodes = rolesJson.data.map((r: { code: string }) => r.code)
    const allTypes = [...new Set(['MEMBER', ...roleCodes, 'CORPORATE_ADMIN'])]
    setUserTypes(allTypes)
   }
   if (configJson.success) setConfigs(configJson.data)
  })
  .catch(() => {})
  .finally(() => setLoading(false))
 }, [])

 const toggleFeature = (userType: string, feature: string) => {
 setConfigs(prev => ({
 ...prev,
 [userType]: {
 ...prev[userType],
 [feature]: !(prev[userType]?.[feature] ?? true),
 },
 }))
 }

 const isEnabled = (userType: string, feature: string) => {
 return configs[userType]?.[feature] ?? true
 }

 const handleSave = async () => {
 setSaving(true)
 setMessage('')
 try {
 const configArray: { userType: string; featureKey: string; enabled: boolean }[] = []
 for (const userType of userTypes) {
 if (!configs[userType]) continue
 for (const [featureKey, enabled] of Object.entries(configs[userType])) {
 configArray.push({ userType, featureKey, enabled })
 }
 }

 const res = await fetch('/api/admin/role-config', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ configs: configArray }),
 credentials: 'include',
 })

 if (res.ok) {
 setMessage('Configuration saved successfully')
 } else {
 setMessage('Failed to save configuration')
 }
 } catch {
 setMessage('Error saving configuration')
 } finally {
 setSaving(false)
 }
 }

 if (loading) {
 return (
 <div className="flex items-center justify-center h-64">
 <FaSpinner className="animate-spin text-4xl text-blue-500" />
 </div>
 )
 }

 return (
 <div className="p-6 max-w-full">
 <div className="flex items-center justify-between mb-6">
 <div>
 <h1 className="text-2xl font-bold text-[#001E40]">Role Feature Configuration</h1>
 <p className="text-gray-600 mt-1">Toggle which features are visible for each user role</p>
 </div>
 <button
 onClick={handleSave}
 disabled={saving}
 className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
 >
 {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
 Save Changes
 </button>
 </div>

 {message && (
 <div className={`p-3 rounded-lg mb-4 ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
 {message}
 </div>
 )}

 <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
 <table className="min-w-full">
 <thead>
 <tr className="bg-gray-50 border-b">
 <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10">Feature</th>
 {userTypes.map(ut => (
 <th key={ut} className="px-3 py-3 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">
 {ut.replace('_', ' ')}
 </th>
 ))}
 </tr>
 </thead>
 <tbody>
 {ALL_FEATURES.map(feature => (
 <tr key={feature} className="border-b hover:bg-gray-50 transition-colors">
 <td className="px-4 py-2 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
 {feature}
 </td>
 {userTypes.map(ut => {
 const enabled = isEnabled(ut, feature)
 return (
 <td key={ut} className="px-3 py-2 text-center">
 <button
 onClick={() => toggleFeature(ut, feature)}
 className="text-2xl transition-colors"
 title={`${enabled ? 'Disable' : 'Enable'} ${feature} for ${ut}`}
 >
 {enabled ? (
 <FaToggleOn className="text-green-500 hover:text-green-600" />
 ) : (
 <FaToggleOff className="text-gray-300 hover:text-gray-400" />
 )}
 </button>
 </td>
 )
 })}
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )
}
