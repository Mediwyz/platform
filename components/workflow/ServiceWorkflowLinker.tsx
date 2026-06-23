'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { FiLink, FiX, FiPlus, FiChevronDown, FiCheckCircle, FiArrowRight } from 'react-icons/fi'
import Link from 'next/link'

interface WorkflowStep {
  order: number
  statusCode: string
  label: string
  flags: Record<string, boolean | string>
}

interface WorkflowTemplate {
  id: string
  name: string
  slug: string
  serviceMode: string
  isDefault: boolean
  platformServiceId: string | null
  steps: WorkflowStep[]
}

interface ServiceWorkflowLinkerProps {
  serviceId: string
  serviceName: string
  providerType: string
  createWorkflowHref: string
  workflows?: WorkflowTemplate[]
}

const MODE_COLORS: Record<string, string> = {
  office: 'bg-sky-100 text-sky-700', home: 'bg-orange-100 text-orange-700', video: 'bg-purple-100 text-purple-700',
}
const MODE_LABELS: Record<string, string> = { office: 'Office', home: 'Home', video: 'Video' }
const FLAG_ICONS: Record<string, string> = {
  triggers_video_call: '📹', triggers_payment: '💳', triggers_refund: '↩️',
  triggers_conversation: '💬', triggers_review_request: '⭐', triggers_stock_check: '📦',
  triggers_stock_subtract: '📉', requires_prescription: '💊',
}

export default function ServiceWorkflowLinker({ serviceId, providerType, createWorkflowHref, workflows: prefetched }: ServiceWorkflowLinkerProps) {
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>(prefetched || [])
  const [loading, setLoading] = useState(!prefetched)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    if (prefetched) { setWorkflows(prefetched); setLoading(false); return }
    fetch(`/api/workflow/templates?providerType=${providerType}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => { if (data.success) setWorkflows(data.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [providerType, prefetched])

  const linked = workflows.filter(w => w.platformServiceId === serviceId)
  const unlinked = workflows.filter(w => !w.platformServiceId).filter(w => !linked.some(l => l.id === w.id))

  async function link(wId: string) {
    try {
      const r = await fetch(`/api/workflow/templates/${wId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platformServiceId: serviceId }), credentials: 'include' })
      const d = await r.json()
      if (d.success) { setWorkflows(prev => prev.map(w => w.id === wId ? { ...w, platformServiceId: serviceId } : w)); setShowDropdown(false) }
      else toast.error(d.message || 'Failed to link workflow')
    } catch { toast.error('Network error') }
  }

  async function unlink(wId: string) {
    try {
      const r = await fetch(`/api/workflow/templates/${wId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platformServiceId: null }), credentials: 'include' })
      const d = await r.json()
      if (d.success) setWorkflows(prev => prev.map(w => w.id === wId ? { ...w, platformServiceId: null } : w))
      else toast.error(d.message || 'Failed to unlink workflow')
    } catch { toast.error('Network error') }
  }

  if (loading) return <div className="animate-pulse h-5 bg-subtle rounded w-24" />

  return (
    <div className="space-y-1.5">
      {linked.map(w => (
        <div key={w.id} className="bg-subtle rounded-lg p-2 border border-line">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <FiCheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
              <span className="text-[10px] font-semibold text-fg truncate">{w.name}</span>
              <span className={`px-1 py-0.5 rounded text-[8px] font-medium ${MODE_COLORS[w.serviceMode] || 'bg-subtle'}`}>{MODE_LABELS[w.serviceMode]}</span>
            </div>
            <button onClick={() => unlink(w.id)} className="text-faint hover:text-red-500"><FiX className="w-3 h-3" /></button>
          </div>
          <div className="flex items-center flex-wrap gap-px">
            {[...(w.steps ?? [])].sort((a, b) => a.order - b.order).map((s, i, arr) => (
              <div key={s.statusCode} className="flex items-center">
                <span className="px-1 py-px bg-surface border border-line rounded text-[8px] text-soft whitespace-nowrap">
                  {s.label}{Object.entries(s.flags ?? {}).filter(([,v])=>v).map(([f])=>FLAG_ICONS[f]||'').join('')}
                </span>
                {i < arr.length - 1 && <FiArrowRight className="w-2 h-2 text-brand-teal mx-px flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      ))}
      {linked.length === 0 && <p className="text-[9px] text-faint">No workflow assigned</p>}
      {linked.length >= 1 ? null : <div className="relative inline-block">
        <button onClick={() => setShowDropdown(!showDropdown)} className="inline-flex items-center gap-1 px-2 py-1 text-[10px] text-brand-teal border border-brand-teal/30 rounded-lg hover:border-brand-teal font-medium">
          <FiLink className="w-2.5 h-2.5" /> Assign <FiChevronDown className="w-2.5 h-2.5" />
        </button>
        {showDropdown && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-surface border border-line rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto">
            {unlinked.length === 0 ? <div className="p-3 text-center text-[10px] text-faint">No workflows available</div> :
            unlinked.map(w => (
              <button key={w.id} onClick={() => link(w.id)} className="w-full text-left px-2 py-1.5 hover:bg-sky-50 border-b border-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-fg">{w.name}</span>
                  <span className={`px-1 py-0.5 rounded text-[8px] ${MODE_COLORS[w.serviceMode]}`}>{MODE_LABELS[w.serviceMode]}</span>
                </div>
              </button>
            ))}
            <Link href={createWorkflowHref} onClick={() => setShowDropdown(false)} className="block p-2 text-[10px] text-brand-teal border-t border-line">
              <FiPlus className="w-3 h-3 inline mr-1" />Create new
            </Link>
          </div>
        )}
      </div>}
    </div>
  )
}
