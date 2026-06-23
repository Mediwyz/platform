'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { FiArrowLeft, FiInbox, FiCheckCircle, FiXCircle, FiClock, FiUser, FiChevronDown, FiChevronUp } from 'react-icons/fi'

interface Suggestion {
  id: string
  name: string
  slug: string
  providerType: string
  serviceMode: string
  description: string | null
  suggestionStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  suggestionNote: string | null
  suggestedAt: string | null
  suggestedByProviderId: string | null
  steps: Array<{ order: number; statusCode: string; label: string }>
}

const STATUS_CONFIG = {
  PENDING:  { label: 'Pending review', bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  icon: FiClock },
  APPROVED: { label: 'Approved',       bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  icon: FiCheckCircle },
  REJECTED: { label: 'Rejected',       bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    icon: FiXCircle },
} as const

export default function WorkflowSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | ''>('PENDING')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [noteMap, setNoteMap] = useState<Record<string, string>>({})

  const fetchSuggestions = useCallback(async () => {
    setLoading(true)
    try {
      const params = filter ? `?status=${filter}` : ''
      const res = await fetch(`/api/workflow/suggestions${params}`, { credentials: 'include' })
      const json = await res.json()
      if (json.success) setSuggestions(json.data || [])
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { fetchSuggestions() }, [fetchSuggestions])

  async function review(id: string, action: 'approve' | 'reject') {
    setBusyId(id)
    try {
      const res = await fetch(`/api/workflow/suggestions/${id}/review`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: noteMap[id] || undefined }),
      })
      const json = await res.json()
      if (json.success) {
        setSuggestions(prev => prev.filter(s => s.id !== id))
      }
    } finally {
      setBusyId(null)
    }
  }

  const pending = suggestions.filter(s => s.suggestionStatus === 'PENDING')

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/regional/workflows" className="p-2 hover:bg-subtle rounded-lg text-soft">
          <FiArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
            <FiInbox className="text-brand-teal" />
            Workflow Suggestions
          </h1>
          <p className="text-sm text-soft mt-0.5">
            Providers can propose custom workflows for you to review and approve.
            Approved suggestions become active templates for that provider type.
          </p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        {(['PENDING', 'APPROVED', 'REJECTED', ''] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-lg border font-medium transition ${
              filter === s
                ? 'bg-brand-navy text-white border-brand-navy'
                : 'bg-surface text-soft border-line hover:bg-subtle'
            }`}
          >
            {s === '' ? 'All' : s === 'PENDING' ? `Pending (${pending.length})` : s[0] + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-surface rounded-xl border border-line animate-pulse" />
          ))}
        </div>
      )}

      {!loading && suggestions.length === 0 && (
        <div className="bg-surface rounded-xl border border-line p-10 text-center">
          <FiCheckCircle className="text-4xl text-green-300 mx-auto mb-3" />
          <p className="font-medium text-soft">No suggestions here</p>
          <p className="text-sm text-faint mt-1">
            When providers suggest a workflow, it will appear here for your review.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {suggestions.map(s => {
          const cfg = STATUS_CONFIG[s.suggestionStatus]
          const Icon = cfg.icon
          const isExpanded = expandedId === s.id

          return (
            <div key={s.id} className={`bg-surface rounded-xl border ${cfg.border} overflow-hidden`}>
              <div
                className="flex items-start justify-between gap-3 p-4 cursor-pointer hover:bg-subtle"
                onClick={() => setExpandedId(isExpanded ? null : s.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-fg">{s.name}</h3>
                    <span className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text}`}>
                      <Icon className="w-3 h-3" /> {cfg.label}
                    </span>
                    <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                      {s.providerType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">
                      {s.serviceMode}
                    </span>
                    <span className="text-xs text-faint">{s.steps.length} steps</span>
                  </div>
                  {s.description && (
                    <p className="text-sm text-soft">{s.description}</p>
                  )}
                  <p className="text-[11px] text-faint mt-1 flex items-center gap-1">
                    <FiUser className="w-3 h-3" />
                    Submitted {s.suggestedAt ? new Date(s.suggestedAt).toLocaleDateString() : ' - '}
                  </p>
                  {s.suggestionNote && (
                    <p className="text-xs text-soft mt-1 italic">Note: {s.suggestionNote}</p>
                  )}
                </div>
                {isExpanded ? <FiChevronUp className="text-faint flex-shrink-0 mt-1" /> : <FiChevronDown className="text-faint flex-shrink-0 mt-1" />}
              </div>

              {isExpanded && (
                <div className="border-t border-line p-4 bg-subtle space-y-4">
                  {/* Steps preview */}
                  <div>
                    <p className="text-xs font-semibold text-soft uppercase tracking-wider mb-2">Steps</p>
                    <div className="flex flex-wrap gap-2">
                      {s.steps.sort((a, b) => a.order - b.order).map((step, i) => (
                        <div key={step.statusCode} className="flex items-center gap-1.5">
                          {i > 0 && <span className="text-faint text-xs">→</span>}
                          <span className="text-xs bg-surface border border-line rounded px-2 py-1 text-soft">
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Review action (only for pending) */}
                  {s.suggestionStatus === 'PENDING' && (
                    <div className="space-y-2">
                      <textarea
                        value={noteMap[s.id] || ''}
                        onChange={e => setNoteMap(prev => ({ ...prev, [s.id]: e.target.value }))}
                        placeholder="Optional note for the provider (reason for approval/rejection)…"
                        rows={2}
                        className="w-full text-sm border border-line rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-teal focus:border-transparent outline-none resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => review(s.id, 'approve')}
                          disabled={busyId === s.id}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                        >
                          <FiCheckCircle className="w-3.5 h-3.5" />
                          {busyId === s.id ? 'Processing…' : 'Approve & activate'}
                        </button>
                        <button
                          onClick={() => review(s.id, 'reject')}
                          disabled={busyId === s.id}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
                        >
                          <FiXCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
