'use client'

import { useState, useEffect, useCallback } from 'react'
import { FaShieldAlt, FaSearch, FaFilter } from 'react-icons/fa'

interface AuditEntry {
  id: string
  adminId: string
  action: string
  targetType: string
  targetId: string | null
  details: Record<string, unknown> | null
  createdAt: string
}

const ACTION_COLOR: Record<string, string> = {
  'document.approve': 'bg-green-100 text-green-700',
  'document.reject': 'bg-red-100 text-red-700',
  'account.approve': 'bg-green-100 text-green-700',
  'account.suspend': 'bg-red-100 text-red-700',
  'role.create': 'bg-blue-100 text-blue-700',
  'role.update': 'bg-amber-100 text-amber-700',
}

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<{ action: string; targetType: string }>({ action: '', targetType: '' })
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '200' })
      if (filter.action) params.set('action', filter.action)
      if (filter.targetType) params.set('targetType', filter.targetType)
      const res = await fetch(`/api/admin/audit-log?${params}`, { credentials: 'include' })
      const json = await res.json()
      if (json.success) setEntries(json.data || [])
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  const filtered = entries

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <FaShieldAlt className="text-[#0C6780]" /> Admin audit log
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Every mutation performed by an admin - approvals, suspensions, role changes.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex-1 min-w-[180px]">
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Filter by action (e.g. document.approve)"
              value={filter.action}
              onChange={e => setFilter(f => ({ ...f, action: e.target.value }))}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0C6780]"
            />
          </div>
        </div>
        <div className="flex-1 min-w-[180px]">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Filter by targetType (User, Document, …)"
              value={filter.targetType}
              onChange={e => setFilter(f => ({ ...f, targetType: e.target.value }))}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0C6780]"
            />
          </div>
        </div>
        <button onClick={() => setFilter({ action: '', targetType: '' })}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          Clear
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-[#0C6780] border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <FaShieldAlt className="mx-auto text-4xl text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-600">No entries match</h3>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3">When</th>
                <th className="px-5 py-3">Admin</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Target</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(e => {
                const color = ACTION_COLOR[e.action] || 'bg-gray-100 text-gray-700'
                const isOpen = expanded === e.id
                return (
                  <>
                    <tr key={e.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpanded(isOpen ? null : e.id)}>
                      <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(e.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-xs font-mono text-gray-700">{e.adminId.slice(0, 12)}…</td>
                      <td className="px-5 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
                          {e.action}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-600">
                        {e.targetType}
                        {e.targetId && <span className="font-mono ml-2 text-gray-400">{e.targetId.slice(0, 12)}…</span>}
                      </td>
                      <td className="px-5 py-3 text-right text-xs text-gray-400">{isOpen ? '▾' : '▸'}</td>
                    </tr>
                    {isOpen && e.details && (
                      <tr key={`${e.id}-details`} className="bg-gray-50">
                        <td colSpan={5} className="px-5 py-3">
                          <pre className="text-[11px] bg-white p-3 rounded border border-gray-200 overflow-x-auto">
                            {JSON.stringify(e.details, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table></div>
        </div>
      )}
    </div>
  )
}
