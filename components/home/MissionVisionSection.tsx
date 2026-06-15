import { FaBullseye, FaEye, FaRocket } from 'react-icons/fa'

const MissionVisionSection: React.FC = () => {
 return (
 <section className="py-16 ">
 <div className="container mx-auto px-4">
 <div className="grid lg:grid-cols-2 gap-12">
 {/* Mission */}
 <div className="bg-white rounded-2xl p-8 shadow-lg card-hover">
 <div className="flex items-center gap-3 mb-6">
 <div className="w-12 h-12 bg-gradient-blue rounded-xl flex items-center justify-center">
 <FaBullseye className="text-white text-xl" />
 </div>
 <div>
 <span className="text-3xl">🩺</span>
 <h3 className="text-2xl font-bold text-gray-900 ml-2">OUR MISSION</h3>
 </div>
 </div>
 
 <div className="mb-6">
 <h4 className="text-xl font-semibold text-primary-blue mb-4">
 To be the largest tech-led healthcare provider in Mauritius.
 </h4>
 
 <p className="text-gray-700 leading-relaxed mb-4">
 Driven by our tech-led and holistic approach to healthcare - and a mission to simplify and improve access to quality care - we&apos;ve evolved beyond telemedicine into a comprehensive healthtech company.
 </p>
 
 <p className="text-gray-600 mb-4">
 MediWyz delivers a diverse range of services within a cohesive ecosystem, designed to meet the needs of modern Mauritians. From virtual consultations and diagnostics to wellness programs and medicine delivery, our platform empowers users to access trusted care from anywhere, anytime.
 </p>
 
 <p className="text-gray-700 font-medium">
 We&apos;re building a future where healthcare is not just accessible, but seamless, personalized, and powered by innovation.
 </p>
 </div>
 </div>

 {/* Vision */}
 <div className="bg-white rounded-2xl p-8 shadow-lg card-hover">
 <div className="flex items-center gap-3 mb-6">
 <div className="w-12 h-12 bg-gradient-green rounded-xl flex items-center justify-center">
 <FaEye className="text-white text-xl" />
 </div>
 <div>
 <span className="text-3xl">🌐</span>
 <h3 className="text-2xl font-bold text-gray-900 ml-2">OUR VISION</h3>
 </div>
 </div>
 
 <p className="text-lg text-gray-700 leading-relaxed mb-8">
 Empowering health through a digital, decentralised ecosystem to provide personalised, borderless, and inclusive care in Mauritius, that people trust with their lives.
 </p>

 {/* What We Do */}
 <div className="border-t border-gray-200 pt-6">
 <div className="flex items-center gap-3 mb-4">
 <div className="w-10 h-10 bg-gradient-purple rounded-lg flex items-center justify-center">
 <FaRocket className="text-white text-sm" />
 </div>
 <span className="text-3xl">💼</span>
 <h4 className="text-xl font-bold text-gray-900">What We Do</h4>
 </div>
 
 <div className="grid grid-cols-1 gap-3">
 <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
 <span className="w-2 h-2 bg-primary-blue rounded-full"></span>
 <span className="text-gray-700 font-medium">Healthcare services/Telehealth</span>
 </div>
 <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
 <span className="w-2 h-2 bg-secondary-green rounded-full"></span>
 <span className="text-gray-700 font-medium">Third-Party Administrator (TPA) services</span>
 </div>
 <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-lg">
 <span className="w-2 h-2 bg-primary-teal rounded-full"></span>
 <span className="text-gray-700 font-medium">Corporate health solutions</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </section>
 )
}

export default MissionVisionSection