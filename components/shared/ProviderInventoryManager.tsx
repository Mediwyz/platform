'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDashboardUser } from '@/hooks/useDashboardUser'
import { DashboardLoadingState } from '@/components/dashboard'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiPackage, FiAlertTriangle } from 'react-icons/fi'
import DashboardPageHeader from '@/components/shared/DashboardPageHeader'
import CmsImageUpload from '@/components/shared/CmsImageUpload'
const SHOP_CATEGORIES = [
  { key: 'medicines', label: 'Medicines' }, { key: 'supplements', label: 'Supplements' },
  { key: 'equipment', label: 'Equipment' }, { key: 'personal_care', label: 'Personal Care' },
  { key: 'eyewear', label: 'Eyewear' }, { key: 'dental', label: 'Dental Products' },
  { key: 'nutrition', label: 'Nutrition Products' }, { key: 'other', label: 'Other' },
]

interface InventoryItem {
  id: string
  name: string
  genericName?: string
  category: string
  description?: string
  unitOfMeasure: string
  strength?: string
  dosageForm?: string
  price: number
  quantity: number
  minStockAlert: number
  inStock: boolean
  requiresPrescription: boolean
  isFeatured: boolean
  sideEffects: string[]
  imageUrl?: string | null
  healthcareEntityId?: string | null
  healthcareEntity?: { id: string; name: string; type: string } | null
}

interface MyOrg { id: string; name: string; type: string }

type FormData = Omit<InventoryItem, 'id' | 'inStock' | 'healthcareEntity'>

const defaultForm: FormData = {
  name: '', genericName: '', category: '', description: '', unitOfMeasure: 'unit',
  strength: '', dosageForm: '', price: 0, quantity: 0, minStockAlert: 5,
  requiresPrescription: false, isFeatured: false, sideEffects: [], imageUrl: '', healthcareEntityId: '',
}

export default function ProviderInventoryManager() {
  const user = useDashboardUser()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [myOrgs, setMyOrgs] = useState<MyOrg[]>([])

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory', { credentials: 'include' })
      const data = await res.json()
      if (data.success) setItems(data.data)
    } catch { /* */ }
    finally { setLoading(false) }
  }, [])

  // Organisations this provider can sell under (owned + member-of). The form's
  // "Sell as" selector lets them attribute an item to a pharmacy/clinic they
  // belong to, or to themselves as an individual.
  const fetchMyOrgs = useCallback(async () => {
    try {
      const res = await fetch('/api/organizations/mine', { credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        const owned: MyOrg[] = (data.data.owned ?? []).map((o: any) => ({ id: o.id, name: o.name, type: o.type }))
        const member: MyOrg[] = (data.data.member ?? []).map((o: any) => ({ id: o.id, name: o.name, type: o.type }))
        // Dedupe by id (a founder is also a member)
        const byId = new Map<string, MyOrg>()
        for (const o of [...owned, ...member]) byId.set(o.id, o)
        setMyOrgs(Array.from(byId.values()))
      }
    } catch { /* selector simply omits orgs on failure */ }
  }, [])

  useEffect(() => { fetchItems(); fetchMyOrgs() }, [fetchItems, fetchMyOrgs])

  if (!user) return <DashboardLoadingState />

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  )

  const lowStock = items.filter(i => i.quantity > 0 && i.quantity <= i.minStockAlert)
  const outOfStock = items.filter(i => !i.inStock || i.quantity <= 0)

  function openCreate() {
    setEditId(null)
    setForm(defaultForm)
    setShowModal(true)
  }

  function openEdit(item: InventoryItem) {
    setEditId(item.id)
    setForm({ ...item, healthcareEntityId: item.healthcareEntityId ?? '' })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name || !form.category || form.price <= 0) {
      setMsg({ type: 'error', text: 'Name, category, and price are required' })
      return
    }
    setSaving(true)
    setMsg(null)
    try {
      const url = editId ? `/api/inventory/${editId}` : '/api/inventory'
      const method = editId ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form), credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setMsg({ type: 'success', text: editId ? 'Item updated' : 'Item added' })
        setShowModal(false)
        fetchItems()
      } else {
        setMsg({ type: 'error', text: data.message || 'Failed to save' })
      }
    } catch {
      setMsg({ type: 'error', text: 'Network error' })
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE', credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setItems(items.filter(i => i.id !== id))
        setMsg({ type: 'success', text: 'Item deleted' })
      }
    } catch { setMsg({ type: 'error', text: 'Failed to delete' }) }
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        icon={FiPackage}
        title="My Inventory"
        description={`${items.length} item${items.length !== 1 ? 's' : ''}  sell products to patients via the Health Shop`}
        actions={
          <button onClick={openCreate} className="bg-brand-navy hover:bg-brand-teal text-white px-4 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition">
            <FiPlus className="w-4 h-4" /> Add Item
          </button>
        }
      />

      {msg && (
        <div className={`p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.text}
        </div>
      )}

      {/* Stats */}
      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="flex gap-3">
          {lowStock.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              <FiAlertTriangle className="w-4 h-4" /> {lowStock.length} low stock
            </div>
          )}
          {outOfStock.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <FiPackage className="w-4 h-4" /> {outOfStock.length} out of stock
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-faint w-4 h-4" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items..."
          className="w-full pl-10 pr-4 py-2.5 border border-line rounded-lg text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal" />
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-faint">
          <FiPackage className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No items yet. Add your first product to sell on the Health Shop.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="bg-surface rounded-xl p-4 border border-line hover:shadow-md transition">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-fg text-sm truncate">{item.name}</h3>
                  <span className="text-xs text-soft">{item.category}</span>
                  {item.healthcareEntity && (
                    <span className="block text-[11px] text-brand-teal font-medium truncate">via {item.healthcareEntity.name}</span>
                  )}
                </div>
                <div className="flex gap-1 ml-2">
                  <button onClick={() => openEdit(item)} className="p-1.5 text-faint hover:text-brand-teal rounded transition"><FiEdit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(item.id, item.name)} className="p-1.5 text-faint hover:text-red-500 rounded transition"><FiTrash2 className="w-4 h-4" /></button>
                </div>
              </div>
              {item.description && <p className="text-xs text-soft mb-2 line-clamp-2">{item.description}</p>}
              <div className="flex items-center justify-between pt-2 border-t border-line">
                <span className="text-lg font-bold text-fg">Rs {item.price.toLocaleString()}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    item.quantity <= 0 ? 'bg-red-100 text-red-700' :
                    item.quantity <= item.minStockAlert ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {item.quantity <= 0 ? 'Out of stock' : `${item.quantity} ${item.unitOfMeasure}`}
                  </span>
                  {item.requiresPrescription && <span className="text-xs px-1.5 py-0.5 bg-pink-100 text-pink-700 rounded">Rx</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold text-fg">{editId ? 'Edit Item' : 'Add New Item'}</h2>
              <button onClick={() => setShowModal(false)} className="text-faint hover:text-soft"><FiX className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-soft block mb-1">Product Name *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-teal" />
                </div>
                <div>
                  <label className="text-xs font-medium text-soft block mb-1">Category *</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-teal">
                    <option value="">Select</option>
                    {SHOP_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-soft block mb-1">Unit of Measure</label>
                  <select value={form.unitOfMeasure} onChange={(e) => setForm({ ...form, unitOfMeasure: e.target.value })} className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-teal">
                    {['unit', 'box', 'bottle', 'pair', 'pack', 'tube', 'ml', 'mg', 'kg'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-soft block mb-1">Price (Rs) *</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-teal" />
                </div>
                <div>
                  <label className="text-xs font-medium text-soft block mb-1">Quantity in Stock</label>
                  <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })} className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-teal" />
                </div>
                <div>
                  <label className="text-xs font-medium text-soft block mb-1">Low Stock Alert At</label>
                  <input type="number" value={form.minStockAlert} onChange={(e) => setForm({ ...form, minStockAlert: parseInt(e.target.value) || 5 })} className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-teal" />
                </div>
                <div>
                  <label className="text-xs font-medium text-soft block mb-1">Strength (optional)</label>
                  <input type="text" value={form.strength || ''} onChange={(e) => setForm({ ...form, strength: e.target.value })} placeholder="e.g. 500mg" className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-teal" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-soft block mb-1">Description</label>
                  <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-teal" />
                </div>
                <div className="col-span-2">
                  <CmsImageUpload
                    value={form.imageUrl || ''}
                    onChange={(url) => setForm({ ...form, imageUrl: url })}
                    label="Product photo"
                  />
                  <p className="text-[11px] text-faint mt-1">
                    Upload a real photo of the product (the box, bottle or device). Shown on the Health Shop card.
                  </p>
                </div>
                {myOrgs.length > 0 && (
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-soft block mb-1">Sell as</label>
                    <select
                      value={form.healthcareEntityId || ''}
                      onChange={(e) => setForm({ ...form, healthcareEntityId: e.target.value })}
                      className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-teal"
                    >
                      <option value="">Myself ({user.firstName} {user.lastName})</option>
                      {myOrgs.map(o => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                    <p className="text-[11px] text-faint mt-1">
                      The Health Shop shows this item as sold by the chosen seller.
                    </p>
                  </div>
                )}
                <div className="col-span-2 flex gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.requiresPrescription} onChange={(e) => setForm({ ...form, requiresPrescription: e.target.checked })} className="rounded border-line text-brand-teal focus:ring-brand-teal" />
                    Requires Prescription
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="rounded border-line text-brand-teal focus:ring-brand-teal" />
                    Featured in Health Shop
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-soft bg-subtle hover:bg-line rounded-lg transition">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-brand-navy hover:bg-brand-teal rounded-lg transition disabled:opacity-50">
                {saving ? 'Saving...' : editId ? 'Update' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
