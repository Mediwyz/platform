'use client'

import { useEffect, useState } from 'react'
import { FaShieldAlt, FaCheckCircle, FaTimesCircle, FaUsers } from 'react-icons/fa'

interface Member {
  id: string
  userId: string
  name: string
  email: string
  joinedAt: string
  paidThisMonth: boolean
  lastContributionMonth: string | null
  lastContributionAt: string | null
}

interface Response {
  company: { id: string; name: string; monthlyContribution: number }
  currentMonth: string
  members: Member[]
  summary: { total: number; paid: number; unpaid: number; expectedRevenue: number; collectedRevenue: number }
}

/**
 * Shown on the "My Company" page when the owner flagged the company as
 * an insurance scheme. Lists members with monthly payment status.
 */
export default function InsuranceMembersTable() {
  const [data, setData] = useState<Response | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/corporate/insurance/members', { credentials: 'include' })
        const json = await res.json()
        if (cancelled) return
        if (json.success) setData(json.data)
        else setError(json.message || 'Not an insurance company')
      } catch {
        if (!cancelled) setError('Network error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  if (loading) return <div className="text-sm text-gray-400 py-6">Loading members…</div>
  if (error) return null // gracefully hide when not an insurance owner
  if (!data) return null

  const { company, currentMonth, members, summary } = data

  return (
    <section className="space-y-4 bg-white rounded-xl border border-gray-200 p-5">
      <header className="flex items-center gap-3 border-b border-gray-100 pb-3">
        <div className="p-2 rounded-lg bg-indigo-50">
          <FaShieldAlt className="text-indigo-600" />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-gray-900">Insurance members - {company.name}</h2>
          <p className="text-xs text-gray-500">
            Fixed monthly contribution: <strong>MUR {company.monthlyContribution.toLocaleString()}</strong> · Period: {currentMonth}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label="Members" value={summary.total} Icon={FaUsers} color="text-gray-700 bg-gray-50" />
        <StatTile label="Paid this month" value={summary.paid} Icon={FaCheckCircle} color="text-green-700 bg-green-50" />
        <StatTile label="Unpaid" value={summary.unpaid} Icon={FaTimesCircle} color="text-red-700 bg-red-50" />
        <StatTile label="Collected" value={`MUR ${summary.collectedRevenue.toLocaleString()}`} Icon={FaShieldAlt} color="text-indigo-700 bg-indigo-50" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Member</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Joined</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Last paid</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-gray-400">No members yet.</td>
              </tr>
            )}
            {members.map(m => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="py-2 px-3">
                  <p className="text-sm font-medium text-gray-900">{m.name}</p>
                  <p className="text-xs text-gray-500">{m.email}</p>
                </td>
                <td className="py-2 px-3 text-xs text-gray-500">
                  {new Date(m.joinedAt).toLocaleDateString()}
                </td>
                <td className="py-2 px-3 text-xs text-gray-500">
                  {m.lastContributionAt
                    ? `${m.lastContributionMonth} · ${new Date(m.lastContributionAt).toLocaleDateString()}`
                    : ' - '}
                </td>
                <td className="py-2 px-3 text-right">
                  {m.paidThisMonth ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                      <FaCheckCircle /> Paid
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                      <FaTimesCircle /> Unpaid
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function StatTile({ label, value, Icon, color }: { label: string; value: number | string; Icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <div className="border border-gray-100 rounded-lg p-3">
      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${color} mb-2`}>
        <Icon className="text-sm" />
      </div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  )
}
