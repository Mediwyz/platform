'use client'

import { FaGooglePlay, FaApple, FaCheckCircle } from 'react-icons/fa'

const PERKS = [
  'Book & manage appointments on the go',
  'Secure video consultations from your phone',
  'Prescriptions, records & reminders in one place',
  'Instant notifications from your providers',
]

export default function AppDownloadSection() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24"
      style={{ background: 'linear-gradient(135deg, #001E40 0%, #0C6780 130%)' }}>
      {/* decorative glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 right-10 w-80 h-80 rounded-full opacity-25 blur-3xl"
             style={{ background: 'radial-gradient(circle, #9AE1FF 0%, transparent 70%)' }} />
        <div className="absolute -bottom-24 -left-10 w-96 h-96 rounded-full opacity-20 blur-3xl"
             style={{ background: 'radial-gradient(circle, #0C6780 0%, transparent 70%)' }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
        {/* Copy + badges */}
        <div>
          <span className="inline-block text-xs font-semibold tracking-wider uppercase text-brand-sky mb-3">
            MediWyz Mobile
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight mb-4">
            Your health, in your pocket
          </h2>
          <p className="text-sm sm:text-base text-gray-300/90 leading-relaxed max-w-lg mb-7">
            Download the MediWyz app and carry your entire care network with you — book, consult and manage your health from anywhere in Mauritius and beyond.
          </p>

          <ul className="space-y-2.5 mb-8">
            {PERKS.map(p => (
              <li key={p} className="flex items-start gap-2.5 text-sm text-gray-200">
                <FaCheckCircle className="text-brand-sky mt-0.5 flex-shrink-0" />
                <span>{p}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/MediWyz-v3.0.0-debug.apk"
              className="inline-flex items-center gap-2.5 rounded-xl bg-white text-[#001E40] pl-3.5 pr-5 py-2.5 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky"
              aria-label="Get it on Google Play"
            >
              <FaGooglePlay className="text-xl" />
              <span className="flex flex-col leading-none">
                <span className="text-[9px] uppercase tracking-wide text-gray-500">Get it on</span>
                <span className="text-sm font-bold">Google Play</span>
              </span>
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2.5 rounded-xl bg-white/10 border border-white/25 text-white pl-3.5 pr-5 py-2.5 backdrop-blur-sm hover:bg-white/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky"
              aria-label="Download on the App Store (coming soon)"
            >
              <FaApple className="text-xl" />
              <span className="flex flex-col leading-none">
                <span className="text-[9px] uppercase tracking-wide text-white/60">Coming soon</span>
                <span className="text-sm font-bold">App Store</span>
              </span>
            </a>
          </div>
        </div>

        {/* Phone mockup (pure CSS — no asset) */}
        <div className="hidden lg:flex justify-center">
          <div className="relative w-64 h-[34rem] rounded-[2.5rem] bg-[#0A1A33] border-[10px] border-[#0a2547] shadow-2xl ring-1 ring-white/10 overflow-hidden">
            {/* notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#0a2547] rounded-b-2xl z-20" />
            {/* screen */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#001E40] to-[#0C6780] flex flex-col items-center pt-14 px-5">
              <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mb-4">
                <span className="text-3xl font-black text-white">M</span>
              </div>
              <div className="text-white font-bold text-lg mb-1">MediWyz</div>
              <div className="text-brand-sky text-[11px] mb-6">Healthcare, Reimagined</div>
              {/* fake cards */}
              <div className="w-full space-y-3">
                {['Find a doctor', 'Video consult', 'Order medicine'].map((t, i) => (
                  <div key={t} className="w-full rounded-xl bg-white/10 border border-white/15 px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-sky/30" />
                    <div className="flex-1">
                      <div className="h-2 w-2/3 rounded bg-white/40 mb-1.5" />
                      <div className="h-1.5 w-1/2 rounded bg-white/20" />
                    </div>
                    {i === 0 && <FaCheckCircle className="text-brand-sky" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
