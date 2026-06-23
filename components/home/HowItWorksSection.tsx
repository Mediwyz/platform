import Image from 'next/image'
import { FaSearch, FaCalendarCheck, FaVideo } from 'react-icons/fa'

const STEPS = [
  {
    icon: FaSearch,
    color: '#0C6780',
    step: '01',
    title: 'Search',
    desc: 'Find the right specialist or service for your health need - by type, specialty, or location.',
    img: 'find_care_map.jpg',
  },
  {
    icon: FaCalendarCheck,
    color: '#001E40',
    step: '02',
    title: 'Book',
    desc: 'Choose a time that works for you. Same-day appointments are often available.',
    img: 'booking.jpg',
  },
  {
    icon: FaVideo,
    color: '#0a5c73',
    step: '03',
    title: 'Consult',
    desc: 'Meet in-person, by video call, or at home - your schedule, your choice.',
    img: 'video_consult.jpg',
  },
]

export default function HowItWorksSection() {
  return (
    <section className="bg-surface border-b border-line py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="inline-block text-sm font-semibold tracking-wider uppercase text-[#0C6780] mb-2">
            How it works
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-fg">
            Care in three simple steps
          </h2>
          <p className="mt-3 text-base sm:text-lg text-soft max-w-2xl mx-auto">
            From finding the right provider to your consultation - the whole journey takes minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          {STEPS.map(s => {
            const Icon = s.icon
            return (
              <div
                key={s.title}
                className="group relative flex flex-col bg-surface rounded-3xl border border-line shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200 overflow-hidden"
              >
                {/* Photo header with icon + step number */}
                <div className="relative h-44 w-full overflow-hidden">
                  <Image
                    src={`/images/landing/${s.img}`}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#001E40]/60 via-[#001E40]/10 to-transparent" />
                  <span
                    className="absolute top-4 left-4 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105"
                    style={{ backgroundColor: s.color }}
                  >
                    <Icon className="text-white text-xl" />
                  </span>
                  <span className="absolute top-3 right-5 text-3xl font-black text-white/85 drop-shadow">{s.step}</span>
                </div>

                <div className="px-7 py-7">
                  <h3 className="text-xl sm:text-2xl font-bold text-fg mb-2">{s.title}</h3>
                  <p className="text-base text-soft leading-relaxed">{s.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
