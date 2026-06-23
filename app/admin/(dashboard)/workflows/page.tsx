'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiCheckCircle, FiAlertTriangle, FiActivity, FiLayers, FiShield, FiList, FiGlobe, FiClock } from 'react-icons/fi'

interface Overview {
  templates: { total: number; active: number; systemDefaults: number; custom: number }
  instances: { total: number; active: number; completedThisWeek: number; cancelledThisWeek: number }
  completionRate: number
  pendingSuggestions: number
  byRegion: Array<{ region: string; count: number }>
  recentTemplates: Array<{ id: string; name: string; providerType: string; serviceMode: string; isDefault: boolean; updatedAt: string }>
}

export default function AdminWorkflowsOverviewPage() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/workflow/admin/overview', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.success) setOverview(d.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-subtle rounded-xl animate-pulse" />)}
    </div>
  )

  const score = overview
    ? overview.completionRate
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-fg">Workflow Engine</h1>
          <p className="text-sm text-soft mt-1">Platform-wide visibility into workflow templates, live bookings, and compliance.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/workflows/compliance" className="bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition">
            <FiShield className="w-4 h-4" /> Compliance
          </Link>
          <Link href="/admin/workflows/templates" className="bg-surface border border-line text-soft hover:bg-subtle px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition">
            <FiLayers className="w-4 h-4" /> Templates
          </Link>
          <Link href="/admin/workflows/audit" className="bg-surface border border-line text-soft hover:bg-subtle px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition">
            <FiList className="w-4 h-4" /> Audit log
          </Link>
        </div>
      </div>

      {overview && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Total Templates', value: overview.templates.total, sub: overview.templates.active + ' active', icon: FiLayers, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'System Defaults', value: overview.templates.systemDefaults, sub: overview.templates.custom + ' custom', icon: FiCheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Active Bookings', value: overview.instances.active, sub: overview.instances.total + ' all-time', icon: FiActivity, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Completion Rate', value: score + '%', sub: 'this week', icon: FiActivity, color: 'text-teal-600', bg: 'bg-teal-50' },
              { label: 'Pending Suggestions', value: overview.pendingSuggestions, sub: 'awaiting review', icon: FiClock, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Completed / Week', value: overview.instances.completedThisWeek, sub: overview.instances.cancelledThisWeek + ' cancelled', icon: FiCheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            ].map((c, i) => (
              <div key={i} className="bg-surface border border-line rounded-xl p-4 flex items-start gap-3">
                <div className={'p-2 rounded-lg ' + c.bg}><c.icon className={'w-5 h-5 ' + c.color} /></div>
                <div>
                  <div className="text-2xl font-bold text-fg">{c.value}</div>
                  <div className="text-xs font-medium text-soft">{c.label}</div>
                  <div className="text-xs text-faint">{c.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-surface border border-line rounded-xl p-5">
              <h2 className="text-sm font-semibold text-soft mb-3 flex items-center gap-2">
                <FiGlobe className="w-4 h-4 text-teal-600" /> Templates by region
              </h2>
              {overview.byRegion.length > 0 ? (
                <div className="space-y-2">
                  {overview.byRegion.sort((a, b) => b.count - a.count).map(r => (
                    <div key={r.region} className="flex items-center gap-2">
                      <span className="text-sm text-soft w-16 font-medium">{r.region}</span>
                      <div className="flex-1 h-2 bg-subtle rounded-full overflow-hidden">
                        <div className="h-full bg-brand-teal rounded-full" style={{ width: Math.round((r.count / (overview.templates.total || 1)) * 100) + '%' }} />
                      </div>
                      <span className="text-xs text-soft w-6 text-right">{r.count}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-faint">No region data yet.</p>}
            </div>

            <div className="bg-surface border border-line rounded-xl p-5">
              <h2 className="text-sm font-semibold text-soft mb-3 flex items-center gap-2">
                <FiClock className="w-4 h-4 text-blue-600" /> Recently updated
              </h2>
              {overview.recentTemplates.length > 0 ? (
                <div className="space-y-2">
                  {overview.recentTemplates.map(t => (
                    <div key={t.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-gray-50 last:border-0">
                      <div>
                        <div className="text-sm font-medium text-fg">{t.name}</div>
                        <div className="text-xs text-faint">{t.providerType.replace(/_/g, ' ')} · {t.serviceMode}</div>
                      </div>
                      <span className="text-[10px] text-faint">{new Date(t.updatedAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-faint">No templates yet.</p>}
            </div>
          </div>

          {overview.pendingSuggestions > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
              <FiAlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-900">{overview.pendingSuggestions} workflow suggestion{overview.pendingSuggestions > 1 ? 's' : ''} pending review</p>
                <p className="text-xs text-amber-700">Regional admins are waiting to approve provider suggestions.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
