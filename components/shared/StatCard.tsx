'use client'

import { useState, useEffect, useRef } from 'react'

interface StatCardProps {
 number: string | number
 label: string
 color?: string
}

function useCountUp(target: number, duration: number = 2000) {
 const [count, setCount] = useState(0)
 const ref = useRef<HTMLDivElement>(null)

 useEffect(() => {
 if (!ref.current || target === 0) return

 const element = ref.current
 const observer = new IntersectionObserver(
 ([entry]) => {
 if (entry.isIntersecting) {
 observer.disconnect()
 const startTime = Date.now()
 const animate = () => {
 const elapsed = Date.now() - startTime
 const progress = Math.min(elapsed / duration, 1)
 const eased = 1 - Math.pow(1 - progress, 3)
 setCount(Math.floor(eased * target))
 if (progress < 1) {
 requestAnimationFrame(animate)
 } else {
 setCount(target)
 }
 }
 requestAnimationFrame(animate)
 }
 },
 { threshold: 0.3 }
 )

 observer.observe(element)
 return () => observer.disconnect()
 }, [target, duration])

 return { count, ref }
}

function parseNumber(val: string | number): number {
 if (typeof val === 'number') return val
 return parseInt(val.replace(/[^0-9]/g, ''), 10) || 0
}

function formatNumber(n: number, original: string | number): string {
 if (typeof original === 'string' && original.includes('+')) {
 return n.toLocaleString() + '+'
 }
 return n.toLocaleString()
}

const StatCard: React.FC<StatCardProps> = ({ number, label, color }) => {
 const numericValue = parseNumber(number)
 const { count, ref } = useCountUp(numericValue, 2000)

 return (
 <div ref={ref} className="text-center">
 <div className={`text-4xl lg:text-5xl font-bold mb-2 ${color || 'text-primary-blue'}`}>
 {formatNumber(count, number)}
 </div>
 <div className="text-soft font-medium">{label}</div>
 </div>
 )
}

export default StatCard
