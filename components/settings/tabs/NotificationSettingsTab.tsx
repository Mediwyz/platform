'use client'

import { useState, useEffect, useCallback } from 'react'
import { FaBell, FaSave, FaToggleOn, FaToggleOff, FaSpinner, FaExclamationTriangle } from 'react-icons/fa'
import { useUser } from '@/hooks/useUser'

export interface NotificationOption {
 key: string
 label: string
 description?: string
}

interface NotificationSettingsTabProps {
 options: NotificationOption[]
 defaults?: Record<string, boolean>
}

const PREFS_STORAGE_KEY = 'mediwyz_notification_prefs'

const NotificationSettingsTab: React.FC<NotificationSettingsTabProps> = ({
 options,
 defaults = {},
}) => {
 const [settings, setSettings] = useState<Record<string, boolean>>(() => {
 const initial: Record<string, boolean> = {}
 options.forEach((opt) => {
 initial[opt.key] = defaults[opt.key] ?? true
 })
 return initial
 })
 const { user: currentUser } = useUser()
 const userId = currentUser?.id ?? null
 const [isLoading, setIsLoading] = useState(true)
 const [isSaving, setIsSaving] = useState(false)
 const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
 const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

 // Load saved preferences from localStorage (persisted per user)
 useEffect(() => {
 if (!userId) {
 setIsLoading(false)
 return
 }

 try {
 const storedPrefs = localStorage.getItem(`${PREFS_STORAGE_KEY}_${userId}`)
 if (storedPrefs) {
 const parsed = JSON.parse(storedPrefs) as Record<string, boolean>
 setSettings((prev) => {
 const merged: Record<string, boolean> = { ...prev }
 // Only apply stored values for keys that exist in our options
 options.forEach((opt) => {
 if (parsed[opt.key] !== undefined) {
 merged[opt.key] = parsed[opt.key]
 }
 })
 return merged
 })
 }
 } catch {
 // ignore parse errors, fall back to defaults
 }

 setIsLoading(false)
 }, [userId, options])

 const toggle = useCallback((key: string) => {
 setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
 setHasUnsavedChanges(true)
 setMessage(null)
 }, [])

 const handleSave = useCallback(async () => {
 setMessage(null)
 setIsSaving(true)

 try {
 // Persist to localStorage (acts as the preferences store)
 if (userId) {
 localStorage.setItem(`${PREFS_STORAGE_KEY}_${userId}`, JSON.stringify(settings))
 }

 // Attempt to sync with backend notification preferences
 if (userId) {
 try {
 const res = await fetch(`/api/users/${userId}/notifications`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ preferences: settings }),
 credentials: 'include',
 })

 if (!res.ok) {
 // Backend may not support preferences yet - that's OK, we saved locally
 console.warn('Backend notification preferences sync returned non-OK status')
 }
 } catch {
 // Network/API error - preferences are still saved locally
 console.warn('Could not sync notification preferences to backend')
 }
 }

 setHasUnsavedChanges(false)
 setMessage({ type: 'success', text: 'Notification preferences saved successfully' })
 } catch {
 setMessage({ type: 'error', text: 'Failed to save preferences. Please try again.' })
 } finally {
 setIsSaving(false)
 }
 }, [userId, settings])

 if (isLoading) {
 return (
 <div className="flex items-center justify-center py-12">
 <FaSpinner className="animate-spin text-blue-600 text-2xl mr-3" />
 <span className="text-soft">Loading notification preferences...</span>
 </div>
 )
 }

 return (
 <div>
 <h2 className="text-xl font-bold text-fg mb-6 flex items-center gap-2">
 <FaBell className="text-blue-600" /> Notification Preferences
 </h2>

 {message && (
 <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
 {message.type === 'error' && <FaExclamationTriangle />}
 {message.text}
 </div>
 )}

 <div className="space-y-3">
 {options.map((opt) => (
 <div key={opt.key} className="flex items-center justify-between p-4 border rounded-lg hover:bg-subtle transition">
 <div>
 <p className="font-medium text-fg">{opt.label}</p>
 {opt.description && <p className="text-sm text-soft">{opt.description}</p>}
 </div>
 <button type="button" onClick={() => toggle(opt.key)} aria-label={`Toggle ${opt.label}`} disabled={isSaving}>
 {settings[opt.key] ? (
 <FaToggleOn className="text-3xl text-green-500" />
 ) : (
 <FaToggleOff className="text-3xl text-faint" />
 )}
 </button>
 </div>
 ))}
 </div>
 <div className="text-right pt-6 mt-6 border-t">
 <button
 onClick={handleSave}
 disabled={isSaving || !hasUnsavedChanges}
 className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2 ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {isSaving ? <FaSpinner className="animate-spin" /> : <FaSave />}
 {isSaving ? 'Saving...' : 'Save Preferences'}
 </button>
 </div>
 </div>
 )
}

export default NotificationSettingsTab
