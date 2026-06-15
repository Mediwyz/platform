'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiArrowLeft, FiLayers, FiChevronDown, FiChevronUp, FiCheckCircle } from 'react-icons/fi'

interface Step { order: number; statusCode: string; label: string; flags: Record<string, unknown>; actionsForPatient: Array<{ action: string; label: string }>; actionsForProvider: Array<{ action: string; label: string }> }
interface WorkflowTemplate {
  id: string; name: string; slug: string; providerType: string; serviceMode: string
  isDefault: boolean; isActive: boolean; isLibrary: boolean; category: string | null; regionCode: string | null; steps: Step[]
}

const FLAG_LABELS: Record<string, string> = {
  triggers_video_call: 'Video', triggers_payment: 'Payment', triggers_refund: 'Refund',
  triggers_conversation: 'Chat', triggers_review_request: 'Review', triggers_stock_check: 'Stock', requires_prescription: 'Rx',
}

const MODE_COLORS: Record<string, string> = {
  video: 'bg-purple-100 text-purple-700', home: 'bg-orange-100 text-orange-700',
  delivery: 'bg-amber-100 text-amber-700', emergency: 'bg-red-100 text-red-700', office: 'bg-sky-100 text-sky-700',
}

export default function AdminSystemTemplatesPage() {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState('')
  const [filterMode, setFilterMode] = useState('')

  useEffect(() => {
    fetch('/api/workflow/templates', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.success) setTemplates(d.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const providerTypes = [...new Set(templates.map(t => t.providerType))].sort()
  const modes = [...new Set(templates.map(t => t.serviceMode))].sort()
  const filtered = templates.filter(t => (!filterType || t.providerType === filterType) && (!filterMode || t.serviceMode === filterMode))

  const grouped = filtered.reduce<Record<string, WorkflowTemplate[]>>((acc, t) => {
    ;(acc[t.providerType] ||= []).push(t)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/workflows" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><FiArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><FiLayers className="text-violet-600" /> System Templates</h1>
          <p className="text-sm text-gray-500 mt-0.5">All workflow templates across all regions. Read-only - edit via regional dashboards.</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-teal">
          <option value="">All provider types</option>
          {providerTypes.map(pt => <option key={pt} value={pt}>{pt.replace(/_/g,' ')}</option>)}
        </select>
        <select value={filterMode} onChange={e => setFilterMode(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-teal">
          <option value="">All modes</option>
          {modes.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <span className="text-sm text-gray-500">{filtered.length} templates · {filtered.filter(t => t.isDefault).length} system · {filtered.filter(t => !t.isDefault).length} custom</span>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([pt, tpls]) => (
            <div key={pt}>
              <h2 className="text-sm font-semibold text-gray-600 mb-2">{pt.replace(/_/g,' ')} <span className="text-gray-400 font-normal">({tpls.length})</span></h2>
              <div className="space-y-2">
                {tpls.map(tpl => (
                  <div key={tpl.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedId(expandedId === tpl.id ? null : tpl.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition text-left"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={'px-2 py-0.5 rounded text-xs font-medium ' + (MODE_COLORS[tpl.serviceMode] ?? 'bg-gray-100 text-gray-600')}>{tpl.serviceMode}</span>
                        <span className="font-medium text-gray-900 text-sm">{tpl.name}</span>
                        <span className="text-xs text-gray-400">{tpl.steps.length} steps</span>
                        {tpl.isDefault && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">system</span>}
                        {tpl.isLibrary && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">library</span>}
                        {tpl.regionCode && <span className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded">{tpl.regionCode}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {tpl.isActive ? <FiCheckCircle className="w-4 h-4 text-green-500" /> : <span className="text-xs text-red-500">Inactive</span>}
                        {expandedId === tpl.id ? <FiChevronUp className="w-4 h-4 text-gray-400" /> : <FiChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>

                    {expandedId === tpl.id && (
                      <div className="border-t border-gray-100 p-4 bg-gray-50">
                        <div className="flex flex-wrap gap-2">
                          {tpl.steps.sort((a, b) => a.order - b.order).map((step, i) => (
                            <div key={step.statusCode} className="flex items-center gap-1.5">
                              {i > 0 && <span className="text-gray-300 text-xs">→</span>}
                              <div className="text-xs bg-white border border-gray-200 rounded px-2 py-1">
                                <span className="text-gray-900">{step.label}</span>
                                {Object.entries(step.flags ?? {}).filter(([,v]) => v).map(([f]) => (
                                  <span key={f} className="ml-1 text-[9px] bg-brand-teal/10 text-brand-teal px-1 py-0.5 rounded">{FLAG_LABELS[f] || f}</span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="text-center py-10 text-gray-400">No templates match the selected filters.</div>}
        </div>
      )}
    </div>
  )
}
