'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { FaPaperPlane, FaTags, FaImage, FaTimes, FaBuilding } from 'react-icons/fa'
import { getUserId } from '@/hooks/useUser'

interface Company {
 id: string
 companyName: string
}

interface CreatePostFormProps {
 onPostCreated?: (post: Record<string, unknown>) => void
}

const CATEGORIES = [
 { value: '', label: 'Category' },
 { value: 'health_tips', label: 'Health Tips' },
 { value: 'article', label: 'Article' },
 { value: 'news', label: 'News' },
 { value: 'case_study', label: 'Case Study' },
 { value: 'wellness', label: 'Wellness' },
]

export default function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
 const [content, setContent] = useState('')
 const [category, setCategory] = useState('')
 const [tagsInput, setTagsInput] = useState('')
 const [imagePreview, setImagePreview] = useState<string | null>(null)
 const [submitting, setSubmitting] = useState(false)
 const [success, setSuccess] = useState(false)
 const [error, setError] = useState('')
 const [showOptions, setShowOptions] = useState(false)
 const [postAsCompany, setPostAsCompany] = useState(false)
 const [company, setCompany] = useState<Company | null>(null)
 const textareaRef = useRef<HTMLTextAreaElement>(null)
 const fileInputRef = useRef<HTMLInputElement>(null)
 const userId = getUserId()

 // Check if user has a company page
 useEffect(() => {
  if (!userId) return
  fetch(`/api/corporate/${userId}/dashboard`, { credentials: 'include' })
   .then(r => r.ok ? r.json() : null)
   .then(json => {
    if (json?.success && json.data?.company) {
     setCompany(json.data.company)
    }
   })
   .catch(() => {})
 }, [userId])

 const autoResize = useCallback(() => {
 const el = textareaRef.current
 if (!el) return
 el.style.height = 'auto'
 el.style.height = Math.min(el.scrollHeight, 300) + 'px'
 }, [])

 const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
 setContent(e.target.value)
 autoResize()
 // Show options row when user starts typing
 if (e.target.value.trim() && !showOptions) {
 setShowOptions(true)
 }
 }

 const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0]
 if (!file) return

 if (!file.type.startsWith('image/')) {
 setError('Please select an image file')
 return
 }

 // Limit to 4MB for base64
 if (file.size > 4 * 1024 * 1024) {
 setError('Image must be under 4MB')
 return
 }

 const reader = new FileReader()
 reader.onload = () => {
 setImagePreview(reader.result as string)
 setError('')
 }
 reader.onerror = () => {
 setError('Failed to read image')
 }
 reader.readAsDataURL(file)
 }

 const removeImage = () => {
 setImagePreview(null)
 if (fileInputRef.current) {
 fileInputRef.current.value = ''
 }
 }

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 if (!content.trim()) return

 setSubmitting(true)
 setError('')
 setSuccess(false)

 try {
 const tags = tagsInput
 .split(',')
 .map((t) => t.trim())
 .filter((t) => t.length > 0)

 const res = await fetch('/api/posts', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 credentials: 'include',
 body: JSON.stringify({
 content: content.trim(),
 category: category || null,
 tags,
 imageUrl: imagePreview || undefined,
 ...(postAsCompany && company ? { companyId: company.id } : {}),
 }),
 })

 const json = await res.json()

 if (json.success) {
 setContent('')
 setCategory('')
 setTagsInput('')
 setImagePreview(null)
 setShowOptions(false)
 setSuccess(true)
 if (fileInputRef.current) fileInputRef.current.value = ''
 // Reset textarea height
 if (textareaRef.current) textareaRef.current.style.height = 'auto'
 onPostCreated?.(json.data)
 setTimeout(() => setSuccess(false), 3000)
 } else {
 setError(json.message || 'Failed to create post')
 }
 } catch (err) {
 console.error('Failed to create post:', err)
 setError('Network error. Please try again.')
 } finally {
 setSubmitting(false)
 }
 }

 return (
 <div className="bg-white rounded-xl shadow p-3 sm:p-4">
 <form onSubmit={handleSubmit}>
 {/* Compact textarea */}
 <textarea
 ref={textareaRef}
 value={content}
 onChange={handleContentChange}
 onFocus={() => content.trim() && setShowOptions(true)}
 placeholder="Share health tips, articles, or knowledge..."
 rows={1}
 className="w-full border-0 border-b border-gray-100 px-1 py-2 text-sm focus:outline-none focus:border-blue-300 resize-none overflow-hidden transition-colors placeholder:text-gray-400"
 style={{ minHeight: '36px' }}
 disabled={submitting}
 />

 {/* Image preview */}
 {imagePreview && (
 <div className="relative mt-2 inline-block">
 <Image
 src={imagePreview}
 alt="Upload preview"
 width={400}
 height={160}
 className="max-h-40 rounded-lg object-cover"
 />
 <button
 type="button"
 onClick={removeImage}
 className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
 title="Remove image"
 >
 <FaTimes className="text-xs" />
 </button>
 </div>
 )}

 {/* Action bar - always visible, options expand when typing */}
 <div className="flex items-center justify-between mt-2 gap-2">
 <div className="flex items-center gap-1">
 {/* Image upload button */}
 <input
 ref={fileInputRef}
 type="file"
 accept="image/*"
 onChange={handleImageSelect}
 className="hidden"
 disabled={submitting}
 />
 <button
 type="button"
 onClick={() => fileInputRef.current?.click()}
 className={`p-2 rounded-lg text-sm transition-colors ${
 imagePreview
 ? 'text-blue-600 bg-blue-50'
 : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
 }`}
 title="Attach image"
 disabled={submitting}
 >
 <FaImage />
 </button>

 {/* Category - shown when typing */}
 {showOptions && (
 <>
 <select
 value={category}
 onChange={(e) => setCategory(e.target.value)}
 className="border-0 bg-gray-50 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300 text-gray-600"
 disabled={submitting}
 >
 {CATEGORIES.map((cat) => (
 <option key={cat.value} value={cat.value}>
 {cat.label}
 </option>
 ))}
 </select>

 {/* Tags input */}
 <div className="relative hidden sm:block">
 <FaTags className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300 text-[10px]" />
 <input
 type="text"
 value={tagsInput}
 onChange={(e) => setTagsInput(e.target.value)}
 placeholder="Tags..."
 className="border-0 bg-gray-50 rounded-lg pl-6 pr-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300 w-28 text-gray-600 placeholder:text-gray-400"
 disabled={submitting}
 />
 </div>
 </>
 )}

 {/* Post as Company toggle */}
 {company && showOptions && (
 <button
 type="button"
 onClick={() => setPostAsCompany(!postAsCompany)}
 className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
 postAsCompany
 ? 'bg-[#0C6780]/10 text-[#0C6780] border border-[#0C6780]/20'
 : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
 }`}
 title={postAsCompany ? `Posting as ${company.companyName}` : 'Post as yourself'}
 >
 <FaBuilding className="text-[10px]" />
 <span className="hidden sm:inline">{postAsCompany ? company.companyName : 'Company'}</span>
 </button>
 )}
 </div>

 {/* Submit button */}
 <button
 type="submit"
 disabled={submitting || !content.trim()}
 className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-1.5 rounded-lg font-medium text-xs hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
 >
 {submitting ? (
 <>
 <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
 <span className="hidden sm:inline">Publishing...</span>
 </>
 ) : (
 <>
 <FaPaperPlane className="text-[10px]" />
 <span className="hidden sm:inline">Publish</span>
 </>
 )}
 </button>
 </div>

 {/* Tags input - mobile (below action bar) */}
 {showOptions && (
 <div className="sm:hidden mt-2">
 <div className="relative">
 <FaTags className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300 text-[10px]" />
 <input
 type="text"
 value={tagsInput}
 onChange={(e) => setTagsInput(e.target.value)}
 placeholder="Tags (comma-separated)"
 className="w-full border-0 bg-gray-50 rounded-lg pl-6 pr-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300 text-gray-600 placeholder:text-gray-400"
 disabled={submitting}
 />
 </div>
 </div>
 )}

 {/* Error / Success messages */}
 {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
 {success && <p className="text-green-600 text-xs font-medium mt-2">Post published!</p>}
 </form>
 </div>
 )
}
