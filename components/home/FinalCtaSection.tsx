'use client'

import Link from 'next/link'
import { FaArrowRight, FaUserMd } from 'react-icons/fa'

export default function FinalCtaSection() {
  return (
    <section className="bg-surface py-14 sm:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="relative overflow-hidden rounded-3xl px-6 py-12 sm:px-12 sm:py-16 text-center shadow-xl"
          style={{ background: 'linear-gradient(135deg, #001E40 0%, #0C6780 130%)' }}
        >
          {/* glow */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-16 left-1/3 w-72 h-72 rounded-full opacity-25 blur-3xl"
                 style={{ background: 'radial-gradient(circle, #9AE1FF 0%, transparent 70%)' }} />
          </div>

          <div className="relative">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight mb-3">
              Ready to take care of your health?
            </h2>
            <p className="text-sm sm:text-base text-faint/90 max-w-xl mx-auto mb-8">
              Join thousands of patients across Africa, Mauritius & India booking trusted care on MediWyz - it is free to get started.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-surface text-fg px-7 py-3.5 text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-sky"
              >
                Create your free account <FaArrowRight />
              </Link>
              <Link
                href="/signup?type=provider"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/25 text-white px-7 py-3.5 text-sm font-bold backdrop-blur-sm hover:bg-white/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky"
              >
                <FaUserMd /> Join as a provider
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
