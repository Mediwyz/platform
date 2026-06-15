'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { FiArrowLeft, FiSend, FiCheckCircle, FiXCircle, FiClock, FiPlus } from 'react-icons/fi'

interface Suggestion {
  id: string
  name: string
  serviceMode: string
  description: string | null
  suggestionStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  suggestionNote: string | null
  suggestedAt: string | null
  steps: Array<{ order: number; statusCode: string; label: string }>
}

const STATUS_CONFIG = {
  PENDING:  { label: 'Pending review', bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  icon: FiClock },
  APPROVED: { label: 'Approved',       bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  icon: FiCheckCircle },
  REJECTED: { label: 'Rejected',       bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    icon: FiXCircle },
} as const

export default function MyWorkflowSuggestionsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | ''>('')

  useEffect(() => {
    setLoading(true)
    const params = filter ? `?status=${filter}` : ''
    fetch(`/api/workflow/suggestions${params}`, { credentials: 'include' })
      .then(r => r.json())
      .then(json => { if (json.success) setSuggestions(json.data || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filter])

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/provider/${slug}/workflows`} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <FiArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">My Suggestions</h1>
          <p className="text-sm text-gray-500">Track the status of workflows you submitted for admin review.</p>
        </div>
        <Link
          href={`/provider/${slug}/workflows/suggest`}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
        >
          <FiPlus className="w-4 h-4" /> New suggestion
        </Link>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {([''  , 'PENDING', 'APPROVED', 'REJECTED'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-lg border font-medium transition ${
              filter === s
                ? 'bg-brand-navy text-white border-brand-navy'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s === '' ? 'All' : s[0] + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal" />
        </div>
      ) : suggestions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FiSend className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-600">No suggestions yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">
            Suggest a custom workflow to your regional admin - they&apos;ll review and activate it for you.
          </p>
          <Link
            href={`/provider/${slug}/workflows/suggest`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-lg text-sm font-medium hover:bg-brand-teal/90"
          >
            <FiPlus className="w-4 h-4" /> Suggest a workflow
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map(s => {
            const cfg = STATUS_CONFIG[s.suggestionStatus]
            const Icon = cfg.icon
            return (
              <div key={s.id} className={`bg-white rounded-xl border ${cfg.border} p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-gray-900">{s.name}</h3>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${cfg.bg} ${cfg.text}`}>
                        <Icon className="w-3 h-3" /> {cfg.label}
                      </span>
                      <span className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">{s.serviceMode}</span>
                    </div>
                    {s.description && <p className="text-sm text-gray-600 mb-2">{s.description}</p>}
                    <div className="flex flex-wrap gap-1.5">
                      {s.steps?.sort((a, b) => a.order - b.order).map((step, i) => (
                        <div key={step.statusCode} className="flex items-center gap-1">
                          {i > 0 && <span className="text-gray-300 text-xs">→</span>}
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{step.label}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Submitted {s.suggestedAt ? new Date(s.suggestedAt).toLocaleDateString() : ' - '}
                    </p>
                  </div>
                </div>
                {s.suggestionNote && (
                  <div className={`mt-3 pt-3 border-t ${cfg.border}`}>
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Admin note</p>
                    <p className="text-sm text-gray-700 italic">{s.suggestionNote}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
