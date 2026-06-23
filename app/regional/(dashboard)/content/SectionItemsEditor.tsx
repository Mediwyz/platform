'use client'

import { useState, useEffect } from 'react'
import { FaSave, FaSpinner, FaPlus, FaTrash, FaArrowUp, FaArrowDown } from 'react-icons/fa'

interface FieldConfig {
 key: string
 label: string
 type: 'text' | 'textarea' | 'select' | 'number'
 options?: string[]
}

interface SectionContent {
 title?: string
 sectionTitle?: string
 subtitle?: string
 sectionSubtitle?: string
 items?: Record<string, string | number>[]
}

interface SectionItemsEditorProps {
 sectionType: string
 data: SectionContent
 fields: FieldConfig[]
 onSave: (content: SectionContent) => Promise<void>
}

export default function SectionItemsEditor({ sectionType, data, fields, onSave }: SectionItemsEditorProps) {
 const [title, setTitle] = useState('')
 const [subtitle, setSubtitle] = useState('')
 const [items, setItems] = useState<Record<string, string | number>[]>([])
 const [saving, setSaving] = useState(false)

 useEffect(() => {
 if (data) {
 setTitle(data.title || data.sectionTitle || '')
 setSubtitle(data.subtitle || data.sectionSubtitle || '')
 setItems(data.items ? [...data.items] : [])
 }
 }, [data])

 const handleItemChange = (index: number, key: string, value: string | number) => {
 setItems((prev) => {
 const updated = [...prev]
 updated[index] = { ...updated[index], [key]: value }
 return updated
 })
 }

 const addItem = () => {
 const newItem: Record<string, string | number> = {}
 fields.forEach((f) => {
 newItem[f.key] = f.type === 'number' ? 0 : ''
 })
 setItems((prev) => [...prev, newItem])
 }

 const removeItem = (index: number) => {
 if (!confirm('Are you sure you want to remove this item?')) return
 setItems((prev) => prev.filter((_, i) => i !== index))
 }

 const moveItem = (index: number, direction: 'up' | 'down') => {
 const targetIndex = direction === 'up' ? index - 1 : index + 1
 if (targetIndex < 0 || targetIndex >= items.length) return
 setItems((prev) => {
 const updated = [...prev]
 ;[updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]]
 return updated
 })
 }

 const handleSave = async () => {
 setSaving(true)
 try {
 const content: SectionContent = { items }
 if (title) content.title = title
 if (subtitle) content.subtitle = subtitle
 await onSave(content)
 } finally {
 setSaving(false)
 }
 }

 const sectionLabel = sectionType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

 return (
 <div className="bg-surface rounded-xl shadow p-6 space-y-6">
 <div className="flex items-center justify-between">
 <h2 className="text-xl font-bold text-fg">{sectionLabel} Section</h2>
 <button
 onClick={addItem}
 className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition"
 >
 <FaPlus className="text-xs" /> Add Item
 </button>
 </div>

 {/* Section Title & Subtitle */}
 {(data?.title !== undefined || data?.sectionTitle !== undefined || title) && (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Section Title</label>
 <input
 type="text"
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="Section title"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Section Subtitle</label>
 <input
 type="text"
 value={subtitle}
 onChange={(e) => setSubtitle(e.target.value)}
 className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="Section subtitle"
 />
 </div>
 </div>
 )}

 {/* Items */}
 {items.length === 0 && (
 <div className="text-center py-10 text-soft">
 <p className="text-lg font-medium">No items yet</p>
 <p className="text-sm mt-1">Click &quot;Add Item&quot; to get started</p>
 </div>
 )}

 <div className="space-y-4">
 {items.map((item, index) => (
 <div
 key={index}
 className="p-4 bg-subtle rounded-lg border border-line"
 >
 <div className="flex items-center justify-between mb-3">
 <span className="text-sm font-semibold text-soft">
 Item {index + 1}
 </span>
 <div className="flex items-center gap-1">
 <button
 onClick={() => moveItem(index, 'up')}
 disabled={index === 0}
 className="p-1.5 bg-surface border border-line rounded hover:bg-subtle disabled:opacity-30 disabled:cursor-not-allowed transition"
 title="Move up"
 >
 <FaArrowUp className="text-xs text-soft" />
 </button>
 <button
 onClick={() => moveItem(index, 'down')}
 disabled={index === items.length - 1}
 className="p-1.5 bg-surface border border-line rounded hover:bg-subtle disabled:opacity-30 disabled:cursor-not-allowed transition"
 title="Move down"
 >
 <FaArrowDown className="text-xs text-soft" />
 </button>
 <button
 onClick={() => removeItem(index)}
 className="p-1.5 bg-red-50 border border-red-200 rounded hover:bg-red-100 text-red-600 transition ml-1"
 title="Remove item"
 >
 <FaTrash className="text-xs" />
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
 {fields.map((field) => (
 <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2 lg:col-span-3' : ''}>
 <label className="block text-xs font-medium text-soft mb-1">{field.label}</label>
 {field.type === 'textarea' ? (
 <textarea
 value={item[field.key] || ''}
 onChange={(e) => handleItemChange(index, field.key, e.target.value)}
 rows={2}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder={field.label}
 />
 ) : field.type === 'select' ? (
 <select
 value={item[field.key] || ''}
 onChange={(e) => handleItemChange(index, field.key, e.target.value)}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-surface"
 >
 <option value="">Select {field.label}</option>
 {field.options?.map((opt) => (
 <option key={opt} value={opt}>
 {opt}
 </option>
 ))}
 </select>
 ) : field.type === 'number' ? (
 <input
 type="number"
 value={item[field.key] ?? ''}
 onChange={(e) => handleItemChange(index, field.key, Number(e.target.value))}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder={field.label}
 />
 ) : (
 <input
 type="text"
 value={item[field.key] || ''}
 onChange={(e) => handleItemChange(index, field.key, e.target.value)}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder={field.label}
 />
 )}
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>

 {/* Save Button */}
 <div className="flex justify-end pt-4 border-t border-line">
 <button
 onClick={handleSave}
 disabled={saving}
 className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
 >
 {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
 {saving ? 'Saving...' : 'Save Changes'}
 </button>
 </div>
 </div>
 )
}
