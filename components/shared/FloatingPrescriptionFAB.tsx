'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { FaFileMedical, FaTimes, FaUpload, FaCamera, FaCheckCircle, FaSpinner, FaTrash, FaPills, FaSave } from 'react-icons/fa'
import { usePrescription } from '@/lib/contexts/prescription-context'

// Read a cookie value by name (non-httpOnly cookies only)
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.split('; ').find(row => row.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.split('=')[1]) : null
}

interface ExtractedMedication {
  name: string
  dosage: string
  frequency: string
}

interface DetailedExtraction {
  medications: ExtractedMedication[]
  prescriber: string
  date: string
  rawText: string
}

export default function FloatingPrescriptionFAB() {
  const { prescription, hasPrescription, setPrescription, clearPrescription, isExtracting, setIsExtracting } = usePrescription()
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [showReplace, setShowReplace] = useState(false)

  // Richer extraction state
  const [detailed, setDetailed] = useState<DetailedExtraction | null>(null)
  const [editedMedications, setEditedMedications] = useState<ExtractedMedication[]>([])
  const [savingToProfile, setSavingToProfile] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (hasPrescription && prescription.imageUrl && !showReplace) setPreview(prescription.imageUrl)
  }, [hasPrescription, prescription.imageUrl, showReplace])

  const handleFile = (file: File) => {
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
    // Reset previous extraction
    setDetailed(null)
    setEditedMedications([])
    setExtractError(null)
    setSaveSuccess(false)
  }

  const handleUpload = async () => {
    if (!preview) return
    setIsExtracting(true)
    setExtractError(null)
    setDetailed(null)

    const token = getCookie('mediwyz_token')

    try {
      if (token) {
        // Authenticated: use the richer endpoint
        const res = await fetch('/api/ai/prescriptions/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: preview }),
        })
        const json = await res.json() as {
          success: boolean
          data?: DetailedExtraction
          message?: string
        }
        if (json.success && json.data) {
          const d = json.data
          setDetailed(d)
          setEditedMedications(d.medications.length > 0 ? [...d.medications] : [{ name: '', dosage: '', frequency: '' }])
          // Also update the prescription context for Health Shop matching
          const medicineNames = d.medications.map(m => m.name).filter(Boolean)
          setPrescription({
            imageUrl: preview,
            medicines: medicineNames,
            rawText: d.rawText,
            uploadedAt: new Date().toISOString(),
          })
        } else {
          setExtractError(json.message || 'Could not read prescription. Please enter manually.')
        }
      } else {
        // Unauthenticated fallback: use the public simple endpoint
        const res = await fetch('/api/ai/extract-prescription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: preview }),
        })
        const json = await res.json() as { success: boolean; data?: { medicines: string[]; rawText: string } }
        const data = json.data ?? { medicines: [], rawText: '' }
        setPrescription({ imageUrl: preview, medicines: data.medicines, rawText: data.rawText, uploadedAt: new Date().toISOString() })
        setShowReplace(false)
        setOpen(false)
      }
    } catch {
      setExtractError('Could not read prescription. Please enter manually.')
      setPrescription({ imageUrl: preview, medicines: [], rawText: '', uploadedAt: new Date().toISOString() })
    } finally {
      setIsExtracting(false)
    }
  }

  const handleSaveToProfile = async () => {
    const userId = getCookie('mediwyz_user_id')
    if (!userId || !detailed) return

    setSavingToProfile(true)
    try {
      // Save extracted prescription to user's clinical record via the prescriptions endpoint
      // The endpoint expects a doctorId but we allow self-entry - use a note to signal AI extraction
      const res = await fetch(`/api/users/${userId}/prescriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosis: detailed.prescriber ? `Prescribed by: ${detailed.prescriber}` : 'AI-extracted prescription',
          notes: `Prescription date: ${detailed.date || 'unknown'}. Extracted via AI from uploaded image.`,
          medicines: [], // medicines require medicineId - save as notes instead
          isAiExtracted: true,
          prescriptionImageUrl: preview,
          extractedText: detailed.rawText,
        }),
      })
      const json = await res.json() as { success: boolean; message?: string }
      if (json.success) {
        setSaveSuccess(true)
        setTimeout(() => {
          setOpen(false)
          setShowReplace(false)
          setDetailed(null)
          setSaveSuccess(false)
        }, 1500)
      }
    } catch {
      // Non-critical - prescription context is already updated
    } finally {
      setSavingToProfile(false)
    }
  }

  const handleClear = () => {
    clearPrescription()
    setPreview(null)
    setFileName('')
    setShowReplace(false)
    setDetailed(null)
    setEditedMedications([])
    setExtractError(null)
    setSaveSuccess(false)
  }

  const userType = getCookie('mediwyz_userType')
  const isLoggedIn = !!getCookie('mediwyz_token')

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[190] flex items-end sm:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setOpen(false); setShowReplace(false) }} />
          <div className="relative bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">

            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <FaFileMedical className="text-amber-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">My Prescription</p>
                  <p className="text-xs text-gray-500">Saved across the platform</p>
                </div>
              </div>
              <button onClick={() => { setOpen(false); setShowReplace(false) }} className="text-gray-400 hover:text-gray-600 transition-colors">
                <FaTimes />
              </button>
            </div>

            <div className="p-5 max-h-[80vh] overflow-y-auto">
              {isExtracting ? (
                <div className="py-10 text-center">
                  <FaSpinner className="text-amber-500 text-3xl animate-spin mx-auto mb-3" />
                  <p className="font-semibold text-gray-800 text-sm">Extracting prescription data…</p>
                  <p className="text-xs text-gray-500 mt-1">AI is reading your prescription</p>
                </div>

              ) : detailed && !showReplace ? (
                /* ── Rich extraction view ── */
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FaCheckCircle className="text-green-500" />
                    <span className="text-sm font-semibold text-green-700">Prescription read successfully</span>
                  </div>

                  {preview && (
                    <Image src={preview} alt="Prescription" width={400} height={112} className="w-full h-28 object-contain rounded-xl border border-gray-200 mb-3 bg-gray-50" />
                  )}

                  {/* Extracted medications (editable) */}
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                      <FaPills className="text-amber-500" />
                      Medications ({editedMedications.length})
                    </p>
                    <div className="space-y-2">
                      {editedMedications.map((med, i) => (
                        <div key={i} className="p-2 bg-amber-50 border border-amber-100 rounded-lg">
                          <input
                            value={med.name}
                            onChange={e => {
                              const next = [...editedMedications]
                              next[i] = { ...next[i], name: e.target.value }
                              setEditedMedications(next)
                            }}
                            placeholder="Medication name"
                            className="w-full text-xs font-semibold text-gray-800 bg-transparent border-none outline-none mb-1"
                          />
                          <div className="flex gap-2">
                            <input
                              value={med.dosage}
                              onChange={e => {
                                const next = [...editedMedications]
                                next[i] = { ...next[i], dosage: e.target.value }
                                setEditedMedications(next)
                              }}
                              placeholder="Dosage"
                              className="flex-1 text-[10px] text-gray-600 bg-white border border-gray-200 rounded px-1.5 py-0.5 outline-none"
                            />
                            <input
                              value={med.frequency}
                              onChange={e => {
                                const next = [...editedMedications]
                                next[i] = { ...next[i], frequency: e.target.value }
                                setEditedMedications(next)
                              }}
                              placeholder="Frequency"
                              className="flex-1 text-[10px] text-gray-600 bg-white border border-gray-200 rounded px-1.5 py-0.5 outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {detailed.prescriber && (
                    <p className="text-xs text-gray-500 mb-1">
                      <span className="font-medium">Prescriber:</span> {detailed.prescriber}
                    </p>
                  )}
                  {detailed.date && (
                    <p className="text-xs text-gray-500 mb-3">
                      <span className="font-medium">Date:</span> {detailed.date}
                    </p>
                  )}

                  {saveSuccess ? (
                    <div className="flex items-center justify-center gap-2 py-2.5 bg-green-50 rounded-xl text-green-700 text-sm font-medium">
                      <FaCheckCircle /> Saved to your profile!
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      {isLoggedIn && (
                        <button
                          onClick={handleSaveToProfile}
                          disabled={savingToProfile}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#0C6780] text-white rounded-xl text-sm font-bold hover:bg-[#0a5568] disabled:opacity-50 transition-colors"
                        >
                          {savingToProfile ? <FaSpinner className="animate-spin" /> : <FaSave />}
                          Save to Profile
                        </button>
                      )}
                      <button onClick={() => setShowReplace(true)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                        Replace
                      </button>
                      <button onClick={handleClear} className="flex items-center gap-1.5 px-3 py-2.5 border border-red-200 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors">
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  )}
                </div>

              ) : hasPrescription && !showReplace ? (
                /* ── Simple view (legacy / unauthenticated flow) ── */
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FaCheckCircle className="text-green-500" />
                    <span className="text-sm font-semibold text-green-700">Prescription active</span>
                    {prescription.uploadedAt && (
                      <span className="text-xs text-gray-400 ml-auto">
                        {new Date(prescription.uploadedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {prescription.imageUrl && (
                    <Image src={prescription.imageUrl} alt="Prescription" width={400} height={144} className="w-full h-36 object-contain rounded-xl border border-gray-200 mb-3 bg-gray-50" />
                  )}

                  {prescription.medicines.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                        <FaPills className="text-amber-500" />
                        Detected medicines ({prescription.medicines.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {prescription.medicines.map((m, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-medium">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {prescription.medicines.length === 0 && (
                    <p className="text-xs text-gray-500 mb-4">No medicines were extracted - the AI may need a clearer image.</p>
                  )}

                  {isLoggedIn && (
                    <p className="text-xs text-[#0C6780] mb-3">
                      <a href={`/${userType || 'patient'}/prescriptions/new`} className="underline hover:no-underline">
                        Enter prescription manually
                      </a>
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button onClick={() => setShowReplace(true)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                      Replace
                    </button>
                    <button onClick={handleClear} className="flex items-center gap-1.5 px-4 py-2.5 border border-red-200 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <FaTrash className="text-xs" /> Remove
                    </button>
                  </div>
                </div>

              ) : (
                /* ── Upload / replace mode ── */
                <div>
                  {showReplace && (
                    <button onClick={() => setShowReplace(false)} className="text-xs text-[#0C6780] mb-3 flex items-center gap-1 hover:underline">
                      ← Back to current prescription
                    </button>
                  )}
                  <p className="text-sm text-gray-600 mb-4">
                    Upload your prescription. We&apos;ll extract the medicines and show matching products at the top of the Health Shop.
                  </p>

                  {extractError && (
                    <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                      {extractError}
                      {isLoggedIn && (
                        <> <a href={`/${userType || 'patient'}/prescriptions/new`} className="underline">Enter manually →</a></>
                      )}
                    </div>
                  )}

                  <div
                    onClick={() => fileRef.current?.click()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
                    onDragOver={e => e.preventDefault()}
                    className="border-2 border-dashed border-gray-200 hover:border-amber-400 rounded-xl p-5 cursor-pointer text-center transition-colors group mb-2"
                  >
                    {preview && preview !== prescription.imageUrl ? (
                      <div>
                        <Image src={preview} alt="Preview" width={400} height={128} className="max-h-32 mx-auto rounded-lg object-contain mb-2" />
                        <p className="text-xs text-gray-500 truncate">{fileName}</p>
                        <p className="text-xs text-amber-600 font-medium mt-1">Click to change</p>
                      </div>
                    ) : (
                      <>
                        <FaUpload className="text-gray-300 group-hover:text-amber-400 text-2xl mx-auto mb-2 transition-colors" />
                        <p className="text-sm font-medium text-gray-700">Upload prescription image</p>
                        <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF · Max 10MB</p>
                        <p className="text-xs text-gray-400">Drag &amp; drop or click to browse</p>
                      </>
                    )}
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                  />

                  <button
                    onClick={() => { if (fileRef.current) { fileRef.current.accept = 'image/*'; fileRef.current.click() }}}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors mb-3"
                  >
                    <FaCamera className="text-gray-400" /> Take a photo
                  </button>

                  <button
                    disabled={!preview || preview === prescription.imageUrl}
                    onClick={handleUpload}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    <FaFileMedical /> Scan &amp; Save Prescription
                  </button>

                  {isLoggedIn && (
                    <p className="text-xs text-center text-gray-400 mt-3">
                      Prefer to type it?{' '}
                      <a href={`/${userType || 'patient'}/prescriptions/new`} className="text-[#0C6780] underline">
                        Manual entry
                      </a>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FAB - slot 2: above Wyzo AI */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Prescription"
        title="Prescription"
        className="fixed bottom-[156px] sm:bottom-[80px] right-4 sm:right-5 z-[150]
          h-12 w-40 pl-3 pr-5 rounded-full shadow-lg shadow-black/25
          flex items-center gap-2.5 text-sm font-semibold text-white
          transition-all duration-200 hover:scale-105 active:scale-95"
        style={{ backgroundColor: hasPrescription ? '#f59e0b' : '#0C6780', border: 'none' }}
      >
        <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
          <FaFileMedical className="text-base" />
        </span>
        <span>Prescription</span>
        {isExtracting && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-300 rounded-full flex items-center justify-center border-2 border-white">
            <FaSpinner className="text-white text-[9px] animate-spin" />
          </span>
        )}
        {hasPrescription && !isExtracting && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
        )}
      </button>
    </>
  )
}
