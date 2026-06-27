'use client'

import { useParams } from 'next/navigation'
import OrgBookingFlow from '@/components/organizations/OrgBookingFlow'

/** Public patient booking page for an organisation: pick a service, see the
 *  available providers in the org, and book a time slot. */
export default function OrganizationBookPage() {
  const params = useParams()
  const id = params.id as string
  return (
    <div className="min-h-screen bg-subtle">
      <OrgBookingFlow orgId={id} />
    </div>
  )
}
