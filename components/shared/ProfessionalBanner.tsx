import type { ProfessionalBannerProps } from '@/types'

const ProfessionalBanner: React.FC<ProfessionalBannerProps> = ({
 title,
 description,
 primaryButton = "Get Started",
 secondaryButton,
 onPrimaryClick,
 onSecondaryClick
}) => {
 return (
 <section className="bg-gradient-main text-white py-16 my-16 rounded-3xl">
 <div className="container mx-auto px-8 text-center">
 <h2 className="text-3xl lg:text-4xl font-bold mb-4">
 {title}
 </h2>
 <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
 {description}
 </p>
 <div className="flex flex-col sm:flex-row gap-4 justify-center">
 <button 
 onClick={onPrimaryClick}
 className="bg-surface text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-subtle transition"
 >
 {primaryButton}
 </button>
 {secondaryButton && (
 <button 
 onClick={onSecondaryClick}
 className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-surface hover:text-primary-blue transition"
 >
 {secondaryButton}
 </button>
 )}
 </div>
 </div>
 </section>
 )
}

export default ProfessionalBanner