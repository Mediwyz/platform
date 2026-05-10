'use client'

import Link from 'next/link'

export default function DoctorError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#001E40]">
      <div className="text-center max-w-md px-6">
        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-[#9AE1FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.27 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-white mb-2">Something went wrong</h1>
        <p className="text-sm text-white/60 mb-8 leading-relaxed">
          {error.message || 'An unexpected error occurred. Please try again or contact support.'}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#0C6780] text-white rounded-xl text-sm font-semibold hover:bg-[#0a5568] transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/doctor"
            className="w-full sm:w-auto px-5 py-2.5 bg-white/10 text-white rounded-xl text-sm font-semibold hover:bg-white/20 transition-colors text-center"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
