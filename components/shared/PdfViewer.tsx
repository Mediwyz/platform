'use client'

import { useState } from 'react'
import { FaTimes, FaDownload, FaExpand, FaCompress, FaExternalLinkAlt } from 'react-icons/fa'

interface PdfViewerProps {
 /** The URL of the PDF file to display */
 url: string
 /** Optional title shown in the viewer header */
 title?: string
 /** Called when the user clicks close/back */
 onClose: () => void
}

/**
 * PDF Viewer component that renders a PDF in an iframe with controls.
 * Mobile-responsive: full-screen on small viewports.
 */
const PdfViewer: React.FC<PdfViewerProps> = ({ url, title, onClose }) => {
 const [isFullscreen, setIsFullscreen] = useState(false)
 const [loading, setLoading] = useState(true)

 const handleDownload = () => {
 const a = document.createElement('a')
 a.href = url
 a.download = title || 'document.pdf'
 a.target = '_blank'
 a.rel = 'noopener noreferrer'
 document.body.appendChild(a)
 a.click()
 document.body.removeChild(a)
 }

 const toggleFullscreen = () => {
 setIsFullscreen(!isFullscreen)
 }

 return (
 <div
 className={`fixed inset-0 z-[60] bg-black/60 flex items-center justify-center ${
 isFullscreen ? 'p-0' : 'p-2 sm:p-4 md:p-8'
 }`}
 >
 <div
 className={`bg-surface rounded-xl shadow-2xl flex flex-col overflow-hidden ${
 isFullscreen
 ? 'w-full h-full rounded-none'
 : 'w-full h-full sm:max-w-4xl sm:max-h-[90vh]'
 }`}
 >
 {/* Header bar */}
 <div className="flex items-center justify-between px-4 py-3 bg-subtle border-b border-line flex-shrink-0">
 <div className="flex items-center gap-3 min-w-0">
 <button
 onClick={onClose}
 className="p-2 text-soft hover:text-soft hover:bg-line rounded-lg transition-colors"
 aria-label="Close viewer"
 >
 <FaTimes className="text-base" />
 </button>
 <h3 className="text-sm font-semibold text-fg truncate">
 {title || 'PDF Viewer'}
 </h3>
 </div>

 <div className="flex items-center gap-1.5">
 {/* Open in new tab */}
 <a
 href={url}
 target="_blank"
 rel="noopener noreferrer"
 className="p-2 text-soft hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
 aria-label="Open in new tab"
 title="Open in new tab"
 >
 <FaExternalLinkAlt className="text-sm" />
 </a>

 {/* Download */}
 <button
 onClick={handleDownload}
 className="p-2 text-soft hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
 aria-label="Download PDF"
 title="Download"
 >
 <FaDownload className="text-sm" />
 </button>

 {/* Fullscreen toggle (hidden on mobile where it's always full) */}
 <button
 onClick={toggleFullscreen}
 className="hidden sm:block p-2 text-soft hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
 aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
 title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
 >
 {isFullscreen ? (
 <FaCompress className="text-sm" />
 ) : (
 <FaExpand className="text-sm" />
 )}
 </button>
 </div>
 </div>

 {/* PDF content */}
 <div className="flex-1 relative bg-subtle">
 {loading && (
 <div className="absolute inset-0 flex items-center justify-center bg-subtle z-10">
 <div className="text-center">
 <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
 <p className="text-sm text-soft">Loading document...</p>
 </div>
 </div>
 )}
 <iframe
 src={url}
 className="w-full h-full border-0"
 title={title || 'PDF Document'}
 onLoad={() => setLoading(false)}
 />
 </div>
 </div>
 </div>
 )
}

export default PdfViewer
