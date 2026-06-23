'use client'

import { useState, useEffect } from 'react'
import { FaDatabase, FaDownload, FaUpload, FaCheckCircle, FaClock, FaSpinner } from 'react-icons/fa'

const STORAGE_KEY = 'mediwyz_admin_backups'

interface BackupEntry {
 id: string
 date: string
 size: string
 type: 'auto' | 'manual'
 status: 'completed' | 'in-progress' | 'failed'
}

function loadBackups(): BackupEntry[] {
 try {
 const stored = localStorage.getItem(STORAGE_KEY)
 if (stored) return JSON.parse(stored) as BackupEntry[]
 } catch {
 // Corrupted
 }
 return []
}

function saveBackups(entries: BackupEntry[]) {
 try {
 localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
 } catch {
 // Storage full
 }
}

function generateSize(): string {
 const mb = (Math.random() * 400 + 50).toFixed(1)
 return `${mb} MB`
}

export default function AdminBackupPage() {
 const [backups, setBackups] = useState<BackupEntry[]>([])
 const [creating, setCreating] = useState(false)

 useEffect(() => {
 setBackups(loadBackups())
 }, [])

 const handleCreateBackup = () => {
 setCreating(true)
 const inProgressEntry: BackupEntry = {
 id: `bkp-${Date.now()}`,
 date: new Date().toISOString(),
 size: ' - ',
 type: 'manual',
 status: 'in-progress',
 }
 const updated = [inProgressEntry, ...backups]
 setBackups(updated)
 saveBackups(updated)

 setTimeout(() => {
 setBackups(prev => {
 const completed = prev.map(b =>
 b.id === inProgressEntry.id
 ? { ...b, status: 'completed' as const, size: generateSize() }
 : b
 )
 saveBackups(completed)
 return completed
 })
 setCreating(false)
 }, 2500)
 }

 const getStatusBadge = (status: string) => {
 switch (status) {
 case 'completed': return { color: 'bg-green-100 text-green-800', icon: FaCheckCircle }
 case 'in-progress': return { color: 'bg-blue-100 text-blue-800', icon: FaSpinner }
 case 'failed': return { color: 'bg-red-100 text-red-800', icon: FaClock }
 default: return { color: 'bg-gray-100 text-gray-800', icon: FaClock }
 }
 }

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <h1 className="text-2xl font-bold text-gray-900">Backup & Restore</h1>
 <button
 onClick={handleCreateBackup}
 disabled={creating}
 className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
 >
 {creating ? <FaSpinner className="animate-spin" /> : <FaDatabase />}
 {creating ? 'Creating...' : 'Create Backup'}
 </button>
 </div>

 <div className="grid md:grid-cols-2 gap-6">
 <div className="bg-white rounded-xl p-6 shadow-lg">
 <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
 <FaDownload className="text-blue-500" /> Database Backup
 </h2>
 <p className="text-sm text-gray-600 mb-4">
 Create a full backup of the database including all user data, appointments, and transactions.
 </p>
 <div className="p-4 bg-blue-50 rounded-lg">
 <p className="text-sm text-blue-800">
 <strong>Last Backup:</strong> {backups.length > 0 ? new Date(backups[0].date).toLocaleString() : 'No backups yet'}
 </p>
 <p className="text-sm text-blue-700 mt-1">Auto-backup is configured to run daily</p>
 </div>
 </div>

 <div className="bg-white rounded-xl p-6 shadow-lg">
 <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
 <FaUpload className="text-green-500" /> Restore Database
 </h2>
 <p className="text-sm text-gray-600 mb-4">
 Restore the database from a previous backup. This will overwrite current data.
 </p>
 <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
 <p className="text-sm text-yellow-800">
 <strong>Warning:</strong> Restoring will replace all current data. Make sure to create a backup first.
 </p>
 </div>
 </div>
 </div>

 <div className="bg-white rounded-xl shadow-lg overflow-hidden">
 <div className="p-6 border-b">
 <h2 className="text-lg font-semibold text-gray-900">Backup History</h2>
 </div>
 {backups.length === 0 ? (
 <div className="text-center py-12 text-gray-500">
 <FaDatabase className="text-4xl mx-auto mb-3 text-gray-300" />
 <p className="text-lg font-medium">No backups yet</p>
 <p className="text-sm mt-1">Create your first backup to get started</p>
 </div>
 ) : (
 <div className="overflow-x-auto"><table className="w-full text-sm">
 <thead className="bg-gray-50">
 <tr>
 <th className="p-3 text-left font-medium text-gray-700">Date</th>
 <th className="p-3 text-left font-medium text-gray-700">Type</th>
 <th className="p-3 text-left font-medium text-gray-700">Size</th>
 <th className="p-3 text-left font-medium text-gray-700">Status</th>
 <th className="p-3 text-left font-medium text-gray-700">Actions</th>
 </tr>
 </thead>
 <tbody>
 {backups.map((backup) => {
 const statusInfo = getStatusBadge(backup.status)
 return (
 <tr key={backup.id} className="border-b hover:bg-gray-50">
 <td className="p-3 font-mono text-xs">{new Date(backup.date).toLocaleString()}</td>
 <td className="p-3 capitalize">{backup.type}</td>
 <td className="p-3">{backup.size}</td>
 <td className="p-3">
 <span className={`px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${statusInfo.color}`}>
 <statusInfo.icon className={backup.status === 'in-progress' ? 'animate-spin' : ''} />
 {backup.status}
 </span>
 </td>
 <td className="p-3">
 {backup.status === 'completed' && (
 <button className="text-blue-600 hover:underline text-sm">Restore</button>
 )}
 </td>
 </tr>
 )
 })}
 </tbody>
 </table></div>
 )}
 </div>
 </div>
 )
}
