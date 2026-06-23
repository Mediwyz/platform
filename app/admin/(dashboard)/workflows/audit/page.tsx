'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { FiArrowLeft, FiList, FiRefreshCw } from 'react-icons/fi'

interface StepLog {
  id: string
  instanceId: string
  fromStatus: string | null
  toStatus: string
  action: string
  actionByRole: string
  notes: string | null
  createdAt: string
  instance?: { bookingType: string; template?: { name: string; providerType: string } }
}


export default function AdminWorkflowAuditPage() {
  const [logs, setLogs] = useState<StepLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const limit = 40

  const fetchLogs = useCallback(async (p: number) => {
    setLoading(true)
    try {
      // Fall back to instance list if dedicated audit endpoint not yet wired
      const res = await fetch('/api/workflow/instances?limit=' + limit + '&page=' + p, { credentials: 'include' })
      const json = await res.json()
      if (json.success) {
        const data = Array.isArray(json.data) ? json.data : []
        setLogs(prev => p === 1 ? data : [...prev, ...data])
        setHasMore(data.length === limit)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLogs(1) }, [fetchLogs])

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/workflows" className="p-2 hover:bg-subtle rounded-lg text-soft"><FiArrowLeft className="w-4 h-4" /></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-fg flex items-center gap-2"><FiList className="text-slate-600" /> Workflow Audit Log</h1>
          <p className="text-sm text-soft mt-0.5">Status transitions across all bookings, all regions.</p>
        </div>
        <button onClick={() => { setPage(1); fetchLogs(1) }} className="flex items-center gap-1.5 px-3 py-2 bg-surface border border-line rounded-lg text-sm text-soft hover:bg-subtle transition">
          <FiRefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
        </button>
      </div>

      <div className="bg-surface border border-line rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-subtle border-b border-line">
                <th className="text-left px-4 py-3 text-xs font-semibold text-soft uppercase tracking-wider">Time</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-soft uppercase tracking-wider">Template</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-soft uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-soft uppercase tracking-wider">Booking type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-subtle">
                  <td className="px-4 py-3 text-xs text-soft whitespace-nowrap">{new Date(log.startedAt || log.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-fg text-xs">{log.template?.name ?? ' - '}</div>
                    <div className="text-[10px] text-faint">{log.template?.providerType?.replace(/_/g,' ') ?? ' - '}</div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-brand-teal/10 text-brand-teal px-1.5 py-0.5 rounded">{log.currentStatus}</code>
                  </td>
                  <td className="px-4 py-3 text-xs text-soft">{log.bookingType ?? ' - '}</td>
                </tr>
              ))}
              {!loading && logs.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-faint">No workflow instances yet.</td></tr>
              )}
              {loading && (
                <tr><td colSpan={4} className="px-4 py-6 text-center"><div className="inline-block w-6 h-6 border-2 border-brand-teal border-t-transparent rounded-full animate-spin" /></td></tr>
              )}
            </tbody>
          </table>
        </div>
        {hasMore && (
          <div className="p-4 border-t border-line text-center">
            <button onClick={() => { const next = page + 1; setPage(next); fetchLogs(next) }} className="px-4 py-2 bg-surface border border-line rounded-lg text-sm text-soft hover:bg-subtle transition">Load more</button>
          </div>
        )}
      </div>
    </div>
  )
}
