'use client'

import { useState, useEffect } from 'react'
import { FaUsers, FaSpinner, FaSearch, FaUserCheck } from 'react-icons/fa'
import { useUser } from '@/hooks/useUser'

interface Client {
 id: string
 name: string
 email: string
 signupDate: string
 planType: string
 lifetimeValue: number
}

export default function ClientsPage() {
 const [clients, setClients] = useState<Client[]>([])
 const [loading, setLoading] = useState(true)
 const { user: currentUser } = useUser()
 const userId = currentUser?.id ?? ''
 const [searchTerm, setSearchTerm] = useState('')

 useEffect(() => {
 if (!userId) return

 const fetchClients = async () => {
 try {
 const res = await fetch(`/api/referral-partners/${userId}/dashboard`, { credentials: 'include' })
 if (res.ok) {
 const json = await res.json()
 if (json.success && json.data.clients) {
 setClients(json.data.clients)
 }
 }
 } catch (error) {
 console.error('Failed to fetch clients:', error)
 } finally {
 setLoading(false)
 }
 }

 fetchClients()
 }, [userId])

 const filteredClients = clients.filter(c =>
 c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
 c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
 c.planType.toLowerCase().includes(searchTerm.toLowerCase())
 )

 const totalLifetimeValue = clients.reduce((sum, c) => sum + c.lifetimeValue, 0)

 const planColors: Record<string, string> = {
 basic: 'bg-subtle text-soft',
 standard: 'bg-blue-100 text-blue-700',
 premium: 'bg-purple-100 text-purple-700',
 enterprise: 'bg-indigo-100 text-indigo-700',
 }

 const getPlanBadgeColor = (plan: string) => {
 return planColors[plan.toLowerCase()] || 'bg-subtle text-soft'
 }

 return (
 <div className="space-y-6">
 <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
 <FaUsers className="text-purple-500" /> Converted Clients
 </h1>

 {loading ? (
 <div className="flex justify-center py-12">
 <FaSpinner className="animate-spin text-2xl text-purple-500" />
 </div>
 ) : (
 <>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="bg-surface rounded-xl p-5 shadow-lg">
 <p className="text-soft text-sm">Total Clients</p>
 <p className="text-2xl font-bold text-fg mt-1">{clients.length}</p>
 </div>
 <div className="bg-surface rounded-xl p-5 shadow-lg">
 <p className="text-soft text-sm">Total Lifetime Value</p>
 <p className="text-2xl font-bold text-purple-600 mt-1">Rs {totalLifetimeValue.toLocaleString()}</p>
 </div>
 <div className="bg-surface rounded-xl p-5 shadow-lg">
 <p className="text-soft text-sm">Avg. Value per Client</p>
 <p className="text-2xl font-bold text-green-600 mt-1">
 Rs {clients.length > 0 ? Math.round(totalLifetimeValue / clients.length).toLocaleString() : '0'}
 </p>
 </div>
 </div>

 <div className="bg-surface rounded-xl shadow-lg">
 <div className="p-4 border-b">
 <div className="relative">
 <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
 <input
 type="text"
 placeholder="Search by name, email, or plan..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
 />
 </div>
 </div>

 {filteredClients.length === 0 ? (
 <div className="p-12 text-center">
 <FaUserCheck className="mx-auto text-4xl text-faint mb-4" />
 <h3 className="text-lg font-semibold text-soft mb-2">No converted clients yet</h3>
 <p className="text-soft text-sm">
 {searchTerm
 ? 'No clients match your search criteria.'
 : 'When your referrals convert, they will appear here.'}
 </p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead>
 <tr className="text-left text-xs font-medium text-soft uppercase tracking-wider">
 <th className="px-6 py-3">Client</th>
 <th className="px-6 py-3">Signup Date</th>
 <th className="px-6 py-3">Plan Type</th>
 <th className="px-6 py-3 text-right">Lifetime Value</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-line">
 {filteredClients.map((client) => (
 <tr key={client.id} className="hover:bg-subtle transition-colors">
 <td className="px-6 py-4">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center">
 <span className="text-purple-700 font-semibold text-sm">
 {client.name.charAt(0).toUpperCase()}
 </span>
 </div>
 <div>
 <p className="font-medium text-fg">{client.name}</p>
 <p className="text-soft text-sm">{client.email}</p>
 </div>
 </div>
 </td>
 <td className="px-6 py-4 text-sm text-soft">
 {new Date(client.signupDate).toLocaleDateString()}
 </td>
 <td className="px-6 py-4">
 <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getPlanBadgeColor(client.planType)}`}>
 {client.planType}
 </span>
 </td>
 <td className="px-6 py-4 text-right font-medium text-fg">
 Rs {client.lifetimeValue.toLocaleString()}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </>
 )}
 </div>
 )
}
