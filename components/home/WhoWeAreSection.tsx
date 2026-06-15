import { FaHeart, FaUsers, FaLightbulb, FaHandshake } from 'react-icons/fa'

const WhoWeAreSection: React.FC = () => {
 const values = [
 {
 icon: FaHeart,
 title: 'Personal Care',
 description: 'Healthcare is personal and unique to each individual',
 color: 'text-red-500',
 bgColor: 'bg-red-50'
 },
 {
 icon: FaUsers,
 title: 'Community Focus',
 description: 'Born from a desire to support the Mauritian community',
 color: 'text-blue-500',
 bgColor: 'bg-blue-50'
 },
 {
 icon: FaLightbulb,
 title: 'Innovation',
 description: 'Constantly developing innovative solutions to bridge healthcare gaps',
 color: 'text-yellow-500',
 bgColor: 'bg-yellow-50'
 },
 {
 icon: FaHandshake,
 title: 'Commitment',
 description: 'Dedicated to serve and connect each person with the care they need',
 color: 'text-green-500',
 bgColor: 'bg-green-50'
 }
 ]

 return (
 <section className="py-16 bg-white">
 <div className="container mx-auto px-4">

 <div className="text-center mb-12">
 <div className="flex items-center justify-center gap-2 mb-4">
 <span className="text-4xl">🧬</span>
 <h2 className="text-4xl font-bold text-gray-900">WHO WE ARE</h2>
 </div>
 <h3 className="text-2xl text-primary-blue font-semibold mb-6">
 Healthcare should be simple, accessible, and efficient for everyone.
 </h3>
 </div>

 <div className="grid lg:grid-cols-2 gap-12 items-center">
 <div>
 <div className="space-y-6">
 <p className="text-lg text-gray-700 leading-relaxed">
 MediWyz was born from a desire to support the Mauritian community and provide easy access to healthcare. We believe healthcare is personal and unique to each individual. At the core of our work is the commitment to serve and connect each person with the care they need to stay healthy and well.
 </p>
 
 <p className="text-gray-600 leading-relaxed">
 Since the launch of MediWyz, we&apos;ve been disrupting the healthcare industry by developing innovative solutions to bridge gaps in the healthcare ecosystem.
 </p>
 
 <p className="text-gray-600 leading-relaxed">
 To bring the best services to our users, we are constantly innovating. There is no typical day at MediWyz - and that&apos;s part of the fun! We are looking for driven individuals excited by what the future of healthcare could look like.
 </p>
 </div>

 <div className="mt-8 p-6 bg-gradient-main rounded-2xl text-white">
 <h4 className="text-xl font-bold mb-2">Be part of MediWyz today.</h4>
 <p className="text-white/90 mb-4">
 Join our mission to transform healthcare in Mauritius and beyond.
 </p>
 <div className="flex flex-col sm:flex-row gap-3">
 <button className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition" >
 Join Our Team
 </button>
 <button className="border-2 border-white text-white px-6 py-3 rounded-xl font-semibold hover:bg-white hover:text-primary-blue transition">
 Partner With Us
 </button>
 </div>
 </div>
 </div>

 <div>
 <h4 className="text-2xl font-bold text-gray-900 mb-8 text-center">Our Core Values</h4>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
 {values.map((value, index) => (
 <div key={index} className={`${value.bgColor} rounded-2xl p-6 text-center card-hover`}>
 <div className={`w-16 h-16 ${value.bgColor} border-2 border-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
 <value.icon className={`${value.color} text-2xl`} />
 </div>
 <h5 className="text-lg font-semibold text-gray-900 mb-2">{value.title}</h5>
 <p className="text-gray-600 text-sm leading-relaxed">{value.description}</p>
 </div>
 ))}
 </div>
 </div>
 </div>

 <div className="mt-16 rounded-2xl p-8">
 <div className="text-center">
 <h4 className="text-2xl font-bold text-gray-900 mb-4">
 Disrupting Healthcare Through Innovation
 </h4>
 <p className="text-gray-600 max-w-3xl mx-auto mb-6">
 Since our launch, we&apos;ve been at the forefront of healthcare innovation, developing cutting-edge solutions that bridge gaps in the healthcare ecosystem and make quality care accessible to all Mauritians.
 </p>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="text-center">
 <div className="text-3xl font-bold text-primary-blue">2020</div>
 <div className="text-gray-600">Founded</div>
 </div>
 <div className="text-center">
 <div className="text-3xl font-bold text-secondary-green">500+</div>
 <div className="text-gray-600">Healthcare Professionals</div>
 </div>
 <div className="text-center">
 <div className="text-3xl font-bold text-primary-teal">50,000+</div>
 <div className="text-gray-600">Lives Impacted</div>
 </div>
 </div>
 </div>
 </div>


 </div>
 </section>
 )
}

export default WhoWeAreSection