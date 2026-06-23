'use client'

import { useState } from 'react'
import { FaTimes, FaCheck, FaBan } from 'react-icons/fa'
import ClaimFraudBanner from './ClaimFraudBanner'
import { useCurrency } from '@/hooks/useCurrency'

/**
 * Right-side drawer that appears when an owner clicks a pending claim.
 * Shows the fraud signal banner + member-facing claim detail + the two
 * actions (approve / deny). Approve goes through the server-side rules
 * engine (it can still downgrade to `pending_review` if the engine flags
 * fraud we didn't catch locally).
 */
export interface ClaimDetail {
  id: string
  memberName: string
  description: string
  amount: number
  receiptUrl?: string | null
  createdAt: string
}

interface Props {
  claim: ClaimDetail | null
  onClose: () => void
  onResolved: () => void
}

export default function ClaimReviewDrawer({ claim, onClose, onResolved }: Props) {
  const [busy, setBusy] = useState<'approve' | 'deny' | null>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { format } = useCurrency()

  if (!claim) return null

  async function act(action: 'approve' | 'deny') {
    setBusy(action)
    setError(null)
    try {
      const res = await fetch(`/api/corporate/insurance/claims/${claim!.id}/${action}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerNote: note || undefined }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || `Failed to ${action}`)
      onResolved()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        aria-label="Close"
        onClick={onClose}
        className="flex-1 bg-black/40"
      />
      <div className="w-full max-w-md bg-surface h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="sticky top-0 bg-surface border-b border-line p-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-fg">Review claim</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-subtle rounded-lg text-soft">
            <FaTimes />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <ClaimFraudBanner claimId={claim.id} />

          <section>
            <div className="text-[11px] uppercase tracking-wide text-soft font-semibold mb-1">Member</div>
            <div className="text-sm font-semibold text-fg">{claim.memberName}</div>
          </section>

          <section>
            <div className="text-[11px] uppercase tracking-wide text-soft font-semibold mb-1">Amount requested</div>
            <div className="text-xl font-bold text-fg">{format(claim.amount)}</div>
          </section>

          <section>
            <div className="text-[11px] uppercase tracking-wide text-soft font-semibold mb-1">Description</div>
            <p className="text-sm text-fg whitespace-pre-wrap">{claim.description}</p>
          </section>

          {claim.receiptUrl && (
            <section>
              <div className="text-[11px] uppercase tracking-wide text-soft font-semibold mb-1">Receipt</div>
              <a
                href={claim.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-600 hover:underline break-all"
              >
                {claim.receiptUrl}
              </a>
            </section>
          )}

          <section>
            <label htmlFor="reviewer-note" className="text-[11px] uppercase tracking-wide text-soft font-semibold block mb-1">
              Reviewer note (optional)
            </label>
            <textarea
              id="reviewer-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-sm border border-line rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="Shown to the member alongside the decision."
            />
          </section>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-2">{error}</div>
          )}

          <section className="pt-2 grid grid-cols-2 gap-2">
            <button
              disabled={busy !== null}
              onClick={() => act('deny')}
              className="py-2 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FaBan /> {busy === 'deny' ? 'Denying' : 'Deny'}
            </button>
            <button
              disabled={busy !== null}
              onClick={() => act('approve')}
              className="py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FaCheck /> {busy === 'approve' ? 'Approving' : 'Approve'}
            </button>
          </section>

          <p className="text-[11px] text-soft text-center pt-2">
            Approval runs the reimbursement rules engine. If fraud signals fire, the claim routes to <em>pending review</em> instead of paying out.
          </p>
        </div>
      </div>
    </div>
  )
}
