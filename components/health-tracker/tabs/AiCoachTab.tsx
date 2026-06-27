'use client'

import { useState, useEffect } from 'react'
import { FaRobot, FaTint, FaDumbbell, FaUtensils, FaBed, FaArrowRight } from 'react-icons/fa'
import WyzoAssistant from '@/components/shared/WyzoAssistant'

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

export default function AiCoachTab(_props: AiCoachTabProps) {
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
    <button
     onClick={() => setShowChat(false)}
     className="self-start text-xs text-[#0C6780] dark:text-accent hover:underline font-medium px-4 py-2"
    >
     ← Back
    </button>
    <div className="flex-1 min-h-0 px-2 pb-2">
     <WyzoAssistant variant="tab" />
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
     className="flex items-center gap-2 px-5 py-2.5 bg-surface text-fg rounded-xl font-bold text-sm hover:bg-white/90 transition-colors"
    >
     <FaRobot className="text-[#0C6780]" />
     Open Wyzo Chat
     <FaArrowRight className="text-xs" />
    </button>
   </div>

   {/* Today's snapshot */}
   {snapshot && (
    <div className="bg-surface border border-line rounded-2xl shadow-sm p-4">
     <p className="text-xs font-semibold text-fg mb-3 uppercase tracking-wide">Today&apos;s snapshot (Wyzo sees this)</p>
     <div className="grid grid-cols-3 gap-3">
      <div className="text-center">
       <div className="w-10 h-10 rounded-xl bg-[#0C6780]/10 dark:bg-accent/15 flex items-center justify-center mx-auto mb-1">
        <FaUtensils className="text-[#0C6780] dark:text-accent text-sm" />
       </div>
       <p className="text-xs font-bold text-fg">{snapshot.calories}</p>
       <p className="text-[10px] text-faint">of {snapshot.targetCalories} cal</p>
      </div>
      <div className="text-center">
       <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/15 flex items-center justify-center mx-auto mb-1">
        <FaTint className="text-sky-500 text-sm" />
       </div>
       <p className="text-xs font-bold text-fg">{snapshot.waterMl}ml</p>
       <p className="text-[10px] text-faint">of {snapshot.targetWaterMl}ml</p>
      </div>
      <div className="text-center">
       <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center mx-auto mb-1">
        <FaDumbbell className="text-emerald-500 text-sm" />
       </div>
       <p className="text-xs font-bold text-fg">{snapshot.exerciseMin} min</p>
       <p className="text-[10px] text-faint">exercise</p>
      </div>
     </div>
    </div>
   )}

   {/* Quick prompts */}
   <div>
    <p className="text-xs font-semibold text-fg mb-3 uppercase tracking-wide">Quick questions</p>
    <div className="grid grid-cols-2 gap-3">
     {QUICK_PROMPTS.map(({ label, prompt, icon: Icon }) => (
      <button
       key={label}
       onClick={() => { setShowChat(true); setTimeout(() => openWyzoWithMessage(prompt), 300) }}
       className="flex flex-col items-start gap-2 p-3.5 bg-surface rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 text-left border border-line"
      >
       <div className="w-9 h-9 rounded-lg bg-[#0C6780]/10 dark:bg-accent/15 flex items-center justify-center">
        <Icon className="text-[#0C6780] dark:text-accent text-sm" />
       </div>
       <p className="text-xs font-semibold text-fg leading-tight">{label}</p>
      </button>
     ))}
    </div>
   </div>

   {/* Open Wyzo floating widget tip */}
   <div className="flex items-center gap-3 p-4 bg-subtle rounded-xl">
    <FaRobot className="text-2xl text-[#0C6780] dark:text-accent flex-shrink-0" />
    <div>
     <p className="text-xs font-semibold text-fg">Also available as a floating widget</p>
     <p className="text-xs text-soft mt-0.5">Tap the Wyzo AI button at the bottom-right of any page for quick access.</p>
    </div>
   </div>
  </div>
 )
}
