'use client'

import { useState, useEffect } from 'react'
import { FaBuilding, FaSpinner, FaSave, FaCheck, FaTimes } from 'react-icons/fa'
import { useUser } from '@/hooks/useUser'

interface CompanyProfile {
 companyName: string
 industry: string
 registrationNumber: string
 employeeCount: number
}

export default function CorporateCompanyPage() {
 const [profile, setProfile] = useState<CompanyProfile>({
 companyName: '',
 industry: '',
 registrationNumber: '',
 employeeCount: 0,
 })
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)
 const [saving, setSaving] = useState(false)
 const [saved, setSaved] = useState(false)
 const { user: currentUser } = useUser()
 const userId = currentUser?.id ?? ''

 useEffect(() => {
 if (!userId) return

 const fetchProfile = async () => {
 try {
 const res = await fetch(`/api/corporate/${userId}/dashboard`, { credentials: 'include' })
 if (res.ok) {
 const json = await res.json()
 if (json.success) {
 // Backend returns { company: {...}, stats: { employeeCount, ... } }
 const company = json.data.company || {}
 const stats = json.data.stats || {}
 setProfile({
 companyName: company.companyName || stats.companyName || '',
 industry: company.industry || stats.industry || '',
 registrationNumber: company.registrationNumber || stats.registrationNumber || '',
 employeeCount: stats.employeeCount ?? stats.totalEmployees ?? 0,
 })
 }
 }
 } catch (err) {
 console.error('Failed to fetch company profile:', err)
 setError(err instanceof Error ? err.message : 'Failed to load company profile')
 } finally {
 setLoading(false)
 }
 }

 fetchProfile()
 }, [userId])

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-[400px]">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
 </div>
 )
 }

 return (
 <div className="space-y-6">
 {error && (
 <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
 <span>{error}</span>
 <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
 <FaTimes />
 </button>
 </div>
 )}

 <div className="flex items-center justify-between">
 <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
 <FaBuilding className="text-indigo-500" /> Company Profile
 </h1>
 <button
 onClick={async () => {
 if (!userId || saving) return
 setSaving(true)
 setSaved(false)
 try {
 const res = await fetch(`/api/users/${userId}`, {
 method: 'PATCH',
 credentials: 'include',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 profileData: {
 companyName: profile.companyName,
 registrationNumber: profile.registrationNumber,
 employeeCount: profile.employeeCount,
 },
 }),
 })
 if (res.ok) setSaved(true)
 } catch (err) {
 setError(err instanceof Error ? err.message : 'Failed to save changes')
 } finally {
 setSaving(false)
 }
 }}
 disabled={saving}
 className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
 >
 {saving ? <FaSpinner className="animate-spin" /> : saved ? <FaCheck /> : <FaSave />}
 {saving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
 </button>
 </div>

 <div className="bg-surface rounded-xl p-6 shadow-lg">
 <div className="grid md:grid-cols-2 gap-6">
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Company Name</label>
 <input
 type="text"
 value={profile.companyName}
 onChange={(e) => setProfile(prev => ({ ...prev, companyName: e.target.value }))}
 className="w-full px-3 py-2 border rounded-lg"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Industry</label>
 <input
 type="text"
 value={profile.industry}
 onChange={(e) => setProfile(prev => ({ ...prev, industry: e.target.value }))}
 className="w-full px-3 py-2 border rounded-lg"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Registration Number</label>
 <input
 type="text"
 value={profile.registrationNumber}
 onChange={(e) => setProfile(prev => ({ ...prev, registrationNumber: e.target.value }))}
 className="w-full px-3 py-2 border rounded-lg"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Employee Count</label>
 <input
 type="number"
 value={profile.employeeCount}
 onChange={(e) => setProfile(prev => ({ ...prev, employeeCount: parseInt(e.target.value) || 0 }))}
 className="w-full px-3 py-2 border rounded-lg"
 />
 </div>
 </div>
 </div>
 </div>
 )
}
