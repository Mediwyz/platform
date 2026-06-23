'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { FaCloudUploadAlt, FaSpinner, FaTimes, FaImage } from 'react-icons/fa'

interface CmsImageUploadProps {
 value: string
 onChange: (url: string) => void
 label?: string
}

export default function CmsImageUpload({ value, onChange, label = 'Image' }: CmsImageUploadProps) {
 const [uploading, setUploading] = useState(false)
 const [error, setError] = useState<string | null>(null)
 const fileInputRef = useRef<HTMLInputElement>(null)

 const handleUpload = async (file: File) => {
 setError(null)
 setUploading(true)
 try {
 const fd = new FormData()
 fd.append('file', file)
 const res = await fetch('/api/upload/cms', { method: 'POST', body: fd, credentials: 'include' })
 const result = await res.json()
 if (result.success) {
 onChange(result.data.url)
 } else {
 setError(result.message || 'Upload failed')
 }
 } catch {
 setError('Upload failed')
 } finally {
 setUploading(false)
 }
 }

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0]
 if (file) handleUpload(file)
 // Reset input so the same file can be re-selected
 e.target.value = ''
 }

 const handleDrop = (e: React.DragEvent) => {
 e.preventDefault()
 const file = e.dataTransfer.files?.[0]
 if (file && file.type.startsWith('image/')) handleUpload(file)
 }

 return (
 <div>
 <label className="block text-sm font-medium text-soft mb-1">{label}</label>

 {value ? (
 <div className="relative group">
 <Image
 src={value}
 alt="Preview"
 width={400}
 height={160}
 className="w-full h-40 object-cover rounded-lg border border-line"
 onError={(e) => { (e.target as HTMLImageElement).src = '' }}
 />
 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-3">
 <button
 type="button"
 onClick={() => fileInputRef.current?.click()}
 className="px-3 py-1.5 bg-surface text-fg rounded-lg text-sm font-medium hover:bg-subtle"
 >
 Replace
 </button>
 <button
 type="button"
 onClick={() => onChange('')}
 className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
 >
 <FaTimes />
 </button>
 </div>
 </div>
 ) : (
 <div
 onClick={() => !uploading && fileInputRef.current?.click()}
 onDragOver={(e) => e.preventDefault()}
 onDrop={handleDrop}
 className={`w-full h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
 uploading ? 'border-blue-300 bg-blue-50' : 'border-line hover:border-blue-400 hover:bg-blue-50/50'
 }`}
 >
 {uploading ? (
 <>
 <FaSpinner className="text-blue-500 text-xl animate-spin" />
 <span className="text-sm text-blue-600 font-medium">Uploading...</span>
 </>
 ) : (
 <>
 <FaCloudUploadAlt className="text-faint text-2xl" />
 <span className="text-sm text-soft">Click or drag image here</span>
 <span className="text-xs text-faint">JPG, PNG, WebP (max 5MB)</span>
 </>
 )}
 </div>
 )}

 {/* Fallback URL input */}
 <div className="mt-2 flex items-center gap-2">
 <FaImage className="text-faint text-xs flex-shrink-0" />
 <input
 type="text"
 value={value}
 onChange={(e) => onChange(e.target.value)}
 className="w-full px-3 py-1.5 border border-line rounded-lg text-xs text-soft focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
 placeholder="Or paste image URL..."
 />
 </div>

 {error && (
 <p className="text-xs text-red-500 mt-1">{error}</p>
 )}

 <input
 ref={fileInputRef}
 type="file"
 accept="image/jpeg,image/png,image/webp"
 className="hidden"
 onChange={handleFileChange}
 />
 </div>
 )
}
