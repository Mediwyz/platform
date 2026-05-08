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
    <div className="bg-white border-b border-gray-100 py-9 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-7 text-center">
          How it works
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-12 relative">
          {/* Connector line on desktop */}
          <div className="hidden sm:block absolute top-5 left-[calc(16.67%+12px)] right-[calc(16.67%+12px)] h-px bg-gray-200" aria-hidden="true" />

          {STEPS.map(s => (
            <div key={s.title} className="flex items-start gap-4 sm:flex-col sm:items-center sm:text-center relative">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 z-10"
                style={{ backgroundColor: s.color }}
              >
                <s.icon className="text-white text-lg" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 mb-0.5 sm:mt-3">{s.step}</p>
                <p className="text-base font-bold text-gray-900 mb-1">{s.title}</p>
                <p className="text-sm text-gray-500 leading-snug">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
