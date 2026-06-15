'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  FaChartLine, FaPiggyBank, FaExclamationTriangle, FaArrowUp,
  FaArrowDown, FaHourglassHalf, FaFileInvoiceDollar, FaShieldAlt,
} from 'react-icons/fa'
import { useCurrency } from '@/hooks/useCurrency'

/**
 * Insurance Owner Analytics - rich operational view that consumes
 * `GET /api/corporate/insurance/dashboard` (backend endpoint shipped in
 * the April 2026 insurance-SaaS round). Loss ratio, treasury health,
 * pre-auth funnel, flagged claims count.
 *
 * Why a separate page from the existing dashboard: the legacy
 * `/api/insurance/[id]/dashboard` endpoint returns flat claim counts;
 * this one computes the KPIs that owners actually run their business on.
 */

interface DashboardData {
  company: { id: string; name: string }
  treasury: { balance: number; totalInflow: number; totalOutflow: number }
  members: { total: number; activePolicies: number }
  claims: {
    last12Months: number
    paidAmount12m: number
    paidAmount30d: number
    byStatus: Record<string, number>
    flaggedLast30d: number
    ytdPaidPerPolicyAgg: number
  }
  preAuth: { last12Months: number; byStatus: Record<string, number> }
  kpis: {
    lossRatio: number | null
    lossRatioLabel: 'healthy' | 'warning' | 'critical' | 'n/a'
    runwayMonths: number | null
  }
}

export default function InsuranceAnalyticsPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { format } = useCurrency()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/corporate/insurance/dashboard', { credentials: 'include' })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to load')
      setData(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <div className="p-6"><AnalyticsSkeleton /></div>
  if (error) return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm">
        {error}. You may not own an insurance company yet - visit the <Link href="/insurance/plans" className="underline font-semibold">plans</Link> page.
      </div>
    </div>
  )
  if (!data) return null

  const lossRatioColor = {
    healthy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    critical: 'bg-red-50 text-red-700 border-red-200',
    'n/a': 'bg-gray-50 text-gray-600 border-gray-200',
  }[data.kpis.lossRatioLabel]

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{data.company.name} - Analytics</h1>
          <p className="text-sm text-gray-600 mt-1">Operational KPIs for your insurance company.</p>
        </div>
        <button
          onClick={fetchData}
          className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded-lg"
        >
          Refresh
        </button>
      </header>

      {/* Top KPI row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<FaChartLine className="text-indigo-600" />}
          label="Loss Ratio (12m)"
          value={data.kpis.lossRatio == null ? ' - ' : `${(data.kpis.lossRatio * 100).toFixed(0)}%`}
          footer={<span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${lossRatioColor}`}>{data.kpis.lossRatioLabel}</span>}
          help="Payouts ÷ premiums collected. <60% healthy, 60–85% watch, >85% underwater."
        />
        <KpiCard
          icon={<FaPiggyBank className="text-emerald-600" />}
          label="Treasury Balance"
          value={format(data.treasury.balance)}
          footer={<span className="text-[11px] text-gray-500">{data.kpis.runwayMonths != null ? `≈ ${data.kpis.runwayMonths.toFixed(1)} mo runway` : 'No outflow history'}</span>}
          help="Money pool available to pay future claims."
        />
        <KpiCard
          icon={<FaShieldAlt className="text-blue-600" />}
          label="Active Policies"
          value={data.members.activePolicies.toLocaleString()}
          footer={<span className="text-[11px] text-gray-500">{data.members.total} total members</span>}
        />
        <KpiCard
          icon={<FaExclamationTriangle className="text-amber-600" />}
          label="Flagged (30d)"
          value={data.claims.flaggedLast30d.toString()}
          footer={<span className="text-[11px] text-gray-500">Claims w/ fraud signals</span>}
          help="Duplicate receipts, velocity spikes, or anomalous amounts routed to manual review."
        />
      </section>

      {/* Treasury flow */}
      <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Treasury flow</h2>
        <div className="grid grid-cols-3 gap-3">
          <FlowCell label="Inflow (all-time)" amount={data.treasury.totalInflow} sign="+" />
          <FlowCell label="Outflow (all-time)" amount={data.treasury.totalOutflow} sign="-" />
          <FlowCell label="Paid claims (30d)" amount={data.claims.paidAmount30d} sign="-" />
        </div>
      </section>

      {/* Claims + Pre-auth funnels */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FunnelCard
          title="Claims - last 12 months"
          icon={<FaFileInvoiceDollar className="text-indigo-600" />}
          total={data.claims.last12Months}
          breakdown={data.claims.byStatus}
          statusColors={{ paid: 'bg-emerald-500', pending: 'bg-amber-500', denied: 'bg-red-400' }}
        />
        <FunnelCard
          title="Pre-authorizations - last 12 months"
          icon={<FaHourglassHalf className="text-blue-600" />}
          total={data.preAuth.last12Months}
          breakdown={data.preAuth.byStatus}
          statusColors={{ used: 'bg-emerald-500', approved: 'bg-blue-500', pending: 'bg-amber-500', denied: 'bg-red-400', expired: 'bg-gray-400' }}
        />
      </section>

      <footer className="text-[11px] text-gray-500 pt-2">
        Ledger reconciliation runs nightly. If you see numbers that don&apos;t match your own records, do NOT write to the balance directly - file a ticket and wait for a compensating ledger row.
      </footer>
    </div>
  )
}

function KpiCard({ icon, label, value, footer, help }: {
  icon: React.ReactNode; label: string; value: string;
  footer?: React.ReactNode; help?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-2 min-h-[112px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-600">{icon}{label}</div>
        {help && <span title={help} className="text-[10px] text-gray-400 cursor-help">ⓘ</span>}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {footer && <div>{footer}</div>}
    </div>
  )
}

function FlowCell({ label, amount, sign }: { label: string; amount: number; sign: '+' | '-' }) {
  const { format } = useCurrency()
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="text-[11px] text-gray-500 mb-1">{label}</div>
      <div className={`text-base font-bold flex items-center gap-1 ${sign === '+' ? 'text-emerald-700' : 'text-red-700'}`}>
        {sign === '+' ? <FaArrowUp className="text-xs" /> : <FaArrowDown className="text-xs" />}
        {format(amount)}
      </div>
    </div>
  )
}

function FunnelCard({ title, icon, total, breakdown, statusColors }: {
  title: string; icon: React.ReactNode; total: number;
  breakdown: Record<string, number>; statusColors: Record<string, string>;
}) {
  const entries = Object.entries(breakdown)
  const max = Math.max(1, ...entries.map(([, n]) => n))
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">{icon}{title}</div>
        <span className="text-xs text-gray-500">{total} total</span>
      </div>
      {entries.length === 0 ? (
        <div className="text-xs text-gray-500 py-4 text-center">No activity yet - claims will appear here as members submit them.</div>
      ) : (
        <ul className="space-y-2">
          {entries.map(([status, count]) => (
            <li key={status} className="flex items-center gap-3">
              <span className="text-xs text-gray-700 capitalize min-w-[78px]">{status.replace('_', ' ')}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className={`h-full ${statusColors[status] ?? 'bg-gray-400'}`} style={{ width: `${(count / max) * 100}%` }} />
              </div>
              <span className="text-xs font-semibold text-gray-900 min-w-[28px] text-right">{count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    </div>
  )
}
