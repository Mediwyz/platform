'use client'

import { useState, useEffect, useCallback } from 'react'
import { FaUsers, FaSearch, FaSpinner, FaTimes, FaCheck, FaBan, FaClock } from 'react-icons/fa'
import { useUser } from '@/hooks/useUser'

interface Member {
 id: string
 userId: string
 status: 'pending' | 'active' | 'removed'
 user: {
  firstName: string
  lastName: string
  email: string
 }
}

export default function CorporateEmployeesPage() {
 const [members, setMembers] = useState<Member[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)
 const [search, setSearch] = useState('')
 const [actionLoading, setActionLoading] = useState<string | null>(null)
 const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'active'>('all')
 const { user: currentUser } = useUser()
 const userId = currentUser?.id ?? ''

 const fetchMembers = useCallback(async () => {
  if (!userId) return
  try {
   const res = await fetch(`/api/corporate/${userId}/members`, { credentials: 'include' })
   if (res.ok) {
    const json = await res.json()
    if (json.success) setMembers(json.data || [])
   }
  } catch (err) {
   console.error('Failed to fetch members:', err)
   setError(err instanceof Error ? err.message : 'Failed to load members')
  } finally {
   setLoading(false)
  }
 }, [userId])

 useEffect(() => { fetchMembers() }, [fetchMembers])

 const handleAction = async (memberId: string, action: 'approve' | 'reject') => {
  setActionLoading(memberId)
  try {
   const res = await fetch(`/api/corporate/${userId}/members`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memberId, action }),
   })
   const json = await res.json()
   if (json.success) {
    await fetchMembers()
   } else {
    setError(json.message)
   }
  } catch {
   setError('Failed to process action')
  } finally {
   setActionLoading(null)
  }
 }

 const filteredMembers = members.filter(m => {
  const matchesSearch =
   `${m.user.firstName} ${m.user.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
   m.user.email.toLowerCase().includes(search.toLowerCase())
  const matchesTab = activeTab === 'all' || m.status === activeTab
  return matchesSearch && matchesTab
 })

 const pendingCount = members.filter(m => m.status === 'pending').length

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
    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
     <FaUsers className="text-blue-500" /> Employee Management
    </h1>
    {pendingCount > 0 && (
     <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
      {pendingCount} pending
     </span>
    )}
   </div>

   {/* Tabs */}
   <div className="flex gap-2">
    {(['all', 'pending', 'active'] as const).map(tab => (
     <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
       activeTab === tab
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
     >
      {tab === 'all' ? 'All' : tab === 'pending' ? `Pending (${pendingCount})` : 'Active'}
     </button>
    ))}
   </div>

   <div className="relative">
    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
    <input
     type="text"
     placeholder="Search members..."
     value={search}
     onChange={(e) => setSearch(e.target.value)}
     className="w-full pl-10 pr-4 py-2 border rounded-lg"
    />
   </div>

   <div className="bg-white rounded-xl shadow-lg overflow-hidden">
    {loading ? (
     <div className="flex items-center justify-center min-h-[400px]">
      <FaSpinner className="animate-spin text-blue-600 text-3xl" />
     </div>
    ) : filteredMembers.length === 0 ? (
     <div className="text-center py-12 text-gray-500">
      <FaUsers className="text-4xl mx-auto mb-3 text-gray-300" />
      <p className="text-lg font-medium">No members found</p>
      <p className="text-sm mt-1">Members will appear here when employees enroll through your company.</p>
     </div>
    ) : (
     <>
      {/* Desktop table */}
      <div className="overflow-x-auto"><table className="w-full text-sm hidden sm:table">
       <thead className="bg-gray-50">
        <tr>
         <th className="p-3 text-left font-medium text-gray-700">Employee</th>
         <th className="p-3 text-left font-medium text-gray-700">Status</th>
         <th className="p-3 text-left font-medium text-gray-700">Actions</th>
        </tr>
       </thead>
       <tbody>
        {filteredMembers.map((m) => (
         <tr key={m.id} className="border-b hover:bg-gray-50">
          <td className="p-3">
           <p className="font-medium text-gray-900">{m.user.firstName} {m.user.lastName}</p>
           <p className="text-gray-500 text-xs">{m.user.email}</p>
          </td>
          <td className="p-3">
           <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
            m.status === 'active'
             ? 'bg-green-100 text-green-800'
             : m.status === 'pending'
             ? 'bg-yellow-100 text-yellow-800'
             : 'bg-red-100 text-red-800'
           }`}>
            {m.status === 'pending' && <FaClock className="text-[10px]" />}
            {m.status}
           </span>
          </td>
          <td className="p-3">
           {m.status === 'pending' && (
            <div className="flex gap-2">
             <button
              onClick={() => handleAction(m.id, 'approve')}
              disabled={actionLoading === m.id}
              className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 disabled:opacity-50"
             >
              {actionLoading === m.id ? <FaSpinner className="animate-spin" /> : <FaCheck />}
              Approve
             </button>
             <button
              onClick={() => handleAction(m.id, 'reject')}
              disabled={actionLoading === m.id}
              className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 disabled:opacity-50"
             >
              <FaBan /> Reject
             </button>
            </div>
           )}
          </td>
         </tr>
        ))}
       </tbody>
      </table></div>

      {/* Mobile card view */}
      <div className="sm:hidden divide-y divide-gray-100">
       {filteredMembers.map((m) => (
        <div key={m.id} className="p-4 space-y-2">
         <div className="flex items-center justify-between">
          <div>
           <p className="font-medium text-gray-900">{m.user.firstName} {m.user.lastName}</p>
           <p className="text-gray-500 text-xs">{m.user.email}</p>
          </div>
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
           m.status === 'active'
            ? 'bg-green-100 text-green-800'
            : m.status === 'pending'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800'
          }`}>
           {m.status === 'pending' && <FaClock className="text-[10px]" />}
           {m.status}
          </span>
         </div>
         {m.status === 'pending' && (
          <div className="flex gap-2 pt-1">
           <button
            onClick={() => handleAction(m.id, 'approve')}
            disabled={actionLoading === m.id}
            className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 disabled:opacity-50"
           >
            {actionLoading === m.id ? <FaSpinner className="animate-spin" /> : <FaCheck />}
            Approve
           </button>
           <button
            onClick={() => handleAction(m.id, 'reject')}
            disabled={actionLoading === m.id}
            className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 disabled:opacity-50"
           >
            <FaBan /> Reject
           </button>
          </div>
         )}
        </div>
       ))}
      </div>
     </>
    )}
   </div>
  </div>
 )
}
