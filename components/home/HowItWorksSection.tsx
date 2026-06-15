import { FaSearch, FaCalendarCheck, FaVideo } from 'react-icons/fa'

const STEPS = [
  {
    icon: FaSearch,
    color: '#0C6780',
    step: '01',
    title: 'Search',
    desc: 'Find the right specialist or service for your health need — by type, specialty, or location.',
  },
  {
    icon: FaCalendarCheck,
    color: '#001E40',
    step: '02',
    title: 'Book',
    desc: 'Choose a time that works for you. Same-day appointments are often available.',
  },
  {
    icon: FaVideo,
    color: '#0a5c73',
    step: '03',
    title: 'Consult',
    desc: 'Meet in-person, by video call, or at home — your schedule, your choice.',
  },
]

export default function HowItWorksSection() {
  return (
    <section className="bg-white border-b border-gray-100 py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="inline-block text-sm font-semibold tracking-wider uppercase text-[#0C6780] mb-2">
            How it works
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#001E40]">
            Care in three simple steps
          </h2>
          <p className="mt-3 text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
            From finding the right provider to your consultation — the whole journey takes minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 relative">
          {/* Connector line on desktop */}
          <div className="hidden sm:block absolute top-16 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-[#0C6780]/20 via-[#0C6780]/40 to-[#0C6780]/20" aria-hidden="true" />

          {STEPS.map(s => (
            <div
              key={s.title}
              className="group relative flex flex-col items-center text-center bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200 px-8 py-12"
            >
              {/* Step number badge */}
              <span className="absolute top-5 right-6 text-2xl font-black text-gray-100 group-hover:text-[#0C6780]/20 transition-colors">
                {s.step}
              </span>

              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center z-10 mb-6 shadow-lg transition-transform group-hover:scale-105"
                style={{ backgroundColor: s.color }}
              >
                <s.icon className="text-white text-3xl" />
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-[#001E40] mb-2.5">{s.title}</h3>
              <p className="text-base text-gray-500 leading-relaxed max-w-xs">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
