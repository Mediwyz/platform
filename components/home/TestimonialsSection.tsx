'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { FaQuoteLeft, FaStar } from 'react-icons/fa'

interface Testimonial {
  id?: string
  name: string
  role: string
  avatar: string
  rating: number
  quote: string
  countryCode?: string
}

const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    name: 'Marie Dupont',
    role: 'Patient, Mauritius',
    avatar: '/images/hero/patient-1.png',
    rating: 5,
    quote: 'I booked a specialist within minutes and had my video consultation the same afternoon. MediWyz made healthcare feel effortless.',
    countryCode: 'MU',
  },
  {
    name: 'Jean-Paul Rakoto',
    role: 'Patient, Madagascar',
    avatar: '/images/hero/doctor-1.png',
    rating: 5,
    quote: "Finding a trusted nurse for my father's home visits used to be stressful. Now it's a few taps and done — with verified professionals.",
    countryCode: 'MG',
  },
  {
    name: 'Amina Wanjiku',
    role: 'Patient, Kenya',
    avatar: '/images/hero/nurse-1.png',
    rating: 5,
    quote: 'The AI health assistant helped me understand my lab results before my follow-up. I arrived at my appointment already knowing the right questions to ask.',
    countryCode: 'KE',
  },
]

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(FALLBACK_TESTIMONIALS)

  useEffect(() => {
    fetch('/api/cms/testimonials')
      .then(r => r.json())
      .then(json => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setTestimonials(json.data.map((t: any) => ({
            id: t.id,
            name: t.patientName ?? t.name,
            role: t.location ?? t.role,
            avatar: t.avatarUrl ?? t.avatar ?? '',
            rating: t.rating ?? 5,
            quote: t.quote,
            countryCode: t.countryCode,
          })))
        }
      })
      .catch(() => {})
  }, [])

  return (
    <section className="bg-[#001E40] py-12 sm:py-16 border-t border-white/5">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand-sky/60 mb-3">
            What our members say
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Trusted by patients across Africa
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {testimonials.slice(0, 3).map((t, i) => (
            <div
              key={t.id ?? i}
              className="rounded-2xl p-6 border border-white/10 bg-white/5 flex flex-col gap-4 hover:bg-white/[0.08] transition-colors"
            >
              <FaQuoteLeft className="text-brand-sky/30 text-3xl flex-shrink-0" />

              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: Math.min(t.rating, 5) }).map((_, j) => (
                  <FaStar key={j} className="text-yellow-400 text-xs" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm text-white/80 leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                <AvatarOrInitials src={t.avatar} name={t.name} />
                <div>
                  <p className="text-xs font-bold text-white leading-tight">{t.name}</p>
                  <p className="text-[10px] text-brand-sky/60 mt-0.5">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

function AvatarOrInitials({ src, name }: { src: string; name: string }) {
  const [errored, setErrored] = useState(false)

  if (!src || errored) {
    return (
      <div className="w-9 h-9 rounded-full bg-brand-teal/40 ring-2 ring-brand-sky/20 flex items-center justify-center flex-shrink-0">
        <span className="text-[10px] font-bold text-brand-sky">{initials(name)}</span>
      </div>
    )
  }

  return (
    <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-brand-sky/20 flex-shrink-0">
      <Image
        src={src}
        alt={name}
        width={36}
        height={36}
        className="w-full h-full object-cover"
        onError={() => setErrored(true)}
      />
    </div>
  )
}
