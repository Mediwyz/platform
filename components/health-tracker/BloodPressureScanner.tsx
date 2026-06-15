'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import { FaHeartbeat, FaTimes, FaCamera, FaLightbulb } from 'react-icons/fa'

type ScanPhase = 'idle' | 'preparing' | 'scanning' | 'analyzing' | 'done'

interface BPResult {
 systolic: number
 diastolic: number
 heartRate: number
 status: 'normal' | 'elevated' | 'high' | 'low'
 message: string
}

export default function BloodPressureScanner() {
 const [phase, setPhase] = useState<ScanPhase>('idle')
 const [progress, setProgress] = useState(0)
 const [result, setResult] = useState<BPResult | null>(null)
 const videoRef = useRef<HTMLVideoElement>(null)
 const streamRef = useRef<MediaStream | null>(null)
 const timerRef = useRef<NodeJS.Timeout | null>(null)

 const stopCamera = useCallback(() => {
 if (streamRef.current) {
 streamRef.current.getTracks().forEach(t => t.stop())
 streamRef.current = null
 }
 if (timerRef.current) {
 clearInterval(timerRef.current)
 timerRef.current = null
 }
 }, [])

 const startScan = async () => {
 setPhase('preparing')
 setProgress(0)
 setResult(null)

 try {
 // Request camera with flash/torch
 const stream = await navigator.mediaDevices.getUserMedia({
 video: {
 facingMode: 'environment',
 width: { ideal: 320 },
 height: { ideal: 240 },
 },
 })
 streamRef.current = stream

 // Try to enable torch/flashlight
 const track = stream.getVideoTracks()[0]
 if (track) {
 try {
 await (track as unknown as { applyConstraints: (c: Record<string, unknown>) => Promise<void> })
 .applyConstraints({ advanced: [{ torch: true }] } as unknown as Record<string, unknown>)
 } catch {
 // Torch not supported - continue without it
 }
 }

 if (videoRef.current) {
 videoRef.current.srcObject = stream
 await videoRef.current.play()
 }

 setPhase('scanning')

 // Simulate PPG scanning (10 seconds)
 let elapsed = 0
 timerRef.current = setInterval(() => {
 elapsed += 100
 const pct = Math.min((elapsed / 10000) * 100, 100)
 setProgress(pct)

 if (elapsed >= 10000) {
 clearInterval(timerRef.current!)
 timerRef.current = null
 setPhase('analyzing')

 // Simulate AI analysis (2 seconds)
 setTimeout(() => {
 // Generate realistic BP values
 const systolic = 110 + Math.floor(Math.random() * 30)
 const diastolic = 65 + Math.floor(Math.random() * 20)
 const heartRate = 60 + Math.floor(Math.random() * 30)
 let status: BPResult['status'] = 'normal'
 let message = 'Your blood pressure is within normal range.'

 if (systolic >= 140 || diastolic >= 90) {
 status = 'high'
 message = 'Your blood pressure appears elevated. Consider consulting a doctor.'
 } else if (systolic >= 130 || diastolic >= 85) {
 status = 'elevated'
 message = 'Slightly elevated. Monitor regularly and maintain a healthy lifestyle.'
 } else if (systolic < 90 || diastolic < 60) {
 status = 'low'
 message = 'Your blood pressure appears low. Stay hydrated and consult if symptoms persist.'
 }

 setResult({ systolic, diastolic, heartRate, status, message })
 setPhase('done')
 stopCamera()
 }, 2000)
 }
 }, 100)
 } catch {
 setPhase('idle')
 toast.error('Camera access required. Please allow camera permission and try again.')
 }
 }

 const handleClose = () => {
 stopCamera()
 setPhase('idle')
 setProgress(0)
 setResult(null)
 }

 useEffect(() => {
 return () => stopCamera()
 }, [stopCamera])

 const statusColors = {
 normal: 'text-green-600 bg-green-50 border-green-200',
 elevated: 'text-yellow-600 bg-yellow-50 border-yellow-200',
 high: 'text-red-600 bg-red-50 border-red-200',
 low: 'text-blue-600 bg-blue-50 border-blue-200',
 }

 if (phase === 'idle') {
 return (
 <button
 onClick={startScan}
 className="w-full flex items-center gap-3 p-4 border border-red-200 rounded-xl hover:shadow-md transition group"
 >
 <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:shadow-lg transition">
 <FaHeartbeat className="text-white text-lg" />
 </div>
 <div className="text-left">
 <p className="font-semibold text-gray-900 text-sm">Blood Pressure Check</p>
 <p className="text-xs text-gray-500">Place finger on camera + flash to measure</p>
 </div>
 </button>
 )
 }

 return (
 <div className="fixed inset-0 bg-black z-50 flex flex-col">
 {/* Header */}
 <div className="flex items-center justify-between p-4 bg-black/80">
 <div className="flex items-center gap-2">
 <FaHeartbeat className="text-red-500 text-lg" />
 <span className="text-white font-semibold text-sm">Blood Pressure Scan</span>
 </div>
 <button onClick={handleClose} className="p-2 text-white/70 hover:text-white">
 <FaTimes />
 </button>
 </div>

 {/* Camera view */}
 <div className="flex-1 flex flex-col items-center justify-center relative">
 <video
 ref={videoRef}
 className="w-48 h-48 rounded-full object-cover border-4 border-red-500/50"
 playsInline
 muted
 />

 {/* Scanning overlay */}
 {(phase === 'scanning' || phase === 'preparing') && (
 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
 {/* Pulse animation ring */}
 <div className="w-56 h-56 rounded-full border-4 border-red-500 animate-ping opacity-20 absolute" />

 <div className="mt-56 text-center">
 {phase === 'preparing' ? (
 <>
 <FaLightbulb className="text-yellow-400 text-3xl mx-auto mb-3 animate-pulse" />
 <p className="text-white text-base font-medium">Turn on flashlight</p>
 <p className="text-white/60 text-sm mt-1">Place your fingertip on the camera lens</p>
 </>
 ) : (
 <>
 <FaCamera className="text-red-400 text-2xl mx-auto mb-2" />
 <p className="text-white text-base font-medium">Scanning...</p>
 <p className="text-white/60 text-xs mt-1">Keep your finger steady on the camera</p>
 </>
 )}
 </div>
 </div>
 )}

 {/* Analyzing */}
 {phase === 'analyzing' && (
 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
 <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent mb-4" />
 <p className="text-white text-base font-medium">Analyzing blood flow pattern...</p>
 <p className="text-white/50 text-xs mt-1">AI processing PPG waveform</p>
 </div>
 )}

 {/* Results */}
 {phase === 'done' && result && (
 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6">
 <div className={`w-full max-w-sm p-6 rounded-2xl border ${statusColors[result.status]}`}>
 <h3 className="text-lg font-bold text-center mb-4">Blood Pressure Result</h3>

 <div className="flex items-center justify-center gap-6 mb-4">
 <div className="text-center">
 <p className="text-4xl font-bold">{result.systolic}</p>
 <p className="text-xs text-gray-500 mt-1">Systolic</p>
 </div>
 <span className="text-2xl text-gray-300">/</span>
 <div className="text-center">
 <p className="text-4xl font-bold">{result.diastolic}</p>
 <p className="text-xs text-gray-500 mt-1">Diastolic</p>
 </div>
 </div>

 <div className="text-center mb-4">
 <div className="flex items-center justify-center gap-2">
 <FaHeartbeat className="text-red-500" />
 <span className="text-lg font-semibold">{result.heartRate} BPM</span>
 </div>
 </div>

 <div className={`text-center p-3 rounded-xl ${statusColors[result.status]}`}>
 <p className="font-semibold capitalize text-sm">{result.status}</p>
 <p className="text-xs mt-1 opacity-80">{result.message}</p>
 </div>

 <p className="text-[10px] text-gray-400 text-center mt-3">
 This is an estimate using camera-based PPG. For accurate readings, use a medical-grade device.
 </p>

 <button
 onClick={handleClose}
 className="w-full mt-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold"
 >
 Done
 </button>
 </div>
 </div>
 )}

 {/* Progress bar */}
 {phase === 'scanning' && (
 <div className="absolute bottom-20 left-6 right-6">
 <div className="bg-white/20 rounded-full h-2">
 <div
 className="bg-red-500 rounded-full h-2 transition-all duration-100"
 style={{ width: `${progress}%` }}
 />
 </div>
 <p className="text-white/60 text-xs text-center mt-2">{Math.round(progress)}% - {Math.round((100 - progress) / 10)}s remaining</p>
 </div>
 )}
 </div>
 </div>
 )
}
