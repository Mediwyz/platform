'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiArrowLeft, FiShield, FiAlertTriangle, FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi'

interface Violation {
  templateId: string
  templateName: string
  providerType: string
  serviceMode: string | null
  regionCode: string | null
  rule: string
  severity: 'high' | 'medium' | 'low'
}

interface ComplianceData {
  violations: Violation[]
  passingCount: number
  violatingCount: number
  totalChecked: number
}

const SEV: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
  high:   { label: 'High',   bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    icon: FiXCircle },
  medium: { label: 'Medium', bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  icon: FiAlertTriangle },
  low:    { label: 'Low',    bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: FiAlertCircle },
}

export default function AdminWorkflowCompliancePage() {
  const [data, setData] = useState<ComplianceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')

  useEffect(() => {
    fetch('/api/workflow/admin/compliance', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = data?.violations.filter(v => filter === 'all' || v.severity === filter) ?? []

  const byTemplate = filtered.reduce<Record<string, { violations: Violation[]; templateName: string; providerType: string; regionCode: string | null }>>((acc, v) => {
    if (!acc[v.templateId]) acc[v.templateId] = { violations: [], templateName: v.templateName, providerType: v.providerType, regionCode: v.regionCode }
    acc[v.templateId].violations.push(v)
    return acc
  }, {})

  const score = data ? Math.round((data.passingCount / (data.totalChecked || 1)) * 100) : 0
  const scoreColor = score >= 80 ? 'bg-green-100 text-green-700' : score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/workflows" className="p-2 hover:bg-subtle rounded-lg text-soft"><FiArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-fg flex items-center gap-2"><FiShield className="text-rose-600" /> Workflow Compliance</h1>
          <p className="text-sm text-soft mt-0.5">Templates violating best-practice rules that regional admins should fix.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-subtle rounded-xl animate-pulse" />)}</div>
      ) : data ? (
        <>
          <div className="bg-surface border border-line rounded-xl p-5 flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-3">
              <div className={'w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold ' + scoreColor}>{score}%</div>
              <div>
                <div className="font-semibold text-fg">Compliance score</div>
                <div className="text-xs text-soft">{data.passingCount} of {data.totalChecked} templates pass all checks</div>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              {(['high','medium','low'] as const).map(s => {
                const count = data.violations.filter(v => v.severity === s).length
                const cfg = SEV[s]
                return (
                  <div key={s} className={'flex items-center gap-1.5 px-3 py-1.5 rounded-lg ' + cfg.bg + ' ' + cfg.text}>
                    <cfg.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{count} {cfg.label}</span>
                  </div>
                )
              })}
              {data.passingCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700">
                  <FiCheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">{data.passingCount} Passing</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {(['all','high','medium','low'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={'px-3 py-1.5 text-sm rounded-lg border font-medium transition ' + (filter === s ? 'bg-brand-navy text-white border-brand-navy' : 'bg-surface text-soft border-line hover:bg-subtle')}
              >
                {s === 'all' ? 'All (' + data.violations.length + ')' : SEV[s].label + ' (' + data.violations.filter(v => v.severity === s).length + ')'}
              </button>
            ))}
          </div>

          {Object.keys(byTemplate).length === 0 ? (
            <div className="bg-surface border border-line rounded-xl p-10 text-center">
              <FiCheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="font-semibold text-soft">All templates pass the selected checks</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(byTemplate).map(([id, group]) => {
                const maxSev = group.violations.some(v => v.severity === 'high') ? 'high' : group.violations.some(v => v.severity === 'medium') ? 'medium' : 'low'
                const cfg = SEV[maxSev]
                return (
                  <div key={id} className={'bg-surface border ' + cfg.border + ' rounded-xl overflow-hidden'}>
                    <div className={'flex items-center justify-between p-4 ' + cfg.bg}>
                      <div>
                        <div className="font-semibold text-fg">{group.templateName}</div>
                        <div className="text-xs text-soft mt-0.5">{group.providerType.replace(/_/g,' ')} {group.regionCode ? '· ' + group.regionCode : '· global'}</div>
                      </div>
                      <span className={'text-xs font-semibold px-2 py-1 rounded ' + cfg.bg + ' ' + cfg.text}>{group.violations.length} issue{group.violations.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="p-4 space-y-2">
                      {group.violations.map((v, i) => {
                        const vcfg = SEV[v.severity]
                        return (
                          <div key={i} className={'flex items-start gap-2 p-3 rounded-lg ' + vcfg.bg}>
                            <vcfg.icon className={'w-4 h-4 mt-0.5 flex-shrink-0 ' + vcfg.text} />
                            <p className={'text-sm ' + vcfg.text}>{v.rule}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      ) : <div className="text-center py-10 text-soft">Failed to load compliance data.</div>}
    </div>
  )
}
