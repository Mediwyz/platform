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
    <section className="bg-white border-b border-gray-100 py-14 sm:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <span className="inline-block text-xs font-semibold tracking-wider uppercase text-[#0C6780] mb-2">
            How it works
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#001E40]">
            Care in three simple steps
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-500 max-w-lg mx-auto">
            From finding the right provider to your consultation — the whole journey takes minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 relative">
          {/* Connector line on desktop */}
          <div className="hidden sm:block absolute top-12 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-[#0C6780]/20 via-[#0C6780]/40 to-[#0C6780]/20" aria-hidden="true" />

          {STEPS.map(s => (
            <div
              key={s.title}
              className="group relative flex flex-col items-center text-center bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 px-6 py-8"
            >
              {/* Step number badge */}
              <span className="absolute top-4 right-4 text-xs font-black text-gray-200 group-hover:text-[#0C6780]/30 transition-colors">
                {s.step}
              </span>

              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center z-10 mb-4 shadow-md transition-transform group-hover:scale-105"
                style={{ backgroundColor: s.color }}
              >
                <s.icon className="text-white text-xl" />
              </div>

              <h3 className="text-lg font-bold text-[#001E40] mb-1.5">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
