'use client'

import { useState, useEffect, useCallback } from 'react'
import { FaUsers, FaCheckCircle, FaExclamationCircle, FaMoneyBillWave, FaSearch, FaDownload } from 'react-icons/fa'
import { useCurrency } from '@/hooks/useCurrency'

interface MemberRow {
  id: string
  userId: string
  name: string
  email: string
  joinedAt: string
  paidThisMonth: boolean
  lastContributionMonth: string | null
  lastContributionAt: string | null
}

interface Summary {
  total: number
  paid: number
  unpaid: number
  expectedRevenue: number
  collectedRevenue: number
}

interface MemberPaymentsData {
  company: { id: string; name: string; monthlyContribution: number }
  currentMonth: string
  members: MemberRow[]
  summary: Summary
}

export default function MemberPaymentsPage() {
  const [data, setData] = useState<MemberPaymentsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all')
  const { format } = useCurrency()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/corporate/insurance/members', { credentials: 'include' })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to load')
      setData(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load member payments')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = data?.members.filter(m => {
    const matchesSearch = !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
    const matchesFilter =
      filter === 'all' ||
      (filter === 'paid' && m.paidThisMonth) ||
      (filter === 'unpaid' && !m.paidThisMonth)
    return matchesSearch && matchesFilter
  }) ?? []

  function exportCsv() {
    if (!data) return
    const rows = [
      ['Name', 'Email', 'Joined', 'Paid This Month', 'Last Contribution Month', 'Last Paid On'],
      ...data.members.map(m => [
        m.name, m.email,
        new Date(m.joinedAt).toLocaleDateString(),
        m.paidThisMonth ? 'Yes' : 'No',
        m.lastContributionMonth ?? ' - ',
        m.lastContributionAt ? new Date(m.lastContributionAt).toLocaleDateString() : ' - ',
      ]),
    ]
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `member-payments-${data.currentMonth}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0C6780]" />
    </div>
  )

  if (error) return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">{error}</div>
    </div>
  )

  if (!data) return null

  const collectionRate = data.summary.total > 0
    ? Math.round((data.summary.paid / data.summary.total) * 100)
    : 0

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-fg">Member Payments</h1>
          <p className="text-sm text-soft mt-0.5">
            {data.company.name}  {data.currentMonth}  {format(data.company.monthlyContribution)}/month per member
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 text-sm border border-line hover:border-[#0C6780] text-soft hover:text-[#0C6780] px-4 py-2 rounded-lg transition"
        >
          <FaDownload className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl border border-line p-4">
          <div className="flex items-center gap-2 text-soft text-xs font-medium uppercase tracking-wide mb-1">
            <FaUsers className="w-3.5 h-3.5" /> Members
          </div>
          <div className="text-2xl font-bold text-fg">{data.summary.total}</div>
        </div>

        <div className="bg-surface rounded-xl border border-emerald-200 p-4">
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium uppercase tracking-wide mb-1">
            <FaCheckCircle className="w-3.5 h-3.5" /> Paid
          </div>
          <div className="text-2xl font-bold text-emerald-700">{data.summary.paid}</div>
          <div className="text-xs text-emerald-500 mt-0.5">{collectionRate}% collection</div>
        </div>

        <div className="bg-surface rounded-xl border border-amber-200 p-4">
          <div className="flex items-center gap-2 text-amber-600 text-xs font-medium uppercase tracking-wide mb-1">
            <FaExclamationCircle className="w-3.5 h-3.5" /> Unpaid
          </div>
          <div className="text-2xl font-bold text-amber-700">{data.summary.unpaid}</div>
        </div>

        <div className="bg-surface rounded-xl border border-line p-4">
          <div className="flex items-center gap-2 text-soft text-xs font-medium uppercase tracking-wide mb-1">
            <FaMoneyBillWave className="w-3.5 h-3.5" /> Collected
          </div>
          <div className="text-lg font-bold text-fg">{format(data.summary.collectedRevenue)}</div>
          <div className="text-xs text-faint mt-0.5">of {format(data.summary.expectedRevenue)}</div>
        </div>
      </div>

      {/* Collection progress bar */}
      <div className="bg-surface rounded-xl border border-line p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-soft">Monthly collection</span>
          <span className="text-sm font-bold text-[#0C6780]">{collectionRate}%</span>
        </div>
        <div className="w-full bg-subtle rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              collectionRate >= 90 ? 'bg-emerald-500' :
              collectionRate >= 60 ? 'bg-amber-400' : 'bg-red-400'
            }`}
            style={{ width: `${collectionRate}%` }}
          />
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-faint w-3.5 h-3.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="w-full pl-9 pr-4 py-2.5 border border-line rounded-lg text-sm focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780] outline-none"
          />
        </div>
        <div className="flex gap-1 bg-subtle rounded-lg p-1">
          {(['all', 'paid', 'unpaid'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition ${
                filter === f
                  ? 'bg-surface shadow-sm text-fg'
                  : 'text-soft hover:text-soft'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Members table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-line rounded-xl bg-subtle">
          <FaUsers className="mx-auto text-3xl text-faint mb-3" />
          <p className="text-soft text-sm">
            {search || filter !== 'all' ? 'No members match your filter.' : 'No members yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-line overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-subtle border-b border-line">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-soft uppercase tracking-wider">Member</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-soft uppercase tracking-wider">This Month</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-soft uppercase tracking-wider">Last Payment</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-soft uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map(m => (
                  <tr key={m.id} className="hover:bg-subtle transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-sm text-fg">{m.name}</div>
                      <div className="text-xs text-soft">{m.email}</div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {m.paidThisMonth ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                          <FaCheckCircle className="w-3 h-3" /> Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
                          <FaExclamationCircle className="w-3 h-3" /> Unpaid
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-soft">
                      {m.lastContributionAt
                        ? new Date(m.lastContributionAt).toLocaleDateString()
                        : <span className="text-faint">Never</span>
                      }
                    </td>
                    <td className="px-5 py-4 text-sm text-soft">
                      {new Date(m.joinedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
