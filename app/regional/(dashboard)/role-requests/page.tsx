'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { FiCheckCircle, FiClock, FiUser, FiInbox } from 'react-icons/fi'

/**
 * Regional Admin — Role Request Approval Queue
 *
 * Lists every ProviderRole in `isActive: false` state (pending review)
 * and exposes Activate + Reject actions. This closes the loop opened by
 * the public `POST /api/roles/request` endpoint on the signup page.
 *
 * No hardcoded role codes — queue is fully DB-driven. A new role submitted
 * via signup appears here automatically.
 */
interface PendingRole {
  id: string
  code: string
  label: string
  singularLabel: string
  slug: string
  description: string | null
  regionCode: string | null
  createdAt: string
  isActive: boolean
}

export default function RoleRequestsPage() {
  const [pending, setPending] = useState<PendingRole[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const fetchPending = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/roles?all=true&includeLegacy=true', { credentials: 'include' })
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        setPending(json.data.filter((r: PendingRole) => !r.isActive))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPending() }, [fetchPending])

  async function activate(id: string) {
    setBusyId(id)
    try {
      const res = await fetch(`/api/roles/${id}/activate`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Role activated — now visible in public pickers')
        setPending(prev => prev.filter(r => r.id !== id))
      } else {
        toast.error(json.message || 'Activation failed')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FiInbox className="text-brand-teal" />
          Role Requests
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Provider roles proposed by new users during signup. Activate to make the role
          available in public pickers and enable signups under it.
        </p>
      </div>

      {loading && (
        <div className="h-24 bg-white rounded-xl border border-gray-200 animate-pulse" />
      )}

      {!loading && pending.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <FiCheckCircle className="text-4xl text-green-300 mx-auto mb-3" />
          <p className="font-medium text-gray-600">No pending role requests</p>
          <p className="text-sm text-gray-400 mt-1">
            When someone proposes a new role on signup, it&apos;ll appear here for review.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {pending.map(role => (
          <div key={role.id} className="bg-white rounded-xl border border-amber-200 p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{role.label}</h3>
                  <span className="font-mono text-[11px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                    {role.code}
                  </span>
                  {role.regionCode && (
                    <span className="text-[11px] bg-brand-teal/10 text-brand-teal px-1.5 py-0.5 rounded">
                      {role.regionCode}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                    <FiClock className="w-3 h-3" /> Pending review
                  </span>
                </div>
                {role.description && (
                  <p className="text-sm text-gray-600 mt-1.5">{role.description}</p>
                )}
                <p className="text-[11px] text-gray-400 mt-1.5 inline-flex items-center gap-1">
                  <FiUser className="w-3 h-3" />
                  Submitted {new Date(role.createdAt).toLocaleDateString()} · slug <span className="font-mono">{role.slug}</span>
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => activate(role.id)}
                  disabled={busyId === role.id}
                  className="px-3 py-1.5 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 inline-flex items-center gap-1"
                >
                  <FiCheckCircle className="w-3 h-3" />
                  {busyId === role.id ? 'Activating…' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
