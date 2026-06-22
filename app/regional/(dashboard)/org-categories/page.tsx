'use client'

/**
 * Regional admin · Organisation Categories CRUD.
 * Manages the list of organisation types (pharmacy, clinic, hospital, lab,
 * insurance, other...) used by org create/edit forms and search filters.
 */

import { useState, useEffect, useCallback } from 'react'
import { FaPlus, FaEdit, FaTrash, FaTimes, FaSpinner, FaBuilding } from 'react-icons/fa'

interface OrgCategory {
  id: string
  key: string
  label: string
  blurb: string | null
  icon: string
  displayOrder: number
  isActive: boolean
}

const emptyForm = { key: '', label: '', blurb: '', icon: 'FaBuilding', displayOrder: 100, isActive: true }

export default function OrgCategoriesPage() {
  const [cats, setCats] = useState<OrgCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCats = useCallback(async () => {
    try {
      const res = await fetch('/api/regional/org-categories', { credentials: 'include' })
      const json = await res.json()
      if (json.success) setCats(json.data)
    } catch { /* */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchCats() }, [fetchCats])

  const openCreate = () => { setEditingId(null); setForm({ ...emptyForm }); setError(null); setShowModal(true) }
  const openEdit = (c: OrgCategory) => {
    setEditingId(c.id)
    setForm({ key: c.key, label: c.label, blurb: c.blurb || '', icon: c.icon || 'FaBuilding', displayOrder: c.displayOrder, isActive: c.isActive })
    setError(null); setShowModal(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError(null)
    try {
      const url = editingId ? `/api/regional/org-categories/${editingId}` : '/api/regional/org-categories'
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed')
      setShowModal(false); fetchCats()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to save') }
    finally { setSaving(false) }
  }

  const remove = async (c: OrgCategory) => {
    if (!confirm(`Deactivate "${c.label}"?`)) return
    await fetch(`/api/regional/org-categories/${c.id}`, { method: 'DELETE', credentials: 'include' })
    fetchCats()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#001E40] flex items-center gap-2"><FaBuilding className="text-[#0C6780]" /> Organisation Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Manage the organisation types used across the platform (pharmacy, clinic, hospital, lab, insurance, other…).</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-[#0C6780] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#001E40] transition-colors">
          <FaPlus /> New category
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-gray-400"><FaSpinner className="animate-spin text-2xl" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
          {cats.map(c => (
            <div key={c.id} className={`flex items-center gap-4 px-5 py-4 ${!c.isActive ? 'opacity-50' : ''}`}>
              <span className="w-10 h-10 rounded-lg bg-[#0C6780]/10 text-[#0C6780] flex items-center justify-center font-bold text-xs flex-shrink-0">{c.displayOrder}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[#001E40]">{c.label} {!c.isActive && <span className="text-xs text-red-400">(inactive)</span>}</div>
                <div className="text-xs text-gray-400 font-mono">{c.key}{c.blurb ? ` · ${c.blurb}` : ''}</div>
              </div>
              <button onClick={() => openEdit(c)} className="p-2 text-gray-400 hover:text-[#0C6780] rounded transition"><FaEdit /></button>
              <button onClick={() => remove(c)} className="p-2 text-gray-400 hover:text-red-500 rounded transition"><FaTrash /></button>
            </div>
          ))}
          {cats.length === 0 && <p className="text-center text-gray-400 py-10 text-sm">No categories yet.</p>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={submit} className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#001E40]">{editingId ? 'Edit category' : 'New category'}</h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
            </div>
            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
                <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780] outline-none" placeholder="e.g. Pharmacy" />
              </div>
              {!editingId && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Key (auto from label if empty)</label>
                  <input value={form.key} onChange={e => setForm({ ...form, key: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-[#0C6780] outline-none" placeholder="pharmacy" />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <input value={form.blurb} onChange={e => setForm({ ...form, blurb: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780] outline-none" placeholder="Pharmacies & drugstores" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Icon (react-icons/fa)</label>
                  <input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-[#0C6780] outline-none" placeholder="FaHospital" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Order</label>
                  <input type="number" value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: parseInt(e.target.value) || 100 })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780] outline-none" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="rounded border-gray-300 text-[#0C6780] focus:ring-[#0C6780]" />
                Active
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#0C6780] text-white rounded-lg text-sm font-semibold hover:bg-[#001E40] disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <FaSpinner className="animate-spin" />} {editingId ? 'Save' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
