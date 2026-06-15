'use client'

import { useState, useEffect } from 'react'
import { FaRobot, FaTint, FaDumbbell, FaUtensils, FaBed, FaArrowRight } from 'react-icons/fa'
import BotHealthAssistant from '@/app/patient/(dashboard)/components/BotHealthAssistant'

interface AiCoachTabProps {
 userName?: string
 healthScore?: number
}

interface TodaySnapshot {
 calories: number
 targetCalories: number
 waterMl: number
 targetWaterMl: number
 exerciseMin: number
}

function openWyzoWithMessage(message: string) {
 window.dispatchEvent(new CustomEvent('wyzo:ask', { detail: { message } }))
}

const QUICK_PROMPTS = [
 { label: "Today's meal plan", prompt: "Based on my health data, suggest a meal plan for the rest of today.", icon: FaUtensils },
 { label: "Exercise advice", prompt: "What exercise should I do today given my recent activity levels?", icon: FaDumbbell },
 { label: "Hydration check", prompt: "How am I doing with hydration today and what should I drink?", icon: FaTint },
 { label: "Sleep improvement", prompt: "How can I improve my sleep quality based on my recent sleep patterns?", icon: FaBed },
]

export default function AiCoachTab({ userName, healthScore }: AiCoachTabProps) {
 const [snapshot, setSnapshot] = useState<TodaySnapshot | null>(null)
 const [showChat, setShowChat] = useState(false)

 useEffect(() => {
  fetch('/api/ai/health-tracker/dashboard', { credentials: 'include' })
   .then(r => r.json())
   .then(j => {
    if (j.success && j.data) {
     const d = j.data
     const n = (v: unknown) => Number.isFinite(Number(v)) ? Number(v) : 0
     setSnapshot({
      calories: n(d.caloriesConsumed),
      targetCalories: n(d.targetCalories) || 2000,
      waterMl: n(d.waterConsumedMl),
      targetWaterMl: n(d.waterTargetMl) || 2000,
      exerciseMin: n(d.exerciseMinutes),
     })
    }
   })
   .catch(() => {})
 }, [])

 if (showChat) {
  return (
   <div className="h-full flex flex-col">
    <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
     <button
      onClick={() => setShowChat(false)}
      className="text-xs text-[#0C6780] hover:text-[#001E40] font-medium"
     >
      ← Back
     </button>
     <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#001E40] to-[#0C6780] flex items-center justify-center">
       <FaRobot className="text-white text-xs" />
      </div>
      <span className="text-sm font-bold text-[#001E40]">Wyzo - Health AI</span>
     </div>
    </div>
    <div className="flex-1 min-h-0">
     <BotHealthAssistant userName={userName} healthScore={healthScore} />
    </div>
   </div>
  )
 }

 return (
  <div className="p-4 space-y-5">
   {/* Wyzo Hero */}
   <div className="bg-gradient-to-br from-[#001E40] to-[#0C6780] rounded-2xl p-5 text-white">
    <div className="flex items-center gap-3 mb-3">
     <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
      <FaRobot className="text-white text-2xl" />
     </div>
     <div>
      <p className="font-bold text-lg">Wyzo - Your Health AI</p>
      <div className="flex items-center gap-1.5 mt-0.5">
       <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
       <span className="text-white/70 text-xs">Online • Responds instantly</span>
      </div>
     </div>
    </div>
    <p className="text-white/70 text-sm leading-relaxed mb-4">
     I have full access to your health tracker history. Ask me anything about nutrition, exercise, sleep, or your wellness goals.
    </p>
    <button
     onClick={() => setShowChat(true)}
     className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#001E40] rounded-xl font-bold text-sm hover:bg-white/90 transition-colors"
    >
     <FaRobot className="text-[#0C6780]" />
     Open Wyzo Chat
     <FaArrowRight className="text-xs" />
    </button>
   </div>

   {/* Today's snapshot */}
   {snapshot && (
    <div className="bg-white rounded-xl shadow-sm p-4">
     <p className="text-xs font-semibold text-[#001E40] mb-3 uppercase tracking-wide">Today&apos;s snapshot (Wyzo sees this)</p>
     <div className="grid grid-cols-3 gap-3">
      <div className="text-center">
       <div className="w-10 h-10 rounded-xl bg-[#001E40]/5 flex items-center justify-center mx-auto mb-1">
        <FaUtensils className="text-[#0C6780] text-sm" />
       </div>
       <p className="text-xs font-bold text-[#001E40]">{snapshot.calories}</p>
       <p className="text-[10px] text-gray-400">of {snapshot.targetCalories} cal</p>
      </div>
      <div className="text-center">
       <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center mx-auto mb-1">
        <FaTint className="text-sky-500 text-sm" />
       </div>
       <p className="text-xs font-bold text-[#001E40]">{snapshot.waterMl}ml</p>
       <p className="text-[10px] text-gray-400">of {snapshot.targetWaterMl}ml</p>
      </div>
      <div className="text-center">
       <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-1">
        <FaDumbbell className="text-emerald-500 text-sm" />
       </div>
       <p className="text-xs font-bold text-[#001E40]">{snapshot.exerciseMin} min</p>
       <p className="text-[10px] text-gray-400">exercise</p>
      </div>
     </div>
    </div>
   )}

   {/* Quick prompts */}
   <div>
    <p className="text-xs font-semibold text-[#001E40] mb-3 uppercase tracking-wide">Quick questions</p>
    <div className="grid grid-cols-2 gap-3">
     {QUICK_PROMPTS.map(({ label, prompt, icon: Icon }) => (
      <button
       key={label}
       onClick={() => { setShowChat(true); setTimeout(() => openWyzoWithMessage(prompt), 300) }}
       className="flex flex-col items-start gap-2 p-3.5 bg-white rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 text-left border border-gray-100"
      >
       <div className="w-9 h-9 rounded-lg bg-[#001E40]/8 flex items-center justify-center">
        <Icon className="text-[#0C6780] text-sm" />
       </div>
       <p className="text-xs font-semibold text-[#001E40] leading-tight">{label}</p>
      </button>
     ))}
    </div>
   </div>

   {/* Open Wyzo floating widget tip */}
   <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl">
    <span className="text-2xl">💬</span>
    <div>
     <p className="text-xs font-semibold text-[#001E40]">Also available as a floating widget</p>
     <p className="text-xs text-gray-500 mt-0.5">Tap the Wyzo AI button at the bottom-right of any page for quick access.</p>
    </div>
   </div>
  </div>
 )
}
