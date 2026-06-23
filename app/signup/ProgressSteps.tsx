import { FaCheck } from 'react-icons/fa'
import { steps } from './constants'

interface ProgressStepsProps {
 currentStep: number;
}

export default function ProgressSteps({ currentStep }: ProgressStepsProps) {
 return (
 <div className="bg-surface rounded-xl sm:rounded-2xl p-2 sm:p-6 shadow-lg mb-4 sm:mb-8 w-full max-w-full overflow-hidden">
 {/* Mobile: compact dot stepper with current step label */}
 <div className="sm:hidden flex items-center justify-center gap-3 py-1">
 <div className="flex items-center gap-1.5">
 {steps.map((step) => (
 <div
 key={step.number}
 className={`rounded-full transition-all ${
 currentStep > step.number
 ? 'w-2 h-2 bg-green-500'
 : currentStep === step.number
 ? 'w-5 h-2 bg-blue-600'
 : 'w-2 h-2 bg-gray-300'
 }`}
 />
 ))}
 </div>
 <span className="text-xs font-semibold text-blue-600">
 {steps.find(s => s.number === currentStep)?.title}
 </span>
 <span className="text-[10px] text-faint">
 {currentStep}/{steps.length}
 </span>
 </div>

 {/* Desktop: full stepper with icons and labels */}
 <div className="hidden sm:flex items-center justify-between w-full">
 {steps.map((step, index) => (
 <div key={step.number} className="flex items-center flex-1 last:flex-none">
 <div className="flex flex-col items-center">
 <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base ${
 currentStep > step.number ? "bg-green-500 text-white" :
 currentStep === step.number ? "bg-blue-600 text-white" :
 "bg-line text-soft"
 }`}>
 {currentStep > step.number ? <FaCheck /> : <step.icon />}
 </div>
 <span className={`text-sm mt-2 font-medium text-center leading-tight ${
 currentStep >= step.number ? "text-blue-600" : "text-soft"
 }`}>
 {step.title}
 </span>
 </div>
 {index < steps.length - 1 && (
 <div className={`flex-1 h-1 mx-4 min-w-[20px] ${
 currentStep > step.number ? "bg-green-500" : "bg-line"
 }`} />
 )}
 </div>
 ))}
 </div>
 </div>
 )
}
