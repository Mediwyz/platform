'use client'

import { useState, useEffect } from 'react'
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

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <FaStar key={i} className="text-yellow-400 text-xs" />
      ))}
    </div>
  )
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
            avatar: t.avatarUrl ?? t.avatar ?? '/images/hero/patient-1.png',
            rating: t.rating ?? 5,
            quote: t.quote,
            countryCode: t.countryCode,
          })))
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className="bg-[#f8fafc] border-b border-gray-100 py-10 sm:py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-7 text-center">
          Trusted by patients across Africa
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {testimonials.slice(0, 3).map((t, i) => (
            <div
              key={t.id ?? i}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3"
            >
              <FaQuoteLeft className="text-[#0C6780]/20 text-2xl flex-shrink-0" />

              <p className="text-sm text-gray-600 leading-relaxed flex-1">
                {t.quote}
              </p>

              <div>
                <StarRow count={t.rating} />
                <div className="flex items-center gap-2.5 mt-2.5">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/hero/patient-1.png' }}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 leading-tight">{t.name}</p>
                    <p className="text-[10px] text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
