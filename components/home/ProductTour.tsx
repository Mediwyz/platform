'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MdArrowForward } from 'react-icons/md'

/**
 * Product Tour  real screenshots of the live app, grouped by audience, so the
 * landing page shows exactly what MediWyz does. Images are captured by
 * scripts/capture-showcase.mjs into /public/showcase/*.png  re-run it to refresh.
 */

interface Shot {
  key: string
  title: string
  desc: string
}

const TABS: { id: 'members' | 'providers'; label: string; shots: Shot[] }[] = [
  {
    id: 'members',
    label: 'For Members',
    shots: [
      { key: 'home',                 title: 'Discover care',         desc: 'Find providers, services, organisations and the Health Shop from one place.' },
      { key: 'find-providers',       title: 'Find a provider',       desc: 'Search doctors, nurses and specialists  see who offers video, home or office visits.' },
      { key: 'member-dashboard',     title: 'Your dashboard',        desc: 'Appointments, health score and quick actions at a glance.' },
      { key: 'member-consultations', title: 'Consultations',         desc: 'Track every booking through its live workflow steps.' },
      { key: 'member-billing',       title: 'Wallet & plans',        desc: 'Top up or reset credit, manage payment methods and choose a plan.' },
      { key: 'member-health',        title: 'AI health assistant',   desc: 'Chat, track meals and vitals, and get personalised guidance.' },
      { key: 'member-video',         title: 'Video consultations',   desc: 'Secure in-app video calls with your provider.' },
      { key: 'health-shop',          title: 'Health Shop',           desc: 'Order medicines and health products from any provider.' },
    ],
  },
  {
    id: 'providers',
    label: 'For Providers',
    shots: [
      { key: 'provider-dashboard',    title: 'Provider dashboard',   desc: 'Bookings, revenue and patients in a single view.' },
      { key: 'provider-services',     title: 'My Services',          desc: 'Create a service and configure its appointment types with the guided wizard.' },
      { key: 'provider-workflows',    title: 'Workflows',            desc: 'Design how each booking progresses  steps, actions and auto-notifications.' },
      { key: 'provider-inventory',    title: 'Inventory',            desc: 'Sell products on the Health Shop, as yourself or under your pharmacy.' },
      { key: 'provider-availability', title: 'Availability',         desc: 'Define exactly when patients can book you.' },
    ],
  },
]

export default function ProductTour() {
  const [tab, setTab] = useState<'members' | 'providers'>('members')
  const [index, setIndex] = useState(0)

  const active = TABS.find(t => t.id === tab)!
  const shot = active.shots[index]

  return (
    <section className="relative py-16 sm:py-24 bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="inline-block text-sm font-semibold tracking-wider uppercase text-[#0C6780] mb-2">
            See it in action
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#001E40]">
            Every feature, one platform
          </h2>
          <p className="mt-3 text-base sm:text-lg text-soft max-w-2xl mx-auto">
            A real look at MediWyz  from booking and video care to provider tools and workflows.
          </p>
        </div>

        {/* Audience tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 bg-subtle rounded-full">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setIndex(0) }}
                className={`px-5 sm:px-6 py-2 rounded-full text-sm font-semibold transition-colors ${
                  tab === t.id ? 'bg-surface text-[#0C6780] shadow-sm' : 'text-soft hover:text-soft'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6 lg:gap-8 items-start">
          {/* Framed screenshot */}
          <div className="rounded-2xl border border-line shadow-xl overflow-hidden bg-surface">
            <div className="flex items-center gap-1.5 px-4 py-2.5 bg-subtle border-b border-line">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-3 text-xs text-faint truncate">mediwyz.com  {shot.title}</span>
            </div>
            <div className="relative aspect-[1280/820] bg-subtle">
              <Image
                key={shot.key}
                src={`/showcase/${shot.key}.png`}
                alt={shot.title}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover object-top"
                priority={index === 0}
              />
            </div>
          </div>

          {/* Feature list  click to switch the preview */}
          <div className="space-y-2">
            {active.shots.map((s, i) => (
              <button
                key={s.key}
                onClick={() => setIndex(i)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  i === index
                    ? 'border-[#0C6780] bg-[#0C6780]/5 shadow-sm'
                    : 'border-line hover:border-line hover:bg-subtle'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-bold ${i === index ? 'text-[#0C6780]' : 'text-[#001E40]'}`}>{s.title}</span>
                  {i === index && <MdArrowForward className="text-[#0C6780] flex-shrink-0" aria-hidden />}
                </div>
                <p className="text-xs text-soft mt-0.5">{s.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
