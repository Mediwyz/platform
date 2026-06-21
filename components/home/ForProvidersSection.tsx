/**
 * ForProvidersSection - a dedicated "are you a practitioner?" block. Split layout:
 * real photo of a provider on one side, value props + CTA on the other.
 * Brand navy/teal/sky. Converts the supply side (the 17+ provider types).
 */

import Image from 'next/image'
import Link from 'next/link'
import { FaCalendarAlt, FaClipboardList, FaWallet, FaUsers, FaArrowRight, FaUserMd } from 'react-icons/fa'

const PERKS = [
  { Icon: FaCalendarAlt,   title: 'Manage your agenda',    desc: 'Set your availability and let patients book you in real time.' },
  { Icon: FaClipboardList, title: 'Your service catalogue', desc: 'List services, build custom workflows and manage stock from one dashboard.' },
  { Icon: FaWallet,        title: 'Track bookings & payments', desc: 'See every booking and payment without the paperwork.' },
  { Icon: FaUsers,         title: 'Reach more patients',    desc: 'Be discovered by patients searching for care near you.' },
]

export default function ForProvidersSection() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24" style={{ background: 'linear-gradient(135deg, #001E40 0%, #0C6780 135%)' }}>
      <span aria-hidden className="pointer-events-none absolute -top-20 right-0 w-96 h-96 rounded-full blur-3xl opacity-20"
            style={{ background: 'radial-gradient(circle, #9AE1FF 0%, transparent 70%)' }} />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Image */}
          <div className="relative h-64 sm:h-80 lg:h-[26rem] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/15">
            <Image
              src="/images/landing/doctor_team.jpg"
              alt="Healthcare providers on MediWyz"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#001E40]/40 to-transparent" />
          </div>

          {/* Content */}
          <div>
            <span className="inline-block text-sm font-semibold tracking-wider uppercase text-brand-sky mb-2">
              For providers
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Grow your practice, the modern way
            </h2>
            <p className="mt-3 text-base sm:text-lg text-white/75 max-w-xl">
              Doctors, nurses, pharmacies, labs and 17+ provider types run their entire practice on MediWyz - bookings, services, consultations and payments in one place.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PERKS.map(p => {
                const Icon = p.Icon
                return (
                  <div key={p.title} className="flex items-start gap-3.5 rounded-2xl bg-white/[0.07] border border-white/10 backdrop-blur-sm p-4">
                    <span className="flex-shrink-0 w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                      <Icon className="text-lg text-brand-sky" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">{p.title}</h3>
                      <p className="text-xs text-white/65 mt-1 leading-relaxed">{p.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-8">
              <Link
                href="/signup?type=provider"
                className="inline-flex items-center gap-2 rounded-xl bg-white text-[#001E40] px-7 py-3.5 text-sm font-bold hover:bg-brand-sky transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#001E40] focus-visible:ring-brand-sky"
              >
                <FaUserMd /> Join as a provider <FaArrowRight className="text-xs" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
