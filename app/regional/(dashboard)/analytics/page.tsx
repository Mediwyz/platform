'use client'

import { useEffect, useMemo, useState } from 'react'
import { FiActivity, FiCheckCircle, FiAlertTriangle, FiTrendingUp } from 'react-icons/fi'
import { useT } from '@/lib/i18n/useT'

/**
 * Regional Admin - Workflow Analytics
 *
 * Visualises the per-template stats already computed server-side at
 * `/api/workflow/templates/stats`. Each template shows:
 *    instances today / 7 days / all-time
 *    completed count
 *    drop-off rate (cancelled  total)
 * With a top-level summary row + a simple bar chart per template.
 */
interface Stats {
  today: number
  week: number
  total: number
  dropOffRate: number
  completed: number
}
interface TemplateMeta {
  id: string
  name: string
  providerType: string
  serviceMode: string
  isDefault: boolean
}

export default function AnalyticsPage() {
  const t = useT()
  const [stats, setStats] = useState<Record<string, Stats>>({})
  const [templates, setTemplates] = useState<TemplateMeta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/workflow/templates/stats', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/workflow/templates', { credentials: 'include' }).then(r => r.json()),
    ])
      .then(([statsJson, tplJson]) => {
        if (statsJson?.success) setStats(statsJson.data)
        if (tplJson?.success) setTemplates(tplJson.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const rows = useMemo(() => {
    return templates
      .map(t => ({ tpl: t, s: stats[t.id] ?? { today: 0, week: 0, total: 0, dropOffRate: 0, completed: 0 } }))
      .sort((a, b) => b.s.total - a.s.total)
  }, [templates, stats])

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        today: acc.today + r.s.today,
        week: acc.week + r.s.week,
        total: acc.total + r.s.total,
        completed: acc.completed + r.s.completed,
        dropOff: acc.dropOff + (r.s.total * r.s.dropOffRate) / 100,
      }),
      { today: 0, week: 0, total: 0, completed: 0, dropOff: 0 },
    )
  }, [rows])

  const overallDropOffRate = totals.total > 0 ? Math.round((totals.dropOff / totals.total) * 100) : 0

  const maxTotal = rows[0]?.s.total || 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
          <FiActivity className="text-brand-teal" /> {t('analytics.title')}
        </h1>
        <p className="text-sm text-soft mt-1">{t('analytics.subtitle')}</p>
      </div>

      {/* Top-level summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={FiActivity} label={t('analytics.stat.today')} value={totals.today} color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={FiTrendingUp} label={t('analytics.stat.week7d')} value={totals.week} color="text-indigo-600" bg="bg-indigo-50" />
        <StatCard icon={FiCheckCircle} label={t('analytics.stat.completed')} value={totals.completed} color="text-green-600" bg="bg-green-50" />
        <StatCard icon={FiAlertTriangle} label={t('analytics.stat.dropOffRate')} value={`${overallDropOffRate}%`} color={overallDropOffRate >= 25 ? 'text-red-600' : 'text-amber-600'} bg="bg-amber-50" />
      </div>

      {/* Per-template bars */}
      <div className="bg-surface rounded-xl border border-line">
        <div className="px-4 py-3 border-b border-line flex items-center justify-between">
          <h2 className="text-sm font-semibold text-soft uppercase tracking-wider">Templates by volume</h2>
          {loading && <span className="text-xs text-faint">Loading</span>}
        </div>

        {!loading && rows.length === 0 && (
          <p className="text-sm text-soft text-center py-10">
            No templates yet. Seed data or create a workflow to see analytics.
          </p>
        )}

        <div className="divide-y divide-line">
          {rows.map(({ tpl, s }) => (
            <div key={tpl.id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg truncate">{tpl.name}</p>
                  <p className="text-[11px] text-soft">
                    {tpl.providerType.replace(/_/g, ' ')}  {tpl.serviceMode}
                    {tpl.isDefault && <span className="ml-2 text-[10px] bg-subtle px-1 rounded">default</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-soft flex-shrink-0">
                  <span><span className="font-semibold text-fg">{s.today}</span> today</span>
                  <span><span className="font-semibold text-fg">{s.week}</span> 7d</span>
                  <span><span className="font-semibold text-fg">{s.total}</span> total</span>
                  <span className={s.dropOffRate >= 40 ? 'text-red-600' : s.dropOffRate >= 20 ? 'text-amber-600' : 'text-emerald-600'}>
                    <span className="font-semibold">{s.dropOffRate}%</span> drop-off
                  </span>
                </div>
              </div>
              <div className="h-2 bg-subtle rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-navy to-brand-teal"
                  style={{ width: `${Math.min(100, (s.total / maxTotal) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon, label, value, color, bg,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string; value: number | string; color: string; bg: string
}) {
  return (
    <div className="bg-surface rounded-xl border border-line p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
        <Icon className={`${color} text-lg`} />
      </div>
      <div>
        <p className="text-xl font-bold text-fg">{value}</p>
        <p className="text-[11px] text-soft uppercase tracking-wider">{label}</p>
      </div>
    </div>
  )
}
