'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
 FaUsers, FaSearch, FaSpinner, FaCheck, FaBan, FaUserTimes,
 FaFilter, FaUserShield, FaEnvelope
} from 'react-icons/fa'
import { initialsAvatar, avatarSrc } from '@/lib/utils/avatar'

interface UserRecord {
 id: string
 firstName: string
 lastName: string
 email: string
 phone: string
 userType: string
 accountStatus: string
 verified: boolean
 profileImage: string | null
 createdAt: string
 subscription?: {
  status: string
  plan: { name: string; slug: string; type: string }
 } | null
}

interface ProviderRole {
 code: string
 name: string
}

const FALLBACK_LABELS: Record<string, string> = {
 DOCTOR: 'Doctor',
 NURSE: 'Nurse',
 NANNY: 'Nanny',
 PHARMACIST: 'Pharmacist',
 LAB_TECHNICIAN: 'Lab Technician',
 EMERGENCY_WORKER: 'Emergency Worker',
 INSURANCE_REP: 'Insurance Rep',
 CORPORATE_ADMIN: 'Corporate Admin',
 REFERRAL_PARTNER: 'Referral Partner',
 PATIENT: 'Patient',
 MEMBER: 'Member',
 REGIONAL_ADMIN: 'Regional Admin',
}

const statusColors: Record<string, string> = {
 active: 'bg-green-100 text-green-800',
 pending: 'bg-yellow-100 text-yellow-800',
 suspended: 'bg-red-100 text-red-800',
 rejected: 'bg-red-100 text-red-700',
}


export default function RegionalUsersPage() {
 const router = useRouter()
 const [users, setUsers] = useState<UserRecord[]>([])
 const [loading, setLoading] = useState(true)
 const [actionLoading, setActionLoading] = useState<string | null>(null)
 const [messageLoading, setMessageLoading] = useState<string | null>(null)
 const [searchQuery, setSearchQuery] = useState('')
 const [typeFilter, setTypeFilter] = useState<string>('all')
 const [statusFilter, setStatusFilter] = useState<string>('all')
 const [roleLabels, setRoleLabels] = useState<Record<string, string>>(FALLBACK_LABELS)
 const [providerRoles, setProviderRoles] = useState<ProviderRole[]>([])

 useEffect(() => {
  fetch('/api/roles', { credentials: 'include' })
   .then(r => r.json())
   .then(json => {
    if (json.success && Array.isArray(json.data)) {
     const roles: ProviderRole[] = json.data
     setProviderRoles(roles)
     const labels: Record<string, string> = { ...FALLBACK_LABELS }
     for (const role of roles) {
      labels[role.code] = role.name
     }
     setRoleLabels(labels)
    }
   })
   .catch(() => {})
 }, [])

 const fetchUsers = useCallback(async () => {
  setLoading(true)
  try {
   const params = new URLSearchParams()
   if (statusFilter !== 'all') params.set('status', statusFilter)
   const res = await fetch(`/api/admin/accounts?${params.toString()}`, { credentials: 'include' })
   if (res.ok) {
    const data = await res.json()
    if (data.success) setUsers(data.data || [])
   }
  } catch (error) {
   console.error('Failed to fetch users:', error)
  } finally {
   setLoading(false)
  }
 }, [statusFilter])

 useEffect(() => { fetchUsers() }, [fetchUsers])

 const handleAction = async (userId: string, action: 'approve' | 'reject' | 'suspend') => {
  setActionLoading(userId)
  try {
   const res = await fetch('/api/admin/accounts', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, action }),
    credentials: 'include',
   })
   const data = await res.json()
   if (data.success) fetchUsers()
  } catch (error) {
   console.error('Action failed:', error)
  } finally {
   setActionLoading(null)
  }
 }

 const handleMessage = async (targetUserId: string) => {
  setMessageLoading(targetUserId)
  try {
   const res = await fetch('/api/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ participantIds: [targetUserId] }),
   })
   const json = await res.json()
   if (res.ok && json.success) {
    const conversationId = json.data?.id
    router.push(conversationId ? `/regional/messages?conversation=${conversationId}` : '/regional/messages')
   }
  } catch (error) {
   console.error('Message failed:', error)
  } finally {
   setMessageLoading(null)
  }
 }

 const filteredUsers = users.filter((u) => {
  if (typeFilter !== 'all' && u.userType !== typeFilter) return false
  if (!searchQuery) return true
  const q = searchQuery.toLowerCase()
  return (
   u.firstName.toLowerCase().includes(q) ||
   u.lastName.toLowerCase().includes(q) ||
   u.email.toLowerCase().includes(q) ||
   (roleLabels[u.userType] || u.userType).toLowerCase().includes(q)
  )
 })

 const pendingCount = users.filter((u) => u.accountStatus === 'pending').length

 const allFilterTypes = [
  ...providerRoles.map(r => r.code),
  'REGIONAL_ADMIN', 'MEMBER', 'PATIENT',
 ]

 return (
  <div className="p-4 sm:p-6 max-w-7xl mx-auto">
   {/* Header */}
   <div className="mb-6">
    <div className="flex items-center gap-3 mb-2">
     <FaUserShield className="text-2xl text-purple-600" />
     <h1 className="text-2xl font-bold text-fg">User Management</h1>
    </div>
    <p className="text-soft">
     Manage user accounts - approve, suspend, or message users
     {pendingCount > 0 && (
      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
       {pendingCount} pending
      </span>
     )}
    </p>
   </div>

   {/* Filters */}
   <div className="bg-surface rounded-xl p-4 shadow-lg mb-6">
    <div className="flex flex-wrap gap-4 items-center">
     <div className="relative flex-1 min-w-[200px]">
      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
      <input
       type="text"
       placeholder="Search by name, email, or type..."
       value={searchQuery}
       onChange={(e) => setSearchQuery(e.target.value)}
       className="w-full pl-10 pr-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
     </div>

     <div className="flex items-center gap-2">
      <FaFilter className="text-faint" />
      <select
       value={typeFilter}
       onChange={(e) => setTypeFilter(e.target.value)}
       className="px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
      >
       <option value="all">All Types</option>
       {allFilterTypes.map(code => (
        <option key={code} value={code}>{roleLabels[code] || code}</option>
       ))}
      </select>
     </div>

     <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      className="px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
     >
      <option value="all">All Statuses</option>
      <option value="active">Active</option>
      <option value="pending">Pending</option>
      <option value="suspended">Suspended</option>
      <option value="rejected">Rejected</option>
     </select>
    </div>
   </div>

   {/* Users List */}
   <div className="bg-surface rounded-xl shadow-lg overflow-hidden">
    {loading ? (
     <div className="flex justify-center items-center py-16">
      <FaSpinner className="animate-spin text-3xl text-blue-500" />
     </div>
    ) : filteredUsers.length === 0 ? (
     <div className="text-center py-16">
      <FaUsers className="text-4xl text-faint mx-auto mb-3" />
      <p className="text-soft text-lg">No users found</p>
      <p className="text-faint text-sm mt-1">Try adjusting your search or filters</p>
     </div>
    ) : (
     <div className="divide-y divide-line">
      {filteredUsers.map((user) => (
       <div
        key={user.id}
        className="p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-subtle transition-colors gap-4"
       >
        <div className="flex items-center gap-4 flex-1">
         <Image
          src={avatarSrc(user.profileImage, user.firstName, user.lastName)}
          alt={`${user.firstName} ${user.lastName}`}
          width={48}
          height={48}
          className="w-12 h-12 rounded-full object-cover border border-line bg-subtle flex-shrink-0"
          onError={e => { e.currentTarget.src = initialsAvatar(user.firstName, user.lastName) }}
         />
         <div className="min-w-0">
          <h3 className="font-semibold text-fg">
           {user.firstName} {user.lastName}
          </h3>
          <p className="text-sm text-soft truncate">{user.email}</p>
          <div className="flex flex-wrap gap-2 mt-1">
           <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
            {roleLabels[user.userType] || user.userType}
           </span>
           <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[user.accountStatus] || 'bg-subtle text-fg'}`}>
            {user.accountStatus}
           </span>
           {user.verified && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
             Verified
            </span>
           )}
           {user.subscription?.plan && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
             {user.subscription.plan.name}
            </span>
           )}
           {!user.subscription && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-subtle text-soft">
             No plan
            </span>
           )}
           <span className="text-xs text-faint">
            Joined {new Date(user.createdAt).toLocaleDateString()}
           </span>
          </div>
         </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-shrink-0 flex-wrap">
         <button
          onClick={() => handleMessage(user.id)}
          disabled={messageLoading === user.id}
          className="flex items-center gap-1 px-3 py-2 bg-subtle text-soft rounded-lg text-sm hover:bg-line disabled:opacity-50 transition-colors"
         >
          {messageLoading === user.id ? <FaSpinner className="animate-spin" /> : <FaEnvelope />}
          Message
         </button>

         {user.accountStatus === 'pending' && (
          <>
           <button
            onClick={() => handleAction(user.id, 'approve')}
            disabled={actionLoading === user.id}
            className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
           >
            {actionLoading === user.id ? <FaSpinner className="animate-spin" /> : <FaCheck />}
            Approve
           </button>
           <button
            onClick={() => handleAction(user.id, 'reject')}
            disabled={actionLoading === user.id}
            className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
           >
            <FaUserTimes /> Reject
           </button>
          </>
         )}
         {user.accountStatus === 'active' && (
          <button
           onClick={() => handleAction(user.id, 'suspend')}
           disabled={actionLoading === user.id}
           className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
           {actionLoading === user.id ? <FaSpinner className="animate-spin" /> : <FaBan />}
           Suspend
          </button>
         )}
         {(user.accountStatus === 'suspended' || user.accountStatus === 'rejected') && (
          <button
           onClick={() => handleAction(user.id, 'approve')}
           disabled={actionLoading === user.id}
           className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
           {actionLoading === user.id ? <FaSpinner className="animate-spin" /> : <FaCheck />}
           Reactivate
          </button>
         )}
        </div>
       </div>
      ))}
     </div>
    )}

    {!loading && filteredUsers.length > 0 && (
     <div className="px-6 py-3 bg-subtle border-t text-sm text-soft">
      Showing {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
     </div>
    )}
   </div>
  </div>
 )
}
