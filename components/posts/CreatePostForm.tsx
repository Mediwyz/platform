'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { FaPaperPlane, FaTags, FaImage, FaTimes, FaBuilding, FaUser } from 'react-icons/fa'
import { getUserId } from '@/hooks/useUser'
import { cn } from '@/lib/cn'

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

  useEffect(() => {
    if (!userId) return
    fetch(`/api/corporate/${userId}/dashboard`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(json => { if (json?.success && json.data?.company) setCompany(json.data.company) })
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
    if (e.target.value.trim() && !showOptions) setShowOptions(true)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please select an image file'); return }
    if (file.size > 4 * 1024 * 1024) { setError('Image must be under 4MB'); return }
    const reader = new FileReader()
    reader.onload = () => { setImagePreview(reader.result as string); setError('') }
    reader.onerror = () => setError('Failed to read image')
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    setError('')
    setSuccess(false)
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0)
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
        setContent(''); setCategory(''); setTagsInput(''); setImagePreview(null); setShowOptions(false); setSuccess(true)
        if (fileInputRef.current) fileInputRef.current.value = ''
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

  const chip = 'border-0 bg-subtle rounded-lg px-2 py-1.5 text-xs text-soft focus:outline-none focus:ring-1 focus:ring-brand-teal'

  return (
    <div className="bg-surface border border-line rounded-2xl shadow-sm p-3 sm:p-4">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-[#001E40] dark:bg-subtle text-white dark:text-fg flex items-center justify-center flex-shrink-0">
            <FaUser className="text-sm" />
          </div>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onFocus={() => content.trim() && setShowOptions(true)}
            placeholder="Share health tips, articles, or knowledge…"
            rows={1}
            className="flex-1 bg-subtle/60 dark:bg-subtle rounded-2xl px-4 py-2.5 text-[15px] text-fg focus:outline-none focus:ring-2 focus:ring-brand-teal/40 resize-none overflow-hidden transition-all placeholder:text-faint"
            style={{ minHeight: '44px' }}
            disabled={submitting}
          />
        </div>

        {/* Image preview */}
        {imagePreview && (
          <div className="relative mt-3 ml-13 inline-block">
            <Image src={imagePreview} alt="Upload preview" width={400} height={160} className="max-h-48 rounded-xl object-cover border border-line" />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors shadow"
              title="Remove image"
            >
              <FaTimes className="text-xs" />
            </button>
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center justify-between mt-3 gap-2 pl-13">
          <div className="flex items-center gap-1.5 flex-wrap">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" disabled={submitting} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                imagePreview ? 'text-[#0C6780] dark:text-accent bg-[#0C6780]/10' : 'text-soft hover:text-fg hover:bg-subtle',
              )}
              title="Attach image"
              disabled={submitting}
            >
              <FaImage /> <span className="hidden sm:inline">Photo</span>
            </button>

            {showOptions && (
              <>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={chip} disabled={submitting}>
                  {CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                </select>
                <div className="relative hidden sm:block">
                  <FaTags className="absolute left-2 top-1/2 -translate-y-1/2 text-faint text-[10px]" />
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Tags…"
                    className={cn(chip, 'pl-6 w-28 placeholder:text-faint')}
                    disabled={submitting}
                  />
                </div>
              </>
            )}

            {company && showOptions && (
              <button
                type="button"
                onClick={() => setPostAsCompany(!postAsCompany)}
                className={cn(
                  'flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  postAsCompany ? 'bg-[#0C6780]/10 text-[#0C6780] dark:text-accent border border-[#0C6780]/20' : 'text-soft hover:text-fg hover:bg-subtle',
                )}
                title={postAsCompany ? `Posting as ${company.companyName}` : 'Post as yourself'}
              >
                <FaBuilding className="text-[10px]" />
                <span className="hidden sm:inline">{postAsCompany ? company.companyName : 'Company'}</span>
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="flex items-center gap-1.5 bg-[#0C6780] hover:bg-[#001E40] dark:bg-accent dark:text-[#04121f] dark:hover:bg-[#5fc7e6] text-white px-4 py-2 rounded-xl font-semibold text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {submitting ? (
              <>
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span className="hidden sm:inline">Publishing…</span>
              </>
            ) : (
              <>
                <FaPaperPlane className="text-[10px]" />
                <span>Publish</span>
              </>
            )}
          </button>
        </div>

        {/* Tags input - mobile */}
        {showOptions && (
          <div className="sm:hidden mt-2 pl-13">
            <div className="relative">
              <FaTags className="absolute left-2 top-1/2 -translate-y-1/2 text-faint text-[10px]" />
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Tags (comma-separated)"
                className={cn(chip, 'w-full pl-6 placeholder:text-faint')}
                disabled={submitting}
              />
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-xs mt-2 pl-13">{error}</p>}
        {success && <p className="text-emerald-600 dark:text-emerald-400 text-xs font-medium mt-2 pl-13">Post published!</p>}
      </form>
    </div>
  )
}
