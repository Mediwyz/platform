'use client'

import { useState, useEffect, useCallback } from 'react'
import { FaPlus, FaTrash, FaCheck, FaBan, FaEdit, FaBook } from 'react-icons/fa'

/**
 * Regional admin CRUD for the AI assistant's clinical knowledge base.
 * Each row maps a condition → one-line dietary guidance that gets
 * injected into the AI prompt when a user has the condition on file.
 * Any mutation triggers backend cache invalidation so the next AI call
 * picks up the change.
 */
interface Entry {
  id: string
  conditionKey: string
  aliases: string[]
  dietaryGuidance: string
  category: string
  sources: string[]
  active: boolean
  updatedAt: string
  createdAt: string
}

const CATEGORIES = ['nutrition', 'exercise', 'mental-health', 'medication', 'other'] as const

const EMPTY_DRAFT: Omit<Entry, 'id' | 'updatedAt' | 'createdAt'> = {
  conditionKey: '', aliases: [], dietaryGuidance: '', category: 'nutrition', sources: [], active: true,
}

export default function ClinicalKnowledgePage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<Omit<Entry, 'id' | 'updatedAt' | 'createdAt'>>(EMPTY_DRAFT)
  const [saving, setSaving] = useState(false)

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const res = await fetch('/api/admin/clinical-knowledge', { credentials: 'include' })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to load')
      setEntries(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  async function save() {
    setSaving(true)
    try {
      const url = editingId
        ? `/api/admin/clinical-knowledge/${editingId}`
        : '/api/admin/clinical-knowledge'
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method, credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Save failed')
      setCreating(false); setEditingId(null); setDraft(EMPTY_DRAFT)
      await fetchEntries()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Save failed')
    } finally { setSaving(false) }
  }

  async function toggleActive(entry: Entry) {
    await fetch(`/api/admin/clinical-knowledge/${entry.id}`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !entry.active }),
    })
    fetchEntries()
  }

  async function remove(entry: Entry) {
    if (!confirm(`Delete "${entry.conditionKey}"? This affects the AI's responses for users with that condition.`)) return
    await fetch(`/api/admin/clinical-knowledge/${entry.id}`, { method: 'DELETE', credentials: 'include' })
    fetchEntries()
  }

  function startEdit(entry: Entry) {
    setEditingId(entry.id)
    setCreating(true)
    setDraft({
      conditionKey: entry.conditionKey, aliases: entry.aliases,
      dietaryGuidance: entry.dietaryGuidance, category: entry.category,
      sources: entry.sources, active: entry.active,
    })
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
      <header className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><FaBook /></div>
          <div>
            <h1 className="text-2xl font-bold text-fg">AI Clinical Knowledge</h1>
            <p className="text-sm text-soft mt-1">
              One-line dietary / wellness guidance the AI injects when a user has the matching condition.
              Keep lines under 200 chars - prompt has a 4KB soft budget.
            </p>
          </div>
        </div>
        {!creating && (
          <button
            onClick={() => { setDraft(EMPTY_DRAFT); setCreating(true); setEditingId(null) }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold bg-[#0C6780] hover:bg-[#001E40] text-white px-4 py-2 rounded-lg"
          >
            <FaPlus /> Add entry
          </button>
        )}
      </header>

      {creating && (
        <section className="bg-surface border border-line rounded-xl p-4 sm:p-5 space-y-3">
          <h2 className="text-sm font-semibold text-fg">{editingId ? 'Edit entry' : 'New entry'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-soft mb-1">Condition key</label>
              <input
                value={draft.conditionKey}
                onChange={(e) => setDraft({ ...draft, conditionKey: e.target.value })}
                placeholder="e.g. diabetes"
                className="w-full text-sm border border-line rounded-lg px-2 py-1.5"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase text-soft mb-1">Category</label>
              <select
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                className="w-full text-sm border border-line rounded-lg px-2 py-1.5 bg-surface"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase text-soft mb-1">Aliases (comma separated)</label>
            <input
              value={draft.aliases.join(', ')}
              onChange={(e) => setDraft({ ...draft, aliases: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
              placeholder="diabetic, type 2 diabetes, t2dm"
              className="w-full text-sm border border-line rounded-lg px-2 py-1.5"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase text-soft mb-1">
              Dietary / wellness guidance ({draft.dietaryGuidance.length}/200)
            </label>
            <textarea
              value={draft.dietaryGuidance}
              onChange={(e) => setDraft({ ...draft, dietaryGuidance: e.target.value })}
              rows={2} maxLength={200}
              placeholder="Diabetes: low-GI foods, limit added sugars, emphasise fibre-rich veg…"
              className="w-full text-sm border border-line rounded-lg p-2"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase text-soft mb-1">Sources (comma separated, optional)</label>
            <input
              value={draft.sources.join(', ')}
              onChange={(e) => setDraft({ ...draft, sources: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
              placeholder="ADA 2024 Standards of Care, NIH DASH Diet"
              className="w-full text-sm border border-line rounded-lg px-2 py-1.5"
            />
          </div>
          <div className="flex items-center justify-between gap-2 pt-2">
            <label className="flex items-center gap-2 text-xs text-soft">
              <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
              Active (included in AI prompts)
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => { setCreating(false); setEditingId(null); setDraft(EMPTY_DRAFT) }}
                className="px-3 py-1.5 text-sm text-soft hover:bg-subtle rounded-lg"
                disabled={saving}
              >Cancel</button>
              <button
                onClick={save}
                disabled={saving || !draft.conditionKey || !draft.dietaryGuidance}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold bg-[#0C6780] hover:bg-[#001E40] text-white rounded-lg disabled:opacity-50"
              ><FaCheck /> {saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </section>
      )}

      {loading ? (
        <div className="bg-surface border border-line rounded-xl p-8 text-center text-sm text-soft">Loading…</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm">{error}</div>
      ) : entries.length === 0 ? (
        <div className="bg-surface border border-dashed border-line rounded-xl p-8 text-center text-sm text-soft">
          No entries yet. Add one so the AI can tailor its responses to users with that condition.
        </div>
      ) : (
        <section className="bg-surface border border-line rounded-xl overflow-hidden">
          <ul className="divide-y divide-line">
            {entries.map((entry) => (
              <li key={entry.id} className={`p-4 ${!entry.active ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-fg">{entry.conditionKey}</span>
                      <span className="text-[10px] font-medium bg-subtle text-soft px-2 py-0.5 rounded-full">{entry.category}</span>
                      {!entry.active && <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">inactive</span>}
                    </div>
                    {entry.aliases.length > 0 && (
                      <div className="text-[11px] text-soft mb-1">aliases: {entry.aliases.join(', ')}</div>
                    )}
                    <p className="text-sm text-fg">{entry.dietaryGuidance}</p>
                    {entry.sources.length > 0 && (
                      <div className="text-[11px] text-soft mt-1">Sources: {entry.sources.join(', ')}</div>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => toggleActive(entry)} className="p-2 hover:bg-subtle rounded-lg text-soft" title={entry.active ? 'Deactivate' : 'Activate'}>
                      {entry.active ? <FaBan /> : <FaCheck />}
                    </button>
                    <button onClick={() => startEdit(entry)} className="p-2 hover:bg-subtle rounded-lg text-soft" title="Edit">
                      <FaEdit />
                    </button>
                    <button onClick={() => remove(entry)} className="p-2 hover:bg-red-50 rounded-lg text-red-600" title="Delete">
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="text-[11px] text-soft pt-1">
        Changes apply on the next AI chat - the service cache refreshes automatically.
      </footer>
    </div>
  )
}
