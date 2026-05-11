'use client'

import Image from 'next/image'

interface DashboardLoadingStateProps {
 message?: string
}

const DashboardLoadingState: React.FC<DashboardLoadingStateProps> = ({
 message = 'Loading your dashboard...',
}) => {
 return (
 <div className="min-h-screen flex items-center justify-center">
 <div className="text-center bg-white rounded-2xl p-8 shadow-xl">
 <Image src="/images/logo-icon.png" alt="MediWyz" width={64} height={64} className="w-16 h-16 mx-auto mb-4" />
 <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-brand-teal mx-auto" />
 <p className="mt-4 text-gray-600 font-medium">{message}</p>

 {/* Skeleton preview of the dashboard structure */}
 <div className="mt-8 space-y-3 w-64 mx-auto">
 <div className="h-3 bg-gray-200 rounded-full animate-pulse" />
 <div className="h-3 bg-gray-200 rounded-full animate-pulse w-5/6" />
 <div className="h-3 bg-gray-200 rounded-full animate-pulse w-4/6" />
 </div>
 </div>
 </div>
 )
}

export default DashboardLoadingState
