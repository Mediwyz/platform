'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
 FaArrowUp, FaArrowDown, FaToggleOn, FaToggleOff,
 FaEdit, FaTrash, FaPlus, FaImage, FaSpinner, FaTimes, FaSave,
} from 'react-icons/fa'
import CmsImageUpload from '@/components/shared/CmsImageUpload'

interface HeroSlide {
 id: string
 title: string
 subtitle: string
 imageUrl: string
 sortOrder: number
 isActive: boolean
}

interface HeroSlidesManagerProps {
 slides: HeroSlide[]
 countryCode: string
 onRefresh: () => void
}

const EMPTY_SLIDE = { title: '', subtitle: '', imageUrl: '' }

export default function HeroSlidesManager({ slides, countryCode, onRefresh }: HeroSlidesManagerProps) {
 const [showForm, setShowForm] = useState(false)
 const [editingId, setEditingId] = useState<string | null>(null)
 const [formData, setFormData] = useState(EMPTY_SLIDE)
 const [saving, setSaving] = useState(false)

 const handleFormChange = (field: string, value: string) => {
 setFormData((prev) => ({ ...prev, [field]: value }))
 }

 const openAddForm = () => {
 setEditingId(null)
 setFormData(EMPTY_SLIDE)
 setShowForm(true)
 }

 const openEditForm = (slide: HeroSlide) => {
 setEditingId(slide.id)
 setFormData({ title: slide.title, subtitle: slide.subtitle, imageUrl: slide.imageUrl })
 setShowForm(true)
 }

 const closeForm = () => {
 setShowForm(false)
 setEditingId(null)
 setFormData(EMPTY_SLIDE)
 }

 const handleSubmit = async () => {
 if (!formData.title.trim()) return
 setSaving(true)
 try {
 if (editingId) {
 await fetch(`/api/cms/hero-slides/${editingId}?countryCode=${countryCode}`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ ...formData, countryCode }),
 credentials: 'include',
 })
 } else {
 await fetch(`/api/cms/hero-slides?countryCode=${countryCode}`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ ...formData, countryCode }),
 credentials: 'include',
 })
 }
 closeForm()
 onRefresh()
 } catch (err) {
 console.error('Failed to save slide:', err)
 } finally {
 setSaving(false)
 }
 }

 const handleToggleActive = async (slide: HeroSlide) => {
 try {
 await fetch(`/api/cms/hero-slides/${slide.id}?countryCode=${countryCode}`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ isActive: !slide.isActive, countryCode }),
 credentials: 'include',
 })
 onRefresh()
 } catch (err) {
 console.error('Failed to toggle slide:', err)
 }
 }

 const handleReorder = async (slide: HeroSlide, direction: 'up' | 'down') => {
 const currentIndex = slides.findIndex((s) => s.id === slide.id)
 const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
 if (targetIndex < 0 || targetIndex >= slides.length) return

 const targetSlide = slides[targetIndex]
 try {
 await Promise.all([
 fetch(`/api/cms/hero-slides/${slide.id}?countryCode=${countryCode}`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ sortOrder: targetSlide.sortOrder, countryCode }),
 credentials: 'include',
 }),
 fetch(`/api/cms/hero-slides/${targetSlide.id}?countryCode=${countryCode}`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ sortOrder: slide.sortOrder, countryCode }),
 credentials: 'include',
 }),
 ])
 onRefresh()
 } catch (err) {
 console.error('Failed to reorder slides:', err)
 }
 }

 const handleDelete = async (id: string) => {
 if (!confirm('Are you sure you want to delete this slide?')) return
 try {
 await fetch(`/api/cms/hero-slides/${id}?countryCode=${countryCode}`, { method: 'DELETE', credentials: 'include' })
 onRefresh()
 } catch (err) {
 console.error('Failed to delete slide:', err)
 }
 }

 const sortedSlides = [...slides].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <h2 className="text-xl font-bold text-fg">Hero Slides</h2>
 <button
 onClick={openAddForm}
 className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition"
 >
 <FaPlus className="text-xs" /> Add Slide
 </button>
 </div>

 {/* Add/Edit Form Modal */}
 {showForm && (
 <div className="bg-surface rounded-xl shadow p-6 border-2 border-blue-200">
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-lg font-semibold text-fg">
 {editingId ? 'Edit Slide' : 'Add New Slide'}
 </h3>
 <button onClick={closeForm} className="p-2 text-faint hover:text-soft">
 <FaTimes />
 </button>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Title</label>
 <input
 type="text"
 value={formData.title}
 onChange={(e) => handleFormChange('title', e.target.value)}
 className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="Slide title"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Subtitle</label>
 <input
 type="text"
 value={formData.subtitle}
 onChange={(e) => handleFormChange('subtitle', e.target.value)}
 className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="Slide subtitle"
 />
 </div>
 <div className="md:col-span-2">
 <CmsImageUpload
 value={formData.imageUrl}
 onChange={(url) => handleFormChange('imageUrl', url)}
 label="Slide Image"
 />
 </div>
 </div>
 <div className="flex justify-end gap-3 mt-4">
 <button
 onClick={closeForm}
 className="px-4 py-2 border border-line rounded-lg text-soft hover:bg-subtle font-medium text-sm transition"
 >
 Cancel
 </button>
 <button
 onClick={handleSubmit}
 disabled={saving || !formData.title.trim()}
 className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition"
 >
 {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
 {saving ? 'Saving...' : editingId ? 'Update Slide' : 'Add Slide'}
 </button>
 </div>
 </div>
 )}

 {/* Slides List */}
 {sortedSlides.length === 0 && !showForm && (
 <div className="bg-surface rounded-xl shadow p-10 text-center text-soft">
 <FaImage className="text-4xl mx-auto mb-3 text-faint" />
 <p className="text-lg font-medium">No hero slides yet</p>
 <p className="text-sm mt-1">Click &quot;Add Slide&quot; to create your first hero slide</p>
 </div>
 )}

 {sortedSlides.map((slide, idx) => (
 <div key={slide.id} className="bg-surface rounded-xl p-5 shadow flex gap-5 items-center">
 {/* Image Preview */}
 <div className="w-40 h-24 bg-subtle rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
 {slide.imageUrl ? (
 <Image
 src={slide.imageUrl}
 alt={slide.title}
 width={160}
 height={96}
 className="w-full h-full object-cover"
 onError={(e) => {
 (e.target as HTMLImageElement).style.display = 'none'
 ;(e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden')
 }}
 />
 ) : null}
 <div className={slide.imageUrl ? 'hidden' : 'flex flex-col items-center'}>
 <FaImage className="text-faint text-2xl" />
 <span className="text-xs text-faint mt-1">No image</span>
 </div>
 </div>

 {/* Content */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <h3 className="font-semibold text-fg truncate">{slide.title}</h3>
 <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
 slide.isActive ? 'bg-green-100 text-green-700' : 'bg-subtle text-soft'
 }`}>
 {slide.isActive ? 'Active' : 'Inactive'}
 </span>
 </div>
 {slide.subtitle && (
 <p className="text-sm text-soft mt-1 truncate">{slide.subtitle}</p>
 )}
 <p className="text-xs text-faint mt-1">Order: {slide.sortOrder ?? idx + 1}</p>
 </div>

 {/* Actions */}
 <div className="flex items-center gap-2 flex-shrink-0">
 <div className="flex flex-col gap-1">
 <button
 onClick={() => handleReorder(slide, 'up')}
 disabled={idx === 0}
 className="p-1.5 bg-subtle rounded hover:bg-line disabled:opacity-30 disabled:cursor-not-allowed transition"
 title="Move up"
 >
 <FaArrowUp className="text-xs text-soft" />
 </button>
 <button
 onClick={() => handleReorder(slide, 'down')}
 disabled={idx === sortedSlides.length - 1}
 className="p-1.5 bg-subtle rounded hover:bg-line disabled:opacity-30 disabled:cursor-not-allowed transition"
 title="Move down"
 >
 <FaArrowDown className="text-xs text-soft" />
 </button>
 </div>
 <button
 onClick={() => handleToggleActive(slide)}
 title={slide.isActive ? 'Deactivate' : 'Activate'}
 >
 {slide.isActive ? (
 <FaToggleOn className="text-2xl text-green-500 hover:text-green-600" />
 ) : (
 <FaToggleOff className="text-2xl text-faint hover:text-soft" />
 )}
 </button>
 <button
 onClick={() => openEditForm(slide)}
 className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
 title="Edit slide"
 >
 <FaEdit />
 </button>
 <button
 onClick={() => handleDelete(slide.id)}
 className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
 title="Delete slide"
 >
 <FaTrash />
 </button>
 </div>
 </div>
 ))}
 </div>
 )
}
