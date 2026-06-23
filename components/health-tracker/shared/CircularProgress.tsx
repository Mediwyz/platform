'use client'

import { useEffect, useState } from 'react'

export interface CircularProgressProps {
 consumed: number
 target: number
 burned?: number
 size?: number
 strokeWidth?: number
}

export default function CircularProgress({
 consumed,
 target,
 burned,
 size = 200,
 strokeWidth = 12,
}: CircularProgressProps) {
 const [mounted, setMounted] = useState(false)

 useEffect(() => {
 const timer = setTimeout(() => setMounted(true), 50)
 return () => clearTimeout(timer)
 }, [])

 const radius = (size - strokeWidth) / 2
 const circumference = 2 * Math.PI * radius
 const ratio = target > 0 ? consumed / target : 0
 const clampedRatio = Math.min(ratio, 1.5)
 const offset = circumference - clampedRatio * circumference

 const getColor = () => {
 if (ratio > 1) return 'text-red-500'
 if (ratio >= 0.8) return 'text-yellow-500'
 return 'text-green-500'
 }

 const getStrokeColor = () => {
 if (ratio > 1) return '#ef4444'
 if (ratio >= 0.8) return '#eab308'
 return '#22c55e'
 }

 return (
 <div className="flex flex-col items-center">
 <div className="relative" style={{ width: size, height: size }}>
 <svg
 width={size}
 height={size}
 viewBox={`0 0 ${size} ${size}`}
 className="transform -rotate-90"
 >
 {/* Background circle */}
 <circle
 cx={size / 2}
 cy={size / 2}
 r={radius}
 fill="none"
 stroke="#e5e7eb"
 strokeWidth={strokeWidth}
 />
 {/* Progress circle */}
 <circle
 cx={size / 2}
 cy={size / 2}
 r={radius}
 fill="none"
 stroke={getStrokeColor()}
 strokeWidth={strokeWidth}
 strokeLinecap="round"
 strokeDasharray={circumference}
 strokeDashoffset={mounted ? offset : circumference}
 style={{
 transition: 'stroke-dashoffset 1s ease-in-out',
 }}
 />
 </svg>
 {/* Center text */}
 <div className="absolute inset-0 flex flex-col items-center justify-center">
 <span className={`text-3xl font-bold ${getColor()}`}>
 {consumed}
 </span>
 <span className="text-xs text-soft">of {target} cal</span>
 </div>
 </div>
 {burned !== undefined && burned > 0 && (
 <div className="mt-2 flex items-center gap-1 text-sm text-orange-500">
 <span className="font-medium">{burned} cal</span>
 <span className="text-faint">burned</span>
 </div>
 )}
 </div>
 )
}
