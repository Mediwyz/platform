'use client'

import { use } from 'react'
import { useDashboardUser } from '@/hooks/useDashboardUser'
import AvailabilityScheduler from '@/components/providers/AvailabilityScheduler'
import { FaCalendarAlt } from 'react-icons/fa'
import DashboardPageHeader from '@/components/shared/DashboardPageHeader'

export default function AvailabilityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: _slug } = use(params)
  const user = useDashboardUser()

  return (
    <div className="max-w-3xl mx-auto">
      <DashboardPageHeader
        icon={FaCalendarAlt}
        title="My Availability"
        description="Define when patients can book appointments with you."
      />

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
