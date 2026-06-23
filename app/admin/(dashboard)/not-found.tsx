import Link from 'next/link'

export default function AdminDashboardNotFound() {
 return (
 <div className="flex items-center justify-center min-h-[60vh]">
 <div className="text-center max-w-lg px-6">
 <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-5">
 <svg
 className="w-10 h-10 text-blue-600"
 fill="none"
 viewBox="0 0 24 24"
 stroke="currentColor"
 >
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 strokeWidth={1.5}
 d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
 />
 </svg>
 </div>

 <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full mb-3">
 404
 </span>

 <h2 className="text-2xl font-bold text-fg mb-2">Page Not Found</h2>
 <p className="text-soft mb-6 text-sm leading-relaxed">
 This admin dashboard page does not exist or has been moved.
 </p>

 <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
 <Link
 href="/admin"
 className="w-full sm:w-auto px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm text-center"
 >
 Dashboard Home
 </Link>
 <Link
 href="/"
 className="w-full sm:w-auto px-5 py-2 border border-line text-soft rounded-lg hover:bg-subtle transition-colors font-medium text-sm text-center"
 >
 Go Home
 </Link>
 </div>
 </div>
 </div>
 )
}
