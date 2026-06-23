'use client'

import { useEffect, useState } from 'react'
import { FaUsers, FaShieldAlt, FaMoneyBillWave, FaFileAlt } from 'react-icons/fa'

interface AnalyticsData {
  company: { id: string; name: string; isInsuranceCompany: boolean }
  members: { active: number; pending: number; removed: number; total: number }
  monthlyExpectedRevenue: number
  claimsByStatus: Record<string, { count: number; totalAmount: number }>
}

/**
 * Owner analytics card - embedded on the My Company page. Shows member
 * counts, expected monthly revenue, and claims by status. Graceful empty
 * state if the caller does not own a company.
 */
export default function CompanyAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/corporate/analytics', { credentials: 'include' })
      .then(r => r.json())
      .then(json => {
        if (cancelled) return
        if (json?.success) setData(json.data)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) return null
  if (!data) return null

  const { members, monthlyExpectedRevenue, claimsByStatus, company } = data
  const pendingClaims = claimsByStatus.pending?.count ?? 0
  const paidTotal = claimsByStatus.paid?.totalAmount ?? 0

  return (
    <section className="bg-surface rounded-xl border border-line p-5 space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-fg">Analytics - {company.name}</h2>
        {company.isInsuranceCompany && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
            <FaShieldAlt /> Insurance
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Tile label="Active members" value={members.active} Icon={FaUsers} color="text-soft bg-subtle" />
        <Tile label="Pending" value={members.pending} Icon={FaUsers} color="text-amber-700 bg-amber-50" />
        <Tile
          label="Expected / month"
          value={`MUR ${monthlyExpectedRevenue.toLocaleString()}`}
          Icon={FaMoneyBillWave}
          color="text-green-700 bg-green-50"
        />
        {company.isInsuranceCompany && (
          <Tile
            label={pendingClaims > 0 ? 'Claims to review' : 'Claims paid'}
            value={pendingClaims > 0 ? pendingClaims : `MUR ${paidTotal.toLocaleString()}`}
            Icon={FaFileAlt}
            color={pendingClaims > 0 ? 'text-red-700 bg-red-50' : 'text-indigo-700 bg-indigo-50'}
          />
        )}
      </div>
    </section>
  )
}

function Tile({
  label, value, Icon, color,
}: {
  label: string; value: number | string; Icon: React.ComponentType<{ className?: string }>; color: string
}) {
  return (
    <div className="border border-line rounded-lg p-3">
      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${color} mb-2`}>
        <Icon className="text-sm" />
      </div>
      <p className="text-xs text-soft">{label}</p>
      <p className="text-lg font-bold text-fg">{value}</p>
    </div>
  )
}
