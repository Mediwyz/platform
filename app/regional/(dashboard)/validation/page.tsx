'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  FaClipboardCheck, FaSearch, FaSpinner, FaCheck, FaBan, FaUserTimes,
  FaFileAlt, FaEye, FaDownload, FaChevronDown, FaChevronUp, FaUsers,
} from 'react-icons/fa'

interface DocumentRecord {
  id: string
  name: string
  type: string
  url: string
  fileSize: number | null
  verificationStatus: string
  createdAt: string
}

interface UserRecord {
  id: string
  firstName: string
  lastName: string
  email: string
  userType: string
  accountStatus: string
  verified: boolean
  createdAt: string
  profileImage: string | null
  documents?: DocumentRecord[]
}

const accountStatusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  suspended: 'bg-red-100 text-red-800',
  rejected: 'bg-red-100 text-red-700',
}

function humanizeType(userType: string) {
  return userType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatBytes(bytes: number | null) {
  if (!bytes) return 'Unknown size'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function RegionalValidationPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('unverified')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [userDocs, setUserDocs] = useState<Record<string, DocumentRecord[]>>({})
  const [docsLoading, setDocsLoading] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/admin/accounts?${params}`, { credentials: 'include' })
      const data = await res.json()
      if (data.success) setUsers(data.data || [])
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const fetchDocs = async (userId: string) => {
    if (userDocs[userId]) return
    setDocsLoading(userId)
    try {
      const res = await fetch(`/api/users/${userId}/documents`, { credentials: 'include' })
      const json = await res.json()
      if (json.success) setUserDocs(prev => ({ ...prev, [userId]: json.data || [] }))
    } catch { /* silent */ } finally {
      setDocsLoading(null)
    }
  }

  const toggleExpand = (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null)
    } else {
      setExpandedUser(userId)
      fetchDocs(userId)
    }
  }

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
    } catch { /* silent */ } finally {
      setActionLoading(null)
    }
  }

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    )
  })

  const unverifiedCount = users.filter(u => !u.verified).length

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <FaClipboardCheck className="text-2xl text-amber-600" />
          <h1 className="text-2xl font-bold text-[#001E40]">Document Validation</h1>
        </div>
        <p className="text-gray-600 text-sm">
          Review uploaded documents and approve or reject provider registrations
          {statusFilter === 'unverified' && unverifiedCount > 0 && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {unverifiedCount} pending review
            </span>
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-5 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0C6780] focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0C6780]"
        >
          <option value="unverified">Pending Verification</option>
          <option value="verified">Verified</option>
          <option value="suspended">Suspended</option>
          <option value="rejected">Rejected</option>
          <option value="all">All Users</option>
        </select>
      </div>

      {/* User list */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <FaSpinner className="animate-spin text-3xl text-[#0C6780]" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <FaUsers className="text-4xl text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No users found</p>
            {statusFilter === 'unverified' && (
              <p className="text-gray-400 text-sm mt-1">All provider accounts have been verified</p>
            )}
          </div>
        ) : filteredUsers.map(user => {
          const isExpanded = expandedUser === user.id
          const docs = userDocs[user.id] || []
          return (
            <div key={user.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {/* User row */}
              <div className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{user.firstName} {user.lastName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${accountStatusColors[user.accountStatus] || 'bg-gray-100 text-gray-700'}`}>
                      {user.accountStatus}
                    </span>
                    {!user.verified && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        unverified
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {humanizeType(user.userType)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
                  <p className="text-xs text-gray-400">Registered {new Date(user.createdAt).toLocaleDateString()}</p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                  {!user.verified && user.accountStatus !== 'rejected' && user.accountStatus !== 'suspended' && (
                    <>
                      <button
                        onClick={() => handleAction(user.id, 'approve')}
                        disabled={actionLoading === user.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 disabled:opacity-50"
                      >
                        {actionLoading === user.id ? <FaSpinner className="animate-spin" /> : <FaCheck />} Verify & Approve
                      </button>
                      <button
                        onClick={() => handleAction(user.id, 'reject')}
                        disabled={actionLoading === user.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 disabled:opacity-50"
                      >
                        <FaUserTimes /> Reject
                      </button>
                    </>
                  )}
                  {user.verified && user.accountStatus === 'active' && (
                    <button
                      onClick={() => handleAction(user.id, 'suspend')}
                      disabled={actionLoading === user.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 disabled:opacity-50"
                    >
                      {actionLoading === user.id ? <FaSpinner className="animate-spin" /> : <FaBan />} Suspend
                    </button>
                  )}
                  {(user.accountStatus === 'suspended' || user.accountStatus === 'rejected') && (
                    <button
                      onClick={() => handleAction(user.id, 'approve')}
                      disabled={actionLoading === user.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading === user.id ? <FaSpinner className="animate-spin" /> : <FaCheck />} Reactivate
                    </button>
                  )}
                  <button
                    onClick={() => toggleExpand(user.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200"
                  >
                    <FaFileAlt /> Documents {isExpanded ? <FaChevronUp className="text-[10px]" /> : <FaChevronDown className="text-[10px]" />}
                  </button>
                </div>
              </div>

              {/* Documents panel */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
                  {docsLoading === user.id ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                      <FaSpinner className="animate-spin" /> Loading documents…
                    </div>
                  ) : docs.length === 0 ? (
                    <p className="text-sm text-gray-400 italic py-2">No documents uploaded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {docs.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-3 py-2.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <FaFileAlt className="text-[#0C6780] flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                              <p className="text-xs text-gray-400">{doc.type} · {formatBytes(doc.fileSize)} · {new Date(doc.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              doc.verificationStatus === 'approved' ? 'bg-green-100 text-green-700' :
                              doc.verificationStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {doc.verificationStatus}
                            </span>
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs px-2 py-1 bg-[#0C6780]/10 text-[#0C6780] rounded-lg hover:bg-[#0C6780]/20 flex items-center gap-1"
                            >
                              <FaEye className="text-[10px]" /> View
                            </a>
                            <a
                              href={doc.url}
                              download
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1"
                            >
                              <FaDownload className="text-[10px]" /> Download
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => router.push(`/profile/${user.id}`)}
                    className="mt-3 text-xs text-[#0C6780] hover:underline font-medium"
                  >
                    View full profile →
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
