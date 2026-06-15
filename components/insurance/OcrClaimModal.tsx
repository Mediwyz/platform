'use client'

import { useState, useRef } from 'react'
import { FaTimes, FaCamera, FaSpinner, FaUpload, FaCheckCircle } from 'react-icons/fa'
import { useCurrency } from '@/hooks/useCurrency'

interface OcrResult {
  description?: string
  amount?: number
  merchantName?: string
  receiptDate?: string
  receiptUrl?: string
}

interface Props {
  onClose: () => void
  onSubmitted: () => void
}

export default function OcrClaimModal({ onClose, onSubmitted }: Props) {
  const [step, setStep] = useState<'upload' | 'review' | 'submitting' | 'done'>('upload')
  const [scanning, setScanning] = useState(false)
  const [ocr, setOcr] = useState<OcrResult | null>(null)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { format } = useCurrency()

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, WEBP).')
      return
    }
    setError(null)
    setPreview(URL.createObjectURL(file))
    setScanning(true)

    try {
      const formData = new FormData()
      formData.append('receipt', file)
      const res = await fetch('/api/corporate/insurance/claims/ocr', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'OCR failed')
      const result: OcrResult = json.data
      setOcr(result)
      setDescription(result.description ?? '')
      setAmount(result.amount != null ? String(result.amount) : '')
      setStep('review')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scanning failed')
    } finally {
      setScanning(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim() || !amount) {
      setError('Description and amount are required.')
      return
    }
    setStep('submitting')
    setError(null)
    try {
      const res = await fetch('/api/corporate/insurance/claims', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          amount: parseFloat(amount),
          receiptUrl: ocr?.receiptUrl ?? undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to submit claim')
      setStep('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed')
      setStep('review')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h2 className="text-base font-bold text-gray-900">File a claim</h2>
            <p className="text-xs text-gray-500 mt-0.5">Upload your receipt - we&apos;ll pre-fill the details</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
            <FaTimes />
          </button>
        </div>

        <div className="p-5">
          {/* Step: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
              />

              {!scanning ? (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 hover:border-[#0C6780] rounded-xl py-10 flex flex-col items-center gap-3 text-gray-500 hover:text-[#0C6780] transition group"
                >
                  <FaCamera className="w-8 h-8 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Upload receipt photo</span>
                  <span className="text-xs text-gray-400">JPG, PNG, WEBP · Max 10 MB</span>
                </button>
              ) : (
                <div className="flex flex-col items-center gap-3 py-10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {preview && <img src={preview} alt="receipt" className="w-24 h-24 object-cover rounded-xl shadow" />}
                  <FaSpinner className="w-6 h-6 animate-spin text-[#0C6780]" />
                  <p className="text-sm text-gray-600">Scanning receipt with AI…</p>
                </div>
              )}

              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

              <button
                type="button"
                onClick={() => setStep('review')}
                className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
              >
                Skip scan - fill in manually
              </button>
            </div>
          )}

          {/* Step: Review & Edit */}
          {step === 'review' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {ocr && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <FaCheckCircle className="flex-shrink-0" />
                  <span>
                    Receipt scanned
                    {ocr.merchantName && <> · <span className="font-medium">{ocr.merchantName}</span></>}
                    {ocr.receiptDate && <> · {ocr.receiptDate}</>}
                  </span>
                </div>
              )}

              {/* eslint-disable-next-line @next/next/no-img-element */}
              {preview && (
                <img src={preview} alt="receipt" className="w-full max-h-40 object-contain rounded-xl border border-gray-200" />
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  placeholder="What was this expense for?"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780] outline-none resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Amount (HC) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">HC</span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780] outline-none"
                    required
                  />
                </div>
                {ocr?.amount && amount !== String(ocr.amount) && (
                  <p className="text-xs text-amber-600 mt-1">
                    OCR read {format(ocr.amount)} - you&apos;ve changed this
                  </p>
                )}
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setStep('upload'); setOcr(null); setPreview(null) }}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  Re-scan
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#0C6780] hover:bg-[#001E40] text-white py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
                >
                  <FaUpload className="w-3.5 h-3.5" />
                  Submit claim
                </button>
              </div>
            </form>
          )}

          {/* Step: Submitting */}
          {step === 'submitting' && (
            <div className="flex flex-col items-center gap-3 py-10">
              <FaSpinner className="w-7 h-7 animate-spin text-[#0C6780]" />
              <p className="text-sm text-gray-600">Submitting your claim…</p>
            </div>
          )}

          {/* Step: Done */}
          {step === 'done' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                <FaCheckCircle className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">Claim submitted</p>
                <p className="text-sm text-gray-500 mt-1">
                  Your insurance provider will review it and get back to you.
                </p>
              </div>
              <button
                onClick={() => { onSubmitted(); onClose() }}
                className="bg-[#0C6780] hover:bg-[#001E40] text-white px-8 py-2.5 rounded-xl text-sm font-medium transition"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
