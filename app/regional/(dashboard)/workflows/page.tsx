'use client'

import { useState, useEffect } from 'react'
import { useDashboardUser } from '@/hooks/useDashboardUser'
import { DashboardLoadingState } from '@/components/dashboard'
import { FiSettings, FiChevronDown, FiChevronUp, FiCheckCircle, FiList, FiPlus, FiEdit2, FiTrash2, FiBookOpen, FiX, FiCopy } from 'react-icons/fi'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import WorkflowStepper from '@/components/workflow/WorkflowStepper'

interface WorkflowTemplate {
  id: string
  name: string
  slug: string
  providerType: string
  serviceMode: string
  isDefault: boolean
  isActive: boolean
  steps: Array<{
    order: number
    statusCode: string
    label: string
    flags: Record<string, boolean | string>
    actionsForPatient: Array<{ action: string; label: string }>
    actionsForProvider: Array<{ action: string; label: string }>
  }>
  transitions: Array<{ from: string; to: string; action: string; allowedRoles: string[] }>
  createdAt: string
}

const FLAG_LABELS: Record<string, string> = {
  triggers_video_call: 'Video Call',
  triggers_payment: 'Payment',
  triggers_refund: 'Refund',
  triggers_conversation: 'Chat',
  triggers_review_request: 'Review',
  triggers_stock_check: 'Stock Check',
  triggers_stock_subtract: 'Stock Subtract',
  requires_prescription: 'Prescription Required',
  requires_content: 'Content Required',
}

const MODE_LABELS: Record<string, string> = {
  office: 'Office',
  home: 'Home Visit',
  video: 'Video Call',
}

interface TemplateStats {
  today: number
  week: number
  total: number
  completed: number
  dropOffRate: number
}

interface LibraryTemplate {
  id: string
  name: string
  slug: string
  description: string | null
  providerType: string
  serviceMode: string
  category: string | null
  steps: unknown[]
}

export default function RegionalWorkflowsPage() {
  const user = useDashboardUser()
  const router = useRouter()
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [stats, setStats] = useState<Record<string, TemplateStats>>({})
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('')
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [library, setLibrary] = useState<LibraryTemplate[]>([])
  const [libraryFilter, setLibraryFilter] = useState('')
  const [cloningId, setCloningId] = useState<string | null>(null)

  async function openLibrary() {
    setLibraryOpen(true)
    if (library.length > 0) return
    try {
      const res = await fetch('/api/workflow/templates/library', { credentials: 'include' })
      const json = await res.json()
      if (json.success) setLibrary(json.data || [])
    } catch {
      // Silent - modal shows empty state.
    }
  }

  async function cloneTemplate(tpl: LibraryTemplate) {
    setCloningId(tpl.id)
    try {
      const res = await fetch(`/api/workflow/templates/${tpl.id}/clone`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${tpl.name} (copy)` }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Clone failed')
      setLibraryOpen(false)
      router.push(`/regional/workflows/${json.data.id}`)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Clone failed')
    } finally { setCloningId(null) }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  async function fetchTemplates() {
    try {
      const [tplRes, statsRes] = await Promise.all([
        fetch('/api/workflow/templates', { credentials: 'include' }),
        fetch('/api/workflow/templates/stats', { credentials: 'include' }),
      ])
      const tplJson = await tplRes.json()
      if (tplJson.success) setTemplates(tplJson.data)
      const statsJson = await statsRes.json().catch(() => ({ success: false }))
      if (statsJson.success) setStats(statsJson.data || {})
    } catch {
      console.error('Failed to fetch templates')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete workflow "${name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/workflow/templates/${id}`, { method: 'DELETE', credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setTemplates(templates.filter(t => t.id !== id))
      } else {
        alert(data.message || 'Failed to delete')
      }
    } catch {
      alert('Failed to delete workflow')
    }
  }

  if (!user) return <DashboardLoadingState />

  const providerTypes = [...new Set(templates.map(t => t.providerType))].sort()
  const filtered = filterType ? templates.filter(t => t.providerType === filterType) : templates

  // Group by provider type
  const grouped = filtered.reduce<Record<string, WorkflowTemplate[]>>((acc, t) => {
    if (!acc[t.providerType]) acc[t.providerType] = []
    acc[t.providerType].push(t)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-fg">Workflow Templates</h1>
          <p className="text-sm text-soft mt-1">
            Manage status workflows for all provider types. {templates.length} templates configured.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/regional/workflows/suggestions"
            className="bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-900 px-4 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition"
          >
            <FiList className="w-4 h-4" /> Workflow suggestions
          </Link>
          <Link
            href="/regional/workflows/role-requests"
            className="bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-900 px-4 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition"
          >
            <FiCheckCircle className="w-4 h-4" /> Role requests
          </Link>
          <Link
            href="/regional/workflows/library"
            className="bg-surface border border-line hover:bg-subtle text-fg px-4 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition"
          >
            <FiBookOpen className="w-4 h-4" /> Browse library
          </Link>
          <button
            onClick={openLibrary}
            className="bg-surface border border-line hover:bg-subtle text-fg px-4 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition"
          >
            <FiBookOpen className="w-4 h-4" /> Start from template
          </button>
          <Link href="/regional/workflows/create" className="bg-brand-navy hover:bg-brand-teal text-white px-4 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition">
            <FiPlus className="w-4 h-4" /> Create workflow
          </Link>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal"
        >
          <option value="">All Provider Types</option>
          {providerTypes.map(pt => (
            <option key={pt} value={pt}>{pt.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <span className="text-sm text-faint">{filtered.length} templates</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal" />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([providerType, tpls]) => (
            <div key={providerType}>
              <h2 className="text-lg font-semibold text-brand-navy mb-3 flex items-center gap-2">
                <FiSettings className="w-5 h-5 text-brand-teal" />
                {providerType.replace(/_/g, ' ')}
                <span className="text-xs font-normal text-faint">({tpls.length} workflows)</span>
              </h2>

              <div className="space-y-2">
                {tpls.map(tpl => (
                  <div key={tpl.id} className="bg-surface border border-line rounded-xl overflow-hidden">
                    {/* Template header */}
                    <div
                      onClick={() => setExpandedId(expandedId === tpl.id ? null : tpl.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-subtle transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          tpl.serviceMode === 'video' ? 'bg-purple-100 text-purple-700' :
                          tpl.serviceMode === 'home' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {MODE_LABELS[tpl.serviceMode] || tpl.serviceMode}
                        </span>
                        <span className="font-medium text-fg text-sm">{tpl.name}</span>
                        <span className="text-xs text-faint">{tpl.steps.length} steps</span>
                        {/* Usage metrics pulled from /api/workflow/templates/stats */}
                        {(() => {
                          const s = stats[tpl.id]
                          if (!s || s.total === 0) return (
                            <span className="text-[10px] text-faint italic">no runs yet</span>
                          )
                          const dropColor =
                            s.dropOffRate >= 40 ? 'text-red-600' :
                            s.dropOffRate >= 20 ? 'text-amber-600' : 'text-emerald-600'
                          return (
                            <span className="flex items-center gap-2 text-[11px] text-soft">
                              <span className="inline-flex items-center gap-0.5">
                                <span className="font-semibold">{s.today}</span>
                                <span className="text-faint">today</span>
                              </span>
                              <span className="text-faint">·</span>
                              <span className="inline-flex items-center gap-0.5">
                                <span className="font-semibold">{s.week}</span>
                                <span className="text-faint">7d</span>
                              </span>
                              <span className="text-faint">·</span>
                              <span className="inline-flex items-center gap-0.5">
                                <span className="font-semibold">{s.total}</span>
                                <span className="text-faint">total</span>
                              </span>
                              <span className="text-faint">·</span>
                              <span className={`inline-flex items-center gap-0.5 ${dropColor}`} title="Cancelled ÷ total">
                                <span className="font-semibold">{s.dropOffRate}%</span>
                                <span>drop-off</span>
                              </span>
                            </span>
                          )
                        })()}
                      </div>
                      <div className="flex items-center gap-2">
                        {!tpl.isDefault && (
                          <>
                            <Link href={`/regional/workflows/${tpl.id}`} onClick={(e) => e.stopPropagation()} className="text-brand-teal hover:text-brand-navy p-1" title="Edit">
                              <FiEdit2 className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(tpl.id, tpl.name) }}
                              className="text-faint hover:text-red-500 p-1 transition" title="Delete"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {tpl.isActive ? (
                          <FiCheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <span className="text-xs text-red-500">Inactive</span>
                        )}
                        {expandedId === tpl.id ? <FiChevronUp /> : <FiChevronDown />}
                      </div>
                    </div>

                    {/* Always-visible stepper preview - admins can see each
                        template's shape at a glance without expanding. */}
                    <div className="px-4 pb-3 -mt-1">
                      <WorkflowStepper
                        steps={tpl.steps.map(s => ({
                          order: s.order,
                          statusCode: s.statusCode,
                          label: s.label,
                          flags: s.flags as Record<string, unknown>,
                          actionsForPatient: s.actionsForPatient,
                          actionsForProvider: s.actionsForProvider,
                        }))}
                        variant="compact"
                      />
                    </div>

                    {/* Expanded: show steps */}
                    {expandedId === tpl.id && (
                      <div className="border-t border-line p-4 bg-subtle">
                        <h4 className="text-xs font-semibold text-soft uppercase tracking-wider mb-3">
                          <FiList className="inline w-3 h-3 mr-1" />
                          Workflow Steps
                        </h4>

                        <div className="space-y-2">
                          {tpl.steps.sort((a, b) => a.order - b.order).map((step, idx) => (
                            <div key={step.statusCode} className="flex items-start gap-3 bg-surface rounded-lg p-3 border border-line">
                              {/* Step number */}
                              <div className="w-7 h-7 bg-brand-navy text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {idx + 1}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm text-fg">{step.label}</span>
                                  <code className="text-xs bg-subtle text-soft px-1.5 py-0.5 rounded">{step.statusCode}</code>
                                </div>

                                {/* Flags */}
                                {Object.entries(step.flags).filter(([, v]) => v).length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {Object.entries(step.flags).filter(([, v]) => v).map(([flag, val]) => (
                                      <span key={flag} className="px-1.5 py-0.5 bg-brand-teal/10 text-brand-teal text-xs rounded font-medium">
                                        {FLAG_LABELS[flag] || flag}
                                        {typeof val === 'string' ? `: ${val}` : ''}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Actions */}
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {(step.actionsForProvider ?? []).map(a => (
                                    <span key={a.action} className="px-1.5 py-0.5 bg-brand-navy/10 text-brand-navy text-xs rounded">
                                      Provider: {a.label}
                                    </span>
                                  ))}
                                  {(step.actionsForPatient ?? []).map(a => (
                                    <span key={a.action} className="px-1.5 py-0.5 bg-subtle text-soft text-xs rounded">
                                      Patient: {a.label}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Transitions */}
                        <h4 className="text-xs font-semibold text-soft uppercase tracking-wider mt-4 mb-2">
                          Transitions
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {(tpl.transitions ?? []).map((tr, i) => (
                            <span key={i} className="text-xs bg-surface border border-line rounded px-2 py-1 text-soft">
                              {tr.from} <span className="text-brand-teal font-bold mx-1">→</span> {tr.to}
                              <span className="text-faint ml-1">({tr.action})</span>
                            </span>
                          ))}
                          {(!tpl.transitions || tpl.transitions.length === 0) && (
                            <span className="text-xs text-faint italic">No transitions defined.</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Library picker modal ─────────────────────────────────────── */}
      {libraryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setLibraryOpen(false)}>
          <div className="bg-surface w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-line flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-fg">Start from a template</h2>
                <p className="text-xs text-soft mt-0.5">Pick a vetted starter - we&apos;ll clone it into edit mode so you can customise the steps, actions and notifications.</p>
              </div>
              <button onClick={() => setLibraryOpen(false)} className="p-2 hover:bg-subtle rounded-lg text-soft">
                <FiX />
              </button>
            </div>

            <div className="px-5 py-3 border-b border-line">
              <input
                value={libraryFilter}
                onChange={(e) => setLibraryFilter(e.target.value)}
                placeholder="Search by name, category, provider type…"
                className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-[#0C6780] focus:border-transparent outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {library.length === 0 ? (
                <div className="py-8 text-center text-sm text-soft">Loading library…</div>
              ) : (
                <div className="space-y-2">
                  {library
                    .filter((t) => {
                      const q = libraryFilter.trim().toLowerCase()
                      if (!q) return true
                      return [t.name, t.category ?? '', t.providerType, t.serviceMode, t.description ?? '']
                        .some((v) => (v ?? '').toLowerCase().includes(q))
                    })
                    .map((t) => (
                      <button
                        key={t.id}
                        onClick={() => cloneTemplate(t)}
                        disabled={cloningId === t.id}
                        className="w-full text-left bg-subtle hover:bg-subtle border border-line rounded-xl p-3 transition-colors disabled:opacity-60"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <span className="font-semibold text-fg text-sm">{t.name}</span>
                              {t.category && <span className="text-[10px] bg-surface border border-line text-soft px-2 py-0.5 rounded-full">{t.category}</span>}
                              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{t.providerType.replace(/_/g, ' ')}</span>
                              <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{t.serviceMode}</span>
                              <span className="text-[10px] text-faint">{t.steps.length} steps</span>
                            </div>
                            {t.description && <p className="text-xs text-soft line-clamp-2">{t.description}</p>}
                          </div>
                          <FiCopy className={`text-faint flex-shrink-0 mt-1 ${cloningId === t.id ? 'animate-pulse' : ''}`} />
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t border-line text-[11px] text-soft">
              Cloning keeps the steps, actions, flags, and notifications. You can rename, edit, or delete anything before publishing.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
