'use client'

import { useState, useEffect, useCallback } from 'react'
import { FaFileAlt, FaCheck, FaTimes, FaEye } from 'react-icons/fa'

interface PendingDoc {
  id: string
  name: string
  type: string
  url: string
  size: number | null
  uploadedAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    userType: string
    profileImage: string | null
  }
}

const TYPE_LABELS: Record<string, string> = {
  id_proof: 'ID Card',
  lab_report: 'Lab Report',
  prescription: 'Prescription',
  imaging: 'Imaging',
  insurance: 'Insurance',
  other: 'Other',
}

export default function DocumentQueuePage() {
  const [docs, setDocs] = useState<PendingDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [viewing, setViewing] = useState<PendingDoc | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/documents/pending', { credentials: 'include' })
      const json = await res.json()
      if (json.success) setDocs(json.data || [])
      else setError(json.message || 'Failed to load')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const approve = async (id: string) => {
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/documents/${id}/approve`, {
        method: 'PATCH', credentials: 'include',
      })
      if (res.ok) setDocs(d => d.filter(x => x.id !== id))
    } finally { setBusyId(null) }
  }

  const reject = async (id: string) => {
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/documents/${id}/reject`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason }),
      })
      if (res.ok) {
        setDocs(d => d.filter(x => x.id !== id))
        setRejectingId(null)
        setRejectionReason('')
      }
    } finally { setBusyId(null) }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-fg flex items-center gap-3">
          <FaFileAlt className="text-[#0C6780]" /> Document verification queue
        </h1>
        <p className="text-sm text-soft mt-1">
          Review documents uploaded by users. Approving every required document auto-verifies the account.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-[#0C6780] border-t-transparent rounded-full" />
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-20 bg-subtle rounded-xl border border-dashed border-line">
          <FaCheck className="mx-auto text-4xl text-green-400 mb-3" />
          <h3 className="text-lg font-medium text-soft">All caught up</h3>
          <p className="text-sm text-soft">No documents are awaiting review.</p>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-line shadow-sm overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full">
            <thead>
              <tr className="bg-subtle border-b border-line text-left text-xs font-semibold text-soft uppercase tracking-wider">
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Document</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Uploaded</th>
                <th className="px-5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {docs.map(d => (
                <tr key={d.id} className="hover:bg-subtle">
                  <td className="px-5 py-3">
                    <p className="font-medium text-fg">{d.user.firstName} {d.user.lastName}</p>
                    <p className="text-xs text-soft">{d.user.email}</p>
                    <p className="text-[10px] uppercase text-faint">{d.user.userType.replace(/_/g, ' ')}</p>
                  </td>
                  <td className="px-5 py-3 text-sm text-soft">{d.name}</td>
                  <td className="px-5 py-3 text-sm">
                    <span className="px-2 py-0.5 rounded-full text-[11px] bg-blue-50 text-blue-700 font-medium">
                      {TYPE_LABELS[d.type] || d.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-soft">
                    {new Date(d.uploadedAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button onClick={() => setViewing(d)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="View">
                        <FaEye />
                      </button>
                      <button
                        disabled={busyId === d.id}
                        onClick={() => approve(d.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:bg-gray-300"
                      >
                        <FaCheck /> Approve
                      </button>
                      <button
                        disabled={busyId === d.id}
                        onClick={() => setRejectingId(d.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100"
                      >
                        <FaTimes /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      )}

      {/* Viewer modal */}
      {viewing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setViewing(null)}>
          <div className="bg-surface rounded-xl shadow-xl max-w-4xl w-full max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-line">
              <div>
                <p className="font-semibold">{viewing.name}</p>
                <p className="text-xs text-soft">{viewing.user.firstName} {viewing.user.lastName}</p>
              </div>
              <button onClick={() => setViewing(null)} className="p-2 text-faint hover:text-soft"><FaTimes /></button>
            </div>
            <div className="p-4 overflow-auto" style={{ maxHeight: '70vh' }}>
              {viewing.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={viewing.url} alt={viewing.name} className="max-w-full h-auto mx-auto" />
              ) : (
                <iframe src={viewing.url} className="w-full h-[60vh] border-0" title={viewing.name} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection modal */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="font-bold text-lg mb-1">Reject document</h3>
            <p className="text-sm text-soft mb-4">Tell the user why so they can correct it.</p>
            <textarea
              rows={4}
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780] focus:border-[#0C6780] outline-none"
              placeholder="e.g. Document is blurry, please re-upload a clearer photo."
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setRejectingId(null); setRejectionReason('') }}
                className="px-4 py-2 border border-line rounded-lg text-sm hover:bg-subtle">
                Cancel
              </button>
              <button
                disabled={!rejectionReason.trim() || busyId === rejectingId}
                onClick={() => reject(rejectingId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:bg-gray-300">
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
