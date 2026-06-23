'use client'

import { useState } from 'react'
import { FaExclamationTriangle, FaExchangeAlt, FaTrash } from 'react-icons/fa'

/**
 * Danger-zone card on the My Company page. Two destructive actions:
 *   - Transfer ownership to another user by email
 *   - Delete the company (members are soft-removed)
 * Both require an inline "type the company name" confirmation.
 */
export default function CompanyDangerZone({
  companyId,
  companyName,
  onChanged,
}: {
  companyId: string
  companyName: string
  onChanged?: () => void
}) {
  const [mode, setMode] = useState<'idle' | 'transfer' | 'delete'>('idle')
  const [newOwnerEmail, setNewOwnerEmail] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const disabled = confirmText.trim() !== companyName.trim()

  const reset = () => {
    setMode('idle'); setNewOwnerEmail(''); setConfirmText(''); setError(null)
  }

  const transfer = async () => {
    if (!newOwnerEmail || disabled) return
    setBusy(true); setError(null)
    try {
      const res = await fetch(`/api/corporate/companies/${companyId}/transfer`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOwnerEmail: newOwnerEmail.trim() }),
      })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.message || 'Transfer failed')
      onChanged?.()
      reset()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error')
    } finally { setBusy(false) }
  }

  const remove = async () => {
    if (disabled) return
    setBusy(true); setError(null)
    try {
      const res = await fetch(`/api/corporate/companies/${companyId}`, {
        method: 'DELETE', credentials: 'include',
      })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.message || 'Delete failed')
      onChanged?.()
      reset()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error')
    } finally { setBusy(false) }
  }

  return (
    <section className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-4 mt-6">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-red-100">
          <FaExclamationTriangle className="text-red-600" />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-red-900">Danger zone</h2>
          <p className="text-xs text-red-700">
            Ownership transfer and deletion are irreversible. All members will be notified.
          </p>
        </div>
      </div>

      {mode === 'idle' && (
        <div className="flex gap-2">
          <button
            onClick={() => setMode('transfer')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-surface text-red-700 border border-red-300 rounded-lg text-xs font-semibold hover:bg-red-100"
          >
            <FaExchangeAlt /> Transfer ownership
          </button>
          <button
            onClick={() => setMode('delete')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700"
          >
            <FaTrash /> Delete company
          </button>
        </div>
      )}

      {mode !== 'idle' && (
        <div className="bg-surface border border-red-200 rounded-lg p-4 space-y-3">
          {mode === 'transfer' && (
            <label className="block">
              <span className="text-xs font-medium text-soft">New owner&apos;s email</span>
              <input
                type="email"
                value={newOwnerEmail}
                onChange={e => setNewOwnerEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-line rounded-lg text-sm"
                placeholder="user@example.com"
              />
            </label>
          )}
          <label className="block">
            <span className="text-xs font-medium text-soft">
              Type <strong>{companyName}</strong> to confirm
            </span>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-line rounded-lg text-sm"
            />
          </label>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={reset} className="px-3 py-2 text-sm text-soft hover:bg-subtle rounded-lg">Cancel</button>
            <button
              onClick={mode === 'transfer' ? transfer : remove}
              disabled={busy || disabled || (mode === 'transfer' && !newOwnerEmail)}
              className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {busy ? 'Working…' : mode === 'transfer' ? 'Transfer ownership' : 'Delete company'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
