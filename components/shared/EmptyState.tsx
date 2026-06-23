import type { EmptyStateProps } from '@/types'

const EmptyState: React.FC<EmptyStateProps> = ({
 icon: Icon,
 title,
 description,
 buttonText,
 onButtonClick
}) => {
 return (
 <div className="text-center py-16">
 <div className="text-faint text-6xl mb-6">
 <Icon className="mx-auto" />
 </div>
 <h3 className="text-2xl font-semibold text-soft mb-4">{title}</h3>
 <p className="text-soft mb-8 max-w-md mx-auto">{description}</p>
 {buttonText && onButtonClick && (
 <button 
 onClick={onButtonClick}
 className="btn-gradient px-6 py-3"
 >
 {buttonText}
 </button>
 )}
 </div>
 )
}

export default EmptyState