import { FaMapMarkerAlt, FaGlobe, FaMobile } from 'react-icons/fa'

const AboutSection: React.FC = () => {
 return (
 <section className="py-16 bg-white">
 <div className="container mx-auto px-4">
 {/* Header */}
 <div className="text-center mb-12">
 <div className="flex items-center justify-center gap-2 mb-4">
 <span className="text-4xl">🩺</span>
 <h2 className="text-4xl font-bold text-gray-900">About Us – MediWyz</h2>
 </div>
 <h3 className="text-2xl text-primary-blue font-semibold mb-6">
 Delivering healthcare via a &quot;Healthcare, Anywhere&quot; model
 </h3>
 </div>

 {/* Main Content */}
 <div className="grid lg:grid-cols-2 gap-12 items-center">
 {/* Content */}
 <div>
 <p className="text-lg text-gray-700 leading-relaxed mb-6">
 At MediWyz, we believe that quality healthcare should be accessible, trusted, and available wherever you are. Our innovative &quot;Healthcare, Anywhere&quot; model breaks traditional boundaries by offering a digital-first, omni-channel ecosystem that puts patients at the center of care.
 </p>
 
 <p className="text-gray-600 mb-8">
 Whether you&apos;re at home, at work, or on the move, MediWyz ensures you can connect with certified professionals and receive the care you need - without the hassle of hospital queues or geographic limitations.
 </p>

 {/* Key Features */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
 <FaMapMarkerAlt className="text-primary-blue text-xl" />
 <span className="text-sm font-medium text-gray-700">Locally Rooted</span>
 </div>
 <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
 <FaGlobe className="text-secondary-green text-xl" />
 <span className="text-sm font-medium text-gray-700">Globally Inspired</span>
 </div>
 <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-lg">
 <FaMobile className="text-primary-teal text-xl" />
 <span className="text-sm font-medium text-gray-700">Mobile-First</span>
 </div>
 </div>
 </div>

 {/* Services List */}
 <div className="bg-gray-50 rounded-2xl p-8">
 <h4 className="text-xl font-semibold text-gray-900 mb-6">We offer:</h4>
 <div className="space-y-4">
 <div className="flex items-start gap-3">
 <span className="w-2 h-2 bg-primary-blue rounded-full mt-2 flex-shrink-0"></span>
 <div>
 <h5 className="font-semibold text-gray-900">Primary Care</h5>
 <p className="text-gray-600 text-sm">On-demand consultations with trusted doctors</p>
 </div>
 </div>
 <div className="flex items-start gap-3">
 <span className="w-2 h-2 bg-secondary-green rounded-full mt-2 flex-shrink-0"></span>
 <div>
 <h5 className="font-semibold text-gray-900">Telehealth</h5>
 <p className="text-gray-600 text-sm">Real-time video consults and chat-based follow-ups</p>
 </div>
 </div>
 <div className="flex items-start gap-3">
 <span className="w-2 h-2 bg-primary-teal rounded-full mt-2 flex-shrink-0"></span>
 <div>
 <h5 className="font-semibold text-gray-900">Diagnostics</h5>
 <p className="text-gray-600 text-sm">Book lab tests and receive results digitally</p>
 </div>
 </div>
 <div className="flex items-start gap-3">
 <span className="w-2 h-2 bg-primary-blue rounded-full mt-2 flex-shrink-0"></span>
 <div>
 <h5 className="font-semibold text-gray-900">Medicine Delivery</h5>
 <p className="text-gray-600 text-sm">Prescriptions delivered to your doorstep</p>
 </div>
 </div>
 <div className="flex items-start gap-3">
 <span className="w-2 h-2 bg-secondary-green rounded-full mt-2 flex-shrink-0"></span>
 <div>
 <h5 className="font-semibold text-gray-900">Wellness Services</h5>
 <p className="text-gray-600 text-sm">Preventive care and corporate health packages</p>
 </div>
 </div>
 <div className="flex items-start gap-3">
 <span className="w-2 h-2 bg-primary-teal rounded-full mt-2 flex-shrink-0"></span>
 <div>
 <h5 className="font-semibold text-gray-900">Specialist Access</h5>
 <p className="text-gray-600 text-sm">Seamless connection to top specialists across Mauritius</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </section>
 )
}

export default AboutSection