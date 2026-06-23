import { FaUser, FaCalendarAlt, FaInfoCircle, FaWallet, FaTicketAlt, FaCheck } from 'react-icons/fa'

interface BookingStepsProps {
 currentStep: number
}

const steps = [
 { number: 1, title: "Doctor Details", icon: FaUser },
 { number: 2, title: "Schedule", icon: FaCalendarAlt },
 { number: 3, title: "Consultation Info", icon: FaInfoCircle },
 { number: 4, title: "Payment", icon: FaWallet },
 { number: 5, title: "Confirmation", icon: FaTicketAlt }
]

export default function BookingSteps({ currentStep }: BookingStepsProps) {
 return (
 <div className="bg-surface border-b">
 <div className="container mx-auto px-4 py-6">
 <div className="flex items-center justify-between max-w-4xl mx-auto">
 {steps.map((step, index) => (
 <div key={step.number} className="flex items-center">
 <div className="flex flex-col items-center">
 <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold ${
 currentStep > step.number ? "bg-green-500 text-white" :
 currentStep === step.number ? "bg-blue-600 text-white" :
 "bg-line text-soft"
 }`}>
 {currentStep > step.number ? <FaCheck /> : <step.icon />}
 </div>
 <span className={`text-xs mt-2 text-center ${
 currentStep >= step.number ? "text-blue-600 font-medium" : "text-soft"
 }`}>
 
 {step.title}
 </span>
 </div>
 {index < steps.length - 1 && (
 <div className={`w-16 h-1 mx-2 ${
 currentStep > step.number ? "bg-green-500" : "bg-line"
 }`} />
 )}
 </div>
 ))}
 </div>
 </div>
 </div>
 )
}