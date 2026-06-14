'use client'

/**
 * FeatureShowcase — a bento-grid section that surfaces every core capability of
 * the MediWyz platform (video/audio calls, chat, health shop, feed, emergency,
 * geolocation directory, provider workflow/services management, notifications).
 * Replaces the old "From the Community" block with something that actually shows
 * what the app does. Bento layout (varied card spans), brand navy/teal/sky,
 * soft shadows, glassmorphism accents, hover lift — per ui-ux-pro-max.
 */

import Link from 'next/link'
import type { IconType } from 'react-icons'
import {
  FaVideo, FaComments, FaShoppingBag, FaNewspaper, FaAmbulance,
  FaMapMarkedAlt, FaProjectDiagram, FaBell, FaArrowRight, FaUserMd, FaShieldAlt,
} from 'react-icons/fa'

const NAVY = '#001E40'
const TEAL = '#0C6780'
const SKY = '#9AE1FF'

interface Feature {
  Icon: IconType
  title: string
  desc: string
  href: string
  /** Tailwind column/row span classes for the bento layout (lg+). */
  span?: string
  /** Render as a dark feature tile (navy gradient) for visual rhythm. */
  dark?: boolean
}

const FEATURES: Feature[] = [
  {
    Icon: FaVideo,
    title: 'Video & audio consultations',
    desc: 'Meet any provider over clinic-grade encrypted WebRTC video or audio — from home, at your scheduled time.',
    href: '/search/doctors',
    span: 'lg:col-span-2 lg:row-span-2',
    dark: true,
  },
  {
    Icon: FaMapMarkedAlt,
    title: 'Find care near you',
    desc: 'A live Google map locates the nearest doctors, clinics, labs, pharmacies, organisations and insurers around you.',
    href: '/search/organizations',
    span: 'lg:col-span-2',
  },
  {
    Icon: FaShoppingBag,
    title: 'Health Shop',
    desc: 'Order medicines, vitamins, devices & personal care from verified pharmacies.',
    href: '/search/health-shop',
  },
  {
    Icon: FaComments,
    title: 'Secure chat',
    desc: 'Message your providers directly with end-to-end private conversations.',
    href: '/search/doctors',
  },
  {
    Icon: FaAmbulance,
    title: 'Emergency response',
    desc: 'Dispatch an ambulance and reach emergency responders the moment it matters.',
    href: '/search/emergency',
    dark: true,
  },
  {
    Icon: FaNewspaper,
    title: 'Community feed',
    desc: 'Health tips, case studies and advice from real verified professionals — no login needed.',
    href: '/community',
  },
  {
    Icon: FaProjectDiagram,
    title: 'Provider workflows & services',
    desc: 'Providers build custom workflows, manage their service catalogue, bookings and stock from one dashboard.',
    href: '/signup?type=provider',
    span: 'lg:col-span-2',
  },
  {
    Icon: FaBell,
    title: 'Status & notifications',
    desc: 'Real-time booking status and instant notifications keep everyone in sync.',
    href: '/signup',
  },
  {
    Icon: FaShieldAlt,
    title: 'Insurance & organisations',
    desc: 'Browse insurers, clinics, hospitals and labs across the region in one directory.',
    href: '/search/insurance',
  },
]

export default function FeatureShowcase() {
  return (
    <section className="bg-[#F4FBFF] border-b border-gray-100 py-14 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <span className="inline-block text-xs font-semibold tracking-wider uppercase text-[#0C6780] mb-2">
            One app, everything health
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#001E40]">
            Everything you can do on MediWyz
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-500 max-w-xl mx-auto">
            From a video consultation to ordering medicine, finding the nearest clinic, or running your practice — it all lives in one platform.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[minmax(150px,auto)] gap-4">
          {FEATURES.map(f => {
            const Icon = f.Icon
            if (f.dark) {
              return (
                <Link
                  key={f.title}
                  href={f.href}
                  className={`group relative overflow-hidden rounded-3xl p-6 flex flex-col justify-between text-white shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0C6780] ${f.span ?? ''}`}
                  style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${TEAL} 130%)` }}
                >
                  {/* glow */}
                  <span aria-hidden className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-30"
                        style={{ background: `radial-gradient(circle, ${SKY} 0%, transparent 70%)` }} />
                  <span className="relative w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mb-4">
                    <Icon className="text-xl text-white" />
                  </span>
                  <div className="relative">
                    <h3 className="text-lg font-bold mb-1.5">{f.title}</h3>
                    <p className="text-sm text-white/75 leading-relaxed">{f.desc}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-sky group-hover:gap-2.5 transition-all">
                      Explore <FaArrowRight className="text-[10px]" />
                    </span>
                  </div>
                </Link>
              )
            }
            return (
              <Link
                key={f.title}
                href={f.href}
                className={`group relative overflow-hidden rounded-3xl p-6 flex flex-col justify-between bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C6780] ${f.span ?? ''}`}
              >
                <span className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: 'rgba(12,103,128,0.10)', color: TEAL }}>
                  <Icon className="text-xl" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-[#001E40] mb-1.5">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0C6780] group-hover:gap-2.5 transition-all">
                    Explore <FaArrowRight className="text-[10px]" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Dual audience CTA */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-[#0C6780] text-white px-6 py-3 text-sm font-semibold hover:bg-[#001E40] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0C6780]">
            Get started as a patient <FaArrowRight className="text-xs" />
          </Link>
          <Link href="/signup?type=provider" className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#0C6780]/30 text-[#0C6780] px-6 py-3 text-sm font-semibold hover:border-[#0C6780] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C6780]">
            <FaUserMd className="text-xs" /> Join as a provider
          </Link>
        </div>
      </div>
    </section>
  )
}
