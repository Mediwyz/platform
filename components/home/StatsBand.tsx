'use client'

/**
 * StatsBand - an animated impact band that builds trust with concrete numbers.
 * Counters count up when scrolled into view. Brand navyteal gradient + sky glows.
 */

import { useEffect, useRef, useState } from 'react'

const STATS = [
  { value: 500, suffix: '+', label: 'Verified providers' },
  { value: 15, suffix: '+', label: 'Medical specialties' },
  { value: 11, suffix: '+', label: 'Provider types' },
  { value: 6, suffix: '', label: 'Countries served' },
]

const SKY = '#9AE1FF'

function Stat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [n, setN] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        const t0 = performance.now()
        const dur = 1400
        const tick = (t: number) => {
          const p = Math.min((t - t0) / dur, 1)
          setN(Math.round((1 - Math.pow(1 - p, 3)) * value))
          if (p < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0.4 }
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [value])

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tabular-nums leading-none">
        {n}
        <span className="text-brand-sky">{suffix}</span>
      </div>
      <div className="mt-2 text-sm sm:text-base text-white/70">{label}</div>
    </div>
  )
}

export default function StatsBand() {
  return (
    <section
      className="relative overflow-hidden py-14 sm:py-20 border-b border-white/10"
      style={{ background: 'linear-gradient(135deg, #001E40 0%, #0C6780 135%)' }}
    >
      <span aria-hidden className="pointer-events-none absolute -top-16 -left-10 w-72 h-72 rounded-full blur-3xl opacity-25"
            style={{ background: `radial-gradient(circle, ${SKY} 0%, transparent 70%)` }} />
      <span aria-hidden className="pointer-events-none absolute -bottom-20 right-0 w-80 h-80 rounded-full blur-3xl opacity-20"
            style={{ background: `radial-gradient(circle, ${SKY} 0%, transparent 70%)` }} />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12">
          <span className="inline-block text-sm font-semibold tracking-wider uppercase text-brand-sky mb-2">
            Trusted across the region
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
            Real care, real impact
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6">
          {STATS.map(s => (
            <Stat key={s.label} {...s} />
          ))}
        </div>
      </div>
    </section>
  )
}
