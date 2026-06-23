'use client'

import { useState, useCallback } from 'react'
import { FaLock, FaSave, FaShieldAlt, FaToggleOn, FaToggleOff, FaKey, FaSpinner } from 'react-icons/fa'
import { useUser } from '@/hooks/useUser'

const SecuritySettingsTab: React.FC = () => {
 const [currentPassword, setCurrentPassword] = useState('')
 const [newPassword, setNewPassword] = useState('')
 const [confirmPassword, setConfirmPassword] = useState('')
 const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
 const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
 const [isSubmitting, setIsSubmitting] = useState(false)
 const { user } = useUser()
 const userId = user?.id ?? null

 const handlePasswordChange = useCallback(async (e: React.FormEvent) => {
 e.preventDefault()
 setMessage(null)

 if (newPassword !== confirmPassword) {
 setMessage({ type: 'error', text: 'New passwords do not match' })
 return
 }
 if (newPassword.length < 8) {
 setMessage({ type: 'error', text: 'Password must be at least 8 characters' })
 return
 }

 if (!userId) {
 setMessage({ type: 'error', text: 'User session not found. Please log in again.' })
 return
 }

 setIsSubmitting(true)

 try {
 const res = await fetch(`/api/users/${userId}/password`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ currentPassword, newPassword }),
 credentials: 'include',
 })

 const data = await res.json()

 if (!res.ok) {
 setMessage({ type: 'error', text: data.message || 'Failed to update password' })
 return
 }

 setMessage({ type: 'success', text: data.message || 'Password updated successfully' })
 setCurrentPassword('')
 setNewPassword('')
 setConfirmPassword('')
 } catch {
 setMessage({ type: 'error', text: 'Network error. Please try again.' })
 } finally {
 setIsSubmitting(false)
 }
 }, [userId, currentPassword, newPassword, confirmPassword])

 return (
 <div className="space-y-8">
 <div>
 <h2 className="text-xl font-bold text-fg mb-6 flex items-center gap-2">
 <FaLock className="text-blue-600" /> Password Settings
 </h2>
 {message && (
 <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
 {message.text}
 </div>
 )}
 <form onSubmit={handlePasswordChange} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Current Password</label>
 <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-4 py-2.5 border border-line rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500" required disabled={isSubmitting} />
 </div>
 <div>
 <label className="block text-sm font-medium text-soft mb-1">New Password</label>
 <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2.5 border border-line rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500" required disabled={isSubmitting} />
 </div>
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Confirm New Password</label>
 <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2.5 border border-line rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500" required disabled={isSubmitting} />
 </div>
 <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
 {isSubmitting ? <FaSpinner className="animate-spin" /> : <FaSave />}
 {isSubmitting ? 'Updating...' : 'Update Password'}
 </button>
 </form>
 </div>

 <div className="border-t pt-6">
 <h2 className="text-xl font-bold text-fg mb-4 flex items-center gap-2">
 <FaShieldAlt className="text-blue-600" /> Two-Factor Authentication
 </h2>
 <div className="flex items-center justify-between p-4 border rounded-lg">
 <div>
 <p className="font-medium text-fg">Two-Factor Authentication (2FA)</p>
 <p className="text-sm text-soft">Add an extra layer of security to your account</p>
 </div>
 <button type="button" onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}>
 {twoFactorEnabled ? (
 <FaToggleOn className="text-4xl text-green-500" />
 ) : (
 <FaToggleOff className="text-4xl text-faint" />
 )}
 </button>
 </div>
 </div>

 <div className="border-t pt-6">
 <h2 className="text-xl font-bold text-fg mb-4 flex items-center gap-2">
 <FaKey className="text-blue-600" /> Active Sessions
 </h2>
 <div className="p-4 border rounded-lg">
 <div className="flex items-center justify-between">
 <div>
 <p className="font-medium text-fg">Current Session</p>
 <p className="text-sm text-soft">This device &bull; Active now</p>
 </div>
 <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>
 </div>
 </div>
 </div>
 </div>
 )
}

export default SecuritySettingsTab
