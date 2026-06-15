'use client'

import Link from 'next/link'
import { FaExclamationTriangle, FaArrowRight } from 'react-icons/fa'

/**
 * Shown inside the legacy `/insurance/(dashboard)` and `/corporate/(dashboard)`
 * dashboards. Those user types (INSURANCE_REP, CORPORATE_ADMIN) are capabilities
 * now, not roles. This banner points seeded users to the new unified pages.
 */
export default function LegacyMigrationBanner({
  feature,
  newHref,
  newLabel,
}: {
  feature: 'insurance' | 'corporate'
  newHref: string
  newLabel: string
}) {
  const title = feature === 'insurance'
    ? 'Insurance has moved'
    : 'Company management has moved'
  const subtitle = feature === 'insurance'
    ? 'Insurance-company owners now manage members + contributions from "My Company". Anyone can create an insurance scheme - it is no longer a separate role.'
    : 'Company admins manage everything from "My Company" on any dashboard. Any user can create a company - it is no longer a separate role.'

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-100 flex-shrink-0">
          <FaExclamationTriangle className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-amber-900">{title}</h3>
          <p className="text-sm text-amber-800 mt-0.5">{subtitle}</p>
          <Link
            href={newHref}
            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-colors"
          >
            {newLabel} <FaArrowRight className="text-[10px]" />
          </Link>
        </div>
      </div>
    </div>
  )
}
