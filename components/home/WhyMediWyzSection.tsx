import {
  FaUserShield, FaBolt, FaVideo, FaMapMarkerAlt, FaLock, FaHeadset,
} from 'react-icons/fa'

const FEATURES = [
  {
    Icon: FaUserShield,
    title: 'Verified professionals',
    desc: 'Every provider is licence-checked and verified before they can offer care on MediWyz.',
  },
  {
    Icon: FaBolt,
    title: 'Same-day booking',
    desc: 'Skip the waiting room. Find an available slot and confirm in just a few taps.',
  },
  {
    Icon: FaVideo,
    title: 'Secure video care',
    desc: 'Consult from home over encrypted WebRTC video — clinic-grade, end to end.',
  },
  {
    Icon: FaMapMarkerAlt,
    title: 'Care near you',
    desc: 'A live map finds the nearest doctor, clinic, lab or pharmacy around your location.',
  },
  {
    Icon: FaLock,
    title: 'Private by design',
    desc: 'Your records and conversations are encrypted and never shared without your consent.',
  },
  {
    Icon: FaHeadset,
    title: 'Real human support',
    desc: 'Our team is one message away whenever you need help with a booking or your account.',
  },
]

export default function WhyMediWyzSection() {
  return (
    <section className="bg-[#F4FBFF] border-b border-gray-100 py-14 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-14">
          <span className="inline-block text-xs font-semibold tracking-wider uppercase text-[#0C6780] mb-2">
            Why MediWyz
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#001E40]">
            Healthcare that actually works for you
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-500 max-w-xl mx-auto">
            One trusted platform for every kind of care — built around your time, your privacy and your peace of mind.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {FEATURES.map(f => {
            const Icon = f.Icon
            return (
              <div
                key={f.title}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 p-6"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors"
                     style={{ background: 'rgba(12,103,128,0.10)', color: '#0C6780' }}>
                  <Icon className="text-xl" />
                </div>
                <h3 className="text-base font-bold text-[#001E40] mb-1.5">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
