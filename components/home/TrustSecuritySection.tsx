'use client'

/**
 * TrustSecuritySection - security pillars + FAQ accordion. Addresses the main
 * objections (privacy, how video works, verification, coverage, cost) so visitors
 * convert with confidence. Brand navy/teal/sky, accessible accordion.
 */

import { useState } from 'react'
import { FaLock, FaUserShield, FaBolt, FaFileMedical, FaChevronDown } from 'react-icons/fa'

const PILLARS = [
  { Icon: FaLock,         title: 'End-to-end encrypted',  desc: 'Video, audio and chat are encrypted in transit over WebRTC.' },
  { Icon: FaFileMedical,  title: 'Your data, your consent', desc: 'Records stay private and are never shared without your consent.' },
  { Icon: FaUserShield,   title: 'Verified providers',     desc: 'Every professional is licence-checked before offering care.' },
  { Icon: FaBolt,         title: 'Reliable & real-time',   desc: 'Live bookings, status and alerts you can count on, 24/7.' },
]

const FAQ = [
  { q: 'Is my medical data private?', a: 'Yes. Your records and conversations are encrypted and only shared with the providers you choose. We never sell your data.' },
  { q: 'How do video consultations work?', a: 'You book a slot, then join a secure WebRTC video or audio call from your browser or the app at your scheduled time - no extra software needed.' },
  { q: 'Are the providers verified?', a: 'Every provider is licence-checked and verified before they can offer care on MediWyz.' },
  { q: 'Which countries do you cover?', a: 'MediWyz operates in Mauritius and is expanding across Africa and India, connecting patients to both local and remote providers.' },
  { q: 'How much does it cost?', a: 'Creating an account and browsing providers is free. You only pay for the services you book, at the price each provider sets.' },
]

export default function TrustSecuritySection() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section className="bg-surface border-b border-line py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block text-sm font-semibold tracking-wider uppercase text-[#0C6780] mb-2">
            Trust &amp; security
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-fg">
            Your health, protected at every step
          </h2>
          <p className="mt-3 text-base sm:text-lg text-soft max-w-2xl mx-auto">
            Privacy and safety are built into the platform, not added on. Here&apos;s how we keep your care secure.
          </p>
        </div>

        {/* Security pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-16">
          {PILLARS.map(p => {
            const Icon = p.Icon
            return (
              <div key={p.title} className="rounded-2xl border border-line bg-canvas p-6 hover:shadow-lg transition-shadow">
                <span className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: 'rgba(12,103,128,0.10)', color: '#0C6780' }}>
                  <Icon className="text-xl" />
                </span>
                <h3 className="text-base font-bold text-fg mb-1.5">{p.title}</h3>
                <p className="text-sm text-soft leading-relaxed">{p.desc}</p>
              </div>
            )
          })}
        </div>

        {/* FAQ accordion */}
        <div className="max-w-3xl mx-auto">
          <h3 className="text-xl sm:text-2xl font-bold text-fg text-center mb-7">
            Frequently asked questions
          </h3>
          <div className="divide-y divide-line rounded-2xl border border-line overflow-hidden">
            {FAQ.map((f, i) => {
              const isOpen = open === i
              return (
                <div key={f.q} className="bg-surface">
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-4 text-left px-5 sm:px-6 py-5 cursor-pointer hover:bg-subtle transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0C6780]"
                  >
                    <span className="text-base font-semibold text-fg">{f.q}</span>
                    <FaChevronDown className={`flex-shrink-0 text-[#0C6780] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`grid transition-all duration-200 ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <p className="px-5 sm:px-6 pb-5 -mt-1 text-sm sm:text-base text-soft leading-relaxed">{f.a}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
