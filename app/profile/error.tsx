'use client'

import Link from 'next/link'

export default function ProfileError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#001E40]">
      <div className="text-center max-w-md px-6">
        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-[#9AE1FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-white mb-2">Profile unavailable</h1>
        <p className="text-sm text-white/60 mb-8 leading-relaxed">
          {error.message || "We couldn't load this profile. The provider may have moved or the link may be outdated."}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#0C6780] text-white rounded-xl text-sm font-semibold hover:bg-[#0a5568] transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/search/providers"
            className="w-full sm:w-auto px-5 py-2.5 bg-white/10 text-white rounded-xl text-sm font-semibold hover:bg-white/20 transition-colors text-center"
          >
            Browse Providers
          </Link>
        </div>
      </div>
    </div>
  )
}
