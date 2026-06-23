'use client'

import Link from 'next/link'

export default function CorporateDashboardError({
 error,
 reset,
}: {
 error: Error & { digest?: string }
 reset: () => void
}) {
 return (
 <div className="flex items-center justify-center min-h-[60vh]">
 <div className="text-center max-w-lg px-6">
 <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
 <svg
 className="w-10 h-10 text-red-600"
 fill="none"
 viewBox="0 0 24 24"
 stroke="currentColor"
 >
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 strokeWidth={1.5}
 d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.27 16.5c-.77.833.192 2.5 1.732 2.5z"
 />
 </svg>
 </div>

 <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full mb-3">
 Dashboard Error
 </span>

 <h2 className="text-2xl font-bold text-fg mb-2">
 Error Loading Corporate Dashboard
 </h2>
 <p className="text-soft mb-6 text-sm leading-relaxed">
 {error.message || 'An unexpected error occurred while loading this page.'}
 </p>

 <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
 <button
 onClick={reset}
 className="w-full sm:w-auto px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
 >
 Try Again
 </button>
 <button
 onClick={() => window.history.back()}
 className="w-full sm:w-auto px-5 py-2 border border-line text-soft rounded-lg hover:bg-subtle transition-colors font-medium text-sm"
 >
 Go Back
 </button>
 <Link
 href="/corporate"
 className="w-full sm:w-auto px-5 py-2 border border-line text-soft rounded-lg hover:bg-subtle transition-colors font-medium text-sm text-center"
 >
 Dashboard Home
 </Link>
 </div>
 </div>
 </div>
 )
}
