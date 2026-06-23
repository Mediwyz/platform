'use client'

import { FaFilePdf } from 'react-icons/fa'

/**
 * Opens the print-ready HTML in a new tab. User presses browser "Save as
 * PDF" from the floating "Print" button on the rendered page. Keeps the
 * server tiny - no Chromium or PDF library required.
 */
export default function PrescriptionPdfButton({
  userId,
  prescriptionId,
  label = 'Download PDF',
  size = 'md',
}: {
  userId: string
  prescriptionId: string
  label?: string
  size?: 'sm' | 'md'
}) {
  const href = `/api/users/${userId}/prescriptions/${prescriptionId}/pdf`
  const sizeClass = size === 'sm'
    ? 'px-2.5 py-1 text-[11px]'
    : 'px-3 py-1.5 text-xs'

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 ${sizeClass} font-semibold bg-surface border border-line text-[#0C6780] rounded-lg hover:bg-subtle transition-colors`}
    >
      <FaFilePdf /> {label}
    </a>
  )
}
