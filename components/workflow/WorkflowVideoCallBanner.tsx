'use client'

import { FiVideo, FiPhone } from 'react-icons/fi'
import Link from 'next/link'

interface WorkflowVideoCallBannerProps {
  videoCallId: string | null | undefined
  currentStatus: string
  /** 'video' renders the navy video banner; 'audio' renders a cyan audio banner.
   *  Derived from the booking's serviceMode - the engine fires the correct room
   *  type automatically; no flag needed. */
  callMode?: 'video' | 'audio'
  /** Pass true when the workflow is completed or cancelled - banner is hidden. */
  isTerminal?: boolean
}

/** Shows once the engine has fired a video or audio room (videoCallId present)
 *  and the workflow is still live. The presence of a room id - not any step flag - 
 *  is the canonical signal. */
export default function WorkflowVideoCallBanner({
  videoCallId, callMode = 'video', isTerminal,
}: WorkflowVideoCallBannerProps) {
  if (!videoCallId || isTerminal) return null

  if (callMode === 'audio') {
    return (
      <div className="bg-brand-teal text-white rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <FiPhone className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-sm">Audio Call Available</p>
            <p className="text-brand-sky text-xs">The audio room is ready. Join now.</p>
          </div>
        </div>
        <Link
          href={`/video/${videoCallId}`}
          className="bg-white text-brand-teal px-4 py-2 rounded-lg text-sm font-semibold hover:bg-sky-50 transition-colors"
        >
          Join Call
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-brand-navy text-white rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-white/20 p-2 rounded-lg">
          <FiVideo className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold text-sm">Video Call Available</p>
          <p className="text-brand-sky text-xs">The video room is ready. Join now.</p>
        </div>
      </div>
      <Link
        href={`/video/${videoCallId}`}
        className="bg-white text-brand-navy px-4 py-2 rounded-lg text-sm font-semibold hover:bg-sky-50 transition-colors"
      >
        Join Call
      </Link>
    </div>
  )
}
