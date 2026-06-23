'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
 FaStar, FaToggleOn, FaToggleOff, FaEdit, FaTrash, FaPlus,
 FaSpinner, FaTimes, FaSave, FaQuoteLeft,
} from 'react-icons/fa'

interface Testimonial {
 id: string
 name: string
 role: string
 content: string
 rating: number
 imageUrl: string
 isActive: boolean
}

interface TestimonialsManagerProps {
 testimonials: Testimonial[]
 countryCode: string
 onRefresh: () => void
}

const EMPTY_TESTIMONIAL = { name: '', role: '', content: '', rating: 5, imageUrl: '' }

export default function TestimonialsManager({ testimonials, countryCode, onRefresh }: TestimonialsManagerProps) {
 const [showForm, setShowForm] = useState(false)
 const [editingId, setEditingId] = useState<string | null>(null)
 const [formData, setFormData] = useState(EMPTY_TESTIMONIAL)
 const [saving, setSaving] = useState(false)

 const handleFormChange = (field: string, value: string | number) => {
 setFormData((prev) => ({ ...prev, [field]: value }))
 }

 const openAddForm = () => {
 setEditingId(null)
 setFormData(EMPTY_TESTIMONIAL)
 setShowForm(true)
 }

 const openEditForm = (t: Testimonial) => {
 setEditingId(t.id)
 setFormData({
 name: t.name,
 role: t.role,
 content: t.content,
 rating: t.rating,
 imageUrl: t.imageUrl || '',
 })
 setShowForm(true)
 }

 const closeForm = () => {
 setShowForm(false)
 setEditingId(null)
 setFormData(EMPTY_TESTIMONIAL)
 }

 const handleSubmit = async () => {
 if (!formData.name.trim() || !formData.content.trim()) return
 setSaving(true)
 try {
 if (editingId) {
 await fetch(`/api/cms/testimonials/${editingId}?countryCode=${countryCode}`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ ...formData, countryCode }),
 credentials: 'include',
 })
 } else {
 await fetch(`/api/cms/testimonials?countryCode=${countryCode}`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ ...formData, countryCode }),
 credentials: 'include',
 })
 }
 closeForm()
 onRefresh()
 } catch (err) {
 console.error('Failed to save testimonial:', err)
 } finally {
 setSaving(false)
 }
 }

 const handleToggleActive = async (t: Testimonial) => {
 try {
 await fetch(`/api/cms/testimonials/${t.id}?countryCode=${countryCode}`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ isActive: !t.isActive, countryCode }),
 credentials: 'include',
 })
 onRefresh()
 } catch (err) {
 console.error('Failed to toggle testimonial:', err)
 }
 }

 const handleDelete = async (id: string) => {
 if (!confirm('Are you sure you want to delete this testimonial?')) return
 try {
 await fetch(`/api/cms/testimonials/${id}?countryCode=${countryCode}`, { method: 'DELETE', credentials: 'include' })
 onRefresh()
 } catch (err) {
 console.error('Failed to delete testimonial:', err)
 }
 }

 const renderStars = (rating: number, interactive = false) => {
 return (
 <div className="flex gap-0.5">
 {[1, 2, 3, 4, 5].map((star) => (
 <button
 key={star}
 type="button"
 onClick={interactive ? () => handleFormChange('rating', star) : undefined}
 className={interactive ? 'cursor-pointer' : 'cursor-default'}
 disabled={!interactive}
 >
 <FaStar
 className={`${
 star <= rating ? 'text-yellow-500' : 'text-faint'
 } ${interactive ? 'text-lg hover:text-yellow-400' : 'text-sm'}`}
 />
 </button>
 ))}
 </div>
 )
 }

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <h2 className="text-xl font-bold text-fg">Testimonials</h2>
 <button
 onClick={openAddForm}
 className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition"
 >
 <FaPlus className="text-xs" /> Add Testimonial
 </button>
 </div>

 {/* Add/Edit Form */}
 {showForm && (
 <div className="bg-surface rounded-xl shadow p-6 border-2 border-blue-200">
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-lg font-semibold text-fg">
 {editingId ? 'Edit Testimonial' : 'Add New Testimonial'}
 </h3>
 <button onClick={closeForm} className="p-2 text-faint hover:text-soft">
 <FaTimes />
 </button>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Name</label>
 <input
 type="text"
 value={formData.name}
 onChange={(e) => handleFormChange('name', e.target.value)}
 className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="Full name"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Role</label>
 <input
 type="text"
 value={formData.role}
 onChange={(e) => handleFormChange('role', e.target.value)}
 className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="e.g., Patient, Family Member"
 />
 </div>
 <div className="md:col-span-2">
 <label className="block text-sm font-medium text-soft mb-1">Content</label>
 <textarea
 value={formData.content}
 onChange={(e) => handleFormChange('content', e.target.value)}
 rows={3}
 className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="Testimonial content..."
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Rating</label>
 <div className="mt-1">{renderStars(formData.rating, true)}</div>
 </div>
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Image URL</label>
 <input
 type="text"
 value={formData.imageUrl}
 onChange={(e) => handleFormChange('imageUrl', e.target.value)}
 className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="https://example.com/avatar.jpg"
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
 disabled={saving || !formData.name.trim() || !formData.content.trim()}
 className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition"
 >
 {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
 {saving ? 'Saving...' : editingId ? 'Update' : 'Add Testimonial'}
 </button>
 </div>
 </div>
 )}

 {/* Testimonials Grid */}
 {testimonials.length === 0 && !showForm && (
 <div className="bg-surface rounded-xl shadow p-10 text-center text-soft">
 <FaQuoteLeft className="text-4xl mx-auto mb-3 text-faint" />
 <p className="text-lg font-medium">No testimonials yet</p>
 <p className="text-sm mt-1">Click &quot;Add Testimonial&quot; to create your first one</p>
 </div>
 )}

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {testimonials.map((t) => (
 <div key={t.id} className="bg-surface rounded-xl p-6 shadow">
 <div className="flex items-start gap-4">
 {/* Avatar */}
 <div className="w-14 h-14 rounded-full bg-subtle flex-shrink-0 overflow-hidden flex items-center justify-center">
 {t.imageUrl ? (
 <Image
 src={t.imageUrl}
 alt={t.name}
 width={56}
 height={56}
 className="w-full h-full object-cover"
 onError={(e) => {
 (e.target as HTMLImageElement).style.display = 'none'
 }}
 />
 ) : (
 <span className="text-xl font-bold text-faint">
 {(t.name || '?').charAt(0).toUpperCase()}
 </span>
 )}
 </div>

 {/* Content */}
 <div className="flex-1 min-w-0">
 <div className="flex items-start justify-between gap-2">
 <div>
 <h3 className="font-semibold text-fg">{t.name}</h3>
 <p className="text-sm text-soft">{t.role}</p>
 </div>
 <div className="flex items-center gap-1">
 <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
 t.isActive ? 'bg-green-100 text-green-700' : 'bg-subtle text-soft'
 }`}>
 {t.isActive ? 'Active' : 'Inactive'}
 </span>
 </div>
 </div>

 {/* Stars */}
 <div className="mt-2">{renderStars(t.rating)}</div>

 {/* Quote */}
 <p className="text-soft mt-3 text-sm italic line-clamp-3">
 &quot;{t.content}&quot;
 </p>

 {/* Actions */}
 <div className="flex justify-end gap-2 mt-4">
 <button
 onClick={() => handleToggleActive(t)}
 title={t.isActive ? 'Deactivate' : 'Activate'}
 >
 {t.isActive ? (
 <FaToggleOn className="text-2xl text-green-500 hover:text-green-600" />
 ) : (
 <FaToggleOff className="text-2xl text-faint hover:text-soft" />
 )}
 </button>
 <button
 onClick={() => openEditForm(t)}
 className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
 title="Edit"
 >
 <FaEdit />
 </button>
 <button
 onClick={() => handleDelete(t.id)}
 className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
 title="Delete"
 >
 <FaTrash />
 </button>
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 )
}
