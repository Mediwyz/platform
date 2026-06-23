'use client'

import { useState, useRef } from 'react'
import { FaCamera, FaUpload, FaSpinner, FaCheck, FaRedo, FaExclamationTriangle } from 'react-icons/fa'

export interface FoodScanResult {
 name: string
 calories: number
 protein: number
 carbs: number
 fat: number
}

export interface FoodScanPanelProps {
 onResult: (food: FoodScanResult) => void
}

interface AiScanResponse {
 success: boolean
 data?: {
 name: string
 description: string
 confidence: 'high' | 'medium' | 'low'
 calories: number
 protein: number
 carbs: number
 fat: number
 }
 message?: string
}

type ScanPhase = 'upload' | 'analyzing' | 'results' | 'error'

function resizeImage(file: File, maxSize: number): Promise<string> {
 return new Promise((resolve, reject) => {
 const img = new Image()
 const reader = new FileReader()
 reader.onload = () => {
 img.onload = () => {
 const canvas = document.createElement('canvas')
 let { width, height } = img
 if (width > maxSize || height > maxSize) {
 if (width > height) {
 height = Math.round((height * maxSize) / width)
 width = maxSize
 } else {
 width = Math.round((width * maxSize) / height)
 height = maxSize
 }
 }
 canvas.width = width
 canvas.height = height
 const ctx = canvas.getContext('2d')
 if (!ctx) return reject(new Error('Canvas context unavailable'))
 ctx.drawImage(img, 0, 0, width, height)
 resolve(canvas.toDataURL('image/jpeg', 0.85))
 }
 img.onerror = () => reject(new Error('Failed to load image'))
 img.src = reader.result as string
 }
 reader.onerror = () => reject(new Error('Failed to read file'))
 reader.readAsDataURL(file)
 })
}

export default function FoodScanPanel({ onResult }: FoodScanPanelProps) {
 const [phase, setPhase] = useState<ScanPhase>('upload')
 const [previewUrl, setPreviewUrl] = useState<string | null>(null)
 const [errorMessage, setErrorMessage] = useState('')
 const [aiData, setAiData] = useState<AiScanResponse['data'] | null>(null)

 // Editable fields
 const [editName, setEditName] = useState('')
 const [editCalories, setEditCalories] = useState(0)
 const [editProtein, setEditProtein] = useState(0)
 const [editCarbs, setEditCarbs] = useState(0)
 const [editFat, setEditFat] = useState(0)

 const cameraInputRef = useRef<HTMLInputElement>(null)
 const uploadInputRef = useRef<HTMLInputElement>(null)

 const handleFile = async (file: File | undefined) => {
 if (!file) return
 try {
 const dataUrl = await resizeImage(file, 1024)
 setPreviewUrl(dataUrl)
 setPhase('analyzing')

 const res = await fetch('/api/ai/health-tracker/food-scan', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ imageBase64: dataUrl }),
 credentials: 'include',
 })

 const json: AiScanResponse = await res.json()

 if (!res.ok || !json.success || !json.data) {
 setErrorMessage(json.message || 'Failed to analyze image')
 setPhase('error')
 return
 }

 setAiData(json.data)
 setEditName(json.data.name)
 setEditCalories(json.data.calories)
 setEditProtein(json.data.protein)
 setEditCarbs(json.data.carbs)
 setEditFat(json.data.fat)
 setPhase('results')
 } catch {
 setErrorMessage('Network error. Please try again.')
 setPhase('error')
 }
 }

 const handleReset = () => {
 setPhase('upload')
 setPreviewUrl(null)
 setAiData(null)
 setErrorMessage('')
 if (cameraInputRef.current) cameraInputRef.current.value = ''
 if (uploadInputRef.current) uploadInputRef.current.value = ''
 }

 const handleAddToDiary = () => {
 onResult({
 name: editName,
 calories: editCalories,
 protein: editProtein,
 carbs: editCarbs,
 fat: editFat,
 })
 handleReset()
 }

 const confidenceBadge = (level: 'high' | 'medium' | 'low') => {
 const styles = {
 high: 'bg-green-100 text-green-700',
 medium: 'bg-yellow-100 text-yellow-700',
 low: 'bg-red-100 text-red-700',
 }
 return (
 <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${styles[level]}`}>
 {level === 'high' && <FaCheck className="text-[10px]" />}
 {level === 'medium' && <FaExclamationTriangle className="text-[10px]" />}
 {level === 'low' && <FaExclamationTriangle className="text-[10px]" />}
 {level.charAt(0).toUpperCase() + level.slice(1)} confidence
 </span>
 )
 }

 // Hidden file inputs
 const fileInputs = (
 <>
 <input
 ref={cameraInputRef}
 type="file"
 accept="image/*"
 capture="environment"
 className="hidden"
 onChange={(e) => handleFile(e.target.files?.[0])}
 />
 <input
 ref={uploadInputRef}
 type="file"
 accept="image/*"
 className="hidden"
 onChange={(e) => handleFile(e.target.files?.[0])}
 />
 </>
 )

 // Upload phase
 if (phase === 'upload') {
 return (
 <div className="space-y-3">
 {fileInputs}
 {/* Upload area */}
 <button
 onClick={() => uploadInputRef.current?.click()}
 className="w-full flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-line rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300"
 >
 <FaCamera className="text-3xl text-faint" />
 <div className="text-sm text-soft text-center">
 <span className="font-medium text-soft">Snap or upload a photo of your food</span>
 <br />
 <span className="text-xs">AI will identify and estimate nutrition</span>
 </div>
 </button>

 {/* Action buttons */}
 <div className="flex gap-2">
 <button
 onClick={() => cameraInputRef.current?.click()}
 className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
 >
 <FaCamera className="text-sm" />
 Take Photo
 </button>
 <button
 onClick={() => uploadInputRef.current?.click()}
 className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-subtle text-soft text-sm font-medium rounded-lg hover:bg-line transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
 >
 <FaUpload className="text-sm" />
 Upload Image
 </button>
 </div>
 </div>
 )
 }

 // Analyzing phase
 if (phase === 'analyzing') {
 return (
 <div className="space-y-3">
 {fileInputs}
 {/* Image preview */}
 {previewUrl && (
 <div className="relative rounded-xl overflow-hidden border border-line">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img src={previewUrl} alt="Food being analyzed" className="w-full max-h-48 object-cover" />
 <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
 <FaSpinner className="text-2xl text-white animate-spin" />
 <span className="text-sm text-white font-medium">Analyzing...</span>
 </div>
 </div>
 )}
 </div>
 )
 }

 // Error phase
 if (phase === 'error') {
 return (
 <div className="space-y-3">
 {fileInputs}
 {previewUrl && (
 <div className="rounded-xl overflow-hidden border border-line">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img src={previewUrl} alt="Food photo" className="w-full max-h-48 object-cover" />
 </div>
 )}
 <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
 <FaExclamationTriangle className="text-red-500 flex-shrink-0" />
 <span className="text-sm text-red-700">{errorMessage}</span>
 </div>
 <button
 onClick={handleReset}
 className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-subtle text-soft text-sm font-medium rounded-lg hover:bg-line transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
 >
 <FaRedo className="text-sm" />
 Try Again
 </button>
 </div>
 )
 }

 // Results phase
 return (
 <div className="space-y-3">
 {fileInputs}
 {/* Image preview */}
 {previewUrl && (
 <div className="rounded-xl overflow-hidden border border-line">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img src={previewUrl} alt="Scanned food" className="w-full max-h-48 object-cover" />
 </div>
 )}

 {/* AI result header */}
 {aiData && (
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm font-semibold text-fg">{aiData.name}</p>
 <p className="text-xs text-soft">{aiData.description}</p>
 </div>
 {confidenceBadge(aiData.confidence)}
 </div>
 )}

 {/* Editable fields */}
 <div className="space-y-2">
 <div>
 <label className="block text-xs font-medium text-soft mb-1">Food Name</label>
 <input
 type="text"
 value={editName}
 onChange={(e) => setEditName(e.target.value)}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-colors"
 />
 </div>
 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className="block text-xs font-medium text-soft mb-1">Calories</label>
 <input
 type="number"
 min={0}
 value={editCalories}
 onChange={(e) => setEditCalories(Number(e.target.value))}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-colors"
 />
 </div>
 <div>
 <label className="block text-xs font-medium text-soft mb-1">Protein (g)</label>
 <input
 type="number"
 min={0}
 step={0.1}
 value={editProtein}
 onChange={(e) => setEditProtein(Number(e.target.value))}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-colors"
 />
 </div>
 <div>
 <label className="block text-xs font-medium text-soft mb-1">Carbs (g)</label>
 <input
 type="number"
 min={0}
 step={0.1}
 value={editCarbs}
 onChange={(e) => setEditCarbs(Number(e.target.value))}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-colors"
 />
 </div>
 <div>
 <label className="block text-xs font-medium text-soft mb-1">Fat (g)</label>
 <input
 type="number"
 min={0}
 step={0.1}
 value={editFat}
 onChange={(e) => setEditFat(Number(e.target.value))}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-colors"
 />
 </div>
 </div>
 </div>

 {/* Action buttons */}
 <div className="flex gap-2">
 <button
 onClick={handleReset}
 className="flex items-center justify-center gap-2 px-4 py-2.5 bg-subtle text-soft text-sm font-medium rounded-lg hover:bg-line transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
 >
 <FaRedo className="text-sm" />
 Retry
 </button>
 <button
 onClick={handleAddToDiary}
 className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-300"
 >
 <FaCheck className="text-sm" />
 Add to Diary
 </button>
 </div>
 </div>
 )
}
