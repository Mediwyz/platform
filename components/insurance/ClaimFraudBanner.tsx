'use client'

import { useEffect, useState } from 'react'
import { FaExclamationTriangle, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa'

/**
 * Fetches `/api/corporate/insurance/claims/:id/fraud-signals` and renders a
 * severity-graded banner for the reviewing owner. High = red (duplicate
 * receipt), medium = amber (velocity / anomaly), low = green (clean).
 *
 * Designed to be dropped into any claim-review surface. Silent while
 * loading so the UI doesn't flash; shows nothing if the endpoint errors
 * (the reviewer can still approve/deny - fraud signals are advisory).
 */
interface FraudFlag {
  code: string
  severity: 'low' | 'medium' | 'high'
  message: string
}

interface FraudSignals {
  claimId: string
  amount: number
  flags: FraudFlag[]
  riskLevel: 'low' | 'medium' | 'high'
  stats: {
    priorClaimsLast48h: number
    priorClaims90dMedian: number
    duplicateCount: number
  }
}

export default function ClaimFraudBanner({ claimId }: { claimId: string }) {
  const [signals, setSignals] = useState<FraudSignals | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`/api/corporate/insurance/claims/${claimId}/fraud-signals`, {
          credentials: 'include',
        })
        const json = await res.json()
        if (!cancelled && json.success) setSignals(json.data)
      } catch { /* advisory - hide on error */ }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [claimId])

  if (loading || !signals) return null

  if (signals.flags.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
        <FaCheckCircle />
        <span>No fraud signals detected. Safe to approve based on rules engine.</span>
      </div>
    )
  }

  const tint = {
    high:   'bg-red-50 border-red-200 text-red-900',
    medium: 'bg-amber-50 border-amber-200 text-amber-900',
    low:    'bg-subtle border-line text-fg',
  }[signals.riskLevel]

  const Icon = signals.riskLevel === 'high' ? FaExclamationCircle : FaExclamationTriangle

  return (
    <div className={`rounded-lg border ${tint} p-3`}>
      <div className="flex items-center gap-2 font-semibold text-sm mb-2">
        <Icon />
        <span>
          {signals.riskLevel === 'high' ? 'High-risk claim - manual review required' :
           signals.riskLevel === 'medium' ? 'Review recommended before approval' :
           'Minor risk flags'}
        </span>
      </div>
      <ul className="space-y-1 text-xs">
        {signals.flags.map((flag) => (
          <li key={flag.code} className="flex items-start gap-1.5">
            <span className="mt-0.5"></span>
            <div>
              <span className="font-medium">{flag.code.replace(/_/g, ' ')}:</span> {flag.message}
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-2 pt-2 border-t border-current/10 text-[11px] opacity-75 flex flex-wrap gap-x-4 gap-y-0.5">
        <span>48h priors: {signals.stats.priorClaimsLast48h}</span>
        <span>90d median: {signals.stats.priorClaims90dMedian.toFixed(0)}</span>
        <span>Duplicates: {signals.stats.duplicateCount}</span>
      </div>
    </div>
  )
}
