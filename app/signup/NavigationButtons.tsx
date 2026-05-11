import { FormEvent } from 'react'
import { FaArrowLeft, FaArrowRight, FaCheck } from 'react-icons/fa'

interface NavigationButtonsProps {
 currentStep: number;
 isSubmitting: boolean;
 canProceed: boolean;
 onPrevious: () => void;
 onNext: () => void;
 onSubmit: (e: FormEvent) => void;
}

export default function NavigationButtons({
 currentStep,
 isSubmitting,
 canProceed,
 onPrevious,
 onNext,
}: NavigationButtonsProps) {
 return (
 <div className="flex justify-between mt-8 pt-6 border-t">
 {currentStep > 1 && (
 <button
 onClick={onPrevious}
 className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
 >
 <FaArrowLeft />
 Back
 </button>
 )}

 {currentStep === 1 ? (
 <button
 onClick={onNext}
 disabled={!canProceed}
 className="flex items-center gap-2 bg-[#0C6780] hover:bg-[#0a5568] text-white px-8 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed ml-auto transition-colors"
 >
 Continue
 <FaArrowRight />
 </button>
 ) : (
 <button
 onClick={onNext}
 disabled={isSubmitting || !canProceed}
 className="flex items-center gap-2 bg-[#0C6780] hover:bg-[#0a5568] text-white px-8 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed ml-auto transition-colors"
 >
 {isSubmitting ? (
 <>
 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
 Creating Account...
 </>
 ) : (
 <>
 Create Account
 <FaCheck />
 </>
 )}
 </button>
 )}
 </div>
 )
}
