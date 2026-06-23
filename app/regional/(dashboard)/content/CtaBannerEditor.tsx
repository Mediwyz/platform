'use client'

import { useState, useEffect } from 'react'
import { FaSave, FaSpinner } from 'react-icons/fa'

interface CtaBannerContent {
 title: string
 description: string
 primaryButton: string
 secondaryButton: string
}

interface CtaBannerEditorProps {
 data: Partial<CtaBannerContent>
 onSave: (content: CtaBannerContent) => Promise<void>
}

export default function CtaBannerEditor({ data, onSave }: CtaBannerEditorProps) {
 const [formData, setFormData] = useState<CtaBannerContent>({
 title: '',
 description: '',
 primaryButton: '',
 secondaryButton: '',
 })
 const [saving, setSaving] = useState(false)

 useEffect(() => {
 if (data) {
 setFormData({
 title: data.title || '',
 description: data.description || '',
 primaryButton: data.primaryButton || '',
 secondaryButton: data.secondaryButton || '',
 })
 }
 }, [data])

 const handleChange = (field: keyof CtaBannerContent, value: string) => {
 setFormData((prev) => ({ ...prev, [field]: value }))
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
 <h2 className="text-xl font-bold text-fg">CTA Banner Section</h2>

 {/* Title */}
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Title</label>
 <input
 type="text"
 value={formData.title}
 onChange={(e) => handleChange('title', e.target.value)}
 className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="CTA banner title"
 />
 </div>

 {/* Description */}
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Description</label>
 <textarea
 value={formData.description}
 onChange={(e) => handleChange('description', e.target.value)}
 rows={3}
 className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="CTA banner description"
 />
 </div>

 {/* Buttons */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Primary Button Text</label>
 <input
 type="text"
 value={formData.primaryButton}
 onChange={(e) => handleChange('primaryButton', e.target.value)}
 className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="e.g., Get Started Now"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Secondary Button Text</label>
 <input
 type="text"
 value={formData.secondaryButton}
 onChange={(e) => handleChange('secondaryButton', e.target.value)}
 className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="e.g., Learn More"
 />
 </div>
 </div>

 {/* Preview */}
 <div className="border-t border-line pt-6">
 <h3 className="text-sm font-medium text-soft mb-3">Preview</h3>
 <div className="bg-brand-navy rounded-xl p-8 text-white text-center">
 <h3 className="text-2xl font-bold mb-2">{formData.title || 'CTA Title'}</h3>
 <p className="text-blue-100 mb-6">{formData.description || 'CTA description goes here'}</p>
 <div className="flex justify-center gap-3">
 <span className="px-6 py-2.5 bg-surface text-blue-600 rounded-lg font-medium text-sm">
 {formData.primaryButton || 'Primary Button'}
 </span>
 <span className="px-6 py-2.5 border-2 border-white text-white rounded-lg font-medium text-sm">
 {formData.secondaryButton || 'Secondary Button'}
 </span>
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
