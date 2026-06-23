'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { useDashboardUser } from '@/hooks/useDashboardUser'
import { DashboardLoadingState } from '@/components/dashboard'
import { FiChevronDown, FiChevronUp, FiCheckCircle, FiPlus, FiList, FiTrash2, FiBookOpen, FiSend, FiInbox } from 'react-icons/fi'
import { FaProjectDiagram as FiProjectDiagram } from 'react-icons/fa'
import DashboardPageHeader from '@/components/shared/DashboardPageHeader'
import Link from 'next/link'

interface WorkflowTemplate {
  id: string
  name: string
  slug: string
  providerType: string
  serviceMode: string
  paymentTiming?: string | null
  isDefault: boolean
  isActive: boolean
  createdByProviderId: string | null
  steps: Array<{
    order: number
    statusCode: string
    label: string
    flags: Record<string, boolean | string>
    actionsForPatient: Array<{ action: string; label: string }>
    actionsForProvider: Array<{ action: string; label: string }>
  }>
  transitions: Array<{ from: string; to: string; action: string }>
}

const FLAG_LABELS: Record<string, string> = {
  triggers_video_call: 'Video Call', triggers_payment: 'Payment', triggers_refund: 'Refund',
  triggers_conversation: 'Chat', triggers_review_request: 'Review', triggers_stock_check: 'Stock Check',
  triggers_stock_subtract: 'Stock Subtract', requires_prescription: 'Rx Required', requires_content: 'Content',
}

const MODE_LABELS: Record<string, string> = {
  office: 'Office',
  home: 'Home Visit',
  video: 'Video Call',
  delivery: 'Delivery',
  emergency: 'Emergency',
  recurrent: 'Programme',
}

const MODE_COLORS: Record<string, string> = {
  office: 'bg-sky-100 text-sky-700',
  home: 'bg-orange-100 text-orange-700',
  video: 'bg-purple-100 text-purple-700',
  delivery: 'bg-emerald-100 text-emerald-700',
  emergency: 'bg-red-100 text-red-700',
  recurrent: 'bg-indigo-100 text-indigo-700',
}

const PAYMENT_TIMING_LABELS: Record<string, string> = {
  IMMEDIATE: 'Paid on order',
  ON_ACCEPTANCE: 'Paid on accept',
  ON_COMPLETION: 'Paid per session',
  PAY_LATER: 'Invoiced later',
}

interface ProviderWorkflowsPageProps {
  userType: string
  createHref: string
}

export default function ProviderWorkflowsPage({ userType, createHref }: ProviderWorkflowsPageProps) {
  const user = useDashboardUser()
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [pendingSuggestions, setPendingSuggestions] = useState(0)

  useEffect(() => {
    fetch(`/api/workflow/templates?providerType=${userType}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => { if (data.success) setTemplates(data.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
    fetch('/api/workflow/suggestions?status=PENDING', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { if (data.success) setPendingSuggestions((data.data || []).length) })
      .catch(() => {})
  }, [userType])

  if (!user) return <DashboardLoadingState />

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete workflow "${name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/workflow/templates/${id}`, { method: 'DELETE', credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setTemplates(prev => prev.filter(t => t.id !== id))
        toast.success(`Workflow "${name}" deleted`)
      } else {
        toast.error(data.message || 'Failed to delete')
      }
    } catch {
      toast.error('Failed to delete workflow')
    }
  }

  const myTemplates = templates.filter(t => t.createdByProviderId === user.id)
  const defaultTemplates = templates.filter(t => t.isDefault)

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        icon={FiProjectDiagram}
        title="My Workflows"
        description={`Manage how bookings progress through status steps. ${myTemplates.length} custom + ${defaultTemplates.length} default templates.`}
        actions={
          <>
            <Link
              href={createHref.replace('/create', '/library')}
              className="bg-surface hover:bg-subtle border border-line text-brand-navy px-4 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition"
            >
              <FiBookOpen className="w-4 h-4" /> Browse library
            </Link>
            <Link
              href={createHref.replace('/create', '/my-suggestions')}
              className="bg-surface hover:bg-subtle border border-line text-soft px-4 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition"
            >
              <FiInbox className="w-4 h-4" /> My suggestions
            </Link>
            <Link
              href={createHref.replace('/create', '/suggest')}
              className="bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 px-4 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition"
            >
              <FiSend className="w-4 h-4" /> Suggest to admin
            </Link>
            <Link href={createHref} className="bg-brand-navy hover:bg-brand-teal text-white px-4 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition">
              <FiPlus className="w-4 h-4" /> Create workflow
            </Link>
          </>
        }
      />

      {pendingSuggestions > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-amber-800">
            You have <span className="font-semibold">{pendingSuggestions}</span> workflow suggestion{pendingSuggestions !== 1 ? 's' : ''} pending admin review.
          </p>
          <Link
            href={createHref.replace('/create', '/my-suggestions')}
            className="text-sm font-medium text-amber-800 underline underline-offset-2 hover:text-amber-900"
          >
            View status 
          </Link>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal" /></div>
      ) : (
        <>
          {/* Custom workflows */}
          {myTemplates.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-brand-navy mb-3">My Custom Workflows</h2>
              <div className="space-y-2">
                {myTemplates.map(tpl => (
                  <TemplateCard key={tpl.id} tpl={tpl} expanded={expandedId === tpl.id} onToggle={() => setExpandedId(expandedId === tpl.id ? null : tpl.id)} editable onDelete={() => handleDelete(tpl.id, tpl.name)} />
                ))}
              </div>
            </div>
          )}

          {/* Default workflows */}
          <div>
            <h2 className="text-sm font-semibold text-soft mb-3">System Default Workflows</h2>
            <div className="space-y-2">
              {defaultTemplates.map(tpl => (
                <TemplateCard key={tpl.id} tpl={tpl} expanded={expandedId === tpl.id} onToggle={() => setExpandedId(expandedId === tpl.id ? null : tpl.id)} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function TemplateCard({ tpl, expanded, onToggle, editable, onDelete }: { tpl: WorkflowTemplate; expanded: boolean; onToggle: () => void; editable?: boolean; onDelete?: () => void }) {
  return (
    <div className="bg-surface border border-line rounded-xl overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 hover:bg-subtle transition">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`px-2 py-1 rounded text-xs font-medium ${MODE_COLORS[tpl.serviceMode] ?? 'bg-sky-100 text-sky-700'}`}>
            {MODE_LABELS[tpl.serviceMode] ?? tpl.serviceMode}
          </span>
          {tpl.paymentTiming && tpl.paymentTiming !== 'ON_ACCEPTANCE' && (
            <span className="px-2 py-1 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
              {PAYMENT_TIMING_LABELS[tpl.paymentTiming] ?? tpl.paymentTiming}
            </span>
          )}
          {tpl.serviceMode === 'recurrent' && (
            <span className="px-2 py-1 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
              Programme
            </span>
          )}
          <span className="font-medium text-fg text-sm">{tpl.name}</span>
          <span className="text-xs text-faint">{(tpl.steps ?? []).length} steps</span>
          {editable && <span className="text-xs bg-brand-teal/10 text-brand-teal px-1.5 py-0.5 rounded">Custom</span>}
        </div>
        <div className="flex items-center gap-2">
          {editable && onDelete && (
            <span onClick={(e) => { e.stopPropagation(); onDelete() }} className="text-faint hover:text-red-500 p-1 transition cursor-pointer" title="Delete">
              <FiTrash2 className="w-4 h-4" />
            </span>
          )}
          {tpl.isActive ? <FiCheckCircle className="w-4 h-4 text-green-500" /> : <span className="text-xs text-red-500">Inactive</span>}
          {expanded ? <FiChevronUp /> : <FiChevronDown />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-line p-4 bg-subtle">
          <h4 className="text-xs font-semibold text-soft uppercase tracking-wider mb-3"><FiList className="inline w-3 h-3 mr-1" />Steps & Flags</h4>
          <div className="space-y-2">
            {[...(tpl.steps ?? [])].sort((a, b) => a.order - b.order).map((step, idx) => (
              <div key={step.statusCode} className="flex items-start gap-3 bg-surface rounded-lg p-3 border border-line">
                <div className="w-7 h-7 bg-brand-navy text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{idx + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-fg">{step.label}</span>
                    <code className="text-xs bg-subtle text-soft px-1.5 py-0.5 rounded">{step.statusCode}</code>
                  </div>
                  {Object.entries(step.flags ?? {}).filter(([, v]) => v).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {Object.entries(step.flags ?? {}).filter(([, v]) => v).map(([flag, val]) => (
                        <span key={flag} className="px-1.5 py-0.5 bg-brand-teal/10 text-brand-teal text-xs rounded font-medium">
                          {FLAG_LABELS[flag] || flag}{typeof val === 'string' ? `: ${val}` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(step.actionsForProvider ?? []).map(a => <span key={a.action} className="px-1.5 py-0.5 bg-brand-navy/10 text-brand-navy text-xs rounded">Provider: {a.label}</span>)}
                    {(step.actionsForPatient ?? []).map(a => <span key={a.action} className="px-1.5 py-0.5 bg-subtle text-soft text-xs rounded">Patient: {a.label}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(tpl.transitions ?? []).map((tr, i) => (
              <span key={i} className="text-xs bg-surface border border-line rounded px-2 py-1 text-soft">
                {tr.from} <span className="text-brand-teal font-bold mx-1">&rarr;</span> {tr.to}
                <span className="text-faint ml-1">({tr.action})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
