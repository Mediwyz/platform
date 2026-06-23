'use client'

import { useState, useEffect } from 'react'
import { FaSave, FaSpinner, FaPlus, FaTrash } from 'react-icons/fa'

interface CtaButton {
 icon: string
 label: string
 shortLabel: string
}

interface HeroContent {
 mainTitle: string
 highlightWord: string
 subtitle: string
 platformBadge: string
 searchPlaceholder: string
 ctaButtons: CtaButton[]
}

interface HeroSectionEditorProps {
 data: Partial<HeroContent>
 onSave: (content: HeroContent) => Promise<void>
}

export default function HeroSectionEditor({ data, onSave }: HeroSectionEditorProps) {
 const [formData, setFormData] = useState<HeroContent>({
 mainTitle: '',
 highlightWord: '',
 subtitle: '',
 platformBadge: '',
 searchPlaceholder: '',
 ctaButtons: [],
 })
 const [saving, setSaving] = useState(false)

 useEffect(() => {
 if (data) {
 setFormData({
 mainTitle: data.mainTitle || '',
 highlightWord: data.highlightWord || '',
 subtitle: data.subtitle || '',
 platformBadge: data.platformBadge || '',
 searchPlaceholder: data.searchPlaceholder || '',
 ctaButtons: data.ctaButtons || [],
 })
 }
 }, [data])

 const handleChange = (field: keyof HeroContent, value: string) => {
 setFormData((prev) => ({ ...prev, [field]: value }))
 }

 const handleCtaChange = (index: number, field: keyof CtaButton, value: string) => {
 setFormData((prev) => {
 const updated = [...prev.ctaButtons]
 updated[index] = { ...updated[index], [field]: value }
 return { ...prev, ctaButtons: updated }
 })
 }

 const addCtaButton = () => {
 setFormData((prev) => ({
 ...prev,
 ctaButtons: [...prev.ctaButtons, { icon: '', label: '', shortLabel: '' }],
 }))
 }

 const removeCtaButton = (index: number) => {
 if (!confirm('Remove this CTA button?')) return
 setFormData((prev) => ({
 ...prev,
 ctaButtons: prev.ctaButtons.filter((_, i) => i !== index),
 }))
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
 <h2 className="text-xl font-bold text-fg">Hero Section</h2>

 {/* Main Title */}
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Main Title</label>
 <input
 type="text"
 value={formData.mainTitle}
 onChange={(e) => handleChange('mainTitle', e.target.value)}
 className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="Enter main title"
 />
 </div>

 {/* Highlight Word */}
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Highlight Word</label>
 <input
 type="text"
 value={formData.highlightWord}
 onChange={(e) => handleChange('highlightWord', e.target.value)}
 className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="Word to highlight in the title"
 />
 <p className="text-xs text-soft mt-1">This word will be styled differently in the title</p>
 </div>

 {/* Subtitle */}
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Subtitle</label>
 <textarea
 value={formData.subtitle}
 onChange={(e) => handleChange('subtitle', e.target.value)}
 rows={3}
 className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="Enter subtitle text"
 />
 </div>

 {/* Platform Badge */}
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Platform Badge</label>
 <input
 type="text"
 value={formData.platformBadge}
 onChange={(e) => handleChange('platformBadge', e.target.value)}
 className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="e.g., #1 Digital Health Platform"
 />
 </div>

 {/* Search Placeholder */}
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Search Placeholder</label>
 <input
 type="text"
 value={formData.searchPlaceholder}
 onChange={(e) => handleChange('searchPlaceholder', e.target.value)}
 className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="Search bar placeholder text"
 />
 </div>

 {/* CTA Buttons */}
 <div>
 <div className="flex items-center justify-between mb-3">
 <label className="block text-sm font-medium text-soft">CTA Buttons</label>
 <button
 onClick={addCtaButton}
 className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
 >
 <FaPlus className="text-xs" /> Add Button
 </button>
 </div>

 {formData.ctaButtons.length === 0 && (
 <p className="text-sm text-soft italic">No CTA buttons configured. Click &quot;Add Button&quot; to add one.</p>
 )}

 <div className="space-y-3">
 {formData.ctaButtons.map((btn, index) => (
 <div key={index} className="flex gap-3 items-start p-4 bg-subtle rounded-lg border border-line">
 <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
 <div>
 <label className="block text-xs font-medium text-soft mb-1">Icon</label>
 <input
 type="text"
 value={btn.icon}
 onChange={(e) => handleCtaChange(index, 'icon', e.target.value)}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="e.g., FaVideo"
 />
 </div>
 <div>
 <label className="block text-xs font-medium text-soft mb-1">Label</label>
 <input
 type="text"
 value={btn.label}
 onChange={(e) => handleCtaChange(index, 'label', e.target.value)}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="Button label"
 />
 </div>
 <div>
 <label className="block text-xs font-medium text-soft mb-1">Short Label</label>
 <input
 type="text"
 value={btn.shortLabel}
 onChange={(e) => handleCtaChange(index, 'shortLabel', e.target.value)}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="Mobile label"
 />
 </div>
 </div>
 <button
 onClick={() => removeCtaButton(index)}
 className="p-2 text-red-500 hover:bg-red-50 rounded-lg mt-5"
 title="Remove button"
 >
 <FaTrash />
 </button>
 </div>
 ))}
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
