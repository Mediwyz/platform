'use client'

import Link from 'next/link'

export default function AdminError({
 error,
 reset,
}: {
 error: Error & { digest?: string }
 reset: () => void
}) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-surface">
 <div className="text-center max-w-lg px-6">
 <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
 <svg
 className="w-12 h-12 text-red-600"
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

 <span className="inline-block px-4 py-1.5 bg-red-100 text-red-700 text-sm font-semibold rounded-full mb-4">
 Error
 </span>

 <h1 className="text-3xl font-bold text-fg mb-3">Error Loading Admin Page</h1>
 <p className="text-soft mb-8 leading-relaxed">
 {error.message || 'An unexpected error occurred. Please try again.'}
 </p>

 <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
 <button
 onClick={reset}
 className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
 >
 Try Again
 </button>
 <button
 onClick={() => window.history.back()}
 className="w-full sm:w-auto px-6 py-2.5 border-2 border-line text-soft rounded-lg hover:bg-subtle transition-colors font-medium"
 >
 Go Back
 </button>
 <Link
 href="/admin"
 className="w-full sm:w-auto px-6 py-2.5 border-2 border-line text-soft rounded-lg hover:bg-subtle transition-colors font-medium text-center"
 >
 Dashboard
 </Link>
 </div>
 </div>
 </div>
 )
}
