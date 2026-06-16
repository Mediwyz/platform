'use client'

import type { IconType } from 'react-icons'

interface DashboardPageHeaderProps {
  /** Page title — the single H1 for the page (sits below the global app header). */
  title: string
  /** One-line context under the title. */
  description?: string
  /** Optional leading icon, shown in a tinted square. */
  icon?: IconType
  /** Right-aligned actions (primary CTA, filters). */
  actions?: React.ReactNode
  /** Optional back link rendered above the title. */
  back?: { label: string; onClick: () => void }
}

/**
 * The canonical per-page header for dashboard pages. Pages sit inside the global
 * DashboardLayout (logo / user / notifications), so this is the ONLY page-level
 * title — never render a second hand-rolled <h1> header alongside it. Keeps the
 * title style, spacing and actions placement consistent across every page.
 */
export default function DashboardPageHeader({ title, description, icon: Icon, actions, back }: DashboardPageHeaderProps) {
  return (
    <div className="mb-6">
      {back && (
        <button
          onClick={back.onClick}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#0C6780] transition-colors mb-2"
        >
          <span aria-hidden>←</span> {back.label}
        </button>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          {Icon && (
            <span className="w-11 h-11 rounded-xl bg-[#0C6780]/10 text-[#0C6780] flex items-center justify-center flex-shrink-0">
              <Icon className="text-xl" />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-[#001E40] leading-tight">{title}</h1>
            {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex-shrink-0 flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
