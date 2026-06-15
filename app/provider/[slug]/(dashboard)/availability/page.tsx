'use client'

import { use } from 'react'
import { useDashboardUser } from '@/hooks/useDashboardUser'
import AvailabilityScheduler from '@/components/providers/AvailabilityScheduler'
import { FaCalendarAlt } from 'react-icons/fa'

export default function AvailabilityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: _slug } = use(params)
  const user = useDashboardUser()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#0C6780]/10 flex items-center justify-center">
          <FaCalendarAlt className="text-[#0C6780]" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[#001E40]">My Availability</h1>
          <p className="text-sm text-gray-500">
            Define when patients can book appointments with you.
          </p>
        </div>
      </div>

      {/* Scheduler - shown only once the user ID is loaded */}
      {user?.id ? (
        <AvailabilityScheduler providerId={user.id} />
      ) : (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}
    </div>
  )
}
