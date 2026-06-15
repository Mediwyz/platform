'use client'

import { useState, useEffect, useCallback } from 'react'
import { FaUsers, FaUserPlus, FaSearch, FaEnvelope, FaTimes, FaCheck, FaSpinner } from 'react-icons/fa'
import { useUser } from '@/hooks/useUser'

interface Plan {
  id: string
  planName: string
  planType: string
}

interface Member {
  id: string
  claimId: string
  policyHolderName: string
  submittedDate: string
  status: string
  patient?: {
    id: string
    user?: { id: string; firstName: string; lastName: string; email: string }
  }
  plan?: { id: string; planName: string; planType: string } | null
}

export default function InsuranceMembersPage() {
  const { user: currentUser } = useUser()
  const userId = currentUser?.id ?? ''
  const [members, setMembers] = useState<Member[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePlanId, setInvitePlanId] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const fetchData = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)
      const [membersRes, plansRes] = await Promise.all([
        fetch(`/api/insurance/${userId}/clients`, { credentials: 'include' }),
        fetch(`/api/insurance/${userId}/plans`, { credentials: 'include' }),
      ])
      const membersJson = await membersRes.json()
      const plansJson = await plansRes.json()
      if (membersJson.success) setMembers(membersJson.data || [])
      if (plansJson.success) setPlans(plansJson.data || [])
    } catch (err) {
      console.error('Failed to load members:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return
    setInviting(true)
    setFeedback(null)
    try {
      const res = await fetch(`/api/insurance/${userId}/clients`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, planId: invitePlanId || undefined }),
      })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', message: `Member ${inviteEmail} enrolled successfully` })
        setInviteEmail('')
        setInvitePlanId('')
        setShowInvite(false)
        await fetchData()
      } else {
        setFeedback({ type: 'error', message: json.message || 'Failed to invite member' })
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error' })
    } finally {
      setInviting(false)
    }
  }

  const filtered = members.filter(m => {
    if (!search) return true
    const term = search.toLowerCase()
    const name = m.policyHolderName || ''
    const email = m.patient?.user?.email || ''
    return name.toLowerCase().includes(term) || email.toLowerCase().includes(term)
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <FaUsers className="text-3xl text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Insurance Members</h1>
            <p className="text-sm text-gray-500">Invite and manage policy holders</p>
          </div>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-sm"
        >
          <FaUserPlus /> Invite Member
        </button>
      </div>

      {feedback && (
        <div className={`mb-6 px-4 py-3 rounded-lg flex items-center justify-between ${
          feedback.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <FaCheck /> : <FaTimes />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)}><FaTimes /></button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Members</p>
          <p className="text-2xl font-bold text-gray-900">{members.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Active Plans</p>
          <p className="text-2xl font-bold text-gray-900">{plans.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Enrolled with Plan</p>
          <p className="text-2xl font-bold text-gray-900">{members.filter(m => m.plan).length}</p>
        </div>
      </div>

      <div className="relative mb-6">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <FaSpinner className="animate-spin text-3xl text-purple-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <FaUsers className="mx-auto text-4xl text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-1">No members yet</h3>
          <p className="text-sm text-gray-400 mb-4">Invite policy holders to join your insurance network.</p>
          <button
            onClick={() => setShowInvite(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <FaUserPlus /> Invite First Member
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Member</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Enrolled</th>
                  <th className="text-center px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{m.policyHolderName}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{m.patient?.user?.email || ' - '}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {m.plan ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium">
                          {m.plan.planName}
                        </span>
                      ) : <span className="text-gray-400">No plan</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {m.submittedDate ? new Date(m.submittedDate).toLocaleDateString() : ' - '}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Invite Member</h2>
              <button onClick={() => setShowInvite(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Member Email *</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="member@example.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Member must have an existing MediWyz account</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign Plan (optional)</label>
                <select
                  value={invitePlanId}
                  onChange={e => setInvitePlanId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                >
                  <option value="">No plan</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.planName} ({p.planType})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 font-medium flex items-center justify-center gap-2"
                >
                  {inviting ? <><FaSpinner className="animate-spin" /> Inviting...</> : <><FaUserPlus /> Invite</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
