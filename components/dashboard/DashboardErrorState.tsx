'use client'

import Link from 'next/link'

interface DashboardErrorStateProps {
 /** The error message to display. Falls back to a generic message when omitted. */
 message?: string | null
 /** URL the user is sent to when they click the primary action. Defaults to "/login". */
 actionHref?: string
 /** Label for the primary action button. Defaults to "Return to Login". */
 actionLabel?: string
 /** Optional callback for a "Retry" button. When provided a retry button is shown. */
 onRetry?: () => void
}

const DashboardErrorState: React.FC<DashboardErrorStateProps> = ({
 message,
 actionHref = '/login',
 actionLabel = 'Return to Login',
 onRetry,
}) => {
 return (
 <div className="min-h-screen flex items-center justify-center">
 <div className="text-center bg-surface rounded-2xl p-8 shadow-xl max-w-md w-full mx-4">
 {/* Error icon */}
 <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-red-100 mb-4">
 <svg
 className="w-8 h-8 text-red-500"
 fill="none"
 stroke="currentColor"
 strokeWidth={2}
 viewBox="0 0 24 24"
 aria-hidden="true"
 >
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
 />
 </svg>
 </div>

 <p className="text-red-600 mb-6 font-medium">
 {message || 'Something went wrong. Please try again.'}
 </p>

 <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
 {onRetry && (
 <button
 onClick={onRetry}
 className="w-full sm:w-auto text-white px-8 py-3 rounded-lg font-semibold transition-all"
 >
 Retry
 </button>
 )}

 <Link
 href={actionHref}
 className="w-full sm:w-auto inline-block text-white px-8 py-3 rounded-lg font-semibold transition-all text-center"
 >
 {actionLabel}
 </Link>
 </div>
 </div>
 </div>
 )
}

export default DashboardErrorState
