'use client'

import { useState, useEffect } from 'react'
import { FaSave, FaSpinner, FaPlus, FaTrash, FaArrowUp, FaArrowDown } from 'react-icons/fa'

interface ServiceItem {
 emoji: string
 title: string
 subtitle: string
 description: string
}

interface DetailedServicesContent {
 sectionTitle: string
 sectionSubtitle: string
 items: ServiceItem[]
 ctaTitle: string
 ctaDescription: string
 ctaPrimaryButton: string
 ctaSecondaryButton: string
}

interface DetailedServicesEditorProps {
 data: Partial<DetailedServicesContent>
 onSave: (content: DetailedServicesContent) => Promise<void>
}

export default function DetailedServicesEditor({ data, onSave }: DetailedServicesEditorProps) {
 const [formData, setFormData] = useState<DetailedServicesContent>({
 sectionTitle: '',
 sectionSubtitle: '',
 items: [],
 ctaTitle: '',
 ctaDescription: '',
 ctaPrimaryButton: '',
 ctaSecondaryButton: '',
 })
 const [saving, setSaving] = useState(false)

 useEffect(() => {
 if (data) {
 setFormData({
 sectionTitle: data.sectionTitle || '',
 sectionSubtitle: data.sectionSubtitle || '',
 items: data.items ? [...data.items] : [],
 ctaTitle: data.ctaTitle || '',
 ctaDescription: data.ctaDescription || '',
 ctaPrimaryButton: data.ctaPrimaryButton || '',
 ctaSecondaryButton: data.ctaSecondaryButton || '',
 })
 }
 }, [data])

 const handleChange = (field: keyof DetailedServicesContent, value: string) => {
 setFormData((prev) => ({ ...prev, [field]: value }))
 }

 const handleItemChange = (index: number, field: keyof ServiceItem, value: string) => {
 setFormData((prev) => {
 const updated = [...prev.items]
 updated[index] = { ...updated[index], [field]: value }
 return { ...prev, items: updated }
 })
 }

 const addItem = () => {
 setFormData((prev) => ({
 ...prev,
 items: [...prev.items, { emoji: '', title: '', subtitle: '', description: '' }],
 }))
 }

 const removeItem = (index: number) => {
 if (!confirm('Are you sure you want to remove this service item?')) return
 setFormData((prev) => ({
 ...prev,
 items: prev.items.filter((_, i) => i !== index),
 }))
 }

 const moveItem = (index: number, direction: 'up' | 'down') => {
 const targetIndex = direction === 'up' ? index - 1 : index + 1
 if (targetIndex < 0 || targetIndex >= formData.items.length) return
 setFormData((prev) => {
 const updated = [...prev.items]
 ;[updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]]
 return { ...prev, items: updated }
 })
 }

 const handleSave = async () => {
 setSaving(true)
 try {
 await onSave(formData)
 } finally {
 setSaving(false)
 }
 }

 return (
 <div className="bg-surface rounded-xl shadow p-6 space-y-6">
 <div className="flex items-center justify-between">
 <h2 className="text-xl font-bold text-fg">Detailed Services Section</h2>
 <button
 onClick={addItem}
 className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition"
 >
 <FaPlus className="text-xs" /> Add Service
 </button>
 </div>

 {/* Section Header */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Section Title</label>
 <input
 type="text"
 value={formData.sectionTitle}
 onChange={(e) => handleChange('sectionTitle', e.target.value)}
 className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="Section title"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Section Subtitle</label>
 <textarea
 value={formData.sectionSubtitle}
 onChange={(e) => handleChange('sectionSubtitle', e.target.value)}
 rows={2}
 className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="Section subtitle"
 />
 </div>
 </div>

 {/* Service Items */}
 {formData.items.length === 0 && (
 <div className="text-center py-10 text-soft">
 <p className="text-lg font-medium">No service items yet</p>
 <p className="text-sm mt-1">Click &quot;Add Service&quot; to get started</p>
 </div>
 )}

 <div className="space-y-4">
 {formData.items.map((item, index) => (
 <div key={index} className="p-4 bg-subtle rounded-lg border border-line">
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-2">
 {item.emoji && <span className="text-2xl">{item.emoji}</span>}
 <span className="text-sm font-semibold text-soft">
 Service {index + 1}{item.title && `: ${item.title}`}
 </span>
 </div>
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
 disabled={index === formData.items.length - 1}
 className="p-1.5 bg-surface border border-line rounded hover:bg-subtle disabled:opacity-30 disabled:cursor-not-allowed transition"
 title="Move down"
 >
 <FaArrowDown className="text-xs text-soft" />
 </button>
 <button
 onClick={() => removeItem(index)}
 className="p-1.5 bg-red-50 border border-red-200 rounded hover:bg-red-100 text-red-600 transition ml-1"
 title="Remove service"
 >
 <FaTrash className="text-xs" />
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-medium text-soft mb-1">Emoji</label>
 <input
 type="text"
 value={item.emoji}
 onChange={(e) => handleItemChange(index, 'emoji', e.target.value)}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="e.g., \uD83C\uDFE5"
 />
 </div>
 <div>
 <label className="block text-xs font-medium text-soft mb-1">Title</label>
 <input
 type="text"
 value={item.title}
 onChange={(e) => handleItemChange(index, 'title', e.target.value)}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="Service title"
 />
 </div>
 <div>
 <label className="block text-xs font-medium text-soft mb-1">Subtitle</label>
 <input
 type="text"
 value={item.subtitle}
 onChange={(e) => handleItemChange(index, 'subtitle', e.target.value)}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="Service subtitle"
 />
 </div>
 <div className="md:col-span-2">
 <label className="block text-xs font-medium text-soft mb-1">Description</label>
 <textarea
 value={item.description}
 onChange={(e) => handleItemChange(index, 'description', e.target.value)}
 rows={2}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="Service description"
 />
 </div>
 </div>
 </div>
 ))}
 </div>

 {/* CTA Section */}
 <div className="border-t border-line pt-6">
 <h3 className="text-lg font-semibold text-fg mb-4">Call to Action</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-soft mb-1">CTA Title</label>
 <input
 type="text"
 value={formData.ctaTitle}
 onChange={(e) => handleChange('ctaTitle', e.target.value)}
 className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="CTA title"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-soft mb-1">CTA Description</label>
 <textarea
 value={formData.ctaDescription}
 onChange={(e) => handleChange('ctaDescription', e.target.value)}
 rows={2}
 className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="CTA description"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Primary Button Text</label>
 <input
 type="text"
 value={formData.ctaPrimaryButton}
 onChange={(e) => handleChange('ctaPrimaryButton', e.target.value)}
 className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="e.g., Get Started"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Secondary Button Text</label>
 <input
 type="text"
 value={formData.ctaSecondaryButton}
 onChange={(e) => handleChange('ctaSecondaryButton', e.target.value)}
 className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="e.g., Learn More"
 />
 </div>
 </div>
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
