import Link from 'next/link'

export default function SuperAdminNotFound() {
 return (
 <div className="min-h-screen flex items-center justify-center ">
 <div className="text-center max-w-lg px-6">
 <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
 <svg
 className="w-12 h-12 text-blue-600"
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

 <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full mb-4">
 404
 </span>

 <h1 className="text-3xl font-bold text-fg mb-3">Super Admin Page Not Found</h1>
 <p className="text-soft mb-8 leading-relaxed">
 The super admin page you are looking for does not exist or has been moved.
 </p>

 <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
 <Link
 href="/regional"
 className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
 >
 Go to Dashboard
 </Link>
 <Link
 href="/"
 className="w-full sm:w-auto px-6 py-2.5 border-2 border-line text-soft rounded-lg hover:bg-subtle transition-colors font-medium text-center"
 >
 Go Home
 </Link>
 </div>
 </div>
 </div>
 )
}
